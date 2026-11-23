import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  PieChart,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  Layers,
  Smartphone,
  CreditCard
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: 'How does the Debt Simplification algorithm work?',
      a: 'EXPENSELY uses an advanced min-cash-flow algorithm that analyzes the net balance of every group member and automatically calculates the minimal number of payment transactions required to settle everyone up.'
    },
    {
      q: 'Can I split expenses unequally or by percentage?',
      a: 'Yes! We support Equal split, Exact manual amounts, and Percentage-based splits with integer paise precision to eliminate rounding errors.'
    },
    {
      q: 'How does real-time synchronization work?',
      a: 'EXPENSELY uses WebSockets (Socket.io) to instantly push expense creations, edits, and settlements to all connected devices in real time.'
    },
    {
      q: 'Is Google Sign-In supported?',
      a: 'Yes! You can sign in using your Google account or register with a unique username and secure password.'
    }
  ];

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col selection:bg-brand-purple/30 selection:text-white">
      {/* Top Marketing Navbar */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-white/5 bg-navy-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-indigo flex items-center justify-center text-white shadow-glow group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white block leading-none">
                EXPENSELY
              </span>
              <span className="text-[10px] text-brand-purple font-medium tracking-wide">
                Split Smart. Live Better.
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
            <a href="#security" className="hover:text-white transition">Security</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-xl hover:bg-white/5 transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-indigo hover:opacity-95 transition shadow-glow"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-6 overflow-hidden">
        {/* Glow background effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-brand-purple/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-purple/30 bg-brand-purple/10 text-brand-purple text-xs font-semibold mb-8 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation Collaborative Expense Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
            Money Matters.{' '}
            <span className="bg-gradient-to-r from-brand-purple via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Friendship Doesn't.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed mb-10">
            Effortlessly share costs with friends, housemates, and travel crews. Real-time balance simplification, zero floating-point errors, and instant settlements.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:opacity-95 transition shadow-glow"
            >
              <span>Start Splitting for Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-slate-200 border border-white/10 hover:bg-white/5 transition"
            >
              <span>Explore Demo Workspace</span>
            </Link>
          </div>

          {/* Interactive Dashboard Preview Mockup */}
          <div className="relative mx-auto max-w-4xl rounded-2xl p-2 bg-gradient-to-b from-white/15 to-white/5 shadow-2xl backdrop-blur-xl">
            <div className="rounded-xl overflow-hidden glass-panel border border-white/10 bg-navy-900/90 p-6 text-left">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-coral-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-slate-400 font-mono ml-2">app.expensely.com/dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs text-emerald-400 font-medium">Socket Connected</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="glass-card p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <span className="text-xs font-medium text-slate-400">You Are Owed</span>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">+₹12,350.00</div>
                  <span className="text-[11px] text-emerald-500/80">Across 3 active groups</span>
                </div>
                <div className="glass-card p-4 rounded-xl border border-coral-500/20 bg-coral-500/5">
                  <span className="text-xs font-medium text-slate-400">You Owe</span>
                  <div className="text-2xl font-bold text-coral-400 mt-1">₹0.00</div>
                  <span className="text-[11px] text-slate-400">All balances cleared</span>
                </div>
                <div className="glass-card p-4 rounded-xl border border-brand-purple/20 bg-brand-purple/5">
                  <span className="text-xs font-medium text-slate-400">Total Goa Expenses</span>
                  <div className="text-2xl font-bold text-white mt-1">₹36,600.00</div>
                  <span className="text-[11px] text-brand-purple">4 members participating</span>
                </div>
              </div>

              <div className="glass-card p-4 rounded-xl border border-white/10">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Optimal Debt Simplification (Min-Cash-Flow)
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-navy-950/60 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">
                        R
                      </div>
                      <span className="text-xs font-medium text-slate-200">Rahul Sharma owes Ashutosh</span>
                    </div>
                    <span className="text-xs font-bold text-coral-400">₹4,850.00</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-navy-950/60 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-xs">
                        P
                      </div>
                      <span className="text-xs font-medium text-slate-200">Priya Singh owes Ashutosh</span>
                    </div>
                    <span className="text-xs font-bold text-coral-400">₹3,850.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-24 px-6 border-t border-white/5 relative bg-navy-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Engineered for Precision & Collaborative Speed
            </h2>
            <p className="text-slate-400 text-base">
              Say goodbye to confusing spreadsheets and awkward reminders. EXPENSELY automates everything with production-grade reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-brand-purple/40 transition-all hover:shadow-glow group">
              <div className="w-12 h-12 rounded-xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Min-Cash-Flow Engine</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Our greedy debt simplification algorithm reduces complex multi-way debts to the minimal possible number of direct peer-to-peer transfers.
              </p>
            </div>

            <div className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-emerald-500/40 transition-all hover:shadow-glow-emerald group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Integer Paise Precision</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Never lose a single paisa to IEEE 754 floating point rounding quirks. Every transaction is calculated and verified in integer paise with zero-sum guarantees.
              </p>
            </div>

            <div className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-indigo-500/40 transition-all hover:shadow-glow group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Real-Time Synchronization</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Connected over WebSocket rooms. The moment a member adds dinner or settles rent, all group members see live balance updates instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              How EXPENSELY Works in 3 Steps
            </h2>
            <p className="text-slate-400 text-base">
              Get your entire group on the same page in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-6 rounded-2xl border border-white/5 relative">
              <div className="text-3xl font-black text-brand-purple/40 mb-4">01</div>
              <h3 className="text-lg font-bold text-white mb-2">Create or Join a Group</h3>
              <p className="text-sm text-slate-400">
                Start a group for your trip, apartment, or outing and invite friends by username, email, or a shareable link.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/5 relative">
              <div className="text-3xl font-black text-brand-purple/40 mb-4">02</div>
              <h3 className="text-lg font-bold text-white mb-2">Log Bills & Splits</h3>
              <p className="text-sm text-slate-400">
                Add expenses with equal, exact, or percentage splits. Attach receipts and select categories for analytics.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/5 relative">
              <div className="text-3xl font-black text-brand-purple/40 mb-4">03</div>
              <h3 className="text-lg font-bold text-white mb-2">Settle Up Seamlessly</h3>
              <p className="text-sm text-slate-400">
                View smart simplified settlements. Pay via UPI, cash, or bank transfer and confirm receipts with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 px-6 border-t border-white/5 bg-navy-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Security & Data Integrity at Heart
          </h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto mb-8">
            EXPENSELY uses salted bcrypt password hashing, short-lived JWT access tokens with secure refresh token rotation, strict role-based group authorization, and sanitized input validation.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-300">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Role-Based Access Control
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              JWT Refresh Rotation
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Zero-Sum Audit Invariant
            </span>
          </div>
        </div>
      </section>

      {/* Testimonials (Demo Content) */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Loved by Friends & Roommates
            </h2>
            <p className="text-xs uppercase tracking-widest text-brand-purple font-semibold">
              Demo Testimonials
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/5">
              <p className="text-sm text-slate-300 italic mb-4">
                "Our Goa trip with 5 friends used to take hours of manual math. With EXPENSELY, we settled 20+ expenses in 2 clicks!"
              </p>
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60"
                  alt="Ashutosh"
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <div className="text-xs font-semibold text-white">Ashutosh Kumar</div>
                  <div className="text-[10px] text-slate-400">Software Architect</div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/5">
              <p className="text-sm text-slate-300 italic mb-4">
                "Managing rent, groceries, and WiFi bills across our 3BHK flat has never been smoother. The UI feels like a funded SaaS."
              </p>
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=60"
                  alt="Rahul"
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <div className="text-xs font-semibold text-white">Rahul Sharma</div>
                  <div className="text-[10px] text-slate-400">Flatmate & Member</div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/5">
              <p className="text-sm text-slate-300 italic mb-4">
                "The real-time updates and debt simplification are game changers. You know exactly what you owe at any moment."
              </p>
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60"
                  alt="Priya"
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <div className="text-xs font-semibold text-white">Priya Singh</div>
                  <div className="text-[10px] text-slate-400">Travel Enthusiast</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20 px-6 border-t border-white/5 bg-navy-900/20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-white text-center mb-10">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="glass-panel rounded-2xl border border-white/5 overflow-hidden transition"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between p-5 text-left font-semibold text-white hover:text-brand-purple transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                      openFaq === i ? 'rotate-180 text-brand-purple' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 py-12 px-6 bg-navy-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-purple flex items-center justify-center text-white font-bold text-sm shadow-glow">
              E
            </div>
            <span className="font-bold text-white text-sm tracking-tight">EXPENSELY</span>
            <span className="text-slate-500 text-xs">© 2026 EXPENSELY. Split Smart. Live Better.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link to="/login" className="hover:text-white transition">Sign In</Link>
            <Link to="/register" className="hover:text-white transition">Register</Link>
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#security" className="hover:text-white transition">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
