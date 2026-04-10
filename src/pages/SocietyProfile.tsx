import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { Society, Event } from '../types';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Users, Calendar, ArrowLeft, Globe, Instagram, Twitter, CheckCircle2, Edit } from 'lucide-react';
import EventCard from '../components/EventCard';

export default function SocietyProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [society, setSociety] = useState<Society | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const isOwner = user?.uid === society?.organizerId;

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const socDoc = await getDoc(doc(db, 'societies', id));
        if (socDoc.exists()) {
          setSociety({ id: socDoc.id, ...socDoc.data() } as Society);
          setIsFollowing(user?.followedSocieties?.includes(id) || false);
        }

        const eventsQ = query(collection(db, 'events'), where('organizerId', '==', id));
        const eventsSnapshot = await getDocs(eventsQ);
        setEvents(eventsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Event)));
      } catch (err) {
        console.error('Fetch society error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const handleFollow = async () => {
    if (!user || !id) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const socRef = doc(db, 'societies', id);

      if (isFollowing) {
        await updateDoc(userRef, { followedSocieties: arrayRemove(id) });
        await updateDoc(socRef, { followerCount: (society?.followerCount || 1) - 1 });
        setIsFollowing(false);
      } else {
        await updateDoc(userRef, { followedSocieties: arrayUnion(id) });
        await updateDoc(socRef, { followerCount: (society?.followerCount || 0) + 1 });
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
  if (!society) return <div className="p-6 text-center">Society not found</div>;

  return (
    <div className="pb-24">
      <div className="relative h-48 bg-primary/20">
        <img src={society.bannerUrl || `https://picsum.photos/seed/${id}/800/400`} className="w-full h-full object-cover" alt="" />
        <div className="absolute top-6 left-6 flex gap-2">
          <Link to="/home" className="w-10 h-10 glass rounded-full flex items-center justify-center text-white">
            <ArrowLeft size={20} />
          </Link>
          {isOwner && (
            <Link to={`/edit-society/${id}`} className="w-10 h-10 glass rounded-full flex items-center justify-center text-white">
              <Edit size={20} />
            </Link>
          )}
        </div>
      </div>

      <div className="px-6 -mt-12 relative z-10">
        <div className="w-24 h-24 rounded-3xl glass p-1 mb-4">
          <img src={society.logoUrl || `https://picsum.photos/seed/${id}/200/200`} className="w-full h-full object-cover rounded-[1.25rem]" alt="" />
        </div>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter flex items-center gap-2">
              {society.name}
              <CheckCircle2 size={20} className="text-primary" />
            </h1>
            <p className="text-secondary font-bold text-sm uppercase tracking-widest">{society.category}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleFollow}
            className={`px-8 py-3 rounded-2xl font-black text-sm shadow-lg transition-all ${
              isFollowing 
                ? 'glass text-secondary' 
                : 'bg-primary text-white shadow-primary/25'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </motion.button>
        </div>

        <div className="flex gap-6 mb-8">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <span className="font-bold text-sm">{society.followerCount || 0} Followers</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            <span className="font-bold text-sm">{events.length} Events</span>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl mb-10">
          <h2 className="text-lg font-bold mb-3">About</h2>
          <p className="text-secondary text-sm leading-relaxed">{society.description}</p>
          
          <div className="flex gap-4 mt-6">
            <a href="#" className="w-10 h-10 glass rounded-xl flex items-center justify-center text-secondary hover:text-primary transition-colors">
              <Globe size={18} />
            </a>
            <a href="#" className="w-10 h-10 glass rounded-xl flex items-center justify-center text-secondary hover:text-primary transition-colors">
              <Instagram size={18} />
            </a>
            <a href="#" className="w-10 h-10 glass rounded-xl flex items-center justify-center text-secondary hover:text-primary transition-colors">
              <Twitter size={18} />
            </a>
          </div>
        </div>

        <section>
          <h2 className="text-xl font-bold mb-6">Events by {society.name}</h2>
          <div className="space-y-6">
            {events.length > 0 ? (
              events.map(event => <EventCard key={event.id} event={event} />)
            ) : (
              <div className="glass p-12 rounded-3xl text-center border-dashed border-2 border-secondary/20">
                <p className="text-secondary text-sm">No events published yet</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
