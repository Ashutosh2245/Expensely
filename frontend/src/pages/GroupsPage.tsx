import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { groupApi, invitationApi } from '../services/api';
import { Group, GroupInvitation } from '../types';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import {
  Users,
  PlusCircle,
  Search,
  CheckCircle2,
  XCircle,
  Share2,
  Clock,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = ['ALL', 'Trip', 'Home', 'Friends', 'Couple', 'Office', 'Other'];

  const fetchGroupsAndInvites = async () => {
    try {
      setLoading(true);
      const [grpRes, invRes] = await Promise.all([
        groupApi.getAll(),
        invitationApi.getAll()
      ]);
      if (grpRes.data.success) setGroups(grpRes.data.groups);
      if (invRes.data.success) setInvitations(invRes.data.invitations || []);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupsAndInvites();
  }, []);

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      const { data } = await invitationApi.accept(inviteId);
      if (data.success) {
        toast.success(data.message || 'Invitation accepted!');
        fetchGroupsAndInvites();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept invitation');
    }
  };

  const handleRejectInvite = async (inviteId: string) => {
    try {
      await invitationApi.reject(inviteId);
      toast.success('Invitation declined');
      setInvitations((prev) => prev.filter((inv) => inv._id !== inviteId));
    } catch (err) {
      toast.error('Failed to decline invitation');
    }
  };

  const filteredGroups = groups.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || g.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Groups
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your shared trips, apartments, and friend circles
          </p>
        </div>

        <Link
          to="/create-group"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:opacity-95 transition shadow-glow shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Group</span>
        </Link>
      </div>

      {/* Pending Invitations Banner (if any) */}
      {invitations.length > 0 && (
        <div className="glass-panel p-4 rounded-2xl border border-brand-purple/30 bg-brand-purple/5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-purple">
            <Clock className="w-4 h-4" />
            <span>Pending Group Invitations ({invitations.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {invitations.map((inv) => (
              <div
                key={inv._id}
                className="glass-card p-3 rounded-xl border border-white/10 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{inv.groupId?.name}</h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    Invited by {inv.invitedBy?.fullName}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleAcceptInvite(inv._id)}
                    className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition"
                    title="Accept Invitation"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRejectInvite(inv._id)}
                    className="p-1.5 rounded-lg bg-coral-500/20 text-coral-400 hover:bg-coral-500/30 transition"
                    title="Decline Invitation"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Category Filter Pills */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter groups by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-brand-purple text-white shadow-glow'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <LoadingSkeleton count={6} className="h-44" />
        </div>
      ) : filteredGroups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No groups found"
          description={
            search
              ? `No groups match your search "${search}". Try adjusting your keywords.`
              : 'You have not joined any expense groups yet.'
          }
          actionText="Create Group"
          actionLink="/create-group"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((group) => {
            const bal = group.userNetBalance || 0;
            return (
              <Link
                key={group._id}
                to={`/groups/${group._id}`}
                className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-brand-purple/40 hover:shadow-glow transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <img
                      src={group.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${group.name}`}
                      alt={group.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-1 ring-white/10 group-hover:scale-105 transition-transform"
                    />
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
                      {group.category}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-brand-purple transition truncate">
                    {group.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {group.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{group.membersCount || group.members?.length || 0} Members</span>
                    <span>Total: ₹{group.totalExpenses || '0.00'}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400">Your Net Balance:</span>
                    <span
                      className={`text-sm font-bold ${
                        bal > 0
                          ? 'text-emerald-400'
                          : bal < 0
                          ? 'text-coral-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {bal > 0
                        ? `+₹${bal.toFixed(2)}`
                        : bal < 0
                        ? `-₹${Math.abs(bal).toFixed(2)}`
                        : 'Settled'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
