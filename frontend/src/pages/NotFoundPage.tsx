import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center items-center px-6 relative text-center selection:bg-brand-purple/30 selection:text-white">
      <div className="w-[450px] h-[300px] bg-brand-purple/15 blur-[120px] rounded-full absolute pointer-events-none" />

      <div className="relative z-10 max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple mx-auto mb-6 shadow-glow">
          <Sparkles className="w-8 h-8" />
        </div>

        <h1 className="text-6xl font-black text-white tracking-tight mb-2">404</h1>
        <h2 className="text-xl font-bold text-white mb-3">Page Not Found</h2>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          The page or expense record you're looking for doesn't exist, has been removed, or is private to another group.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:opacity-95 shadow-glow transition"
          >
            <Home className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 border border-white/10 hover:bg-white/5 transition"
          >
            <span>Landing Page</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
