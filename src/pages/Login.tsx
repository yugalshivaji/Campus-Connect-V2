import React, { useState } from 'react';
import { signInWithGoogle, auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User } from '../types';
import axios from 'axios';
import { Shield, Users, Utensils } from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    role: 'admin',
    label: 'Admin',
    email: 'admin@campus.com',
    password: 'admin123',
    name: 'Admin Demo',
    icon: Shield,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10'
  },
  {
    role: 'organizer',
    label: 'Organiser',
    email: 'org@campus.com',
    password: 'org123',
    name: 'Organiser Demo',
    icon: Users,
    color: 'text-primary',
    bgColor: 'bg-primary/10'
  },
  {
    role: 'canteen',
    label: 'Canteen',
    email: 'canteen@campus.com',
    password: 'canteen123',
    name: 'Canteen Demo',
    icon: Utensils,
    color: 'text-accent',
    bgColor: 'bg-accent/10'
  }
];

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDemoLogin = async (demo: typeof DEMO_ACCOUNTS[0]) => {
    setLoading(true);
    setError('');
    try {
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, demo.email, demo.password);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          // Try to create the account if it doesn't exist (for demo purposes)
          userCredential = await createUserWithEmailAndPassword(auth, demo.email, demo.password);
          const firebaseUser = userCredential.user;
          await updateProfile(firebaseUser, { displayName: demo.name });
          
          const newUser: User = {
            uid: firebaseUser.uid,
            name: demo.name,
            email: demo.email,
            role: demo.role as any,
            interests: [],
            points: 0,
            badges: [],
            followedSocieties: [],
            photoURL: ''
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        } else {
          throw err;
        }
      }

      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      let userRole = demo.role;
      if (userDoc.exists()) {
        userRole = userDoc.data().role;
      } else {
        // Fallback: create the doc if it's missing but auth exists
        const newUser: User = {
          uid: userCredential.user.uid,
          name: demo.name,
          email: demo.email,
          role: demo.role as any,
          interests: [],
          points: 0,
          badges: [],
          followedSocieties: [],
          photoURL: ''
        };
        await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      }

      // Redirect based on role
      if (userRole === 'admin') navigate('/admin');
      else if (userRole === 'student') navigate('/home');
      else if (userRole === 'organizer') navigate('/dashboard');
      else if (userRole === 'canteen') navigate('/canteen');
      else navigate('/');

    } catch (err: any) {
      console.error('Demo login error:', err);
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      setError('Failed to login with Google');
    } finally {
      setLoading(false);
    }
  };

  const [role, setRole] = useState<'student' | 'organizer' | 'canteen'>('student');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let userRole: string = role;
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          userRole = userDoc.data().role;
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        await updateProfile(firebaseUser, { displayName: name });

        const newUser: User = {
          uid: firebaseUser.uid,
          name: name,
          email: email,
          role: role,
          interests: [],
          points: 0,
          badges: [],
          followedSocieties: [],
          photoURL: ''
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        userRole = role;

        // Send Welcome Email
        try {
          await axios.post('/api/email/send', {
            to: email,
            subject: 'Welcome to Campus Connect!',
            templateName: 'welcome',
            params: { name: name, appUrl: window.location.origin }
          });
        } catch (err) {
          console.warn('Welcome email failed to send');
        }
      }
      
      // Redirect based on role
      if (userRole === 'admin') navigate('/admin');
      else if (userRole === 'student') navigate('/home');
      else if (userRole === 'organizer') navigate('/dashboard');
      else if (userRole === 'canteen') navigate('/canteen');
      else navigate('/');
      
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass p-8 rounded-[2.5rem] shadow-2xl border border-white/10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
            <LogIn size={32} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-2">Campus Connect</h1>
          <p className="text-secondary text-sm font-medium">
            {isLogin ? 'Welcome back to your campus ecosystem' : 'Join the most vibrant campus community'}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-2xl mb-6 text-xs font-bold uppercase tracking-widest"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full bg-background/50 border border-secondary/20 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                  />
                </div>

                <div className="flex gap-2 p-1 glass rounded-2xl border border-white/5">
                  {(['student', 'organizer', 'canteen'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        role === r ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-secondary hover:bg-white/5'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary w-5 h-5" />
            <input
              type="email"
              placeholder="Email Address"
              className="w-full bg-background/50 border border-secondary/20 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary w-5 h-5" />
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-background/50 border border-secondary/20 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/25 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                {isLogin ? 'Login' : 'Register'}
              </>
            )}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4 text-secondary">
          <div className="h-px flex-1 bg-secondary/10"></div>
          <span className="text-[10px] font-black uppercase tracking-widest">OR</span>
          <div className="h-px flex-1 bg-secondary/10"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full glass py-4 rounded-2xl font-bold text-sm hover:bg-white/5 transition-all flex items-center justify-center gap-3 border border-white/10"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Continue with Google
        </button>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-secondary text-xs font-bold hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            <ArrowRight size={14} />
          </button>
        </div>
        <div className="mt-8 pt-8 border-t border-white/5">
          <p className="text-[10px] text-secondary font-black uppercase tracking-widest text-center mb-6">Use Demo Credentials</p>
          <div className="grid grid-cols-3 gap-3">
            {DEMO_ACCOUNTS.map((demo) => (
              <button
                key={demo.role}
                onClick={() => handleDemoLogin(demo)}
                disabled={loading}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/5 transition-all hover:scale-105 ${demo.bgColor} group`}
              >
                <demo.icon size={20} className={`${demo.color} group-hover:scale-110 transition-transform`} />
                <span className="text-[8px] font-black uppercase tracking-widest text-secondary">{demo.label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
