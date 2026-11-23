import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { groupApi } from '../services/api';
import {
  Users,
  ArrowLeft,
  Sparkles,
  Plane,
  Home,
  Heart,
  Briefcase,
  HelpCircle,
  Loader2,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'Trip', label: 'Trip', icon: Plane, desc: 'Vacations, road trips, weekends' },
  { id: 'Home', label: 'Home', icon: Home, desc: 'Apartment rent, groceries, utilities' },
  { id: 'Friends', label: 'Friends', icon: Users, desc: 'Outings, parties, dinners' },
  { id: 'Couple', label: 'Couple', icon: Heart, desc: 'Shared household & dates' },
  { id: 'Office', label: 'Office', icon: Briefcase, desc: 'Coworkers, team lunches' },
  { id: 'Other', label: 'Other', icon: HelpCircle, desc: 'Miscellaneous shared expenses' }
];

export const CreateGroupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Trip');
  const [initialInvite, setInitialInvite] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await groupApi.create({
        name: name.trim(),
        description: description.trim(),
        category,
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name.trim())}`
      });

      if (data.success) {
        toast.success(`Group "${name}" created!`);

        // If an initial member was specified to invite
        if (initialInvite.trim()) {
          try {
            await groupApi.invite(data.group._id, initialInvite.trim());
            toast.success(`Invited ${initialInvite.trim()}`);
          } catch (e: any) {
            toast.error(e.response?.data?.message || 'Could not send invite');
          }
        }

        navigate(`/groups/${data.group._id}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/groups"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Create a New Group</h1>
          <p className="text-xs text-slate-400">Collaborate and split expenses in real time</p>
        </div>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Group Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Goa Trip 2026, Flat 402, Friday Dinners"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-3.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'border-brand-purple bg-brand-purple/15 shadow-glow'
                        : 'border-white/5 bg-navy-900/60 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-brand-purple' : 'text-slate-400'}`} />
                      {isSelected && <Check className="w-4 h-4 text-brand-purple" />}
                    </div>
                    <div className="text-xs font-bold text-white">{cat.label}</div>
                    <div className="text-[10px] text-slate-400 truncate">{cat.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Add details, flight dates, or apartment notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Invite First Member (Optional)
            </label>
            <input
              type="text"
              placeholder="Enter username or email (e.g. rahul or rahul@expensely.app)"
              value={initialInvite}
              onChange={(e) => setInitialInvite(e.target.value)}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              You can also invite more members via username or shareable link after creating the group.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <Link
              to="/groups"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:opacity-95 transition shadow-glow disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create Group</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
