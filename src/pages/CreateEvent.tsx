import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, MapPin, ArrowLeft, CheckCircle2, CreditCard, Coffee, Camera, QrCode } from 'lucide-react';
import axios from 'axios';
import { Event } from '../types';

export default function CreateEvent() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    date: '',
    venue: '',
    category: 'Tech',
    type: 'free',
    fee: 0,
    registrationLimit: 100,
    hasFoodCoupon: false,
    couponCost: 50,
    posterUrl: '',
    qrScanStart: '',
    qrScanEnd: ''
  });

  useEffect(() => {
    const controller = new AbortController();
    if (id) {
      const fetchEvent = async () => {
        try {
          const eventDoc = await getDoc(doc(db, 'events', id));
          if (controller.signal.aborted) return;
          if (eventDoc.exists()) {
            const data = eventDoc.data() as any;
            setFormData({
              title: data.title,
              slug: data.slug || '',
              description: data.description,
              date: data.date,
              venue: data.venue,
              category: data.category,
              type: data.type,
              fee: data.fee || 0,
              registrationLimit: data.registrationLimit,
              hasFoodCoupon: data.hasFoodCoupon,
              couponCost: data.couponCost || 50,
              posterUrl: data.posterUrl || '',
              qrScanStart: data.qrScanStart || '',
              qrScanEnd: data.qrScanEnd || ''
            });
          }
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') return;
          console.error('Fetch event error:', err);
        }
      };
      fetchEvent();
    }
    return () => controller.abort();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      if (id) {
        await updateDoc(doc(db, 'events', id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        navigate(`/event/${id}`);
      } else {
        const eventData = {
          ...formData,
          organizerId: user.uid,
          registeredCount: 0,
          status: 'upcoming',
          createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'events'), eventData);
        
        // Sync with Google Sheets
        try {
          await axios.post('/api/sheets/sync', {
            action: 'createEvent',
            data: { id: docRef.id, ...eventData, organizerName: user.name }
          });
        } catch (err) {
          console.warn('Sheets sync failed');
        }

        navigate(`/event/${docRef.id}`);
      }
    } catch (err) {
      console.error('Submit event error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 pb-24 pt-8"
    >
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 glass rounded-full flex items-center justify-center">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-black tracking-tighter">{id ? 'Edit Event' : 'Create Event'}</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass p-6 rounded-3xl space-y-4">
          <div className="aspect-video bg-secondary/10 rounded-2xl flex flex-col items-center justify-center border-dashed border-2 border-secondary/20 cursor-pointer hover:bg-secondary/20 transition-colors">
            <Camera size={48} className="text-secondary mb-2 opacity-20" />
            <p className="text-secondary text-sm font-bold">Upload Event Poster</p>
          </div>

          <div>
            <label className="text-[10px] text-secondary uppercase font-bold tracking-widest ml-1 mb-2 block">Event Title</label>
            <input
              type="text"
              required
              className="w-full bg-background/50 border border-secondary/20 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. Annual Hackathon 2026"
              value={formData.title}
              onChange={(e) => {
                const title = e.target.value;
                const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                setFormData({ ...formData, title, slug });
              }}
            />
          </div>

          <div>
            <label className="text-[10px] text-secondary uppercase font-bold tracking-widest ml-1 mb-2 block">Event Slug (URL)</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-secondary font-mono">/events/</span>
              <input
                type="text"
                required
                className="flex-1 bg-background/50 border border-secondary/20 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary text-xs font-mono"
                placeholder="tech-fest-2026"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-secondary uppercase font-bold tracking-widest ml-1 mb-2 block">Description</label>
            <textarea
              required
              rows={4}
              className="w-full bg-background/50 border border-secondary/20 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Tell students what this event is about..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-secondary uppercase font-bold tracking-widest ml-1 mb-2 block">Category</label>
              <select 
                className="w-full bg-background/50 border border-secondary/20 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary text-xs font-bold"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Tech">Tech</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Workshop">Workshop</option>
                <option value="Academic">Academic</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-secondary uppercase font-bold tracking-widest ml-1 mb-2 block">Reg. Limit</label>
              <input
                type="number"
                required
                className="w-full bg-background/50 border border-secondary/20 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary text-xs font-bold"
                value={formData.registrationLimit}
                onChange={(e) => setFormData({ ...formData, registrationLimit: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass p-4 rounded-3xl">
            <label className="text-[10px] text-secondary uppercase font-bold tracking-widest mb-2 block">Date & Time</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-primary w-4 h-4" />
              <input
                type="datetime-local"
                required
                className="w-full bg-transparent text-xs font-bold pl-9 focus:outline-none"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>
          <div className="glass p-4 rounded-3xl">
            <label className="text-[10px] text-secondary uppercase font-bold tracking-widest mb-2 block">Venue</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-primary w-4 h-4" />
              <input
                type="text"
                required
                placeholder="Auditorium"
                className="w-full bg-transparent text-xs font-bold pl-9 focus:outline-none"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <CreditCard size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">Event Type</p>
                <p className="text-[10px] text-secondary">Free or Paid registration</p>
              </div>
            </div>
            <select 
              className="bg-background/50 border border-secondary/20 rounded-xl px-4 py-2 text-xs font-bold"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'free' | 'paid' })}
            >
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {formData.type === 'paid' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-4 border-t border-secondary/10"
            >
              <label className="text-[10px] text-secondary uppercase font-bold tracking-widest mb-2 block">Registration Fee (INR)</label>
              <input
                type="number"
                className="w-full bg-background/50 border border-secondary/20 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.fee}
                onChange={(e) => setFormData({ ...formData, fee: Number(e.target.value) })}
              />
            </motion.div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-secondary/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <Coffee size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">Food Coupon</p>
                <p className="text-[10px] text-secondary">Include refreshments</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, hasFoodCoupon: !formData.hasFoodCoupon })}
              className={`w-12 h-6 rounded-full transition-colors relative ${formData.hasFoodCoupon ? 'bg-primary' : 'bg-secondary/20'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.hasFoodCoupon ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          {formData.hasFoodCoupon && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-4 border-t border-secondary/10"
            >
              <label className="text-[10px] text-secondary uppercase font-bold tracking-widest mb-2 block">Coupon Value per Student (INR)</label>
              <input
                type="number"
                className="w-full bg-background/50 border border-secondary/20 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.couponCost}
                onChange={(e) => setFormData({ ...formData, couponCost: Number(e.target.value) })}
              />
            </motion.div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-secondary/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <QrCode size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">QR Scan Window</p>
                <p className="text-[10px] text-secondary">Attendance time-frame</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-secondary uppercase font-bold tracking-widest ml-1 mb-2 block">Start Time</label>
              <input
                type="datetime-local"
                className="w-full bg-background/50 border border-secondary/20 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary text-xs font-bold"
                value={formData.qrScanStart}
                onChange={(e) => setFormData({ ...formData, qrScanStart: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] text-secondary uppercase font-bold tracking-widest ml-1 mb-2 block">End Time</label>
              <input
                type="datetime-local"
                className="w-full bg-background/50 border border-secondary/20 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary text-xs font-bold"
                value={formData.qrScanEnd}
                onChange={(e) => setFormData({ ...formData, qrScanEnd: e.target.value })}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary/25 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircle2 size={20} />
              Publish Event
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
