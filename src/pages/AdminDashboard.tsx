import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, doc, updateDoc, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { User, Event, CanteenPayment } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Calendar, CreditCard, Shield, CheckCircle, XCircle, 
  Search, Filter, ArrowRight, TrendingUp, Activity, AlertCircle 
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

import axios from 'axios';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [payments, setPayments] = useState<CanteenPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'events' | 'payments'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as User)));
    });

    const unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Event)));
    });

    const unsubPayments = onSnapshot(collection(db, 'payments'), (snapshot) => {
      setPayments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CanteenPayment)));
    });

    setLoading(false);

    return () => {
      unsubUsers();
      unsubEvents();
      unsubPayments();
    };
  }, [user]);

  const handleUpdateUserStatus = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'users', userId), { status });
    } catch (err) {
      console.error('Update user status error:', err);
    }
  };

  const handleSyncSheets = async () => {
    setSyncing(true);
    try {
      const response = await axios.post('/api/sheets/sync', { action: 'setup' });
      if (response.data.success) {
        alert('Google Sheets synchronized and initialized successfully!');
      } else {
        throw new Error(response.data.error || 'Sync failed');
      }
    } catch (err: any) {
      console.error('Sync error:', err);
      alert('Failed to sync with Google Sheets: ' + (err.response?.data?.error || err.message));
    } finally {
      setSyncing(false);
    }
  };

  const stats = [
    { label: 'Total Users', val: users.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Events', val: events.length, icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Active Payments', val: payments.filter(p => p.status === 'pending').length, icon: CreditCard, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'System Health', val: '98%', icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  const COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

  const categoryData = [
    { name: 'Tech', value: events.filter(e => e.category === 'Tech').length },
    { name: 'Cultural', value: events.filter(e => e.category === 'Cultural').length },
    { name: 'Sports', value: events.filter(e => e.category === 'Sports').length },
    { name: 'Workshop', value: events.filter(e => e.category === 'Workshop').length },
  ].filter(d => d.value > 0);

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
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Shield size={24} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter">Admin Control Panel</h1>
          </div>
          <p className="text-secondary text-sm font-medium">System-wide management and analytics</p>
        </div>
        <button
          onClick={handleSyncSheets}
          disabled={syncing}
          className="glass px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary border border-primary/20 hover:bg-primary/10 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {syncing ? (
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          ) : (
            <Activity size={16} />
          )}
          {syncing ? 'Syncing...' : 'Sync with Sheets'}
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar">
        {['overview', 'users', 'events', 'payments'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab 
                ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                : 'glass text-secondary border border-white/5 hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="glass p-6 rounded-[2rem] border border-white/5">
                  <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                    <stat.icon size={20} />
                  </div>
                  <p className="text-3xl font-black mb-1">{stat.val}</p>
                  <p className="text-[10px] text-secondary font-black uppercase tracking-widest">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass p-8 rounded-[2.5rem] border border-white/5">
                <h3 className="text-sm font-black uppercase tracking-widest text-secondary mb-8">User Growth</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={users.slice(-10).map((u, i) => ({ name: i, value: i + 1 }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '16px', border: 'none' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass p-8 rounded-[2.5rem] border border-white/5">
                <h3 className="text-sm font-black uppercase tracking-widest text-secondary mb-8">Event Categories</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
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
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex gap-4">
              <div className="flex-1 glass rounded-2xl px-6 flex items-center gap-4 border border-white/5">
                <Search size={20} className="text-secondary" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  className="bg-transparent border-none outline-none w-full h-14 text-sm font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-secondary">User</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-secondary">Role</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-secondary">Status</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-secondary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((u) => (
                      <tr key={u.uid} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-secondary/10 overflow-hidden">
                              <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`} alt="" />
                            </div>
                            <div>
                              <p className="font-bold text-sm">{u.name}</p>
                              <p className="text-[10px] text-secondary">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            u.role === 'admin' ? 'bg-red-500/10 text-red-500' :
                            u.role === 'organizer' ? 'bg-purple-500/10 text-purple-500' :
                            u.role === 'canteen' ? 'bg-orange-500/10 text-orange-500' :
                            'bg-blue-500/10 text-blue-500'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-6">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            u.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                            u.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                            'bg-yellow-500/10 text-yellow-500'
                          }`}>
                            {u.status || 'pending'}
                          </span>
                        </td>
                        <td className="p-6">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleUpdateUserStatus(u.uid, 'approved')}
                              className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button 
                              onClick={() => handleUpdateUserStatus(u.uid, 'rejected')}
                              className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'events' && (
          <motion.div
            key="events"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {events.map((event) => (
              <div key={event.id} className="glass p-6 rounded-[2.5rem] border border-white/5">
                <div className="aspect-video rounded-2xl overflow-hidden mb-4">
                  <img src={event.posterUrl || `https://picsum.photos/seed/${event.id}/800/450`} className="w-full h-full object-cover" alt="" />
                </div>
                <h4 className="font-black text-lg mb-1">{event.title}</h4>
                <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-4">{event.category} • {format(new Date(event.date), 'dd MMM yyyy')}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-primary" />
                    <span className="text-xs font-bold">{event.registeredCount} Registered</span>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                    event.status === 'completed' ? 'bg-secondary/10 text-secondary' :
                    event.status === 'ongoing' ? 'bg-red-500/10 text-red-500' :
                    'bg-green-500/10 text-green-500'
                  }`}>
                    {event.status}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'payments' && (
          <motion.div
            key="payments"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {payments.length === 0 ? (
              <div className="glass p-20 rounded-[3rem] text-center border-dashed border-2 border-white/5">
                <CreditCard size={48} className="mx-auto text-secondary opacity-20 mb-4" />
                <p className="text-secondary font-bold">No payment requests found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {payments.map((payment) => (
                  <div key={payment.id} className="glass p-6 rounded-3xl border border-white/5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-sm mb-1">{payment.eventTitle}</h4>
                        <p className="text-[10px] text-secondary font-black uppercase tracking-widest">
                          {payment.studentCount} Coupons • ₹{payment.amount}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                        payment.status === 'paid' ? 'bg-green-500/10 text-green-500' :
                        payment.status === 'approved' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <p className="text-[10px] text-secondary font-medium">Requested on {format(new Date(payment.requestedAt), 'dd MMM')}</p>
                      <ArrowRight size={16} className="text-secondary" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
