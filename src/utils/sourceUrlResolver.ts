// Utility to resolve event source links to direct, search-targeted destinations
// Specifically resolving Facebook group homepages or simulated post IDs
// into direct in-group search results, event searches, or Google fallbacks.

export interface ResolvedEventLink {
  primaryUrl: string;
  primaryLabel: string;
  sourceType: 'FACEBOOK_GROUP_SEARCH' | 'FACEBOOK_EVENTS_SEARCH' | 'GOOGLE_SEARCH' | 'DIRECT_WEBSITE';
  searchQuery: string;
  facebookGroupSearchUrl?: string;
  facebookGlobalEventsUrl?: string;
  facebookGlobalSearchUrl?: string;
  googleSearchUrl: string;
  originalUrl?: string;
  isTransformed: boolean;
}

/**
 * Extracts a clean, high-precision search query from event metadata.
 * Strips technical bot tags, parentheses, channel noise, and special symbols.
 */
export function cleanEventSearchQuery(eventName: string, city?: string): string {
  if (!eventName) return city ? `${city} tango` : 'tango';

  let clean = eventName;

  // 1. Remove brackets and parentheses content like [Bot], [Auto], (Seoul Tango People), etc.
  clean = clean.replace(/\[.*?\]/g, ' ');
  clean = clean.replace(/\(.*?\)/g, ' ');
  clean = clean.replace(/【.*?】/g, ' ');

  // 2. Remove common crawler prefix tags if present
  clean = clean.replace(/^(Facebook\s+|Crawler\s+|Feed\s+)/i, '');

  // 3. Replace symbols like &, +, /, _, |, # with spaces
  clean = clean.replace(/[&+#/_\\|~]/g, ' ');

  // 4. Remove punctuation marks
  clean = clean.replace(/["'`:;!?.,]/g, ' ');

  // 5. Collapse multiple whitespace into single space
  clean = clean.replace(/\s+/g, ' ').trim();

  // If query became too short or empty, fallback with city
  if (!clean || clean.length < 3) {
    return city ? `${city} tango milonga` : 'tango milonga';
  }

  return clean;
}

/**
 * Resolves an event's source URL to the most direct, accurate search destination.
 */
export function resolveDirectSourceUrl(event: {
  source_url?: string;
  event_name: string;
  city?: string;
  country_code?: string;
  start_date?: string;
}): ResolvedEventLink {
  const rawUrl = (event.source_url || '').trim();
  const cleanQuery = cleanEventSearchQuery(event.event_name, event.city);
  const encodedQuery = encodeURIComponent(cleanQuery);

  // Fallback Google search URL (works anywhere, no login needed)
  const googleSearchTerms = `${cleanQuery} ${event.city || ''} tango ${event.start_date || ''}`.replace(/\s+/g, ' ').trim();
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(googleSearchTerms)}`;

  // Global Facebook events search URL
  const facebookGlobalEventsUrl = `https://www.facebook.com/search/events/?q=${encodedQuery}`;
  const facebookGlobalSearchUrl = `https://www.facebook.com/search/top/?q=${encodedQuery}`;

  // If no URL provided at all
  if (!rawUrl) {
    return {
      primaryUrl: googleSearchUrl,
      primaryLabel: '구글에서 행사 정보 검색',
      sourceType: 'GOOGLE_SEARCH',
      searchQuery: cleanQuery,
      facebookGlobalEventsUrl,
      facebookGlobalSearchUrl,
      googleSearchUrl,
      isTransformed: true,
    };
  }

  const isFacebook = /facebook\.com/i.test(rawUrl);

  if (isFacebook) {
    // Check if it is a Facebook Group URL
    const groupMatch = rawUrl.match(/(?:facebook\.com\/groups\/)([a-zA-Z0-9._-]+)/i);

    if (groupMatch && groupMatch[1]) {
      const groupId = groupMatch[1];
      const facebookGroupSearchUrl = `https://www.facebook.com/groups/${groupId}/search/?q=${encodedQuery}`;

      // If the rawUrl was already specifically pointing to a search query, keep it
      if (rawUrl.includes('/search/?q=') || rawUrl.includes('/search?q=')) {
        return {
          primaryUrl: rawUrl,
          primaryLabel: '페이스북 그룹 내 검색 결과',
          sourceType: 'FACEBOOK_GROUP_SEARCH',
          searchQuery: cleanQuery,
          facebookGroupSearchUrl: rawUrl,
          facebookGlobalEventsUrl,
          facebookGlobalSearchUrl,
          googleSearchUrl,
          originalUrl: rawUrl,
          isTransformed: false,
        };
      }

      // If it's a generic group URL or a dummy post/event ID (e.g. /posts/8839201941),
      // transform it to the in-group search query URL so the user immediately finds the material!
      return {
        primaryUrl: facebookGroupSearchUrl,
        primaryLabel: '페이스북 그룹 내 검색 결과',
        sourceType: 'FACEBOOK_GROUP_SEARCH',
        searchQuery: cleanQuery,
        facebookGroupSearchUrl,
        facebookGlobalEventsUrl,
        facebookGlobalSearchUrl,
        googleSearchUrl,
        originalUrl: rawUrl,
        isTransformed: true,
      };
    }

    // Check if it is a Facebook Events URL (without a specific real numeric ID)
    if (rawUrl.includes('/events') && !rawUrl.match(/\/events\/\d{12,}/)) {
      return {
        primaryUrl: facebookGlobalEventsUrl,
        primaryLabel: '페이스북 이벤트 검색 결과',
        sourceType: 'FACEBOOK_EVENTS_SEARCH',
        searchQuery: cleanQuery,
        facebookGlobalEventsUrl,
        facebookGlobalSearchUrl,
        googleSearchUrl,
        originalUrl: rawUrl,
        isTransformed: true,
      };
    }

    // If it's another Facebook URL without a specific group
    return {
      primaryUrl: facebookGlobalSearchUrl,
      primaryLabel: '페이스북 통합 검색 결과',
      sourceType: 'FACEBOOK_EVENTS_SEARCH',
      searchQuery: cleanQuery,
      facebookGlobalEventsUrl,
      facebookGlobalSearchUrl,
      googleSearchUrl,
      originalUrl: rawUrl,
      isTransformed: true,
    };
  }

  // Daum Cafe handling (e.g. cafe.daum.net/elbulin)
  if (/cafe\.daum\.net/i.test(rawUrl)) {
    const daumSearchUrl = `https://search.daum.net/search?w=tot&q=${encodeURIComponent(`${cleanQuery} 탱고`)}`;
    return {
      primaryUrl: daumSearchUrl,
      primaryLabel: '다음 포털 검색 결과',
      sourceType: 'DIRECT_WEBSITE',
      searchQuery: cleanQuery,
      googleSearchUrl,
      originalUrl: rawUrl,
      isTransformed: true,
    };
  }

  // Dedicated official website (e.g. citadancefestival.com, tangoencuentroseoul.kr)
  return {
    primaryUrl: rawUrl,
    primaryLabel: '공식 웹사이트 바로가기',
    sourceType: 'DIRECT_WEBSITE',
    searchQuery: cleanQuery,
    facebookGlobalEventsUrl,
    facebookGlobalSearchUrl,
    googleSearchUrl,
    originalUrl: rawUrl,
    isTransformed: false,
  };
}
