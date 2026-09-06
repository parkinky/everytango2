import React, { useState } from 'react';
import { 
  UserPlus, 
  LogIn, 
  KeyRound, 
  HelpCircle, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  Search
} from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations, COUNTRY_LIST, SECURITY_QUESTION_OPTIONS } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { hashAnswer } from '../utils/dedup';

interface AuthModalProps {
  currentLang: SupportedLanguage;
  initialMode?: 'signin' | 'register' | 'findId' | 'findPw';
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentLang,
  initialMode = 'signin',
  onClose,
  onSuccess,
}) => {
  const t = translations[currentLang];
  const { 
    loginCustom, 
    registerCustom, 
    loginWithGoogle, 
    findIdByEmailAndPhone,
    fetchSecurityQuestionsForUser,
    verifyAnswersAndResetPw 
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'register' | 'findId' | 'findPw' | 'resetPw'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sign in state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCountry, setRegCountry] = useState('US');
  const [regCity, setRegCity] = useState('');
  const [regPhone, setRegPhone] = useState('');

  // 3 Security Questions & Answers (Requirement: 3 mandatory questions)
  const [q1, setQ1] = useState(SECURITY_QUESTION_OPTIONS[0].text);
  const [a1, setA1] = useState('');
  const [q2, setQ2] = useState(SECURITY_QUESTION_OPTIONS[1].text);
  const [a2, setA2] = useState('');
  const [q3, setQ3] = useState(SECURITY_QUESTION_OPTIONS[5].text);
  const [a3, setA3] = useState('');

  // Find ID state
  const [findIdEmail, setFindIdEmail] = useState('');
  const [findIdPhone, setFindIdPhone] = useState('');
  const [foundUsername, setFoundUsername] = useState('');

  // Find PW & Reset PW state
  const [findPwIdentifier, setFindPwIdentifier] = useState('');
  const [userQuestions, setUserQuestions] = useState<{ number: number; text: string }[]>([]);
  const [answerInputs, setAnswerInputs] = useState<string[]>(['', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const res = await loginCustom(loginIdentifier, loginPassword);
    setLoading(false);
    if (res.success) {
      onSuccess();
    } else {
      setErrorMsg(res.error || 'Login failed');
    }
  };

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await loginWithGoogle();
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!a1.trim() || !a2.trim() || !a3.trim()) {
      setErrorMsg('All 3 security questions must be answered for account recovery.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // Pre-hash security answers for secure storage
    const h1 = await hashAnswer(a1);
    const h2 = await hashAnswer(a2);
    const h3 = await hashAnswer(a3);

    const res = await registerCustom(
      {
        username: regUsername.trim(),
        email: regEmail.trim(),
        country_code: regCountry,
        city: regCity.trim(),
        phone: regPhone.trim(),
        role: 'USER',
        security_questions: [
          { question_number: 1, question_text: q1, answer_hash: h1 },
          { question_number: 2, question_text: q2, answer_hash: h2 },
          { question_number: 3, question_text: q3, answer_hash: h3 },
        ],
      },
      regPassword
    );

    setLoading(false);
    if (res.success) {
      onSuccess();
    } else {
      setErrorMsg(res.error || 'Registration failed');
    }
  };

  // Handle Find ID
  const handleFindId = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setFoundUsername('');

    const res = await findIdByEmailAndPhone(findIdEmail, findIdPhone);
    setLoading(false);
    if (res.found && res.username) {
      // Mask ID partially for privacy e.g. "tang***"
      const name = res.username;
      const masked = name.length > 3 ? name.substring(0, 3) + '***' : name + '***';
      setFoundUsername(`${res.username} (${masked})`);
    } else {
      setErrorMsg(res.error || 'No matching account found.');
    }
  };

  // Step 1 of Find PW: Fetch questions
  const handleFetchQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const res = await fetchSecurityQuestionsForUser(findPwIdentifier);
    setLoading(false);
    if (res.found && res.questions && res.questions.length === 3) {
      setUserQuestions(res.questions);
    } else {
      setErrorMsg(res.error || 'Could not retrieve security questions.');
    }
  };

  // Step 2 of Find PW: Verify answers & show reset page
  const handleVerifyQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // Pre-hash the provided answers to compare
    const hashedAnswers = await Promise.all(answerInputs.map((a) => hashAnswer(a)));

    // Transition to reset password view
    setMode('resetPw');
    setLoading(false);
  };

  // Step 3 of Find PW: Reset Password
  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (newPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const hashedAnswers = await Promise.all(answerInputs.map((a) => hashAnswer(a)));
    const res = await verifyAnswersAndResetPw(findPwIdentifier, hashedAnswers, newPassword);

    setLoading(false);
    if (res.success) {
      setSuccessMsg('Password updated successfully! You can now sign in.');
      setTimeout(() => {
        setMode('signin');
        setSuccessMsg('');
      }, 2000);
    } else {
      setErrorMsg(res.error || 'Password update failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 max-w-lg w-full shadow-lg relative my-8 text-gray-900">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
        >
          ✕
        </button>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-3 text-xs text-green-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. SIGN IN VIEW */}
        {mode === 'signin' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {t.auth.loginTitle}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {t.auth.loginSubtitle}
              </p>
            </div>

            {/* Google Sign-in */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold border border-gray-200 shadow-xs transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>{t.auth.googleSignIn}</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-gray-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-gray-400 uppercase tracking-wider">{t.auth.or}</span>
            </div>

            {/* Custom Credentials Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">
                  {t.auth.usernameOrEmail}
                </label>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. tangodancer or user@example.com"
                  className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">
                    {t.auth.password}
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode('findPw'); setErrorMsg(''); }}
                    className="text-[11px] text-red-600 hover:text-red-700 font-medium"
                  >
                    {t.auth.forgotPw}
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                {loading ? 'Authenticating...' : t.auth.loginBtn}
              </button>
            </form>

            <div className="pt-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-200">
              <button
                onClick={() => { setMode('findId'); setErrorMsg(''); }}
                className="hover:text-gray-900"
              >
                {t.auth.forgotId}
              </button>
              <button
                onClick={() => { setMode('register'); setErrorMsg(''); }}
                className="text-red-600 font-semibold hover:text-red-700"
              >
                {t.auth.registerTitle}
              </button>
            </div>
          </div>
        )}

        {/* 2. REGISTER VIEW */}
        {mode === 'register' && (
          <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
            <div>
              <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {t.auth.registerTitle}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {t.auth.registerSubtitle}
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-3.5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">{t.auth.username} *</label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="tangomilonguero"
                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">{t.auth.password} *</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">{t.auth.email} *</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="dancer@example.com"
                  className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">{t.auth.country} *</label>
                  <select
                    value={regCountry}
                    onChange={(e) => setRegCountry(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-md px-2.5 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  >
                    {COUNTRY_LIST.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">{t.table.city} *</label>
                  <input
                    type="text"
                    required
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    placeholder="Buenos Aires"
                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">{t.auth.phone} *</label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+1 555-0123"
                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              {/* 3 Mandatory Security Questions for Account Recovery */}
              <div className="pt-2 border-t border-gray-200 space-y-3">
                <div className="flex items-center gap-1.5 text-amber-700">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-bold">{t.auth.securityQuestionsTitle}</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  {t.auth.securityQuestionsDesc}
                </p>

                {/* Question 1 */}
                <div className="space-y-1 bg-gray-50 p-2.5 rounded-md border border-gray-200">
                  <label className="text-[11px] font-bold text-gray-700">{t.auth.q1}</label>
                  <select
                    value={q1}
                    onChange={(e) => setQ1(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-md px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  >
                    {SECURITY_QUESTION_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.text}>{opt.text}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    value={a1}
                    onChange={(e) => setA1(e.target.value)}
                    placeholder={t.auth.answerPlaceholder}
                    className="w-full bg-white border border-gray-200 rounded-md px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                {/* Question 2 */}
                <div className="space-y-1 bg-gray-50 p-2.5 rounded-md border border-gray-200">
                  <label className="text-[11px] font-bold text-gray-700">{t.auth.q2}</label>
                  <select
                    value={q2}
                    onChange={(e) => setQ2(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-md px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  >
                    {SECURITY_QUESTION_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.text}>{opt.text}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    value={a2}
                    onChange={(e) => setA2(e.target.value)}
                    placeholder={t.auth.answerPlaceholder}
                    className="w-full bg-white border border-gray-200 rounded-md px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                {/* Question 3 */}
                <div className="space-y-1 bg-gray-50 p-2.5 rounded-md border border-gray-200">
                  <label className="text-[11px] font-bold text-gray-700">{t.auth.q3}</label>
                  <select
                    value={q3}
                    onChange={(e) => setQ3(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-md px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  >
                    {SECURITY_QUESTION_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.text}>{opt.text}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    value={a3}
                    onChange={(e) => setA3(e.target.value)}
                    placeholder={t.auth.answerPlaceholder}
                    className="w-full bg-white border border-gray-200 rounded-md px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-all mt-2 cursor-pointer"
              >
                {loading ? 'Creating account...' : t.auth.registerBtn}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-gray-500">
              <button
                onClick={() => { setMode('signin'); setErrorMsg(''); }}
                className="text-red-600 font-semibold hover:text-red-700"
              >
                {t.auth.hasAccount} {t.auth.loginBtn}
              </button>
            </div>
          </div>
        )}

        {/* 3. FIND ID VIEW (Email + Phone match) */}
        {mode === 'findId' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setMode('signin'); setErrorMsg(''); }}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{t.auth.findIdTitle}</h3>
                <p className="text-xs text-gray-500">{t.auth.findIdDesc}</p>
              </div>
            </div>

            {foundUsername ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
                <p className="text-xs text-gray-600">{t.auth.foundIdMessage}</p>
                <p className="text-xl font-extrabold text-gray-900 font-mono">{foundUsername}</p>
                <button
                  onClick={() => { setMode('signin'); setLoginIdentifier(foundUsername.split(' ')[0]); }}
                  className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Proceed to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleFindId} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">{t.auth.email}</label>
                  <input
                    type="email"
                    required
                    value={findIdEmail}
                    onChange={(e) => setFindIdEmail(e.target.value)}
                    placeholder="dancer@example.com"
                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">{t.auth.phone}</label>
                  <input
                    type="tel"
                    required
                    value={findIdPhone}
                    onChange={(e) => setFindIdPhone(e.target.value)}
                    placeholder="+1 555-0123"
                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all cursor-pointer"
                >
                  {loading ? 'Searching...' : t.auth.findIdBtn}
                </button>
              </form>
            )}
          </div>
        )}

        {/* 4. FIND PW VIEW (Ask username/email -> load 3 questions) */}
        {mode === 'findPw' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setMode('signin'); setErrorMsg(''); }}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{t.auth.findPwTitle}</h3>
                <p className="text-xs text-gray-500">{t.auth.findPwDesc}</p>
              </div>
            </div>

            {userQuestions.length === 0 ? (
              <form onSubmit={handleFetchQuestions} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">{t.auth.usernameOrEmail}</label>
                  <input
                    type="text"
                    required
                    value={findPwIdentifier}
                    onChange={(e) => setFindPwIdentifier(e.target.value)}
                    placeholder="e.g. tangodancer or dancer@example.com"
                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer"
                >
                  {loading ? 'Verifying Account...' : 'Continue to Security Questions'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyQuestions} className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800">
                  Please answer all 3 security questions correctly to unlock password reset.
                </div>

                {userQuestions.map((q, idx) => (
                  <div key={idx} className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">
                      Q{idx + 1}: {q.text}
                    </label>
                    <input
                      type="text"
                      required
                      value={answerInputs[idx]}
                      onChange={(e) => {
                        const copy = [...answerInputs];
                        copy[idx] = e.target.value;
                        setAnswerInputs(copy);
                      }}
                      placeholder="Your registered answer"
                      className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer"
                >
                  {loading ? 'Verifying...' : t.auth.verifyAnswersBtn}
                </button>
              </form>
            )}
          </div>
        )}

        {/* 5. RESET PW VIEW (Enter new password) */}
        {mode === 'resetPw' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{t.auth.resetPwTitle}</h3>
              <p className="text-xs text-gray-500">Identity verified. Enter your new password.</p>
            </div>

            <form onSubmit={handleSaveNewPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">{t.auth.newPassword}</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">{t.auth.confirmPassword}</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-md bg-green-600 hover:bg-green-700 text-white font-bold text-xs cursor-pointer"
              >
                {loading ? 'Saving...' : t.auth.saveNewPwBtn}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
