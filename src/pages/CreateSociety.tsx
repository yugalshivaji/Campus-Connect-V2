import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, Camera, Globe, Instagram, Twitter, Info } from 'lucide-react';
import { Society } from '../types';

export default function CreateSociety() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Tech',
    logoUrl: '',
    bannerUrl: '',
    socials: {
      website: '',
      instagram: '',
      twitter: ''
    }
  });

  useEffect(() => {
    if (id) {
      const fetchSociety = async () => {
        const socDoc = await getDoc(doc(db, 'societies', id));
        if (socDoc.exists()) {
          const data = socDoc.data() as Society;
          setFormData({
            name: data.name,
            description: data.description,
            category: data.category,
            logoUrl: data.logoUrl || '',
            bannerUrl: data.bannerUrl || '',
            socials: (data as any).socials || { website: '', instagram: '', twitter: '' }
          });
        }
      };
      fetchSociety();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      if (id) {
        await updateDoc(doc(db, 'societies', id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        navigate(`/society/${id}`);
      } else {
        const societyData = {
          ...formData,
          organizerId: user.uid,
          followerCount: 0,
          createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'societies'), societyData);
        
        // Update user's societyId
        await updateDoc(doc(db, 'users', user.uid), {
          societyId: docRef.id
        });

        navigate(`/society/${docRef.id}`);
      }
    } catch (err) {
      console.error('Submit society error:', err);
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
        <h1 className="text-3xl font-black tracking-tighter">{id ? 'Edit Society' : 'Create Society'}</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass p-6 rounded-3xl space-y-6">
          <div className="relative">
            <div className="h-32 bg-secondary/10 rounded-2xl overflow-hidden border-dashed border-2 border-secondary/20 flex items-center justify-center">
              <Camera size={32} className="text-secondary opacity-20" />
            </div>
            <div className="absolute -bottom-6 left-6 w-20 h-20 rounded-2xl glass p-1 border border-white/10 flex items-center justify-center">
              <Camera size={24} className="text-secondary opacity-20" />
            </div>
          </div>

          <div className="pt-8">
            <label className="text-[10px] text-secondary uppercase font-bold tracking-widest ml-1 mb-2 block">Society Name</label>
            <input
              type="text"
              required
              className="w-full bg-background/50 border border-secondary/20 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. Coding Club"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

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
            <label className="text-[10px] text-secondary uppercase font-bold tracking-widest ml-1 mb-2 block">About Society</label>
            <textarea
              required
              rows={4}
              className="w-full bg-background/50 border border-secondary/20 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="What does your society do?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        <div className="glass p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
            <Globe size={16} className="text-primary" />
            Social Links
          </h3>
          
          <div className="space-y-3">
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary w-4 h-4" />
              <input
                type="url"
                placeholder="Website URL"
                className="w-full bg-background/50 border border-secondary/20 rounded-xl py-3 pl-12 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.socials.website}
                onChange={(e) => setFormData({ ...formData, socials: { ...formData.socials, website: e.target.value } })}
              />
            </div>
            <div className="relative">
              <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary w-4 h-4" />
              <input
                type="text"
                placeholder="Instagram Username"
                className="w-full bg-background/50 border border-secondary/20 rounded-xl py-3 pl-12 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.socials.instagram}
                onChange={(e) => setFormData({ ...formData, socials: { ...formData.socials, instagram: e.target.value } })}
              />
            </div>
            <div className="relative">
              <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary w-4 h-4" />
              <input
                type="text"
                placeholder="Twitter Username"
                className="w-full bg-background/50 border border-secondary/20 rounded-xl py-3 pl-12 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.socials.twitter}
                onChange={(e) => setFormData({ ...formData, socials: { ...formData.socials, twitter: e.target.value } })}
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
              {id ? 'Update Society' : 'Create Society'}
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
