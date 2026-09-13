import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  AlertCircle,
  CheckCircle2,
  X,
  Download,
  Calendar,
  MapPin,
  Globe,
  Tag,
  DollarSign,
  Link as LinkIcon,
  ArrowLeft,
  Check,
  FolderOpen
} from 'lucide-react';
import { TangoEvent, EventType, SupportedLanguage } from '../types';
import { useEvents } from '../context/EventsContext';
import { isPriceMissing, getDisplayPrice } from '../utils/formatters';

interface ParsedExcelEvent {
  start_date: string;
  end_date: string;
  event_name: string;
  address: string;
  city: string;
  state: string;
  nation: string;
  category: EventType;
  price: string;
  source_url: string;
  country_code: string;
  is_free: boolean;
  raw: {
    startDate: string;
    endDate: string;
    name: string;
    address: string;
    city: string;
    state: string;
    nation: string;
    category: string;
    price: string;
    url: string;
  };
}

interface ExcelBatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessUploaded?: (count: number) => void;
  currentLang?: SupportedLanguage;
  authorId?: string;
  authorEmail?: string;
}

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  korea: 'KR',
  'south korea': 'KR',
  'republic of korea': 'KR',
  대한민국: 'KR',
  한국: 'KR',
  kr: 'KR',
  usa: 'US',
  us: 'US',
  'united states': 'US',
  'united states of america': 'US',
  america: 'US',
  미국: 'US',
  argentina: 'AR',
  아르헨티나: 'AR',
  ar: 'AR',
  spain: 'ES',
  españa: 'ES',
  스페인: 'ES',
  es: 'ES',
  italy: 'IT',
  italia: 'IT',
  이탈리아: 'IT',
  it: 'IT',
  germany: 'DE',
  deutschland: 'DE',
  독일: 'DE',
  de: 'DE',
  france: 'FR',
  프랑스: 'FR',
  fr: 'FR',
  japan: 'JP',
  일본: 'JP',
  jp: 'JP',
  uk: 'GB',
  'united kingdom': 'GB',
  britain: 'GB',
  england: 'GB',
  영국: 'GB',
  gb: 'GB',
  turkey: 'TR',
  türkiye: 'TR',
  터키: 'TR',
  tr: 'TR',
  canada: 'CA',
  캐나다: 'CA',
  ca: 'CA',
  australia: 'AU',
  호주: 'AU',
  au: 'AU',
  mexico: 'MX',
  멕시코: 'MX',
  mx: 'MX',
  taiwan: 'TW',
  대만: 'TW',
  tw: 'TW',
  china: 'CN',
  중국: 'CN',
  cn: 'CN',
  greece: 'GR',
  그리스: 'GR',
  gr: 'GR',
  portugal: 'PT',
  포르투갈: 'PT',
  pt: 'PT',
  netherlands: 'NL',
  holland: 'NL',
  네덜란드: 'NL',
  nl: 'NL',
  poland: 'PL',
  폴란드: 'PL',
  pl: 'PL',
  sweden: 'SE',
  스웨덴: 'SE',
  se: 'SE',
  switzerland: 'CH',
  스위스: 'CH',
  ch: 'CH',
  austria: 'AT',
  오스트리아: 'AT',
  at: 'AT',
  brazil: 'BR',
  브라질: 'BR',
  br: 'BR',
  colombia: 'CO',
  콜롬비아: 'CO',
  co: 'CO',
  chile: 'CL',
  칠레: 'CL',
  cl: 'CL',
  uruguay: 'UY',
  우루과이: 'UY',
  uy: 'UY',
};

// Helper: Normalize Date value from Excel
function normalizeExcelDate(val: any): string {
  if (!val) return '';
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof val === 'number') {
    try {
      const parsed = XLSX.SSF.parse_date_code(val);
      if (parsed && parsed.y && parsed.m && parsed.d) {
        return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
      }
    } catch {
      // ignore
    }
  }
  const str = String(val).trim();
  // match YYYY-MM-DD, YYYY.MM.DD, YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (ymdMatch) {
    return `${ymdMatch[1]}-${ymdMatch[2].padStart(2, '0')}-${ymdMatch[3].padStart(2, '0')}`;
  }
  // match MM/DD/YYYY or MM.DD.YYYY
  const mdyMatch = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (mdyMatch) {
    return `${mdyMatch[3]}-${mdyMatch[1].padStart(2, '0')}-${mdyMatch[2].padStart(2, '0')}`;
  }
  return str;
}

