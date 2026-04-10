import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Event, Registration } from '../types';
import { motion } from 'motion/react';
import { User, Award, LogOut, Settings, ChevronRight, CheckCircle, Star, Bell, Shield, Users, Utensils, Calendar } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function Profile() {
  const { user, logout, isAdmin, isOrganizer, isCanteen } = useAuth();
  const navigate = useNavigate();
  const [attendedEvents, setAttendedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttended = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'registrations'), 
          where('userId', '==', user.uid),
          where('attended', '==', true)
        );
        const snapshot = await getDocs(q);
        const events = await Promise.all(snapshot.docs.map(async (d) => {
          const reg = d.data() as Registration;
          const eventDoc = await getDoc(doc(db, 'events', reg.eventId));
          return { id: eventDoc.id, ...eventDoc.data() } as Event;
        }));
        setAttendedEvents(events);
      } catch (err) {
        console.error('Fetch attended error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttended();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  const getRoleIcon = () => {
    if (isAdmin) return <Shield size={20} />;
    if (isOrganizer) return <Users size={20} />;
    if (isCanteen) return <Utensils size={20} />;
    return <Award size={20} />;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 pb-24 pt-8 max-w-2xl mx-auto"
    >
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black tracking-tighter">Profile</h1>
        <div className="flex gap-2">
          <Link to="/notifications" className="w-10 h-10 glass rounded-full flex items-center justify-center text-secondary">
            <Bell size={20} />
          </Link>
          <button className="w-10 h-10 glass rounded-full flex items-center justify-center text-secondary">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <div className="text-center mb-10">
        <div className="relative inline-block mb-4">
          <div className="w-28 h-28 rounded-[2.5rem] glass p-1">
            <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="w-full h-full object-cover rounded-[2.25rem]" alt="" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
            {getRoleIcon()}
          </div>
        </div>
        <h2 className="text-2xl font-black tracking-tight">{user.name}</h2>
        <p className="text-secondary text-sm font-medium">{user.email}</p>
        <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-[10px] font-black uppercase tracking-widest text-primary">
          <Star size={12} className="fill-primary" />
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)} • Level 5
        </div>
        {user.status === 'pending' && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center gap-3 text-yellow-500">
            <Shield size={16} />
            <p className="text-[10px] font-black uppercase tracking-widest">Account Pending Approval</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass p-5 rounded-3xl text-center">
          <p className="text-2xl font-black text-primary">{user.points || 0}</p>
          <p className="text-[10px] text-secondary uppercase font-bold tracking-widest">Campus Points</p>
        </div>
        <div className="glass p-5 rounded-3xl text-center">
          <p className="text-2xl font-black text-accent">{attendedEvents.length}</p>
          <p className="text-[10px] text-secondary uppercase font-bold tracking-widest">Events Attended</p>
        </div>
      </div>

      {user.role === 'student' && (
        <>
          <section className="mb-10">
            <h3 className="text-lg font-bold mb-4">Achievements</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {['Early Bird', 'Tech Guru', 'Social Bee', 'Volunteer'].map((badge, i) => (
                <div key={badge} className="flex-shrink-0 w-24 h-32 glass rounded-3xl flex flex-col items-center justify-center p-4">
                  <div className={`w-12 h-12 rounded-2xl mb-3 flex items-center justify-center ${i === 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-secondary/10 text-secondary'}`}>
                    <Award size={24} />
                  </div>
                  <p className="text-[10px] font-bold text-center leading-tight">{badge}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h3 className="text-lg font-bold mb-4">Attended Events</h3>
            <div className="space-y-3">
              {attendedEvents.length > 0 ? (
                attendedEvents.map(event => (
                  <div key={event.id} className="glass p-4 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                        <CheckCircle size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{event.title}</h4>
                        <p className="text-[10px] text-secondary">{event.category}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-secondary" />
                  </div>
                ))
              ) : (
                <div className="glass p-8 rounded-3xl text-center border-dashed border-2 border-secondary/10">
                  <p className="text-secondary text-xs">No attended events yet</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {(isOrganizer || isAdmin) && (
        <section className="mb-10">
          <h3 className="text-lg font-bold mb-4">Management</h3>
          <div className="space-y-3">
            <Link to="/dashboard" className="glass p-4 rounded-3xl flex items-center justify-between hover:bg-white/5 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Calendar size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Organiser Dashboard</h4>
                  <p className="text-[10px] text-secondary">Manage events and analytics</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-secondary" />
            </Link>
            {isAdmin && (
              <Link to="/admin" className="glass p-4 rounded-3xl flex items-center justify-between hover:bg-white/5 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Admin Control Panel</h4>
                    <p className="text-[10px] text-secondary">System-wide management</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-secondary" />
              </Link>
            )}
          </div>
        </section>
      )}

      {isCanteen && (
        <section className="mb-10">
          <h3 className="text-lg font-bold mb-4">Canteen Operations</h3>
          <div className="space-y-3">
            <Link to="/canteen" className="glass p-4 rounded-3xl flex items-center justify-between hover:bg-white/5 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <Utensils size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Canteen Portal</h4>
                  <p className="text-[10px] text-secondary">Verify coupons and track payments</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-secondary" />
            </Link>
          </div>
        </section>
      )}

      <button 
        onClick={handleLogout}
        className="w-full py-4 rounded-2xl font-bold text-red-500 glass flex items-center justify-center gap-3 hover:bg-red-500/5 transition-colors"
      >
        <LogOut size={20} />
        Logout Session
      </button>
    </motion.div>
  );
}
