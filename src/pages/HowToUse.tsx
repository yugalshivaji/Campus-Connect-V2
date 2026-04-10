import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, User, Calendar, QrCode, Shield, LayoutDashboard, HelpCircle } from 'lucide-react';

export default function HowToUse() {
  const navigate = useNavigate();

  const steps = [
    {
      icon: User,
      title: "Create your Profile",
      desc: "Register as a student or organizer. Set your interests to get personalized event recommendations.",
      role: "Everyone"
    },
    {
      icon: Calendar,
      title: "Discover Events",
      desc: "Browse the home feed, use the explore page to filter by category, or check the calendar for upcoming dates.",
      role: "Students"
    },
    {
      icon: QrCode,
      title: "Register & Pay",
      desc: "For paid events, upload your transaction ID and screenshot. Once verified, you'll receive a unique QR ticket.",
      role: "Students"
    },
    {
      icon: LayoutDashboard,
      title: "Manage & Track",
      desc: "Organizers can create events, verify payments, and use the built-in QR scanner for attendance and food coupons.",
      role: "Organizers"
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6 pb-24 pt-8">
      <header className="flex items-center gap-4 mb-12">
        <button onClick={() => navigate(-1)} className="w-10 h-10 glass rounded-full flex items-center justify-center">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black tracking-tighter">How to Use</h1>
          <p className="text-secondary text-sm font-medium">Master the Campus Connect platform</p>
        </div>
      </header>

      <div className="space-y-8">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-8 rounded-[2.5rem] relative border border-white/5"
          >
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black border border-primary/20">
              {i + 1}
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <step.icon size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black">{step.title}</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-secondary bg-white/5 px-2 py-1 rounded-md">
                  {step.role}
                </span>
              </div>
            </div>
            
            <p className="text-secondary text-sm leading-relaxed font-medium">
              {step.desc}
            </p>
          </motion.div>
        ))}

        <section className="mt-16">
          <div className="glass p-8 rounded-[2.5rem] bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="text-primary" />
              <h2 className="text-xl font-black">Need Help?</h2>
            </div>
            <p className="text-secondary text-sm mb-6 font-medium">
              If you encounter any issues or have questions about society registration, 
              please contact the campus admin at <span className="text-primary font-bold">admin@campus.com</span>.
            </p>
            <button className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/25">
              Contact Support
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
