import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Settings as SettingsIcon,
  Bell,
  Coins,
  ShieldCheck,
  Moon,
  Trash2,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  const [currency, setCurrency] = useState('INR');
  const [defaultSplit, setDefaultSplit] = useState('EQUAL');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [realtimeSounds, setRealtimeSounds] = useState(true);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Application preferences updated!');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="pb-2 border-b border-white/5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Customize your experience, default behaviors, and notifications
        </p>
      </div>

      <form onSubmit={handleSavePreferences} className="space-y-6">
        {/* Financial Preferences */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 shadow-xl space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-400" />
            <span>Financial & Split Preferences</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Default Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm text-white bg-navy-900"
              >
                <option value="INR">INR (₹) – Indian Rupee</option>
                <option value="USD">USD ($) – US Dollar</option>
                <option value="EUR">EUR (€) – Euro</option>
                <option value="GBP">GBP (£) – British Pound</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Default Splitting Mode
              </label>
              <select
                value={defaultSplit}
                onChange={(e) => setDefaultSplit(e.target.value)}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm text-white bg-navy-900"
              >
                <option value="EQUAL">Equal Split</option>
                <option value="EXACT">Exact Share Amounts</option>
                <option value="PERCENTAGE">Custom Percentages</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand-purple" />
            <span>Notification Settings</span>
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition cursor-pointer">
              <div>
                <div className="text-xs font-bold text-white">Email Notifications</div>
                <div className="text-[11px] text-slate-400">Receive email alerts for new invitations and major expense splits</div>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-brand-purple focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition cursor-pointer">
              <div>
                <div className="text-xs font-bold text-white">Realtime Socket Alerts</div>
                <div className="text-[11px] text-slate-400">Display instant toast popups when peers log transactions</div>
              </div>
              <input
                type="checkbox"
                checked={realtimeSounds}
                onChange={(e) => setRealtimeSounds(e.target.checked)}
                className="w-4 h-4 rounded text-brand-purple focus:ring-0 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:opacity-95 shadow-glow"
          >
            Save Preferences
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="glass-panel p-6 rounded-2xl border border-coral-500/20 bg-coral-500/5 space-y-3">
        <h3 className="text-sm font-bold text-coral-400 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          <span>Account Data & Security</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Need to export your personal data or close your EXPENSELY account? Make sure all pending group dues are cleared first.
        </p>
      </div>
    </div>
  );
};
