import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isOrganizer: boolean;
  isCanteen: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isOrganizer: false,
  isCanteen: false,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: firebaseUser.uid, ...userDoc.data() } as User);
        } else {
          // Create new student profile by default
          const newUser: User = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'Campus User',
            email: firebaseUser.email || '',
            role: 'student',
            interests: [],
            points: 0,
            badges: [],
            followedSocieties: [],
            photoURL: firebaseUser.photoURL || '',
            status: (firebaseUser.email === 'yugalofficial63@gmail.com') ? 'approved' : 'pending'
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    isAdmin: user?.role === 'admin' || user?.email === 'yugalofficial63@gmail.com',
    isOrganizer: user?.role === 'organizer',
    isCanteen: user?.role === 'canteen',
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
