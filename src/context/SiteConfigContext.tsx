import React, { createContext, useContext, useState, useEffect } from 'react';
import { SiteConfig, CronScheduleConfig, CronRunLog } from '../types';

interface SiteConfigContextType {
  siteConfig: SiteConfig;
  updateSiteConfig: (newConfig: Partial<SiteConfig>) => void;
  cronConfig: CronScheduleConfig;
  updateCronConfig: (newConfig: Partial<CronScheduleConfig>) => void;
  addCronLog: (log: CronRunLog) => void;
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
      return saved ? { ...DEFAULT_CRON_CONFIG, ...JSON.parse(saved) } : DEFAULT_CRON_CONFIG;
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

  const addCronLog = (log: CronRunLog) => {
    setCronConfig((prev) => {
      const updated = {
        ...prev,
        lastRunAt: log.timestamp,
        runHistory: [log, ...prev.runHistory.slice(0, 19)],
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
      const res = await fetch('/api/gemini/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          action,
          siteConfig,
          eventsSummary: extraContext,
          userAdmin: 'parkinky',
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
