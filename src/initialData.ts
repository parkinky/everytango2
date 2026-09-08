import { TangoEvent } from './types';

// Helper to calculate date offsets relative to today
export function getDateOffset(days: number): string {
  const base = new Date();
  base.setDate(base.getDate() + days);
  return base.toISOString().split('T')[0];
}

// Initial curated tango events - reset to empty array for fresh start per user request
export const INITIAL_EVENTS: TangoEvent[] = [];

// Potential newly scraped events - reset to empty array for fresh start
export const CRAWLER_FEED_CANDIDATES: TangoEvent[] = [];