// Helper: Normalize Category
function normalizeCategory(val: any): EventType {
  const s = String(val || '').trim().toLowerCase();
  if (s.includes('fest') || s.includes('페스티벌')) return 'FESTIVAL';
  if (s.includes('marathon') || s.includes('마라톤')) return 'MARATHON';
  if (s.includes('encuentro') || s.includes('엔쿠엔트로')) return 'ENCUENTRO';
  if (s.includes('work') || s.includes('class') || s.includes('워크샵') || s.includes('강습')) return 'WORKSHOP';
  if (s.includes('milonga') || s.includes('social') || s.includes('밀롱가')) return 'MILONGA';
  return 'FESTIVAL';
}

// Helper: Normalize Nation to ISO-2 Code
function normalizeNation(val: any): string {
  const s = String(val || '').trim().toLowerCase();
  if (!s) return 'US';
  if (COUNTRY_NAME_TO_CODE[s]) return COUNTRY_NAME_TO_CODE[s];
  const upper = s.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) return upper;
  return upper.slice(0, 2) || 'US';
}

// Helper: Extract City
function deriveCity(address: string, state: string): string {
  const trimmedState = (state || '').trim();
  // If state is already a city name (like Seoul, Paris, Berlin, Tokyo, Busan)
  const isUsStateCode = /^[A-Z]{2}$/i.test(trimmedState);
  if (trimmedState && !isUsStateCode && trimmedState.length > 2) {
    return trimmedState;
  }
  // Extract from address
  const addr = (address || '').trim();
  const parts = addr.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    // e.g. "800 Miami Cir NE, Atlanta, GA" -> parts[1] is Atlanta
    const candidate = parts[parts.length - 2];
    if (candidate && !/^\d+$/.test(candidate)) {
      return candidate;
    }
  }
  if (parts.length === 1) {
    const firstWord = parts[0].split(' ')[0];
    if (firstWord && firstWord.length > 2) return firstWord;
  }
  return trimmedState || 'City';
}

