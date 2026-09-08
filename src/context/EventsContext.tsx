import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import { TangoEvent, EventFilterState, EventType, EventStatus, CrawlingChannel } from '../types';
import { INITIAL_EVENTS } from '../initialData';
import { isDuplicateEvent } from '../utils/dedup';
import { formatDateToCST, formatCrawledDate, getTodayCSTIsoDate, normalizeDateToIso } from '../utils/formatters';
import { DEFAULT_CRAWLING_CHANNELS } from './SiteConfigContext';
import { sendApprovalNotificationEmail, EmailLog } from '../services/emailService';
import { repairAndNormalizeEvent, getAuthenticVenueForCity } from '../utils/authenticVenues';
import { resolveDirectSourceUrl } from '../utils/sourceUrlResolver';
import { doesEventMatchChannel } from '../utils/channelMatching';
import { FACEBOOK_TANGO_COMMUNITIES } from '../data/facebookCommunities';

interface EventsContextType {
  events: TangoEvent[];
  loading: boolean;
  filters: EventFilterState;
  setFilters: React.Dispatch<React.SetStateAction<EventFilterState>>;
  filteredEvents: TangoEvent[];
  submitEvent: (eventData: Omit<TangoEvent, 'id' | 'created_at' | 'status' | 'source_type'>) => Promise<{ success: boolean; id?: string; duplicateWarning?: string; error?: string }>;
  addEventDirect: (eventData: Omit<TangoEvent, 'id' | 'created_at'>) => Promise<{ success: boolean; id?: string; error?: string }>;
  approveEvent: (id: string, overrideEmail?: string) => Promise<{ success: boolean; emailSent?: boolean; emailRecipient?: string; emailLog?: EmailLog }>;
  rejectEvent: (id: string) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  deleteMultipleEvents: (ids: string[]) => Promise<void>;
  updateEvent: (id: string, eventData: Partial<TangoEvent>) => Promise<{ success: boolean; error?: string }>;
  resetAllEventsAndCrawlRecords: () => Promise<{ success: boolean; deletedCount: number }>;
  deleteEventsBeforeCrawledDate: (cutoffDate?: string) => Promise<{ success: boolean; deletedCount: number }>;
  runWeeklyCrawler: (customChannels?: CrawlingChannel[]) => Promise<{
    addedCount: number;
    duplicateCount: number;
    duplicatesDetails: string[];
    invalidUrlCount?: number;
    invalidUrlsDetails?: string[];
    channelsCrawled?: string[];
    inactiveChannelsCount?: number;
    timeWindow?: string;
    updatedChannels?: CrawlingChannel[];
  }>;
  validateEventUrls: (
    eventsToValidate: Array<{ id?: string; url: string; eventName: string; startDate?: string }>
  ) => Promise<Array<{ id?: string; url: string; eventName: string; isValid: boolean; reason: string; statusCode?: number }>>;
  syncAuthenticVenues: () => Promise<{ repairedCount: number }>;
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
  date_quick_range: '1m', // Specification: 기본 범위 [Next 1 Month]
  start_date: '',
  end_date: '',
  price_filter: 'all',
};

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function getDefaultPriceByCountryAndType(countryCode?: string, type: EventType = 'MILONGA'): string {
  const code = (countryCode || '').toUpperCase().trim();
  const isEncuentro = type === 'ENCUENTRO' || type === 'FESTIVAL' || type === 'MARATHON';

  switch (code) {
    case 'JP':
      // Japan: Japanese Yen (¥)
      return isEncuentro ? '¥5,000' : '¥2,500';
    case 'KR':
      // South Korea: Korean Won (₩)
      return isEncuentro ? '₩40,000' : '₩20,000';
    case 'US':
      // United States: USD ($)
      return isEncuentro ? '$35' : '$18';
    case 'CA':
      // Canada: CAD (CA$)
      return isEncuentro ? 'CA$45' : 'CA$22';
    case 'GB':
    case 'UK':
      // United Kingdom: GBP (£)
      return isEncuentro ? '£30' : '£15';
    case 'AR':
      // Argentina: USD ($)
      return isEncuentro ? '$25' : '$12';
    case 'AU':
      // Australia: AUD (A$)
      return isEncuentro ? 'A$50' : 'A$25';
    case 'CN':
      // China: CNY (¥)
      return isEncuentro ? '¥260' : '¥120';
    case 'FR':
    case 'DE':
    case 'IT':
    case 'ES':
    case 'AT':
    case 'NL':
    case 'BE':
    case 'PT':
    case 'GR':
    case 'IE':
    case 'FI':
      // Eurozone: EUR (€)
      return isEncuentro ? '€30' : '€15';
    default:
      return isEncuentro ? '$40' : '$20';
  }
}

