import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Event, Registration } from '../types';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock, Bookmark, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Calendar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'all' | 'mine'>('all');

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        const q = query(collection(db, 'events'), orderBy('date', 'asc'));
        const snapshot = await getDocs(q);
        if (controller.signal.aborted) return;
        const allEvents = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Event));
        setEvents(allEvents);

        if (user) {
          const regQ = query(collection(db, 'registrations'), where('userId', '==', user.uid));
          const regSnapshot = await getDocs(regQ);
          if (controller.signal.aborted) return;
          setMyRegistrations(regSnapshot.docs.map(d => d.data() as Registration));
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Fetch calendar data error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [user]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const myEventIds = myRegistrations.map(r => r.eventId);
  
  const filteredEvents = view === 'all' 
    ? events 
    : events.filter(e => myEventIds.includes(e.id));

  const selectedDateEvents = filteredEvents.filter(event => 
    isSameDay(new Date(event.date), selectedDate)
  );

  const hasEvent = (date: Date) => events.some(event => isSameDay(new Date(event.date), date));
  const hasMyEvent = (date: Date) => events.some(event => 
    isSameDay(new Date(event.date), date) && myEventIds.includes(event.id)
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 pb-24 pt-8"
    >
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">Campus Calendar</h1>
          <p className="text-secondary text-sm font-medium">Your schedule, simplified</p>
        </div>
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-lg shadow-primary/10">
          <CalendarIcon size={24} />
        </div>
      </header>

      {/* View Toggle */}
      <div className="flex p-1.5 glass rounded-2xl mb-8 border border-white/5">
        <button
          onClick={() => setView('all')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-secondary'}`}
        >
          All Events
        </button>
        <button
          onClick={() => setView('mine')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'mine' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-secondary'}`}
        >
          My Schedule
        </button>
      </div>

      <div className="glass p-6 rounded-[2.5rem] mb-8 shadow-2xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full -mr-16 -mt-16" />
        
        <div className="flex justify-between items-center mb-8 relative z-10">
          <h2 className="text-xl font-black tracking-tight">{format(currentMonth, 'MMMM yyyy')}</h2>
          <div className="flex gap-2">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-secondary hover:text-primary transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-secondary hover:text-primary transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-6 relative z-10">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={`${day}-${i}`} className="text-center text-[10px] font-black text-secondary uppercase tracking-widest opacity-50">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 relative z-10">
          {days.map(day => {
            const isSelected = isSameDay(day, selectedDate);
            const isTodaysDate = isToday(day);
            const hasEv = hasEvent(day);
            const hasMyEv = hasMyEvent(day);

            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all group ${
                  isSelected ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-110 z-20' : 
                  isTodaysDate ? 'bg-accent/20 text-accent ring-1 ring-accent/30' : 'hover:bg-white/5'
                }`}
              >
                <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-foreground'}`}>{format(day, 'd')}</span>
                
                <div className="absolute bottom-1.5 flex gap-0.5">
                  {hasEv && !isSelected && (
                    <div className="w-1 h-1 rounded-full bg-secondary/30" />
                  )}
                  {hasMyEv && !isSelected && (
                    <div className="w-1 h-1 rounded-full bg-primary" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-primary rounded-full" />
            <h3 className="text-xl font-black tracking-tight">
              {isSameDay(selectedDate, new Date()) ? "Today's" : format(selectedDate, 'MMM d')} Events
            </h3>
          </div>
          <span className="text-[10px] font-black text-secondary uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
            {selectedDateEvents.length} Events
          </span>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map(event => {
                const isRegistered = myEventIds.includes(event.id);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Link to={`/event/${event.id}`} className="block">
                      <div className="glass p-6 rounded-[2.5rem] flex gap-5 border border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden">
                        {isRegistered && (
                          <div className="absolute top-0 right-0 p-3">
                            <div className="bg-primary/10 text-primary p-1.5 rounded-full">
                              <Bookmark size={12} fill="currentColor" />
                            </div>
                          </div>
                        )}
                        
                        <div className="w-20 h-20 rounded-3xl overflow-hidden flex-shrink-0 shadow-lg">
                          <img 
                            src={event.posterUrl || `https://picsum.photos/seed/${event.id}/200/200`} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                            alt="" 
                          />
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">{event.category}</span>
                            {isRegistered && (
                              <span className="text-[10px] font-black uppercase tracking-widest text-green-500 flex items-center gap-1">
                                <CheckCircle2 size={10} /> Registered
                              </span>
                            )}
                          </div>
                          <h4 className="font-black text-lg mb-3 line-clamp-1 group-hover:text-primary transition-colors">{event.title}</h4>
                          <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 text-[10px] text-secondary font-black uppercase tracking-widest">
                              <Clock size={14} className="text-primary" />
                              {format(new Date(event.date), 'HH:mm')}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-secondary font-black uppercase tracking-widest">
                              <MapPin size={14} className="text-primary" />
                              {event.venue}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })
            ) : (
              <div className="glass p-16 rounded-[3rem] text-center border-dashed border-2 border-secondary/10">
                <div className="w-16 h-16 bg-secondary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon size={32} className="text-secondary opacity-20" />
                </div>
                <p className="text-secondary text-sm font-bold">No events scheduled for this day</p>
                <button 
                  onClick={() => navigate('/explore')}
                  className="mt-4 text-primary text-xs font-black uppercase tracking-widest"
                >
                  Explore more events
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </motion.div>
  );
}
