import { TangoEvent } from '../types';

interface CityDirectoryEntry {
  state: string;
  countryCode?: string;
}

export const CITY_STATE_DIRECTORY: Record<string, CityDirectoryEntry> = {
  // United States (US)
  'atlanta': { state: 'GA', countryCode: 'US' },
  'savannah': { state: 'GA', countryCode: 'US' },
  'augusta': { state: 'GA', countryCode: 'US' },
  'athens': { state: 'GA', countryCode: 'US' },
  'macon': { state: 'GA', countryCode: 'US' },
  'columbus': { state: 'GA', countryCode: 'US' },
  'new york': { state: 'NY', countryCode: 'US' },
  'new york city': { state: 'NY', countryCode: 'US' },
  'nyc': { state: 'NY', countryCode: 'US' },
  'brooklyn': { state: 'NY', countryCode: 'US' },
  'queens': { state: 'NY', countryCode: 'US' },
  'manhattan': { state: 'NY', countryCode: 'US' },
  'bronx': { state: 'NY', countryCode: 'US' },
  'staten island': { state: 'NY', countryCode: 'US' },
  'albany': { state: 'NY', countryCode: 'US' },
  'buffalo': { state: 'NY', countryCode: 'US' },
  'rochester': { state: 'NY', countryCode: 'US' },
  'syracuse': { state: 'NY', countryCode: 'US' },
  'los angeles': { state: 'CA', countryCode: 'US' },
  'san francisco': { state: 'CA', countryCode: 'US' },
  'san diego': { state: 'CA', countryCode: 'US' },
  'san jose': { state: 'CA', countryCode: 'US' },
  'sacramento': { state: 'CA', countryCode: 'US' },
  'oakland': { state: 'CA', countryCode: 'US' },
  'long beach': { state: 'CA', countryCode: 'US' },
  'pasadena': { state: 'CA', countryCode: 'US' },
  'berkeley': { state: 'CA', countryCode: 'US' },
  'santa barbara': { state: 'CA', countryCode: 'US' },
  'santa monica': { state: 'CA', countryCode: 'US' },
  'irvine': { state: 'CA', countryCode: 'US' },
  'fresno': { state: 'CA', countryCode: 'US' },
  'palm springs': { state: 'CA', countryCode: 'US' },
  'chicago': { state: 'IL', countryCode: 'US' },
  'evanston': { state: 'IL', countryCode: 'US' },
  'naperville': { state: 'IL', countryCode: 'US' },
  'rockford': { state: 'IL', countryCode: 'US' },
  'springfield': { state: 'IL', countryCode: 'US' },
  'miami': { state: 'FL', countryCode: 'US' },
  'orlando': { state: 'FL', countryCode: 'US' },
  'tampa': { state: 'FL', countryCode: 'US' },
  'fort lauderdale': { state: 'FL', countryCode: 'US' },
  'ft lauderdale': { state: 'FL', countryCode: 'US' },
  'jacksonville': { state: 'FL', countryCode: 'US' },
  'st petersburg': { state: 'FL', countryCode: 'US' },
  'saint petersburg': { state: 'FL', countryCode: 'US' },
  'tallahassee': { state: 'FL', countryCode: 'US' },
  'key west': { state: 'FL', countryCode: 'US' },
  'gainesville': { state: 'FL', countryCode: 'US' },
  'austin': { state: 'TX', countryCode: 'US' },
  'houston': { state: 'TX', countryCode: 'US' },
  'dallas': { state: 'TX', countryCode: 'US' },
  'san antonio': { state: 'TX', countryCode: 'US' },
  'fort worth': { state: 'TX', countryCode: 'US' },
  'el paso': { state: 'TX', countryCode: 'US' },
  'arlington': { state: 'TX', countryCode: 'US' },
  'plano': { state: 'TX', countryCode: 'US' },
  'seattle': { state: 'WA', countryCode: 'US' },
  'tacoma': { state: 'WA', countryCode: 'US' },
  'spokane': { state: 'WA', countryCode: 'US' },
  'bellevue': { state: 'WA', countryCode: 'US' },
  'olympia': { state: 'WA', countryCode: 'US' },
  'portland': { state: 'OR', countryCode: 'US' },
  'eugene': { state: 'OR', countryCode: 'US' },
  'salem': { state: 'OR', countryCode: 'US' },
  'bend': { state: 'OR', countryCode: 'US' },
  'boston': { state: 'MA', countryCode: 'US' },
  'cambridge': { state: 'MA', countryCode: 'US' },
  'worcester': { state: 'MA', countryCode: 'US' },
  'philadelphia': { state: 'PA', countryCode: 'US' },
  'pittsburgh': { state: 'PA', countryCode: 'US' },
  'allentown': { state: 'PA', countryCode: 'US' },
  'harrisburg': { state: 'PA', countryCode: 'US' },
  'scranton': { state: 'PA', countryCode: 'US' },
  'washington': { state: 'DC', countryCode: 'US' },
  'washington dc': { state: 'DC', countryCode: 'US' },
  'washington d.c.': { state: 'DC', countryCode: 'US' },
  'denver': { state: 'CO', countryCode: 'US' },
  'boulder': { state: 'CO', countryCode: 'US' },
  'colorado springs': { state: 'CO', countryCode: 'US' },
  'fort collins': { state: 'CO', countryCode: 'US' },
  'aspen': { state: 'CO', countryCode: 'US' },
  'vail': { state: 'CO', countryCode: 'US' },
  'las vegas': { state: 'NV', countryCode: 'US' },
  'reno': { state: 'NV', countryCode: 'US' },
  'phoenix': { state: 'AZ', countryCode: 'US' },
  'tucson': { state: 'AZ', countryCode: 'US' },
  'scottsdale': { state: 'AZ', countryCode: 'US' },
  'tempe': { state: 'AZ', countryCode: 'US' },
  'flagstaff': { state: 'AZ', countryCode: 'US' },
  'salt lake city': { state: 'UT', countryCode: 'US' },
  'provo': { state: 'UT', countryCode: 'US' },
  'park city': { state: 'UT', countryCode: 'US' },
  'minneapolis': { state: 'MN', countryCode: 'US' },
  'saint paul': { state: 'MN', countryCode: 'US' },
  'st paul': { state: 'MN', countryCode: 'US' },
  'duluth': { state: 'MN', countryCode: 'US' },
  'detroit': { state: 'MI', countryCode: 'US' },
  'ann arbor': { state: 'MI', countryCode: 'US' },
  'grand rapids': { state: 'MI', countryCode: 'US' },
  'lansing': { state: 'MI', countryCode: 'US' },
  'cleveland': { state: 'OH', countryCode: 'US' },
  'cincinnati': { state: 'OH', countryCode: 'US' },
  'toledo': { state: 'OH', countryCode: 'US' },
  'akron': { state: 'OH', countryCode: 'US' },
  'indianapolis': { state: 'IN', countryCode: 'US' },
  'bloomington': { state: 'IN', countryCode: 'US' },
  'nashville': { state: 'TN', countryCode: 'US' },
  'memphis': { state: 'TN', countryCode: 'US' },
  'knoxville': { state: 'TN', countryCode: 'US' },
  'chattanooga': { state: 'TN', countryCode: 'US' },
  'new orleans': { state: 'LA', countryCode: 'US' },
  'baton rouge': { state: 'LA', countryCode: 'US' },
  'baltimore': { state: 'MD', countryCode: 'US' },
  'annapolis': { state: 'MD', countryCode: 'US' },
  'bethesda': { state: 'MD', countryCode: 'US' },
  'silver spring': { state: 'MD', countryCode: 'US' },
  'charlotte': { state: 'NC', countryCode: 'US' },
  'raleigh': { state: 'NC', countryCode: 'US' },
  'durham': { state: 'NC', countryCode: 'US' },
  'asheville': { state: 'NC', countryCode: 'US' },
  'charleston': { state: 'SC', countryCode: 'US' },
  'columbia': { state: 'SC', countryCode: 'US' },
  'greenville': { state: 'SC', countryCode: 'US' },
  'st louis': { state: 'MO', countryCode: 'US' },
  'saint louis': { state: 'MO', countryCode: 'US' },
  'kansas city': { state: 'MO', countryCode: 'US' },
  'milwaukee': { state: 'WI', countryCode: 'US' },
  'madison': { state: 'WI', countryCode: 'US' },
  'albuquerque': { state: 'NM', countryCode: 'US' },
  'santa fe': { state: 'NM', countryCode: 'US' },
  'honolulu': { state: 'HI', countryCode: 'US' },
  'anchorage': { state: 'AK', countryCode: 'US' },
  'richmond': { state: 'VA', countryCode: 'US' },
  'virginia beach': { state: 'VA', countryCode: 'US' },
  'norfolk': { state: 'VA', countryCode: 'US' },
  'alexandria': { state: 'VA', countryCode: 'US' },
  'charlottesville': { state: 'VA', countryCode: 'US' },
  'louisville': { state: 'KY', countryCode: 'US' },
  'lexington': { state: 'KY', countryCode: 'US' },
  'providence': { state: 'RI', countryCode: 'US' },
  'hartford': { state: 'CT', countryCode: 'US' },
  'new haven': { state: 'CT', countryCode: 'US' },
  'stamford': { state: 'CT', countryCode: 'US' },
  'newark': { state: 'NJ', countryCode: 'US' },
  'jersey city': { state: 'NJ', countryCode: 'US' },
  'princeton': { state: 'NJ', countryCode: 'US' },
  'omaha': { state: 'NE', countryCode: 'US' },
  'des moines': { state: 'IA', countryCode: 'US' },
  'boise': { state: 'ID', countryCode: 'US' },
  'oklahoma city': { state: 'OK', countryCode: 'US' },
  'tulsa': { state: 'OK', countryCode: 'US' },
  'birmingham': { state: 'AL', countryCode: 'US' },

  // Canada (CA)
  'toronto': { state: 'ON', countryCode: 'CA' },
  'ottawa': { state: 'ON', countryCode: 'CA' },
  'hamilton': { state: 'ON', countryCode: 'CA' },
  'london, on': { state: 'ON', countryCode: 'CA' },
  'montreal': { state: 'QC', countryCode: 'CA' },
  'quebec': { state: 'QC', countryCode: 'CA' },
  'quebec city': { state: 'QC', countryCode: 'CA' },
  'vancouver': { state: 'BC', countryCode: 'CA' },
  'victoria': { state: 'BC', countryCode: 'CA' },
  'burnaby': { state: 'BC', countryCode: 'CA' },
  'richmond bc': { state: 'BC', countryCode: 'CA' },
  'kelowna': { state: 'BC', countryCode: 'CA' },
  'calgary': { state: 'AB', countryCode: 'CA' },
  'edmonton': { state: 'AB', countryCode: 'CA' },
  'banff': { state: 'AB', countryCode: 'CA' },
  'winnipeg': { state: 'MB', countryCode: 'CA' },
  'halifax': { state: 'NS', countryCode: 'CA' },

  // Argentina (AR)
  'buenos aires': { state: 'CABA', countryCode: 'AR' },
  'caba': { state: 'CABA', countryCode: 'AR' },
  'capital federal': { state: 'CABA', countryCode: 'AR' },
  'rosario': { state: 'Santa Fe', countryCode: 'AR' },
  'cordoba': { state: 'Córdoba', countryCode: 'AR' },
  'córdoba': { state: 'Córdoba', countryCode: 'AR' },
  'mendoza': { state: 'Mendoza', countryCode: 'AR' },
  'mar del plata': { state: 'Buenos Aires', countryCode: 'AR' },
  'la plata': { state: 'Buenos Aires', countryCode: 'AR' },
  'san carlos de bariloche': { state: 'Río Negro', countryCode: 'AR' },
  'bariloche': { state: 'Río Negro', countryCode: 'AR' },
  'salta': { state: 'Salta', countryCode: 'AR' },
  'tucuman': { state: 'Tucumán', countryCode: 'AR' },

  // South Korea (KR)
  'seoul': { state: 'Seoul', countryCode: 'KR' },
  'busan': { state: 'Busan', countryCode: 'KR' },
  'incheon': { state: 'Incheon', countryCode: 'KR' },
  'daegu': { state: 'Daegu', countryCode: 'KR' },
  'daejeon': { state: 'Daejeon', countryCode: 'KR' },
  'gwangju': { state: 'Gwangju', countryCode: 'KR' },
  'ulsan': { state: 'Ulsan', countryCode: 'KR' },
  'suwon': { state: 'Gyeonggi-do', countryCode: 'KR' },
  'seongnam': { state: 'Gyeonggi-do', countryCode: 'KR' },
  'jeju': { state: 'Jeju-do', countryCode: 'KR' },

  // Australia (AU)
  'sydney': { state: 'NSW', countryCode: 'AU' },
  'melbourne': { state: 'VIC', countryCode: 'AU' },
  'brisbane': { state: 'QLD', countryCode: 'AU' },
  'perth': { state: 'WA', countryCode: 'AU' },
  'adelaide': { state: 'SA', countryCode: 'AU' },
  'gold coast': { state: 'QLD', countryCode: 'AU' },
  'canberra': { state: 'ACT', countryCode: 'AU' },
  'hobart': { state: 'TAS', countryCode: 'AU' },

  // Germany (DE)
  'berlin': { state: 'Berlin', countryCode: 'DE' },
  'munich': { state: 'Bavaria', countryCode: 'DE' },
  'hamburg': { state: 'Hamburg', countryCode: 'DE' },
  'frankfurt': { state: 'Hesse', countryCode: 'DE' },
  'cologne': { state: 'NRW', countryCode: 'DE' },
  'stuttgart': { state: 'Baden-Württemberg', countryCode: 'DE' },
  'dusseldorf': { state: 'NRW', countryCode: 'DE' },
  'leipzig': { state: 'Saxony', countryCode: 'DE' },
  'dresden': { state: 'Saxony', countryCode: 'DE' },

  // Italy (IT)
  'rome': { state: 'Lazio', countryCode: 'IT' },
  'milan': { state: 'Lombardy', countryCode: 'IT' },
  'florence': { state: 'Tuscany', countryCode: 'IT' },
  'turin': { state: 'Piedmont', countryCode: 'IT' },
  'bologna': { state: 'Emilia-Romagna', countryCode: 'IT' },
  'naples': { state: 'Campania', countryCode: 'IT' },
  'venice': { state: 'Veneto', countryCode: 'IT' },

  // Spain (ES)
  'madrid': { state: 'Madrid', countryCode: 'ES' },
  'barcelona': { state: 'Catalonia', countryCode: 'ES' },
  'valencia': { state: 'Valencia', countryCode: 'ES' },
  'seville': { state: 'Andalusia', countryCode: 'ES' },
  'malaga': { state: 'Andalusia', countryCode: 'ES' },
  'bilbao': { state: 'Basque Country', countryCode: 'ES' },

  // France (FR)
  'paris': { state: 'Île-de-France', countryCode: 'FR' },
  'lyon': { state: 'Auvergne-Rhône-Alpes', countryCode: 'FR' },
  'marseille': { state: 'Provence-Alpes-Côte d\'Azur', countryCode: 'FR' },
  'toulouse': { state: 'Occitanie', countryCode: 'FR' },
  'nice': { state: 'Provence-Alpes-Côte d\'Azur', countryCode: 'FR' },

  // United Kingdom (GB)
  'london': { state: 'Greater London', countryCode: 'GB' },
  'manchester': { state: 'Greater Manchester', countryCode: 'GB' },
  'edinburgh': { state: 'Scotland', countryCode: 'GB' },
  'birmingham, uk': { state: 'West Midlands', countryCode: 'GB' },
  'bristol': { state: 'South West', countryCode: 'GB' },

  'burlington': { state: 'VT', countryCode: 'US' },

  // Japan (JP)
  'tokyo': { state: 'Tokyo', countryCode: 'JP' },
  'osaka': { state: 'Osaka', countryCode: 'JP' },
  'kyoto': { state: 'Kyoto', countryCode: 'JP' },
  'fukuoka': { state: 'Fukuoka', countryCode: 'JP' },
  'sapporo': { state: 'Hokkaido', countryCode: 'JP' },
  'yokohama': { state: 'Kanagawa', countryCode: 'JP' },
};

