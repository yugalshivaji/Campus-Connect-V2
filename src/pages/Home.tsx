import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Event, Registration } from '../types';
import EventCard from '../components/EventCard';
import { motion } from 'motion/react';
import { Search, Filter, TrendingUp, Sparkles, Bell, Calendar, Award, Users, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { getEventRecommendations } from '../services/aiService';
import { format } from 'date-fns';
import axios from 'axios';

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [recommendations, setRecommendations] = useState<Event[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<(Registration & { event?: Event })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const { user } = useAuth();

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        const q = query(collection(db, 'events'), limit(20));
        const snapshot = await getDocs(q);
        const eventData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
        setEvents(eventData);
        
        // Fetch My Registrations
        if (user) {
          const regQ = query(collection(db, 'registrations'), where('userId', '==', user.uid));
          const regSnapshot = await getDocs(regQ);
          const regData = await Promise.all(regSnapshot.docs.map(async (d) => {
            const reg = { id: d.id, ...d.data() } as Registration;
            const eventDoc = await getDoc(doc(db, 'events', reg.eventId));
            return { ...reg, event: eventDoc.exists() ? { id: eventDoc.id, ...eventDoc.data() } as Event : undefined };
          }));
          setMyRegistrations(regData);
        }

        // Fetch AI Recommendations
        if (user && eventData.length > 0) {
          try {
            const recIds = await getEventRecommendations(user.interests, eventData);
            const recs = eventData.filter(e => recIds.includes(e.id));
            setRecommendations(recs);
          } catch (err) {
            console.error('AI Rec error:', err);
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Fetch data error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [user]);

  const filteredEvents = events.filter(e => 
    (category === 'All' || e.category === category) &&
    (e.title.toLowerCase().includes(search.toLowerCase()) || 
     e.description.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 pb-24 pt-8 max-w-7xl mx-auto"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">
            Explore <span className="text-primary">Campus</span>
          </h1>
          <p className="text-secondary text-sm font-medium">Find events, join societies, and build your legacy</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass px-6 py-3 rounded-2xl flex items-center gap-3 border border-white/5">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
              <Award size={18} />
            </div>
            <div>
              <p className="text-[10px] text-secondary font-black uppercase tracking-widest leading-none mb-1">Your Points</p>
              <p className="text-sm font-black leading-none">{user?.points || 0}</p>
            </div>
          </div>
        </div>
      </header>

      {/* My Registered Events / Dashboard Stats */}
      {myRegistrations.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Calendar size={20} />
              </div>
              <h2 className="text-2xl font-black tracking-tight">My Dashboard</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass p-6 rounded-[2rem] border border-white/5">
              <p className="text-3xl font-black mb-1 text-primary">{myRegistrations.length}</p>
              <p className="text-[10px] text-secondary font-black uppercase tracking-widest leading-none">Registered Events</p>
            </div>
            <div className="glass p-6 rounded-[2rem] border border-white/5">
              <p className="text-3xl font-black mb-1 text-green-500">{myRegistrations.filter(r => r.attended).length}</p>
              <p className="text-[10px] text-secondary font-black uppercase tracking-widest leading-none">Events Attended</p>
            </div>
            <div className="glass p-6 rounded-[2rem] border border-white/5">
              <p className="text-3xl font-black mb-1 text-accent">{myRegistrations.filter(r => r.couponRedeemed).length}</p>
              <p className="text-[10px] text-secondary font-black uppercase tracking-widest leading-none">Coupons Redeemed</p>
            </div>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
            {myRegistrations.map(reg => (
              <motion.div
                key={reg.id}
                whileHover={{ y: -5 }}
                className="flex-shrink-0 w-80 glass p-6 rounded-[2.5rem] border border-white/5"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
                    <img src={reg.event?.posterUrl || `https://picsum.photos/seed/${reg.event?.id}/200/200`} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm mb-1 truncate w-40">{reg.event?.title}</h4>
                    <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">
                      {reg.event?.date ? format(new Date(reg.event.date), 'MMM d, h:mm a') : 'TBA'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-secondary/5 rounded-xl border border-white/5">
                    <span className="text-[8px] text-secondary font-black uppercase tracking-widest">Attendance</span>
                    <span className={`text-[10px] font-black uppercase ${reg.attended ? 'text-green-500' : 'text-primary'}`}>
                      {reg.attended ? 'Verified' : 'Not Scanned'}
                    </span>
                  </div>
                  
                  {reg.event?.hasFoodCoupon && (
                    <div className="flex items-center justify-between p-3 bg-secondary/5 rounded-xl border border-white/5">
                      <span className="text-[8px] text-secondary font-black uppercase tracking-widest">Food Coupon</span>
                      <span className={`text-[10px] font-black uppercase ${reg.couponRedeemed ? 'text-green-500' : reg.couponActive ? 'text-accent' : 'text-secondary'}`}>
                        {reg.couponRedeemed ? 'Redeemed' : reg.couponActive ? 'Available' : 'Pending Payment'}
                      </span>
                    </div>
                  )}

                <Link to={`/events/${reg.event?.slug || reg.eventId}`} className="block">
                  <button className="w-full py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                    <QrCode size={14} />
                    Show My QR
                  </button>
                </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-12">
        <div className="flex-1 glass rounded-2xl px-6 flex items-center gap-4 border border-white/5 focus-within:border-primary/50 transition-all">
          <Search size={20} className="text-secondary" />
          <input
            type="text"
            placeholder="Search events, societies, or categories..."
            className="bg-transparent border-none outline-none w-full h-14 text-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {['All', 'Tech', 'Cultural', 'Sports', 'Workshop'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-8 py-4 rounded-2xl whitespace-nowrap text-xs font-black uppercase tracking-widest transition-all ${
                category === cat 
                  ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                  : 'glass text-secondary border border-white/5 hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                <Sparkles size={20} />
              </div>
              <h2 className="text-2xl font-black tracking-tight">Picked for You</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommendations.map(event => (
              <motion.div
                key={event.id}
                whileHover={{ y: -10 }}
                className="group"
              >
                <Link to={`/events/${event.slug || event.id}`}>
                  <EventCard event={event} />
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Trending Events */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <TrendingUp size={20} />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Trending Now</h2>
          </div>
          <Link to="/explore" className="text-xs font-black text-primary uppercase tracking-widest hover:underline">View All</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.length > 0 ? (
            filteredEvents.map(event => (
              <motion.div
                key={event.id}
                whileHover={{ y: -10 }}
              >
                <Link to={`/events/${event.slug || event.id}`}>
                  <EventCard event={event} />
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full glass p-20 rounded-[3rem] text-center border-dashed border-2 border-secondary/10">
              <div className="w-20 h-20 bg-secondary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={40} className="text-secondary opacity-20" />
              </div>
              <p className="text-secondary font-bold">No events found matching your criteria</p>
            </div>
          )}
        </div>
      </section>

      {/* Society Spotlight */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500">
              <Users size={20} />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Society Spotlight</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass p-6 rounded-[2rem] border border-white/5 text-center group hover:border-primary/50 transition-all">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl mx-auto mb-4 overflow-hidden shadow-lg">
                <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=soc${i}`} alt="" />
              </div>
              <h4 className="font-black text-sm mb-1">Society Name</h4>
              <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-4">524 Followers</p>
              <button className="w-full py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-all">
                Follow
              </button>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
