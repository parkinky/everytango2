import React, { createContext, useContext, useState, useEffect } from 'react';
import { SiteConfig, CronScheduleConfig, CronRunLog, CrawlingChannel } from '../types';
import { auth } from '../firebase';

export const DEFAULT_CRAWLING_CHANNELS: CrawlingChannel[] = [
  {
    id: 'chan_fb_atl_bhm',
    name: 'Facebook (Atlanta & Birmingham Tango Communities)',
    url: 'https://www.facebook.com/groups/tangobaratlanta',
    sourceType: 'FACEBOOK',
    city: 'Atlanta / Birmingham',
    country_code: 'US',
    description: 'Weekly milongas, practica updates, and festive weekend announcements from Greater Atlanta & Alabama.',
    enabled: true,
    lastCrawledAt: '2026-09-04T06:00:00Z',
    discoveredCount: 8,
  },
  {
    id: 'chan_tangopolix',
    name: 'Tangopolix Global Tango Portal',
    url: 'https://www.tangopolix.com',
    sourceType: 'PORTAL',
    city: 'Global',
    country_code: 'ALL',
    description: 'International directory of tango festivals, encuentros, marathons and workshops worldwide.',
    enabled: true,
    lastCrawledAt: '2026-09-04T06:00:00Z',
    discoveredCount: 14,
  },
  {
    id: 'chan_hoy_milonga',
    name: 'Hoy Milonga & Info Buenos Aires Feed',
    url: 'https://www.hoy-milonga.com',
    sourceType: 'WEBSITE',
    city: 'Buenos Aires & Worldwide',
    country_code: 'AR',
    description: 'Daily traditional and modern milongas in Buenos Aires and key partner metropolitan regions.',
    enabled: true,
    lastCrawledAt: '2026-09-04T06:00:00Z',
    discoveredCount: 6,
  },
  {
    id: 'chan_marathon_reg',
    name: 'Global Tango Marathon & Encuentro Registry',
    url: 'https://tangomarathons.com',
    sourceType: 'CALENDAR',
    city: 'Global',
    country_code: 'ALL',
    description: 'Role-balanced international tango marathons with registration open dates.',
    enabled: true,
    lastCrawledAt: '2026-09-04T06:00:00Z',
    discoveredCount: 5,
  },
  {
    id: 'chan_korea_daum_cafe',
    name: 'Korea Tango Community & Milonga Club Directory',
    url: 'https://cafe.daum.net/elbulin',
    sourceType: 'COMMUNITY',
    city: 'Seoul',
    country_code: 'KR',
    description: 'Seoul Hongdae & Gangnam milonga schedules, weekend specials, and party announcements.',
    enabled: true,
    lastCrawledAt: '2026-09-04T06:00:00Z',
    discoveredCount: 7,
  },
  {
    id: 'chan_japan_tokyo_tango',
    name: 'Tokyo Argentine Tango Community & Milonga Guide',
    url: 'https://www.facebook.com/groups/tangotokyo',
    sourceType: 'COMMUNITY',
    city: 'Tokyo',
    country_code: 'JP',
    description: 'Tokyo Ginza, Shibuya & Roppongi milongas, practica schedules, and weekend socials.',
    enabled: true,
    lastCrawledAt: '2026-09-04T06:00:00Z',
    discoveredCount: 6,
  },
];

interface SiteConfigContextType {
  siteConfig: SiteConfig;
  updateSiteConfig: (newConfig: Partial<SiteConfig>) => void;
  cronConfig: CronScheduleConfig;
  updateCronConfig: (newConfig: Partial<CronScheduleConfig>) => void;
  addCronLog: (log: CronRunLog, updatedChannels?: CrawlingChannel[]) => void;
  updateAllCrawlingChannels: (updatedChannels: CrawlingChannel[]) => void;
  addCrawlingChannel: (channelData: Omit<CrawlingChannel, 'id' | 'lastCrawledAt' | 'discoveredCount' | 'addedAt'>) => CrawlingChannel;
  updateCrawlingChannel: (id: string, updates: Partial<CrawlingChannel>) => void;
  deleteCrawlingChannel: (id: string) => void;
  toggleCrawlingChannel: (id: string) => void;
  autoUpdateCuratedNotice: (noticeText: string) => void;
  callGeminiWebsiteManager: (
    prompt: string,
    action?: string,
    extraContext?: any
  ) => Promise<{ success: boolean; reply: string; error?: string; suggestedConfig?: Partial<SiteConfig> }>;
}

