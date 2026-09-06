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

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginCustom: (usernameOrEmail: string, passwordHash: string) => Promise<{ success: boolean; error?: string }>;
  registerCustom: (profile: Omit<UserProfile, 'id' | 'created_at'>, passwordHash: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  findIdByEmailAndPhone: (email: string, phone: string) => Promise<{ found: boolean; username?: string; error?: string }>;
  fetchSecurityQuestionsForUser: (usernameOrEmail: string) => Promise<{ found: boolean; questions?: { number: number; text: string }[]; error?: string }>;
  verifyAnswersAndResetPw: (usernameOrEmail: string, answers: string[], newPasswordHash: string) => Promise<{ success: boolean; error?: string }>;
  getAllUsers: () => Promise<UserProfile[]>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
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
        country_code: foundUser.country_code || 'US',
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
        registerCustom,
        logout,
        findIdByEmailAndPhone,
        fetchSecurityQuestionsForUser,
        verifyAnswersAndResetPw,
        getAllUsers,
        updateUserRole,
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
