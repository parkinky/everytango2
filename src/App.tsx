import React, { useState } from 'react';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { EventTable } from './components/EventTable';
import { SubmitEventForm } from './components/SubmitEventForm';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EventsProvider, useEvents } from './context/EventsContext';
import { ExperiencesProvider } from './context/ExperiencesContext';
import { SiteConfigProvider, useSiteConfig } from './context/SiteConfigContext';
import { SupportedLanguage } from './types';
import { translations } from './i18n';
import { Compass, Sparkles, Megaphone, ShieldCheck, LogOut } from 'lucide-react';
import { TangoMilongaHallSilhouette } from './components/TangoMilongaHallSilhouette';

function MainAppContent() {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');
  const [activeTab, setActiveTab] = useState<'browse' | 'submit' | 'admin' | 'auth'>('browse');
  
  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'register' | 'findId' | 'findPw'>('signin');
  
  // Admin Exit Confirmation Modal state
  const [showAdminExitModal, setShowAdminExitModal] = useState(false);

  // Admin Event Editing state (for editing event in the right submit/edit screen)
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const { filteredEvents, stats } = useEvents();
  const { siteConfig, updateSiteConfig } = useSiteConfig();
  const { userProfile, currentUser } = useAuth();
  const isAdmin = userProfile?.role === 'ADMIN' || currentUser?.email === 'parkinky@gmail.com' || userProfile?.username === 'parkinky';
  const t = translations[currentLang];

  const handleOpenAuth = (mode: 'signin' | 'register' | 'findId' | 'findPw' = 'signin') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleAdminDashboardClick = () => {
    if (activeTab === 'admin') {
      setShowAdminExitModal(true);
    } else {
      setActiveTab('admin');
    }
  };

  const handleEditEvent = (eventId: string) => {
    setEditingEventId(eventId);
    setActiveTab('submit');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] flex flex-col font-sans selection:bg-red-600 selection:text-white w-full max-w-full overflow-x-hidden">
      
      {/* Dynamic Top Announcement Banner (Controlled live via Gemini AI / Admin) */}
      {siteConfig.announcementEnabled && siteConfig.siteAnnouncement && (
        <div 
          id="live-site-announcement-strip"
          className="bg-red-900 text-white text-xs py-1.5 px-3 sm:px-4 border-b border-red-800 transition-all shadow-xs relative flex items-center"
        >
          {/* Centered text container, padded on the right so text shifts left by the button's width */}
          <div className="flex-1 flex items-center justify-center gap-2 overflow-hidden pr-36 sm:pr-40">
            <Megaphone className="w-3.5 h-3.5 text-red-200 shrink-0" />
            <span className="truncate max-w-4xl text-center font-medium">{siteConfig.siteAnnouncement}</span>
          </div>

          {/* Admin Dashboard Button anchored to the far right end */}
          <button
            id="top-admin-dashboard-btn"
            onClick={handleAdminDashboardClick}
            className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-white text-red-900 shadow-xs'
                : 'bg-red-800/80 hover:bg-red-800 text-red-100 hover:text-white border border-red-700/60'
            }`}
            title={activeTab === 'admin' ? 'Exit Admin Dashboard' : t.nav.adminDashboard}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-red-300" />
            <span>{t.nav.adminDashboard}</span>
            {isAdmin && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            )}
          </button>
        </div>
      )}

      {/* Global Navigation Header */}
      <Header
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        activeTab={activeTab}
        onNavigate={(tab) => {
          if (tab === 'auth') {
            handleOpenAuth('signin');
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenRecoveryModal={(mode) => handleOpenAuth(mode)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* TAB 1: BROWSE EVENTS (DEFAULT) */}
        {activeTab === 'browse' && (
          <div className="space-y-6">
            
            {/* Hero Banner with Clean Minimalism Theme (Matched padding & border-radius with FilterBar) */}
            <div className="relative rounded-xl bg-white border border-gray-200 p-3 sm:p-3.5 overflow-hidden shadow-xs">
              {/* Grand Milonga Ballroom Background:
                  Starts right after the subheadline text to the right edge.
                  Fades from transparent on the left to full original photo color in the center and right.
              */}
              <div 
                id="hero-ballroom-bg"
                className="absolute right-0 top-0 bottom-0 w-[42%] sm:w-[48%] md:w-[52%] lg:w-[55%] pointer-events-none overflow-hidden z-0"
              >
                {/* Ballroom Photo: left edge is faint, center to right is full original vibrant colors */}
                <img
                  src={siteConfig.heroBackgroundImage || "/tango_ballroom.jpg"}
                  alt="Authentic Tango Milonga Festival Ballroom"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                  style={{
                    maskImage: 'linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.35) 25%, rgba(0, 0, 0, 0.95) 50%, black 100%)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.35) 25%, rgba(0, 0, 0, 0.95) 50%, black 100%)',
                  }}
                />
                {/* Soft gradient blend on the left edge for seamless transition into white */}
                <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent pointer-events-none" />
              </div>

              <div className="relative z-10 w-full space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[11px] font-semibold border border-red-100">
                  <Compass className="w-3 h-3" />
                  <span>Verified Tango Events Global Radar</span>
                </div>
                
                {/* Dynamically controlled headline from SiteConfig / Gemini */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-snug">
                  {siteConfig.heroHeadline || t.tagline}
                </h1>
                
                {/* Dynamically controlled subheadline (Max width constrained so photo starts cleanly after text) */}
                <p className="text-xs sm:text-sm text-gray-600 leading-normal max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl">
                  {siteConfig.heroSubheadline || t.subtagline}
                </p>

                {/* Notice & Quick Metric Badges in One Full-Width Line (Right edge aligns with Export to Excel) */}
                <div className={`pt-0.5 w-full flex items-center ${siteConfig.curatedNotice ? 'justify-between' : 'justify-start'} gap-2 text-xs`}>
                  {siteConfig.curatedNotice && (
                    <span 
                      className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md bg-gray-50/95 backdrop-blur-xs border border-gray-200 text-gray-700 font-medium text-xs flex-1 min-w-0 truncate"
                      title={siteConfig.curatedNotice}
                    >
                      <Sparkles className="w-3 h-3 text-purple-600 shrink-0" />
                      <span className="truncate">{siteConfig.curatedNotice}</span>
                    </span>
                  )}

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="py-1 px-2.5 rounded-md bg-gray-50/95 backdrop-blur-xs border border-gray-200 text-gray-700 whitespace-nowrap shrink-0">
                      <strong className="text-gray-900 font-bold">{stats.totalApproved}</strong> Upcoming Events
                    </span>
                    <span className="py-1 px-2.5 rounded-md bg-gray-50/95 backdrop-blur-xs border border-gray-200 text-gray-700 whitespace-nowrap shrink-0">
                      <strong className="text-gray-900 font-bold">20+</strong> Countries
                    </span>
                    <span className="py-1 px-2.5 rounded-md bg-gray-50/95 backdrop-blur-xs border border-gray-200 text-gray-700 flex items-center gap-1.5 whitespace-nowrap shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                      <span>Auto-Crawled & Deduped</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Filter Bar */}
            <FilterBar 
              currentLang={currentLang} 
            />

            {/* Event Table */}
            <EventTable 
              events={filteredEvents} 
              currentLang={currentLang} 
              onEditEvent={handleEditEvent}
            />

          </div>
        )}

        {/* TAB 2: SUBMIT EVENT / ADMIN EVENT EDITOR */}
        {activeTab === 'submit' && (
          <SubmitEventForm
            currentLang={currentLang}
            onSuccessNavigate={() => {
              setEditingEventId(null);
              setActiveTab('browse');
            }}
            onOpenAuth={() => handleOpenAuth('signin')}
            initialEditEventId={editingEventId}
            onClearEditEventId={() => setEditingEventId(null)}
          />
        )}

        {/* TAB 3: ADMIN DASHBOARD */}
        {activeTab === 'admin' && (
          <AdminDashboard 
            currentLang={currentLang} 
            onRequestExit={() => setShowAdminExitModal(true)}
            onEditEvent={handleEditEvent}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-200 bg-white py-4 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
            <span>Crawler Active</span>
            <span>API Status: Healthy</span>
            <span>DB Synchronized</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-gray-600">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>System Synchronized</span>
            </div>
            <span className="text-gray-300">·</span>
            <button onClick={() => handleOpenAuth('findId')} className="hover:text-gray-900 transition-colors">
              {t.nav.findId}
            </button>
            <span className="text-gray-300">·</span>
            <button onClick={() => handleOpenAuth('findPw')} className="hover:text-gray-900 transition-colors">
              {t.nav.findPw}
            </button>
            <span className="text-gray-300">·</span>
            <button 
              id="footer-admin-dashboard-btn"
              onClick={handleAdminDashboardClick} 
              className="hover:text-gray-900 transition-colors cursor-pointer"
            >
              {t.nav.adminDashboard}
            </button>
            <span className="text-gray-300">·</span>
            <span className="text-gray-400">© 2026 EVERYTANGO GLOBAL</span>
          </div>
        </div>
      </footer>

      {/* Auth / Recovery Modal */}
      {authModalOpen && (
        <AuthModal
          currentLang={currentLang}
          initialMode={authModalMode}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => setAuthModalOpen(false)}
        />
      )}

      {/* Admin Dashboard Exit Confirmation Modal */}
      {showAdminExitModal && (
        <div 
          id="admin-exit-modal-overlay"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowAdminExitModal(false)}
        >
          <div 
            id="admin-exit-confirm-modal"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100 text-center space-y-4 animate-in fade-in zoom-in duration-150"
          >
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                Do you want to leave Admin Dashboard?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Would you like to return to the main events home screen?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                id="admin-exit-no-btn"
                onClick={() => setShowAdminExitModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors cursor-pointer"
              >
                No
              </button>
              <button
                type="button"
                id="admin-exit-yes-btn"
                onClick={() => {
                  setShowAdminExitModal(false);
                  setActiveTab('browse');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SiteConfigProvider>
        <EventsProvider>
          <ExperiencesProvider>
            <MainAppContent />
          </ExperiencesProvider>
        </EventsProvider>
      </SiteConfigProvider>
    </AuthProvider>
  );
}
