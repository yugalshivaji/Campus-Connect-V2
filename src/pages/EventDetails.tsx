import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, increment, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Event, Registration } from '../types';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, Users, Share2, Heart, ArrowLeft, ShieldCheck, CreditCard, QrCode, Upload, CheckCircle2, Coffee } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

export default function EventDetails() {
  const { id, slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'manual'>('razorpay');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      if (!id && !slug) return;
      try {
        let eventData: Event | null = null;
        
        if (id) {
          const eventDoc = await getDoc(doc(db, 'events', id));
          if (eventDoc.exists()) {
            eventData = { id: eventDoc.id, ...eventDoc.data() } as Event;
          }
        } else if (slug) {
          const q = query(collection(db, 'events'), where('slug', '==', slug));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            eventData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Event;
          }
        }

        if (eventData) {
          setEvent(eventData);
          if (user) {
            const q = query(collection(db, 'registrations'), where('userId', '==', user.uid), where('eventId', '==', eventData.id));
            const regSnapshot = await getDocs(q);
            if (!regSnapshot.empty) {
              setRegistration({ id: regSnapshot.docs[0].id, ...regSnapshot.docs[0].data() } as Registration);
            }
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
  }, [id, user]);

  const handleRegister = async () => {
    if (!event || !user) return;
    
    if (event.type === 'paid' && !registration) {
      setShowPayment(true);
      return;
    }

    setRegistering(true);
    try {
      const regId = `${user.uid}_${event.id}`;
      const serial = Date.now().toString().slice(-6);
      const validationToken = Math.random().toString(36).substring(2, 15);
      
      const newReg: Registration = {
        id: regId,
        userId: user.uid,
        eventId: event.id,
        status: 'confirmed',
        attended: false,
        couponRedeemed: false,
        qrCode: `attendance:${event.id}:${user.uid}:${validationToken}`,
        ticketId: `TKT-${format(new Date(), 'yyyyMMdd')}-${serial}`,
        validationToken
      };

      await setDoc(doc(db, 'registrations', regId), newReg);
      await updateDoc(doc(db, 'events', event.id), {
        registeredCount: increment(1)
      });
      setRegistration(newReg);
      
      // Sync with Google Sheets
      try {
        await axios.post('/api/sheets/sync', {
          action: 'register',
          data: { ...newReg, userName: user.name, userEmail: user.email, eventTitle: event.title }
        });
      } catch (err) {
        console.warn('Sheets sync failed, but registration succeeded');
      }

    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setRegistering(false);
    }
  };

  const handleManualPayment = async () => {
    if (!event || !user || !transactionId) return;
    setRegistering(true);
    try {
      const regId = `${user.uid}_${event.id}`;
      const validationToken = Math.random().toString(36).substring(2, 15);
      
      const newReg: Registration = {
        id: regId,
        userId: user.uid,
        eventId: event.id,
        status: 'pending',
        transactionId,
        paymentScreenshot: screenshot || '',
        attended: false,
        couponRedeemed: false,
        validationToken
      };

      await setDoc(doc(db, 'registrations', regId), newReg);
      setRegistration(newReg);
      setShowPayment(false);
    } catch (err) {
      console.error('Manual payment error:', err);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
        <button onClick={() => navigate('/')} className="text-primary font-bold">Go Back Home</button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-24"
    >
      <div className="relative h-80">
        <img 
          src={event.posterUrl || `https://picsum.photos/seed/${event.id}/1200/800`} 
          alt={event.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 w-10 h-10 glass rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="px-6 -mt-12 relative z-10">
        <div className="glass p-8 rounded-[2.5rem] shadow-2xl border border-white/10">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-black tracking-tight leading-tight flex-1 pr-4">
              {event.title}
            </h1>
            <div className="flex gap-2">
              <button className="w-10 h-10 glass rounded-full flex items-center justify-center text-secondary hover:text-primary transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 glass rounded-full flex items-center justify-center text-secondary hover:text-red-500 transition-colors">
                <Heart className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="glass p-4 rounded-3xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-secondary uppercase font-bold tracking-wider">Date & Time</p>
                <p className="text-xs font-bold">{format(new Date(event.date), 'MMM d, p')}</p>
              </div>
            </div>
            <div className="glass p-4 rounded-3xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-secondary uppercase font-bold tracking-wider">Location</p>
                <p className="text-xs font-bold truncate">{event.venue}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-bold mb-3">About Event</h2>
            <p className="text-secondary text-sm leading-relaxed">
              {event.description}
            </p>
          </div>

          {!registration ? (
            <button
              onClick={handleRegister}
              disabled={registering || event.registeredCount >= event.registrationLimit}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary/25 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {registering ? 'Processing...' : event.registeredCount >= event.registrationLimit ? 'House Full' : `Register Now ${event.type === 'paid' ? `(₹${event.fee})` : ''}`}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/50 p-4 rounded-2xl flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-green-500" />
                <div>
                  <p className="text-green-500 font-bold text-sm">
                    {registration.status === 'confirmed' ? 'Registration Confirmed!' : 'Payment Under Verification'}
                  </p>
                  <p className="text-xs text-secondary">
                    {registration.status === 'confirmed' ? 'Your ticket is ready below.' : 'Our team will verify your payment soon.'}
                  </p>
                </div>
              </div>

              {registration.status === 'confirmed' && (
                <div className="space-y-6">
                  {event.qrVisible ? (
                    <div className="glass p-8 rounded-3xl text-center border-dashed border-2 border-primary/20">
                      <div className="bg-white p-4 rounded-2xl inline-block mb-4 shadow-xl">
                        <QRCodeSVG value={`attendance:${event.id}:${user.uid}:${registration.validationToken}`} size={160} />
                      </div>
                      <p className="text-[10px] font-mono text-secondary mb-1 uppercase tracking-widest">Attendance ID: {user.uid.slice(-8)}</p>
                      <p className="text-sm font-black">Your Unique Attendance QR</p>
                    </div>
                  ) : (
                    <div className="glass p-8 rounded-3xl text-center border border-white/5 bg-secondary/5">
                      <QrCode size={40} className="mx-auto mb-4 text-secondary opacity-20" />
                      <p className="text-sm font-bold text-secondary">Attendance QR is currently hidden</p>
                      <p className="text-[10px] text-secondary/60 uppercase font-black tracking-widest mt-1">Will be visible during the event</p>
                    </div>
                  )}

                  {event.hasFoodCoupon && registration.attended && (
                    <div className="glass p-8 rounded-3xl text-center border-dashed border-2 border-accent/20">
                      <div className="bg-white p-4 rounded-2xl inline-block mb-4 shadow-xl">
                        <QRCodeSVG value={`coupon:${event.id}:${user.uid}:${registration.validationToken}`} size={160} />
                      </div>
                      <p className="text-[10px] font-mono text-secondary mb-1 uppercase tracking-widest">Coupon ID: {user.uid.slice(-8)}</p>
                      <p className="text-sm font-black text-accent">Your Unique Food Coupon QR</p>
                      {registration.couponRedeemed && (
                        <div className="mt-4 py-2 bg-green-500/10 text-green-500 rounded-xl text-[10px] font-black uppercase tracking-widest">
                          Redeemed
                        </div>
                      )}
                    </div>
                  )}
                  {event.hasFoodCoupon && !registration.attended && (
                    <div className="glass p-8 rounded-3xl text-center border border-white/5 bg-secondary/5">
                      <Coffee size={40} className="mx-auto mb-4 text-secondary opacity-20" />
                      <p className="text-sm font-bold text-secondary">Food Coupon Locked</p>
                      <p className="text-[10px] text-secondary/60 uppercase font-black tracking-widest mt-1">Check in to the event to unlock</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showPayment && (
          <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPayment(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="relative w-full max-w-md glass p-8 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">Complete Payment</h2>
              
              <div className="flex gap-4 mb-8">
                <button 
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'razorpay' ? 'border-primary bg-primary/5' : 'border-secondary/20'}`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="text-xs font-bold">Razorpay</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod('manual')}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'manual' ? 'border-primary bg-primary/5' : 'border-secondary/20'}`}
                >
                  <QrCode className="w-6 h-6" />
                  <span className="text-xs font-bold">UPI / QR</span>
                </button>
              </div>

              {paymentMethod === 'manual' ? (
                <div className="space-y-4">
                  <div className="text-center p-4 glass rounded-2xl border border-primary/20">
                    <p className="text-xs text-secondary mb-2 uppercase font-bold tracking-widest">Scan to Pay</p>
                    <div className="bg-white p-2 rounded-xl inline-block mb-2">
                      <QRCodeSVG value="upi://pay?pa=yugal@upi&pn=CampusConnect&am=150" size={120} />
                    </div>
                    <p className="text-sm font-bold">UPI ID: yugal@upi</p>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Transaction ID" 
                    className="w-full bg-background/50 border border-secondary/20 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                  <button 
                    onClick={handleManualPayment}
                    disabled={!transactionId}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold disabled:opacity-50"
                  >
                    Submit for Verification
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-secondary mb-6">Redirecting to secure payment gateway...</p>
                  <button 
                    onClick={handleRegister}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold"
                  >
                    Pay ₹{event.fee} Now
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
