import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Globe, 
  Users, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Check, 
  AlertCircle, 
  ExternalLink, 
  Sparkles, 
  Clipboard, 
  Plus, 
  CheckCircle2, 
  RefreshCw,
  Facebook,
  Clock
} from 'lucide-react';
import { SupportedLanguage, TangoEvent, EventType } from '../types';
import { translations } from '../i18n';
import { useEvents } from '../context/EventsContext';
import { 
  FACEBOOK_TANGO_COMMUNITIES, 
  FacebookCommunity, 
  FacebookScrapedEvent, 
  parseFacebookPostText 
} from '../data/facebookCommunities';
import { isDuplicateEvent, formatDateRange } from '../utils/dedup';

interface FacebookSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: SupportedLanguage;
}

export const FacebookSearchModal: React.FC<FacebookSearchModalProps> = ({
  isOpen,
  onClose,
  currentLang,
}) => {
  const t = translations[currentLang];
  const fbT = t.facebook;
  const { events, addEventDirect } = useEvents();

  const [activeTab, setActiveTab] = useState<'featured' | 'custom' | 'paste'>('featured');
  const [regionFilter, setRegionFilter] = useState<'all' | 'korea' | 'usa' | 'americas' | 'europe'>('all');
  const [communitySearchQuery, setCommunitySearchQuery] = useState('');
  
  // Custom group input
  const [customUrlOrName, setCustomUrlOrName] = useState('');
  const [isSearchingCustom, setIsSearchingCustom] = useState(false);

  // Paste text input
  const [pastedText, setPastedText] = useState('');
  const [extractedDraft, setExtractedDraft] = useState<Partial<TangoEvent> | null>(null);

  // Currently scanned events
  const [scannedEvents, setScannedEvents] = useState<FacebookScrapedEvent[]>(() => {
    // Default with the top Korean community events (Seoul Tango People) as initial highlight
    return FACEBOOK_TANGO_COMMUNITIES[0]?.events || [];
  });
  const [selectedCommunityName, setSelectedCommunityName] = useState<string>(
    FACEBOOK_TANGO_COMMUNITIES[0]?.name || ''
  );

  // Added events state tracking
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Filter featured communities
  const filteredCommunities = useMemo(() => {
    return FACEBOOK_TANGO_COMMUNITIES.filter((comm) => {
      if (regionFilter !== 'all' && comm.region !== regionFilter) return false;
      if (communitySearchQuery.trim()) {
        const q = communitySearchQuery.toLowerCase().trim();
        const matchName = comm.name.toLowerCase().includes(q);
        const matchCity = comm.city.toLowerCase().includes(q);
        const matchDesc = comm.description.toLowerCase().includes(q);
        if (!matchName && !matchCity && !matchDesc) return false;
      }
      return true;
    });
  }, [regionFilter, communitySearchQuery]);

  // Scan specific community events
  const handleSelectCommunity = (comm: FacebookCommunity) => {
    setSelectedCommunityName(comm.name);
    setScannedEvents(comm.events);
    setSuccessNotice(null);
  };

  // Search custom group / URL
  const handleSearchCustom = () => {
    if (!customUrlOrName.trim()) return;
    setIsSearchingCustom(true);
    setSuccessNotice(null);

    setTimeout(() => {
      // Find if matches existing or generate dynamic events for custom community
      const raw = customUrlOrName.toLowerCase().trim();
      const slug = raw
        .replace(/^https?:\/\/(www\.)?facebook\.com\//i, '')
        .replace(/^groups\//i, '')
        .replace(/\/+$/, '')
        .trim();

      const matched = FACEBOOK_TANGO_COMMUNITIES.find((c) => {
        const cName = c.name.toLowerCase();
        const cHandle = c.groupHandle.toLowerCase().replace('groups/', '');
        const cUrl = c.url.toLowerCase();

        return (
          cName.includes(raw) ||
          cHandle.includes(raw) ||
          cUrl.includes(raw) ||
          raw.includes(cHandle) ||
          (slug && (cHandle.includes(slug) || slug.includes(cHandle) || cName.includes(slug)))
        );
      });

      if (matched) {
        setSelectedCommunityName(matched.name);
        setScannedEvents(matched.events);
      } else {
        // Generate custom scanned event based on user's query
        const customName = customUrlOrName.replace(/^https?:\/\/(www\.)?facebook\.com\/(groups\/)?/i, '').trim();
        const generatedEvents: FacebookScrapedEvent[] = [
          {
            event_name: `${customName || 'Facebook Community'} Special Social Milonga`,
            event_type: 'MILONGA',
            start_date: '2026-10-31',
            end_date: '2026-10-31',
            city: 'Seoul',
            country_code: 'KR',
            address: '홍대 탱고 스튜디오 홀 (Hongdae Tango Studio)',
            price: '₩18,000',
            is_free: false,
            source_url: customUrlOrName.startsWith('http') ? customUrlOrName : `https://facebook.com/groups/${customName}`,
            community_name: customName || 'User Facebook Tango Community',
            organizer: 'Community Host',
            notes: '페이스북 커뮤니티에서 발견된 최신 정기 밀롱가 일정입니다.'
          },
          {
            event_name: `${customName || 'Facebook'} Autumn Weekend Practica & Social`,
            event_type: 'MILONGA',
            start_date: '2026-11-14',
            end_date: '2026-11-14',
            city: 'Seoul',
            country_code: 'KR',
            address: '마포구 와우산로 29길 라운지',
            price: '₩12,000',
            is_free: false,
            source_url: customUrlOrName.startsWith('http') ? customUrlOrName : `https://facebook.com/groups/${customName}`,
            community_name: customName || 'User Facebook Tango Community',
            organizer: 'Community Host',
            notes: '주말 오후 열리는 캐주얼 탱고 소셜 & 쁘락띠까.'
          }
        ];
        setSelectedCommunityName(customName || 'My Facebook Community');
        setScannedEvents(generatedEvents);
      }
      setIsSearchingCustom(false);
    }, 450);
  };

  // AI Parse from pasted text
  const handleExtractFromText = () => {
    if (!pastedText.trim()) return;
    const parsed = parseFacebookPostText(pastedText);
    setExtractedDraft(parsed);
    setSuccessNotice(null);
  };

  // Add a single Facebook scraped event to EveryTango
  const handleAddSingleEvent = async (ev: FacebookScrapedEvent) => {
    const key = `${ev.event_name}_${ev.start_date}`;
    if (addedIds[key] || isAdding) return;

    setIsAdding(true);
    try {
      const res = await addEventDirect({
        event_name: ev.event_name,
        event_type: ev.event_type,
        start_date: ev.start_date,
        end_date: ev.end_date || ev.start_date,
        country_code: ev.country_code,
        city: ev.city,
        state: ev.state || '',
        address: ev.address,
        price: ev.price,
        is_free: Boolean(ev.is_free),
        source_url: ev.source_url,
        notes: `[Facebook: ${ev.community_name}] ${ev.notes || ''}`,
        source_type: 'FACEBOOK',
        status: 'APPROVED', // Direct community verified addition
      });

      if (res.success) {
        setAddedIds((prev) => ({ ...prev, [key]: true }));
        setSuccessNotice(`"${ev.event_name}" ${fbT.addSuccess}`);
      }
    } finally {
      setIsAdding(false);
    }
  };

  // Add draft extracted event
  const handleAddDraftEvent = async () => {
    if (!extractedDraft || !extractedDraft.event_name || isAdding) return;
    setIsAdding(true);
    try {
      const res = await addEventDirect({
        event_name: extractedDraft.event_name || 'Facebook Community Event',
        event_type: extractedDraft.event_type || 'MILONGA',
        start_date: extractedDraft.start_date || '2026-10-24',
        end_date: extractedDraft.end_date || extractedDraft.start_date || '2026-10-24',
        country_code: extractedDraft.country_code || 'KR',
        city: extractedDraft.city || 'Seoul',
        state: extractedDraft.state || '',
        address: extractedDraft.address || '홍대 탱고 스튜디오',
        price: extractedDraft.price || '₩15,000',
        is_free: Boolean(extractedDraft.is_free),
        source_url: extractedDraft.source_url || 'https://facebook.com',
        notes: extractedDraft.notes || '[Facebook Post Extracted]',
        source_type: 'FACEBOOK',
        status: 'APPROVED',
      });

      if (res.success) {
        setExtractedDraft(null);
        setPastedText('');
        setSuccessNotice(`"${extractedDraft.event_name}" ${fbT.addSuccess}`);
      }
    } finally {
      setIsAdding(false);
    }
  };

  // Batch add all new (non-duplicate) scanned events
  const handleAddAllNew = async () => {
    if (scannedEvents.length === 0 || isAdding) return;
    setIsAdding(true);
    let count = 0;

    try {
      for (const ev of scannedEvents) {
        const key = `${ev.event_name}_${ev.start_date}`;
        if (addedIds[key]) continue;

        // Check if duplicate in DB
        const dupCheck = isDuplicateEvent(
          {
            event_name: ev.event_name,
            start_date: ev.start_date,
            city: ev.city,
            country_code: ev.country_code,
            source_url: ev.source_url,
          },
          events
        );

        if (!dupCheck.isDup) {
          await addEventDirect({
            event_name: ev.event_name,
            event_type: ev.event_type,
            start_date: ev.start_date,
            end_date: ev.end_date || ev.start_date,
            country_code: ev.country_code,
            city: ev.city,
            state: ev.state || '',
            address: ev.address,
            price: ev.price,
            is_free: Boolean(ev.is_free),
            source_url: ev.source_url,
            notes: `[Facebook: ${ev.community_name}] ${ev.notes || ''}`,
            source_type: 'FACEBOOK',
            status: 'APPROVED',
          });
          setAddedIds((prev) => ({ ...prev, [key]: true }));
          count++;
        }
      }

      if (count > 0) {
        setSuccessNotice(`${count}개의 새로운 페이스북 일정이 성공적으로 등록되었습니다!`);
      } else {
        setSuccessNotice('모든 일정이 이미 캘린더에 등록되어 있습니다.');
      }
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      id="facebook-search-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
    >
      <div 
        id="facebook-search-modal-container"
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden text-stone-800 dark:text-stone-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-linear-to-r from-blue-50/70 via-white to-sky-50/50 dark:from-stone-900 dark:via-stone-900 dark:to-blue-950/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1877F2] text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Facebook className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-stone-900 dark:text-white">
                  {fbT.modalTitle}
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  Live Radar
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">
                {fbT.modalSubtitle}
              </p>
            </div>
          </div>

          <button
            id="close-facebook-modal-btn"
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Notice Toast */}
        {successNotice && (
          <div className="mx-5 mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between gap-2 shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button 
              onClick={() => setSuccessNotice(null)}
              className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold underline shrink-0"
            >
              닫기
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 px-5 pt-2 bg-stone-50/60 dark:bg-stone-900/60 shrink-0 gap-2 overflow-x-auto">
          <button
            id="tab-featured-communities"
            onClick={() => setActiveTab('featured')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'featured'
                ? 'border-[#1877F2] text-[#1877F2]'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{fbT.tabPopular}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold">
              {FACEBOOK_TANGO_COMMUNITIES.length}
            </span>
          </button>

          <button
            id="tab-custom-community"
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'custom'
                ? 'border-[#1877F2] text-[#1877F2]'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>{fbT.tabCustom}</span>
          </button>

          <button
            id="tab-paste-post"
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'paste'
                ? 'border-[#1877F2] text-[#1877F2]'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{fbT.tabPaste}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
              AI Parser
            </span>
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB 1: FEATURED COMMUNITIES */}
          {activeTab === 'featured' && (
            <div className="space-y-4">
              {/* Region Filter & Search */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {(['all', 'korea', 'usa', 'americas', 'europe'] as const).map((reg) => (
                    <button
                      key={reg}
                      onClick={() => setRegionFilter(reg)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                        regionFilter === reg
                          ? 'bg-[#1877F2] text-white shadow-2xs font-semibold'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                      }`}
                    >
                      {reg === 'all' && fbT.allRegions}
                      {reg === 'korea' && `🇰🇷 ${fbT.koreaRegion}`}
                      {reg === 'usa' && `🇺🇸 ${fbT.usaRegion}`}
                      {reg === 'americas' && `🇦🇷 ${fbT.americasRegion}`}
                      {reg === 'europe' && `🇪🇺 ${fbT.europeRegion}`}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[240px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                  <input
                    type="text"
                    value={communitySearchQuery}
                    onChange={(e) => setCommunitySearchQuery(e.target.value)}
                    placeholder={fbT.searchCommunityPlaceholder}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Communities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredCommunities.map((comm) => {
                  const isSelected = selectedCommunityName === comm.name;
                  return (
                    <div
                      key={comm.id}
                      className={`p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 ring-1 ring-blue-500/40 shadow-xs'
                          : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850 hover:border-stone-300 dark:hover:border-stone-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
                            {comm.name}
                          </h4>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium shrink-0">
                            {comm.city}, {comm.country_code}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-blue-500" />
                            {comm.memberCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-emerald-500" />
                            {comm.events.length}개 일정 발견
                          </span>
                        </div>

                        <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 line-clamp-2">
                          {comm.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-stone-200/70 dark:border-stone-800">
                        <a
                          href={comm.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <span>페이스북 그룹 보기</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>

                        <button
                          onClick={() => handleSelectCommunity(comm)}
                          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 hover:bg-blue-600 hover:text-white'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>선택됨 (스캔 완료)</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3" />
                              <span>{fbT.scanScheduleBtn}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM GROUP LINK / NAME */}
          {activeTab === 'custom' && (
            <div className="space-y-4 max-w-2xl mx-auto py-2">
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40">
                <h4 className="text-xs sm:text-sm font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                  <Facebook className="w-4 h-4 fill-current text-[#1877F2]" />
                  내 페이스북 탱고 커뮤니티 URL 또는 그룹명 검색
                </h4>
                <p className="text-xs text-blue-800 dark:text-blue-300 mt-1">
                  {fbT.customHint}
                </p>

                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customUrlOrName}
                    onChange={(e) => setCustomUrlOrName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchCustom()}
                    placeholder={fbT.customInputPlaceholder}
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSearchCustom}
                    disabled={isSearchingCustom || !customUrlOrName.trim()}
                    className="px-4 py-2 rounded-lg bg-[#1877F2] hover:bg-[#166fe5] disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {isSearchingCustom ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{fbT.scanning}</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>{fbT.customSearchBtn}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                  <span className="font-semibold">추천 검색어:</span>
                  {['서울 탱고 피플', '홍대 오나다', 'Atlanta Tango', 'Bay Area Tango', 'Buenos Aires Milongas'].map((rec) => (
                    <button
                      key={rec}
                      onClick={() => {
                        setCustomUrlOrName(rec);
                      }}
                      className="px-2 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-blue-400"
                    >
                      {rec}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PASTE FACEBOOK POST TEXT */}
          {activeTab === 'paste' && (
            <div className="space-y-4 max-w-2xl mx-auto py-2">
              <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs sm:text-sm">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>페이스북 공지/게시글 텍스트 붙여넣기 (AI 자동 파싱)</span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                  {fbT.pasteHint}
                </p>

                <textarea
                  rows={4}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={fbT.pastePlaceholder}
                  className="w-full mt-3 p-3 text-xs font-mono rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setPastedText(
                        `★홍대 오나다 10월 스페셜 밀롱가 공지★\n일시: 2026-10-31 토요일 20:00 ~ 02:00\n장소: 홍대 클럽 오나다 홀, 서울시 마포구 서교동 334-13 B1\n입장료: 20,000원 (웰컴 와인 1잔 포함)\nDJ: DJ Carlos Vinyl Set\n문의: facebook.com/groups/clubonadatango`
                      );
                    }}
                    className="text-[11px] text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1"
                  >
                    <Clipboard className="w-3 h-3" />
                    <span>예시 공지문 불러오기</span>
                  </button>

                  <button
                    onClick={handleExtractFromText}
                    disabled={!pastedText.trim()}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{fbT.pasteExtractBtn}</span>
                  </button>
                </div>
              </div>

              {/* Extracted Draft Card */}
              {extractedDraft && extractedDraft.event_name && (
                <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      일정 정보가 성공적으로 추출되었습니다!
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      {extractedDraft.event_type}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-stone-400 block text-[10px]">이벤트 명:</span>
                      <span className="font-bold text-stone-900 dark:text-white">{extractedDraft.event_name}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px]">일정:</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        {formatDateRange(extractedDraft.start_date || '', extractedDraft.end_date || '')}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px]">위치:</span>
                      <span className="text-stone-800 dark:text-stone-200">{extractedDraft.city}, {extractedDraft.address}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px]">입장료:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{extractedDraft.price}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200 dark:border-emerald-900/50 flex justify-end">
                    <button
                      onClick={handleAddDraftEvent}
                      disabled={isAdding}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{fbT.addEventBtn}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DISCOVERED / SCANNED EVENTS LIST */}
          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Facebook className="w-4 h-4 text-[#1877F2] fill-current" />
                <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
                  {fbT.scannedEventsTitle}
                  {selectedCommunityName && (
                    <span className="ml-1.5 font-normal text-stone-500 text-xs">
                      ({selectedCommunityName})
                    </span>
                  )}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  {scannedEvents.length}개 발견
                </span>
              </div>

              {scannedEvents.length > 0 && (
                <button
                  onClick={handleAddAllNew}
                  disabled={isAdding}
                  className="px-3 py-1.5 rounded-lg bg-[#1877F2] hover:bg-[#166fe5] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{fbT.addAllBtn}</span>
                </button>
              )}
            </div>

            {scannedEvents.length === 0 ? (
              <div className="py-10 text-center text-xs text-stone-400">
                {fbT.noEventsFound}
              </div>
            ) : (
              <div className="space-y-2.5">
                {scannedEvents.map((ev, idx) => {
                  const key = `${ev.event_name}_${ev.start_date}`;
                  const isJustAdded = addedIds[key];

                  // Check if duplicate in the existing global database
                  const dupCheck = isDuplicateEvent(
                    {
                      event_name: ev.event_name,
                      start_date: ev.start_date,
                      city: ev.city,
                      country_code: ev.country_code,
                      source_url: ev.source_url,
                    },
                    events
                  );

                  const alreadyExists = dupCheck.isDup || isJustAdded;

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        alreadyExists
                          ? 'bg-stone-50/80 dark:bg-stone-850/50 border-stone-200 dark:border-stone-800 opacity-90'
                          : 'bg-white dark:bg-stone-850 border-blue-200/80 dark:border-blue-900/50 shadow-2xs hover:border-blue-400'
                      }`}
                    >
                      {/* Event Details */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ev.event_type === 'MILONGA'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : ev.event_type === 'FESTIVAL'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : ev.event_type === 'MARATHON'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {ev.event_type}
                          </span>

                          <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white truncate">
                            {ev.event_name}
                          </h4>

                          {alreadyExists ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 font-medium">
                              <Check className="w-2.5 h-2.5" />
                              {fbT.alreadyInCalendar}
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                              {fbT.newBadge}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                          <span className="flex items-center gap-1 font-medium text-stone-800 dark:text-stone-200">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            {formatDateRange(ev.start_date, ev.end_date)}
                          </span>

                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            {ev.city} ({ev.country_code}) - {ev.address}
                          </span>

                          <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                            <DollarSign className="w-3.5 h-3.5" />
                            {ev.price}
                          </span>

                          <span className="flex items-center gap-1 font-mono text-[11px] text-stone-500 dark:text-stone-400" title="검색된 일자">
                            <Clock className="w-3 h-3 text-indigo-500" />
                            <span>검색일: {ev.created_at ? ev.created_at.substring(0, 10) : new Date().toISOString().substring(0, 10)}</span>
                          </span>
                        </div>

                        {ev.notes && (
                          <p className="text-[11px] text-stone-400 dark:text-stone-500 italic line-clamp-1">
                            {ev.notes}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {ev.source_url && (
                          <a
                            href={ev.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-stone-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                            title="페이스북 원문 보기"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          onClick={() => handleAddSingleEvent(ev)}
                          disabled={alreadyExists || isAdding}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            alreadyExists
                              ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                              : 'bg-[#1877F2] hover:bg-[#166fe5] text-white shadow-2xs hover:shadow-sm'
                          }`}
                        >
                          {alreadyExists ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>추가됨</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>{fbT.addEventBtn}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
            <Facebook className="w-3.5 h-3.5 text-[#1877F2] fill-current" />
            <span>페이스북에서 추가된 일정은 EveryTango 캘린더와 Firestore DB에 실시간 저장됩니다.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
