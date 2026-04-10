import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Users, QrCode, Award, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'organizer') {
        navigate('/dashboard');
      } else if (user.role === 'canteen') {
        navigate('/canteen');
      } else {
        navigate('/home');
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6">
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 blur-[120px] rounded-full opacity-50" />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-8"
          >
            <Sparkles size={16} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest">The Ultimate Campus Ecosystem</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]"
          >
            Connect. Experience. <span className="text-primary">Elevate.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium"
          >
            The all-in-one platform for campus events, society management, and student engagement. 
            Digital tickets, real-time analytics, and seamless coordination.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/login" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto bg-primary text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/40 flex items-center justify-center gap-3 group">
                Get Started
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link to="/how-to-use" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto glass px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest border border-white/10 hover:bg-white/5 transition-all">
                Learn More
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-secondary/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black tracking-tighter mb-4">Everything you need</h2>
            <p className="text-secondary font-medium">Powerful features for students and organizers alike.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: QrCode,
                title: "Smart Ticketing",
                desc: "Generate unique QR codes for every registration. Instant check-in and attendance tracking.",
                color: "text-primary",
                bg: "bg-primary/10"
              },
              {
                icon: Shield,
                title: "Secure Payments",
                desc: "Integrated payment gateways and manual verification flows for all event types.",
                color: "text-accent",
                bg: "bg-accent/10"
              },
              {
                icon: Zap,
                title: "Real-time Sync",
                desc: "Automated Google Sheets synchronization and email notifications for seamless management.",
                color: "text-yellow-500",
                bg: "bg-yellow-500/10"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass p-8 rounded-[2.5rem] border border-white/5"
              >
                <div className={`w-14 h-14 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-black mb-3">{feature.title}</h3>
                <p className="text-secondary text-sm leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto glass rounded-[3rem] p-12 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full -mr-32 -mt-32" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
            {[
              { label: "Events", val: "500+" },
              { label: "Students", val: "10k+" },
              { label: "Societies", val: "50+" },
              { label: "Check-ins", val: "25k+" }
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-3xl font-black text-primary mb-1">{stat.val}</p>
                <p className="text-[10px] text-secondary font-black uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center">
        <p className="text-secondary text-xs font-bold uppercase tracking-widest">© 2026 Campus Connect. All rights reserved.</p>
      </footer>
    </div>
  );
}
