import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes: { id: 'light' | 'dark' | 'neon'; icon: any }[] = [
    { id: 'light', icon: Sun },
    { id: 'dark', icon: Moon },
    { id: 'neon', icon: Zap },
  ];

  return (
    <div className="flex p-1 glass rounded-full border border-white/10">
      {themes.map((t) => (
        <motion.button
          key={t.id}
          whileTap={{ scale: 0.9 }}
          onClick={() => setTheme(t.id)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            theme === t.id ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-secondary hover:text-foreground'
          }`}
        >
          <t.icon size={16} />
        </motion.button>
      ))}
    </div>
  );
}
