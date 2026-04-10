import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Event } from '../types';
import EventCard from '../components/EventCard';
import { Search, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['All', 'Tech', 'Cultural', 'Sports', 'Workshop', 'Academic'];
const STATUSES = ['All', 'upcoming', 'ongoing', 'completed'];

export default function Explore() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        if (controller.signal.aborted) return;
        setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event)));
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Fetch events error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
    return () => controller.abort();
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || event.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="p-6 pb-24 pt-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tighter mb-6">Explore Events</h1>
        
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary w-5 h-5" />
            <input
              type="text"
              placeholder="Search events, societies..."
              className="w-full glass py-4 pl-12 pr-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${showFilters ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'glass text-secondary'}`}
          >
            <SlidersHorizontal size={24} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="glass p-6 rounded-[2rem] border border-white/5 space-y-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-4">Event Status</p>
                <div className="flex gap-2 flex-wrap">
                  {STATUSES.map(status => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        selectedStatus === status
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'bg-white/5 text-secondary hover:text-primary'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'glass text-secondary hover:text-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass aspect-[4/3] rounded-[2.5rem] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <EventCard event={event} onClick={() => navigate(`/events/${event.slug || event.id}`)} />
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredEvents.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-secondary opacity-20" />
              </div>
              <p className="text-secondary font-bold">No events found</p>
              <p className="text-xs text-secondary/60">Try adjusting your filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