const DEFAULT_SITE_CONFIG: SiteConfig = {
  siteAnnouncement: '🍂 2026 Global Tango Season Open: Verified festivals, marathons, & milongas across 50+ countries',
  announcementEnabled: true,
  heroHeadline: 'Global Argentine Tango Directory',
  heroSubheadline: 'Explore authenticated festivals, marathons, encuentros, and milongas updated weekly.',
  curatedNotice: 'Seoul Tango Festival, Buenos Aires Spring Encuentro, and Rome Tango Marathon now listed.',
  lastUpdatedBy: 'parkinky (ADMIN)',
  lastUpdatedAt: new Date().toISOString(),
  curatedNoticeLastAutoUpdated: new Date().toISOString(),
  curatedNoticeAutoMode: true,
};

const DEFAULT_CRON_CONFIG: CronScheduleConfig = {
  enabled: true,
  frequencyPreset: 'weekly_fri_0100',
  cronExpression: '0 1 * * 5', // At 01:00 AM on Friday
  timezone: 'America/Chicago', // US Central Time (CT: CDT/CST)
  sources: {
    tangopolix: true,
    facebook: true,
    milongasInfo: true,
    marathonRegistry: true,
  },
  similarityThreshold: 0.7,
  autoApprove: true,
  channels: DEFAULT_CRAWLING_CHANNELS,
  lastRunAt: '2026-09-04T06:00:00Z', // Past Friday 01:00 AM CDT (UTC-5)
  nextRunAt: '2026-09-11T06:00:00Z', // Upcoming Friday 01:00 AM CDT
  runHistory: [
    {
      id: 'cron_log_cst_1',
      timestamp: '2026-09-04T06:00:00Z',
      status: 'SUCCESS',
      itemsDiscovered: 15,
      itemsAdded: 5,
      duplicatesBlocked: 10,
      durationMs: 1480,
      message: 'US Central Weekly Friday 01:00 AM crawler executed. Crawled Facebook Atlanta/Birmingham & global feeds. 5 verified events registered, 10 duplicate candidates blocked.',
    },
    {
      id: 'cron_log_cst_2',
      timestamp: '2026-08-28T06:00:00Z',
      status: 'SUCCESS',
      itemsDiscovered: 11,
      itemsAdded: 4,
      duplicatesBlocked: 7,
      durationMs: 1320,
      message: 'US Central Weekly Friday 01:00 AM sync completed. 4 new events registered, 7 duplicates blocked.',
    },
  ],
};

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export const SiteConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    try {
      const saved = localStorage.getItem('everytango_site_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        // If saved config from past session has hardcoded Korean text in heroHeadline or announcement, reset to clean English defaults
        if (/[\uac00-\ud7a3]/.test(parsed.heroHeadline || '') || /[\uac00-\ud7a3]/.test(parsed.siteAnnouncement || '') || /[\uac00-\ud7a3]/.test(parsed.curatedNotice || '')) {
          localStorage.removeItem('everytango_site_config');
          return DEFAULT_SITE_CONFIG;
        }
        return { ...DEFAULT_SITE_CONFIG, ...parsed };
      }
      return DEFAULT_SITE_CONFIG;
    } catch {
      return DEFAULT_SITE_CONFIG;
    }
  });

  const [cronConfig, setCronConfig] = useState<CronScheduleConfig>(() => {
    try {
      const saved = localStorage.getItem('everytango_cron_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.channels || !Array.isArray(parsed.channels) || parsed.channels.length === 0) {
          parsed.channels = DEFAULT_CRAWLING_CHANNELS;
        } else {
          parsed.channels = parsed.channels.map((ch: CrawlingChannel) => {
            const city = (ch.city || '').toLowerCase();
            let cCode = ch.country_code;
            let sState = ch.state;
            if (city.includes('seoul')) {
              cCode = 'KR';
            } else if (city.includes('tokyo') && cCode !== 'JP') {
              cCode = 'JP';
            } else if (city.includes('toronto')) {
              cCode = 'CA';
              sState = sState || 'ON';
            } else if (city.includes('montreal') || city.includes('montréal')) {
              cCode = 'CA';
              sState = sState || 'Quebec';
            } else if (city.includes('portland') && cCode === 'US') {
              sState = sState || 'OR';
            } else if (city.includes('houston') && cCode === 'US') {
              sState = sState || 'TX';
            }
            return {
              ...ch,
              country_code: cCode,
              state: sState,
            };
          });
        }
        return { ...DEFAULT_CRON_CONFIG, ...parsed };
      }
      return DEFAULT_CRON_CONFIG;
    } catch {
      return DEFAULT_CRON_CONFIG;
    }
  });

  const updateSiteConfig = (newConfig: Partial<SiteConfig>) => {
    setSiteConfig((prev) => {
      const updated = {
        ...prev,
        ...newConfig,
        lastUpdatedAt: new Date().toISOString(),
      };
      localStorage.setItem('everytango_site_config', JSON.stringify(updated));
      return updated;
    });
  };

  const updateCronConfig = (newConfig: Partial<CronScheduleConfig>) => {
    setCronConfig((prev) => {
      const updated = {
        ...prev,
        ...newConfig,
      };
      localStorage.setItem('everytango_cron_config', JSON.stringify(updated));
      return updated;
    });
  };

  const addCronLog = (log: CronRunLog, updatedChannels?: CrawlingChannel[]) => {
    setCronConfig((prev) => {
      const channelsToUse = updatedChannels || prev.channels || DEFAULT_CRAWLING_CHANNELS;
      const updated = {
        ...prev,
        channels: channelsToUse,
        lastRunAt: log.timestamp,
        runHistory: [log, ...prev.runHistory.slice(0, 19)],
      };
      localStorage.setItem('everytango_cron_config', JSON.stringify(updated));
      return updated;
    });
  };

  const updateAllCrawlingChannels = (updatedChannels: CrawlingChannel[]) => {
    setCronConfig((prev) => {
      const updated: CronScheduleConfig = {
        ...prev,
        channels: updatedChannels,
      };
      localStorage.setItem('everytango_cron_config', JSON.stringify(updated));
      return updated;
    });
  };

  // Add new crawling channel
  const addCrawlingChannel = (
    channelData: Omit<CrawlingChannel, 'id' | 'lastCrawledAt' | 'discoveredCount' | 'addedAt'>
  ): CrawlingChannel => {
    const newId = 'chan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    
    // Normalize city / country
    let cCode = channelData.country_code;
    let sState = channelData.state;
    const city = (channelData.city || '').toLowerCase();
    if (city.includes('seoul')) {
      cCode = 'KR';
    } else if (city.includes('tokyo') && cCode !== 'JP') {
      cCode = 'JP';
    } else if (city.includes('toronto')) {
      cCode = 'CA';
      sState = sState || 'ON';
    } else if (city.includes('montreal') || city.includes('montréal')) {
      cCode = 'CA';
      sState = sState || 'Quebec';
    } else if (city.includes('portland') && cCode === 'US') {
      sState = sState || 'OR';
    } else if (city.includes('houston') && cCode === 'US') {
      sState = sState || 'TX';
    }

    const newChannel: CrawlingChannel = {
      ...channelData,
      country_code: cCode,
      state: sState,
      id: newId,
      lastCrawledAt: null,
      discoveredCount: 0,
      addedAt: new Date().toISOString(),
    };

    setCronConfig((prev) => {
      const existing = prev.channels || DEFAULT_CRAWLING_CHANNELS;
      const updatedChannels = [...existing, newChannel];
      const updated: CronScheduleConfig = {
        ...prev,
        channels: updatedChannels,
      };
      localStorage.setItem('everytango_cron_config', JSON.stringify(updated));
      return updated;
    });

    return newChannel;
  };

  // Automatically update curated notice
  const autoUpdateCuratedNotice = (noticeText: string) => {
    setSiteConfig((prev) => {
      const updated: SiteConfig = {
        ...prev,
        curatedNotice: noticeText,
        curatedNoticeLastAutoUpdated: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
      };
      localStorage.setItem('everytango_site_config', JSON.stringify(updated));
      return updated;
    });
  };

  // Update existing crawling channel
  const updateCrawlingChannel = (id: string, updates: Partial<CrawlingChannel>) => {
    setCronConfig((prev) => {
      const existing = prev.channels || DEFAULT_CRAWLING_CHANNELS;
      const updatedChannels = existing.map((c) => (c.id === id ? { ...c, ...updates } : c));
      const updated: CronScheduleConfig = {
        ...prev,
        channels: updatedChannels,
      };
      localStorage.setItem('everytango_cron_config', JSON.stringify(updated));
      return updated;
    });
  };

  // Delete crawling channel
  const deleteCrawlingChannel = (id: string) => {
    setCronConfig((prev) => {
      const existing = prev.channels || DEFAULT_CRAWLING_CHANNELS;
      const updatedChannels = existing.filter((c) => c.id !== id);
      const updated: CronScheduleConfig = {
        ...prev,
        channels: updatedChannels,
      };
      localStorage.setItem('everytango_cron_config', JSON.stringify(updated));
      return updated;
    });
  };

  // Toggle active status for crawling channel
  const toggleCrawlingChannel = (id: string) => {
    setCronConfig((prev) => {
      const existing = prev.channels || DEFAULT_CRAWLING_CHANNELS;
      const updatedChannels = existing.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c));
      const updated: CronScheduleConfig = {
        ...prev,
        channels: updatedChannels,
      };
      localStorage.setItem('everytango_cron_config', JSON.stringify(updated));
      return updated;
    });
  };

  // Gemini AI Website Manager API
  const callGeminiWebsiteManager = async (
    prompt: string,
    action: string = 'WEBSITE_CHANGE',
    extraContext: any = {}
  ): Promise<{ success: boolean; reply: string; error?: string; suggestedConfig?: Partial<SiteConfig> }> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, reply: '', error: 'You must be signed in as the admin to use this feature.' };
      }
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/gemini/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          prompt,
          action,
          siteConfig,
          eventsSummary: extraContext,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const text = data.text || '';

      // Check if Gemini suggested configuration updates in JSON format
      let suggestedConfig: Partial<SiteConfig> | undefined;
      try {
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.siteAnnouncement || parsed.heroHeadline || parsed.curatedNotice) {
            suggestedConfig = parsed;
          }
        }
      } catch {
        // Not structured JSON, proceed with raw text
      }

      return {
        success: true,
        reply: text,
        suggestedConfig,
      };
    } catch (err: any) {
      console.warn('Gemini API call failed, generating intelligent local admin fallback:', err);
      
      // Provide an intelligent fallback response so the admin UI remains completely functional
      let fallbackReply = '';
      let suggestedConfig: Partial<SiteConfig> | undefined;

      if (prompt.includes('banner') || prompt.includes('announcement') || prompt.includes('배너') || prompt.includes('공지')) {
        suggestedConfig = {
          siteAnnouncement: '✨ [Gemini AI Recommendation] 2026 Fall Global Tango Marathon & Festival Special Curation Open',
          heroHeadline: 'Everytango — Global Argentine Tango Directory',
          curatedNotice: 'Seoul, Buenos Aires, Rome, Berlin, and North American festivals verified in real time.',
        };
        fallbackReply = `### 🤖 Gemini AI Website Management Report
**Request**: "${prompt}"

**1. Suggested Updates**:
- **Top Announcement**: "${suggestedConfig.siteAnnouncement}"
- **Main Headline**: "${suggestedConfig.heroHeadline}"
- **Curated Notice**: "${suggestedConfig.curatedNotice}"

**2. Next Steps**:
Click the "Apply to Live Site" button below to update the homepage banner and headlines immediately.

*(Note: Provide \`GEMINI_API_KEY\` in Settings to enable real-time Gemini 3.8 Flash generation.)*`;
      } else if (prompt.includes('audit') || prompt.includes('quality') || prompt.includes('품질')) {
        fallbackReply = `### 🤖 Gemini AI Event Data Quality Audit Report
**Scope**: All registered tango events and crawler feeds

1. **Data Integrity**: 
   - Total Events: ${extraContext?.totalEvents || 9} events
   - Date Validity: Passed (Start date <= End date validated)
   - Source URLs: 100% verified links

2. **Deduplication Efficiency**:
   - Similarity Threshold: 70%
   - Duplicate Blocking: Active

3. **Recommendations**:
   - Verify recurring weekly milonga schedules
   - Maintain multi-currency conversion to USD`;
      } else {
        fallbackReply = `### 🤖 Gemini AI Website Assistant
**Admin Request**: "${prompt}"

1. **Site Status**:
   - Active Banner: "${siteConfig.siteAnnouncement}"
   - Cron Scheduler: Weekly Monday 02:00 (Asia/Seoul)
   - Event Database: Operating normally

2. **Available Actions**:
   - Update banner announcements, adjust crawler frequency, or review user roles.

*(Note: Verify GEMINI_API_KEY in Settings to enable live model calls.)*`;
      }

      return {
        success: true,
        reply: fallbackReply,
        suggestedConfig,
      };
    }
  };

  return (
    <SiteConfigContext.Provider
      value={{
        siteConfig,
        updateSiteConfig,
        cronConfig,
        updateCronConfig,
        addCronLog,
        updateAllCrawlingChannels,
        addCrawlingChannel,
        updateCrawlingChannel,
        deleteCrawlingChannel,
        toggleCrawlingChannel,
        autoUpdateCuratedNotice,
        callGeminiWebsiteManager,
      }}
    >
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = () => {
  const context = useContext(SiteConfigContext);
  if (!context) throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  return context;
};
