import { TangoEvent } from '../types';

// Compute Levenshtein distance between two strings
export function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix: number[][] = [];

  for (let i = 0; i <= bn; ++i) matrix[i] = [i];
  for (let i = 0; i <= an; ++i) matrix[0][i] = i;

  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1).toLowerCase() === a.charAt(j - 1).toLowerCase()) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

// Compute string similarity ratio (0 to 1)
export function stringSimilarity(str1: string, str2: string): number {
  const s1 = (str1 || '').toLowerCase().trim();
  const s2 = (str2 || '').toLowerCase().trim();
  if (s1 === s2) return 1.0;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s1, s2);
  return (maxLen - dist) / maxLen;
}

/**
 * Deduplication check between candidate event and existing list:
 * Evaluates duplicate if:
 * 1. Exact start_date AND same city (case-insensitive) AND name similarity > 0.65
 * OR
 * 2. Exact source_url matches
 * OR
 * 3. Exact dates overlap with identical address or event name
 */
export function isDuplicateEvent(
  candidate: Partial<TangoEvent>,
  existingEvents: TangoEvent[]
): { isDup: boolean; duplicateOf?: TangoEvent; reason?: string } {
  for (const existing of existingEvents) {
    // Exact event ID match
    if (candidate.id && existing.id && candidate.id === existing.id) {
      return {
        isDup: true,
        duplicateOf: existing,
        reason: `Matched existing event ID: ${existing.id}`,
      };
    }

    // Check source_url: Only reject on source_url if it's a specific single-event URL (e.g. /posts/, /events/1234, etc.)
    // or if the event name is identical. Do NOT reject different events sharing a group/channel hub URL!
    if (
      candidate.source_url &&
      existing.source_url &&
      candidate.source_url.trim().toLowerCase() === existing.source_url.trim().toLowerCase()
    ) {
      const sUrl = candidate.source_url.toLowerCase();
      const isGeneralHubUrl =
        (sUrl.includes('/groups/') && !sUrl.includes('/posts/') && !sUrl.includes('/permalink/') && !/\/\d{8,}/.test(sUrl)) ||
        sUrl.endsWith('/events') ||
        sUrl.endsWith('/events/') ||
        sUrl.includes('/schedule') ||
        sUrl.includes('/calendar');

      if (!isGeneralHubUrl) {
        return {
          isDup: true,
          duplicateOf: existing,
          reason: `Matched specific event source URL: ${existing.event_name}`,
        };
      } else {
        // If it's a general hub URL, only duplicate if event name or date is also identical
        if (
          candidate.event_name?.trim().toLowerCase() === existing.event_name?.trim().toLowerCase() &&
          candidate.start_date === existing.start_date
        ) {
          return {
            isDup: true,
            duplicateOf: existing,
            reason: `Identical event name ("${existing.event_name}") and date (${candidate.start_date}) from channel`,
          };
        }
      }
    }

    // Check same date + city + high name similarity
    const sameStartDate = candidate.start_date === existing.start_date;
    const sameCity =
      (candidate.city || '').trim().toLowerCase() === (existing.city || '').trim().toLowerCase();

    if (sameStartDate && sameCity) {
      const nameSim = stringSimilarity(candidate.event_name || '', existing.event_name || '');
      if (nameSim >= 0.65) {
        return {
          isDup: true,
          duplicateOf: existing,
          reason: `Same date (${candidate.start_date}) & city (${candidate.city}), Name similarity: ${(nameSim * 100).toFixed(0)}% with "${existing.event_name}"`,
        };
      }
    }

    // Check same country, date, and very high name similarity (e.g. 85%+)
    if (
      candidate.country_code === existing.country_code &&
      candidate.start_date === existing.start_date
    ) {
      const nameSim = stringSimilarity(candidate.event_name || '', existing.event_name || '');
      if (nameSim >= 0.85) {
        return {
          isDup: true,
          duplicateOf: existing,
          reason: `High similarity (${(nameSim * 100).toFixed(0)}%) in country ${candidate.country_code} on ${candidate.start_date}`,
        };
      }
    }
  }

  return { isDup: false };
}

// Simple browser-compatible SHA-256 hash
export async function hashAnswer(text: string): Promise<string> {
  const normalized = (text || '').trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Format date range: 2026-10-15(Thu) ~ 2026-10-18(Sun)
export function formatDateRange(startDateStr: string, endDateStr: string): string {
  if (!startDateStr) return '';
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const start = new Date(startDateStr + 'T00:00:00');
  const startDay = weekdays[start.getDay()];
  const startHyphen = startDateStr.replace(/[/.]/g, '-');
  const startFormatted = `${startHyphen}(${startDay})`;

  if (!endDateStr || endDateStr === startDateStr) {
    return startFormatted;
  }

  const end = new Date(endDateStr + 'T00:00:00');
  const endDay = weekdays[end.getDay()];
  const endHyphen = endDateStr.replace(/[/.]/g, '-');
  const endFormatted = `${endHyphen}(${endDay})`;

  return `${startFormatted} ~ ${endFormatted}`;
}

// Format date into 2 lines for ultra-compact display:
// Line 1: startDate(weekday) e.g. 2026-09-11(Fri)
// Line 2: ~ endDate(weekday) e.g. ~ 2026-09-13(Sun)
export function formatTwoLineDate(startDateStr: string, endDateStr: string): { start: string; end: string | null } {
  if (!startDateStr) return { start: '', end: null };
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const start = new Date(startDateStr + 'T00:00:00');
  const startDay = weekdays[start.getDay()] || '';
  const startHyphen = startDateStr.replace(/[/.]/g, '-');
  const startFormatted = `${startHyphen}(${startDay})`;

  if (!endDateStr || endDateStr === startDateStr) {
    return { start: startFormatted, end: null };
  }

  const end = new Date(endDateStr + 'T00:00:00');
  const endDay = weekdays[end.getDay()] || '';
  const endHyphen = endDateStr.replace(/[/.]/g, '-');
  const endFormatted = `~ ${endHyphen}(${endDay})`;

  return { start: startFormatted, end: endFormatted };
}

/**
 * Normalizes event title so past community materials (stories, reviews, photos)
 * can be linked when events with the same or recurring titles appear.
 * Strips 4-digit years (e.g. 2024, 2025, 2026), punctuation, and normalizes spacing.
 */
export function normalizeEventTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/\b(19|20)\d{2}\b/g, '') // remove year numbers like 2024, 2025, 2026
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // replace symbols and punctuation with space
    .trim()
    .replace(/\s+/g, ' '); // collapse extra spaces
}

