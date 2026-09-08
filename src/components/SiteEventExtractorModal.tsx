import React, { useState, useEffect } from 'react';
import {
  X,
  Globe,
  Calendar,
  Clock,
  MapPin,
  Check,
  AlertCircle,
  ExternalLink,
  Download,
  Clipboard,
  RefreshCw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { TangoEvent, EventType, EventStatus, CrawlingChannel } from '../types';
import { useEvents } from '../context/EventsContext';
import { isDuplicateEvent } from '../utils/dedup';
import { auth } from '../firebase';

// This modal is an admin-only tool and the endpoint it calls makes the
// server fetch third-party URLs, so it now requires the caller to be a
// signed-in admin (see requireAdmin in server.ts). Attach the ID token.
async function adminAuthHeaders(): Promise<Record<string, string>> {
  try {
    const idToken = await auth.currentUser?.getIdToken();
    return idToken ? { Authorization: `Bearer ${idToken}` } : {};
  } catch {
    return {};
  }
}

interface ExtractedSiteEvent {
  id?: string;
  eventName: string;
  eventType: EventType;
  startDate: string;
  endDate: string;
  timeStr: string;
  city: string;
  state: string;
  countryCode: string;
  address?: string;
  price?: string;
  isFree?: boolean;
  sourceUrl: string;
  channelName: string;
  organizer?: string;
  rawDateStr?: string;
  notes?: string;
}

interface SiteEventExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: CrawlingChannel | null;
  onSuccess?: (addedCount: number) => void;
}

