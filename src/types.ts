export type UserRole = 'USER' | 'ADMIN';

export type EventType = 'FESTIVAL' | 'MARATHON' | 'ENCUENTRO' | 'WORKSHOP' | 'MILONGA';

export type EventStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type SourceType = 'AUTO_CRAWLED' | 'MANUAL' | 'FACEBOOK';

export interface UserSecurityQuestion {
  question_number: 1 | 2 | 3;
  question_text: string;
  answer_hash: string; // SHA-256 normalized hash
}

export interface UserProfile {
  id: string; // uid
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  country_code: string;
  state?: string;
  city: string;
  phone: string;
  role: UserRole;
  created_at: string;
  security_questions?: UserSecurityQuestion[];
  password_hash?: string;
  last_login?: string;
}

export interface SiteConfig {
  siteAnnouncement: string;
  announcementEnabled: boolean;
  heroHeadline: string;
  heroSubheadline: string;
  curatedNotice: string;
  heroBackgroundImage?: string; // Custom uploaded background photo
  lastUpdatedBy: string;
  lastUpdatedAt: string;
  curatedNoticeLastAutoUpdated?: string;
  curatedNoticeAutoMode?: boolean;
}

export interface CronRunLog {
  id: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  itemsDiscovered: number;
  itemsAdded: number;
  duplicatesBlocked: number;
  durationMs: number;
  message: string;
}

export interface CrawlingChannel {
  id: string;
  name: string;
  url: string;
  sourceType: 'FACEBOOK' | 'PORTAL' | 'CALENDAR' | 'WEBSITE' | 'COMMUNITY' | 'INSTAGRAM' | 'OTHER';
  city?: string;
  state?: string;
  country_code?: string;
  description?: string;
  enabled: boolean;
  lastCrawledAt?: string | null;
  discoveredCount?: number;
  addedAt?: string;
}

export interface CronScheduleConfig {
  enabled: boolean;
  frequencyPreset: 'weekly_fri_0100' | 'weekly_mon' | 'daily_0200' | 'daily_0400' | 'every_6h' | 'every_12h' | 'custom';
  cronExpression: string;
  timezone: string;
  sources: {
    tangopolix: boolean;
    facebook: boolean;
    milongasInfo: boolean;
    marathonRegistry: boolean;
    [key: string]: boolean;
  };
  channels?: CrawlingChannel[];
  similarityThreshold: number;
  autoApprove: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  runHistory: CronRunLog[];
}

export interface TangoEvent {
  id: string;
  event_name: string;
  event_type: EventType;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  city: string;
  state?: string;
  country_code: string; // ISO 3166-1 alpha-2 (e.g., US, AR, KR, ES, DE, IT)
  address: string;
  price: string;       // e.g. "$150", "€120", "₩40,000", "Free"
  is_free?: boolean;
  source_url: string;
  source_type: SourceType;
  status: EventStatus;
  submitted_by?: string | null;
  submitted_by_name?: string | null;
  submitted_by_email?: string | null;
  created_at: string;
  notes?: string;
  similarity_hash?: string; // used for auto deduplication
}

export interface EventFilterState {
  search: string;
  types: EventType[];
  country_code: string;
  city: string;
  state: string;
  date_quick_range: 'all' | '1m' | '3m' | '6m' | 'custom';
  start_date: string;
  end_date: string;
  price_filter: 'all' | 'free' | 'paid';
}

export interface EventExperience {
  id: string;
  event_id: string;
  event_name: string;
  normalized_title: string; // Used to match recurring editions of the same event
  author_id: string;        // 작성자 ID (User ID or login handle)
  author_name: string;      // 작성자 닉네임 / Display Name
  content: string;          // 후기 및 팁 / Review & tips
  rating?: number;          // 1-5 rating
  photos: string[];         // 사진 URL / base64 image data strings
  attendance_year?: string; // 참석 연도 e.g. "2024", "2025"
  created_at: string;       // 작성일자 (ISO string)
}

export type SupportedLanguage = 'en' | 'ko' | 'es' | 'ja' | 'zh';