/**
 * Normalizes event data, repairs placeholder addresses ("100 Main Blvd"),
 * fixes city/country mismatches (e.g. Seoul -> KR), and auto-corrects legacy prices.
 */
export function normalizeEventForCountry(ev: TangoEvent): { event: TangoEvent; changed: boolean } {
  return repairAndNormalizeEvent(ev);
}

// Persistent storage key for user-deleted event IDs to prevent resurrection from initial seed or cached snapshots
const DELETED_EVENT_IDS_KEY = 'everytango_deleted_event_ids';

/**
 * Helper to determine if an event's CRAWLED column date is strictly before 2026-09-06
 */
export function isCrawledBefore20260906(createdAt?: string | null): boolean {
  if (!createdAt) return false;
  const crawled = formatCrawledDate(createdAt);
  if (crawled.date && crawled.date !== '—' && crawled.date < '2026-09-06') {
    return true;
  }
  return false;
}

export function getDeletedEventIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_EVENT_IDS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set<string>(arr);
      }
    }
  } catch (e) {
    console.warn('Error reading deleted event ids from localStorage:', e);
  }
  return new Set<string>();
}

export function recordDeletedEventIds(ids: string[]): void {
  try {
    const current = getDeletedEventIds();
    ids.forEach((id) => current.add(id));
    localStorage.setItem(DELETED_EVENT_IDS_KEY, JSON.stringify(Array.from(current)));
  } catch (e) {
    console.warn('Error saving deleted event ids to localStorage:', e);
  }
}

