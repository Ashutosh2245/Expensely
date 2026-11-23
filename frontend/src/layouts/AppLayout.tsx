import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { LayoutDashboard, Users, Plus, PieChart, History } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="md:pl-64 flex flex-col flex-1 pb-16 md:pb-0">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>

        <footer className="py-4 px-6 border-t border-white/5 text-center text-xs text-slate-500 mb-2 md:mb-0">
          Developed with <span className="text-coral-400">❤️</span> by{' '}
          <a
            href="https://www.linkedin.com/in/ashutosh-kumar-92612b236/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 font-medium transition inline-flex items-center gap-1 hover:underline"
          >
            <span>Ashutosh Kumar</span>
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z"/>
            </svg>
          </a>
        </footer>
      </div>

      {/* Modern Native-like Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-navy-950/95 backdrop-blur-xl border-t border-white/10 px-3 py-1.5 flex items-center justify-around shadow-2xl">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
              isActive ? 'text-brand-purple font-bold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[10px]">Home</span>
        </NavLink>

        <NavLink
          to="/groups"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
              isActive ? 'text-brand-purple font-bold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Users className="w-4 h-4" />
          <span className="text-[10px]">Groups</span>
        </NavLink>

        {/* Center Floating Elevated Add Button */}
        <NavLink
          to="/add-expense"
          className="flex flex-col items-center -mt-5"
          title="Add Expense"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-brand-purple to-brand-indigo flex items-center justify-center text-white shadow-glow border-2 border-navy-950 active:scale-95 transition-transform">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[9px] text-slate-300 font-semibold mt-0.5">Add</span>
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
              isActive ? 'text-brand-purple font-bold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <PieChart className="w-4 h-4" />
          <span className="text-[10px]">Analytics</span>
        </NavLink>

        <NavLink
          to="/activity"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
              isActive ? 'text-brand-purple font-bold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <History className="w-4 h-4" />
          <span className="text-[10px]">Activity</span>
        </NavLink>
      </nav>
    </div>
  );
};
