import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, onSnapshot, orderBy, limit, setDoc } from 'firebase/firestore';
import { Registration, Event, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, Utensils, CheckCircle, XCircle, Clock, Search, Filter, ArrowRight, User as UserIcon, Calendar, Users, Settings, ChevronRight, ArrowLeft, Loader2, CheckCircle2, Bell } from 'lucide-react';
import QRScanner from '../components/QRScanner';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';

export default function CanteenPortal() {
  const { user } = useAuth();
  const [showScanner, setShowScanner] = useState(false);
  const [activeEventId, setActiveEventId] = useState<string>('');
  const [activeEvents, setActiveEvents] = useState<Event[]>([]);
  const [redemptions, setRedemptions] = useState<(Registration & { event?: Event, user?: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'processing'>('idle');
  const [message, setMessage] = useState('');
  const [scannedData, setScannedData] = useState<any>(null);

  const [earnings, setEarnings] = useState(0);
  const [eventStats, setEventStats] = useState<{[key: string]: {title: string, count: number, cost: number}}>({});
  const [showSettings, setShowSettings] = useState(false);
  const [upiId, setUpiId] = useState(user?.upiId || '');
  const [razorpayId, setRazorpayId] = useState(user?.razorpayId || '');

  useEffect(() => {
    if (!user) return;
    
    // Fetch active events with food coupons
    const eventsQ = query(collection(db, 'events'), where('hasFoodCoupon', '==', true), where('status', 'in', ['upcoming', 'ongoing']));
    const unsubscribeEvents = onSnapshot(eventsQ, (snapshot) => {
      const events = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Event));
      setActiveEvents(events);
      if (events.length > 0 && !activeEventId) {
        setActiveEventId(events[0].id);
      }
    });

    const q = query(
      collection(db, 'registrations'),
      where('couponRedeemed', '==', true),
      orderBy('couponRedeemedAt', 'desc')
    );

    const unsubscribeRedemptions = onSnapshot(q, async (snapshot) => {
      try {
        const data = await Promise.all(snapshot.docs.map(async (d) => {
          const reg = { id: d.id, ...d.data() } as Registration;
          const eventDoc = await getDoc(doc(db, 'events', reg.eventId));
          const userDoc = await getDoc(doc(db, 'users', reg.userId));
          return {
            ...reg,
            event: eventDoc.exists() ? { id: eventDoc.id, ...eventDoc.data() } as Event : undefined,
            user: userDoc.exists() ? { uid: userDoc.id, ...userDoc.data() } as User : undefined
          };
        }));
        
        setRedemptions(data);
        
        // Calculate Stats
        let totalEarnings = 0;
        const stats: {[key: string]: {title: string, count: number, cost: number}} = {};
        
        data.forEach(r => {
          if (r.event) {
            const cost = r.event.couponCost || 50;
            totalEarnings += cost;
            if (!stats[r.eventId]) {
              stats[r.eventId] = { title: r.event.title, count: 0, cost };
            }
            stats[r.eventId].count++;
          }
        });
        
        setEarnings(totalEarnings);
        setEventStats(stats);
        setLoading(false);
      } catch (err) {
        console.error('Snapshot error:', err);
      }
    });

    return () => {
      unsubscribeEvents();
      unsubscribeRedemptions();
    };
  }, [user]);

  const handleUpdateSettings = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        upiId,
        razorpayId
      });
      setShowSettings(false);
      confetti({ particleCount: 50, spread: 60 });
    } catch (err) {
      console.error('Update settings error:', err);
    }
  };

  const handleRequestPayment = async (eventId: string, stats: any) => {
    if (!user) return;
    try {
      const paymentId = `PAY_${eventId}_${user.uid}`;
      await setDoc(doc(db, 'payments', paymentId), {
        eventId,
        eventTitle: stats.title,
        organizerId: activeEvents.find(e => e.id === eventId)?.organizerId || '',
        vendorId: user.uid,
        amount: stats.count * stats.cost,
        studentCount: stats.count,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        timestamp: new Date().toISOString()
      });
      alert('Payment request sent to organiser!');
    } catch (err) {
      console.error('Payment request error:', err);
    }
  };

  const handleScan = async (decodedText: string) => {
    setStatus('processing');
    setShowScanner(false);

    try {
      // Decoded text: coupon:eventId:userId:token
      const parts = decodedText.split(':');
      if (parts.length !== 4 || parts[0] !== 'coupon') {
        setStatus('error');
        setMessage('Invalid QR Format. Please scan a Food Coupon QR.');
        return;
      }

      const [type, eventId, userId, token] = parts;
      
      if (!activeEventId) {
        setStatus('error');
        setMessage('Please select an active event first.');
        return;
      }

      if (eventId !== activeEventId) {
        setStatus('error');
        setMessage('This coupon is for a different event!');
        return;
      }

      // Find registration for this user and this event
      const regId = `${userId}_${eventId}`;
      const regDoc = await getDoc(doc(db, 'registrations', regId));
      
      if (!regDoc.exists()) {
        setStatus('error');
        setMessage('Student is not registered for this event.');
        return;
      }

      const reg = { id: regDoc.id, ...regDoc.data() } as Registration;

      if (reg.validationToken !== token) {
        setStatus('error');
        setMessage('Security Validation Failed!');
        return;
      }

      // Validation
      if (!reg.attended) {
        setStatus('error');
        setMessage('Student has not checked into the event yet.');
        return;
      }

      if (reg.couponRedeemed) {
        setStatus('error');
        setMessage('Coupon already redeemed!');
        return;
      }

      const eventDoc = await getDoc(doc(db, 'events', reg.eventId));
      const event = { id: eventDoc.id, ...eventDoc.data() } as Event;
      const userDoc = await getDoc(doc(db, 'users', reg.userId));
      const userData = userDoc.exists() ? userDoc.data() as User : null;
      const orgDoc = await getDoc(doc(db, 'users', event.organizerId));
      const orgData = orgDoc.exists() ? orgDoc.data() as User : null;

      setScannedData({ reg, event, user: userData, organizer: orgData });
      setStatus('success');
      setMessage('Coupon Valid!');
      
      // Auto-redeem after showing success
      setTimeout(async () => {
        await updateDoc(doc(db, 'registrations', reg.id), {
          couponRedeemed: true,
          couponRedeemedAt: new Date().toISOString()
        });
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#f59e0b']
        });
      }, 1500);

    } catch (err) {
      console.error('Scan error:', err);
      setStatus('error');
      setMessage('Failed to process QR code');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 pb-24 pt-8 max-w-7xl mx-auto"
    >
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter mb-2">
            Canteen <span className="text-primary">Portal</span>
          </h1>
          <p className="text-secondary text-sm font-medium">Redeem food coupons and track student meals</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSettings(true)}
            className="glass text-secondary px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 border border-white/5"
          >
            <Settings size={20} />
            Settings
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowScanner(true)}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 flex items-center gap-3"
          >
            <QrCode size={20} />
            Scan Coupon
          </motion.button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Active Event Selector */}
        <div className="lg:col-span-3 glass p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Calendar size={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-secondary">Active Event:</span>
          </div>
          <select 
            value={activeEventId}
            onChange={(e) => setActiveEventId(e.target.value)}
            className="flex-1 bg-background/50 border border-secondary/20 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
          >
            {activeEvents.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
            {activeEvents.length === 0 && <option value="">No active events with coupons</option>}
          </select>
        </div>

        {/* Stats */}
        <div className="glass p-8 rounded-[2.5rem] border border-white/5">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
            <Utensils size={24} />
          </div>
          <p className="text-4xl font-black mb-1">₹{earnings}</p>
          <p className="text-[10px] text-secondary font-black uppercase tracking-widest">Total Earnings</p>
        </div>

        <div className="glass p-8 rounded-[2.5rem] border border-white/5">
          <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mb-6">
            <Users size={24} />
          </div>
          <p className="text-4xl font-black mb-1">{redemptions.length}</p>
          <p className="text-[10px] text-secondary font-black uppercase tracking-widest">Coupons Redeemed</p>
        </div>

        {/* Multi-Event Handling Stats */}
        <div className="glass p-8 rounded-[2.5rem] border border-white/5">
          <h3 className="text-[10px] text-secondary font-black uppercase tracking-widest mb-4">Payout Requests</h3>
          <div className="space-y-3">
            {Object.entries(eventStats).map(([id, stat], i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs font-bold truncate w-32">{stat.title}</span>
                  <span className="text-[8px] text-secondary font-black uppercase tracking-widest">₹{stat.count * stat.cost}</span>
                </div>
                <button 
                  onClick={() => handleRequestPayment(id, stat)}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                >
                  Request
                </button>
              </div>
            ))}
            {Object.keys(eventStats).length === 0 && (
              <p className="text-[10px] text-secondary italic">No redemptions yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Status Display */}
        <div className="lg:col-span-2 glass p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-center relative overflow-hidden">
          <AnimatePresence mode="wait">
            {status === 'idle' ? (
              <motion.div 
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-secondary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode size={40} className="text-secondary opacity-20" />
                </div>
                <p className="text-secondary font-bold">Ready to scan coupons</p>
              </motion.div>
            ) : status === 'processing' ? (
              <motion.div 
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="text-sm font-black uppercase tracking-widest text-primary">Validating...</p>
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full"
              >
                <div className={`p-6 rounded-3xl border ${status === 'success' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} flex items-center gap-6`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                    {status === 'success' ? <CheckCircle size={48} /> : <XCircle size={48} />}
                  </div>
                  <div>
                    <h4 className={`text-xl font-black mb-1 ${status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                      {status === 'success' ? 'Valid Coupon' : 'Invalid Coupon'}
                    </h4>
                    <p className="text-sm font-medium text-secondary">{message}</p>
                  </div>
                </div>

                {status === 'success' && scannedData && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6 grid grid-cols-2 gap-4"
                  >
                    <div className="glass p-4 rounded-2xl border border-white/5">
                      <p className="text-[8px] text-secondary font-black uppercase tracking-widest mb-1">Student</p>
                      <p className="text-sm font-black">{scannedData.user?.name || 'Unknown'}</p>
                    </div>
                    <div className="glass p-4 rounded-2xl border border-white/5">
                      <p className="text-[8px] text-secondary font-black uppercase tracking-widest mb-1">Event</p>
                      <p className="text-sm font-black truncate">{scannedData.event?.title || 'Unknown'}</p>
                    </div>
                    <div className="glass p-4 rounded-2xl border border-white/5 col-span-2">
                      <p className="text-[8px] text-secondary font-black uppercase tracking-widest mb-1">Organiser</p>
                      <p className="text-sm font-black">{scannedData.organizer?.name || 'Unknown'}</p>
                    </div>
                  </motion.div>
                )}

                <button 
                  onClick={() => setStatus('idle')}
                  className="mt-6 w-full py-3 rounded-2xl glass text-[10px] font-black uppercase tracking-widest text-secondary hover:text-foreground transition-colors"
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Recent Logs */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black tracking-tight">Redemption Logs</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 glass rounded-xl text-[10px] font-black uppercase tracking-widest text-primary">Today</button>
            <button className="px-4 py-2 glass rounded-xl text-[10px] font-black uppercase tracking-widest text-secondary">History</button>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="p-20 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : redemptions.length > 0 ? (
            redemptions.map(log => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass p-6 rounded-[2.5rem] border border-white/5 flex items-center justify-between group"
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/5 overflow-hidden shadow-lg">
                    <img src={log.user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${log.user?.name}`} alt="" />
                  </div>
                  <div>
                    <h4 className="font-black text-lg mb-1">{log.user?.name}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-secondary font-bold flex items-center gap-1">
                        <Calendar size={12} />
                        {log.event?.title}
                      </span>
                      <span className="text-[10px] text-secondary font-bold flex items-center gap-1">
                        <Clock size={12} />
                        {log.scannedAt ? format(new Date(log.scannedAt), 'hh:mm a') : 'Just now'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2 bg-green-500/10 text-green-500 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  Redeemed
                </div>
              </motion.div>
            ))
          ) : (
            <div className="glass p-20 rounded-[3rem] text-center border-dashed border-2 border-secondary/10">
              <p className="text-secondary font-bold">No redemptions recorded yet</p>
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {showScanner && (
          <QRScanner 
            onScan={handleScan} 
            onClose={() => setShowScanner(false)} 
            title="Scan Food Coupon"
          />
        )}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md glass p-8 rounded-[2.5rem] shadow-2xl border border-white/10"
            >
              <h2 className="text-2xl font-black mb-6">Canteen Settings</h2>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-[10px] text-secondary font-black uppercase tracking-widest mb-2 block">UPI ID (for direct payout)</label>
                  <input 
                    type="text" 
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. canteen@upi"
                    className="w-full bg-background/50 border border-secondary/20 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-secondary font-black uppercase tracking-widest mb-2 block">Razorpay ID (optional)</label>
                  <input 
                    type="text" 
                    value={razorpayId}
                    onChange={(e) => setRazorpayId(e.target.value)}
                    placeholder="e.g. rzp_test_..."
                    className="w-full bg-background/50 border border-secondary/20 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-4 rounded-2xl glass text-xs font-black uppercase tracking-widest text-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateSettings}
                  className="flex-1 py-4 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
