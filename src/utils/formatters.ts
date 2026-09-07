// Utility functions for formatting addresses, dates, and converting prices to USD

export interface TwoLineAddress {
  locationLine: string; // Line 1: [KR] Seoul, Gangnam
  venueLine: string;    // Line 2: El Tango Studio, Nonhyeon-dong 142-3
}

export interface ConvertedPrice {
  usdFormatted: string;      // e.g. "$133 USD" or "Free ($0)"
  originalFormatted: string; // e.g. "₩180,000"
  approxUsd: number;         // e.g. 133
  isFree: boolean;
}

// Format address cleanly into 2 lines to save horizontal table space
export function formatTwoLineAddress(event: {
  country_code: string;
  city: string;
  state?: string | null;
  address: string;
}): TwoLineAddress {
  const country = (event.country_code || '').trim().toUpperCase();
  const city = (event.city || '').trim();
  const state = (event.state || '').trim();
  
  // Line 1: Country code badge & City/State
  let locationParts: string[] = [];
  if (city) locationParts.push(city);
  if (state && state.toLowerCase() !== city.toLowerCase()) locationParts.push(state);
  
  const locationText = locationParts.join(', ') || city || country;
  const locationLine = country ? `[${country}] ${locationText}` : locationText;

  // Line 2: Venue name or street address
  const venueLine = (event.address || '').trim() || '—';

  return {
    locationLine,
    venueLine
  };
}

// Approximate real-world exchange rates to USD (September 2026 baseline)
const EXCHANGE_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  KRW: 1 / 1350,   // ₩1,350 = $1 USD
  EUR: 1.08,       // €1 = $1.08 USD
  JPY: 1 / 150,    // ¥150 = $1 USD
  CNY: 1 / 7.15,   // ¥7.15 CNY = $1 USD
  GBP: 1.30,       // £1 = $1.30 USD
  ARS: 1 / 1050,   // 1,050 ARS = $1 USD
  CAD: 0.74,       // $1 CAD = $0.74 USD
  AUD: 0.67,       // $1 AUD = $0.67 USD
  CHF: 1.15,       // 1 CHF = $1.15 USD
};

/**
 * Parses any price string (e.g. "₩180,000", "€210", "¥3,500", "$165", "Free", "€140 - €180")
 * and converts it to equivalent US Dollars ($ USD).
 * When countryCode is 'JP' (Japan), accurately parses Japanese Yen and auto-corrects legacy crawler euro defaults.
 */
