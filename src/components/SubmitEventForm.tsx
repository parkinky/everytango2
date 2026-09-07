import React, { useState, useEffect, useMemo } from 'react';
import { 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles,
  LogIn,
  Check,
  X,
  ShieldCheck,
  Edit3,
  Search,
  Trash2,
  PlusCircle,
  Save,
  ArrowRight,
  ExternalLink,
  Calendar,
  MapPin,
  Tag,
  UserCheck,
  Mail
} from 'lucide-react';
import { EventType, EventStatus, SupportedLanguage, TangoEvent } from '../types';
import { translations, COUNTRY_LIST } from '../i18n';
import { useEvents } from '../context/EventsContext';
import { useAuth } from '../context/AuthContext';
import { recommendStateForCity } from '../utils/cityStateMap';

interface SubmitEventFormProps {
  currentLang: SupportedLanguage;
  onSuccessNavigate: () => void;
  onOpenAuth: () => void;
  initialEditEventId?: string | null;
  onClearEditEventId?: () => void;
}

export const SubmitEventForm: React.FC<SubmitEventFormProps> = ({
  currentLang,
  onSuccessNavigate,
  onOpenAuth,
  initialEditEventId,
  onClearEditEventId,
}) => {
  // Always use English for the Submit Event screen as explicitly requested
  const t = translations.en;
  const { events, submitEvent, addEventDirect, updateEvent, deleteEvent } = useEvents();
  const { userProfile, currentUser, loginCustom, loginWithGoogle } = useAuth();

  const isAuthenticated = Boolean(currentUser || userProfile);
  const authorId = userProfile?.username || userProfile?.id || (currentUser?.email ? currentUser.email.split('@')[0] : currentUser?.uid ? currentUser.uid.slice(0, 10) : 'guest_author');
  const authorEmail = userProfile?.email || currentUser?.email || '';

  // Admin Check
  const isAdmin = Boolean(
    userProfile?.role === 'ADMIN' || 
    currentUser?.email === 'parkinky@gmail.com' || 
    userProfile?.username === 'parkinky'
  );

  // Admin Mode: 'CREATE' | 'EDIT'
  const [adminMode, setAdminMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventSearchQuery, setEventSearchQuery] = useState('');

  // Form Fields
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
  const [status, setStatus] = useState<EventStatus>('APPROVED');

  // Recommended State for City (triggered by Tab or onBlur)
  const [recommendedState, setRecommendedState] = useState<string | null>(null);
  const [stateAutoApplied, setStateAutoApplied] = useState(false);

  // City recommendation handler triggered on input change, Tab key, or blur
  const handleCityRecommendState = (cityValue: string, isTyping = false) => {
    let cleanCity = cityValue.trim();
    if (!cleanCity) {
      if (stateAutoApplied) {
        setState('');
      }
      setRecommendedState(null);
      setStateAutoApplied(false);
      return;
    }

    // Handle case where user typed "Atlanta, GA" or "New York, NY"
    if (cleanCity.includes(',')) {
      const parts = cleanCity.split(',').map(p => p.trim());
      if (parts.length >= 2 && parts[1]) {
        cleanCity = parts[0];
        setCity(parts[0]);
        const extractedState = parts[1].toUpperCase();
        setRecommendedState(extractedState);
        setState(extractedState);
        setStateAutoApplied(true);
        return;
      }
    }

    const rec = recommendStateForCity(cleanCity, countryCode, events);
    if (rec) {
      setRecommendedState(rec.state);
      // Auto-fill state if it is currently empty or was previously auto-applied
      if (!state.trim() || stateAutoApplied) {
        setState(rec.state);
        setStateAutoApplied(true);
      }
      // If a country code is suggested and current country is default 'US'
      if (rec.countryCode && countryCode === 'US' && rec.countryCode !== 'US') {
        setCountryCode(rec.countryCode);
      }
    } else {
      if (!isTyping || cleanCity.length < 3) {
        if (stateAutoApplied) {
          setState('');
          setStateAutoApplied(false);
        }
        setRecommendedState(null);
      }
    }
  };

  // UI States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSubmittedModal, setShowSubmittedModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);

  // Admin Login Inputs
  const [adminIdInput, setAdminIdInput] = useState('');
  const [adminPwInput, setAdminPwInput] = useState('');
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState('');

  // Auto-select event when initialEditEventId is passed
  useEffect(() => {
    if (initialEditEventId) {
      const target = events.find(e => e.id === initialEditEventId);
      if (target) {
        populateFormFromEvent(target);
        setAdminMode('EDIT');
      }
    }
  }, [initialEditEventId, events]);

  const populateFormFromEvent = (ev: TangoEvent) => {
    setSelectedEventId(ev.id);
    setEventName(ev.event_name);
    setEventType(ev.event_type);
    setStartDate(ev.start_date);
    setEndDate(ev.end_date || '');
    setCountryCode(ev.country_code || 'US');
    setCity(ev.city);
    setState(ev.state || '');
    setAddress(ev.address || '');
    setPrice(ev.price || '');
    setSourceUrl(ev.source_url || '');
    setNotes(ev.notes || '');
    setStatus(ev.status || 'APPROVED');
    setRecommendedState(null);
    setStateAutoApplied(false);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const resetForm = () => {
    setSelectedEventId(null);
    setEventName('');
    setEventType('FESTIVAL');
    setStartDate('');
    setEndDate('');
    setCountryCode('US');
    setCity('');
    setState('');
    setRecommendedState(null);
    setStateAutoApplied(false);
    setAddress('');
    setPrice('');
    setSourceUrl('');
    setNotes('');
    setStatus(isAdmin ? 'APPROVED' : 'PENDING');
    setErrorMsg('');
    setSuccessMsg('');
    if (onClearEditEventId) {
      onClearEditEventId();
    }
  };

  // Switch between Create and Edit modes
  const handleSwitchMode = (mode: 'CREATE' | 'EDIT') => {
    setAdminMode(mode);
    setErrorMsg('');
    setSuccessMsg('');
    if (mode === 'CREATE') {
      resetForm();
    } else {
      if (!selectedEventId && events.length > 0) {
        populateFormFromEvent(events[0]);
      }
    }
  };

  // Filter events for the admin selector
  const filteredEventsForPicker = useMemo(() => {
    if (!eventSearchQuery.trim()) {
      return events.slice(0, 30);
    }
    const q = eventSearchQuery.toLowerCase();
    return events.filter(e => 
      e.event_name.toLowerCase().includes(q) ||
      e.city.toLowerCase().includes(q) ||
      e.country_code.toLowerCase().includes(q) ||
      e.start_date.includes(q)
    ).slice(0, 30);
  }, [events, eventSearchQuery]);

  // Handle Form Submission (Both New Submission and Admin Edit)
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setErrorMsg(t.submit.requireLogin);
      return;
    }

    if (!eventName || !startDate || !city || !address || !price) {
      setErrorMsg('Please fill in all mandatory fields marked with an asterisk (*).');
      return;
    }

    setErrorMsg('');

    if (isAdmin && adminMode === 'EDIT' && selectedEventId) {
      // In Edit Mode, execute update directly with confirm
      handleSaveEdit();
    } else {
      // In Regular Submission or Admin Create Mode, open confirm dialog
      setShowConfirmModal(true);
    }
  };

  // Save changes to existing event (Admin Edit)
  const handleSaveEdit = async () => {
    if (!selectedEventId) return;

    setLoading(true);
    setErrorMsg('');

    const isFree = price.toLowerCase().includes('free') || price === '0';
    const effectiveEndDate = endDate.trim() ? endDate.trim() : startDate.trim();

    const trimmedUrl = sourceUrl.trim();
    const effectiveSourceUrl = trimmedUrl
      ? (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')
          ? trimmedUrl
          : `https://${trimmedUrl}`)
      : '';

    const updatePayload: Partial<TangoEvent> = {
      event_name: eventName.trim(),
      event_type: eventType,
      start_date: startDate.trim(),
      end_date: effectiveEndDate,
      country_code: countryCode.toUpperCase(),
      city: city.trim(),
      state: state.trim() || undefined,
      address: address.trim(),
      price: price.trim(),
      is_free: isFree,
      source_url: effectiveSourceUrl,
      notes: notes.trim() || undefined,
      status: status,
    };

    const res = await updateEvent(selectedEventId, updatePayload);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(`Event "${eventName.trim()}" updated successfully!`);
    } else {
      setErrorMsg(res.error || 'Failed to update event.');
    }
  };

  // Confirm submission for Create / Submit
  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setErrorMsg('');
    setDuplicateWarning(null);

    const isFree = price.toLowerCase().includes('free') || price === '0';
    const effectiveEndDate = endDate.trim() ? endDate.trim() : startDate.trim();

    const trimmedUrl = sourceUrl.trim();
    const effectiveSourceUrl = trimmedUrl
      ? (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')
          ? trimmedUrl
          : `https://${trimmedUrl}`)
      : '';

    // If Admin, directly publish as APPROVED (or selected status)
    if (isAdmin) {
      const res = await addEventDirect({
        event_name: eventName.trim(),
        event_type: eventType,
        start_date: startDate.trim(),
        end_date: effectiveEndDate,
        country_code: countryCode.toUpperCase(),
        city: city.trim(),
        state: state.trim() || undefined,
        address: address.trim(),
        price: price.trim(),
        is_free: isFree,
        source_url: effectiveSourceUrl,
        notes: notes.trim() || undefined,
        status: status,
        source_type: 'MANUAL',
        submitted_by: authorId,
        submitted_by_name: userProfile?.username || currentUser?.email || 'Admin',
        submitted_by_email: authorEmail,
      });

      setLoading(false);
      if (res.success) {
        setSuccessMsg(`Event "${eventName.trim()}" directly published with status: ${status}!`);
        setShowSubmittedModal(true);
      } else {
        setErrorMsg(res.error || 'Failed to add event.');
      }
    } else {
      // Normal user workflow (PENDING review)
      const res = await submitEvent({
        event_name: eventName.trim(),
        event_type: eventType,
        start_date: startDate.trim(),
        end_date: effectiveEndDate,
        country_code: countryCode.toUpperCase(),
        city: city.trim(),
        state: state.trim() || undefined,
        address: address.trim(),
        price: price.trim(),
        is_free: isFree,
        source_url: effectiveSourceUrl,
        notes: notes.trim() || undefined,
        submitted_by: authorId,
        submitted_by_name: userProfile?.username || currentUser?.email?.split('@')[0] || 'Tango Organizer',
        submitted_by_email: authorEmail,
      });

      setLoading(false);
      if (res.success) {
        setSuccessMsg(`Submitted to administrator for review. An automated approval confirmation email will be sent to ${authorEmail || 'your email'} once approved.`);
        if (res.duplicateWarning) {
          setDuplicateWarning(res.duplicateWarning);
        }
        setShowSubmittedModal(true);
      } else {
        setErrorMsg(res.error || 'Failed to submit event.');
      }
    }
  };

  // Delete event handler (Admin only)
  const handleDeleteEvent = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    await deleteEvent(selectedEventId);
    setLoading(false);
    setShowDeleteModal(false);
    resetForm();
    setSuccessMsg('Event deleted successfully.');
  };

  // Admin Login from this screen
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginLoading(true);
    setAdminLoginError('');
    const res = await loginCustom(adminIdInput, adminPwInput);
    setAdminLoginLoading(false);
    if (res.success) {
      setShowAdminLoginModal(false);
      setAdminIdInput('');
      setAdminPwInput('');
    } else {
      setAdminLoginError(res.error || 'Authentication failed. Please check credentials.');
    }
  };

  const handleGoogleAdminLogin = async () => {
    setAdminLoginLoading(true);
    setAdminLoginError('');
    try {
      await loginWithGoogle();
      setShowAdminLoginModal(false);
    } catch (err: any) {
      setAdminLoginError(err.message || 'Google sign-in failed.');
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const currentlyEditingEvent = events.find(e => e.id === selectedEventId);

  return (
    <div id="submit-event-section" className="max-w-4xl mx-auto my-6 sm:my-8 space-y-6">
      
      {/* ------------------------------------------------------------- */}
      {/* TOP STATUS BAR: ADMIN RECOGNITION OR ADMIN SIGN-IN PROMPT     */}
      {/* ------------------------------------------------------------- */}
      {isAdmin ? (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded">
                  Admin Privileges Active
                </span>
                <span className="text-[11px] text-gray-500 font-mono">
                  {userProfile?.username || currentUser?.email}
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-900 mt-0.5">
                Administrator Event Management & Editor
              </h3>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-white border border-gray-200 p-1 rounded-lg shadow-2xs self-start sm:self-auto">
            <button
              type="button"
              id="admin-mode-edit-tab"
              onClick={() => handleSwitchMode('EDIT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                adminMode === 'EDIT'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Existing Event</span>
            </button>
            <button
              type="button"
              id="admin-mode-create-tab"
              onClick={() => handleSwitchMode('CREATE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                adminMode === 'CREATE'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Register New Event</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-gray-600">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Community event upload with moderation review workflow.</span>
          </div>
          <button
            type="button"
            id="open-admin-login-btn"
            onClick={() => setShowAdminLoginModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-red-600 transition-colors cursor-pointer bg-white px-2.5 py-1 rounded-md border border-gray-200 hover:border-red-300"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
            <span>Admin Sign In</span>
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ADMIN EVENT SELECTOR (Visible when Admin in EDIT mode)        */}
      {/* ------------------------------------------------------------- */}
      {isAdmin && adminMode === 'EDIT' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-red-600" />
              <span>Select Event to Edit:</span>
            </label>
            <span className="text-xs text-gray-400 font-medium">
              Total {events.length} events loaded
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={eventSearchQuery}
                onChange={(e) => setEventSearchQuery(e.target.value)}
                placeholder="Search by event name, city, country..."
                className="w-full bg-gray-50 border border-gray-200 rounded-md pl-9 pr-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:bg-white"
              />
            </div>

            {/* Dropdown Selector */}
            <div>
              <select
                id="admin-event-picker-dropdown"
                value={selectedEventId || ''}
                onChange={(e) => {
                  const ev = events.find(item => item.id === e.target.value);
                  if (ev) {
                    populateFormFromEvent(ev);
                  } else {
                    resetForm();
                  }
                }}
                className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 truncate"
              >
                <option value="">-- Choose an event ({filteredEventsForPicker.length} displayed) --</option>
                {filteredEventsForPicker.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    [{ev.start_date.replace(/-/g, '/')}] {ev.event_name} - {ev.city}, {ev.country_code} ({ev.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Currently Editing Highlight Banner */}
          {currentlyEditingEvent && (
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between gap-3 text-xs text-blue-900">
              <div className="flex items-center gap-2 truncate">
                <Edit3 className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-semibold truncate">
                  Now Editing: <strong className="text-blue-950">{currentlyEditingEvent.event_name}</strong>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white text-blue-700 border border-blue-200 shrink-0">
                  {currentlyEditingEvent.status}
                </span>
                <span className="text-blue-600/70 font-mono text-[11px] shrink-0">
                  {currentlyEditingEvent.start_date.replace(/-/g, '/')}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {currentlyEditingEvent.source_url && (
                  <a
                    href={currentlyEditingEvent.source_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100"
                    title="Open Source Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MAIN FORM CARD                                               */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        
        {/* Form Header with Author Profile on Top Right */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 pb-5 border-b border-gray-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold border border-red-100 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isAdmin && adminMode === 'EDIT'
                  ? 'Admin Mode: Live Content Editor'
                  : isAdmin
                  ? 'Admin Mode: Direct Instant Publishing'
                  : 'Workflow: Community Submission'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {isAdmin && adminMode === 'EDIT'
                ? 'Edit Event Details'
                : t.submit.title}
            </h2>
            <p className="text-sm text-gray-500 mt-1 max-w-xl leading-relaxed">
              {isAdmin && adminMode === 'EDIT'
                ? 'Update event names, dates, pricing, venue details, or visibility status with real-time persistence.'
                : t.submit.subtitle}
            </p>
          </div>

          {/* Top Right: Author ID and Email Information Card */}
          <div 
            id="author-info-card" 
            className="w-full md:w-auto md:min-w-[290px] bg-slate-50/90 border border-slate-200 rounded-xl p-3.5 sm:px-4 sm:py-3 shadow-2xs self-start"
          >
            <div className="flex items-center justify-between gap-2 pb-1.5 mb-2 border-b border-slate-200/70">
              <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-red-600" />
                Submitter Profile
              </span>
              {isAdmin ? (
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                  ADMIN
                </span>
              ) : isAuthenticated ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                  VERIFIED USER
                </span>
              ) : (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  GUEST
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500 font-medium text-[11px]">Author ID:</span>
                <span className="font-mono font-bold text-gray-900 truncate max-w-[170px]" title={authorId}>
                  {authorId}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500 font-medium text-[11px]">Email Address:</span>
                <span className="font-mono font-semibold text-blue-700 truncate max-w-[185px]" title={authorEmail || 'No email registered'}>
                  {authorEmail || '(Please sign in to register email)'}
                </span>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-200/70 text-[10.5px] text-gray-500 flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-red-500 shrink-0" />
              <span>Automated approval reply sent to this email</span>
            </div>
          </div>
        </div>

        {/* Pending Notice Box (Only for non-admin) */}
        {!isAdmin && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-800">Approval Workflow Requirement</p>
              <p>{t.submit.pendingNotice}</p>
            </div>
          </div>
        )}

        {/* Require Login Check (Non-admin) */}
        {!isAuthenticated && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center space-y-3">
            <p className="text-sm text-gray-700 font-medium">
              {t.submit.requireLogin}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{t.nav.signIn} / {t.nav.signUp}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAdminLoginModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs font-bold transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Login</span>
              </button>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-xs text-green-900 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="font-bold text-green-800">{successMsg}</p>
              {duplicateWarning && (
                <p className="text-amber-800">
                  <strong>Notice:</strong> {duplicateWarning}
                </p>
              )}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onSuccessNavigate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-700 hover:bg-green-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>Go to Event Directory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setSuccessMsg('')}
                    className="text-xs text-green-700 hover:text-green-900 underline font-medium cursor-pointer"
                  >
                    Continue Editing
                  </button>
                )}
              </div>
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

        {/* Submission / Edit Form */}
        <form onSubmit={handlePreSubmit} className="space-y-5">
          
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
                <option value="WORKSHOP">Workshop</option>
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700">
                  {t.submit.endDate}
                </label>
                <span className="text-[11px] text-gray-400 font-normal">
                  (Optional - defaults to 1-day)
                </span>
              </div>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Optional (1-day if omitted)"
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
                {t.submit.city} *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => {
                  const val = e.target.value;
                  setCity(val);
                  handleCityRecommendState(val, true);
                }}
                onBlur={() => handleCityRecommendState(city, false)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    handleCityRecommendState(city, false);
                  }
                }}
                placeholder="e.g. Atlanta"
                className="w-full bg-white border border-gray-200 rounded-md px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <label className="text-xs font-bold text-gray-700">
                  {t.submit.state}
                </label>
                {recommendedState && (
                  <div className="flex items-center gap-1">
                    {state.trim().toUpperCase() === recommendedState.toUpperCase() ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Recommended State: {recommendedState} (Applied)</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setState(recommendedState);
                          setStateAutoApplied(true);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded border border-red-200 cursor-pointer transition-colors"
                        title={`Click to apply "${recommendedState}"`}
                      >
                        <Sparkles className="w-3 h-3 text-red-500" />
                        <span>Recommended: {recommendedState} (Apply)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              <input
                type="text"
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setStateAutoApplied(false);
                }}
                placeholder="e.g. GA"
                className="w-full bg-white border border-gray-200 rounded-md px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
              {recommendedState && state.trim().toUpperCase() !== recommendedState.toUpperCase() && (
                <p className="text-[11px] text-gray-500 flex items-center gap-1">
                  <span>💡 Recommended State for {city.trim()}:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setState(recommendedState);
                      setStateAutoApplied(true);
                    }}
                    className="font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    "{recommendedState}" (Click to apply)
                  </button>
                </p>
              )}
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700">
                  {t.submit.sourceUrl}
                </label>
                <span className="text-[11px] text-gray-400 font-normal">
                  (Optional)
                </span>
              </div>
              <input
                type="text"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/event (optional)"
                className="w-full bg-white border border-gray-200 rounded-md px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          {/* Row 6 (Admin Only): Event Publication Status */}
          {isAdmin && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-red-600" />
                <span>Publication Status:</span>
              </label>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="eventStatus"
                    value="APPROVED"
                    checked={status === 'APPROVED'}
                    onChange={() => setStatus('APPROVED')}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                    APPROVED (Public Directory Live)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="eventStatus"
                    value="PENDING"
                    checked={status === 'PENDING'}
                    onChange={() => setStatus('PENDING')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    PENDING (Needs Review)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="eventStatus"
                    value="REJECTED"
                    checked={status === 'REJECTED'}
                    onChange={() => setStatus('REJECTED')}
                    className="text-gray-600 focus:ring-gray-500"
                  />
                  <span className="font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                    REJECTED (Archived/Hidden)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Row 7: Notes */}
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

          {/* Action Buttons Cluster */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            {isAdmin && adminMode === 'EDIT' && selectedEventId ? (
              <>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-xs transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving Changes...' : 'Save Changes'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={loading}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-3 px-4 rounded-md bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-sm transition-all cursor-pointer"
                  title="Delete this event"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full sm:w-auto py-3 px-4 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </>
            ) : isAdmin && adminMode === 'CREATE' ? (
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm shadow-xs transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{loading ? 'Publishing...' : 'Publish Event Directly'}</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !isAuthenticated}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm shadow-xs transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? t.submit.submitting : t.submit.submitBtn}</span>
              </button>
            )}
          </div>

        </form>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CONFIRMATION MODAL ("Confirm Event Submission")              */}
      {/* ------------------------------------------------------------- */}
      {showConfirmModal && (
        <div 
          id="submit-confirm-modal-overlay"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowConfirmModal(false)}
        >
          <div 
            id="submit-confirm-modal"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100 text-center space-y-4 animate-in fade-in zoom-in duration-150"
          >
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isAdmin ? 'Publish this Event Directly?' : 'Confirm Event Submission'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {isAdmin 
                  ? `The event will be created and immediately set to status: ${status}.`
                  : 'Your event will be forwarded to the administrator for review and approval.'}
              </p>
            </div>

            {/* Submitter & Email Details Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-left space-y-1.5 text-xs text-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Event Name:</span>
                <span className="font-bold text-gray-900 truncate max-w-[200px]">{eventName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Author ID:</span>
                <span className="font-mono font-bold text-gray-800">{authorId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Author Email:</span>
                <span className="font-mono font-semibold text-blue-700">{authorEmail || '(No email provided)'}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 text-[11px] text-gray-600 flex items-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Automated Reply:</strong> Once approved, an automated confirmation email in English will be sent to <strong>{authorEmail || 'your email'}</strong> and your event will be displayed live immediately.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                id="submit-confirm-no-btn"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="submit-confirm-yes-btn"
                onClick={handleConfirmSubmit}
                className="flex-1 py-2.5 px-4 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
              >
                Yes, Submit Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBMITTED SUCCESS MODAL                                       */}
      {/* ------------------------------------------------------------- */}
      {showSubmittedModal && (
        <div 
          id="submit-success-modal-overlay"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div 
            id="submit-success-modal"
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100 text-center space-y-4 animate-in fade-in zoom-in duration-150"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isAdmin ? 'Event Published!' : 'Event Successfully Submitted!'}
              </h3>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                {isAdmin 
                  ? 'Your event has been recorded in the database and is live on the public directory.'
                  : `Your event "${eventName}" has been submitted to the administrator for review.`}
              </p>

              {!isAdmin && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 text-left text-xs text-blue-900 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-blue-800">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>Automated Email Notification</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-blue-800/90">
                    When an administrator approves this event, an automated reply email in English will be delivered to <strong>{authorEmail || 'your email'}</strong>, and your event will appear immediately on the global schedule.
                  </p>
                </div>
              )}

              {duplicateWarning && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded-md p-2 mt-2 border border-amber-200 text-left">
                  <strong>Notice:</strong> {duplicateWarning}
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                id="submit-success-ok-btn"
                onClick={() => {
                  setShowSubmittedModal(false);
                  onSuccessNavigate();
                }}
                className="w-full py-2.5 px-4 rounded-md bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
              >
                OK (Go to Events Directory)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DELETE CONFIRMATION MODAL                                     */}
      {/* ------------------------------------------------------------- */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-gray-100 text-center space-y-4 animate-in fade-in zoom-in duration-150"
          >
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Delete this event?
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to permanently delete "<strong>{eventName}</strong>"? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 px-4 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEvent}
                className="flex-1 py-2.5 px-4 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* QUICK ADMIN SIGN IN MODAL (If user wants to sign in as admin) */}
      {/* ------------------------------------------------------------- */}
      {showAdminLoginModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowAdminLoginModal(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 text-gray-900 space-y-5 animate-in fade-in zoom-in duration-150"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Administrator Authentication
                  </h3>
                  <p className="text-xs text-gray-500">
                    Sign in with admin authority to edit event content.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminLoginModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {adminLoginError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{adminLoginError}</span>
              </div>
            )}

            {/* Google Admin Login */}
            <button
              type="button"
              onClick={handleGoogleAdminLogin}
              disabled={adminLoginLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 border border-gray-300 text-xs font-bold shadow-2xs transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Sign in with Google Account</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-gray-200 w-full" />
              <span className="bg-white px-2.5 text-[11px] text-gray-400 font-medium uppercase">or password</span>
            </div>

            {/* Credential Login Form */}
            <form onSubmit={handleAdminLoginSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Admin Username / Email
                </label>
                <input
                  type="text"
                  value={adminIdInput}
                  onChange={(e) => setAdminIdInput(e.target.value)}
                  placeholder="e.g. parkinky"
                  required
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-red-600 focus:bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={adminPwInput}
                  onChange={(e) => setAdminPwInput(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-red-600 focus:bg-white text-gray-900"
                />
              </div>

              <button
                type="submit"
                disabled={adminLoginLoading}
                className="w-full py-2.5 px-4 rounded-md bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
              >
                {adminLoginLoading ? 'Authenticating...' : 'Sign In as Admin'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
