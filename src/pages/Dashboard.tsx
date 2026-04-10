import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Event, Registration, CanteenPayment } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, CheckCircle, Clock, Users, QrCode, Award, Settings, Plus, ArrowRight, Utensils, HelpCircle, IndianRupee, CreditCard, AlertCircle, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const { user, isAdmin, isOrganizer } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<(Registration & { event?: Event })[]>([]);
  const [organizedEvents, setOrganizedEvents] = useState<Event[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<CanteenPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch Student Registrations
    const regQ = query(collection(db, 'registrations'), where('userId', '==', user.uid));
    const unsubscribeReg = onSnapshot(regQ, async (snapshot) => {
      const regData = await Promise.all(snapshot.docs.map(async (d) => {
        const reg = { id: d.id, ...d.data() } as Registration;
        const eventDoc = await getDoc(doc(db, 'events', reg.eventId));
        return { ...reg, event: eventDoc.exists() ? { id: eventDoc.id, ...eventDoc.data() } as Event : undefined };
      }));
      setRegistrations(regData);
    });

    // Fetch Organized Events & Payment Requests
    let unsubscribeEvents = () => {};
    let unsubscribePayments = () => {};

    if (isOrganizer || isAdmin) {
      const eventQ = query(collection(db, 'events'), where('organizerId', '==', user.uid));
      unsubscribeEvents = onSnapshot(eventQ, (snapshot) => {
        setOrganizedEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Event)));
      });

      const payQ = query(collection(db, 'payments'), where('organizerId', '==', user.uid), orderBy('requestedAt', 'desc'));
      unsubscribePayments = onSnapshot(payQ, (snapshot) => {
        setPaymentRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CanteenPayment)));
      });
    }

    setLoading(false);

    return () => {
      unsubscribeReg();
      unsubscribeEvents();
      unsubscribePayments();
    };
  }, [user, isOrganizer, isAdmin]);

  const handleApprovePayment = async (payment: CanteenPayment) => {
    try {
      await updateDoc(doc(db, 'payments', payment.id), {
        status: 'approved'
      });
      confetti({ particleCount: 50, spread: 60 });
    } catch (err) {
      console.error('Approve payment error:', err);
    }
  };

  const handleMarkPaid = async (payment: CanteenPayment) => {
    try {
      await updateDoc(doc(db, 'payments', payment.id), {
        status: 'paid',
        paidAt: new Date().toISOString()
      });
      alert('Payment marked as paid!');
    } catch (err) {
      console.error('Mark paid error:', err);
    }
  };

  // Analytics Data
  const analyticsData = [
    { name: 'Tech', value: organizedEvents.filter(e => e.category === 'Tech').length },
    { name: 'Cultural', value: organizedEvents.filter(e => e.category === 'Cultural').length },
    { name: 'Sports', value: organizedEvents.filter(e => e.category === 'Sports').length },
    { name: 'Workshop', value: organizedEvents.filter(e => e.category === 'Workshop').length },
  ].filter(d => d.value > 0);

  const COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b'];

  const totalRevenue = organizedEvents.reduce((acc, e) => acc + (e.fee || 0) * (e.registeredCount || 0), 0);
  const totalCouponLiability = organizedEvents.reduce((acc, e) => acc + (e.couponCost || 50) * (e.registeredCount || 0), 0);
  const pendingPayments = paymentRequests.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0);

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
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tighter mb-2">
            Organiser Hub
          </h1>
          <p className="text-secondary text-sm font-medium">Manage your events and track performance</p>
        </div>
        <div className="flex gap-4">
          <Link to="/create">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 flex items-center gap-2 h-12"
            >
              <Plus size={18} />
              Create Event
            </motion.button>
          </Link>
        </div>
      </header>

      {/* Analytics Overview */}
      <section className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Events', val: organizedEvents.length, icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Total Registrations', val: organizedEvents.reduce((acc, e) => acc + e.registeredCount, 0), icon: Users, color: 'text-accent', bg: 'bg-accent/10' },
            { label: 'Total Revenue', val: `₹${totalRevenue}`, icon: IndianRupee, color: 'text-green-500', bg: 'bg-green-500/10' },
            { label: 'Pending Payouts', val: `₹${pendingPayments}`, icon: CreditCard, color: 'text-red-500', bg: 'bg-red-500/10' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-6 rounded-[2rem] border border-white/5"
            >
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                <stat.icon size={20} />
              </div>
              <p className="text-3xl font-black mb-1">{stat.val}</p>
              <p className="text-[10px] text-secondary font-black uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass p-8 rounded-[2.5rem] border border-white/5">
            <h3 className="text-sm font-black uppercase tracking-widest text-secondary mb-8">Registration Trends</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={organizedEvents.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="title" hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '16px', border: 'none' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="registeredCount" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border border-white/5">
            <h3 className="text-sm font-black uppercase tracking-widest text-secondary mb-8">Category Split</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analyticsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '16px', border: 'none' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Requests */}
      {(isOrganizer || isAdmin) && paymentRequests.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-3">
              <CreditCard className="text-primary" />
              Canteen Payout Requests
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paymentRequests.map((payment) => (
              <motion.div
                key={payment.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-sm mb-1">{payment.eventTitle}</h4>
                    <p className="text-[10px] text-secondary font-black uppercase tracking-widest">
                      {payment.studentCount} Coupons • ₹{payment.amount}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                    payment.status === 'paid' ? 'bg-green-500/10 text-green-500' :
                    payment.status === 'approved' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {payment.status}
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  {payment.status === 'pending' && (
                    <button 
                      onClick={() => handleApprovePayment(payment)}
                      className="flex-1 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                    >
                      Approve
                    </button>
                  )}
                  {payment.status === 'approved' && (
                    <button 
                      onClick={() => handleMarkPaid(payment)}
                      className="flex-1 py-3 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20"
                    >
                      Mark as Paid
                    </button>
                  )}
                  {payment.status === 'paid' && (
                    <div className="flex-1 py-3 bg-green-500/10 text-green-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-center">
                      Settled on {format(new Date(payment.paidAt || ''), 'dd MMM')}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/create" className="block group">
            <div className="glass p-8 rounded-[2.5rem] border border-primary/20 flex items-center justify-between hover:bg-primary/5 transition-all h-full">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Plus size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-black mb-1">New Event</h4>
                  <p className="text-xs text-secondary font-medium">Launch a new campus event</p>
                </div>
              </div>
              <ArrowRight size={24} className="text-secondary group-hover:text-primary group-hover:translate-x-2 transition-all" />
            </div>
          </Link>
          <Link to="/canteen" className="block group">
            <div className="glass p-8 rounded-[2.5rem] border border-accent/20 flex items-center justify-between hover:bg-accent/5 transition-all h-full">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                  <Utensils size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-black mb-1">Canteen Portal</h4>
                  <p className="text-xs text-secondary font-medium">Verify food coupons and track redemptions</p>
                </div>
              </div>
              <ArrowRight size={24} className="text-secondary group-hover:text-accent group-hover:translate-x-2 transition-all" />
            </div>
          </Link>
          <div 
            onClick={() => navigate('/manage/scanner')} 
            className="block group cursor-pointer"
          >
            <div className="glass p-8 rounded-[2.5rem] border border-green-500/20 flex items-center justify-between hover:bg-green-500/5 transition-all h-full">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
                  <QrCode size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-black mb-1">QR Scanner</h4>
                  <p className="text-xs text-secondary font-medium">Scan attendance and coupons</p>
                </div>
              </div>
              <ArrowRight size={24} className="text-secondary group-hover:text-green-500 group-hover:translate-x-2 transition-all" />
            </div>
          </div>
        </div>
      </section>

      {/* Active Events List */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black tracking-tight">Active Events</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 glass rounded-xl text-[10px] font-black uppercase tracking-widest text-primary">Live</button>
            <button className="px-4 py-2 glass rounded-xl text-[10px] font-black uppercase tracking-widest text-secondary">Past</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {organizedEvents.map(event => (
            <motion.div
              key={event.id}
              whileHover={{ y: -5 }}
              className="glass p-6 rounded-[2.5rem] border border-white/5 flex items-center gap-6 group"
            >
              <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden bg-secondary/5 shadow-xl">
                <img src={event.posterUrl || `https://picsum.photos/seed/${event.id}/200/200`} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest rounded-md">
                    {event.category}
                  </span>
                  <span className="text-[10px] text-secondary font-bold">
                    {format(new Date(event.date), 'MMM d, yyyy')}
                  </span>
                </div>
                <h4 className="text-lg font-black mb-4 line-clamp-1">{event.title}</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-secondary font-black uppercase tracking-widest">Registrations</span>
                      <span className="text-sm font-black">{event.registeredCount}</span>
                    </div>
                  </div>
                  <Link to={`/manage/${event.id}`}>
                    <button className="w-10 h-10 glass rounded-xl flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all">
                      <Settings size={20} />
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