export function convertPriceToUSD(
  rawPrice: string | undefined | null,
  isFreeInput?: boolean,
  countryCode?: string
): ConvertedPrice {
  if (!rawPrice || isFreeInput) {
    return {
      usdFormatted: 'Free($0)',
      originalFormatted: 'Free',
      approxUsd: 0,
      isFree: true,
    };
  }

  const isJapan = countryCode?.toUpperCase() === 'JP';
  let str = rawPrice.trim();

  // Auto-correct legacy crawler euro price bug for Japan events (€15 -> ¥2,500, €30 -> ¥5,000)
  if (isJapan && (str === '€15' || str === '€30' || str.startsWith('€'))) {
    str = str === '€30' ? '¥5,000' : '¥2,500';
  }

  const lower = str.toLowerCase();

  // Check free conditions
  if (lower.includes('free') || lower.includes('무료') || lower === '0' || lower === '$0' || lower === '€0' || lower === '₩0' || lower === '¥0') {
    return {
      usdFormatted: 'Free($0)',
      originalFormatted: str,
      approxUsd: 0,
      isFree: true,
    };
  }

  // Check donation / voluntary
  if (lower.includes('donation') || lower.includes('기부') || lower.includes('voluntary')) {
    return {
      usdFormatted: 'Donation',
      originalFormatted: str,
      approxUsd: 0,
      isFree: false,
    };
  }

  // Detect currency and numeric amounts
  let currency = 'USD';
  let rate = 1.0;

  if (str.includes('₩') || lower.includes('krw') || lower.includes('원')) {
    currency = 'KRW';
    rate = EXCHANGE_RATES_TO_USD.KRW;
  } else if (
    str.includes('¥') ||
    str.includes('￥') ||
    str.includes('円') ||
    lower.includes('jpy') ||
    lower.includes('yen') ||
    lower.includes('엔') ||
    (isJapan && !str.includes('$') && !str.includes('€') && !str.includes('£'))
  ) {
    currency = 'JPY';
    rate = EXCHANGE_RATES_TO_USD.JPY;
    // If it's a bare number for a Japan event, prefix with ¥
    if (isJapan && !str.includes('¥') && !str.includes('￥') && !str.includes('円')) {
      str = `¥${str}`;
    }
  } else if (lower.includes('cny') || lower.includes('rmb') || lower.includes('위안')) {
    currency = 'CNY';
    rate = EXCHANGE_RATES_TO_USD.CNY;
  } else if (str.includes('€') || lower.includes('eur') || lower.includes('euro')) {
    currency = 'EUR';
    rate = EXCHANGE_RATES_TO_USD.EUR;
  } else if (lower.includes('cad') || lower.includes('c$')) {
    currency = 'CAD';
    rate = EXCHANGE_RATES_TO_USD.CAD;
  } else if (str.includes('£') || lower.includes('gbp')) {
    currency = 'GBP';
    rate = EXCHANGE_RATES_TO_USD.GBP;
  } else if (lower.includes('ars') || lower.includes('peso')) {
    currency = 'ARS';
    rate = EXCHANGE_RATES_TO_USD.ARS;
  } else if (str.includes('$') || lower.includes('usd')) {
    currency = 'USD';
    rate = 1.0;
  }

  // Extract numbers from price string (handles ranges like "€120 - €180" or "₩180,000")
  const numbers = str.match(/\d[\d,.]*/g);

  if (!numbers || numbers.length === 0) {
    return {
      usdFormatted: str,
      originalFormatted: str,
      approxUsd: 0,
      isFree: false,
    };
  }

  const parseNumber = (numStr: string): number => {
    // Remove commas if used as thousands separator
    const clean = numStr.replace(/,/g, '');
    const val = parseFloat(clean);
    return isNaN(val) ? 0 : val;
  };

  if (numbers.length === 1) {
    const val = parseNumber(numbers[0]);
    const usd = Math.round(val * rate);
    
    // If it's already USD
    if (currency === 'USD') {
      return {
        usdFormatted: `$${usd}`,
        originalFormatted: str,
        approxUsd: usd,
        isFree: usd === 0,
      };
    }

    return {
      usdFormatted: `~$${usd}`,
      originalFormatted: str,
      approxUsd: usd,
      isFree: usd === 0,
    };
  } else {
    // Range of prices
    const low = Math.round(parseNumber(numbers[0]) * rate);
    const high = Math.round(parseNumber(numbers[1]) * rate);

    if (currency === 'USD') {
      return {
        usdFormatted: `$${low} - $${high}`,
        originalFormatted: str,
        approxUsd: low,
        isFree: false,
      };
    }

    return {
      usdFormatted: `~$${low} - ~$${high}`,
      originalFormatted: str,
      approxUsd: low,
      isFree: false,
    };
  }
}

export interface TwoLineCrawledDate {
  date: string;
  time: string;
}

/**
 * Formats a crawled or created_at timestamp into a 2-line display:
 * Line 1: YYYY-MM-DD
 * Line 2: HH:mm (or empty if not present)
 */
export function formatCrawledDate(createdAt?: string | null): TwoLineCrawledDate {
  if (!createdAt) return { date: '—', time: '' };
  try {
    const d = new Date(createdAt);
    if (isNaN(d.getTime())) {
      const clean = createdAt.trim();
      return {
        date: clean.substring(0, 10).replace(/-/g, '/'),
        time: clean.length > 10 ? clean.substring(11, 16) : '',
      };
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return {
      date: `${yyyy}/${mm}/${dd}`,
      time: `${hh}:${min}`,
    };
  } catch {
    return { date: String(createdAt).substring(0, 10).replace(/-/g, '/'), time: '' };
  }
}
