import React, { useState } from 'react';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { EventTable } from './components/EventTable';
import { SubmitEventForm } from './components/SubmitEventForm';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { AuthProvider } from './context/AuthContext';
import { EventsProvider, useEvents } from './context/EventsContext';
import { ExperiencesProvider } from './context/ExperiencesContext';
import { SiteConfigProvider, useSiteConfig } from './context/SiteConfigContext';
import { SupportedLanguage } from './types';
import { translations } from './i18n';
import { Compass, Sparkles, Megaphone } from 'lucide-react';
import { TangoMilongaHallSilhouette } from './components/TangoMilongaHallSilhouette';

function MainAppContent() {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');
  const [activeTab, setActiveTab] = useState<'browse' | 'submit' | 'admin' | 'auth'>('browse');
  
  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'register' | 'findId' | 'findPw'>('signin');

  const { filteredEvents, stats } = useEvents();
  const { siteConfig } = useSiteConfig();
  const t = translations[currentLang];

  const handleOpenAuth = (mode: 'signin' | 'register' | 'findId' | 'findPw' = 'signin') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] flex flex-col font-sans selection:bg-red-600 selection:text-white">
      
      {/* Dynamic Top Announcement Banner (Controlled live via Gemini AI / Admin) */}
      {siteConfig.announcementEnabled && siteConfig.siteAnnouncement && (
        <div 
          id="live-site-announcement-strip"
          className="bg-red-900 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2 border-b border-red-800 transition-all shadow-xs"
        >
          <Megaphone className="w-3.5 h-3.5 text-red-200 shrink-0" />
          <span className="truncate max-w-4xl">{siteConfig.siteAnnouncement}</span>
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
            
            {/* Hero Banner with Clean Minimalism Theme */}
            <div className="relative rounded-2xl bg-white border border-gray-200 p-4 sm:p-5 overflow-hidden shadow-xs">
              <div className="relative z-10 w-full space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[11px] font-semibold border border-red-100">
                  <Compass className="w-3 h-3" />
                  <span>Verified Tango Events Global Radar</span>
                </div>
                
                {/* Dynamically controlled headline from SiteConfig / Gemini */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-snug">
                  {siteConfig.heroHeadline || t.tagline}
                </h1>
                
                {/* Dynamically controlled subheadline */}
                <p className="text-xs sm:text-sm text-gray-600 leading-normal max-w-3xl">
                  {siteConfig.heroSubheadline || t.subtagline}
                </p>

                {/* Combined Notice & Quick Metric Badges in Strictly ONE Compact Line */}
                <div className="pt-1 flex items-center gap-1.5 text-xs overflow-x-auto whitespace-nowrap no-scrollbar">
                  {siteConfig.curatedNotice && (
                    <span className="py-1 px-2.5 rounded-md bg-gray-50 border border-gray-200 text-gray-700 flex items-center gap-1.5 font-medium shrink-0">
                      <Sparkles className="w-3 h-3 text-purple-600 shrink-0" />
                      <span>{siteConfig.curatedNotice}</span>
                    </span>
                  )}
                  <span className="py-1 px-2.5 rounded-md bg-gray-50 border border-gray-200 text-gray-700 shrink-0">
                    <strong className="text-gray-900 font-bold">{stats.totalApproved}</strong> Upcoming Events
                  </span>
                  <span className="py-1 px-2.5 rounded-md bg-gray-50 border border-gray-200 text-gray-700 shrink-0">
                    <strong className="text-gray-900 font-bold">20+</strong> Countries
                  </span>
                  <span className="py-1 px-2.5 rounded-md bg-gray-50 border border-gray-200 text-gray-700 flex items-center gap-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                    <span>Auto-Crawled & Deduped</span>
                  </span>
                </div>
              </div>

              {/* Tango Milonga Hall Silhouette (Crowded dance hall & couples embrace from user photo, subtle and non-intrusive) */}
              <div 
                id="hero-tango-hall-silhouette"
                className="absolute right-0 top-0 bottom-0 w-[260px] sm:w-[320px] md:w-[420px] pointer-events-none opacity-[0.07] text-gray-950 flex items-center justify-end overflow-hidden"
              >
                <TangoMilongaHallSilhouette className="w-full h-full max-h-[160px]" />
              </div>
            </div>

            {/* Event Filter Bar */}
            <FilterBar 
              currentLang={currentLang} 
            />

            {/* Event Table */}
            <EventTable events={filteredEvents} currentLang={currentLang} />

          </div>
        )}

        {/* TAB 2: SUBMIT EVENT */}
        {activeTab === 'submit' && (
          <SubmitEventForm
            currentLang={currentLang}
            onSuccessNavigate={() => setActiveTab('browse')}
            onOpenAuth={() => handleOpenAuth('signin')}
          />
        )}

        {/* TAB 3: ADMIN DASHBOARD */}
        {activeTab === 'admin' && (
          <AdminDashboard currentLang={currentLang} />
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
            <button onClick={() => setActiveTab('admin')} className="hover:text-gray-900 transition-colors">
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
