import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { TangoEvent, EventFilterState, EventType, EventStatus } from '../types';
import { INITIAL_EVENTS, CRAWLER_FEED_CANDIDATES } from '../initialData';
import { isDuplicateEvent } from '../utils/dedup';

interface EventsContextType {
  events: TangoEvent[];
  loading: boolean;
  filters: EventFilterState;
  setFilters: React.Dispatch<React.SetStateAction<EventFilterState>>;
  filteredEvents: TangoEvent[];
  submitEvent: (eventData: Omit<TangoEvent, 'id' | 'created_at' | 'status' | 'source_type'>) => Promise<{ success: boolean; id?: string; duplicateWarning?: string; error?: string }>;
  addEventDirect: (eventData: Omit<TangoEvent, 'id' | 'created_at'>) => Promise<{ success: boolean; id?: string; error?: string }>;
  approveEvent: (id: string) => Promise<void>;
  rejectEvent: (id: string) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  runWeeklyCrawler: () => Promise<{ addedCount: number; duplicateCount: number; duplicatesDetails: string[] }>;
  resetFilters: () => void;
  uniqueCities: string[];
  uniqueStates: string[];
  uniqueCountries: string[];
  stats: {
    totalApproved: number;
    totalPending: number;
    totalRejected: number;
    byType: Record<EventType, number>;
  };
}

