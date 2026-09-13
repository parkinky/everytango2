import React, { useState, useEffect } from 'react';
import { 
  ExternalLink, 
  MapPin, 
  Tag, 
  Info, 
  CheckCircle2, 
  Sparkles,
  ArrowUpDown,
  Share2,
  Calendar,
  Building,
  DollarSign,
  Edit3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { TangoEvent, SupportedLanguage, EventType } from '../types';
import { translations } from '../i18n';
import { formatDateRange, formatTwoLineDate } from '../utils/dedup';
import { formatTwoLineAddress, convertPriceToUSD, formatCrawledDate } from '../utils/formatters';
import { translateEventNotes, useEventDisplayText } from '../utils/notesTranslator';
import { useAuth } from '../context/AuthContext';
import { EventSourceLink } from './EventSourceLink';

interface EventTableProps {
  events: TangoEvent[];
  currentLang: SupportedLanguage;
  onEditEvent?: (eventId: string) => void;
}

const ITEMS_PER_PAGE = 10;

export const EventTable: React.FC<EventTableProps> = ({ events, currentLang, onEditEvent }) => {
  const t = translations[currentLang];
  const displayText = useEventDisplayText(currentLang, events.flatMap(ev => [ev.event_name, ev.city, ev.state, ev.address, ev.price, ev.notes]));
  const { userProfile, currentUser } = useAuth();
  const isAdmin = Boolean(
    userProfile?.role === 'ADMIN' || 
    currentUser?.email === 'parkinky@gmail.com' || 
    userProfile?.username === 'parkinky'
  );
  const [sortField, setSortField] = useState<'date' | 'name' | 'city' | 'crawled'>('date');
  const [sortAsc, setSortAsc] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Helper to compare locations (City -> State -> Country -> Address)
  const compareLocation = (a: TangoEvent, b: TangoEvent): number => {
    const cityA = (a.city || '').trim();
    const cityB = (b.city || '').trim();
    const cityComp = cityA.localeCompare(cityB, undefined, { sensitivity: 'base' });
    if (cityComp !== 0) return cityComp;

    const stateA = (a.state || '').trim();
    const stateB = (b.state || '').trim();
    const stateComp = stateA.localeCompare(stateB, undefined, { sensitivity: 'base' });
    if (stateComp !== 0) return stateComp;

    const countryA = (a.country_code || '').trim();
    const countryB = (b.country_code || '').trim();
    const countryComp = countryA.localeCompare(countryB, undefined, { sensitivity: 'base' });
    if (countryComp !== 0) return countryComp;

    const addrA = (a.address || '').trim();
    const addrB = (b.address || '').trim();
    return addrA.localeCompare(addrB, undefined, { sensitivity: 'base' });
  };

  // Sorting
  const sortedEvents = [...events].sort((a, b) => {
    if (sortField === 'date') {
      const dateComp = a.start_date.localeCompare(b.start_date);
      if (dateComp !== 0) {
        return sortAsc ? dateComp : -dateComp;
      }
      // Specification: 이벤트 일자가 같을 경우는 Location 오름차순으로 정렬
      const locComp = compareLocation(a, b);
      if (locComp !== 0) {
        return locComp; // Always ascending order by Location when dates are identical
      }
      // If location is also identical, sort by end_date, then event_name
      const endComp = (a.end_date || '').localeCompare(b.end_date || '');
      if (endComp !== 0) return endComp;
      return (a.event_name || '').localeCompare(b.event_name || '');
    } else if (sortField === 'name') {
      const nameComp = a.event_name.localeCompare(b.event_name);
      if (nameComp !== 0) {
        return sortAsc ? nameComp : -nameComp;
      }
      return compareLocation(a, b);
    } else if (sortField === 'city') {
      const locComp = compareLocation(a, b);
      if (locComp !== 0) {
        return sortAsc ? locComp : -locComp;
      }
      return a.start_date.localeCompare(b.start_date);
    } else if (sortField === 'crawled') {
      const crawlComp = (a.created_at || '').localeCompare(b.created_at || '');
      if (crawlComp !== 0) {
        return sortAsc ? crawlComp : -crawlComp;
      }
      return compareLocation(a, b);
    }
    return 0;
  });

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(sortedEvents.length / ITEMS_PER_PAGE));

  // Reset to page 1 whenever events list length or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [events.length, sortField, sortAsc]);

  // Ensure currentPage is within valid bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, sortedEvents.length);
  const paginatedEvents = sortedEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      const el = document.getElementById('events-table-wrapper');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const getPageNumbers = (current: number, total: number): (number | 'ellipsis')[] => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [];
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
      pages.push('ellipsis');
      pages.push(total);
      return pages;
    }
    if (current >= total - 3) {
      pages.push(1);
      pages.push('ellipsis');
      for (let i = total - 4; i <= total; i++) {
        pages.push(i);
      }
      return pages;
    }
    pages.push(1);
    pages.push('ellipsis');
    pages.push(current - 1);
    pages.push(current);
    pages.push(current + 1);
    pages.push('ellipsis');
    pages.push(total);
    return pages;
  };

  const toggleSort = (field: 'date' | 'name' | 'city' | 'crawled') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'crawled' ? false : true); // default crawled to newest first
    }
  };

  const copyEventShare = (ev: TangoEvent) => {
    const usd = convertPriceToUSD(ev.price, ev.is_free, ev.country_code, currentLang);
    const priceDisplay = usd.usdFormatted === 'N/S'
      ? 'N/S'
      : `${displayText(usd.usdFormatted)}${usd.originalFormatted && usd.originalFormatted !== usd.usdFormatted ? ` (${usd.originalFormatted})` : ''}`;
    const text = `${displayText(ev.event_name)} (${ev.city}, ${ev.country_code}) - ${formatDateRange(ev.start_date, ev.end_date, currentLang)}\n${t.table.price}: ${priceDisplay}${ev.source_url ? `\n${ev.source_url}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(ev.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const typeLabels: Record<SupportedLanguage, Record<EventType, string>> = {
    en: { FESTIVAL: 'Festival', MARATHON: 'Marathon', ENCUENTRO: 'Encuentro', WORKSHOP: 'Workshop', MILONGA: 'Milonga' },
    es: { FESTIVAL: 'Festival', MARATHON: 'Maratón', ENCUENTRO: 'Encuentro', WORKSHOP: 'Taller', MILONGA: 'Milonga' },
    ko: { FESTIVAL: '페스티벌', MARATHON: '마라톤', ENCUENTRO: '엥꾸엔뜨로', WORKSHOP: '워크샵', MILONGA: '밀롱가' },
    ja: { FESTIVAL: 'フェスティバル', MARATHON: 'マラソン', ENCUENTRO: 'エンクエントロ', WORKSHOP: 'ワークショップ', MILONGA: 'ミロンガ' },
    zh: { FESTIVAL: '探戈节', MARATHON: '马拉松', ENCUENTRO: 'Encuentro', WORKSHOP: '工作坊', MILONGA: '舞会' },
  };

  const renderBadge = (type: EventType) => {
    const label = (typeLabels[currentLang] || typeLabels.en)[type];
    switch (type) {
      case 'FESTIVAL':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-tight">{label}</span>;
      case 'MARATHON':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-tight">{label}</span>;
      case 'ENCUENTRO':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-tight">{label}</span>;
      case 'WORKSHOP':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-tight">{label}</span>;
      case 'MILONGA':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-tight">{label}</span>;
    }
  };

  if (events.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center my-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">{t.table.noEventsFound}</h3>
        <p className="text-sm text-gray-500">{t.table.noEventsPrompt}</p>
      </div>
    );
  }

  return (
    <div id="events-table-wrapper" className="my-4 space-y-2.5">
      
      {/* Table Results Summary & Fast Sort Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-500 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-gray-900">{events.length}</span>
          <span>{t.filter.resultsCount}</span>
          <span className="text-gray-300">·</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[11px] font-semibold border border-red-100">
            {currentLang === 'ko' 
              ? `${ITEMS_PER_PAGE}개씩 보기 (${startIndex + 1}–${endIndex})`
              : currentLang === 'es'
              ? `${ITEMS_PER_PAGE} por pág (${startIndex + 1}–${endIndex})`
              : currentLang === 'ja'
              ? `${ITEMS_PER_PAGE}件表示 (${startIndex + 1}–${endIndex})`
              : currentLang === 'zh'
              ? `每页 ${ITEMS_PER_PAGE} 条 (${startIndex + 1}–${endIndex})`
              : `${ITEMS_PER_PAGE} per page (${startIndex + 1}–${endIndex})`}
          </span>
          <span className="text-gray-400 text-[11px]">
            ({currentLang === 'ko' 
              ? `${currentPage} / ${totalPages} 페이지` 
              : currentLang === 'es'
              ? `Pág. ${currentPage} de ${totalPages}`
              : currentLang === 'ja'
              ? `${currentPage} / ${totalPages} ページ`
              : currentLang === 'zh'
              ? `第 ${currentPage} / ${totalPages} 页`
              : `Page ${currentPage} of ${totalPages}`})
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] flex-wrap">
          <span className="text-gray-400">{t.table.sortBy}</span>
          <button 
            onClick={() => toggleSort('date')} 
            className={`font-semibold px-1.5 py-0.5 rounded transition-colors ${sortField === 'date' ? 'bg-red-50 text-red-600 font-bold' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {t.table.sortByDate} {sortField === 'date' && (sortAsc ? '↑' : '↓')}
          </button>
          <span>·</span>
          <button 
            onClick={() => toggleSort('name')} 
            className={`font-semibold px-1.5 py-0.5 rounded transition-colors ${sortField === 'name' ? 'bg-red-50 text-red-600 font-bold' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {t.table.sortByName} {sortField === 'name' && (sortAsc ? '↑' : '↓')}
          </button>
          <span>·</span>
          <button 
            onClick={() => toggleSort('city')} 
            className={`font-semibold px-1.5 py-0.5 rounded transition-colors ${sortField === 'city' ? 'bg-red-50 text-red-600 font-bold' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {t.table.sortByCity} {sortField === 'city' && (sortAsc ? '↑' : '↓')}
          </button>
          <span>·</span>
          <button 
            onClick={() => toggleSort('crawled')} 
            className={`font-semibold px-1.5 py-0.5 rounded transition-colors ${sortField === 'crawled' ? 'bg-red-50 text-red-600 font-bold' : 'text-gray-600 hover:text-gray-900'}`}
            title="Sort by Crawled"
          >
            {t.table.crawledDate} {sortField === 'crawled' && (sortAsc ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* =========================================================================
          Desktop & Tablet Table
          Single Screen Constraint: table-fixed and 100% column widths ensure NO horizontal scrollbar
          ========================================================================= */}
      <div className="hidden sm:block bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full table-fixed text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[11px] font-bold uppercase tracking-wider select-none">
              
              {/* Date Column (13%): 2-line layout */}
              <th 
                onClick={() => toggleSort('date')}
                className="w-[13%] py-2.5 px-2.5 cursor-pointer hover:text-gray-900 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>{t.table.dateDay}</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                </div>
              </th>

              {/* Event Type (6.5%) */}
              <th className="w-[6.5%] py-2.5 px-1.5 text-center">{t.table.type}</th>

              {/* Event Name (29%): +20%~25% increase */}
              <th 
                onClick={() => toggleSort('name')}
                className="w-[29%] py-2.5 px-3 cursor-pointer hover:text-gray-900 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>{t.table.eventName}</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                </div>
              </th>

              {/* Location & Address (29%): -20% reduction from 36% */}
              <th 
                onClick={() => toggleSort('city')}
                className="w-[29%] py-2.5 px-3 cursor-pointer hover:text-gray-900 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>{t.table.locationAndAddress}</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                </div>
              </th>

              {/* Price (6%): Minimized width */}
              <th className="w-[6%] py-2.5 px-1.5 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                  <span>{t.table.priceUsd}</span>
                  <DollarSign className="w-3 h-3 text-green-600 shrink-0" />
                </div>
              </th>

              {/* Crawled Date (9.5%) */}
              <th 
                onClick={() => toggleSort('crawled')}
                className="w-[9.5%] py-2.5 px-2 cursor-pointer hover:text-gray-900 transition-colors"
                title={t.table.crawledDate}
              >
                <div className="flex items-center gap-1">
                  <span>{t.table.crawledDate}</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                </div>
              </th>

              {/* Link / Details (7%) */}
              <th className="w-[7%] py-2.5 px-1.5 text-center">{t.table.details}</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
            {paginatedEvents.map((ev) => {
              const { start, end } = formatTwoLineDate(ev.start_date, ev.end_date, currentLang);
              const addr = formatTwoLineAddress({ ...ev, city: displayText(ev.city), state: displayText(ev.state), address: displayText(ev.address) });
              const usd = convertPriceToUSD(ev.price, ev.is_free, ev.country_code, currentLang);
              const crawled = formatCrawledDate(ev.created_at);

              return (
                <tr 
                  key={ev.id} 
                  className="hover:bg-gray-50 transition-colors group"
                >
                  {/* Date (2 Lines: Start Date / ~ End Date) */}
                  <td className="py-2.5 px-2.5 whitespace-nowrap font-medium text-gray-700 align-middle">
                    <div className="flex items-start gap-1 leading-tight">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col font-mono text-xs">
                        <span className="text-gray-900 font-semibold">{start}</span>
                        {end && <span className="text-gray-500 text-[10px] font-normal">{end}</span>}
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-2.5 px-1.5 whitespace-nowrap text-center align-middle">
                    {renderBadge(ev.event_type)}
                  </td>

                  {/* Event Name */}
                  <td className="py-2.5 px-3 align-middle">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-gray-900 group-hover:text-red-600 transition-colors truncate block" title={displayText(ev.event_name)}>
                        {displayText(ev.event_name)}
                      </span>
                      {ev.source_type === 'AUTO_CRAWLED' && (
                        <span title={t.table.botTooltip} className="shrink-0 text-[10px] bg-gray-100 text-gray-500 px-1 py-0.2 rounded border border-gray-200">
                          {t.table.bot}
                        </span>
                      )}
                      {ev.source_type === 'FACEBOOK' && (
                        <span title={t.table.fbCommunity} className="shrink-0 text-[10px] bg-blue-50 text-[#1877F2] font-semibold px-1.5 py-0.2 rounded border border-blue-200 inline-flex items-center gap-1">
                          <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          FB
                        </span>
                      )}
                    </div>
                    {ev.notes && (() => {
                      const translatedNote = currentLang === 'en' ? displayText(ev.notes) : translateEventNotes(ev.notes, currentLang);
                      return (
                        <p className="text-[11px] text-gray-500 truncate mt-0.5 font-normal" title={translatedNote}>
                          {translatedNote}
                        </p>
                      );
                    })()}
                  </td>

                  {/* Address (2 Lines: Line 1 = Country & City, Line 2 = Street / Venue) */}
                  <td className="py-2.5 px-3 align-middle">
                    <div className="leading-tight">
                      {/* Line 1: Country & City, State */}
                      <div className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 truncate">
                        <span className="px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 font-mono text-[10px] font-bold border border-gray-200 shrink-0">
                          {addr.locationLine.startsWith('[') ? addr.locationLine.slice(1, addr.locationLine.indexOf(']')) : ev.country_code}
                        </span>
                        <span className="truncate">
                          {addr.locationLine.includes('] ') ? addr.locationLine.slice(addr.locationLine.indexOf('] ') + 2) : `${ev.city}${ev.state ? `, ${ev.state}` : ''}`}
                        </span>
                      </div>
                      
                      {/* Line 2: Venue / Street Address */}
                      <div className="text-[11px] text-gray-500 truncate mt-0.5 flex items-center gap-1" title={addr.venueLine}>
                        <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                        <span className="truncate">{addr.venueLine}</span>
                      </div>
                    </div>
                  </td>

                  {/* Price (USD converted prominently with original currency subtitle) */}
                  <td className="py-2.5 px-1.5 whitespace-nowrap text-right align-middle font-semibold">
                    <div className="leading-tight">
                      <div className={`font-mono text-xs font-bold ${usd.isFree ? 'text-green-600' : usd.usdFormatted === 'N/S' ? 'text-gray-400 font-medium' : 'text-gray-900'}`}>
                        {displayText(usd.usdFormatted)}
                      </div>
                      {usd.originalFormatted && usd.originalFormatted !== usd.usdFormatted && usd.usdFormatted !== 'N/S' && (
                        <div className="text-[10px] text-gray-400 font-normal font-mono" title={`Original: ${displayText(usd.originalFormatted)}`}>
                          ({displayText(usd.originalFormatted)})
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Crawled Date */}
                  <td className="py-2.5 px-2 whitespace-nowrap font-medium text-gray-700 align-middle">
                    <div className="flex flex-col font-mono text-[11px] leading-tight">
                      <span className="text-gray-900 font-semibold truncate" title={crawled.date}>
                        {crawled.date}
                      </span>
                      {crawled.time && (
                        <span className="text-gray-400 text-[10px] truncate" title={crawled.time}>
                          {crawled.time}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Details Link & Share */}
                  <td className="py-2.5 px-1.5 whitespace-nowrap text-center align-middle">
                    <div className="flex items-center justify-center gap-1">
                      <EventSourceLink event={ev} currentLang={currentLang} />
                      <button
                        onClick={() => copyEventShare(ev)}
                        title={copiedId === ev.id ? t.table.copied : t.table.share}
                        className={`p-1 rounded transition-colors ${
                          copiedId === ev.id 
                            ? 'text-emerald-600 bg-emerald-50' 
                            : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {copiedId === ev.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                      </button>

                      {/* Admin Quick Edit Button */}
                      {isAdmin && onEditEvent && (
                        <button
                          onClick={() => onEditEvent(ev.id)}
                          title={t.table.adminEditTooltip}
                          className="p-1 rounded text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Table Footer Status Note */}
        <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500 font-medium">
          <div className="flex items-center gap-3">
            <span>
              <strong className="text-gray-900">{sortedEvents.length}</strong> {t.table.totalEventsCount}
              <span className="text-gray-400 ml-1.5 font-normal">
                ({currentLang === 'ko' 
                  ? `${ITEMS_PER_PAGE}개씩 보기: ${startIndex + 1}–${endIndex}` 
                  : currentLang === 'es'
                  ? `${ITEMS_PER_PAGE} por pág: ${startIndex + 1}–${endIndex}`
                  : currentLang === 'ja'
                  ? `${ITEMS_PER_PAGE}件表示: ${startIndex + 1}–${endIndex}`
                  : currentLang === 'zh'
                  ? `每页 ${ITEMS_PER_PAGE} 条: ${startIndex + 1}–${endIndex}`
                  : `${ITEMS_PER_PAGE} per page: ${startIndex + 1}–${endIndex}`})
              </span>
            </span>
            <span className="text-gray-300">|</span>
            <span>{t.table.tableSingleScreenNote}</span>
          </div>
          <span className="text-[11px] text-gray-400">{t.table.exchangeRateNote}</span>
        </div>
      </div>

      {/* =========================================================================
          Mobile Card List View
          ========================================================================= */}
      <div className="sm:hidden space-y-2.5">
        {paginatedEvents.map((ev) => {
          const { start, end } = formatTwoLineDate(ev.start_date, ev.end_date, currentLang);
          const addr = formatTwoLineAddress({ ...ev, city: displayText(ev.city), state: displayText(ev.state), address: displayText(ev.address) });
          const usd = convertPriceToUSD(ev.price, ev.is_free, ev.country_code, currentLang);
          const crawled = formatCrawledDate(ev.created_at);

          return (
            <div 
              key={ev.id} 
              className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    {renderBadge(ev.event_type)}
                    <span className="px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-mono text-[10px] font-bold border border-gray-200">
                      {ev.country_code}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-gray-900">{displayText(ev.event_name)}</h4>
                </div>

                {/* Price in USD on Mobile */}
                <div className="text-right shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md font-mono ${usd.isFree ? 'bg-green-50 text-green-700 border border-green-200' : usd.usdFormatted === 'N/S' ? 'bg-gray-100 text-gray-400 border border-gray-200' : 'bg-gray-100 text-gray-900'}`}>
                    {displayText(usd.usdFormatted)}
                  </span>
                  {usd.originalFormatted && usd.originalFormatted !== usd.usdFormatted && usd.usdFormatted !== 'N/S' && (
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                      ({displayText(usd.originalFormatted)})
                    </div>
                  )}
                </div>
              </div>

              {/* Date in 2 Lines */}
              <div className="flex items-start justify-between gap-2 text-xs">
                <div className="flex items-start gap-1.5 text-red-600 font-mono leading-tight">
                  <Calendar className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{start}</span>
                    {end && <span className="text-gray-500 text-[11px]">{end}</span>}
                  </div>
                </div>

                {/* Crawled Date badge on mobile */}
                <div className="text-right text-[10px] text-gray-400 font-mono" title={t.table.crawledDate}>
                  <span>{t.table.crawledDate}: </span>
                  <span className="font-medium text-gray-600">{crawled.date}</span>
                </div>
              </div>

              {/* Address in 2 Lines */}
              <div className="space-y-0.5 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                <div className="font-semibold text-gray-900 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                  <span>{addr.locationLine}</span>
                </div>
                <div className="text-[11px] text-gray-500 pl-4">
                  {addr.venueLine}
                </div>
              </div>

              {ev.notes && (() => {
                const translatedNote = currentLang === 'en' ? displayText(ev.notes) : translateEventNotes(ev.notes, currentLang);
                return (
                  <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100" title={translatedNote}>
                    {translatedNote}
                  </p>
                );
              })()}

              {/* Mobile Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-gray-100 text-xs gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyEventShare(ev)}
                    className="text-gray-500 hover:text-gray-900 flex items-center gap-1"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{copiedId === ev.id ? t.table.copied : t.table.share}</span>
                  </button>
                  {isAdmin && onEditEvent && (
                    <button
                      onClick={() => onEditEvent(ev.id)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
                      title={t.table.adminEditTooltip}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{t.table.edit}</span>
                    </button>
                  )}
                </div>
                <EventSourceLink event={ev} currentLang={currentLang} label={t.table.viewOriginal} />
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          Bottom Pagination Bar (11 items per page, 1, 2, 3...)
          ========================================================================= */}
      <div className="mt-4 pt-3 pb-1 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
        {/* Left: Summary text */}
        <div className="text-xs text-gray-600 flex items-center gap-1.5 order-2 sm:order-1">
          {currentLang === 'ko' ? (
            <span>
              전체 <strong className="text-gray-900 font-bold">{sortedEvents.length}</strong>개 중{' '}
              <strong className="text-red-600 font-bold">{startIndex + 1}–{endIndex}</strong>번째 이벤트 
              (총 <strong className="text-gray-900 font-bold">{totalPages}</strong>개 페이지)
            </span>
          ) : currentLang === 'es' ? (
            <span>
              Mostrando <strong className="text-red-600 font-bold">{startIndex + 1}–{endIndex}</strong> de{' '}
              <strong className="text-gray-900 font-bold">{sortedEvents.length}</strong> eventos 
              (Total <strong className="text-gray-900 font-bold">{totalPages}</strong> páginas)
            </span>
          ) : currentLang === 'ja' ? (
            <span>
              全 <strong className="text-gray-900 font-bold">{sortedEvents.length}</strong>件中{' '}
              <strong className="text-red-600 font-bold">{startIndex + 1}–{endIndex}</strong>件を表示 
              (全 <strong className="text-gray-900 font-bold">{totalPages}</strong>ページ)
            </span>
          ) : currentLang === 'zh' ? (
            <span>
              显示第 <strong className="text-red-600 font-bold">{startIndex + 1}–{endIndex}</strong> 条，共{' '}
              <strong className="text-gray-900 font-bold">{sortedEvents.length}</strong> 个活动 
              (共 <strong className="text-gray-900 font-bold">{totalPages}</strong> 页)
            </span>
          ) : (
            <span>
              Showing <strong className="text-red-600 font-bold">{startIndex + 1}–{endIndex}</strong> of{' '}
              <strong className="text-gray-900 font-bold">{sortedEvents.length}</strong> events 
              (Total <strong className="text-gray-900 font-bold">{totalPages}</strong> pages)
            </span>
          )}
        </div>

        {/* Right: Page 1, 2, 3... buttons */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center order-1 sm:order-2">
          {/* Previous Page Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentPage === 1
                ? 'text-gray-300 cursor-not-allowed bg-gray-50 border border-gray-100'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900 shadow-2xs cursor-pointer active:scale-95'
            }`}
            title={t.table.prevPage}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{t.table.prev}</span>
          </button>

          {/* Numbered Page Buttons */}
          <div className="flex items-center gap-1">
            {getPageNumbers(currentPage, totalPages).map((p, idx) => {
              if (p === 'ellipsis') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1.5 py-1 text-gray-400 text-xs font-bold select-none">
                    ···
                  </span>
                );
              }

              const isCurrent = p === currentPage;
              return (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`min-w-[34px] h-[34px] px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                    isCurrent
                      ? 'bg-red-600 text-white shadow-xs scale-105 border border-red-600'
                      : 'bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 hover:border-gray-300 active:scale-95'
                  }`}
                  title={`${p} ${t.table.goToPage}`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Next Page Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentPage === totalPages
                ? 'text-gray-300 cursor-not-allowed bg-gray-50 border border-gray-100'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900 shadow-2xs cursor-pointer active:scale-95'
            }`}
            title={t.table.nextPage}
          >
            <span className="hidden xs:inline">{t.table.next}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
