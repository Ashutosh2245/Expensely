import React, { useState, useEffect } from 'react';
import { friendApi, userApi } from '../services/api';
import { Friend } from '../types';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import {
  UserCheck,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  Clock,
  Loader2,
  Mail
} from 'lucide-react';
import toast from 'react-hot-toast';

export const FriendsPage: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add friend search / submit
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  const loadFriendsData = async () => {
    try {
      setLoading(true);
      const [fRes, reqRes] = await Promise.all([
        friendApi.getAll(),
        friendApi.getRequests()
      ]);

      if (fRes.data.success) setFriends(fRes.data.friends || []);
      if (reqRes.data.success) {
        setIncoming(reqRes.data.incoming || []);
        setOutgoing(reqRes.data.outgoing || []);
      }
    } catch (err) {
      console.error('Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriendsData();
  }, []);

  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;

    try {
      setSearching(true);
      const { data } = await userApi.search(searchQuery.trim());
      if (data.success) {
        setSearchResults(data.users || []);
        if (data.users.length === 0) {
          toast('No users found matching that username or email', { icon: '🔍' });
        }
      }
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleSendFriendRequest = async (usernameOrEmail: string) => {
    try {
      setSendingRequest(usernameOrEmail);
      const { data } = await friendApi.sendRequest(usernameOrEmail);
      if (data.success) {
        toast.success(data.message || 'Friend request sent!');
        loadFriendsData();
        setSearchResults((prev) => prev.filter((u) => u.username !== usernameOrEmail && u.email !== usernameOrEmail));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally {
      setSendingRequest(null);
    }
  };

  const handleAcceptRequest = async (reqId: string) => {
    try {
      const { data } = await friendApi.acceptRequest(reqId);
      if (data.success) {
        toast.success(data.message || 'Friend request accepted!');
        loadFriendsData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (reqId: string) => {
    try {
      await friendApi.rejectRequest(reqId);
      toast.success('Request declined');
      setIncoming((prev) => prev.filter((r) => r._id !== reqId));
    } catch (err) {
      toast.error('Failed to decline request');
    }
  };

  const handleRemoveFriend = async (friendId: string, name: string) => {
    if (!confirm(`Are you sure you want to unfriend ${name}?`)) return;
    try {
      await friendApi.removeFriend(friendId);
      toast.success(`${name} removed from friends`);
      setFriends((prev) => prev.filter((f) => f._id !== friendId));
    } catch (err) {
      toast.error('Failed to remove friend');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-white/5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Friends
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Connect with peers to quickly split expenses across groups
        </p>
      </div>

      {/* Add Friend Search Box */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-brand-purple" />
          <span>Add Friends by Username or Email</span>
        </h3>

        <form onSubmit={handleSearchUsers} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by username or email (e.g. rahul or rahul@expensely.app)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:opacity-95 shadow-glow disabled:opacity-50"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find User'}
          </button>
        </form>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="pt-2 border-t border-white/5 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400">Search Results:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {searchResults.map((u) => (
                <div
                  key={u._id}
                  className="glass-card p-3 rounded-xl border border-white/10 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <img
                      src={u.avatar}
                      alt={u.fullName}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate">{u.fullName}</div>
                      <div className="text-[10px] text-brand-purple truncate">@{u.username}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendFriendRequest(u.username)}
                    disabled={sendingRequest === u.username}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-purple hover:bg-brand-purple/80 transition shrink-0 disabled:opacity-50"
                  >
                    {sendingRequest === u.username ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pending Friend Requests */}
      {incoming.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl border border-brand-purple/20 bg-brand-purple/5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-purple">
            <Clock className="w-4 h-4" />
            <span>Friend Requests Received ({incoming.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {incoming.map((req) => (
              <div
                key={req._id}
                className="glass-card p-3.5 rounded-xl border border-white/10 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={req.sender?.avatar}
                    alt={req.sender?.fullName}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white">{req.sender?.fullName}</h4>
                    <p className="text-[10px] text-slate-400">@{req.sender?.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleAcceptRequest(req._id)}
                    className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectRequest(req._id)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Friends List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white">Your Friends ({friends.length})</h3>

        {loading ? (
          <LoadingSkeleton count={3} className="h-20" />
        ) : friends.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No friends added yet"
            description="Search by username to add your roommates and trip buddies."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <div
                key={friend._id}
                className="glass-panel p-4 rounded-xl border border-white/5 hover:border-white/15 transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 truncate">
                  <img
                    src={friend.avatar}
                    alt={friend.fullName}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10 shrink-0"
                  />
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-white truncate">{friend.fullName}</h4>
                    <p className="text-[11px] text-brand-purple truncate">@{friend.username}</p>
                    <p className="text-[10px] text-slate-500 truncate">{friend.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveFriend(friend._id, friend.fullName)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-coral-400 hover:bg-white/5 transition shrink-0"
                  title="Remove Friend"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
