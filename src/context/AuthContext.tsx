import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  signInAnonymously
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { UserProfile, UserRole } from '../types';
import { hashAnswer } from '../utils/dedup';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginCustom: (usernameOrEmail: string, passwordHash: string) => Promise<{ success: boolean; error?: string }>;
  checkUsernameExists: (username: string) => Promise<boolean>;
  registerCustom: (profile: Omit<UserProfile, 'id' | 'created_at'>, passwordHash: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  findIdByEmailAndPhone: (email: string, phone: string) => Promise<{ found: boolean; username?: string; error?: string }>;
  fetchSecurityQuestionsForUser: (usernameOrEmail: string) => Promise<{ found: boolean; questions?: { number: number; text: string }[]; error?: string }>;
  verifySingleSecurityAnswer: (usernameOrEmail: string, questionNumber: number, answerPlain: string) => Promise<{ success: boolean; error?: string }>;
  verifySingleAnswerAndResetPw: (usernameOrEmail: string, questionNumber: number, answerPlain: string, newPasswordPlain: string) => Promise<{ success: boolean; error?: string }>;
  verifyAnswersAndResetPw: (usernameOrEmail: string, answers: string[], newPasswordHash: string) => Promise<{ success: boolean; error?: string }>;
  getAllUsers: () => Promise<UserProfile[]>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  updateUserProfile: (userId: string, updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  resetUserPasswordByAdmin: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load custom logged in user from localStorage if not using Firebase Auth session
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentUser(fbUser);
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setUserProfile(snap.data() as UserProfile);
          } else {
            // Create default profile for Google user
            const newProfile: UserProfile = {
              id: fbUser.uid,
              username: fbUser.email?.split('@')[0] || 'TangoDancer',
              email: fbUser.email || '',
              country_code: 'US',
              city: 'Global',
              phone: '',
              role: fbUser.email === 'parkinky@gmail.com' ? 'ADMIN' : 'USER',
              created_at: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (err) {
          console.warn('Could not fetch firestore user profile, falling back to local:', err);
          const newProfile: UserProfile = {
            id: fbUser.uid,
            username: fbUser.email?.split('@')[0] || 'TangoDancer',
            email: fbUser.email || '',
            country_code: 'US',
            city: 'Global',
            phone: '',
            role: fbUser.email === 'parkinky@gmail.com' ? 'ADMIN' : 'USER',
            created_at: new Date().toISOString(),
          };
          setUserProfile(newProfile);
        }
      } else {
        // Check local custom session
        const savedSession = localStorage.getItem('everytango_custom_user');
        if (savedSession) {
          try {
            setUserProfile(JSON.parse(savedSession));
          } catch {
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
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

  const loginCustom = async (usernameOrEmail: string, passwordHash: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const q = usernameOrEmail.trim().toLowerCase();
      // Look up in Firestore users collection or local storage cache
      let foundUser: any = null;
      try {
        const usersRef = collection(db, 'users');
        const snap1 = await getDocs(query(usersRef, where('email', '==', q)));
        if (!snap1.empty) {
          foundUser = snap1.docs[0].data();
        } else {
          const snap2 = await getDocs(query(usersRef, where('username', '==', q)));
          if (!snap2.empty) {
            foundUser = snap2.docs[0].data();
          }
        }
      } catch (err) {
        console.warn('Firebase query failed, checking local users:', err);
      }

      // Check local registered users store if not found in remote
      if (!foundUser) {
        const localUsers = JSON.parse(localStorage.getItem('everytango_db_users') || '[]');
        foundUser = localUsers.find((u: any) => 
          u.email.toLowerCase() === q || u.username.toLowerCase() === q
        );
      }

      // Admin account: parkinky (id=parkinky, pw=admin)
      if (!foundUser && (q === 'parkinky' || q === 'parkinky@gmail.com')) {
        foundUser = {
          id: 'admin_parkinky',
          username: 'parkinky',
          email: 'parkinky@gmail.com',
          password_hash: 'admin',
          country_code: 'KR',
          city: 'Seoul',
          phone: '+82 10-1234-5678',
          role: 'ADMIN',
          created_at: '2026-01-01T00:00:00Z',
          security_questions: [
            { question_number: 1, question_text: 'What was your first pet’s name?', answer_hash: 'tango' },
            { question_number: 2, question_text: 'In what city was your first tango festival?', answer_hash: 'seoul' },
            { question_number: 3, question_text: 'What is your favorite tango orchestra?', answer_hash: 'di sarli' }
          ]
        };
      }

      // Admin demo fallback account
      if (!foundUser && (q === 'admin' || q === 'admin@everytango.com')) {
        foundUser = {
          id: 'admin_master_1',
          username: 'admin',
          email: 'admin@everytango.com',
          password_hash: 'admin123',
          country_code: 'US',
          city: 'Buenos Aires',
          phone: '+1-555-0199',
          role: 'ADMIN',
          created_at: '2026-01-01T00:00:00Z'
        };
      }

      if (!foundUser) {
        return { success: false, error: 'User not found. Please check your username/email or register.' };
      }

      // Allow admin credentials for parkinky / admin or standard password match
      const isValidPassword = 
        foundUser.password_hash === passwordHash ||
        (foundUser.username === 'parkinky' && (passwordHash === 'admin' || passwordHash === 'admin123')) ||
        (foundUser.username === 'admin' && (passwordHash === 'admin' || passwordHash === 'admin123'));

      if (!isValidPassword) {
        return { success: false, error: 'Invalid password. Please try again or recover your password.' };
      }

      const profile: UserProfile = {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        first_name: foundUser.first_name || '',
        last_name: foundUser.last_name || '',
        country_code: foundUser.country_code || 'US',
        state: foundUser.state || '',
        city: foundUser.city || '',
        phone: foundUser.phone || '',
        role: foundUser.role || 'USER',
        created_at: foundUser.created_at || new Date().toISOString(),
      };

      setUserProfile(profile);
      localStorage.setItem('everytango_custom_user', JSON.stringify(profile));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const checkUsernameExists = async (username: string): Promise<boolean> => {
    const clean = username.trim().toLowerCase();
    if (!clean) return false;

    // 1. Reserved administrative usernames
    if (clean === 'parkinky' || clean === 'admin') {
      return true;
    }

    // 2. Check local users store
    try {
      const localUsers = JSON.parse(localStorage.getItem('everytango_db_users') || '[]');
      const foundLocal = localUsers.some(
        (u: any) => (u.username || '').trim().toLowerCase() === clean
      );
      if (foundLocal) return true;
    } catch (e) {
      console.warn('Local users parse error during username check:', e);
    }

    // 3. Check Firestore
    try {
      const usersRef = collection(db, 'users');
      const snap = await getDocs(query(usersRef, where('username', '==', clean)));
      if (!snap.empty) return true;

      // Check case variations if needed
      if (username.trim() !== clean) {
        const snapCase = await getDocs(query(usersRef, where('username', '==', username.trim())));
        if (!snapCase.empty) return true;
      }
    } catch (err) {
      console.warn('Firestore query error during username check:', err);
    }

    return false;
  };

  const registerCustom = async (
    profileData: Omit<UserProfile, 'id' | 'created_at'>,
    passwordHash: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const newId = 'usr_' + Math.random().toString(36).substr(2, 9);
      const now = new Date().toISOString();
      const newRecord = {
        id: newId,
        ...profileData,
        password_hash: passwordHash,
        created_at: now,
      };

      // Save to Firestore
      try {
        await setDoc(doc(db, 'users', newId), newRecord);
      } catch (err) {
        console.warn('Could not save user to firestore, storing locally:', err);
      }

      // Also persist to localStorage backup
      const localUsers = JSON.parse(localStorage.getItem('everytango_db_users') || '[]');
      localUsers.push(newRecord);
      localStorage.setItem('everytango_db_users', JSON.stringify(localUsers));

      const profile: UserProfile = {
        id: newId,
        ...profileData,
        created_at: now,
      };

      setUserProfile(profile);
      localStorage.setItem('everytango_custom_user', JSON.stringify(profile));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    if (currentUser) {
      await fbSignOut(auth);
    }
    localStorage.removeItem('everytango_custom_user');
    setUserProfile(null);
  };

  const findIdByEmailAndPhone = async (email: string, phone: string): Promise<{ found: boolean; username?: string; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim().replace(/[^0-9+]/g, '');

    // Check remote
    try {
      const usersRef = collection(db, 'users');
      const snap = await getDocs(query(usersRef, where('email', '==', cleanEmail)));
      if (!snap.empty) {
        const u = snap.docs[0].data();
        const uPhone = (u.phone || '').trim().replace(/[^0-9+]/g, '');
        if (uPhone === cleanPhone || !cleanPhone) {
          return { found: true, username: u.username };
        }
      }
    } catch (e) {
      console.warn('Firestore find ID query err:', e);
    }

    // Check local store
    const localUsers = JSON.parse(localStorage.getItem('everytango_db_users') || '[]');
    const matched = localUsers.find((u: any) => {
      const uPhone = (u.phone || '').trim().replace(/[^0-9+]/g, '');
      return u.email.toLowerCase() === cleanEmail && (uPhone === cleanPhone || !cleanPhone);
    });

    if (matched) {
      return { found: true, username: matched.username };
    }

    return { found: false, error: 'No account matched this email and phone number combination.' };
  };

  const fetchSecurityQuestionsForUser = async (usernameOrEmail: string): Promise<{ found: boolean; questions?: { number: number; text: string }[]; error?: string }> => {
    const q = usernameOrEmail.trim().toLowerCase();
    let user: any = null;

    try {
      const usersRef = collection(db, 'users');
      const snap1 = await getDocs(query(usersRef, where('email', '==', q)));
      if (!snap1.empty) user = snap1.docs[0].data();
      else {
        const snap2 = await getDocs(query(usersRef, where('username', '==', q)));
        if (!snap2.empty) user = snap2.docs[0].data();
      }
    } catch (e) {
      console.warn('Firestore fetch questions err:', e);
    }

    if (!user) {
      const localUsers = JSON.parse(localStorage.getItem('everytango_db_users') || '[]');
      user = localUsers.find((u: any) => u.email.toLowerCase() === q || u.username.toLowerCase() === q);
    }

    if (!user || !user.security_questions || user.security_questions.length === 0) {
      return { found: false, error: 'Account not found or no security questions configured for this user.' };
    }

    const questionList = user.security_questions.map((sq: any) => ({
      number: sq.question_number,
      text: sq.question_text
    }));

    return { found: true, questions: questionList };
  };

  const verifySingleSecurityAnswer = async (
    usernameOrEmail: string,
    questionNumber: number,
    answerPlain: string
  ): Promise<{ success: boolean; error?: string }> => {
    const q = usernameOrEmail.trim().toLowerCase();
    let user: any = null;

    try {
      const usersRef = collection(db, 'users');
      const snap1 = await getDocs(query(usersRef, where('email', '==', q)));
      if (!snap1.empty) {
        user = snap1.docs[0].data();
      } else {
        const snap2 = await getDocs(query(usersRef, where('username', '==', q)));
        if (!snap2.empty) {
          user = snap2.docs[0].data();
        }
      }
    } catch (e) {
      console.warn('Firestore verify single answer lookup err:', e);
    }

    if (!user) {
      const localUsers = JSON.parse(localStorage.getItem('everytango_db_users') || '[]');
      user = localUsers.find((u: any) => u.email?.toLowerCase() === q || u.username?.toLowerCase() === q);
    }

    // Default admin fallback
    if (!user && (q === 'parkinky' || q === 'parkinky@gmail.com')) {
      user = {
        username: 'parkinky',
        email: 'parkinky@gmail.com',
        security_questions: [
          { question_number: 1, question_text: 'What was your first pet’s name?', answer_hash: 'tango' },
          { question_number: 2, question_text: 'In what city was your first tango festival?', answer_hash: 'seoul' },
          { question_number: 3, question_text: 'What is your favorite tango orchestra?', answer_hash: 'di sarli' }
        ]
      };
    }

    if (!user || !user.security_questions || user.security_questions.length === 0) {
      return { success: false, error: '보안 질문이 등록되지 않은 사용자입니다.' };
    }

    const targetQ = user.security_questions.find((sq: any) => sq.question_number === questionNumber);
    if (!targetQ) {
      return { success: false, error: `보안 질문 #${questionNumber}번을 찾을 수 없습니다.` };
    }

    const expected = (targetQ.answer_hash || '').trim().toLowerCase();
    const cleanProvided = (answerPlain || '').trim().toLowerCase();
    const hashedProvided = await hashAnswer(cleanProvided);

    if (expected !== cleanProvided && expected !== hashedProvided) {
      return { success: false, error: '보안 답변이 일치하지 않습니다. 다시 입력하시거나 다른 질문을 선택해 주세요.' };
    }

    return { success: true };
  };

  const verifySingleAnswerAndResetPw = async (
    usernameOrEmail: string,
    questionNumber: number,
    answerPlain: string,
    newPasswordPlain: string
  ): Promise<{ success: boolean; error?: string }> => {
    const q = usernameOrEmail.trim().toLowerCase();
    let userDocId: string | null = null;
    let user: any = null;

    try {
      const usersRef = collection(db, 'users');
      const snap1 = await getDocs(query(usersRef, where('email', '==', q)));
      if (!snap1.empty) {
        userDocId = snap1.docs[0].id;
        user = snap1.docs[0].data();
      } else {
        const snap2 = await getDocs(query(usersRef, where('username', '==', q)));
        if (!snap2.empty) {
          userDocId = snap2.docs[0].id;
          user = snap2.docs[0].data();
        }
      }
    } catch (e) {
      console.warn('Firestore verify single answer and reset lookup err:', e);
    }

    if (!user) {
      const localUsers = JSON.parse(localStorage.getItem('everytango_db_users') || '[]');
      user = localUsers.find((u: any) => u.email?.toLowerCase() === q || u.username?.toLowerCase() === q);
    }

    if (!user && (q === 'parkinky' || q === 'parkinky@gmail.com')) {
      user = {
        id: 'admin_parkinky',
        username: 'parkinky',
        email: 'parkinky@gmail.com',
        role: 'ADMIN',
        security_questions: [
          { question_number: 1, question_text: 'What was your first pet’s name?', answer_hash: 'tango' },
          { question_number: 2, question_text: 'In what city was your first tango festival?', answer_hash: 'seoul' },
          { question_number: 3, question_text: 'What is your favorite tango orchestra?', answer_hash: 'di sarli' }
        ]
      };
    }

    if (!user || !user.security_questions || user.security_questions.length === 0) {
      return { success: false, error: '보안 질문이 등록되지 않은 계정입니다.' };
    }

    const targetQ = user.security_questions.find((sq: any) => sq.question_number === questionNumber);
    if (!targetQ) {
      return { success: false, error: `보안 질문 #${questionNumber}번이 존재하지 않습니다.` };
    }

    const expected = (targetQ.answer_hash || '').trim().toLowerCase();
    const cleanProvided = (answerPlain || '').trim().toLowerCase();
    const hashedProvided = await hashAnswer(cleanProvided);

    if (expected !== cleanProvided && expected !== hashedProvided) {
      return { success: false, error: '보안 답변이 일치하지 않습니다.' };
    }

    // Update password in Firestore
    if (userDocId) {
      try {
        await setDoc(doc(db, 'users', userDocId), { ...user, password_hash: newPasswordPlain }, { merge: true });
      } catch (e) {
        console.warn('Could not update password in firestore:', e);
      }
    }

    // Update in local cache
    const localUsers = JSON.parse(localStorage.getItem('everytango_db_users') || '[]');
    const idx = localUsers.findIndex((u: any) => u.id === user.id || u.username?.toLowerCase() === q || u.email?.toLowerCase() === q);
    if (idx >= 0) {
      localUsers[idx].password_hash = newPasswordPlain;
      localStorage.setItem('everytango_db_users', JSON.stringify(localUsers));
    } else {
      localUsers.push({ ...user, password_hash: newPasswordPlain });
      localStorage.setItem('everytango_db_users', JSON.stringify(localUsers));
    }

    // If this was the logged-in user, update state
    if (userProfile && (userProfile.id === user.id || userProfile.username?.toLowerCase() === q)) {
      const updated = { ...userProfile, password_hash: newPasswordPlain };
      setUserProfile(updated);
      localStorage.setItem('everytango_custom_user', JSON.stringify(updated));
    }

    return { success: true };
  };

  const verifyAnswersAndResetPw = async (
    usernameOrEmail: string, 
    answers: string[], 
    newPasswordHash: string
  ): Promise<{ success: boolean; error?: string }> => {
    const q = usernameOrEmail.trim().toLowerCase();
    let userDocId: string | null = null;
    let user: any = null;

    try {
      const usersRef = collection(db, 'users');
      const snap1 = await getDocs(query(usersRef, where('email', '==', q)));
      if (!snap1.empty) {
        userDocId = snap1.docs[0].id;
        user = snap1.docs[0].data();
      } else {
        const snap2 = await getDocs(query(usersRef, where('username', '==', q)));
        if (!snap2.empty) {
          userDocId = snap2.docs[0].id;
          user = snap2.docs[0].data();
        }
      }
    } catch (e) {
      console.warn('Firestore verify answers lookup err:', e);
    }

    if (!user) {
      const localUsers = JSON.parse(localStorage.getItem('everytango_db_users') || '[]');
      user = localUsers.find((u: any) => u.email.toLowerCase() === q || u.username.toLowerCase() === q);
    }

    if (!user || !user.security_questions || user.security_questions.length < 3) {
      return { success: false, error: 'User does not have 3 security questions on file.' };
    }

    // Verify all 3 answers match
    for (let i = 0; i < 3; i++) {
      const expected = (user.security_questions[i]?.answer_hash || '').toLowerCase();
      const provided = (answers[i] || '').trim().toLowerCase();
      if (expected !== provided) {
        return { success: false, error: `Answer to question #${i + 1} does not match our records.` };
      }
    }

    // Update password
    if (userDocId) {
      try {
        await setDoc(doc(db, 'users', userDocId), { ...user, password_hash: newPasswordHash }, { merge: true });
      } catch (e) {
        console.warn('Could not update password in firestore:', e);
      }
    }

    // Update local cache
    const localUsers = JSON.parse(localStorage.getItem('everytango_db_users') || '[]');
    const idx = localUsers.findIndex((u: any) => u.id === user.id);
    if (idx >= 0) {
      localUsers[idx].password_hash = newPasswordHash;
      localStorage.setItem('everytango_db_users', JSON.stringify(localUsers));
    }

    return { success: true };
  };

  const getAllUsers = async (): Promise<UserProfile[]> => {
    const userList: UserProfile[] = [];
    const seenIds = new Set<string>();

    // 1. Fetch from Firestore
    try {
      const snap = await getDocs(collection(db, 'users'));
      snap.forEach((d) => {
        const data = d.data() as UserProfile;
        if (data && data.id && !seenIds.has(data.id)) {
          seenIds.add(data.id);
          userList.push(data);
        }
      });
    } catch (e) {
      console.warn('Could not read users from Firestore:', e);
    }

    // 2. Fetch from Local Storage
    try {
      const localUsers = JSON.parse(localStorage.getItem('everytango_db_users') || '[]');
      for (const u of localUsers) {
        if (u && u.id && !seenIds.has(u.id)) {
          seenIds.add(u.id);
          userList.push(u);
        }
      }
    } catch (e) {
      console.warn('Could not read local users:', e);
    }

    // 3. Ensure default seed users including parkinky (ADMIN) are present
    const defaultSeedUsers: UserProfile[] = [
      {
        id: 'admin_parkinky',
        username: 'parkinky',
        email: 'parkinky@gmail.com',
        country_code: 'KR',
        city: 'Seoul',
        phone: '+82 10-1234-5678',
        role: 'ADMIN',
        created_at: '2026-01-01T09:00:00Z',
        last_login: new Date().toISOString(),
        security_questions: [
          { question_number: 1, question_text: 'What was your first pet’s name?', answer_hash: 'tango' },
          { question_number: 2, question_text: 'In what city was your first tango festival?', answer_hash: 'seoul' },
          { question_number: 3, question_text: 'What is your favorite tango orchestra?', answer_hash: 'di sarli' }
        ]
      },
      {
        id: 'usr_carlos_m',
        username: 'carlos_milonguero',
        email: 'carlos.m@tango-ba.ar',
        country_code: 'AR',
        city: 'Buenos Aires',
        phone: '+54 11 4321-9876',
        role: 'USER',
        created_at: '2026-02-14T14:30:00Z',
        last_login: '2026-09-02T18:20:00Z',
      },
      {
        id: 'usr_maria_t',
        username: 'maria_tango',
        email: 'maria.dance@tangomadrid.es',
        country_code: 'ES',
        city: 'Madrid',
        phone: '+34 91 555 4321',
        role: 'USER',
        created_at: '2026-03-10T11:15:00Z',
        last_login: '2026-09-04T09:40:00Z',
      },
      {
        id: 'usr_hannah_b',
        username: 'hannah_berlin',
        email: 'hannah@berlintango.de',
        country_code: 'DE',
        city: 'Berlin',
        phone: '+49 30 1234567',
        role: 'USER',
        created_at: '2026-04-05T16:45:00Z',
        last_login: '2026-09-03T12:00:00Z',
      },
      {
        id: 'usr_kenji_t',
        username: 'kenji_tokyo',
        email: 'kenji@tangotokyo.jp',
        country_code: 'JP',
        city: 'Tokyo',
        phone: '+81 3 3456 7890',
        role: 'USER',
        created_at: '2026-05-20T08:10:00Z',
        last_login: '2026-09-05T03:15:00Z',
      }
    ];

    for (const seed of defaultSeedUsers) {
      if (!seenIds.has(seed.id) && !seenIds.has(seed.username)) {
        seenIds.add(seed.id);
        userList.push(seed);
      }
    }

    return userList;
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (e) {
      console.warn('Update remote user role error:', e);
    }
    const localUsers = JSON.parse(localStorage.getItem('everytango_db_users') || '[]');
    const idx = localUsers.findIndex((u: any) => u.id === userId);
    if (idx >= 0) {
      localUsers[idx].role = newRole;
      localStorage.setItem('everytango_db_users', JSON.stringify(localUsers));
    }
    if (userProfile && userProfile.id === userId) {
      const updated = { ...userProfile, role: newRole };
      setUserProfile(updated);
      localStorage.setItem('everytango_custom_user', JSON.stringify(updated));
    }
  };

  const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Update remote Firestore document
      try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, updates, { merge: true });
      } catch (remoteErr) {
        console.warn('Update remote user in firestore failed or offline, updating locally:', remoteErr);
      }

      // 2. Update local mock/cache storage
      const localUsers: UserProfile[] = JSON.parse(localStorage.getItem('everytango_db_users') || '[]');
      const idx = localUsers.findIndex((u) => u.id === userId);
      if (idx >= 0) {
        localUsers[idx] = { ...localUsers[idx], ...updates };
        localStorage.setItem('everytango_db_users', JSON.stringify(localUsers));
      }

      // 3. If currently logged-in user is updated, sync active state
      if (userProfile && userProfile.id === userId) {
        const updated = { ...userProfile, ...updates };
        setUserProfile(updated);
        localStorage.setItem('everytango_custom_user', JSON.stringify(updated));
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

      // 1. Update remote Firestore document
      try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, { password_hash: cleanPassword }, { merge: true });
      } catch (remoteErr) {
        console.warn('Reset remote user password in firestore failed or offline, updating locally:', remoteErr);
      }

      // 2. Update local mock/cache storage
      const localUsers: UserProfile[] = JSON.parse(localStorage.getItem('everytango_db_users') || '[]');
      const idx = localUsers.findIndex((u) => u.id === userId);
      if (idx >= 0) {
        localUsers[idx].password_hash = cleanPassword;
        localStorage.setItem('everytango_db_users', JSON.stringify(localUsers));
      }

      // 3. If currently logged-in user is updated, sync active state
      if (userProfile && userProfile.id === userId) {
        const updated = { ...userProfile, password_hash: cleanPassword };
        setUserProfile(updated);
        localStorage.setItem('everytango_custom_user', JSON.stringify(updated));
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || '비밀번호 초기화에 실패했습니다.' };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (e) {
      console.warn('Delete remote user error:', e);
    }
    const localUsers = JSON.parse(localStorage.getItem('everytango_db_users') || '[]');
    const filtered = localUsers.filter((u: any) => u.id !== userId);
    localStorage.setItem('everytango_db_users', JSON.stringify(filtered));
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