export const ExcelBatchUploadModal: React.FC<ExcelBatchUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccessUploaded,
  currentLang = 'ko',
  authorId = 'admin',
  authorEmail = 'parkinky@gmail.com',
}) => {
  const { addMultipleEventsDirect } = useEvents();

  const [step, setStep] = useState<'INSTRUCTIONS' | 'PREVIEW' | 'SUCCESS'>('INSTRUCTIONS');
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedExcelEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedCount, setUploadedCount] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetAll = () => {
    setStep('INSTRUCTIONS');
    setFileName('');
    setParsedRows([]);
    setErrorMessage(null);
    setIsUploading(false);
    setUploadedCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  // Download Sample Excel Template
  const handleDownloadSampleTemplate = () => {
    try {
      const wb = XLSX.utils.book_new();
      const wsData = [
        [
          'Event Start Date',
          'Event End Date',
          'Event Name',
          'Address',
          'City',
          'State',
          'Nation',
          'Category',
          'Registration Fee',
          'Web Site Address',
        ],
        [
          '2026-10-15',
          '2026-10-18',
          'Seoul International Tango Festival',
          '123 Teheran-ro, Gangnam-gu',
          'Seoul',
          'Seoul',
          'KR',
          'FESTIVAL',
          '₩180,000',
          'https://seoultangofestival.com',
        ],
        [
          '2026-11-05',
          '2026-11-08',
          'Atlanta Tango Marathon Autumn',
          '800 Miami Cir NE #140',
          'Atlanta',
          'GA',
          'US',
          'MARATHON',
          '$160',
          'https://atlantatangomarathon.com',
        ],
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Events');
      XLSX.writeFile(wb, 'EveryTango_Event_Batch_Template.xlsx');
    } catch (err: any) {
      console.error('Failed to export sample template:', err);
      alert('템플릿 생성 중 오류가 발생했습니다.');
    }
  };

  // Process File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setErrorMessage(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          throw new Error('엑셀 파일에 시트가 존재하지 않습니다.');
        }

        const worksheet = workbook.Sheets[sheetName];
        const rawAoa: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawAoa || rawAoa.length === 0) {
          throw new Error('엑셀 파일이 비어있습니다.');
        }

        // Determine Header Mapping
        // Columns specified: Event Start Date, Event End Date, Event Name, Address, City, State, Nation, Category, Registration Fee, Web Site Address
        let headerRowIndex = -1;
        let colMap = {
          startDate: 0,
          endDate: 1,
          name: 2,
          address: 3,
          city: 4,
          state: 5,
          nation: 6,
          category: 7,
          price: 8,
          url: 9,
        };

        // Inspect first 3 rows to see if headers exist
        for (let r = 0; r < Math.min(rawAoa.length, 3); r++) {
          const row = rawAoa[r];
          if (!row || !Array.isArray(row)) continue;
          const rowText = row.map((c) => String(c || '').toLowerCase().replace(/[^a-z0-9]/g, '')).join(' ');

          if (rowText.includes('startdate') || rowText.includes('eventstart') || rowText.includes('eventname') || rowText.includes('nation') || rowText.includes('city')) {
            headerRowIndex = r;
            // Map columns by name
            row.forEach((cell, idx) => {
              const cleaned = String(cell || '').toLowerCase().replace(/[^a-z0-9]/g, '');
              if (cleaned.includes('startdate') || cleaned.includes('eventstart') || (cleaned.includes('start') && cleaned.includes('date'))) {
                colMap.startDate = idx;
              } else if (cleaned.includes('enddate') || cleaned.includes('eventend') || (cleaned.includes('end') && cleaned.includes('date'))) {
                colMap.endDate = idx;
              } else if (cleaned.includes('eventname') || cleaned.includes('name') || cleaned.includes('title')) {
                colMap.name = idx;
              } else if (cleaned.includes('address') || cleaned.includes('venue') || cleaned.includes('location')) {
                colMap.address = idx;
              } else if (cleaned.includes('city') || cleaned.includes('town')) {
                colMap.city = idx;
              } else if (cleaned.includes('state') || cleaned.includes('province') || cleaned.includes('region')) {
                colMap.state = idx;
              } else if (cleaned.includes('nation') || cleaned.includes('country') || cleaned.includes('nationcode')) {
                colMap.nation = idx;
              } else if (cleaned.includes('category') || cleaned.includes('type') || cleaned.includes('eventtype')) {
                colMap.category = idx;
              } else if (cleaned.includes('registrationfee') || cleaned.includes('fee') || cleaned.includes('price') || cleaned.includes('cost')) {
                colMap.price = idx;
              } else if (cleaned.includes('websiteaddress') || cleaned.includes('website') || cleaned.includes('url') || cleaned.includes('link')) {
                colMap.url = idx;
              }
            });
            break;
          }
        }

        const dataRows = rawAoa.slice(headerRowIndex >= 0 ? headerRowIndex + 1 : 0);
        const parsed: ParsedExcelEvent[] = [];

        dataRows.forEach((row, idx) => {
          if (!row || !Array.isArray(row)) return;
          // Check if row has any non-empty content
          const hasContent = row.some((c) => String(c || '').trim() !== '');
          if (!hasContent) return;

          const rawStartDate = row[colMap.startDate];
          const rawEndDate = row[colMap.endDate];
          const rawName = row[colMap.name];
          const rawAddress = row[colMap.address];
          const rawCity = row[colMap.city];
          const rawState = row[colMap.state];
          const rawNation = row[colMap.nation];
          const rawCategory = row[colMap.category];
          const rawPrice = row[colMap.price];
          const rawUrl = row[colMap.url];

          const startDate = normalizeExcelDate(rawStartDate);
          let endDate = normalizeExcelDate(rawEndDate);
          if (!endDate && startDate) {
            endDate = startDate;
          }

          const eventName = String(rawName || '').trim();
          if (!eventName && !startDate) {
            // Likely an empty row
            return;
          }

          const address = String(rawAddress || '').trim() || 'TBA Venue';
          const userCity = String(rawCity || '').trim();
          const state = String(rawState || '').trim();
          const nation = normalizeNation(rawNation);
          const category = normalizeCategory(rawCategory);
          const rawPriceStr = String(rawPrice || '').trim();

          const isFree = Boolean(rawPriceStr && (rawPriceStr === '0' || rawPriceStr.toLowerCase().includes('free') || rawPriceStr.includes('무료') || rawPriceStr.toLowerCase() === 'gratis'));
          const price = isFree ? 'Free' : (isPriceMissing(rawPriceStr) ? 'N/S' : rawPriceStr);

          let sourceUrl = String(rawUrl || '').trim();
          if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) {
            sourceUrl = 'https://' + sourceUrl;
          }

          const city = userCity || deriveCity(address, state);

          parsed.push({
            start_date: startDate || new Date().toISOString().split('T')[0],
            end_date: endDate || startDate || new Date().toISOString().split('T')[0],
            event_name: eventName || `Tango Event ${idx + 1}`,
            address,
            city,
            state,
            nation,
            category,
            price,
            source_url: sourceUrl || 'https://everytango.com',
            country_code: nation,
            is_free: isFree,
            raw: {
              startDate: String(rawStartDate || ''),
              endDate: String(rawEndDate || ''),
              name: String(rawName || ''),
              address: String(rawAddress || ''),
              city: String(rawCity || ''),
              state: String(rawState || ''),
              nation: String(rawNation || ''),
              category: String(rawCategory || ''),
              price: String(rawPrice || ''),
              url: String(rawUrl || ''),
            },
          });
        });

        if (parsed.length === 0) {
          throw new Error('유효한 이벤트 데이터를 찾을 수 없습니다. 열 형식이 일치하는지 확인해 주세요.');
        }

        // Sort parsed events by event start date ascending
        parsed.sort((a, b) => {
          const dateComp = (a.start_date || '').localeCompare(b.start_date || '');
          if (dateComp !== 0) return dateComp;
          const cityComp = (a.city || '').localeCompare(b.city || '', undefined, { sensitivity: 'base' });
          if (cityComp !== 0) return cityComp;
          const endComp = (a.end_date || '').localeCompare(b.end_date || '');
          if (endComp !== 0) return endComp;
          return (a.event_name || '').localeCompare(b.event_name || '');
        });

        setParsedRows(parsed);
        setStep('PREVIEW');
      } catch (err: any) {
        console.error('Excel parse error:', err);
        setErrorMessage(err.message || '엑셀 파일을 읽는 중 오류가 발생했습니다.');
      }
    };

    reader.onerror = () => {
      setErrorMessage('파일을 읽는 도중 오류가 발생했습니다.');
    };

    reader.readAsArrayBuffer(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Trigger file input
  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  // Confirm and upload to database
  const handleConfirmUpload = async () => {
    if (parsedRows.length === 0) return;
    setIsUploading(true);
    setErrorMessage(null);

    try {
      const eventsToUpload: Omit<TangoEvent, 'id' | 'created_at'>[] = parsedRows.map((item) => ({
        event_name: item.event_name,
        event_type: item.category,
        start_date: item.start_date,
        end_date: item.end_date,
        city: item.city,
        state: item.state || undefined,
        country_code: item.country_code,
        address: item.address,
        price: item.price,
        is_free: item.is_free,
        source_url: item.source_url,
        source_type: 'MANUAL',
        status: 'APPROVED',
        submitted_by: authorId,
        submitted_by_name: 'Admin Batch Upload',
        submitted_by_email: authorEmail,
        notes: `Batch uploaded via Excel (${fileName}) on ${new Date().toISOString().split('T')[0]}`,
      }));

      const res = await addMultipleEventsDirect(eventsToUpload);

      if (!res.success) {
        throw new Error(res.error || '이벤트 업로드에 실패했습니다.');
      }

      setUploadedCount(res.addedCount);
      setStep('SUCCESS');
      if (onSuccessUploaded) {
        onSuccessUploaded(res.addedCount);
      }
    } catch (err: any) {
      console.error('Batch upload error:', err);
      setErrorMessage(err.message || '업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      id="excel-batch-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={handleClose}
    >
      <div
        id="excel-batch-modal-card"
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
          className="hidden"
          id="excel-file-input"
        />

        {/* ------------------------------------------------------------- */}
        {/* STEP 1: INSTRUCTIONS & FILE SELECTION                         */}
        {/* ------------------------------------------------------------- */}
        {step === 'INSTRUCTIONS' && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Excel File Batch Upload</h3>
                  <p className="text-xs text-gray-500">엑셀/구글 시트 파일을 통한 이벤트 일괄 등록</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Instruction Notice Box as specified */}
              <div
                id="excel-columns-instruction-box"
                className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-2 text-sm text-amber-900">
                    <p className="font-bold text-amber-950">
                      Make sure to put the exact column: Event Start Date, Event End Date, Event Name, Address, City, State, Nation, Category, Registration Fee, Web Site Address
                    </p>
                    <p className="text-xs text-amber-800/90 leading-relaxed">
                      엑셀 파일의 열(Column) 순서 또는 첫 번째 행의 열 이름이 위의 10개 항목과 정확히 일치해야 합니다. (구글 스프레드시트에서 .xlsx 또는 .csv로 다운로드한 파일도 지원됩니다.)
                    </p>
                  </div>
                </div>

                {/* Visual Column Tags Display */}
                <div className="mt-3.5 pt-3 border-t border-amber-200/60 flex flex-wrap gap-1.5">
                  {[
                    '1. Event Start Date',
                    '2. Event End Date',
                    '3. Event Name',
                    '4. Address',
                    '5. City',
                    '6. State',
                    '7. Nation',
                    '8. Category',
                    '9. Registration Fee',
                    '10. Web Site Address',
                  ].map((col, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-white text-gray-800 border border-amber-300/70 shadow-2xs"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              {/* Error display if any */}
              {errorMessage && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Drag & Drop or Click Area */}
              <div
                id="excel-drop-zone"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleSelectFileClick}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    업로드할 엑셀(.xlsx, .xls) 또는 구글 시트 내보내기(.csv) 파일을 선택하세요
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    클릭하여 파일 탐색기를 열거나, 이 영역으로 파일을 드래그 앤 드롭하세요
                  </p>
                </div>
              </div>

              {/* Action Buttons: "Excel Form" & "Download Sample Template" */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  id="btn-download-sample-excel"
                  onClick={handleDownloadSampleTemplate}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  title="샘플 양식 다운로드"
                >
                  <Download className="w-4 h-4 text-gray-500" />
                  <span>Excel Form 양식 다운로드 (.xlsx)</span>
                </button>

                <button
                  type="button"
                  id="btn-excel-form"
                  onClick={handleSelectFileClick}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-xs transition-all cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Excel Form</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 2: PREVIEW READ DATA & CANCEL/CONFIRM                    */}
        {/* ------------------------------------------------------------- */}
        {step === 'PREVIEW' && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Excel Data Preview (데이터 미리보기)</h3>
                  <p className="text-xs text-gray-500">
                    파일: <span className="font-semibold text-gray-700">{fileName}</span> · 총{' '}
                    <span className="font-bold text-blue-700">{parsedRows.length}개</span> 이벤트 인식됨
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Table Container */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              <div className="bg-blue-50/60 border border-blue-100 rounded-lg px-4 py-2.5 text-xs text-blue-900 flex items-center justify-between">
                <span>
                  아래 내용을 확인하신 후 하단의 <strong>[확정]</strong> 버튼을 누르면 이벤트 데이터베이스에 즉시 반영됩니다.
                </span>
                <span className="font-bold bg-white px-2 py-0.5 rounded border border-blue-200">
                  {parsedRows.length} 건
                </span>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Responsive Data Table */}
              <div className="border border-gray-200 rounded-lg overflow-x-auto shadow-2xs max-h-[50vh]">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr className="divide-x divide-gray-200 text-left font-bold text-gray-700">
                      <th className="px-2.5 py-2.5 w-10 text-center">#</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Event Start Date</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Event End Date</th>
                      <th className="px-3 py-2.5 min-w-[160px]">Event Name</th>
                      <th className="px-3 py-2.5 min-w-[150px]">Address</th>
                      <th className="px-2.5 py-2.5 whitespace-nowrap">City</th>
                      <th className="px-2.5 py-2.5 whitespace-nowrap">State</th>
                      <th className="px-2.5 py-2.5 whitespace-nowrap">Nation</th>
                      <th className="px-2.5 py-2.5 whitespace-nowrap">Category</th>
                      <th className="px-2.5 py-2.5 whitespace-nowrap">Registration Fee</th>
                      <th className="px-3 py-2.5 min-w-[160px]">Web Site Address</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="divide-x divide-gray-100 hover:bg-gray-50/80 transition-colors">
                        <td className="px-2.5 py-2 text-center text-gray-400 font-mono">{idx + 1}</td>
                        <td className="px-3 py-2 whitespace-nowrap font-mono text-gray-800">{row.start_date}</td>
                        <td className="px-3 py-2 whitespace-nowrap font-mono text-gray-800">{row.end_date}</td>
                        <td className="px-3 py-2 font-semibold text-gray-900">{row.event_name}</td>
                        <td className="px-3 py-2 text-gray-600 truncate max-w-[200px]" title={row.address}>
                          {row.address}
                        </td>
                        <td className="px-2.5 py-2 text-gray-700 whitespace-nowrap font-medium">{row.city || '-'}</td>
                        <td className="px-2.5 py-2 text-gray-700 whitespace-nowrap">{row.state || '-'}</td>
                        <td className="px-2.5 py-2 whitespace-nowrap">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 font-mono font-bold text-[11px]">
                            {row.nation}
                          </span>
                        </td>
                        <td className="px-2.5 py-2 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.category === 'MARATHON'
                                ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                : row.category === 'FESTIVAL'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : row.category === 'ENCUENTRO'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {row.category}
                          </span>
                        </td>
                        <td className="px-2.5 py-2 whitespace-nowrap font-medium text-gray-800">
                          {row.is_free ? (
                            <span className="text-emerald-700 font-bold">Free</span>
                          ) : (
                            <span className={isPriceMissing(row.price) ? 'text-gray-400 font-medium font-mono' : ''}>
                              {getDisplayPrice(row.price)}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-blue-600 truncate max-w-[200px]" title={row.source_url}>
                          {row.source_url ? (
                            <a
                              href={row.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline flex items-center gap-1"
                            >
                              <LinkIcon className="w-3 h-3 shrink-0" />
                              <span>{row.source_url}</span>
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer with "취소" and "확정" buttons as requested */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/80">
              <button
                type="button"
                id="btn-excel-preview-cancel"
                onClick={() => {
                  setErrorMessage(null);
                  setStep('INSTRUCTIONS');
                }}
                disabled={isUploading}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>취소</span>
              </button>

              <button
                type="button"
                id="btn-excel-preview-confirm"
                onClick={handleConfirmUpload}
                disabled={isUploading || parsedRows.length === 0}
                className="inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold shadow-xs transition-all cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>데이터베이스 업로드 중...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>확정</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 3: SUCCESS POPUP ("이벤트 업로드 완료되었습니다")         */}
        {/* ------------------------------------------------------------- */}
        {step === 'SUCCESS' && (
          <div className="p-8 text-center space-y-5 my-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-gray-900">이벤트 업로드 완료되었습니다</h3>
              <p className="text-sm text-gray-600">
                총 <strong className="text-emerald-700 font-bold">{uploadedCount}개</strong>의 이벤트가 데이터베이스에
                성공적으로 등록되었습니다.
              </p>
            </div>

            <div className="pt-3">
              <button
                type="button"
                id="btn-excel-success-confirm"
                onClick={handleClose}
                className="px-8 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs transition-all cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
