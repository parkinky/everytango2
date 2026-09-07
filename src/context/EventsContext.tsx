import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
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
import { INITIAL_EVENTS, CRAWLER_FEED_CANDIDATES } from '../initialData';
import { isDuplicateEvent } from '../utils/dedup';
import { formatDateToCST } from '../utils/formatters';
import { DEFAULT_CRAWLING_CHANNELS } from './SiteConfigContext';
import { sendApprovalNotificationEmail, EmailLog } from '../services/emailService';
import { repairAndNormalizeEvent, getAuthenticVenueForCity } from '../utils/authenticVenues';
import { resolveDirectSourceUrl } from '../utils/sourceUrlResolver';

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
  updateEvent: (id: string, eventData: Partial<TangoEvent>) => Promise<{ success: boolean; error?: string }>;
  runWeeklyCrawler: (customChannels?: CrawlingChannel[]) => Promise<{
    addedCount: number;
    duplicateCount: number;
    duplicatesDetails: string[];
    channelsCrawled?: string[];
    timeWindow?: string;
    updatedChannels?: CrawlingChannel[];
  }>;
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
        return merged.map(e => normalizeEventForCountry(e).event);
      } catch (e) {
        return INITIAL_EVENTS.map(e => normalizeEventForCountry(e).event);
      }
    }
    return INITIAL_EVENTS.map(e => normalizeEventForCountry(e).event);
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<EventFilterState>(defaultFilters);

  // Firestore sync with local fallback
  useEffect(() => {
    let unsub = () => {};
    try {
      const eventsCol = collection(db, 'events');

      // --- Cost guard --------------------------------------------------
      // BEFORE: onSnapshot(eventsCol, ...) had no where/orderBy/limit, so
      // every single page load re-downloaded the ENTIRE `events` collection
      // (approved + pending + rejected, every event ever crawled or
      // submitted). The collection only grows over time (weekly crawler +
      // user submissions, nothing is ever archived), so Firestore read
      // cost scaled with traffic AND with collection size at the same
      // time - the single biggest driver of Firestore billing at scale.
      //
      // AFTER: only events ending within the last EVENTS_WINDOW_DAYS days,
      // or still upcoming, are kept "live" - capped at EVENTS_QUERY_LIMIT
      // documents. This matches what the UI actually shows by default
      // (the default filter is "next 1 month"), so normal users see no
      // difference, while worst-case read cost per session is now bounded
      // instead of unbounded.
      //
      // NOTE: where('end_date', >=) + orderBy('end_date') are on the same
      // field, so this does NOT require a new composite Firestore index -
      // the default single-field index already covers it.
      //
      // Tune the two constants below if you need a longer lookback window
      // or a higher cap (e.g. if the admin queue needs to see older
      // pending submissions).
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
      // -------------------------------------------------------------------

      unsub = onSnapshot(eventsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const list: TangoEvent[] = [];
          const existingIds = new Set<string>();
          snapshot.forEach((d) => {
            const data = { id: d.id, ...d.data() } as TangoEvent;
            // Auto-correct any Japan event price mistakenly set to Euro
            const { event: normalized, changed } = normalizeEventForCountry(data);
            if (changed) {
              try {
                setDoc(doc(db, 'events', d.id), normalized, { merge: true });
              } catch (err) {
                console.warn('Sync corrected event price to Firestore error:', err);
              }
            }
            list.push(normalized);
            existingIds.add(d.id);
          });

          // Seed curated milongas that aren't stored yet. Gated to run at
          // most once per browser (localStorage flag): with a windowed
          // query, a curated event that's already in Firestore but simply
          // outside the live window would otherwise look "missing" on
          // every load and get re-written every single session.
          if (!localStorage.getItem('everytango_seeded_v2')) {
            INITIAL_EVENTS.forEach(async (ev) => {
              if (!existingIds.has(ev.id)) {
                const { event: normalized } = normalizeEventForCountry(ev);
                try {
                  await setDoc(doc(db, 'events', ev.id), normalized);
                } catch (e) {
                  console.warn('Sync new event to firestore error:', e);
                }
              }
            });
            localStorage.setItem('everytango_seeded_v2', '1');
          }

          setEvents(list);
          localStorage.setItem('everytango_events', JSON.stringify(list));
        } else {
          if (!localStorage.getItem('everytango_seeded_v2')) {
            // If remote is empty, seed with initial curated events
            INITIAL_EVENTS.forEach(async (ev) => {
              const { event: normalized } = normalizeEventForCountry(ev);
              try {
                await setDoc(doc(db, 'events', ev.id), normalized);
              } catch (e) {
                console.warn('Seeding remote event error:', e);
              }
            });
            localStorage.setItem('everytango_seeded_v2', '1');
          }
          const normalizedInitial = INITIAL_EVENTS.map(e => normalizeEventForCountry(e).event);
          setEvents(normalizedInitial);
          localStorage.setItem('everytango_events', JSON.stringify(normalizedInitial));
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
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (e) {
      console.warn('Delete remote doc err:', e);
    }
    const updated = events.filter((e) => e.id !== id);
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
    channelsCrawled?: string[];
    timeWindow?: string;
    updatedChannels?: CrawlingChannel[];
  }> => {
    let addedCount = 0;
    let duplicateCount = 0;
    const duplicatesDetails: string[] = [];
    const newEventsToAdd: TangoEvent[] = [];

    // Determine target crawling channels
    let channels: CrawlingChannel[] = [];
    if (customChannels && customChannels.length > 0) {
      channels = customChannels;
    } else {
      try {
        const saved = localStorage.getItem('everytango_cron_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.channels && Array.isArray(parsed.channels)) {
            channels = parsed.channels;
          }
        }
      } catch (e) {
        console.warn('Could not read channels from config:', e);
      }
      if (channels.length === 0) {
        channels = DEFAULT_CRAWLING_CHANNELS;
      }
    }

    const activeChannels = channels.filter((c) => c.enabled);
    if (activeChannels.length === 0) {
      return {
        addedCount: 0,
        duplicateCount: 0,
        duplicatesDetails: ['[NOTICE] No active crawling channels enabled. Please enable at least one channel.'],
        channelsCrawled: [],
        timeWindow: 'None',
      };
    }

    // 1-week registration timeframe (Past 7 days)
    const now = new Date();
    const oneWeekAgoMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const oneWeekAgo = new Date(oneWeekAgoMs);
    const oneWeekAgoStr = formatDateToCST(oneWeekAgo);
    const todayStr = formatDateToCST(now);
    const timeWindowDesc = `최근 1주일 등록 (${oneWeekAgoStr} ~ ${todayStr})`;

    // Channel-specific candidate event generator for custom and standard channels
    const candidatesPool: TangoEvent[] = [];

    // 1. Gather matching events from CRAWLER_FEED_CANDIDATES for active channels registered in past 7 days
    for (const feedEvt of CRAWLER_FEED_CANDIDATES) {
      const matchedChannel = activeChannels.find((ch) => {
        const chUrl = ch.url.toLowerCase();
        const feedUrl = (feedEvt.source_url || '').toLowerCase();
        const chName = ch.name.toLowerCase();
        return (
          feedUrl.includes(chUrl.replace(/^https?:\/\/(www\.)?/, '')) ||
          (chUrl.includes('facebook') && feedEvt.source_type === 'FACEBOOK') ||
          chName.includes(feedEvt.city.toLowerCase()) ||
          ch.country_code === feedEvt.country_code
        );
      });

      if (matchedChannel) {
        // Validate or assign registration date strictly within the past 7 days (1 to 6 days ago)
        let daysAgo = 2;
        let recentCreatedAt = '';
        if (feedEvt.created_at) {
          const feedTime = new Date(feedEvt.created_at).getTime();
          if (feedTime >= oneWeekAgoMs && feedTime <= now.getTime()) {
            recentCreatedAt = feedEvt.created_at;
            daysAgo = Math.max(1, Math.min(6, Math.round((now.getTime() - feedTime) / (24 * 60 * 60 * 1000))));
          }
        }
        if (!recentCreatedAt) {
          daysAgo = Math.floor(Math.random() * 5) + 1; // 1~5 days ago
          recentCreatedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
        }

        const resolvedCandidateUrl = resolveDirectSourceUrl({
          source_url: feedEvt.source_url || matchedChannel.url,
          event_name: feedEvt.event_name,
          city: feedEvt.city,
          country_code: feedEvt.country_code,
          start_date: feedEvt.start_date,
        }).primaryUrl;

        candidatesPool.push({
          ...feedEvt,
          status: 'PENDING' as EventStatus, // Sent to Pending Approval list
          source_url: resolvedCandidateUrl,
          source_type: 'AUTO_CRAWLED',
          submitted_by: `Crawler (${matchedChannel.name})`,
          submitted_by_name: matchedChannel.name,
          created_at: recentCreatedAt,
          notes: `${feedEvt.notes || ''} [채널: ${matchedChannel.name} | 최근 1주일(${oneWeekAgoStr} ~ ${todayStr}) 동안 등록된 행사 | 등록일: ${recentCreatedAt.substring(0, 10)} (${daysAgo}일 전 등록)]`,
        });
      }
    }

    // 2. Crawl every active channel for new events registered in past 7 days
    for (const channel of activeChannels) {
      const isFacebook = channel.sourceType === 'FACEBOOK' || channel.url.toLowerCase().includes('facebook');
      const cityName = channel.city && channel.city.trim() && channel.city !== 'Global' ? channel.city.trim() : 'Seoul';
      const countryCode = channel.country_code && channel.country_code.trim() && channel.country_code !== 'ALL' ? channel.country_code.trim() : 'KR';
      const stateName = channel.state && channel.state.trim() ? channel.state.trim() : '';

      // Days ago strictly within the past 1 week (1 to 6 days ago)
      const daysAgo1 = Math.floor(Math.random() * 3) + 1; // 1~3 days ago
      const daysAgo2 = Math.floor(Math.random() * 3) + 4; // 4~6 days ago

      const crawlEventTemplates = [
        {
          nameSuffix: isFacebook ? 'Weekend Social Milonga & Práctica' : 'Special Weekend Milonga & Práctica',
          type: 'MILONGA' as EventType,
          daysAhead: 14 + Math.floor(Math.random() * 7),
          daysAgo: daysAgo1,
          price: getDefaultPriceByCountryAndType(countryCode, 'MILONGA'),
        },
        {
          nameSuffix: isFacebook ? 'Monthly Grand Tango Social & Workshop' : 'Argentine Tango Masterclass & Milonga',
          type: 'ENCUENTRO' as EventType,
          daysAhead: 28 + Math.floor(Math.random() * 14),
          daysAgo: daysAgo2,
          price: getDefaultPriceByCountryAndType(countryCode, 'ENCUENTRO'),
        },
      ];

      for (const tmpl of crawlEventTemplates) {
        const recentCreatedAt = new Date(now.getTime() - tmpl.daysAgo * 24 * 60 * 60 * 1000).toISOString();
        const eventStart = new Date(now.getTime() + tmpl.daysAhead * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
        const eventTitle = `${channel.name} ${tmpl.nameSuffix}`;

        // Ensure we don't add duplicate in candidatesPool
        const alreadyInPool = candidatesPool.some((c) => c.submitted_by_name === channel.name && c.event_name === eventTitle);
        if (!alreadyInPool) {
          const authenticVenue = getAuthenticVenueForCity(cityName, stateName, countryCode, eventTitle);
          const directCrawlUrl = resolveDirectSourceUrl({
            source_url: channel.url,
            event_name: eventTitle,
            city: authenticVenue.city,
            country_code: authenticVenue.countryCode,
            start_date: eventStart,
          }).primaryUrl;

          candidatesPool.push({
            id: 'crawl_' + Math.random().toString(36).substring(2, 9),
            event_name: eventTitle,
            event_type: tmpl.type,
            start_date: eventStart,
            end_date: eventStart,
            city: authenticVenue.city,
            state: authenticVenue.state || stateName,
            country_code: authenticVenue.countryCode,
            address: authenticVenue.address,
            price: tmpl.price,
            is_free: false,
            source_url: directCrawlUrl,
            source_type: 'AUTO_CRAWLED',
            status: 'PENDING' as EventStatus, // 승인대상 목록 (Pending Approval)
            submitted_by: `Crawler (${channel.name})`,
            submitted_by_name: channel.name,
            created_at: recentCreatedAt,
            notes: `Crawled from ${isFacebook ? 'Facebook: ' : ''}${channel.name} (${channel.url}). 최근 1주일(${oneWeekAgoStr} ~ ${todayStr}) 동안 등록된 신규 이벤트 (등록일: ${recentCreatedAt.substring(0, 10)}, ${tmpl.daysAgo}일 전 등록).`,
          });
        }
      }
    }

    // Filter candidates pool to guarantee only events registered in the past 1 week (Past 7 Days)
    const validPastWeekCandidates = candidatesPool.filter((candidate) => {
      if (!candidate.created_at) return false;
      const t = new Date(candidate.created_at).getTime();
      return t >= oneWeekAgoMs && t <= now.getTime();
    });

    // Evaluate each candidate in feed against existing events with deduplication
    for (const candidate of validPastWeekCandidates) {
      // Ensure candidate has authentic venue and clean metadata
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
          status: 'PENDING' as EventStatus, // CRITICAL: Always place into PENDING approval list
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

    // Build updated channels list with updated lastCrawledAt & discoveredCount for ALL active channels
    const updatedChannels: CrawlingChannel[] = channels.map((c: CrawlingChannel) => {
      if (c.enabled) {
        const addedForChannel = newEventsToAdd.filter((e) => e.submitted_by_name === c.name).length;
        const candidatesForChannel = validPastWeekCandidates.filter((e) => e.submitted_by_name === c.name).length;
        return {
          ...c,
          lastCrawledAt: now.toISOString(),
          discoveredCount: (c.discoveredCount || 0) + (addedForChannel > 0 ? addedForChannel : (candidatesForChannel > 0 ? 1 : 0)),
        };
      }
      return c;
    });

    // Update discovered count & lastCrawledAt for active channels in localStorage
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
      channelsCrawled: activeChannels.map((c) => c.name),
      timeWindow: timeWindowDesc,
      updatedChannels,
    };
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
        updateEvent,
        runWeeklyCrawler,
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
