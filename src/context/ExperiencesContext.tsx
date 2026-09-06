import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { EventExperience } from '../types';
import { normalizeEventTitle } from '../utils/dedup';

// Curated initial seed experiences for recurring events so users immediately see past community stories & photos
export const INITIAL_EXPERIENCES: EventExperience[] = [
  {
    id: 'exp_seoul_01',
    event_id: 'ev_kr_01',
    event_name: 'Seoul International Tango Marathon',
    normalized_title: 'seoul international tango marathon',
    author_id: 'milonguero_kim',
    author_name: 'Min-soo Kim (김민수)',
    content: 'The wooden dance floor in Seoul was incredibly smooth! DJs played energetic D\'Arienzo and romantic Di Sarli tandas till 6 AM. Ronda was respectful with clear cabeceo. Free warm Korean tea and midnight snacks were served both Friday and Saturday nights. A must-visit marathon in Asia!',
    rating: 5,
    attendance_year: '2025',
    created_at: '2025-11-20T10:15:00.000Z',
    photos: [
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'exp_seoul_02',
    event_id: 'ev_kr_01',
    event_name: 'Seoul International Tango Marathon',
    normalized_title: 'seoul international tango marathon',
    author_id: 'tango_sarah',
    author_name: 'Sarah Jenkins',
    content: 'Traveled from Sydney for this event. Very well-organized with great gender balance. The air conditioning was comfortable despite a packed hall. Will definitely return next year!',
    rating: 5,
    attendance_year: '2024',
    created_at: '2024-11-22T08:30:00.000Z',
    photos: [
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'exp_misterio_01',
    event_id: 'ev_ba_01',
    event_name: 'Misterio Tango Festival Buenos Aires',
    normalized_title: 'misterio tango festival buenos aires',
    author_id: 'carlos_porteño',
    author_name: 'Carlos Mendez',
    content: 'Pure authentic Argentine passion. The live orquestas tipicas were world class. The milonga floor had that unmistakable Buenos Aires embrace and tradition. Dress code was elegant.',
    rating: 5,
    attendance_year: '2025',
    created_at: '2025-03-15T19:40:00.000Z',
    photos: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'exp_austin_01',
    event_id: 'ev_us_05',
    event_name: 'Austin Spring Tango Festival',
    normalized_title: 'austin spring tango festival',
    author_id: 'elena_austin',
    author_name: 'Elena Rostova',
    content: 'Warm community vibe, great workshops on musicality and close embrace. The outdoor social after-party by the lake was unforgettable.',
    rating: 4,
    attendance_year: '2025',
    created_at: '2025-04-10T14:20:00.000Z',
    photos: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80'
    ]
  }
];

interface ExperiencesContextType {
  experiences: EventExperience[];
  loading: boolean;
  getExperiencesForEvent: (eventName: string) => EventExperience[];
  getExperienceCountForEvent: (eventName: string) => number;
  addExperience: (data: Omit<EventExperience, 'id' | 'created_at' | 'normalized_title'>) => Promise<{ success: boolean; id?: string; error?: string }>;
  deleteExperience: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const ExperiencesContext = createContext<ExperiencesContextType | undefined>(undefined);

export const ExperiencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [experiences, setExperiences] = useState<EventExperience[]>(() => {
    try {
      const cached = localStorage.getItem('everytango_experiences');
      return cached ? JSON.parse(cached) : INITIAL_EXPERIENCES;
    } catch {
      return INITIAL_EXPERIENCES;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Firestore sync with local fallback
  useEffect(() => {
    let unsub = () => {};
    try {
      const expCol = collection(db, 'event_experiences');
      unsub = onSnapshot(expCol, (snapshot) => {
        if (!snapshot.empty) {
          const list: EventExperience[] = [];
          const existingIds = new Set<string>();
          snapshot.forEach((d) => {
            const data = { id: d.id, ...d.data() } as EventExperience;
            list.push(data);
            existingIds.add(d.id);
          });

          // Sync any missing initial seed experiences
          INITIAL_EXPERIENCES.forEach(async (seed) => {
            if (!existingIds.has(seed.id)) {
              try {
                await setDoc(doc(db, 'event_experiences', seed.id), seed);
              } catch (e) {
                console.warn('Sync seed experience error:', e);
              }
            }
          });

          setExperiences(list);
          localStorage.setItem('everytango_experiences', JSON.stringify(list));
        } else {
          // If remote collection is empty, seed it
          INITIAL_EXPERIENCES.forEach(async (seed) => {
            try {
              await setDoc(doc(db, 'event_experiences', seed.id), seed);
            } catch (e) {
              console.warn('Seeding remote experience error:', e);
            }
          });
          setExperiences(INITIAL_EXPERIENCES);
          localStorage.setItem('everytango_experiences', JSON.stringify(INITIAL_EXPERIENCES));
        }
        setLoading(false);
      }, (error) => {
        console.warn('Firestore experiences snapshot error, using local state:', error);
        setLoading(false);
      });
    } catch (err) {
      console.warn('Failed to attach Firestore experiences listener:', err);
      setLoading(false);
    }

    return () => unsub();
  }, []);

  /**
   * Retrieves past experiences matching the event title.
   * Matches both the normalized title (ignoring years and punctuation)
   * and exact lowercase title to guarantee continuity for recurring editions.
   */
  const getExperiencesForEvent = (eventName: string): EventExperience[] => {
    if (!eventName) return [];
    const targetNorm = normalizeEventTitle(eventName);
    const targetLower = eventName.trim().toLowerCase();

    return experiences
      .filter((exp) => {
        if (!exp) return false;
        if (exp.normalized_title && targetNorm && exp.normalized_title === targetNorm) {
          return true;
        }
        if (exp.event_name && exp.event_name.trim().toLowerCase() === targetLower) {
          return true;
        }
        // Substring / partial match for recurring series e.g. "Seoul International Tango Marathon"
        if (targetNorm && exp.normalized_title && (
          targetNorm.includes(exp.normalized_title) || exp.normalized_title.includes(targetNorm)
        )) {
          return true;
        }
        return false;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const getExperienceCountForEvent = (eventName: string): number => {
    return getExperiencesForEvent(eventName).length;
  };

  const addExperience = async (
    data: Omit<EventExperience, 'id' | 'created_at' | 'normalized_title'>
  ): Promise<{ success: boolean; id?: string; error?: string }> => {
    try {
      const id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const normalizedTitle = normalizeEventTitle(data.event_name);
      const newExperience: EventExperience = {
        ...data,
        id,
        normalized_title: normalizedTitle,
        created_at: new Date().toISOString()
      };

      // Update state and local storage immediately
      const updated = [newExperience, ...experiences];
      setExperiences(updated);
      localStorage.setItem('everytango_experiences', JSON.stringify(updated));

      // Persist to Firestore
      try {
        await setDoc(doc(db, 'event_experiences', id), newExperience);
      } catch (firestoreErr) {
        console.warn('Firestore write warning for experience (saved locally):', firestoreErr);
      }

      return { success: true, id };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to save experience.' };
    }
  };

  const deleteExperience = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const updated = experiences.filter((e) => e.id !== id);
      setExperiences(updated);
      localStorage.setItem('everytango_experiences', JSON.stringify(updated));

      try {
        await deleteDoc(doc(db, 'event_experiences', id));
      } catch (firestoreErr) {
        console.warn('Firestore delete warning (removed locally):', firestoreErr);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete experience.' };
    }
  };

  return (
    <ExperiencesContext.Provider
      value={{
        experiences,
        loading,
        getExperiencesForEvent,
        getExperienceCountForEvent,
        addExperience,
        deleteExperience
      }}
    >
      {children}
    </ExperiencesContext.Provider>
  );
};

export const useExperiences = (): ExperiencesContextType => {
  const context = useContext(ExperiencesContext);
  if (!context) {
    throw new Error('useExperiences must be used within an ExperiencesProvider');
  }
  return context;
};