const defaultFilters: EventFilterState = {
  search: '',
  types: [],
  country_code: 'ALL',
  city: '',
  state: '',
  date_quick_range: '6m', // Specification: 기본 범위 [오늘 ~ 오늘+6개월]
  start_date: '',
  end_date: '',
  price_filter: 'all',
};

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<TangoEvent[]>(() => {
    const cached = localStorage.getItem('everytango_events');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as TangoEvent[];
        const existingIds = new Set(parsed.map(e => e.id));
        const merged = [...parsed];
        INITIAL_EVENTS.forEach(ev => {
          if (!existingIds.has(ev.id)) {
            merged.push(ev);
          }
        });
        return merged;
      } catch (e) {
        return INITIAL_EVENTS;
      }
    }
    return INITIAL_EVENTS;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<EventFilterState>(defaultFilters);

  // Firestore sync with local fallback
  useEffect(() => {
    let unsub = () => {};
    try {
      const eventsCol = collection(db, 'events');
      unsub = onSnapshot(eventsCol, (snapshot) => {
        if (!snapshot.empty) {
          const list: TangoEvent[] = [];
          const existingIds = new Set<string>();
          snapshot.forEach((d) => {
            const data = { id: d.id, ...d.data() } as TangoEvent;
            list.push(data);
            existingIds.add(d.id);
          });

          // Sync any new curated milongas to Firestore and merge if not yet stored
          const mergedList = [...list];
          INITIAL_EVENTS.forEach(async (ev) => {
            if (!existingIds.has(ev.id)) {
              mergedList.push(ev);
              try {
                await setDoc(doc(db, 'events', ev.id), ev);
              } catch (e) {
                console.warn('Sync new event to firestore error:', e);
              }
            }
          });

          setEvents(mergedList);
          localStorage.setItem('everytango_events', JSON.stringify(mergedList));
        } else {
          // If remote empty, seed with initial curated events
          INITIAL_EVENTS.forEach(async (ev) => {
            try {
              await setDoc(doc(db, 'events', ev.id), ev);
            } catch (e) {
              console.warn('Seeding remote event error:', e);
            }
          });
          setEvents(INITIAL_EVENTS);
          localStorage.setItem('everytango_events', JSON.stringify(INITIAL_EVENTS));
        }
        setLoading(false);
      }, (err) => {
        console.warn('Firestore snapshot subscription fallback to local storage:', err);
        setLoading(false);
      });
    } catch (e) {
      console.warn('Init events sync err:', e);
      setLoading(false);
    }

    return () => unsub();
  }, []);

  // Compute unique filter dropdown values
  const uniqueCities = Array.from(new Set(events.map((e) => e.city).filter(Boolean))).sort();
  const uniqueStates = Array.from(new Set(events.map((e) => e.state).filter(Boolean) as string[])).sort();
  const uniqueCountries = Array.from(new Set(events.map((e) => e.country_code).filter(Boolean))).sort();

  // Reset filters
  const resetFilters = () => {
    setFilters({ ...defaultFilters });
  };

  // Filter application
  const filteredEvents = events.filter((ev) => {
    // Only approved events appear on public listing
    if (ev.status !== 'APPROVED') return false;

    // Search text filter (Event Name, auto-complete & fuzzy keyword)
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      const matchName = ev.event_name.toLowerCase().includes(q);
      const matchCity = ev.city.toLowerCase().includes(q);
      const matchNotes = ev.notes?.toLowerCase().includes(q);
      if (!matchName && !matchCity && !matchNotes) return false;
    }

    // Type filter
    if (filters.types.length > 0) {
      if (!filters.types.includes(ev.event_type)) return false;
    }

    // Country filter
    if (filters.country_code && filters.country_code !== 'ALL') {
      if (ev.country_code !== filters.country_code) return false;
    }

    // City filter
    if (filters.city) {
      if (!ev.city.toLowerCase().includes(filters.city.toLowerCase().trim())) return false;
    }

    // State filter
    if (filters.state) {
      if (!ev.state?.toLowerCase().includes(filters.state.toLowerCase().trim())) return false;
    }

    // Price filter (Free vs Paid)
    if (filters.price_filter === 'free') {
      const isFree = ev.is_free || ev.price.toLowerCase().includes('free') || ev.price === '0';
      if (!isFree) return false;
    } else if (filters.price_filter === 'paid') {
      const isFree = ev.is_free || ev.price.toLowerCase().includes('free') || ev.price === '0';
      if (isFree) return false;
    }

    // Date range filtering
    // Today's date reference
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Compute range based on quick range or custom
    if (filters.date_quick_range === '1m') {
      const target = new Date();
      target.setMonth(target.getMonth() + 1);
      const targetStr = target.toISOString().split('T')[0];
      if (ev.start_date < todayStr || ev.start_date > targetStr) return false;
    } else if (filters.date_quick_range === '3m') {
      const target = new Date();
      target.setMonth(target.getMonth() + 3);
      const targetStr = target.toISOString().split('T')[0];
      if (ev.start_date < todayStr || ev.start_date > targetStr) return false;
    } else if (filters.date_quick_range === '6m') {
      // Default: today to today+6 months
      const target = new Date();
      target.setMonth(target.getMonth() + 6);
      const targetStr = target.toISOString().split('T')[0];
      if (ev.start_date < todayStr || ev.start_date > targetStr) return false;
    } else if (filters.date_quick_range === 'custom') {
      if (filters.start_date && ev.start_date < filters.start_date) return false;
      if (filters.end_date && ev.end_date > filters.end_date) return false;
    }

    return true;
  });

  // Submit new event (Workflow: Saved as PENDING for admin review)
  const submitEvent = async (
    eventData: Omit<TangoEvent, 'id' | 'created_at' | 'status' | 'source_type'>
  ): Promise<{ success: boolean; id?: string; duplicateWarning?: string; error?: string }> => {
    try {
      // Deduplication check
      const dupCheck = isDuplicateEvent(eventData, events);

      const newId = 'evt_sub_' + Math.random().toString(36).substr(2, 9);
      const newEvent: TangoEvent = {
        ...eventData,
        id: newId,
        source_type: 'MANUAL',
        status: 'PENDING', // Requirement: Always saved as PENDING
        created_at: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'events', newId), newEvent);
      } catch (err) {
        console.warn('Saving to firestore err, using local:', err);
      }

      const updated = [newEvent, ...events];
      setEvents(updated);
      localStorage.setItem('everytango_events', JSON.stringify(updated));

      return {
        success: true,
        id: newId,
        duplicateWarning: dupCheck.isDup ? dupCheck.reason : undefined,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Submission failed' };
    }
  };

  const approveEvent = async (id: string) => {
    try {
      await updateDoc(doc(db, 'events', id), { status: 'APPROVED' });
    } catch (e) {
      console.warn('Update remote doc err:', e);
    }
    const updated = events.map((e) => (e.id === id ? { ...e, status: 'APPROVED' as EventStatus } : e));
    setEvents(updated);
    localStorage.setItem('everytango_events', JSON.stringify(updated));
  };

  const rejectEvent = async (id: string) => {
    try {
      await updateDoc(doc(db, 'events', id), { status: 'REJECTED' });
    } catch (e) {
      console.warn('Update remote doc err:', e);
    }
    const updated = events.map((e) => (e.id === id ? { ...e, status: 'REJECTED' as EventStatus } : e));
    setEvents(updated);
    localStorage.setItem('everytango_events', JSON.stringify(updated));
  };

  const deleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (e) {
      console.warn('Delete remote doc err:', e);
    }
    const updated = events.filter((e) => e.id !== id);
    setEvents(updated);
    localStorage.setItem('everytango_events', JSON.stringify(updated));
  };

  const addEventDirect = async (
    eventData: Omit<TangoEvent, 'id' | 'created_at'>
  ): Promise<{ success: boolean; id?: string; error?: string }> => {
    try {
      const newId = 'evt_' + Math.random().toString(36).substr(2, 9);
      const newEvent: TangoEvent = {
        ...eventData,
        id: newId,
        created_at: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'events', newId), newEvent);
      } catch (err) {
        console.warn('Saving direct event to firestore failed, saving locally:', err);
      }

      const updated = [newEvent, ...events];
      setEvents(updated);
      localStorage.setItem('everytango_events', JSON.stringify(updated));

      return { success: true, id: newId };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to add event' };
    }
  };

  // Run weekly crawler & automated deduplication routine
  const runWeeklyCrawler = async (): Promise<{ addedCount: number; duplicateCount: number; duplicatesDetails: string[] }> => {
    let addedCount = 0;
    let duplicateCount = 0;
    const duplicatesDetails: string[] = [];
    const newEventsToAdd: TangoEvent[] = [];

    // Evaluate each candidate in feed against existing events
    for (const candidate of CRAWLER_FEED_CANDIDATES) {
      const dupResult = isDuplicateEvent(candidate, [...events, ...newEventsToAdd]);
      if (dupResult.isDup) {
        duplicateCount++;
        duplicatesDetails.push(
          `[DUPLICATE REJECTED] "${candidate.event_name}" (${candidate.city}, ${candidate.start_date}) -> Reason: ${dupResult.reason}`
        );
      } else {
        addedCount++;
        const evWithId: TangoEvent = {
          ...candidate,
          id: 'crawler_' + Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString(),
        };
        newEventsToAdd.push(evWithId);
        try {
          await setDoc(doc(db, 'events', evWithId.id), evWithId);
        } catch (e) {
          console.warn('Failed to persist crawled event:', e);
        }
      }
    }

    if (newEventsToAdd.length > 0) {
      const merged = [...newEventsToAdd, ...events];
      setEvents(merged);
      localStorage.setItem('everytango_events', JSON.stringify(merged));
    }

    return { addedCount, duplicateCount, duplicatesDetails };
  };

  // Aggregate stats
  const stats = {
    totalApproved: events.filter((e) => e.status === 'APPROVED').length,
    totalPending: events.filter((e) => e.status === 'PENDING').length,
    totalRejected: events.filter((e) => e.status === 'REJECTED').length,
    byType: {
      FESTIVAL: events.filter((e) => e.status === 'APPROVED' && e.event_type === 'FESTIVAL').length,
      MARATHON: events.filter((e) => e.status === 'APPROVED' && e.event_type === 'MARATHON').length,
      ENCUENTRO: events.filter((e) => e.status === 'APPROVED' && e.event_type === 'ENCUENTRO').length,
      MILONGA: events.filter((e) => e.status === 'APPROVED' && e.event_type === 'MILONGA').length,
    },
  };

  return (
    <EventsContext.Provider
      value={{
        events,
        loading,
        filters,
        setFilters,
        filteredEvents,
        submitEvent,
        addEventDirect,
        approveEvent,
        rejectEvent,
        deleteEvent,
        runWeeklyCrawler,
        resetFilters,
        uniqueCities,
        uniqueStates,
        uniqueCountries,
        stats,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) throw new Error('useEvents must be used within an EventsProvider');
  return context;
};
