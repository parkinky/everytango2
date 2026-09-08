import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithPopup,
  signInWithCustomToken,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { UserProfile, UserRole, RegisterSecurityQuestionInput } from '../types';

// ---------------------------------------------------------------------------
// SECURITY NOTE
// ---------------------------------------------------------------------------
// This file used to talk to Firestore directly from the browser for the
// custom (non-Google) login system: it stored plaintext passwords in a
// `password_hash` field, shipped hardcoded admin/demo credentials and
// security-question answers in this source file, and trusted a
// `localStorage` blob as a "session" with no server verification at all.
// Combined with Firestore rules that allowed open read/write, that meant
// anyone could read every user's email/phone/password directly, forge an
// ADMIN session in the browser console, and reset the admin password using
// the hardcoded security answers that were sitting right here in the repo.
//
// All of that has been moved server-side (see server.ts, /api/auth/* and
// /api/admin/*). This context now only calls those endpoints. Successful
// custom login/registration signs the user into real Firebase Auth via a
// server-minted custom token (signInWithCustomToken), so both Google and
// "custom" logins end up as a normal Firebase Auth session - which is what
// lets the Firestore rules for the `users` collection be locked down to
// `if false` (server-only access via the Admin SDK).
// ---------------------------------------------------------------------------

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginCustom: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  checkUsernameExists: (username: string) => Promise<boolean>;
  registerCustom: (
    profile: Omit<UserProfile, 'id' | 'created_at' | 'security_questions'> & {
      security_questions: RegisterSecurityQuestionInput[];
    },
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  findIdByEmailAndPhone: (email: string, phone: string) => Promise<{ found: boolean; username?: string; error?: string }>;
  fetchSecurityQuestionsForUser: (usernameOrEmail: string) => Promise<{ found: boolean; questions?: { number: number; text: string }[]; error?: string }>;
  verifySingleSecurityAnswer: (usernameOrEmail: string, questionNumber: number, answerPlain: string) => Promise<{ success: boolean; error?: string }>;
  verifySingleAnswerAndResetPw: (usernameOrEmail: string, questionNumber: number, answerPlain: string, newPasswordPlain: string) => Promise<{ success: boolean; error?: string }>;
  verifyAnswersAndResetPw: (usernameOrEmail: string, answers: string[], newPassword: string) => Promise<{ success: boolean; error?: string }>;
  getAllUsers: () => Promise<UserProfile[]>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  updateUserProfile: (userId: string, updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  resetUserPasswordByAdmin: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Attaches the current Firebase ID token (if any) to a JSON request. Used for
// every endpoint that requires the caller to be logged in / an admin - the
// server independently re-verifies this token and the caller's role, it
// never trusts anything the client claims about itself.
async function authedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let idToken: string | undefined;
  try {
    idToken = await auth.currentUser?.getIdToken();
  } catch {
    idToken = undefined;
  }
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      ...(options.headers || {}),
    },
  });
}

async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // One-time cleanup: earlier builds stored a forgeable "session" (and a
    // fake local user database) directly in localStorage. Those are no
    // longer read anywhere, but remove them so a stale/tampered value from
    // before this fix can never be confused with anything.
    try {
      localStorage.removeItem('everytango_custom_user');
      localStorage.removeItem('everytango_db_users');
    } catch {
      // ignore (e.g. storage disabled)
    }

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentUser(fbUser);
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          const data = await safeJson(res);
          setUserProfile(res.ok && data.success ? data.profile : null);
        } catch (err) {
          console.warn('Could not load user profile:', err);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google Sign in error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginCustom = async (usernameOrEmail: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Login failed' };
      }
      await signInWithCustomToken(auth, data.token);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const checkUsernameExists = async (username: string): Promise<boolean> => {
    const clean = username.trim();
    if (!clean) return false;
    try {
      const res = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean }),
      });
      const data = await safeJson(res);
      return !!data.exists;
    } catch (err) {
      console.warn('Username check failed:', err);
      return false;
    }
  };

  const registerCustom = async (
    profileData: Omit<UserProfile, 'id' | 'created_at' | 'security_questions'> & {
      security_questions: RegisterSecurityQuestionInput[];
    },
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profileData, password }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      await signInWithCustomToken(auth, data.token);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    setUserProfile(null);
  };

  const findIdByEmailAndPhone = async (email: string, phone: string): Promise<{ found: boolean; username?: string; error?: string }> => {
    try {
      const res = await fetch('/api/auth/find-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone }),
      });
      const data = await safeJson(res);
      return { found: !!data.found, username: data.username, error: data.error };
    } catch (err: any) {
      return { found: false, error: err.message || 'Lookup failed' };
    }
  };

  const fetchSecurityQuestionsForUser = async (
    usernameOrEmail: string
  ): Promise<{ found: boolean; questions?: { number: number; text: string }[]; error?: string }> => {
    try {
      const res = await fetch('/api/auth/security-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail }),
      });
      const data = await safeJson(res);
      return { found: !!data.found, questions: data.questions, error: data.error };
    } catch (err: any) {
      return { found: false, error: err.message || 'Could not retrieve security questions.' };
    }
  };

  const verifySingleSecurityAnswer = async (
    usernameOrEmail: string,
    questionNumber: number,
    answerPlain: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/verify-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, questionNumber, answer: answerPlain }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || '보안 답변이 일치하지 않습니다.' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || '보안 답변 확인에 실패했습니다.' };
    }
  };

  const verifySingleAnswerAndResetPw = async (
    usernameOrEmail: string,
    questionNumber: number,
    answerPlain: string,
    newPasswordPlain: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/reset-password-with-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail,
          questionNumber,
          answer: answerPlain,
          newPassword: newPasswordPlain,
        }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Password update failed.' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Password update failed.' };
    }
  };

  const verifyAnswersAndResetPw = async (
    usernameOrEmail: string,
    answers: string[],
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/reset-password-with-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, answers, newPassword }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data.success) {
        return { success: false, error: data.error };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const getAllUsers = async (): Promise<UserProfile[]> => {
    try {
      const res = await authedFetch('/api/admin/users');
      const data = await safeJson(res);
      return res.ok && data.success ? data.users : [];
    } catch (err) {
      console.warn('Could not load users:', err);
      return [];
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      await authedFetch(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      if (userProfile && userProfile.id === userId) {
        setUserProfile({ ...userProfile, role: newRole });
      }
    } catch (err) {
      console.warn('Update user role error:', err);
    }
  };

  const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authedFetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      const data = await safeJson(res);
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to update user profile' };
      }
      if (userProfile && userProfile.id === userId) {
        setUserProfile({ ...userProfile, ...updates });
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update user profile' };
    }
  };

  const resetUserPasswordByAdmin = async (userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanPassword = newPassword.trim();
      if (!cleanPassword) {
        return { success: false, error: '새 비밀번호를 입력해주세요.' };
      }
      const res = await authedFetch(`/api/admin/users/${encodeURIComponent(userId)}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword: cleanPassword }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || '비밀번호 초기화에 실패했습니다.' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || '비밀번호 초기화에 실패했습니다.' };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await authedFetch(`/api/admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Delete user error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        loginWithGoogle,
        loginCustom,
        checkUsernameExists,
        registerCustom,
        logout,
        findIdByEmailAndPhone,
        fetchSecurityQuestionsForUser,
        verifySingleSecurityAnswer,
        verifySingleAnswerAndResetPw,
        verifyAnswersAndResetPw,
        getAllUsers,
        updateUserRole,
        updateUserProfile,
        resetUserPasswordByAdmin,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
