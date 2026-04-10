import { motion } from 'motion/react';
import { Home, Search, Calendar, User, Plus, LayoutDashboard, Utensils, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const location = useLocation();
  const { user, isOrganizer, isAdmin, isCanteen } = useAuth();

  if (!user) return null;

  const studentItems: { icon: any; label: string; path: string; isFab?: boolean }[] = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: Search, label: 'Explore', path: '/explore' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: Bell, label: 'Alerts', path: '/notifications' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const organizerItems: { icon: any; label: string; path: string; isFab?: boolean }[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Plus, label: 'Create', path: '/create', isFab: true },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const canteenItems: { icon: any; label: string; path: string; isFab?: boolean }[] = [
    { icon: Utensils, label: 'Canteen', path: '/canteen' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const navItems = isAdmin || isOrganizer 
    ? organizerItems 
    : isCanteen 
      ? canteenItems 
      : studentItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 glass border-t border-white/10 flex items-center justify-around px-4 z-[100] rounded-t-3xl pb-[safe-area-inset-bottom]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        
        if (item.isFab) {
          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="bg-primary p-4 rounded-full -mt-12 shadow-lg shadow-primary/50 text-white"
              >
                <item.icon size={28} />
              </motion.div>
            </Link>
          );
        }

        return (
          <Link key={item.path} to={item.path} className="flex flex-col items-center gap-1">
            <motion.div
              animate={{
                scale: isActive ? 1.2 : 1,
                color: isActive ? 'var(--primary)' : 'var(--secondary)',
              }}
              className="relative"
            >
              <item.icon size={24} />
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                />
              )}
            </motion.div>
            <span className={cn(
              "text-[10px] font-medium",
              isActive ? "text-primary" : "text-secondary"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
