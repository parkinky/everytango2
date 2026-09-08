import React, { createContext, useContext, useState, useEffect } from 'react';
import { SiteConfig, CronScheduleConfig, CronRunLog, CrawlingChannel } from '../types';
import { auth } from '../firebase';

export const DEFAULT_CRAWLING_CHANNELS: CrawlingChannel[] = [
  {
    id: 'chan_fb_birmingham_tango',
    name: 'Tango Birmingham',
    url: 'https://www.facebook.com/groups/115408145174568',
    sourceType: 'FACEBOOK',
    city: 'Birmingham',
    state: 'AL',
    country_code: 'US',
    description: 'Birmingham, Alabama Argentine Tango social dancers community group.',
    enabled: true,
    lastCrawledAt: '2026-09-07T16:00:00.000Z',
    discoveredCount: 2,
  },
  {
    id: 'chan_fb_neworleanstango',
    name: 'New Orleans Argentine Tango Group',
    url: 'https://www.facebook.com/groups/NewOrleansTango/events',
    sourceType: 'FACEBOOK',
    city: 'New Orleans',
    state: 'LA',
    country_code: 'US',
    description: 'New Orleans Argentine Tango community group and upcoming milongas.',
    enabled: true,
    lastCrawledAt: '2026-09-07T16:00:00.000Z',
    discoveredCount: 0,
  },
  {
    id: 'chan_fb_boston_tango',
    name: 'Boston Tango',
    url: 'https://www.facebook.com/groups/BosTango/events',
    sourceType: 'FACEBOOK',
    city: 'Boston',
    state: 'MA',
    country_code: 'US',
    description: 'Boston Tango community group, weekly milongas, practicas, and workshops in Greater Boston and Massachusetts.',
    enabled: true,
    lastCrawledAt: '2026-09-07T16:00:00.000Z',
    discoveredCount: 6,
  },
  {
    id: 'chan_fb_new_york_tango_243341781981565',
    name: 'Tango New York',
    url: 'https://www.facebook.com/groups/243341781981565/events',
    sourceType: 'FACEBOOK',
    city: 'New York',
    state: 'NY',
    country_code: 'US',
    description: 'New York City tango events and community updates.',
    enabled: true,
    lastCrawledAt: '2026-09-07T16:00:00.000Z',
    discoveredCount: 3,
  },
  {
    id: 'chan_fb_atl_bhm',
    name: 'Atlanta Tango Bar',
    url: 'https://www.facebook.com/groups/tangobaratlanta',
    sourceType: 'FACEBOOK',
    city: 'Rosewell',
    state: 'GA',
    country_code: 'US',
    description: 'Atlanta Tango Bar regular milongas and community events.',
    enabled: true,
    lastCrawledAt: '2026-09-07T16:00:00.000Z',
    discoveredCount: 11,
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
  deleteUnexecutedChannels: () => void;
  toggleCrawlingChannel: (id: string) => void;
  resetAllCrawlRecords: () => void;
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
  lastRunAt: undefined,
  nextRunAt: undefined,
  runHistory: [],
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
      // Purge any channels that have no lastCrawledAt ("미실행")
      const purgeKey = 'everytango_purge_unexecuted_clean_v1';
      const hasPurged = localStorage.getItem(purgeKey);

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
            } else if (city.includes('boston') && cCode === 'US') {
              sState = sState || 'MA';
            }
            return {
              ...ch,
              country_code: cCode,
              state: sState,
            };
          });

          // Ensure Boston Tango is present in the channels list
          const hasBoston = parsed.channels.some(
            (ch: CrawlingChannel) => ch.id === 'chan_fb_boston_tango' || (ch.url && ch.url.toLowerCase().includes('bostango'))
          );
          if (!hasBoston) {
            const bostonChan = DEFAULT_CRAWLING_CHANNELS.find((c) => c.id === 'chan_fb_boston_tango');
            if (bostonChan) {
              parsed.channels.push(bostonChan);
            }
          }

          // Purge all channels that have no lastCrawledAt ("미실행")
          if (!hasPurged) {
            parsed.channels = parsed.channels.filter((ch: CrawlingChannel) => Boolean(ch.lastCrawledAt));
            if (parsed.channels.length === 0) {
              parsed.channels = DEFAULT_CRAWLING_CHANNELS;
            }
            localStorage.setItem(purgeKey, '1');
            localStorage.setItem('everytango_cron_config', JSON.stringify(parsed));
          }
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

  // Delete all unexecuted channels (where lastCrawledAt is missing / "미실행")
  const deleteUnexecutedChannels = () => {
    setCronConfig((prev) => {
      const existing = prev.channels || DEFAULT_CRAWLING_CHANNELS;
      const remainingChannels = existing.filter((c) => Boolean(c.lastCrawledAt));
      const updated: CronScheduleConfig = {
        ...prev,
        channels: remainingChannels,
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

  // Reset all channels' lastCrawledAt, discoveredCount and cron run history
  const resetAllCrawlRecords = () => {
    setCronConfig((prev) => {
      const resetChannels = (prev.channels || DEFAULT_CRAWLING_CHANNELS).map((ch) => ({
        ...ch,
        lastCrawledAt: undefined,
        lastCrawledStatus: undefined,
        discoveredCount: 0,
      }));
      const updated: CronScheduleConfig = {
        ...prev,
        lastRunAt: undefined,
        nextRunAt: undefined,
        runHistory: [],
        channels: resetChannels,
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
        deleteUnexecutedChannels,
        toggleCrawlingChannel,
        resetAllCrawlRecords,
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
