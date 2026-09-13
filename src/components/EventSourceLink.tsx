import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, ChevronDown, Search, Facebook, Globe, Calendar, Coffee } from 'lucide-react';
import { TangoEvent, SupportedLanguage } from '../types';
import { resolveDirectSourceUrl, ResolvedEventLink } from '../utils/sourceUrlResolver';
import { translations } from '../i18n';

interface EventSourceLinkProps {
  event: TangoEvent;
  className?: string;
  showDropdown?: boolean;
  label?: string;
  currentLang?: SupportedLanguage;
}

export const EventSourceLink: React.FC<EventSourceLinkProps> = ({
  event,
  className = '',
  showDropdown = true,
  label,
  currentLang = 'en',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = translations[currentLang] || translations.en;

  const resolved: ResolvedEventLink = resolveDirectSourceUrl({
    source_url: event.source_url,
    event_name: event.event_name,
    city: event.city,
    country_code: event.country_code,
    start_date: event.start_date,
  });

  // 1. 크롤링 시 검증된 웹사이트 주소 추출 (사용자 요청: 빨간색 아이콘 클릭 시 크롤링 검증 주소로 바로 이동)
  const rawSource = (event.source_url || '').trim();
  let directVerifiedUrl = '';

  if (rawSource) {
    if (/^https?:\/\//i.test(rawSource)) {
      directVerifiedUrl = rawSource;
    } else {
      directVerifiedUrl = `https://${rawSource}`;
    }
    // 이전 search.daum.net 포털 검색 오류 주소는 복구된 정규 주소로 치환
    if (/search\.daum\.net/i.test(directVerifiedUrl)) {
      directVerifiedUrl = resolved.primaryUrl;
    }
    // 이전 비정상 슬러그(atlantatangoevents)는 애틀랜타 정규 커뮤니티 일정표로 치환
    if (/facebook\.com\/events\/atlantatangoevents/i.test(directVerifiedUrl)) {
      directVerifiedUrl = 'https://www.facebook.com/groups/tangobaratlanta/events';
    }
  } else {
    // source_url이 아예 없는 경우에만 구글 검색으로 대체
    directVerifiedUrl = resolved.primaryUrl || resolved.googleSearchUrl;
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const tooltipTitle = `${t.eventLinks.directVerifiedTooltip} ${directVerifiedUrl}`;

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={menuRef}>
      {/* Primary Direct Link Button: 크롤링할 때 검증한 웹사이트 주소로 바로 이동 */}
      <a
        href={directVerifiedUrl}
        target="_blank"
        rel="noreferrer noopener"
        title={tooltipTitle}
        className="text-red-600 hover:text-red-700 font-semibold text-xs hover:underline inline-flex items-center gap-1 p-1 rounded hover:bg-red-50 transition-colors"
      >
        {label && <span>{label}</span>}
        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
      </a>

      {/* Dropdown toggle for multi-destination options */}
      {showDropdown && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            title={t.eventLinks.moreOptionsTooltip}
            className="p-0.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <ChevronDown className="w-2.5 h-2.5" />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 text-left text-xs font-normal animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 border-b border-gray-100 bg-gray-50/70">
                <span className="text-[11px] font-bold text-gray-700 block">{t.eventLinks.menuHeader}</span>
                <span className="text-[10px] text-gray-500 truncate block">{t.eventLinks.eventLabel} {event.event_name}</span>
              </div>

              {/* Verified Crawled URL */}
              {directVerifiedUrl && (
                <a
                  href={directVerifiedUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 hover:bg-red-50 text-gray-800 hover:text-red-700 flex items-center gap-2 transition-colors border-b border-gray-100"
                >
                  <Globe className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-[11px] text-red-700">{t.eventLinks.officialWebsite}</div>
                    <div className="text-[10px] text-gray-500 truncate max-w-[190px]" title={directVerifiedUrl}>
                      {directVerifiedUrl}
                    </div>
                  </div>
                </a>
              )}

              {/* 1. Daum Cafe */}
              {resolved.daumCafeUrl && (
                <a
                  href={resolved.daumCafeUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 hover:bg-amber-50 text-gray-800 hover:text-amber-800 flex items-center gap-2 transition-colors"
                >
                  <Coffee className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-[11px]">{t.eventLinks.daumCafe}</div>
                    <div className="text-[10px] text-gray-500 truncate max-w-[180px]">{resolved.daumCafeUrl}</div>
                  </div>
                </a>
              )}

              {/* 2. Facebook Group Events Tab */}
              {resolved.facebookGroupEventsUrl && (
                <a
                  href={resolved.facebookGroupEventsUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 hover:bg-blue-50 text-gray-800 hover:text-blue-700 flex items-center gap-2 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-[11px]">{t.eventLinks.fbCalendar}</div>
                    <div className="text-[10px] text-gray-500">{t.eventLinks.fbCalendarDesc}</div>
                  </div>
                </a>
              )}

              {/* 3. Facebook Group Main Feed */}
              {resolved.facebookGroupFeedUrl && (
                <a
                  href={resolved.facebookGroupFeedUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 hover:bg-blue-50 text-gray-800 hover:text-blue-700 flex items-center gap-2 transition-colors"
                >
                  <Facebook className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <div>
                    <div className="font-semibold text-[11px]">{t.eventLinks.fbFeed}</div>
                    <div className="text-[10px] text-gray-500">{t.eventLinks.fbFeedDesc}</div>
                  </div>
                </a>
              )}

              {/* 4. Facebook Group In-Group Search */}
              {resolved.facebookGroupSearchUrl && (
                <a
                  href={resolved.facebookGroupSearchUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 hover:bg-blue-50 text-gray-800 hover:text-blue-700 flex items-center gap-2 transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <div>
                    <div className="font-semibold text-[11px]">{t.eventLinks.fbSearch}</div>
                    <div className="text-[10px] text-gray-500">{t.eventLinks.fbSearchDesc}</div>
                  </div>
                </a>
              )}

              {/* 5. Google Search Fallback */}
              <a
                href={resolved.googleSearchUrl}
                target="_blank"
                rel="noreferrer noopener"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 hover:bg-emerald-50 text-gray-800 hover:text-emerald-700 flex items-center gap-2 transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-semibold text-[11px]">{t.eventLinks.googleSearch}</div>
                  <div className="text-[10px] text-gray-500">{t.eventLinks.googleSearchDesc}</div>
                </div>
              </a>

              {/* 6. Original Home URL if available */}
              {resolved.originalUrl && resolved.originalUrl !== resolved.primaryUrl && (
                <a
                  href={resolved.originalUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 hover:bg-gray-50 text-gray-600 hover:text-gray-900 flex items-center gap-2 border-t border-gray-100 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-[11px]">{t.eventLinks.originalSource}</div>
                    <div className="text-[10px] text-gray-400 truncate max-w-[180px]">{resolved.originalUrl}</div>
                  </div>
                </a>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
