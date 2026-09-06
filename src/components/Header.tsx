import React from 'react';
import { Globe2, CalendarCheck, PlusCircle, ShieldCheck, UserCircle2, LogIn, LogOut, Search, Compass } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations } from '../i18n';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentLang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  activeTab: 'browse' | 'submit' | 'admin' | 'auth';
  onNavigate: (tab: 'browse' | 'submit' | 'admin' | 'auth') => void;
  onOpenRecoveryModal: (mode: 'findId' | 'findPw') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  activeTab,
  onNavigate,
  onOpenRecoveryModal,
}) => {
  const t = translations[currentLang];
  const { userProfile, currentUser, logout } = useAuth();

  const isAdmin = userProfile?.role === 'ADMIN' || currentUser?.email === 'parkinky@gmail.com' || userProfile?.username === 'parkinky';

  return (
    <header id="everytango-main-header" className="sticky top-0 z-40 bg-white border-b border-gray-200 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Branding */}
          <div 
            id="brand-logo-btn" 
            onClick={() => onNavigate('browse')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-xs text-white">
              {/* Tango couple silhouette vector icon */}
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a4 4 0 0 0-4 4c0 2 2 4 4 4s4-2 4-4a4 4 0 0 0-4-4z" />
                <path d="M9 14v8" />
                <path d="M15 14v8" />
                <path d="M6 18c0-3.3 2.7-6 6-6s6 2.7 6 6" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-red-600 group-hover:text-red-700 transition-colors">
                  EVERYTANGO
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">
                  GLOBAL
                </span>
              </div>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-4 h-16">
            <button
              id="nav-btn-browse"
              onClick={() => onNavigate('browse')}
              className={`h-16 flex items-center gap-1.5 px-2 sm:px-3 text-sm font-medium transition-all ${
                activeTab === 'browse'
                  ? 'text-gray-900 border-b-2 border-red-600 font-bold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <CalendarCheck className="w-4 h-4 text-red-600" />
              <span>{t.nav.browseEvents}</span>
            </button>

            <button
              id="nav-btn-submit"
              onClick={() => onNavigate('submit')}
              className={`h-16 flex items-center gap-1.5 px-2 sm:px-3 text-sm font-medium transition-all ${
                activeTab === 'submit'
                  ? 'text-gray-900 border-b-2 border-red-600 font-bold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-gray-500" />
              <span className="hidden xs:inline">{t.nav.submitEvent}</span>
            </button>

            {/* Admin Dashboard Tab */}
            <button
              id="nav-btn-admin"
              onClick={() => onNavigate('admin')}
              className={`h-16 flex items-center gap-1.5 px-2 sm:px-3 text-sm font-medium transition-all ${
                activeTab === 'admin'
                  ? 'text-gray-900 border-b-2 border-red-600 font-bold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-gray-500" />
              <span className="hidden md:inline">{t.nav.adminDashboard}</span>
              {isAdmin && (
                <span className="w-2 h-2 rounded-full bg-red-600" />
              )}
            </button>
          </nav>

          {/* Right Action Cluster: Language Switcher & User Account */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Segmented i18n Language Selector */}
            <div className="flex items-center border border-gray-200 rounded-md bg-gray-50 p-1">
              {(['en', 'es', 'ko', 'zh', 'ja'] as SupportedLanguage[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  className={`px-2 py-0.5 text-xs uppercase font-bold rounded transition-all ${
                    currentLang === lang
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                  aria-label={`Select ${lang.toUpperCase()}`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Auth / Profile Area */}
            {userProfile || currentUser ? (
              <div className="flex items-center gap-2">
                <div 
                  title={userProfile?.username || currentUser?.email || 'User'}
                  className="h-8 w-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 select-none uppercase"
                >
                  {(userProfile?.username || currentUser?.displayName || currentUser?.email || 'U').substring(0, 2)}
                </div>
                <button
                  id="btn-signout"
                  onClick={logout}
                  title={t.nav.signOut}
                  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900 border border-gray-200 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-signin"
                  onClick={() => onNavigate('auth')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t.nav.signIn}</span>
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
