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
  Search,
  RefreshCw
} from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations, COUNTRY_LIST, SECURITY_QUESTION_OPTIONS } from '../i18n';
import { useAuth } from '../context/AuthContext';

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
    checkUsernameExists,
    registerCustom, 
    loginWithGoogle, 
    findIdByEmailAndPhone,
    fetchSecurityQuestionsForUser,
    verifySingleSecurityAnswer,
    verifySingleAnswerAndResetPw,
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
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCountry, setRegCountry] = useState('US');
  const [regState, setRegState] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regPhone, setRegPhone] = useState('');

  // Duplicate ID verification states
  const [isDuplicateId, setIsDuplicateId] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

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
  const [selectedQuestion, setSelectedQuestion] = useState<{ number: number; text: string } | null>(null);
  const [singleAnswer, setSingleAnswer] = useState('');
  const [verifiedQuestion, setVerifiedQuestion] = useState<{ number: number; text: string } | null>(null);
  const [verifiedAnswer, setVerifiedAnswer] = useState('');
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

  // Check Duplicate Username (ID)
  const checkDuplicateUsername = async (uname: string): Promise<boolean> => {
    const clean = uname.trim();
    if (!clean) {
      setIsDuplicateId(false);
      return false;
    }
    setCheckingDuplicate(true);
    try {
      const exists = await checkUsernameExists(clean);
      if (exists) {
        setIsDuplicateId(true);
        setShowDuplicateModal(true);
        return true;
      } else {
        setIsDuplicateId(false);
        return false;
      }
    } catch (err) {
      console.warn('Duplicate username check failed:', err);
      return false;
    } finally {
      setCheckingDuplicate(false);
    }
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!a1.trim() || !a2.trim() || !a3.trim()) {
      setErrorMsg('All 3 security questions must be answered for account recovery.');
      return;
    }

    // Pre-check duplicate ID
    const isDup = await checkUsernameExists(regUsername.trim());
    if (isDup) {
      setIsDuplicateId(true);
      setShowDuplicateModal(true);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // Security answers are sent as plaintext over HTTPS and hashed server-side
    // (see /api/auth/register) - the client never computes or stores the hash.
    const res = await registerCustom(
      {
        first_name: regFirstName.trim(),
        last_name: regLastName.trim(),
        username: regUsername.trim(),
        email: regEmail.trim(),
        country_code: regCountry,
        state: regState.trim() || 'GA',
        city: regCity.trim() || 'Atlanta',
        phone: regPhone.trim(),
        role: 'USER',
        security_questions: [
          { question_number: 1, question_text: q1, answer: a1 },
          { question_number: 2, question_text: q2, answer: a2 },
          { question_number: 3, question_text: q3, answer: a3 },
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

  // Step 1 of Find PW: Fetch questions and pick 1 random question
  const handleFetchQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!findPwIdentifier.trim()) {
      setErrorMsg('Please enter your username or email.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await fetchSecurityQuestionsForUser(findPwIdentifier.trim());
    setLoading(false);
    if (res.found && res.questions && res.questions.length > 0) {
      setUserQuestions(res.questions);
      // Pick 1 question randomly among the 3 registered questions
      const randomIdx = Math.floor(Math.random() * res.questions.length);
      setSelectedQuestion(res.questions[randomIdx]);
      setSingleAnswer('');
    } else {
      setErrorMsg(res.error || 'Could not retrieve security questions.');
    }
  };

  // Switch to another question randomly among the user's questions
  const handlePickDifferentQuestion = () => {
    if (userQuestions.length <= 1) return;
    const others = userQuestions.filter((q) => q.number !== selectedQuestion?.number);
    const nextQ = others[Math.floor(Math.random() * others.length)];
    setSelectedQuestion(nextQ);
    setSingleAnswer('');
    setErrorMsg('');
  };

  // Step 2 of Find PW: Verify single answer & show reset page
  const handleVerifyQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion) {
      setErrorMsg('No security question selected.');
      return;
    }
    if (!singleAnswer.trim()) {
      setErrorMsg('Please enter your answer.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await verifySingleSecurityAnswer(
      findPwIdentifier.trim(),
      selectedQuestion.number,
      singleAnswer.trim()
    );
    setLoading(false);

    if (res.success) {
      setVerifiedQuestion(selectedQuestion);
      setVerifiedAnswer(singleAnswer.trim());
      setMode('resetPw');
      setErrorMsg('');
    } else {
      setErrorMsg(res.error || 'The answer to this security question does not match our records.');
    }
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

    if (!verifiedQuestion || !verifiedAnswer) {
      setErrorMsg('Security verification session expired. Please verify again.');
      setMode('findPw');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await verifySingleAnswerAndResetPw(
      findPwIdentifier.trim(),
      verifiedQuestion.number,
      verifiedAnswer,
      newPassword
    );

    setLoading(false);
    if (res.success) {
      setSuccessMsg('Password updated successfully! You can now sign in.');
      setTimeout(() => {
        setMode('signin');
        setSuccessMsg('');
        setUserQuestions([]);
        setSelectedQuestion(null);
        setSingleAnswer('');
        setVerifiedQuestion(null);
        setVerifiedAnswer('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
    } else {
      setErrorMsg(res.error || 'Password update failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 max-w-[620px] w-full shadow-lg relative my-8 text-gray-900">
        
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
                  className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:placeholder-transparent focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
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
                  className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:placeholder-transparent focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
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
              
              {/* Row 1: First Name & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">{t.auth.firstName} *</label>
                  <input
                    type="text"
                    required
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    placeholder="First Name"
                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:placeholder-transparent focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">{t.auth.lastName} *</label>
                  <input
                    type="text"
                    required
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    placeholder="Last Name"
                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:placeholder-transparent focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              {/* Row 2: Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">{t.auth.username} *</label>
                    <button
                      type="button"
                      onClick={() => checkDuplicateUsername(regUsername)}
                      disabled={checkingDuplicate || !regUsername.trim()}
                      className="text-[10px] text-red-600 hover:text-red-700 font-semibold disabled:opacity-40 cursor-pointer"
                    >
                      {checkingDuplicate ? 'Checking...' : 'Check ID'}
                    </button>
                  </div>
                  <input
                    id="reg-username-input"
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => {
                      setRegUsername(e.target.value);
                      if (isDuplicateId) {
                        setIsDuplicateId(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        checkDuplicateUsername(regUsername);
                      }
                    }}
                    onBlur={() => {
                      if (regUsername.trim().length >= 2) {
                        checkDuplicateUsername(regUsername);
                      }
                    }}
                    onClick={() => {
                      if (isDuplicateId) {
                        setRegUsername('');
                        setIsDuplicateId(false);
                      }
                    }}
                    onFocus={() => {
                      if (isDuplicateId) {
                        setRegUsername('');
                        setIsDuplicateId(false);
                      }
                    }}
                    placeholder="tangomilonguero"
                    className={`w-full bg-white border ${
                      isDuplicateId
                        ? 'border-red-500 ring-1 ring-red-500 bg-red-50/40 text-red-900'
                        : 'border-gray-200 focus:ring-red-500 focus:border-red-500'
                    } rounded-md px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:placeholder-transparent focus:outline-none transition-colors`}
                  />
                  {isDuplicateId && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>This ID is already taken. Please enter a different ID.</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">{t.auth.password} *</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:placeholder-transparent focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              {/* Row 3: Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">{t.auth.email} *</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="dancer@example.com"
                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:placeholder-transparent focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">{t.auth.phone} *</label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+1-123-456-7890"
                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:placeholder-transparent focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              {/* Row 4: Country (US), State (GA), City (Atlanta) */}
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
                  <label className="text-xs font-bold text-gray-700">{t.auth.state} *</label>
                  <input
                    type="text"
                    value={regState}
                    onChange={(e) => setRegState(e.target.value)}
                    placeholder="GA"
                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:placeholder-transparent focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">{t.table.city} *</label>
                  <input
                    type="text"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    placeholder="Atlanta"
                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:placeholder-transparent focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
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
                    className="w-full bg-white border border-gray-200 rounded-md px-2.5 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:placeholder-transparent focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
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
                    className="w-full bg-white border border-gray-200 rounded-md px-2.5 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:placeholder-transparent focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
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
                    className="w-full bg-white border border-gray-200 rounded-md px-2.5 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:placeholder-transparent focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
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
                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:placeholder-transparent focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">{t.auth.phone}</label>
                  <input
                    type="tel"
                    required
                    value={findIdPhone}
                    onChange={(e) => setFindIdPhone(e.target.value)}
                    placeholder="+1-123-456-7890"
                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:placeholder-transparent focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
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
                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:placeholder-transparent focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
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
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">
                      {t.auth.randomQuestionNotice}
                    </span>
                    <span className="text-amber-700 text-[11px]">
                      {userQuestions.length > 1
                        ? `(1 of ${userQuestions.length} registered security questions randomly selected)`
                        : ''}
                    </span>
                  </div>
                </div>

                {selectedQuestion && (
                  <div className="space-y-2 bg-gray-50 border border-gray-200 rounded-lg p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-700 text-[11px] font-bold">
                        Question #{selectedQuestion.number}
                      </span>
                      {userQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={handlePickDifferentQuestion}
                          className="text-[11px] text-red-600 hover:text-red-700 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                          title={t.auth.tryAnotherQuestion}
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>{t.auth.tryAnotherQuestion}</span>
                        </button>
                      )}
                    </div>
                    <p className="text-xs font-bold text-gray-800 leading-relaxed">
                      {selectedQuestion.text}
                    </p>
                    <div className="pt-1">
                      <input
                        type="text"
                        required
                        autoFocus
                        value={singleAnswer}
                        onChange={(e) => setSingleAnswer(e.target.value)}
                        placeholder={t.auth.answerPlaceholder || 'Enter your registered security answer'}
                        className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:placeholder-transparent focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUserQuestions([]);
                      setSelectedQuestion(null);
                      setSingleAnswer('');
                      setErrorMsg('');
                    }}
                    className="py-2.5 px-3 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold cursor-pointer"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    {loading ? 'Verifying...' : t.auth.verifyAnswersBtn}
                  </button>
                </div>
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
                  className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:placeholder-transparent focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
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
                  className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:placeholder-transparent focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
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

        {/* Duplicate ID Warning Popup Modal */}
        {showDuplicateModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-red-100 text-center space-y-4 animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">Duplicate ID Notice</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  <span className="font-semibold text-red-600">"{regUsername}"</span> is already registered.<br />
                  Please enter a different ID.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDuplicateModal(false);
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
