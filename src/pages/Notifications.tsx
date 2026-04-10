import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Notification } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Calendar, Info, CheckCircle2, ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { deleteDoc } from 'firebase/firestore';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    try {
      const batch = notifications.map(n => deleteDoc(doc(db, 'notifications', n.id)));
      await Promise.all(batch);
    } catch (err) {
      console.error('Clear all error:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'event_update': return <Calendar className="text-primary" size={20} />;
      case 'registration_success': return <CheckCircle2 className="text-green-500" size={20} />;
      default: return <Info className="text-accent" size={20} />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 pb-24 pt-8 max-w-2xl mx-auto"
    >
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 glass rounded-full flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-black tracking-tighter">Notifications</h1>
        </div>
        {notifications.length > 0 && (
          <button 
            onClick={clearAll}
            className="w-10 h-10 glass rounded-full flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={20} />
          </button>
        )}
      </header>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="glass h-24 rounded-3xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {notifications.length > 0 ? (
              notifications.map(notif => (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={() => markAsRead(notif.id)}
                  className={`glass p-5 rounded-[2rem] flex gap-4 cursor-pointer transition-all border-l-4 ${notif.read ? 'border-transparent opacity-60' : 'border-primary shadow-lg shadow-primary/5'}`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-background/50 flex items-center justify-center flex-shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-sm leading-tight">{notif.title}</h3>
                      <span className="text-[10px] text-secondary font-medium">
                        {notif.createdAt?.toDate ? format(notif.createdAt.toDate(), 'HH:mm') : 'Just now'}
                      </span>
                    </div>
                    <p className="text-xs text-secondary leading-relaxed">{notif.message}</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell size={32} className="text-secondary opacity-20" />
                </div>
                <p className="text-secondary font-bold">No notifications yet</p>
                <p className="text-xs text-secondary/60">We'll let you know when something happens</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
