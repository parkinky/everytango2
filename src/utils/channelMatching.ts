import { CrawlingChannel, TangoEvent } from '../types';

/**
 * Normalizes a URL to a clean signature string for comparison.
 * Strips protocol, www, trailing slashes, and query parameters.
 */
export const normalizeUrlSignature = (urlStr: string): string => {
  if (!urlStr) return '';
  return urlStr
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\/(www\.)?/, '')
    .split('?')[0]
    .replace(/\/+$/, '');
};

/**
 * Extracts Facebook group identifier/slug if present.
 */
export const extractFacebookGroupSlug = (urlStr: string): string | null => {
  if (!urlStr) return null;
  const clean = normalizeUrlSignature(urlStr);
  const match = clean.match(/facebook\.com\/groups\/([^\/\?]+)/);
  return match ? match[1] : null;
};

/**
 * Determines whether an event strictly originates from or corresponds to a specific CrawlingChannel.
 * Strict rules:
 * 1. Direct URL/Domain Match:
 *    - If Facebook group: Must share the exact same Facebook group slug/ID.
 *    - If portal/website: The domain name must match (e.g. hoy-milonga.com, tangopolix.com, cafe.daum.net/elbulin).
 * 2. Exact City & Country Match:
 *    - The event's city must match one of the channel's designated cities.
 *    - If channel specifies a country code other than 'ALL', it must match event's country code.
 * 3. Channel Name City Match:
 *    - Channel name explicitly designates the event's city and country code matches.
 * 4. Strict Isolation:
 *    - NEVER match on country code alone or sourceType alone!
 */
export const doesEventMatchChannel = (evt: TangoEvent, ch: CrawlingChannel): boolean => {
  const chUrlSig = normalizeUrlSignature(ch.url);
  const evtUrlSig = normalizeUrlSignature(evt.source_url || '');
  const chCity = (ch.city || '').toLowerCase().trim();
  const evtCity = (evt.city || '').toLowerCase().trim();
  const chName = ch.name.toLowerCase().trim();

  // 1. Check Facebook Group match
  const chFbSlug = extractFacebookGroupSlug(ch.url);
  const evtFbSlug = extractFacebookGroupSlug(evt.source_url || '');
  if (chFbSlug && evtFbSlug) {
    if (chFbSlug === evtFbSlug) return true;
    // Different Facebook groups -> Definitely not the same channel!
    return false;
  }

  // 1-1. Direct Channel / Community Name or Submitter Match
  const evtSubName = (evt.submitted_by_name || '').toLowerCase().trim();
  const evtNotes = (evt.notes || '').toLowerCase();
  const evtCommName = ((evt as any).community_name || '').toLowerCase().trim();
  if (chName && (evtSubName === chName || evtCommName === chName || evtSubName.includes(chName) || chName.includes(evtSubName && evtSubName.length > 5 ? evtSubName : '___never___'))) {
    return true;
  }
  if (chFbSlug && (evtNotes.includes(chFbSlug) || evtUrlSig.includes(chFbSlug))) {
    return true;
  }

  // 2. Direct URL / Domain match (for non-generic domains)
  if (chUrlSig && evtUrlSig) {
    const isGenericDomain = (sig: string) =>
      sig.startsWith('facebook.com') ||
      sig.startsWith('instagram.com') ||
      sig.startsWith('twitter.com') ||
      sig.startsWith('youtube.com');

    if (!isGenericDomain(chUrlSig) && !isGenericDomain(evtUrlSig)) {
      // Compare host/domain
      const chDomain = chUrlSig.split('/')[0];
      const evtDomain = evtUrlSig.split('/')[0];
      if (chDomain === evtDomain) {
        return true;
      }
      if (evtUrlSig.includes(chUrlSig) || chUrlSig.includes(evtUrlSig)) {
        return true;
      }
    }
  }

  // 3. Exact City match (when channel defines a specific city, not 'Global')
  if (chCity && chCity !== 'global' && evtCity) {
    // Split combined city designations like "Atlanta / Birmingham" or "Seoul, Incheon"
    const channelCities = chCity
      .split(/[\/,]/)
      .map((c) => c.trim().toLowerCase())
      .filter((c) => c && c !== 'global' && c !== 'worldwide');

    if (channelCities.includes(evtCity)) {
      if (ch.country_code && ch.country_code !== 'ALL' && evt.country_code) {
        return ch.country_code.toUpperCase() === evt.country_code.toUpperCase();
      }
      return true;
    }

    // Greater Metropolitan area matches (e.g. Atlanta metro includes Roswell, Decatur, Norcross)
    if (channelCities.includes('atlanta') && ['roswell', 'decatur', 'norcross', 'sandy springs', 'marietta', 'alpharetta', 'duluth'].includes(evtCity)) {
      if (ch.country_code && ch.country_code !== 'ALL' && evt.country_code) {
        return ch.country_code.toUpperCase() === evt.country_code.toUpperCase();
      }
      return true;
    }
  }

  // 4. Channel name explicitly contains the specific city
  if (evtCity && chName.includes(evtCity)) {
    if (ch.country_code && ch.country_code !== 'ALL' && evt.country_code) {
      return ch.country_code.toUpperCase() === evt.country_code.toUpperCase();
    }
    return true;
  }

  return false;
};
