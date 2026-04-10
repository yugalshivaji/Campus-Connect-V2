import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, increment, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Event, Registration, CanteenPayment, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Users, QrCode, CheckCircle, XCircle, Coffee, Search, Filter, Edit, Trash2, ArrowRight, FileText, Download, CreditCard, Upload, Image as ImageIcon } from 'lucide-react';
import QRScanner from '../components/QRScanner';
import { deleteDoc } from 'firebase/firestore';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ManageEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState<'attendance' | 'coupon' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [canteenPayments, setCanteenPayments] = useState<CanteenPayment[]>([]);
  const [uploading, setUploading] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      if (!id) return;
      try {
        const eventDoc = await getDoc(doc(db, 'events', id));
        if (eventDoc.exists()) {
          setEvent({ id: eventDoc.id, ...eventDoc.data() } as Event);
        }

        const regQ = query(collection(db, 'registrations'), where('eventId', '==', id));
        const regSnapshot = await getDocs(regQ);
        setRegistrations(regSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Registration)));

        const payQ = query(collection(db, 'payments'), where('eventId', '==', id));
        const paySnapshot = await getDocs(payQ);
        setCanteenPayments(paySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as CanteenPayment)));
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Fetch manage data error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, 'events', id));
      navigate('/dashboard');
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const verifyPayment = async (regId: string) => {
    if (!event) return;
    try {
      const ticketId = `TKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const regDoc = await getDoc(doc(db, 'registrations', regId));
      const regData = regDoc.data() as Registration;
      const validationToken = regData.validationToken || Math.random().toString(36).substring(2, 15);
      const qrCode = `attendance:${event.id}:${regData.userId}:${validationToken}`;
      
      await updateDoc(doc(db, 'registrations', regId), { 
        status: 'confirmed',
        ticketId,
        qrCode,
        validationToken
      });
      
      await updateDoc(doc(db, 'events', event.id), {
        registeredCount: increment(1)
      });

      setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, status: 'confirmed', ticketId, qrCode } : r));
      setEvent(prev => prev ? { ...prev, registeredCount: prev.registeredCount + 1 } : null);
    } catch (err) {
      console.error('Verify payment error:', err);
    }
  };

  const handleScan = async (decodedText: string) => {
    if (!id) return;
    try {
      const parts = decodedText.split(':');
      if (parts.length !== 4 || parts[0] !== 'attendance') {
        showToast('Invalid QR Code Format', 'error');
        return;
      }

      const [type, eventId, userId, token] = parts;
      if (eventId !== id) {
        showToast('This ticket is for a different event!', 'error');
        return;
      }

      const regId = `${userId}_${eventId}`;
      const regDoc = await getDoc(doc(db, 'registrations', regId));
      
      if (!regDoc.exists()) {
        showToast('Invalid QR Code', 'error');
        return;
      }

      const reg = { id: regDoc.id, ...regDoc.data() } as Registration;
      if (reg.validationToken !== token) {
        showToast('Security Validation Failed!', 'error');
        return;
      }

      if (showScanner === 'attendance') {
        if (reg.attended) {
          showToast('Attendance already marked!', 'error');
          setShowScanner(null);
          return;
        }
        await updateDoc(doc(db, 'registrations', reg.id), {
          attended: true,
          scannedAt: new Date().toISOString()
        });
        showToast('Attendance marked successfully!');
      } else if (showScanner === 'coupon') {
        if (!event?.hasFoodCoupon) {
          showToast('This event does not have food coupons.', 'error');
          setShowScanner(null);
          return;
        }
        if (!reg.attended) {
          showToast('Student must check in first!', 'error');
          setShowScanner(null);
          return;
        }
        if (reg.couponRedeemed) {
          showToast('Coupon already redeemed!', 'error');
          setShowScanner(null);
          return;
        }
        await updateDoc(doc(db, 'registrations', reg.id), {
          couponRedeemed: true
        });
        showToast('Coupon redeemed successfully!');
      }

      const regQ = query(collection(db, 'registrations'), where('eventId', '==', id));
      const regSnapshot = await getDocs(regQ);
      setRegistrations(regSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Registration)));
      setShowScanner(null);
    } catch (err) {
      console.error('Scan process error:', err);
      alert('Failed to process scan');
    }
  };

  const exportToPDF = () => {
    if (!event) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246); // Primary color
    doc.text('Campus Connect - Event Report', 14, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(`Event: ${event.title}`, 14, 30);
    doc.text(`Date: ${new Date(event.date).toLocaleDateString()}`, 14, 38);
    
    // Stats
    doc.setFontSize(12);
    doc.text(`Total Registered: ${registrations.length}`, 14, 50);
    doc.text(`Total Attended: ${registrations.filter(r => r.attended).length}`, 14, 58);
    doc.text(`Coupons Redeemed: ${registrations.filter(r => r.couponRedeemed).length}`, 14, 66);
    
    // Table
    const tableData = registrations.map(reg => [
      reg.userId,
      reg.ticketId || 'N/A',
      reg.status.toUpperCase(),
      reg.attended ? 'YES' : 'NO',
      reg.couponRedeemed ? 'REDEEMED' : 'NO'
    ]);

    (doc as any).autoTable({
      startY: 75,
      head: [['User ID', 'Ticket ID', 'Status', 'Attended', 'Coupon']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`${event.title}_Report.pdf`);
    showToast('PDF Report generated!');
  };

  const handlePaymentProofUpload = async (e: React.ChangeEvent<HTMLInputElement>, paymentId: string) => {
    const file = e.target.files?.[0];
    if (!file || !event) return;

    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onload = async (eventReader) => {
        const base64 = eventReader.target?.result as string;
        
        // Upload to Drive via Apps Script
        const response = await axios.post('/api/sheets/sync', {
          action: 'uploadPaymentProof',
          eventId: event.id,
          paymentId: paymentId,
          fileName: `PaymentProof_${paymentId}_${file.name}`,
          fileData: base64.split(',')[1],
          mimeType: file.type
        });

        if (response.data.success) {
          await updateDoc(doc(db, 'payments', paymentId), {
            status: 'paid',
            paidAt: new Date().toISOString(),
            paymentScreenshot: response.data.fileUrl
          });
          
          setCanteenPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'paid', paymentScreenshot: response.data.fileUrl } : p));
          showToast('Payment proof uploaded successfully!');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload error:', err);
      showToast('Failed to upload proof', 'error');
    } finally {
      setUploading(false);
    }
  };

  const filteredRegistrations = registrations.filter(reg => 
    reg.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reg.ticketId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
  if (!event) return <div className="p-6 text-center">Event not found</div>;

  return (
    <div className="p-6 pb-24 pt-8 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 glass rounded-full flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-black tracking-tighter">Manage Event</h1>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportToPDF}
            className="px-4 py-2 glass rounded-xl text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2"
          >
            <Download size={14} />
            Export PDF
          </button>
          <button 
            onClick={() => navigate(`/edit/${id}`)}
            className="w-10 h-10 glass rounded-full flex items-center justify-center text-primary"
          >
            <Edit size={18} />
          </button>
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="w-10 h-10 glass rounded-full flex items-center justify-center text-red-500"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass p-6 rounded-[2rem] border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Users size={20} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-secondary">Attendance</h3>
          </div>
          <p className="text-3xl font-black">{registrations.filter(r => r.attended).length} <span className="text-sm text-secondary font-medium">/ {registrations.length}</span></p>
          <div className="mt-2 w-full bg-secondary/10 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-500" 
              style={{ width: `${(registrations.filter(r => r.attended).length / (registrations.length || 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="glass p-6 rounded-[2rem] border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
              <Coffee size={20} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-secondary">Coupons</h3>
          </div>
          <p className="text-3xl font-black">{registrations.filter(r => r.couponRedeemed).length} <span className="text-sm text-secondary font-medium">Redeemed</span></p>
          <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mt-2">₹{(registrations.filter(r => r.couponRedeemed).length * (event.couponCost || 50)).toLocaleString()} Total Value</p>
        </div>

        <div className="glass p-6 rounded-[2rem] border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
              <CreditCard size={20} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-secondary">Revenue</h3>
          </div>
          <p className="text-3xl font-black">₹{(registrations.filter(r => r.status === 'confirmed').length * (event.fee || 0)).toLocaleString()}</p>
          <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mt-2">{registrations.filter(r => r.status === 'confirmed').length} Paid Tickets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button 
          onClick={() => setShowScanner('attendance')}
          className="glass p-6 rounded-3xl flex flex-col items-center gap-3 text-primary hover:bg-primary/5 transition-colors"
        >
          <QrCode size={32} />
          <span className="text-xs font-black uppercase tracking-widest">Mark Attendance</span>
        </button>
        <button 
          onClick={() => setShowScanner('coupon')}
          disabled={!event.hasFoodCoupon}
          className={`glass p-6 rounded-3xl flex flex-col items-center gap-3 transition-colors ${
            event.hasFoodCoupon ? 'text-accent hover:bg-accent/5' : 'text-secondary opacity-50 cursor-not-allowed'
          }`}
        >
          <Coffee size={32} />
          <span className="text-xs font-black uppercase tracking-widest">Mark Coupon Redeemed</span>
        </button>
      </div>

      {/* Payment Management Section */}
      {event.hasFoodCoupon && canteenPayments.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
              <CreditCard size={20} />
            </div>
            <h3 className="text-xl font-black tracking-tight">Canteen Payouts</h3>
          </div>

          <div className="space-y-4">
            {canteenPayments.map(payment => (
              <div key={payment.id} className="glass p-6 rounded-[2rem] border border-white/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-black text-sm">Payout Request</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        payment.status === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">
                      {payment.studentCount} Students • ₹{payment.amount} Total
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {payment.status === 'pending' ? (
                      <label className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-primary/90 transition-all">
                        <Upload size={14} />
                        {uploading ? 'Uploading...' : 'Upload Proof'}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handlePaymentProofUpload(e, payment.id)}
                          disabled={uploading}
                        />
                      </label>
                    ) : (
                      <a 
                        href={payment.paymentScreenshot} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 glass text-secondary rounded-xl text-[10px] font-black uppercase tracking-widest"
                      >
                        <ImageIcon size={14} />
                        View Proof
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* QR Control System */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <QrCode size={20} />
          </div>
          <h3 className="text-xl font-black tracking-tight">Dynamic QR Control</h3>
        </div>
        
        <div className="glass p-8 rounded-[2.5rem] border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="font-black text-sm mb-1">Attendance QR Visibility</h4>
              <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Control when students can scan</p>
            </div>
            <button 
              onClick={async () => {
                if (!event) return;
                await updateDoc(doc(db, 'events', event.id), { qrVisible: !event.qrVisible });
                setEvent({ ...event, qrVisible: !event.qrVisible });
              }}
              className={`w-14 h-8 rounded-full relative transition-all ${event.qrVisible ? 'bg-primary' : 'bg-secondary/20'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${event.qrVisible ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] text-secondary font-black uppercase tracking-widest">Scan Limit per Student</label>
              <input 
                type="number" 
                value={event.qrScanLimit || 1}
                onChange={async (e) => {
                  const val = parseInt(e.target.value);
                  if (!event) return;
                  await updateDoc(doc(db, 'events', event.id), { qrScanLimit: val });
                  setEvent({ ...event, qrScanLimit: val });
                }}
                className="w-full bg-background/50 border border-secondary/20 rounded-xl py-3 px-4 text-sm font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-secondary font-black uppercase tracking-widest">Expiry Time (Optional)</label>
              <input 
                type="datetime-local" 
                value={event.qrExpiry || ''}
                onChange={async (e) => {
                  const val = e.target.value;
                  if (!event) return;
                  await updateDoc(doc(db, 'events', event.id), { qrExpiry: val });
                  setEvent({ ...event, qrExpiry: val });
                }}
                className="w-full bg-background/50 border border-secondary/20 rounded-xl py-3 px-4 text-sm font-bold"
              />
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Registrations</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="glass py-2 pl-9 pr-4 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary w-32"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredRegistrations.map(reg => (
            <div key={reg.id} className="glass p-5 rounded-[2rem] space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary font-bold">
                    {reg.userId.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{reg.userId}</p>
                    <p className="text-[10px] text-secondary font-medium">Ticket: {reg.ticketId}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  reg.status === 'confirmed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                }`}>
                  {reg.status}
                </div>
              </div>

              {reg.status === 'pending' && reg.transactionId && (
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="text-[10px] text-secondary">
                    <p className="font-bold">TXN: {reg.transactionId}</p>
                    <button className="text-primary mt-1">View Screenshot</button>
                  </div>
                  <button 
                    onClick={() => verifyPayment(reg.id)}
                    className="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                  >
                    Verify
                  </button>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                  {reg.attended ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-secondary" />}
                  <span className={reg.attended ? 'text-green-500' : 'text-secondary'}>Attended</span>
                </div>
                {event.hasFoodCoupon && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold">
                    {reg.couponRedeemed ? <CheckCircle size={14} className="text-green-500" /> : <Coffee size={14} className="text-secondary" />}
                    <span className={reg.couponRedeemed ? 'text-green-500' : 'text-secondary'}>Coupon</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {showScanner && (
          <QRScanner 
            title={showScanner === 'attendance' ? 'Scan Attendance' : 'Scan Food Coupon'}
            onClose={() => setShowScanner(null)}
            onScan={handleScan}
          />
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative glass p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h2 className="text-2xl font-black mb-2">Delete Event?</h2>
              <p className="text-secondary text-sm mb-8">This action cannot be undone. All registration data will be lost.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 glass py-4 rounded-2xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-red-500/25"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] w-full max-w-xs"
          >
            <div className={`p-4 rounded-2xl shadow-2xl border ${
              toast.type === 'success' ? 'bg-green-500 border-green-400 text-white' : 'bg-red-500 border-red-400 text-white'
            } flex items-center gap-3`}>
              {toast.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
              <p className="text-xs font-black uppercase tracking-widest">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
