import React, { useState } from 'react';
import { 
  Search, 
  RotateCcw, 
  Calendar, 
  Layers, 
  FileSpreadsheet, 
  Check, 
  Download,
  Filter
} from 'lucide-react';
import { EventType, SupportedLanguage } from '../types';
import { translations, COUNTRY_LIST } from '../i18n';
import { useEvents } from '../context/EventsContext';
import { useAuth } from '../context/AuthContext';
import { exportEventsToExcel } from '../utils/excelExport';

interface FilterBarProps {
  currentLang: SupportedLanguage;
}

export const FilterBar: React.FC<FilterBarProps> = ({ currentLang }) => {
  const t = translations[currentLang];
  const { 
    filters, 
    setFilters, 
    resetFilters, 
    uniqueCities, 
    filteredEvents 
  } = useEvents();
  const { userProfile, currentUser } = useAuth();
  const isAdmin = Boolean(
    userProfile?.role === 'ADMIN' || 
    currentUser?.email === 'parkinky@gmail.com' || 
    userProfile?.username === 'parkinky'
  );

  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Suggestions for autocomplete search
  const searchSuggestions = uniqueCities.concat(
    filteredEvents.map(e => e.event_name).slice(0, 8)
  ).filter((val, idx, arr) => arr.indexOf(val) === idx && filters.search && val.toLowerCase().includes(filters.search.toLowerCase()));

  const handleTypeToggle = (type: EventType) => {
    setFilters((prev) => {
      const exists = prev.types.includes(type);
      const newTypes = exists ? prev.types.filter((t) => t !== type) : [...prev.types, type];
      return { ...prev, types: newTypes };
    });
  };

  const isAllTypesSelected = filters.types.length === 0;

  const handleExportExcel = () => {
    if (!isAdmin) return;
    const success = exportEventsToExcel(filteredEvents);
    if (success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    }
  };

  return (
    <div id="filter-bar-container" className="bg-white border border-gray-200 rounded-xl p-3 sm:p-3.5 shadow-xs space-y-2.5">
      
      {/* =========================================================================
          Line 1: "Quick Range" + Search Box + Excel Download Button
          ========================================================================= */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        
        {/* Quick Date Range Buttons & Custom Date Pickers */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-bold text-gray-600 mr-1 select-none">
            <Calendar className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span className="text-gray-900 font-extrabold">Quick Range</span>
          </div>

          <button
            id="filter-range-1m-btn"
            onClick={() => setFilters(prev => ({ ...prev, date_quick_range: '1m' }))}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              filters.date_quick_range === '1m'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t.filter.oneMonth}
          </button>

          <button
            id="filter-range-3m-btn"
            onClick={() => setFilters(prev => ({ ...prev, date_quick_range: '3m' }))}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              filters.date_quick_range === '3m'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t.filter.threeMonths}
          </button>

          <button
            id="filter-range-6m-btn"
            onClick={() => setFilters(prev => ({ ...prev, date_quick_range: '6m' }))}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              filters.date_quick_range === '6m'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t.filter.sixMonths}
          </button>

          <button
            id="filter-range-all-btn"
            onClick={() => setFilters(prev => ({ ...prev, date_quick_range: 'all' }))}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              filters.date_quick_range === 'all'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t.filter.allRange}
          </button>
        </div>

        {/* Right side of Line 1: Search Box & Excel Download */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 lg:w-64">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
              <input
                id="search-event-input"
                type="text"
                value={filters.search}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, search: e.target.value }));
                  setAutocompleteOpen(true);
                }}
                onFocus={() => setAutocompleteOpen(true)}
                onBlur={() => setTimeout(() => setAutocompleteOpen(false), 200)}
                placeholder={t.filter.searchPlaceholder}
                className="w-full bg-white border border-gray-200 rounded-md pl-8 pr-7 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                  className="absolute right-2 text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown List */}
            {autocompleteOpen && searchSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden py-1 max-h-48 overflow-y-auto">
                {searchSuggestions.slice(0, 6).map((item, idx) => (
                  <div
                    key={idx}
                    onMouseDown={() => {
                      setFilters(prev => ({ ...prev, search: item }));
                      setAutocompleteOpen(false);
                    }}
                    className="px-3 py-1.5 text-xs text-gray-800 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                  >
                    <span>{item}</span>
                    <span className="text-[10px] text-red-600 font-semibold">Select</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Excel Download Button (Admin Only) */}
          {isAdmin && (
            <button
              id="excel-download-btn"
              onClick={handleExportExcel}
              title={t.filter.exportTooltip}
              className={`group shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-2xs border ${
                downloadSuccess
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border-emerald-200 hover:border-emerald-600'
              }`}
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white animate-bounce" />
                  <span className="font-bold">{t.filter.downloadComplete}</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 group-hover:text-white transition-colors" />
                  <span>{t.filter.exportExcel}</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                    {filteredEvents.length}
                  </span>
                </>
              )}
            </button>
          )}
        </div>

      </div>

      {/* =========================================================================
          Line 2: "Event Type" + Country Dropdown + Price Filter + Reset
          ========================================================================= */}
      <div className="pt-2 border-t border-gray-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        
        {/* Type Multi-Select Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-bold text-gray-600 mr-1 select-none">
            <Layers className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <span className="text-gray-900 font-extrabold">Event Type</span>
          </div>

          <button
            onClick={() => setFilters(prev => ({ ...prev, types: [] }))}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              isAllTypesSelected
                ? 'bg-gray-900 text-white font-bold shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.filter.allTypes}
          </button>

          {(['FESTIVAL', 'MARATHON', 'ENCUENTRO', 'WORKSHOP', 'MILONGA'] as EventType[]).map((type) => {
            const isSelected = filters.types.includes(type);
            const label = 
              type === 'FESTIVAL' ? t.filter.festival :
              type === 'MARATHON' ? t.filter.marathon :
              type === 'ENCUENTRO' ? t.filter.encuentro :
              type === 'WORKSHOP' ? t.filter.workshop : t.filter.milonga;

            const selectedClass = 
              type === 'FESTIVAL' ? 'bg-red-100 text-red-700 border-red-200 font-bold' :
              type === 'MARATHON' ? 'bg-blue-100 text-blue-700 border-blue-200 font-bold' :
              type === 'ENCUENTRO' ? 'bg-purple-100 text-purple-700 border-purple-200 font-bold' :
              type === 'WORKSHOP' ? 'bg-amber-100 text-amber-800 border-amber-200 font-bold' :
              'bg-green-100 text-green-700 border-green-200 font-bold';

            return (
              <button
                key={type}
                onClick={() => handleTypeToggle(type)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                  isSelected
                    ? `${selectedClass} shadow-xs`
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Right side of Line 2: Country Select, Price Select & Reset Button */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          
          {/* Country Code Dropdown */}
          <select
            id="filter-country-select"
            value={filters.country_code}
            onChange={(e) => setFilters(prev => ({ ...prev, country_code: e.target.value }))}
            className="bg-white border border-gray-200 rounded-md px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="ALL">{t.filter.allCountries}</option>
            {COUNTRY_LIST.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>

          {/* Price Free/Paid Filter */}
          <select
            id="filter-price-select"
            value={filters.price_filter}
            onChange={(e) => setFilters(prev => ({ ...prev, price_filter: e.target.value as any }))}
            className="bg-white border border-gray-200 rounded-md px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="all">{t.filter.allPrices}</option>
            <option value="free">{t.filter.freeOnly}</option>
            <option value="paid">{t.filter.paidOnly}</option>
          </select>

          {/* Reset Filters Button */}
          <button
            id="filter-reset-btn"
            onClick={resetFilters}
            title={t.filter.resetFilters}
            className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 border border-gray-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
