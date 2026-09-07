import React, { useState } from 'react';
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
  Edit3
} from 'lucide-react';
import { TangoEvent, SupportedLanguage, EventType } from '../types';
import { translations } from '../i18n';
import { formatDateRange, formatTwoLineDate } from '../utils/dedup';
import { formatTwoLineAddress, convertPriceToUSD, formatCrawledDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

interface EventTableProps {
  events: TangoEvent[];
  currentLang: SupportedLanguage;
  onEditEvent?: (eventId: string) => void;
}

export const EventTable: React.FC<EventTableProps> = ({ events, currentLang, onEditEvent }) => {
  const t = translations[currentLang];
  const { userProfile, currentUser } = useAuth();
  const isAdmin = Boolean(
    userProfile?.role === 'ADMIN' || 
    currentUser?.email === 'parkinky@gmail.com' || 
    userProfile?.username === 'parkinky'
  );
  const [sortField, setSortField] = useState<'date' | 'name' | 'city' | 'crawled'>('date');
  const [sortAsc, setSortAsc] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sorting
  const sortedEvents = [...events].sort((a, b) => {
    let comp = 0;
    if (sortField === 'date') {
      comp = a.start_date.localeCompare(b.start_date);
    } else if (sortField === 'name') {
      comp = a.event_name.localeCompare(b.event_name);
    } else if (sortField === 'city') {
      comp = a.city.localeCompare(b.city);
    } else if (sortField === 'crawled') {
      comp = (a.created_at || '').localeCompare(b.created_at || '');
    }
    return sortAsc ? comp : -comp;
  });

  const toggleSort = (field: 'date' | 'name' | 'city' | 'crawled') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'crawled' ? false : true); // default crawled to newest first
    }
  };

  const copyEventShare = (ev: TangoEvent) => {
    const usd = convertPriceToUSD(ev.price, ev.is_free, ev.country_code);
    const text = `${ev.event_name} (${ev.city}, ${ev.country_code}) - ${formatDateRange(ev.start_date, ev.end_date)}\nPrice: ${usd.usdFormatted} (${usd.originalFormatted || ev.price})${ev.source_url ? `\n${ev.source_url}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(ev.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderBadge = (type: EventType) => {
    switch (type) {
      case 'FESTIVAL':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-tight">Festival</span>;
      case 'MARATHON':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-tight">Marathon</span>;
      case 'ENCUENTRO':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-tight">Encuentro</span>;
      case 'WORKSHOP':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-tight">Workshop</span>;
      case 'MILONGA':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-tight">Milonga</span>;
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
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900">{events.length}</span>
          <span>{t.filter.resultsCount}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
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
            title="Sort by Crawled Date"
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
            {sortedEvents.map((ev) => {
              const { start, end } = formatTwoLineDate(ev.start_date, ev.end_date);
              const addr = formatTwoLineAddress(ev);
              const usd = convertPriceToUSD(ev.price, ev.is_free, ev.country_code);
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
                      <span className="font-bold text-gray-900 group-hover:text-red-600 transition-colors truncate block" title={ev.event_name}>
                        {ev.event_name}
                      </span>
                      {ev.source_type === 'AUTO_CRAWLED' && (
                        <span title="Crawled & verified bot" className="shrink-0 text-[10px] bg-gray-100 text-gray-500 px-1 py-0.2 rounded border border-gray-200">
                          Bot
                        </span>
                      )}
                      {ev.source_type === 'FACEBOOK' && (
                        <span title="Facebook Tango Community" className="shrink-0 text-[10px] bg-blue-50 text-[#1877F2] font-semibold px-1.5 py-0.2 rounded border border-blue-200 inline-flex items-center gap-1">
                          <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          FB
                        </span>
                      )}
                    </div>
                    {ev.notes && (
                      <p className="text-[11px] text-gray-500 truncate mt-0.5 font-normal" title={ev.notes}>
                        {ev.notes}
                      </p>
                    )}
                  </td>

                  {/* Address (2 Lines: Line 1 = Country & City, Line 2 = Street / Venue) */}
                  <td className="py-2.5 px-3 align-middle">
                    <div className="leading-tight">
                      {/* Line 1: Country & City, State */}
                      <div className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 truncate">
                        <span className="px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 font-mono text-[10px] font-bold border border-gray-200 shrink-0">
                          {ev.country_code}
                        </span>
                        <span className="truncate">{ev.city}{ev.state ? `, ${ev.state}` : ''}</span>
                      </div>
                      
                      {/* Line 2: Venue / Street Address */}
                      <div className="text-[11px] text-gray-500 truncate mt-0.5 flex items-center gap-1" title={ev.address}>
                        <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                        <span className="truncate">{ev.address || '—'}</span>
                      </div>
                    </div>
                  </td>

                  {/* Price (USD converted prominently with original currency subtitle) */}
                  <td className="py-2.5 px-1.5 whitespace-nowrap text-right align-middle font-semibold">
                    <div className="leading-tight">
                      <div className={`font-mono text-xs font-bold ${usd.isFree ? 'text-green-600' : 'text-gray-900'}`}>
                        {usd.usdFormatted}
                      </div>
                      {usd.originalFormatted && usd.originalFormatted !== usd.usdFormatted && (
                        <div className="text-[10px] text-gray-400 font-normal font-mono" title={`Original: ${usd.originalFormatted}`}>
                          ({usd.originalFormatted})
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
                      {ev.source_url ? (
                        <a
                          href={ev.source_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          title={t.table.viewOfficial}
                          className="text-red-600 hover:text-red-700 font-semibold text-xs hover:underline inline-flex items-center gap-0.5 p-1 rounded hover:bg-red-50 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="p-1 text-gray-300 inline-flex items-center" title="No link provided">
                          <ExternalLink className="w-3.5 h-3.5 opacity-30" />
                        </span>
                      )}
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
                          title="Edit event content as administrator"
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
            <span><strong className="text-gray-900">{sortedEvents.length}</strong> {t.table.totalEventsCount}</span>
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
        {sortedEvents.map((ev) => {
          const { start, end } = formatTwoLineDate(ev.start_date, ev.end_date);
          const addr = formatTwoLineAddress(ev);
          const usd = convertPriceToUSD(ev.price, ev.is_free, ev.country_code);
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
                  <h4 className="font-bold text-sm text-gray-900">{ev.event_name}</h4>
                </div>

                {/* Price in USD on Mobile */}
                <div className="text-right shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md font-mono ${usd.isFree ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-900'}`}>
                    {usd.usdFormatted}
                  </span>
                  {usd.originalFormatted && usd.originalFormatted !== usd.usdFormatted && (
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                      ({usd.originalFormatted})
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

              {ev.notes && (
                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                  {ev.notes}
                </p>
              )}

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
                      title="Edit event as admin"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
                {ev.source_url ? (
                  <a
                    href={ev.source_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold hover:underline"
                  >
                    <span>{t.table.viewOriginal}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-gray-400 text-xs italic">
                    No website link
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
