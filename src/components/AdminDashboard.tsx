import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Bot, 
  Check, 
  X, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  Calendar, 
  AlertTriangle,
  Database,
  Filter,
  Users,
  Clock,
  Sparkles,
  Plus,
  Search,
  KeyRound,
  Shield,
  Send,
  Eye,
  Settings,
  ChevronRight,
  ArrowRight,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { SupportedLanguage, TangoEvent, UserProfile, UserRole, EventType, EventStatus } from '../types';
import { translations } from '../i18n';
import { useEvents } from '../context/EventsContext';
import { useAuth } from '../context/AuthContext';
import { useSiteConfig } from '../context/SiteConfigContext';
import { formatTwoLineDate } from '../utils/dedup';
import { formatTwoLineAddress, convertPriceToUSD } from '../utils/formatters';
import { exportEventsToExcel } from '../utils/excelExport';

interface AdminDashboardProps {
  currentLang: SupportedLanguage;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentLang }) => {
  const t = translations[currentLang];
  const { 
    events, 
    approveEvent, 
    rejectEvent, 
    deleteEvent, 
    addEventDirect,
    runWeeklyCrawler,
    stats 
  } = useEvents();

  const { 
    userProfile, 
    currentUser, 
    loginCustom, 
    logout, 
    getAllUsers, 
    updateUserRole, 
    deleteUser 
  } = useAuth();

  const { 
    siteConfig, 
    updateSiteConfig, 
    cronConfig, 
    updateCronConfig, 
    addCronLog, 
    callGeminiWebsiteManager 
  } = useSiteConfig();

  // Admin Authentication State
  const isAdmin = userProfile?.role === 'ADMIN' || currentUser?.email === 'parkinky@gmail.com' || userProfile?.username === 'parkinky';
  const [adminIdInput, setAdminIdInput] = useState('parkinky');
  const [adminPwInput, setAdminPwInput] = useState('admin');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Main SubTab: 'events' | 'users' | 'cron' | 'gemini'
  const [activeTab, setActiveTab] = useState<'events' | 'users' | 'cron' | 'gemini'>('events');

  // --- EVENTS TAB STATE ---
  const [eventFilterStatus, setEventFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [newEventForm, setNewEventForm] = useState({
    event_name: '',
    event_type: 'FESTIVAL' as EventType,
    start_date: '2026-10-15',
    end_date: '2026-10-18',
    country_code: 'KR',
    city: 'Seoul',
    state: '',
    address: 'Gangnam Tango Studio, Seoul',
    price: '₩120,000',
    source_url: 'https://everytango.com/events/seoul',
    notes: 'Official festival passes with master workshops and grand milongas.',
    status: 'APPROVED' as EventStatus,
  });

  // --- USERS TAB STATE ---
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserDetails, setSelectedUserDetails] = useState<UserProfile | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);

  // --- CRON TAB STATE ---
  const [crawlerRunning, setCrawlerRunning] = useState(false);
  const [crawlerResult, setCrawlerResult] = useState<{
    addedCount: number;
    duplicateCount: number;
    duplicatesDetails: string[];
  } | null>(null);

  // --- GEMINI TAB STATE ---
  const [geminiPrompt, setGeminiPrompt] = useState('');
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiResponse, setGeminiResponse] = useState<string>('');
  const [geminiSuggestedConfig, setGeminiSuggestedConfig] = useState<any>(null);
  const [geminiStatusMessage, setGeminiStatusMessage] = useState<string>('');

  // Load users when entering user management tab
  useEffect(() => {
    if (isAdmin) {
      loadAllUsers();
    }
  }, [isAdmin]);

  const loadAllUsers = async () => {
    setUsersLoading(true);
    try {
      const list = await getAllUsers();
      setUserList(list);
    } catch (e) {
      console.warn('Failed to load users:', e);
    } finally {
      setUsersLoading(false);
    }
  };

  // Quick Admin Login
  const handleAdminLogin = async (idToUse?: string, pwToUse?: string) => {
    setLoginLoading(true);
    setLoginError('');
    const id = idToUse || adminIdInput;
    const pw = pwToUse || adminPwInput;

    const res = await loginCustom(id, pw);
    setLoginLoading(false);
    if (!res.success) {
      setLoginError(res.error || 'Authentication failed. Please verify credentials.');
    } else {
      loadAllUsers();
    }
  };

  // Add Event Handler
  const handleCreateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventForm.event_name || !newEventForm.start_date || !newEventForm.city) {
      alert('Please fill in required fields (Event Name, Start Date, City)');
      return;
    }

    const res = await addEventDirect({
      ...newEventForm,
      source_type: 'MANUAL',
      submitted_by: userProfile?.id || 'admin_parkinky',
      submitted_by_name: userProfile?.username || 'parkinky (ADMIN)',
    });

    if (res.success) {
      setIsAddEventModalOpen(false);
      setNewEventForm({
        event_name: '',
        event_type: 'FESTIVAL',
        start_date: '2026-10-15',
        end_date: '2026-10-18',
        country_code: 'KR',
        city: 'Seoul',
        state: '',
        address: 'Gangnam Tango Studio, Seoul',
        price: '₩120,000',
        source_url: 'https://everytango.com/events/seoul',
        notes: '',
        status: 'APPROVED',
      });
      alert('Event added successfully!');
    } else {
      alert('Failed to add event: ' + res.error);
    }
  };

  // Delete Event Handler
  const handleDeleteEvent = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      await deleteEvent(id);
    }
  };

  // Run Crawler Handler
  const handleRunCrawler = async () => {
    setCrawlerRunning(true);
    setCrawlerResult(null);
    const startTime = Date.now();
    try {
      const res = await runWeeklyCrawler();
      setCrawlerResult(res);
      addCronLog({
        id: 'cron_' + Date.now(),
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
        itemsDiscovered: res.addedCount + res.duplicateCount,
        itemsAdded: res.addedCount,
        duplicatesBlocked: res.duplicateCount,
        durationMs: Date.now() - startTime,
        message: `Manual crawl completed: ${res.addedCount} new events added, ${res.duplicateCount} duplicates blocked.`,
      });
    } finally {
      setCrawlerRunning(false);
    }
  };

  // Gemini Website Management prompt submit
  const handleGeminiSubmit = async (customPrompt?: string) => {
    const promptToSend = customPrompt || geminiPrompt;
    if (!promptToSend.trim()) return;

    setGeminiLoading(true);
    setGeminiStatusMessage('');
    try {
      const res = await callGeminiWebsiteManager(promptToSend, 'WEBSITE_CHANGE', {
        totalEvents: events.length,
        approvedEvents: events.filter(e => e.status === 'APPROVED').length,
        pendingEvents: events.filter(e => e.status === 'PENDING').length,
        totalUsers: userList.length,
      });

      setGeminiResponse(res.reply);
      setGeminiSuggestedConfig(res.suggestedConfig || null);
    } catch (err: any) {
      setGeminiResponse('Error calling Gemini: ' + (err.message || 'Unknown error'));
    } finally {
      setGeminiLoading(false);
    }
  };

  // Apply Gemini suggested configuration to live site
  const handleApplyGeminiConfig = () => {
    if (geminiSuggestedConfig) {
      updateSiteConfig(geminiSuggestedConfig);
      setGeminiStatusMessage('Website configuration has been updated live! Homepage reflects new changes.');
      setGeminiSuggestedConfig(null);
    }
  };

  // Filter events for Event Management tab
  const filteredEventsForAdmin = events.filter((ev) => {
    if (eventFilterStatus !== 'ALL' && ev.status !== eventFilterStatus) {
      return false;
    }
    if (eventSearchQuery.trim()) {
      const q = eventSearchQuery.toLowerCase();
      return (
        ev.event_name.toLowerCase().includes(q) ||
        ev.city.toLowerCase().includes(q) ||
        ev.country_code.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filter users for User Management tab
  const filteredUsers = userList.filter((u) => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.city.toLowerCase().includes(q) ||
      u.country_code.toLowerCase().includes(q)
    );
  });

  // -------------------------------------------------------------
  // VIEW: ADMIN LOGIN REQUIRED (If not logged in as admin)
  // -------------------------------------------------------------
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white border border-gray-200 rounded-2xl shadow-sm text-gray-900">
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-gray-900">
            Admin Authentication
          </h3>
          <p className="text-xs text-gray-500">
            Sign in with your Everytango administrator account to manage events, users, scheduled crawler jobs, and website settings.
          </p>
        </div>

        {loginError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        {/* 1-Click Fast Login for Parkinky */}
        <div className="mb-6 p-4 rounded-xl bg-red-50/60 border border-red-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-red-700 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              Default Credentials
            </span>
            <span className="text-[11px] font-mono text-red-600 bg-white px-2 py-0.5 rounded border border-red-200">
              id: parkinky / pw: admin
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleAdminLogin('parkinky', 'admin')}
            disabled={loginLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Shield className="w-4 h-4" />
            <span>{loginLoading ? 'Signing in...' : '⚡ Quick Admin Login (parkinky)'}</span>
          </button>
        </div>

        {/* Manual Input Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleAdminLogin(); }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Admin Username / ID
            </label>
            <input
              type="text"
              value={adminIdInput}
              onChange={(e) => setAdminIdInput(e.target.value)}
              placeholder="parkinky"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-600 focus:bg-white text-gray-900"
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
              placeholder="admin"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-600 focus:bg-white text-gray-900"
            />
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            {loginLoading ? 'Authenticating...' : 'Sign In as Admin'}
          </button>
        </form>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: AUTHENTICATED ADMINISTRATOR DASHBOARD
  // -------------------------------------------------------------
  return (
    <div id="admin-dashboard-root" className="max-w-7xl mx-auto my-6 space-y-6">
      
      {/* Top Admin Header Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-100">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SUPER ADMIN CONSOLE</span>
            </span>
            <span className="text-xs text-gray-500 font-mono">
              Account: <strong className="text-gray-900">{userProfile?.username || 'parkinky'}</strong>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Everytango Admin Console
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Event moderation, complete user directory, crawler scheduler, and Gemini AI website configuration.
          </p>
        </div>

        {/* Quick KPI Badges & Logout */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-xs flex items-center gap-2">
            <Calendar className="w-4 h-4 text-red-600" />
            <span>Events: <strong className="text-gray-900 font-bold">{events.length}</strong></span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-xs flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Users: <strong className="text-gray-900 font-bold">{userList.length}</strong></span>
          </div>
          <button
            onClick={logout}
            className="px-3 py-2 rounded-lg bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Sign Out"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'events'
              ? 'bg-red-50 text-red-700 border border-red-200 shadow-xs'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
          }`}
        >
          <Calendar className="w-4 h-4 text-red-600" />
          <span>Events ({events.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('users'); loadAllUsers(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-red-50 text-red-700 border border-red-200 shadow-xs'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
          }`}
        >
          <Users className="w-4 h-4 text-blue-600" />
          <span>User Directory ({userList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cron')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'cron'
              ? 'bg-red-50 text-red-700 border border-red-200 shadow-xs'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Crawler & Cron Jobs</span>
        </button>

        <button
          onClick={() => setActiveTab('gemini')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'gemini'
              ? 'bg-red-50 text-red-700 border border-red-200 shadow-xs'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>Gemini AI Manager</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EVENT MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          
          {/* Controls Bar: Search, Status Filter & Add Button */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-500 mr-1">Status:</span>
              {(['ALL', 'APPROVED', 'PENDING', 'REJECTED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setEventFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    eventFilterStatus === st
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st === 'APPROVED' ? 'Approved' : st === 'PENDING' ? 'Pending' : 'Rejected'}
                  <span className="ml-1 text-[10px] opacity-75">
                    ({st === 'ALL' ? events.length : events.filter(e => e.status === st).length})
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by event, city..."
                  value={eventSearchQuery}
                  onChange={(e) => setEventSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-600 focus:bg-white text-gray-900"
                />
              </div>

              {/* Export to Excel Button */}
              <button
                onClick={() => exportEventsToExcel(filteredEventsForAdmin, 'EveryTango_Admin_Events.xlsx')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
                title="Export filtered events to Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>

              {/* Add New Event Direct Button */}
              <button
                onClick={() => setIsAddEventModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Event</span>
              </button>
            </div>
          </div>

          {/* Event Table (Single screen compact layout: Dates & Address formatted in 2 lines) */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-600 uppercase font-semibold">
                    <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-4">Event Name</th>
                    <th className="py-2.5 px-3">Location & Address</th>
                    <th className="py-2.5 px-3">Price (USD)</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEventsForAdmin.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400 text-xs">
                        No events found matching current criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEventsForAdmin.map((ev) => {
                      const { start, end } = formatTwoLineDate(ev.start_date, ev.end_date);
                      const addr = formatTwoLineAddress(ev);
                      const usd = convertPriceToUSD(ev.price, ev.is_free);

                      return (
                        <tr key={ev.id} className="hover:bg-gray-50/80 transition-colors">
                          
                          {/* Date (2 Lines: Start date, ~ End date for compact single screen view) */}
                          <td className="py-2.5 px-3 whitespace-nowrap font-medium">
                            <div className="flex flex-col font-mono text-xs leading-tight">
                              <span className="text-gray-900 font-semibold">{start}</span>
                              {end && <span className="text-gray-500 text-[11px]">{end}</span>}
                            </div>
                          </td>

                          {/* Type */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                              {ev.event_type}
                            </span>
                          </td>

                          {/* Event Name & Link */}
                          <td className="py-2.5 px-4 font-bold text-gray-900 max-w-xs truncate">
                            <div className="flex items-center gap-1.5">
                              <span title={ev.event_name}>{ev.event_name}</span>
                              {ev.source_url && (
                                <a
                                  href={ev.source_url}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="text-gray-400 hover:text-red-600"
                                  title="Open source URL"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </td>

                          {/* Location & Address in 2 lines */}
                          <td className="py-2.5 px-3 leading-tight max-w-xs">
                            <div className="font-semibold text-gray-900 truncate">
                              {addr.locationLine}
                            </div>
                            <div className="text-[11px] text-gray-500 truncate" title={addr.venueLine}>
                              {addr.venueLine}
                            </div>
                          </td>

                          {/* Price in USD */}
                          <td className="py-2.5 px-3 whitespace-nowrap font-semibold">
                            <div className="leading-tight">
                              <span className={`font-mono text-xs font-bold ${usd.isFree ? 'text-green-600' : 'text-gray-900'}`}>
                                {usd.usdFormatted}
                              </span>
                              {usd.originalFormatted && usd.originalFormatted !== usd.usdFormatted && (
                                <div className="text-[10px] text-gray-400 font-mono font-normal">
                                  ({usd.originalFormatted})
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {ev.status === 'APPROVED' && (
                              <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold border border-green-200">
                                APPROVED
                              </span>
                            )}
                            {ev.status === 'PENDING' && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                                PENDING
                              </span>
                            )}
                            {ev.status === 'REJECTED' && (
                              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold border border-gray-200">
                                REJECTED
                              </span>
                            )}
                          </td>

                          {/* Source */}
                          <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-gray-500">
                            {ev.source_type === 'AUTO_CRAWLED' ? '🤖 Auto Crawler' : '✍️ Manual'}
                          </td>

                          {/* Actions: Delete & Approve/Reject */}
                          <td className="py-2.5 px-3 whitespace-nowrap text-right space-x-1.5">
                            {ev.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => approveEvent(ev.id)}
                                  className="px-2 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                                  title="Approve and Publish"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => rejectEvent(ev.id)}
                                  className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-[11px] font-semibold transition-colors cursor-pointer"
                                  title="Reject"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {ev.status === 'REJECTED' && (
                              <button
                                onClick={() => approveEvent(ev.id)}
                                className="px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-[11px] font-bold cursor-pointer"
                              >
                                Re-approve
                              </button>
                            )}

                            {/* Delete Event Button */}
                            <button
                              onClick={() => handleDeleteEvent(ev.id, ev.event_name)}
                              className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors inline-block cursor-pointer"
                              title="Delete Event"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Direct Add Event Modal */}
          {isAddEventModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-red-600" />
                    <h3 className="font-extrabold text-lg text-gray-900">Add New Event</h3>
                  </div>
                  <button
                    onClick={() => setIsAddEventModalOpen(false)}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-900 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateEventSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Event Name *</label>
                    <input
                      type="text"
                      required
                      value={newEventForm.event_name}
                      onChange={(e) => setNewEventForm({ ...newEventForm, event_name: e.target.value })}
                      placeholder="e.g. 2026 Seoul International Tango Marathon"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-red-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Event Type</label>
                      <select
                        value={newEventForm.event_type}
                        onChange={(e) => setNewEventForm({ ...newEventForm, event_type: e.target.value as EventType })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-red-600"
                      >
                        <option value="FESTIVAL">FESTIVAL</option>
                        <option value="MARATHON">MARATHON</option>
                        <option value="ENCUENTRO">ENCUENTRO</option>
                        <option value="MILONGA">MILONGA</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Initial Status</label>
                      <select
                        value={newEventForm.status}
                        onChange={(e) => setNewEventForm({ ...newEventForm, status: e.target.value as EventStatus })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-red-600"
                      >
                        <option value="APPROVED">APPROVED (Publish immediately)</option>
                        <option value="PENDING">PENDING (Review required)</option>
                      </select>
                    </div>
                  </div>

                  {/* 2-line Dates: Start Date & End Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Start Date *</label>
                      <input
                        type="date"
                        required
                        value={newEventForm.start_date}
                        onChange={(e) => setNewEventForm({ ...newEventForm, start_date: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">End Date *</label>
                      <input
                        type="date"
                        required
                        value={newEventForm.end_date}
                        onChange={(e) => setNewEventForm({ ...newEventForm, end_date: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-red-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Country Code (2-letters) *</label>
                      <input
                        type="text"
                        required
                        maxLength={2}
                        value={newEventForm.country_code}
                        onChange={(e) => setNewEventForm({ ...newEventForm, country_code: e.target.value.toUpperCase() })}
                        placeholder="KR"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 font-mono uppercase focus:bg-white focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={newEventForm.city}
                        onChange={(e) => setNewEventForm({ ...newEventForm, city: e.target.value })}
                        placeholder="Seoul"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Price</label>
                      <input
                        type="text"
                        value={newEventForm.price}
                        onChange={(e) => setNewEventForm({ ...newEventForm, price: e.target.value })}
                        placeholder="$120 or Free"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-red-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={newEventForm.address}
                      onChange={(e) => setNewEventForm({ ...newEventForm, address: e.target.value })}
                      placeholder="Gangnam Tango Studio, Seoul"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-red-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Official Website URL</label>
                    <input
                      type="url"
                      value={newEventForm.source_url}
                      onChange={(e) => setNewEventForm({ ...newEventForm, source_url: e.target.value })}
                      placeholder="https://example.com/event"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-red-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Notes & Details</label>
                    <textarea
                      rows={2}
                      value={newEventForm.notes}
                      onChange={(e) => setNewEventForm({ ...newEventForm, notes: e.target.value })}
                      placeholder="DJ lineup, schedule details, registration info..."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-red-600"
                    />
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsAddEventModalOpen(false)}
                      className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow-xs cursor-pointer"
                    >
                      Create Event
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: USER MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          
          {/* User Controls & Search */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-base text-gray-900">User Directory & Role Administration</h3>
              <p className="text-xs text-gray-500">
                View registered user IDs, usernames, emails, phone numbers, country, city, roles, join dates, and security questions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search username, email, city..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-600 focus:bg-white text-gray-900"
                />
              </div>

              <button
                onClick={loadAllUsers}
                disabled={usersLoading}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
                title="Refresh User List"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-600 uppercase font-semibold">
                    <th className="py-2.5 px-3">UID</th>
                    <th className="py-2.5 px-3">Username</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Country / City</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Joined Date</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400 text-xs">
                        No registered users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isAdminRole = u.role === 'ADMIN' || u.username === 'parkinky';
                      return (
                        <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500">{u.id}</td>
                          <td className="py-2.5 px-3 font-bold text-gray-900 flex items-center gap-1.5">
                            <span>{u.username}</span>
                            {u.username === 'parkinky' && (
                              <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                                MASTER
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">{u.email}</td>
                          <td className="py-2.5 px-3 font-mono text-gray-600">{u.phone || '—'}</td>
                          <td className="py-2.5 px-3 text-gray-600">
                            <span className="font-mono font-bold text-gray-800 mr-1">{u.country_code}</span>
                            <span>{u.city}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isAdminRole
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {isAdminRole ? 'ADMIN' : 'USER'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-gray-500">
                            {u.created_at ? u.created_at.substring(0, 10) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-1.5">
                            <button
                              onClick={() => setSelectedUserDetails(u)}
                              className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold cursor-pointer"
                            >
                              Details
                            </button>
                            {u.username !== 'parkinky' && (
                              <button
                                onClick={async () => {
                                  const newRole: UserRole = u.role === 'ADMIN' ? 'USER' : 'ADMIN';
                                  await updateUserRole(u.id, newRole);
                                  loadAllUsers();
                                }}
                                className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold border border-blue-200 cursor-pointer"
                              >
                                {u.role === 'ADMIN' ? 'Demote to USER' : 'Promote to ADMIN'}
                              </button>
                            )}
                            {u.username !== 'parkinky' && (
                              <button
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to permanently delete user "${u.username}"?`)) {
                                    await deleteUser(u.id);
                                    loadAllUsers();
                                  }
                                }}
                                className="p-1 rounded text-gray-400 hover:text-red-600 cursor-pointer"
                                title="Delete User"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Details Drawer Modal */}
          {selectedUserDetails && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4 text-xs text-gray-800">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-base text-gray-900">
                      User Full Profile ({selectedUserDetails.username})
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedUserDetails(null)}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-900 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2.5 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="font-semibold text-gray-600">UID:</span>
                    <span className="font-mono text-gray-900">{selectedUserDetails.id}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="font-semibold text-gray-600">Username:</span>
                    <span className="font-bold text-gray-900">{selectedUserDetails.username}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="font-semibold text-gray-600">Email:</span>
                    <span className="text-gray-900">{selectedUserDetails.email}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="font-semibold text-gray-600">Phone:</span>
                    <span className="font-mono text-gray-900">{selectedUserDetails.phone || 'Not registered'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="font-semibold text-gray-600">Country & City:</span>
                    <span className="text-gray-900">{selectedUserDetails.country_code} — {selectedUserDetails.city}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="font-semibold text-gray-600">Access Role:</span>
                    <span className="font-bold text-red-600">{selectedUserDetails.role}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-semibold text-gray-600">Created At:</span>
                    <span className="text-gray-700">{selectedUserDetails.created_at}</span>
                  </div>
                </div>

                {/* Security Questions Status */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>3-Step Password Recovery Security Questions</span>
                  </h4>
                  {selectedUserDetails.security_questions && selectedUserDetails.security_questions.length > 0 ? (
                    <div className="space-y-1.5 bg-amber-50/60 p-3 rounded-lg border border-amber-100">
                      {selectedUserDetails.security_questions.map((q, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {q.question_number}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-800">{q.question_text}</p>
                            <p className="text-[10px] font-mono text-gray-500">Hash: {q.answer_hash.substring(0, 16)}...</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      Security questions have not been set or registered via social login.
                    </p>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setSelectedUserDetails(null)}
                    className="px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CRON & CRAWLER SCHEDULER */}
      {/* ========================================================================= */}
      {activeTab === 'cron' && (
        <div className="space-y-6">
          
          {/* Main Cron Configuration Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>CRON SCHEDULER CONTROLLER</span>
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  Automated Crawler & Cron Schedule Settings
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure the scheduled background crawler, duplicate filtering threshold, and crawl sources.
                </p>
              </div>

              {/* Toggle Switch: Active vs Paused */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-700">
                  Scheduler: {cronConfig.enabled ? '🟢 Active' : '⏸️ Paused'}
                </span>
                <button
                  onClick={() => updateCronConfig({ enabled: !cronConfig.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    cronConfig.enabled ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      cronConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Scheduler Tuning Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              
              {/* Cron Frequency Preset */}
              <div className="space-y-2 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <label className="block font-bold text-gray-800">
                  Execution Frequency Preset
                </label>
                <select
                  value={cronConfig.frequencyPreset}
                  onChange={(e) => {
                    const preset = e.target.value as any;
                    let expr = cronConfig.cronExpression;
                    if (preset === 'weekly_fri_0100') expr = '0 1 * * 5';
                    if (preset === 'weekly_mon') expr = '0 2 * * 1';
                    if (preset === 'daily_0200') expr = '0 2 * * *';
                    if (preset === 'daily_0400') expr = '0 4 * * *';
                    if (preset === 'every_6h') expr = '0 */6 * * *';
                    if (preset === 'every_12h') expr = '0 */12 * * *';
                    updateCronConfig({ 
                      frequencyPreset: preset, 
                      cronExpression: expr,
                      ...(preset === 'weekly_fri_0100' ? { timezone: 'America/Chicago' } : {})
                    });
                  }}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-red-600"
                >
                  <option value="weekly_fri_0100">Weekly on Friday 01:00 AM (US Central - Active)</option>
                  <option value="weekly_mon">Weekly on Monday 02:00</option>
                  <option value="daily_0200">Daily at 02:00</option>
                  <option value="daily_0400">Daily at 04:00</option>
                  <option value="every_6h">Every 6 hours</option>
                  <option value="every_12h">Every 12 hours</option>
                  <option value="custom">Custom Cron Expression</option>
                </select>
                <p className="text-[11px] text-gray-500">
                  Current cron expression: <code className="font-mono font-bold text-red-600">{cronConfig.cronExpression}</code>
                </p>
              </div>

              {/* Timezone & Time Window */}
              <div className="space-y-2 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <label className="block font-bold text-gray-800">
                  Reference Timezone
                </label>
                <select
                  value={cronConfig.timezone}
                  onChange={(e) => updateCronConfig({ timezone: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-red-600"
                >
                  <option value="America/Chicago">America/Chicago (US Central, CT / CST / CDT)</option>
                  <option value="America/New_York">America/New_York (US Eastern, EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (US Pacific, PST)</option>
                  <option value="Asia/Seoul">Asia/Seoul (KST, UTC+9)</option>
                  <option value="UTC">UTC (Universal Time Coordinated)</option>
                  <option value="America/Argentina/Buenos_Aires">America/Argentina/Buenos_Aires (ART)</option>
                  <option value="Europe/Paris">Europe/Paris (CET)</option>
                </select>
                <p className="text-[11px] text-gray-500">
                  Data discovery window: <strong className="text-gray-900">Today ~ +6 Months</strong>
                </p>
              </div>

              {/* Deduplication Similarity Threshold */}
              <div className="space-y-2 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800">Duplicate Similarity Threshold</label>
                  <span className="font-mono font-bold text-red-600">
                    {(cronConfig.similarityThreshold * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="0.9"
                  step="0.05"
                  value={cronConfig.similarityThreshold}
                  onChange={(e) => updateCronConfig({ similarityThreshold: parseFloat(e.target.value) })}
                  className="w-full accent-red-600 cursor-pointer"
                />
                <p className="text-[11px] text-gray-500">
                  If date & city match and event name similarity is {(cronConfig.similarityThreshold * 100).toFixed(0)}% or higher, it is blocked as duplicate.
                </p>
              </div>

            </div>

            {/* Target Crawl Source Toggles */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-gray-800">
                  Data Crawling Channels & Target Sources
                </label>
                <span className="text-[11px] text-red-600 font-semibold">
                  Active: Atlanta & Birmingham Facebook Communities, Tangopolix, Global Calendars
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'facebook', name: 'Facebook (Atlanta, Birmingham & Public Events)' },
                  { key: 'tangopolix', name: 'Tangopolix Portal' },
                  { key: 'milongasInfo', name: 'Hoy Milonga / Info' },
                  { key: 'marathonRegistry', name: 'Global Marathon Calendar' },
                ].map((src) => {
                  const isChecked = (cronConfig.sources as any)[src.key];
                  return (
                    <label key={src.key} className="flex items-center gap-2 cursor-pointer bg-white p-2.5 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          updateCronConfig({
                            sources: {
                              ...cronConfig.sources,
                              [src.key]: e.target.checked,
                            },
                          });
                        }}
                        className="rounded text-red-600 focus:ring-red-500"
                      />
                      <span className="font-semibold text-gray-800">{src.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Manual Run Now Button & Live Status */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-gray-100">
              <div className="text-xs text-gray-500 space-y-0.5">
                <p>Last run: <strong className="text-gray-800">{cronConfig.lastRunAt || 'None'}</strong></p>
                <p>Next scheduled: <strong className="text-gray-800">{cronConfig.nextRunAt || '2026-09-08T02:00:00Z'}</strong></p>
              </div>

              <button
                onClick={handleRunCrawler}
                disabled={crawlerRunning}
                className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${crawlerRunning ? 'animate-spin' : ''}`} />
                <span>{crawlerRunning ? 'Crawling data & analyzing duplicates...' : 'Run Crawler Now'}</span>
              </button>
            </div>

            {/* Crawler Result Feedback Box */}
            {crawlerResult && (
              <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-green-700 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Crawl & duplicate check completed!</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-green-50 text-green-800 font-semibold border border-green-100">
                    New events added: <strong className="text-base font-extrabold">{crawlerResult.addedCount}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-100">
                    Duplicates blocked: <strong className="text-base font-extrabold">{crawlerResult.duplicateCount}</strong>
                  </div>
                </div>
                {crawlerResult.duplicatesDetails.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-700">Blocked duplicate details:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1 p-2 rounded-lg bg-gray-50 border border-gray-200 font-mono text-[11px] text-gray-600">
                      {crawlerResult.duplicatesDetails.map((line, idx) => (
                        <div key={idx} className="truncate">{line}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Past Execution History Table */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h4 className="font-extrabold text-base text-gray-900">Cron Scheduler Execution History</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase font-semibold">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Discovered</th>
                    <th className="py-2.5 px-3">New Added</th>
                    <th className="py-2.5 px-3">Duplicates Blocked</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {cronConfig.runHistory.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/70">
                      <td className="py-2.5 px-3 text-gray-700">{log.timestamp.replace('T', ' ').substring(0, 19)}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 font-bold border border-green-200">
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">{log.itemsDiscovered}</td>
                      <td className="py-2.5 px-3 font-bold text-green-700">+{log.itemsAdded}</td>
                      <td className="py-2.5 px-3 text-amber-700">-{log.duplicatesBlocked}</td>
                      <td className="py-2.5 px-3 text-gray-500">{log.durationMs}ms</td>
                      <td className="py-2.5 px-3 font-sans text-gray-600 truncate max-w-xs">{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GEMINI AI WEBSITE CHANGE MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'gemini' && (
        <div className="space-y-6">
          
          {/* Header Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-100">
              <Sparkles className="w-3.5 h-3.5" />
              <span>GEMINI AI WEBSITE MANAGEMENT HUB</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
              Gemini AI Website Operations & Management Hub
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-3xl">
              Utilize Gemini AI to manage Everytango announcements, banner texts, main headlines,
              event data quality audits, city curation, and UI settings in real time via natural language commands.
            </p>
          </div>

          {/* Quick Action Prompt Chips */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Recommended One-Click Actions
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {[
                {
                  title: '📢 Update Announcement & Banner',
                  desc: 'Propose and update top banner and main headline for the upcoming tango season',
                  prompt: 'Update the homepage top announcement banner and main slogan to attractively highlight upcoming tango marathon and festival dates.',
                },
                {
                  title: '🔍 Full Event Data Quality Audit',
                  desc: 'Audit date validity, duplicate candidates, and missing fields across all events',
                  prompt: 'Perform a comprehensive data quality audit on all registered tango events, checking for date consistency, duplicates, and missing venue information.',
                },
                {
                  title: '🏙️ Generate City Curation Guide',
                  desc: 'Create recommended tango highlights for popular hubs (Seoul, Buenos Aires, etc.)',
                  prompt: 'Create an engaging curation summary highlighting top tango festivals and milongas in major hubs like Buenos Aires, Seoul, and Europe.',
                },
                {
                  title: '🎨 Website Feature & UI Roadmap',
                  desc: 'Propose UI and filter improvements to enhance user exploration experience',
                  prompt: 'Suggest UX and UI improvements for the Everytango event explorer to make filtering, discovery, and navigation even faster.',
                },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setGeminiPrompt(item.prompt);
                    handleGeminiSubmit(item.prompt);
                  }}
                  className="p-3 text-left rounded-xl bg-gray-50 hover:bg-purple-50/70 border border-gray-200 hover:border-purple-200 transition-all group cursor-pointer"
                >
                  <div className="font-bold text-xs text-gray-900 group-hover:text-purple-700">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1 leading-snug">
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Natural Language Prompt Console */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-600" />
              <span>Admin Natural Language Command</span>
            </h4>

            <div className="relative">
              <textarea
                rows={3}
                value={geminiPrompt}
                onChange={(e) => setGeminiPrompt(e.target.value)}
                placeholder="e.g. 'Change homepage banner announcement to special summer marathon season', 'Add notice for upcoming US tango events', 'Update header notice text'..."
                className="w-full p-3.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-purple-600 focus:bg-white"
              />
              <button
                onClick={() => handleGeminiSubmit()}
                disabled={geminiLoading || !geminiPrompt.trim()}
                className="absolute right-3 bottom-3 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3 h-3" />
                <span>{geminiLoading ? 'Analyzing with Gemini AI...' : 'Submit Command'}</span>
              </button>
            </div>

            {/* Status Message */}
            {geminiStatusMessage && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-800 flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span>{geminiStatusMessage}</span>
              </div>
            )}

            {/* Gemini Response Display Area */}
            {geminiResponse && (
              <div className="p-5 rounded-xl bg-purple-50/40 border border-purple-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-purple-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Gemini AI Response & Site Changes
                  </span>
                  {geminiSuggestedConfig && (
                    <button
                      onClick={handleApplyGeminiConfig}
                      className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply to Live Site</span>
                    </button>
                  )}
                </div>

                <div className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-lg border border-purple-100 font-sans">
                  {geminiResponse}
                </div>

                {geminiSuggestedConfig && (
                  <div className="p-3 rounded-lg bg-white border border-purple-200 text-xs space-y-2">
                    <span className="font-bold text-purple-800">📋 Proposed Site Configuration:</span>
                    <pre className="p-2 rounded bg-gray-50 border border-gray-200 font-mono text-[11px] text-gray-700 overflow-x-auto">
                      {JSON.stringify(geminiSuggestedConfig, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Current Live Site Configuration Inspector & Manual Overrider */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h4 className="font-bold text-base text-gray-900">Live Site Configuration State</h4>
                <p className="text-xs text-gray-500">Global site content that can be updated dynamically by Gemini AI or edited manually by administrators.</p>
              </div>
              <span className="text-[11px] text-gray-500 font-mono">
                Last updated: {siteConfig.lastUpdatedAt.substring(0, 16).replace('T', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Top Announcement Notice:</label>
                <input
                  type="text"
                  value={siteConfig.siteAnnouncement}
                  onChange={(e) => updateSiteConfig({ siteAnnouncement: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:border-purple-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Main Hero Headline:</label>
                <input
                  type="text"
                  value={siteConfig.heroHeadline}
                  onChange={(e) => updateSiteConfig({ heroHeadline: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:border-purple-600"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="font-bold text-gray-700">Curated Notice:</label>
                <input
                  type="text"
                  value={siteConfig.curatedNotice}
                  onChange={(e) => updateSiteConfig({ curatedNotice: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:border-purple-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <label className="flex items-center gap-2 font-semibold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={siteConfig.announcementEnabled}
                  onChange={(e) => updateSiteConfig({ announcementEnabled: e.target.checked })}
                  className="rounded text-red-600"
                />
                <span>Enable Top Announcement Bar</span>
              </label>

              <span className="text-[11px] text-green-700 bg-green-50 px-2 py-0.5 rounded font-semibold border border-green-200">
                ✓ Changes saved automatically
              </span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
