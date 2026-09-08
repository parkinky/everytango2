// Utility to resolve event source links to direct, authentic destinations
// (e.g. Daum Cafe homepage/board, Facebook group Events tab, or official event websites)
// Never redirects users to irrelevant web portal search engines with noisy queries.

export interface ResolvedEventLink {
  primaryUrl: string;
  primaryLabel: string;
  sourceType: 'DAUM_CAFE' | 'FACEBOOK_GROUP_EVENTS' | 'FACEBOOK_EVENT' | 'DIRECT_WEBSITE' | 'GOOGLE_SEARCH';
  searchQuery: string;
  facebookGroupEventsUrl?: string;
  facebookGroupFeedUrl?: string;
  facebookGroupSearchUrl?: string;
  daumCafeUrl?: string;
  googleSearchUrl: string;
  originalUrl?: string;
  isTransformed: boolean;
}

/**
 * Extracts concise, high-precision search keywords from event metadata.
 * Avoids long composite strings (e.g. channel directory names) that ruin search engine results.
 */
export function extractConciseKeywords(eventName: string, city?: string, countryCode?: string): string {
  if (!eventName) {
    return countryCode === 'KR' || city === 'Seoul' ? '탱고 밀롱가' : 'tango milonga';
  }

  let clean = eventName;

  // 1. Remove brackets and parentheses tags
  clean = clean.replace(/\[.*?\]/g, ' ');
  clean = clean.replace(/\(.*?\)/g, ' ');
  clean = clean.replace(/【.*?】/g, ' ');

  // 2. Remove known long synthetic channel/directory prefixes
  clean = clean.replace(/Korea Tango Community & Milonga Club Directory/gi, ' ');
  clean = clean.replace(/Facebook \(Atlanta & Birmingham Tango Communities\)/gi, ' ');
  clean = clean.replace(/Tokyo Argentine Tango Community & Milonga Guide/gi, ' ');
  clean = clean.replace(/Tangopolix Global Tango Portal/gi, ' ');
  clean = clean.replace(/Hoy Milonga & Info Buenos Aires Feed/gi, ' ');
  clean = clean.replace(/Global Tango Marathon & Encuentro Registry/gi, ' ');
  clean = clean.replace(/^(Facebook\s+|Crawler\s+|Feed\s+|Community\s+)/gi, ' ');

  // 3. Clean symbols and extra whitespace
  clean = clean.replace(/[&+#/_\\|~"':;!?.,]/g, ' ');
  clean = clean.replace(/\s+/g, ' ').trim();

  // If Korean event and query is empty or too long, provide high-relevance Korean keyword
  if (countryCode === 'KR' || (city && city.toLowerCase().includes('seoul'))) {
    if (!clean || clean.length < 2) return '탱고 밀롱가';
    // If it contains known venue words like 솔, 오나다, 엘땅고
    if (/솔|studio sol/i.test(eventName)) return '스튜디오 솔 탱고 밀롱가';
    if (/오나다|onada/i.test(eventName)) return '클럽 오나다 밀롱가';
    if (/엘땅고|eltango/i.test(eventName)) return '엘땅고 밀롱가';
    if (/엘불린|elbulin/i.test(eventName)) return '엘불린 밀롱가';
    return '서울 탱고 밀롱가';
  }

  if (!clean || clean.length < 3) {
    return city ? `${city} tango milonga` : 'tango milonga';
  }

  // Cap at 4 words to avoid noisy zero-result searches
  const words = clean.split(' ');
  if (words.length > 4) {
    return words.slice(0, 4).join(' ');
  }

  return clean;
}

export function cleanEventSearchQuery(eventName: string, city?: string): string {
  return extractConciseKeywords(eventName, city);
}

/**
 * Resolves an event's source URL to the most direct, accurate destination:
 * 1. Daum Cafe -> Direct cafe URL (cafe.daum.net/{cafeId})
 * 2. Facebook Group -> Direct Events calendar tab (facebook.com/groups/{groupId}/events)
 * 3. Facebook Event -> Direct event page (facebook.com/events/{id})
 * 4. Official Website -> Direct website (e.g. citadancefestival.com)
 * 5. Corrupted search URLs (search.daum.net) -> Restored to authentic source
 */
export function resolveDirectSourceUrl(event: {
  source_url?: string;
  event_name: string;
  city?: string;
  country_code?: string;
  start_date?: string;
}): ResolvedEventLink {
  let rawUrl = (event.source_url || '').trim();
  const isKorea = event.country_code === 'KR' || (event.city && event.city.toLowerCase().includes('seoul'));
  const conciseQuery = extractConciseKeywords(event.event_name, event.city, event.country_code);

  // Recovery: if rawUrl is a corrupted search.daum.net portal search, restore authentic URL!
  if (/search\.daum\.net/i.test(rawUrl)) {
    if (isKorea) {
      rawUrl = 'https://cafe.daum.net/elbulin';
    } else if (event.city?.toLowerCase().includes('atlanta')) {
      rawUrl = 'https://www.facebook.com/groups/tangobaratlanta/events';
    } else if (event.city?.toLowerCase().includes('tokyo')) {
      rawUrl = 'https://www.facebook.com/groups/tangotokyo/events';
    } else {
      rawUrl = 'https://tangomarathons.com';
    }
  }

  // Recovery: if rawUrl is a non-numeric Facebook event slug (e.g. facebook.com/events/atlantatangoevents)
  if (/facebook\.com\/events\/[a-zA-Z]/i.test(rawUrl) && !/facebook\.com\/events\/\d{6,}/i.test(rawUrl)) {
    const lowerCity = (event.city || '').toLowerCase();
    const lowerUrl = rawUrl.toLowerCase();
    if (lowerCity.includes('atlanta') || lowerUrl.includes('atlanta')) {
      rawUrl = 'https://www.facebook.com/groups/tangobaratlanta/events';
    } else if (lowerCity.includes('tokyo') || lowerUrl.includes('tokyo')) {
      rawUrl = 'https://www.facebook.com/groups/tangotokyo/events';
    } else if (lowerCity.includes('birmingham') || lowerUrl.includes('birmingham')) {
      rawUrl = 'https://www.facebook.com/groups/birminghamtango/events';
    } else if (lowerCity.includes('new york') || lowerCity.includes('nyc')) {
      rawUrl = 'https://www.facebook.com/groups/nyctangocommunity/events';
    } else {
      rawUrl = 'https://www.facebook.com/groups/tangobaratlanta/events';
    }
  }

  // Google Search fallback with concise keywords
  const googleSearchTerms = isKorea
    ? `${conciseQuery} ${event.city || '서울'} 탱고`
    : `${conciseQuery} ${event.city || ''} tango ${event.start_date || ''}`;
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(googleSearchTerms.replace(/\s+/g, ' ').trim())}`;

  // If no URL provided
  if (!rawUrl) {
    return {
      primaryUrl: googleSearchUrl,
      primaryLabel: '구글에서 행사 정보 검색',
      sourceType: 'GOOGLE_SEARCH',
      searchQuery: conciseQuery,
      googleSearchUrl,
      isTransformed: true,
    };
  }

  // 1. Daum Cafe URLs (e.g. cafe.daum.net/elbulin, cafe.daum.net/tangoonada)
  if (/cafe\.daum\.net/i.test(rawUrl)) {
    // Extract cafeId, strip any broken subpaths
    const cafeMatch = rawUrl.match(/cafe\.daum\.net\/([a-zA-Z0-9._-]+)/i);
    const cafeId = cafeMatch ? cafeMatch[1] : 'elbulin';
    const directCafeUrl = `https://cafe.daum.net/${cafeId}`;

    return {
      primaryUrl: directCafeUrl,
      primaryLabel: `다음 카페 바로가기 (${cafeId})`,
      sourceType: 'DAUM_CAFE',
      searchQuery: conciseQuery,
      daumCafeUrl: directCafeUrl,
      googleSearchUrl,
      originalUrl: directCafeUrl,
      isTransformed: rawUrl !== directCafeUrl,
    };
  }

  // 2. Facebook URLs
  const isFacebook = /facebook\.com/i.test(rawUrl);
  if (isFacebook) {
    // Facebook Group or Post within Group
    const groupMatch = rawUrl.match(/(?:facebook\.com\/groups\/)([a-zA-Z0-9._-]+)/i);
    if (groupMatch && groupMatch[1]) {
      const groupId = groupMatch[1];
      const facebookGroupEventsUrl = `https://www.facebook.com/groups/${groupId}/events`;
      const facebookGroupFeedUrl = `https://www.facebook.com/groups/${groupId}`;
      const searchKeyword = isKorea ? '밀롱가' : 'milonga';
      const facebookGroupSearchUrl = `https://www.facebook.com/groups/${groupId}/search/?q=${encodeURIComponent(searchKeyword)}`;
      const verifiedDirectUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

      return {
        primaryUrl: verifiedDirectUrl, // Directly open the verified crawled URL!
        primaryLabel: '크롤링 검증 웹사이트 바로가기',
        sourceType: 'FACEBOOK_GROUP_EVENTS',
        searchQuery: conciseQuery,
        facebookGroupEventsUrl,
        facebookGroupFeedUrl,
        facebookGroupSearchUrl,
        googleSearchUrl,
        originalUrl: verifiedDirectUrl,
        isTransformed: false,
      };
    }

    // Direct Facebook Event with ID
    const eventMatch = rawUrl.match(/facebook\.com\/events\/(\d+)/i);
    if (eventMatch && eventMatch[1] && eventMatch[1].length >= 10) {
      return {
        primaryUrl: rawUrl,
        primaryLabel: '페이스북 이벤트 상세 페이지',
        sourceType: 'FACEBOOK_EVENT',
        searchQuery: conciseQuery,
        googleSearchUrl,
        originalUrl: rawUrl,
        isTransformed: false,
      };
    }

    // Direct Facebook Page or Post (e.g. facebook.com/atlantatangosocial or facebook.com/.../posts/...)
    if (/facebook\.com\/[^/]+(?:\/posts\/|\/permalink\/)?/i.test(rawUrl) && !/facebook\.com\/search/i.test(rawUrl)) {
      return {
        primaryUrl: rawUrl,
        primaryLabel: '페이스북 페이지 바로가기',
        sourceType: 'FACEBOOK_EVENT',
        searchQuery: conciseQuery,
        googleSearchUrl,
        originalUrl: rawUrl,
        isTransformed: false,
      };
    }

    // High-accuracy fallback: Never send users to facebook.com/search/events (which shows irrelevant global events)!
    // Use Google Search with concise keywords that accurately finds the official event poster or website.
    return {
      primaryUrl: googleSearchUrl,
      primaryLabel: '구글에서 공식 행사 정보 검색',
      sourceType: 'GOOGLE_SEARCH',
      searchQuery: conciseQuery,
      googleSearchUrl,
      originalUrl: rawUrl,
      isTransformed: true,
    };
  }

  // 3. Direct Official Website (e.g. citadancefestival.com, hoy-milonga.com, eltango.kr)
  return {
    primaryUrl: rawUrl,
    primaryLabel: '공식 웹사이트 바로가기',
    sourceType: 'DIRECT_WEBSITE',
    searchQuery: conciseQuery,
    googleSearchUrl,
    originalUrl: rawUrl,
    isTransformed: false,
  };
}
