import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Calendar, Users, ArrowRight, Sparkles } from 'lucide-react';
import { Event } from '../types';
import { format } from 'date-fns';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  compact?: boolean;
}

export default function EventCard({ event, onClick, compact }: EventCardProps) {
  const isPaid = event.type === 'paid';

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`glass rounded-3xl overflow-hidden relative group cursor-pointer border border-white/10 ${compact ? 'w-full' : ''}`}
    >
      <div className="aspect-video relative overflow-hidden">
        <img
          src={event.posterUrl || `https://picsum.photos/seed/${event.id}/800/450`}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 bg-primary/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {event.category}
        </div>
        {isPaid && (
          <div className="absolute top-4 right-4 bg-accent/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            ₹{event.fee}
          </div>
        )}
        {event.status === 'ongoing' && (
          <div className="absolute bottom-4 left-4 flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/90 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            Live
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {event.title}
        </h3>
        
        <div className="flex flex-col gap-2 text-xs text-secondary">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-primary" />
            <span>{format(new Date(event.date), 'PPP p')}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-primary" />
            <span className="line-clamp-1">{event.venue}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={14} className="text-primary" />
            <span>{event.registeredCount} / {event.registrationLimit} Registered</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-background bg-secondary/20 overflow-hidden">
                <img src={`https://i.pravatar.cc/150?u=${event.id}${i}`} alt="user" referrerPolicy="no-referrer" />
              </div>
            ))}
            <div className="w-7 h-7 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
              +12
            </div>
          </div>
          <motion.div
            whileHover={{ x: 5 }}
            className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"
          >
            <ArrowRight size={18} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
