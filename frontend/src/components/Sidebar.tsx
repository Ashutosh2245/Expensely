import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  CreditCard,
  PieChart,
  History,
  UserCheck,
  Bell,
  Settings,
  X,
  Sparkles
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Groups', path: '/groups', icon: Users },
  { name: 'Add Expense', path: '/add-expense', icon: PlusCircle },
  { name: 'Settle Up', path: '/settle-up', icon: CreditCard },
  { name: 'Analytics', path: '/analytics', icon: PieChart },
  { name: 'Activity', path: '/activity', icon: History },
  { name: 'Friends', path: '/friends', icon: UserCheck },
  { name: 'Notifications', path: '/notifications', icon: Bell, badge: true },
  { name: 'Settings', path: '/settings', icon: Settings }
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { unreadCount } = useNotifications();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-navy-950/80 backdrop-blur-sm md:hidden animate-fade-in"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 glass-panel border-r border-white/5 bg-navy-950/95 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/5">
          <Link to="/dashboard" onClick={onClose} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-indigo flex items-center justify-center text-white font-black shadow-glow group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white block leading-none">
                EXPENSELY
              </span>
              <span className="text-[10px] text-brand-purple font-medium tracking-wide">
                Split Smart. Live Better.
              </span>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-purple/20 to-brand-indigo/10 text-white border border-brand-purple/30 shadow-glow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>{item.name}</span>
                </div>
                {item.badge && unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-coral-500 text-white">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Quick CTA Bottom Card */}
        <div className="p-4 border-t border-white/5">
          <div className="glass-card rounded-2xl p-3.5 border border-brand-purple/20 bg-gradient-to-br from-brand-purple/10 to-transparent">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-white">Quick Split</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3 leading-snug">
              Add shared bills instantly without manual calculations.
            </p>
            <Link
              to="/add-expense"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-brand-purple to-brand-indigo text-white text-xs font-semibold hover:opacity-95 transition shadow-glow"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New Expense
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};
