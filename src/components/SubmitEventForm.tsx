import React, { useState } from 'react';
import { 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles,
  LogIn
} from 'lucide-react';
import { EventType, SupportedLanguage } from '../types';
import { translations, COUNTRY_LIST } from '../i18n';
import { useEvents } from '../context/EventsContext';
import { useAuth } from '../context/AuthContext';

interface SubmitEventFormProps {
  currentLang: SupportedLanguage;
  onSuccessNavigate: () => void;
  onOpenAuth: () => void;
}

export const SubmitEventForm: React.FC<SubmitEventFormProps> = ({
  currentLang,
  onSuccessNavigate,
  onOpenAuth,
}) => {
  const t = translations[currentLang];
  const { submitEvent } = useEvents();
  const { userProfile, currentUser } = useAuth();

  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState<EventType>('FESTIVAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const isAuthenticated = Boolean(userProfile || currentUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setErrorMsg(t.submit.requireLogin);
      return;
    }

    if (!eventName || !startDate || !city || !address || !price || !sourceUrl) {
      setErrorMsg('Please fill in all mandatory fields marked with an asterisk (*).');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setDuplicateWarning(null);

    const isFree = price.toLowerCase().includes('free') || price === '0';

    const res = await submitEvent({
      event_name: eventName.trim(),
      event_type: eventType,
      start_date: startDate,
      end_date: endDate || startDate,
      country_code: countryCode.toUpperCase(),
      city: city.trim(),
      state: state.trim() || undefined,
      address: address.trim(),
      price: price.trim(),
      is_free: isFree,
      source_url: sourceUrl.trim(),
      notes: notes.trim() || undefined,
      submitted_by: userProfile?.id || currentUser?.uid || 'user',
      submitted_by_name: userProfile?.username || currentUser?.email || 'User',
    });

    setLoading(false);

    if (res.success) {
      setSuccessMsg(t.submit.successMessage);
      if (res.duplicateWarning) {
        setDuplicateWarning(res.duplicateWarning);
      }
      setTimeout(() => {
        onSuccessNavigate();
      }, 3500);
    } else {
      setErrorMsg(res.error || 'Failed to submit event.');
    }
  };

  return (
    <div id="submit-event-section" className="max-w-3xl mx-auto my-8">
      
      {/* Header Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold border border-red-100 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workflow: Pending Approval</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {t.submit.title}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t.submit.subtitle}
          </p>
        </div>

        {/* Pending Notice Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-800">Approval Workflow Requirement</p>
            <p>{t.submit.pendingNotice}</p>
          </div>
        </div>

        {/* Require Login Check */}
        {!isAuthenticated && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center space-y-3">
            <p className="text-sm text-gray-700 font-medium">
              {t.submit.requireLogin}
            </p>
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>{t.nav.signIn} / {t.nav.signUp}</span>
            </button>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-xs text-green-900 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="font-bold text-green-800 mb-1">{successMsg}</p>
              {duplicateWarning && (
                <p className="text-amber-800 mt-1">
                  <strong>Notice:</strong> {duplicateWarning}
                </p>
              )}
              <p className="text-[11px] text-gray-500 mt-2">Redirecting to event directory...</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-900 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Row 1: Event Name & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                {t.submit.nameLabel}
              </label>
              <input
                type="text"
                required
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. Atlanta Tango Marathon"
                className="w-full bg-white border border-gray-200 rounded-md px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                {t.submit.typeLabel}
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="w-full bg-white border border-gray-200 rounded-md px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              >
                <option value="FESTIVAL">Festival</option>
                <option value="MARATHON">Marathon</option>
                <option value="ENCUENTRO">Encuentro</option>
                <option value="MILONGA">Milonga</option>
              </select>
            </div>
          </div>

          {/* Row 2: Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                {t.submit.startDate}
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-md px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                {t.submit.endDate}
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-md px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          {/* Row 3: Country, City, State */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                {t.submit.country}
              </label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              >
                {COUNTRY_LIST.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                {t.submit.city}
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Atlanta"
                className="w-full bg-white border border-gray-200 rounded-md px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                {t.submit.state}
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. GA"
                className="w-full bg-white border border-gray-200 rounded-md px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          {/* Row 4: Street Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">
              {t.submit.address}
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Westin Buckhead, 3391 Peachtree Rd NE"
              className="w-full bg-white border border-gray-200 rounded-md px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Row 5: Price and Source URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                {t.submit.price}
              </label>
              <input
                type="text"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={t.submit.priceHelp}
                className="w-full bg-white border border-gray-200 rounded-md px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                {t.submit.sourceUrl}
              </label>
              <input
                type="url"
                required
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/event"
                className="w-full bg-white border border-gray-200 rounded-md px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          {/* Row 6: Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">
              {t.submit.notes}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="DJs, orchestra info, venue floor type, pass details..."
              className="w-full bg-white border border-gray-200 rounded-md px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !isAuthenticated}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm shadow-xs transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? t.submit.submitting : t.submit.submitBtn}</span>
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};