export const SiteEventExtractorModal: React.FC<SiteEventExtractorModalProps> = ({
  isOpen,
  onClose,
  channel,
  onSuccess,
}) => {
  const { events, addEventDirect } = useEvents();

  const [activeTab, setActiveTab] = useState<'fetch' | 'paste'>('fetch');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [extractedList, setExtractedList] = useState<ExtractedSiteEvent[]>([]);
  const [subSitesSearched, setSubSitesSearched] = useState<string[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [pastedContent, setPastedContent] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Fetch from registered site URL
  const fetchFromSite = async (targetChannel: CrawlingChannel) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setExtractedList([]);
    setSubSitesSearched([]);
    setSelectedIndices([]);

    try {
      const resp = await fetch('/api/crawler/extract-site-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await adminAuthHeaders()) },
        body: JSON.stringify({
          url: targetChannel.url,
          channelName: targetChannel.name,
          sourceType: targetChannel.sourceType,
          city: targetChannel.city || 'Roswell',
          state: targetChannel.state || 'GA',
          countryCode: targetChannel.country_code || 'US',
        }),
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} 오류가 발생했습니다.`);
      }

      const data = await resp.json();
      if (data.subSitesSearched && Array.isArray(data.subSitesSearched)) {
        setSubSitesSearched(data.subSitesSearched);
      }
      if (data.events && Array.isArray(data.events) && data.events.length > 0) {
        setExtractedList(data.events);
        // Preselect all non-duplicate events
        const initialSelected: number[] = [];
        data.events.forEach((ev: ExtractedSiteEvent, idx: number) => {
          const dup = isDuplicateEvent(
            {
              event_name: ev.eventName,
              start_date: ev.startDate,
              city: ev.city,
              country_code: ev.countryCode,
              source_url: ev.sourceUrl,
            },
            events
          );
          if (!dup.isDup) {
            initialSelected.push(idx);
          }
        });
        setSelectedIndices(initialSelected);
        setSuccessMsg(data.message || `${data.events.length}건의 이벤트 내용을 추출했습니다.`);
      } else {
        setErrorMsg(
          data.message ||
            '등록된 사이트에서 직접 이벤트를 추출하지 못했습니다. [화면 내용 직접 붙여넣기] 탭에서 화면 텍스트를 붙여넣어주세요.'
        );
      }
    } catch (err: any) {
      console.error('Fetch site events error:', err);
      setErrorMsg(`사이트 내용 조회 실패: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Parse pasted raw text/html from the open browser tab
  const handleParsePasted = async () => {
    if (!pastedContent.trim()) {
      setErrorMsg('붙여넣을 텍스트 내용을 입력해주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setExtractedList([]);
    setSelectedIndices([]);

    try {
      const resp = await fetch('/api/crawler/extract-site-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await adminAuthHeaders()) },
        body: JSON.stringify({
          url: channel?.url || 'https://www.facebook.com/groups/tangobaratlanta/events',
          channelName: channel?.name || 'Tango Bar Atlanta',
          city: channel?.city || 'Roswell',
          state: channel?.state || 'GA',
          countryCode: channel?.country_code || 'US',
          rawContent: pastedContent,
        }),
      });

      const data = await resp.json();
      if (data.events && Array.isArray(data.events) && data.events.length > 0) {
        setExtractedList(data.events);
        const initialSelected: number[] = [];
        data.events.forEach((ev: ExtractedSiteEvent, idx: number) => {
          const dup = isDuplicateEvent(
            {
              event_name: ev.eventName,
              start_date: ev.startDate,
              city: ev.city,
              country_code: ev.countryCode,
              source_url: ev.sourceUrl,
            },
            events
          );
          if (!dup.isDup) {
            initialSelected.push(idx);
          }
        });
        setSelectedIndices(initialSelected);
        setSuccessMsg(`화면 내용 분석 성공: ${data.events.length}건의 이벤트(이름, 날짜, 시간)를 추출했습니다.`);
      } else {
        setErrorMsg('입력된 내용에서 날짜 및 이벤트 제목을 감지하지 못했습니다. 형식을 확인해주세요.');
      }
    } catch (err: any) {
      setErrorMsg(`텍스트 분석 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && channel) {
      setActiveTab('fetch');
      fetchFromSite(channel);
    }
  }, [isOpen, channel]);

  if (!isOpen || !channel) return null;

  const toggleSelectAll = () => {
    if (selectedIndices.length === extractedList.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(extractedList.map((_, i) => i));
    }
  };

  const toggleSelectOne = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  // Import selected events to PENDING status
  const handleImportSelected = async () => {
    if (selectedIndices.length === 0) {
      setErrorMsg('가져올 이벤트를 선택해주세요.');
      return;
    }

    setIsImporting(true);
    let imported = 0;

    for (const idx of selectedIndices) {
      const item = extractedList[idx];
      if (!item) continue;

      const determinedPrice = item.price || (item.eventType === 'FESTIVAL' ? '~$240' : '~$25');

      const eventData: Omit<TangoEvent, 'id' | 'created_at'> = {
        event_name: item.eventName,
        event_type: item.eventType || 'MILONGA',
        start_date: item.startDate,
        end_date: item.endDate || item.startDate,
        city: item.city || channel.city || 'Roswell',
        state: item.state || channel.state || 'GA',
        country_code: item.countryCode || channel.country_code || 'US',
        address: item.address || 'Ballroom Impact, 1425 Market Blvd, Suite 525, Roswell, GA 30076',
        price: determinedPrice,
        is_free: item.isFree || determinedPrice === 'Free' || determinedPrice === '~$0',
        source_url: item.sourceUrl || channel.url,
        source_type: 'AUTO_CRAWLED',
        status: 'PENDING' as EventStatus,
        submitted_by: `Site Extractor (${channel.name})`,
        submitted_by_name: channel.name,
        notes: item.notes || `[등록 사이트(${channel.name}) 내용 추출 | 최고가 옵션: ${determinedPrice} | 일시: ${item.rawDateStr || item.startDate} ${item.timeStr || ''}]`,
      };

      try {
        const res = await addEventDirect(eventData);
        if (res.success) {
          imported++;
        }
      } catch (e) {
        console.warn('Import event failed:', e);
      }
    }

    setIsImporting(false);
    if (onSuccess) {
      onSuccess(imported);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base leading-tight">
                등록 사이트 내용(이벤트 이름·날짜·시간) 가져오기
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                채널: <strong className="text-gray-900">{channel.name}</strong> ({channel.city}, {channel.country_code})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel URL bar & Tabs */}
        <div className="px-6 py-3 bg-white border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 max-w-md truncate">
            <Globe className="w-4 h-4 text-blue-600 shrink-0" />
            <a
              href={channel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline font-mono truncate inline-flex items-center gap-1"
              title={channel.url}
            >
              <span>{channel.url}</span>
              <ExternalLink className="w-3 h-3 shrink-0 text-gray-400" />
            </a>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center p-1 bg-gray-100 rounded-lg text-xs font-semibold text-gray-600">
            <button
              onClick={() => setActiveTab('fetch')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'fetch' ? 'bg-white text-gray-900 shadow-2xs' : 'hover:text-gray-900'
              }`}
            >
              사이트 직접 조회
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                activeTab === 'paste' ? 'bg-white text-gray-900 shadow-2xs' : 'hover:text-gray-900'
              }`}
            >
              <Clipboard className="w-3 h-3" />
              <span>화면 내용 붙여넣기</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMsg}</div>
            </div>
          )}

          {/* Tab 1: Site direct fetch status */}
          {activeTab === 'fetch' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-600 font-semibold">
                  사이트에서 발견된 다가오는 이벤트 ({extractedList.length}건)
                </span>
                <button
                  type="button"
                  onClick={() => fetchFromSite(channel)}
                  disabled={loading}
                  className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>새로고침</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Paste mode */}
          {activeTab === 'paste' && (
            <div className="space-y-3 bg-gray-50/70 p-4 rounded-xl border border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">브라우저 열린 화면 텍스트 붙여넣기</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    페이스북 등 로그인된 브라우저 창에서 마우스 드래그 또는 전체선택(Ctrl+A) 후 복사(Ctrl+C)한 텍스트를 붙여넣으세요.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleParsePasted}
                  disabled={loading || !pastedContent.trim()}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>내용 분석 & 추출</span>
                </button>
              </div>

              <textarea
                value={pastedContent}
                onChange={(e) => setPastedContent(e.target.value)}
                placeholder="예: 
다가오는 이벤트
9월 8일 화 오후 7시 CDT
An Evening with Rene Torres
Shelley Brooks님이 공유함

9월 12일 토 오후 7:30 CDT
The Tango Lounge Milonga ROUGE-GUEST DJ LYNN
Buddy Dale Diego Stotts님이 공유함
..."
                rows={5}
                className="w-full p-3 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-600"
              />
            </div>
          )}

          {/* Sub-sites searched banner if present */}
          {subSitesSearched.length > 0 && (
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                <span>서브 사이트 자동 탐색 완료 ({subSitesSearched.length}개 페이지 검색됨)</span>
              </div>
              <p className="text-[11px] text-blue-700">
                메인 사이트 및 연결된 하위 일정/티켓/워크숍 페이지를 함께 검색하여 최고가 옵션 금액을 반영했습니다.
              </p>
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {subSitesSearched.map((sUrl, sIdx) => (
                  <a
                    key={sIdx}
                    href={sUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-blue-200 text-[11px] text-blue-800 hover:text-blue-950 font-mono hover:underline"
                  >
                    <ExternalLink className="w-3 h-3 text-blue-500" />
                    <span>{sUrl.replace(/^https?:\/\/[^\/]+/, '') || '/'}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Events Table / List */}
          {loading ? (
            <div className="py-12 text-center text-gray-500 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-red-600" />
              <p className="text-xs font-medium">공식 사이트 및 서브 사이트에 접근하여 다가오는 이벤트와 최고가 옵션 비용을 추출하는 중입니다...</p>
            </div>
          ) : extractedList.length === 0 ? (
            <div className="py-10 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl">
              <p className="text-xs">추출된 이벤트가 없습니다.</p>
              <p className="text-[11px] text-gray-400 mt-1">
                상단의 [새로고침]을 누르거나 [화면 내용 붙여넣기] 탭을 이용해주세요.
              </p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between text-xs text-gray-700 font-bold">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIndices.length === extractedList.length && extractedList.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <span>전체 선택 ({selectedIndices.length}/{extractedList.length})</span>
                </div>
                <span className="text-[11px] text-gray-500 font-normal">
                  * 선택된 항목만 [승인대상 목록(PENDING)]으로 등록됩니다
                </span>
              </div>

              <div className="divide-y divide-gray-100 max-h-[380px] overflow-y-auto">
                {extractedList.map((item, idx) => {
                  const isSelected = selectedIndices.includes(idx);
                  const displayPrice = item.price || (item.eventType === 'FESTIVAL' ? '~$240' : '~$25');
                  const dupCheck = isDuplicateEvent(
                    {
                      event_name: item.eventName,
                      start_date: item.startDate,
                      city: item.city,
                      country_code: item.countryCode,
                      source_url: item.sourceUrl,
                    },
                    events
                  );

                  return (
                    <div
                      key={idx}
                      onClick={() => toggleSelectOne(idx)}
                      className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer text-xs ${
                        isSelected ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent onClick
                        className="mt-1 rounded text-red-600 focus:ring-red-500 cursor-pointer shrink-0"
                      />

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-gray-900 text-sm">{item.eventName}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                            {item.eventType}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            비용: {displayPrice}
                          </span>
                          {dupCheck.isDup ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              이미 등록됨 ({dupCheck.duplicateOf?.status})
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              신규 발견 (가져오기 가능)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-gray-600 text-xs flex-wrap font-mono">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-bold text-gray-900">{item.startDate}</span>
                            {item.endDate && item.endDate !== item.startDate && (
                              <span>~ {item.endDate}</span>
                            )}
                          </div>
                          {item.timeStr && (
                            <div className="flex items-center gap-1 text-blue-700 font-semibold">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{item.timeStr}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 font-sans">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span>{item.city}, {item.state}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                          {item.organizer && (
                            <p>
                              주최/공유: <span className="font-medium text-gray-700">{item.organizer}</span>
                            </p>
                          )}
                          {item.sourceUrl && (
                            <p className="flex items-center gap-1 text-gray-500 font-mono">
                              <span>출처:</span>
                              <span className="text-gray-700 underline truncate max-w-[200px]">
                                {item.sourceUrl}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-600">
            총 <strong className="text-gray-900">{selectedIndices.length}</strong>개 선택됨
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-colors"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleImportSelected}
              disabled={isImporting || selectedIndices.length === 0}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              <span>
                {isImporting
                  ? '가져오는 중...'
                  : `선택한 ${selectedIndices.length}건 [승인대상(PENDING)]으로 가져오기`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
