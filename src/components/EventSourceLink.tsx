import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, ChevronDown, Search, Facebook, Globe, Calendar } from 'lucide-react';
import { TangoEvent } from '../types';
import { resolveDirectSourceUrl, ResolvedEventLink } from '../utils/sourceUrlResolver';

interface EventSourceLinkProps {
  event: TangoEvent;
  className?: string;
  showDropdown?: boolean;
  label?: string;
}

export const EventSourceLink: React.FC<EventSourceLinkProps> = ({
  event,
  className = '',
  showDropdown = true,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const resolved: ResolvedEventLink = resolveDirectSourceUrl({
    source_url: event.source_url,
    event_name: event.event_name,
    city: event.city,
    country_code: event.country_code,
    start_date: event.start_date,
  });

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

  const tooltipTitle = `${resolved.primaryLabel}: "${resolved.searchQuery}"`;

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={menuRef}>
      {/* Primary Direct Link Button */}
      <a
        href={resolved.primaryUrl}
        target="_blank"
        rel="noreferrer noopener"
        title={tooltipTitle}
        className="text-red-600 hover:text-red-700 font-semibold text-xs hover:underline inline-flex items-center gap-1 p-1 rounded hover:bg-red-50 transition-colors"
      >
        {label && <span>{label}</span>}
        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
      </a>

      {/* Optional dropdown toggle for multi-destination options */}
      {showDropdown && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            title="검색 옵션 더보기 (페이스북 그룹 / 이벤트 / 구글 검색)"
            className="p-0.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <ChevronDown className="w-2.5 h-2.5" />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 text-left text-xs font-normal animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 border-b border-gray-100 bg-gray-50/70">
                <span className="text-[11px] font-bold text-gray-700 block">자료 검색 옵션</span>
                <span className="text-[10px] text-gray-500 truncate block">검색어: "{resolved.searchQuery}"</span>
              </div>

              {/* 1. Facebook Group Search */}
              {resolved.facebookGroupSearchUrl && (
                <a
                  href={resolved.facebookGroupSearchUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 hover:bg-blue-50 text-gray-800 hover:text-blue-700 flex items-center gap-2 transition-colors"
                >
                  <Facebook className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-[11px]">페이스북 그룹 내 검색</div>
                    <div className="text-[10px] text-gray-500">해당 그룹의 게시글 검색 결과로 직행</div>
                  </div>
                </a>
              )}

              {/* 2. Facebook Global Events Search */}
              {resolved.facebookGlobalEventsUrl && (
                <a
                  href={resolved.facebookGlobalEventsUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 hover:bg-blue-50 text-gray-800 hover:text-blue-700 flex items-center gap-2 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-[11px]">페이스북 이벤트 전체 검색</div>
                    <div className="text-[10px] text-gray-500">Facebook 공용 이벤트 인덱스에서 찾기</div>
                  </div>
                </a>
              )}

              {/* 3. Google Search Fallback */}
              <a
                href={resolved.googleSearchUrl}
                target="_blank"
                rel="noreferrer noopener"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 hover:bg-emerald-50 text-gray-800 hover:text-emerald-700 flex items-center gap-2 transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-semibold text-[11px]">구글에서 행사 정보 검색</div>
                  <div className="text-[10px] text-gray-500">페이스북 미로그인 시 포스터/신청서 찾기</div>
                </div>
              </a>

              {/* 4. Original Home URL if available */}
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
                    <div className="font-semibold text-[11px]">출처 홈 주소 방문</div>
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