/**
 * Parses user input that might combine city and state (e.g. "Atlanta, GA" or "Austin, TX")
 */
export function parseCityStateInput(input: string): { city: string; state?: string } {
  const trimmed = input.trim();
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map((p) => p.trim());
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return {
        city: parts[0],
        state: parts[1].toUpperCase(),
      };
    }
  }
  return { city: trimmed };
}

/**
 * Given a city input, recommends the most probable state/province
 * by consulting existing tango events first, and falling back to a comprehensive city directory.
 * Supports prefix matching for real-time typing recommendations.
 */
export function recommendStateForCity(
  cityInput: string,
  countryCode?: string,
  events?: TangoEvent[]
): { state: string; countryCode?: string; source: 'event_database' | 'city_directory'; matchedCity?: string } | null {
  const clean = cityInput.trim().toLowerCase();
  if (!clean) return null;

  // Handle combined "City, State" input e.g. "Atlanta, GA"
  if (clean.includes(',')) {
    const parsed = parseCityStateInput(cityInput);
    if (parsed.state) {
      return {
        state: parsed.state,
        countryCode: countryCode || 'US',
        source: 'city_directory',
        matchedCity: parsed.city,
      };
    }
  }

  // 1. Search existing events first (real database matching)
  if (events && events.length > 0) {
    // Exact match with matching country if provided
    const matchWithCountry = events.find(
      (e) =>
        e.city &&
        e.city.trim().toLowerCase() === clean &&
        e.state &&
        (!countryCode || e.country_code?.toUpperCase() === countryCode.toUpperCase())
    );
    if (matchWithCountry && matchWithCountry.state) {
      return {
        state: matchWithCountry.state,
        countryCode: matchWithCountry.country_code,
        source: 'event_database',
        matchedCity: matchWithCountry.city,
      };
    }

    // Exact match regardless of country
    const anyCityMatch = events.find(
      (e) => e.city && e.city.trim().toLowerCase() === clean && e.state
    );
    if (anyCityMatch && anyCityMatch.state) {
      return {
        state: anyCityMatch.state,
        countryCode: anyCityMatch.country_code,
        source: 'event_database',
        matchedCity: anyCityMatch.city,
      };
    }
  }

  // 2. Exact City-State Map lookup
  const entry = CITY_STATE_DIRECTORY[clean];
  if (entry) {
    return {
      state: entry.state,
      countryCode: entry.countryCode,
      source: 'city_directory',
      matchedCity: cityInput.trim(),
    };
  }

  // 3. Prefix matching fallback for user typing in real-time (min 3 chars)
  if (clean.length >= 3) {
    const prefixKey = Object.keys(CITY_STATE_DIRECTORY).find((k) => k.startsWith(clean));
    if (prefixKey) {
      const pEntry = CITY_STATE_DIRECTORY[prefixKey];
      // Format matched city capitalized
      const formattedCity = prefixKey
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return {
        state: pEntry.state,
        countryCode: pEntry.countryCode,
        source: 'city_directory',
        matchedCity: formattedCity,
      };
    }
  }

  return null;
}