export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<TangoEvent[]>(() => {
    // User requested fresh start wipe: purge previous events
    const freshStartKey = 'everytango_fresh_start_v6';
    if (!localStorage.getItem(freshStartKey)) {
      localStorage.setItem('everytango_events', '[]');
      localStorage.removeItem(DELETED_EVENT_IDS_KEY);
      localStorage.setItem('everytango_seeded_v2', '1');
      localStorage.setItem(freshStartKey, '1');
      return [];
    }

    const deletedIds = getDeletedEventIds();
    const cached = localStorage.getItem('everytango_events');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as TangoEvent[];
        // Auto-purge any events with CRAWLED date before 2026-09-06
        const oldIds = parsed.filter((e) => isCrawledBefore20260906(e.created_at)).map((e) => e.id);
        if (oldIds.length > 0) {
          recordDeletedEventIds(oldIds);
        }
        const filtered = parsed.filter((e) => !deletedIds.has(e.id) && !isCrawledBefore20260906(e.created_at));
        return filtered.map((e) => normalizeEventForCountry(e).event);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<EventFilterState>(defaultFilters);

  // Firestore sync with local fallback
  useEffect(() => {
    let unsub = () => {};
    try {
      const eventsCol = collection(db, 'events');

      const EVENTS_WINDOW_DAYS = 180;
      const EVENTS_QUERY_LIMIT = 1000;

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - EVENTS_WINDOW_DAYS);
      const cutoffStr = cutoff.toISOString().split('T')[0];

      const eventsQuery = query(
        eventsCol,
        where('end_date', '>=', cutoffStr),
        orderBy('end_date', 'asc'),
        limit(EVENTS_QUERY_LIMIT)
      );

      // Sweep Firestore to purge any documents where CRAWLED date < 2026-09-06
      const sweepFirestoreBefore20260906 = async () => {
        try {
          const snap = await getDocs(eventsCol);
          const toDelete: string[] = [];
          snap.forEach((d) => {
            const data = d.data() as TangoEvent;
            if (isCrawledBefore20260906(data.created_at)) {
              toDelete.push(d.id);
            }
          });
          if (toDelete.length > 0) {
            recordDeletedEventIds(toDelete);
            await Promise.allSettled(toDelete.map((id) => deleteDoc(doc(db, 'events', id))));
            setEvents((prev) => prev.filter((e) => !toDelete.includes(e.id)));
          }
        } catch (e) {
          console.warn('Firestore purge error for events before 2026-09-06:', e);
        }
      };
      sweepFirestoreBefore20260906();

      unsub = onSnapshot(eventsQuery, (snapshot) => {
        const deletedIds = getDeletedEventIds();

        // If fresh start wipe hasn't cleaned remote Firestore yet, purge all existing remote events
        if (!localStorage.getItem('everytango_fresh_start_v6_firestore_purged')) {
          localStorage.setItem('everytango_fresh_start_v6_firestore_purged', '1');
          if (!snapshot.empty) {
            snapshot.forEach((d) => {
              deleteDoc(doc(db, 'events', d.id)).catch(() => {});
            });
          }
          setEvents([]);
          localStorage.setItem('everytango_events', '[]');
          setLoading(false);
          return;
        }

        if (!snapshot.empty) {
          const list: TangoEvent[] = [];
          const existingIds = new Set<string>();
          snapshot.forEach((d) => {
            const data = { id: d.id, ...d.data() } as TangoEvent;

            // Auto-delete events with CRAWLED date before 2026-09-06
            if (isCrawledBefore20260906(data.created_at)) {
              deleteDoc(doc(db, 'events', d.id)).catch(() => {});
              recordDeletedEventIds([d.id]);
              return;
            }

            // If this event was deleted by admin, purge from Firestore if still lingering and never add to state
            if (deletedIds.has(d.id)) {
              deleteDoc(doc(db, 'events', d.id)).catch(() => {});
              return;
            }

            const { event: normalized, changed } = normalizeEventForCountry(data);
            if (changed) {
              setDoc(doc(db, 'events', d.id), normalized, { merge: true }).catch(() => {});
            }
            list.push(normalized);
            existingIds.add(d.id);
          });

          setEvents(list);
          localStorage.setItem('everytango_events', JSON.stringify(list));
        } else {
          setEvents([]);
          localStorage.setItem('everytango_events', '[]');
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

  const approveEvent = async (
    id: string,
    overrideEmail?: string
  ): Promise<{ success: boolean; emailSent?: boolean; emailRecipient?: string; emailLog?: EmailLog }> => {
    try {
      await updateDoc(doc(db, 'events', id), { status: 'APPROVED' });
    } catch (e) {
      console.warn('Update remote doc err:', e);
    }
    const targetEvent = events.find((e) => e.id === id);
    const updated = events.map((e) => (e.id === id ? { ...e, status: 'APPROVED' as EventStatus } : e));
    setEvents(updated);
    localStorage.setItem('everytango_events', JSON.stringify(updated));

    // Automated Reply Email Dispatch to Author (in English)
    let authorEmail = overrideEmail || targetEvent?.submitted_by_email;
    let authorName = targetEvent?.submitted_by_name;

    // Look up submitter email in local user registry if not saved on event
    if (!authorEmail && targetEvent?.submitted_by) {
      try {
        const localUsers: any[] = JSON.parse(localStorage.getItem('everytango_db_users') || '[]');
        const found = localUsers.find(
          (u) => u.id === targetEvent.submitted_by ||
                 u.username === targetEvent.submitted_by ||
                 u.email === targetEvent.submitted_by
        );
        if (found?.email) {
          authorEmail = found.email;
          if (!authorName) authorName = found.username;
        }
      } catch (e) {
        console.warn('Lookup user email err:', e);
      }
    }

    // Check if submitted_by looks like an email itself
    if (!authorEmail && targetEvent?.submitted_by && targetEvent.submitted_by.includes('@')) {
      authorEmail = targetEvent.submitted_by;
    }

    // Default fallback to admin email or current user email if available
    if (!authorEmail) {
      try {
        const customUser = JSON.parse(localStorage.getItem('everytango_custom_user') || '{}');
        if (customUser?.email) {
          authorEmail = customUser.email;
        }
      } catch (e) {
        // ignore
      }
    }

    if (authorEmail && targetEvent) {
      try {
        const approvedEvent: TangoEvent = { ...targetEvent, status: 'APPROVED' };
        const emailRes = await sendApprovalNotificationEmail(approvedEvent, authorEmail, authorName || undefined);
        return {
          success: true,
          emailSent: true,
          emailRecipient: authorEmail,
          emailLog: emailRes.emailLog,
        };
      } catch (emailErr) {
        console.warn('Failed to send automated approval email:', emailErr);
        return { success: true, emailSent: false, emailRecipient: authorEmail };
      }
    }

    return { success: true, emailSent: false };
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
    // 1. Immediately record in persistent deleted IDs
    recordDeletedEventIds([id]);

    // 2. Delete remote document in Firestore
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (e) {
      console.warn('Delete remote doc err:', e);
    }

    // 3. Update local state and localStorage
    const updated = events.filter((e) => e.id !== id);
    setEvents(updated);
    localStorage.setItem('everytango_events', JSON.stringify(updated));
  };

  const deleteMultipleEvents = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;

    // 1. Immediately record in persistent deleted IDs to prevent resurrection on refresh
    recordDeletedEventIds(ids);

    // 2. Delete remote documents in Firestore concurrently
    await Promise.allSettled(
      ids.map(async (id) => {
        try {
          await deleteDoc(doc(db, 'events', id));
        } catch (e) {
          console.warn('Delete remote doc err for id:', id, e);
        }
      })
    );

    // 3. Update local state and localStorage
    const idSet = new Set(ids);
    const updated = events.filter((e) => !idSet.has(e.id));
    setEvents(updated);
    localStorage.setItem('everytango_events', JSON.stringify(updated));
  };

  const updateEvent = async (
    id: string,
    eventData: Partial<TangoEvent>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      try {
        await updateDoc(doc(db, 'events', id), eventData);
      } catch (err) {
        console.warn('Updating event in firestore failed, updating locally:', err);
      }
      const updated = events.map((e) => (e.id === id ? { ...e, ...eventData } : e));
      setEvents(updated);
      localStorage.setItem('everytango_events', JSON.stringify(updated));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update event' };
    }
  };

  // Completely wipe all events from Firestore and local storage for fresh start
  const resetAllEventsAndCrawlRecords = async (): Promise<{ success: boolean; deletedCount: number }> => {
    let deletedCount = events.length;
    // 1. Wipe local state and flags
    setEvents([]);
    localStorage.setItem('everytango_events', '[]');
    localStorage.removeItem(DELETED_EVENT_IDS_KEY);
    localStorage.setItem('everytango_seeded_v2', '1');
    localStorage.setItem('everytango_fresh_start_v6', '1');
    localStorage.setItem('everytango_fresh_start_v6_firestore_purged', '1');

    // 2. Wipe Firestore events collection if accessible
    try {
      const snap = await getDocs(collection(db, 'events'));
      deletedCount = Math.max(deletedCount, snap.docs.length);
      const deletePromises = snap.docs.map((d) => deleteDoc(doc(db, 'events', d.id)));
      await Promise.allSettled(deletePromises);
    } catch (err) {
      console.warn('Remote firestore delete error or quota exhausted:', err);
    }

    return { success: true, deletedCount };
  };

  // Delete all events where CRAWLED column value is before cutoffDate (default: '2026-09-06')
  const deleteEventsBeforeCrawledDate = async (cutoffDate: string = '2026-09-06'): Promise<{ success: boolean; deletedCount: number }> => {
    const toDeleteIds: string[] = [];
    events.forEach((e) => {
      const crawled = formatCrawledDate(e.created_at);
      if (crawled.date && crawled.date !== '—' && crawled.date < cutoffDate) {
        toDeleteIds.push(e.id);
      }
    });

    try {
      const snap = await getDocs(collection(db, 'events'));
      snap.forEach((d) => {
        const data = d.data() as TangoEvent;
        const crawled = formatCrawledDate(data.created_at);
        if (crawled.date && crawled.date !== '—' && crawled.date < cutoffDate) {
          if (!toDeleteIds.includes(d.id)) {
            toDeleteIds.push(d.id);
          }
        }
      });
    } catch (err) {
      console.warn('Firestore query for old crawled events error:', err);
    }

    if (toDeleteIds.length > 0) {
      await deleteMultipleEvents(toDeleteIds);
    }

    return { success: true, deletedCount: toDeleteIds.length };
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
  const runWeeklyCrawler = async (
    customChannels?: CrawlingChannel[]
  ): Promise<{
    addedCount: number;
    duplicateCount: number;
    duplicatesDetails: string[];
    invalidUrlCount?: number;
    invalidUrlsDetails?: string[];
    channelsCrawled?: string[];
    inactiveChannelsCount?: number;
    timeWindow?: string;
    updatedChannels?: CrawlingChannel[];
  }> => {
    let addedCount = 0;
    let duplicateCount = 0;
    let invalidUrlCount = 0;
    const duplicatesDetails: string[] = [];
    const invalidUrlsDetails: string[] = [];
    const newEventsToAdd: TangoEvent[] = [];

    // Determine target crawling channels and maintain full list of channels
    let allChannelsList: CrawlingChannel[] = [];
    try {
      const saved = localStorage.getItem('everytango_cron_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.channels && Array.isArray(parsed.channels)) {
          allChannelsList = parsed.channels;
        }
      }
    } catch (e) {
      console.warn('Could not read channels from config:', e);
    }
    if (allChannelsList.length === 0) {
      allChannelsList = DEFAULT_CRAWLING_CHANNELS;
    }

    // 1. 크롤링 대상 채널: customChannels가 지정되었으면 해당 채널 대상, 아니면 활성화(ACTIVE: ON)된 채널 선별
    let targetChannelsToCrawl: CrawlingChannel[] = [];
    if (customChannels && customChannels.length > 0) {
      targetChannelsToCrawl = customChannels.map((c) => ({ ...c, enabled: true }));
    } else {
      targetChannelsToCrawl = allChannelsList.filter(
        (c) => c.enabled && (c.sourceType === 'FACEBOOK' || c.sourceType === 'WEBSITE' || c.url.startsWith('http'))
      );
    }

    const disabledChannels = allChannelsList.filter(
      (c) => !targetChannelsToCrawl.some((tc) => tc.id === c.id)
    );

    if (targetChannelsToCrawl.length === 0) {
      return {
        addedCount: 0,
        duplicateCount: 0,
        duplicatesDetails: [
          '[알림] 크롤링할 대상 채널이 없습니다. 채널 관리 메뉴에서 사이트 주소를 등록하거나 채널을 활성화(ON)해주세요.',
        ],
        channelsCrawled: [],
        timeWindow: 'Upcoming Events Only',
        updatedChannels: allChannelsList,
      };
    }

    // 2. 크롤링 조건: 오늘 날짜(CST 기준) 이후 개최되는 Upcoming Events(예정된 행사)만 수집
    const now = new Date();
    const todayIsoStr = getTodayCSTIsoDate(); // Standard ISO "YYYY-MM-DD" e.g. "2026-09-07"
    const todayDisplayStr = formatDateToCST(now); // "YYYY-MM-DD" for display
    const timeWindowDesc = `페이스북/웹사이트 Upcoming Events (개최일: ${todayDisplayStr} 이후 예정된 행사)`;

    // 3. 관리자가 등록한 사이트에 접근하여 다가오는 이벤트 내용(이벤트 이름, 날짜, 시간) 추출
    const candidatesPool: TangoEvent[] = [];

    for (const channel of targetChannelsToCrawl) {
      const chUrl = (channel.url || '').toLowerCase().trim();
      const chName = (channel.name || '').toLowerCase().trim();
      const chCity = (channel.city || '').toLowerCase().trim();

      // Step A: First attempt to extract visible events directly from registered site URL via backend site extractor
      let extractedFromSite: any[] = [];
      try {
        const resp = await fetch('/api/crawler/extract-site-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: channel.url,
            channelName: channel.name,
            sourceType: channel.sourceType,
            city: channel.city || 'Roswell',
            state: channel.state || 'GA',
            countryCode: channel.country_code || 'US',
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.events && Array.isArray(data.events)) {
            extractedFromSite = data.events;
          }
        }
      } catch (err) {
        console.warn(`[Site Extractor] Failed to extract from site for ${channel.name}:`, err);
      }

      if (extractedFromSite.length > 0) {
        for (const ext of extractedFromSite) {
          const eventStartDate = normalizeDateToIso(ext.startDate || ext.start_date);
          const eventEndDate = normalizeDateToIso(ext.endDate || ext.end_date) || eventStartDate;

          // 오늘(CST) 이후 예정된 다가오는 이벤트만 수집 (과거 행사 제외)
          if (!eventStartDate || (eventEndDate < todayIsoStr && eventStartDate < todayIsoStr)) {
            continue;
          }

          const eventTitle = ext.eventName || ext.event_name;
          const alreadyInPool = candidatesPool.some(
            (c) =>
              c.event_name.toLowerCase().trim() === eventTitle.toLowerCase().trim() &&
              c.start_date === eventStartDate
          );
          if (alreadyInPool) continue;

          const determinedPrice = ext.price || (ext.eventType === 'FESTIVAL' ? '~$240' : '~$25');

          candidatesPool.push({
            id: 'site_ext_' + Math.random().toString(36).substring(2, 9),
            event_name: eventTitle,
            event_type: (ext.eventType || ext.event_type || 'MILONGA') as EventType,
            start_date: eventStartDate,
            end_date: eventEndDate,
            city: ext.city || channel.city || 'Roswell',
            state: ext.state || channel.state || 'GA',
            country_code: ext.countryCode || channel.country_code || 'US',
            address: ext.address || 'Ballroom Impact, 1425 Market Blvd, Suite 525, Roswell, GA 30076',
            price: determinedPrice,
            is_free: ext.isFree || determinedPrice === 'Free' || determinedPrice === '~$0',
            source_url: ext.sourceUrl || channel.url,
            source_type: 'AUTO_CRAWLED',
            status: 'PENDING' as EventStatus,
            submitted_by: `Site Extractor (${channel.name})`,
            submitted_by_name: channel.name,
            created_at: now.toISOString(),
            notes: ext.notes || `[등록 사이트(${channel.name}) 내용 추출 | 최고가 옵션: ${determinedPrice} | 일시: ${ext.rawDateStr || eventStartDate} ${ext.timeStr || ''}]`,
          });
        }
      } else {
        // Step B: Fallback to community directory matching if site extractor returned 0
        // Priority 1: Match by group handle or exact URL
        let matchedComms = FACEBOOK_TANGO_COMMUNITIES.filter((fbComm) => {
          const fbUrl = fbComm.url.toLowerCase().trim();
          const handle = (fbComm.groupHandle || '').toLowerCase().trim();
          if (handle && chUrl.includes(handle)) return true;
          if (chUrl.replace(/\/$/, '') === fbUrl.replace(/\/$/, '')) return true;
          const numMatch = chUrl.match(/\/groups\/(\d+)/);
          if (numMatch && (fbUrl.includes(numMatch[1]) || (fbComm.groupHandle && fbComm.groupHandle.includes(numMatch[1])))) {
            return true;
          }
          return false;
        });

        // Priority 2: If no URL match, try matching by channel name
        if (matchedComms.length === 0 && chName) {
          matchedComms = FACEBOOK_TANGO_COMMUNITIES.filter((fbComm) => {
            return fbComm.name.toLowerCase().includes(chName) || chName.includes(fbComm.name.toLowerCase());
          });
        }

        for (const fbComm of matchedComms) {
          if (!fbComm.events || !Array.isArray(fbComm.events)) continue;

          for (const fbEvt of fbComm.events) {
            const eventStartDate = normalizeDateToIso(fbEvt.start_date);
            const eventEndDate = normalizeDateToIso(fbEvt.end_date || fbEvt.start_date);

            if (!eventStartDate || (eventEndDate < todayIsoStr && eventStartDate < todayIsoStr)) {
              continue;
            }

            const eventTitle = fbEvt.event_name;
            const alreadyInPool = candidatesPool.some(
              (c) =>
                c.event_name.toLowerCase().trim() === eventTitle.toLowerCase().trim() &&
                c.start_date === fbEvt.start_date
            );
            if (alreadyInPool) continue;

            const cleanSourceUrl = fbEvt.source_url || channel.url;

            candidatesPool.push({
              id: 'fb_upcoming_' + Math.random().toString(36).substring(2, 9),
              event_name: fbEvt.event_name,
              event_type: fbEvt.event_type as EventType,
              start_date: fbEvt.start_date,
              end_date: fbEvt.end_date || fbEvt.start_date,
              city: fbEvt.city || channel.city || 'Roswell',
              state: fbEvt.state || channel.state || 'GA',
              country_code: fbEvt.country_code || channel.country_code || 'US',
              address: fbEvt.address || 'Ballroom Impact, 1425 Market Blvd, Suite 525, Roswell, GA 30076',
              price: fbEvt.price || '$15',
              is_free: fbEvt.is_free || false,
              source_url: cleanSourceUrl,
              source_type: 'AUTO_CRAWLED',
              status: 'PENDING' as EventStatus,
              submitted_by: `Crawler (${channel.name})`,
              submitted_by_name: channel.name,
              created_at: now.toISOString(),
              notes: `[출처: 페이스북 공식 채널 ${channel.name} (${channel.url}) | Upcoming Event 크롤링 승인 요청 | 행사일: ${fbEvt.start_date}]`,
            });
          }
        }
      }
    }

    // 2. 관리자가 등록한 페이스북 페이지 주소에서 Upcoming Event 수집 (오늘 이후 예정된 행사)
    const validUpcomingCandidates = candidatesPool.filter((candidate) => {
      const startStr = normalizeDateToIso(candidate.start_date);
      const endStr = normalizeDateToIso(candidate.end_date) || startStr;
      return Boolean(startStr && (endStr >= todayIsoStr || startStr >= todayIsoStr));
    });

    // Step 1: Validate candidate URLs to filter out unreachable, expired, or invalid event links
    const urlValidationMap: Record<string, { isValid: boolean; reason: string }> = {};
    if (validUpcomingCandidates.length > 0) {
      try {
        const resp = await fetch('/api/crawler/validate-urls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidates: validUpcomingCandidates.map((c) => ({
              id: c.id,
              url: c.source_url,
              eventName: c.event_name,
              startDate: c.start_date,
              channelName: c.submitted_by_name || undefined,
            })),
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.results && Array.isArray(data.results)) {
            data.results.forEach((r: any) => {
              if (r.id) urlValidationMap[r.id] = { isValid: r.isValid, reason: r.reason };
              urlValidationMap[`${r.url}_${r.eventName}`] = { isValid: r.isValid, reason: r.reason };
            });
          }
        }
      } catch (err) {
        console.warn('Backend URL validation failed, running fallback heuristics:', err);
      }
    }

    // Evaluate each candidate against URL validity & deduplication
    for (const candidate of validUpcomingCandidates) {
      // 1. Check URL Validity: Exclude if invalid, dead, or unreachable
      const valResult =
        urlValidationMap[candidate.id] ||
        urlValidationMap[`${candidate.source_url}_${candidate.event_name}`];

      let isUrlValid = true;
      let urlRejectReason = '';

      if (valResult) {
        isUrlValid = valResult.isValid;
        urlRejectReason = valResult.reason;
      } else {
        // Fallback local heuristic check
        const url = (candidate.source_url || '').trim();
        if (!url || !url.startsWith('http')) {
          isUrlValid = false;
          urlRejectReason = '잘못된 URL 형식 (HTTP/HTTPS 주소 누락)';
        } else if (url.includes('facebook.com')) {
          const lower = url.toLowerCase();
          if (lower.includes('/groups/') || lower.includes('/events/') || lower.includes('/posts/') || lower.includes('/permalink/') || lower.length > 20) {
            isUrlValid = true;
          }
        }
      }

      // If URL is invalid -> EXCLUDE FROM DISCOVERED TARGETS!
      if (!isUrlValid) {
        invalidUrlCount++;
        const logMsg = `[사이트 주소 무효 / 검색 제외] "${candidate.event_name}" (${candidate.source_url}) -> 사유: ${urlRejectReason}`;
        duplicatesDetails.push(logMsg);
        invalidUrlsDetails.push(logMsg);
        continue; // Strictly excluded: DO NOT add to newEventsToAdd or PENDING list!
      }

      // 2. Ensure candidate has authentic venue and clean metadata
      const { event: cleanCandidate } = repairAndNormalizeEvent(candidate);
      const dupResult = isDuplicateEvent(cleanCandidate, [...events, ...newEventsToAdd]);
      if (dupResult.isDup) {
        duplicateCount++;
        duplicatesDetails.push(
          `[DUPLICATE REJECTED] "${cleanCandidate.event_name}" (${cleanCandidate.city}, ${cleanCandidate.start_date}) -> Reason: ${dupResult.reason}`
        );
      } else {
        addedCount++;
        const evWithId: TangoEvent = {
          ...cleanCandidate,
          id: 'crawler_' + Math.random().toString(36).substring(2, 9),
          status: 'PENDING' as EventStatus, // CRITICAL: Only valid upcoming events enter PENDING approval list!
        };
        newEventsToAdd.push(evWithId);
        try {
          await setDoc(doc(db, 'events', evWithId.id), evWithId);
        } catch (e) {
          console.warn('Failed to persist crawled event to Firestore:', e);
        }
      }
    }

    if (newEventsToAdd.length > 0) {
      const merged = [...newEventsToAdd, ...events];
      setEvents(merged);
      localStorage.setItem('everytango_events', JSON.stringify(merged));
    }

    // Build updated channels list with updated lastCrawledAt & discoveredCount for crawled channels
    const updatedChannels: CrawlingChannel[] = allChannelsList.map((c: CrawlingChannel) => {
      const isTarget = targetChannelsToCrawl.some((tc) => tc.id === c.id || tc.name === c.name);
      if (isTarget) {
        const addedForChannel = newEventsToAdd.filter((e) => e.submitted_by_name === c.name).length;
        const candidatesForChannel = validUpcomingCandidates.filter((e) => e.submitted_by_name === c.name).length;
        return {
          ...c,
          lastCrawledAt: now.toISOString(),
          discoveredCount: (c.discoveredCount || 0) + (addedForChannel > 0 ? addedForChannel : (candidatesForChannel > 0 ? 1 : 0)),
        };
      }
      // Untargeted channels: Preserve existing stats completely untouched
      return { ...c };
    });

    // Update discovered count & lastCrawledAt in localStorage
    try {
      const saved = localStorage.getItem('everytango_cron_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.channels = updatedChannels;
        localStorage.setItem('everytango_cron_config', JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn('Could not update channel crawl stats in storage:', e);
    }

    return {
      addedCount,
      duplicateCount,
      duplicatesDetails,
      invalidUrlCount,
      invalidUrlsDetails,
      channelsCrawled: targetChannelsToCrawl.map((c) => c.name),
      inactiveChannelsCount: disabledChannels.length,
      timeWindow: timeWindowDesc,
      updatedChannels,
    };
  };

  // Validate event URLs via server-side verification endpoint
  const validateEventUrls = async (
    eventsToValidate: Array<{ id?: string; url: string; eventName: string; startDate?: string }>
  ): Promise<Array<{ id?: string; url: string; eventName: string; isValid: boolean; reason: string; statusCode?: number }>> => {
    try {
      const resp = await fetch('/api/crawler/validate-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates: eventsToValidate }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.results || [];
      }
    } catch (err) {
      console.warn('validateEventUrls request failed:', err);
    }
    return eventsToValidate.map((e) => ({
      id: e.id,
      url: e.url,
      eventName: e.eventName,
      isValid: Boolean(e.url && e.url.startsWith('http')),
      reason: Boolean(e.url && e.url.startsWith('http')) ? '기본 형식 통과' : '잘못된 URL 형식',
    }));
  };

  // Synchronize and repair all event addresses to authentic venues and correct country codes
  const syncAuthenticVenues = async (): Promise<{ repairedCount: number }> => {
    let repairedCount = 0;
    const repairedList: TangoEvent[] = [];

    for (const ev of events) {
      const { event: normalized, changed } = repairAndNormalizeEvent(ev);
      if (changed) {
        repairedCount++;
        try {
          await setDoc(doc(db, 'events', ev.id), normalized, { merge: true });
        } catch (err) {
          console.warn('Firestore venue sync error:', err);
        }
      }
      repairedList.push(normalized);
    }

    if (repairedCount > 0) {
      setEvents(repairedList);
      localStorage.setItem('everytango_events', JSON.stringify(repairedList));
    }

    return { repairedCount };
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
      WORKSHOP: events.filter((e) => e.status === 'APPROVED' && e.event_type === 'WORKSHOP').length,
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
        deleteMultipleEvents,
        updateEvent,
        resetAllEventsAndCrawlRecords,
        deleteEventsBeforeCrawledDate,
        runWeeklyCrawler,
        validateEventUrls,
        syncAuthenticVenues,
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
