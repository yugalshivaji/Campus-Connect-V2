import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, User, Bell, Settings, HelpCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { motion } from 'motion/react';

export default function RoleHeader() {
  const { user, logout, isAdmin, isOrganizer } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const getRoleLabel = () => {
    if (isAdmin) return 'Admin Portal';
    if (isOrganizer) return 'Organiser Hub';
    if (user.role === 'canteen') return 'Canteen Portal';
    return 'Student Portal';
  };

  const getDashboardLink = () => {
    if (user.role === 'student') return '/home';
    if (user.role === 'canteen') return '/canteen';
    return '/dashboard';
  };

  return (
    <header className="sticky top-0 z-[100] w-full px-6 py-4 glass border-b border-white/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={getDashboardLink()} className="flex flex-col">
            <span className="text-xl font-black tracking-tighter leading-none">CAMPUS<span className="text-primary">CONNECT</span></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">{getRoleLabel()}</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          <div className="h-8 w-[1px] bg-white/10 mx-2 hidden sm:block" />

          <div className="flex items-center gap-2">
            {(isAdmin || isOrganizer || user.role === 'canteen') && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/notifications')}
                className="w-10 h-10 glass rounded-full flex items-center justify-center text-secondary hover:text-primary transition-colors relative"
              >
                <Bell size={20} />
                <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
              </motion.button>
            )}

            <div className="relative group">
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20"
              >
                <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="" />
              </motion.button>

              <div className="absolute right-0 mt-2 w-48 glass border border-white/10 rounded-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all translate-y-2 group-hover:translate-y-0 z-50 shadow-2xl">
                <div className="px-4 py-2 border-b border-white/5 mb-2">
                  <p className="text-xs font-black truncate">{user.name}</p>
                  <p className="text-[10px] text-secondary truncate">{user.email}</p>
                </div>
                <Link to="/profile" className="flex items-center gap-3 px-4 py-2 text-xs font-bold hover:bg-white/5 rounded-xl transition-colors">
                  <User size={16} /> Profile
                </Link>
                <Link to="/how-to-use" className="flex items-center gap-3 px-4 py-2 text-xs font-bold hover:bg-white/5 rounded-xl transition-colors">
                  <HelpCircle size={16} /> How to Use
                </Link>
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-colors mt-2"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
