import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  groupApi,
  expenseApi,
  settlementApi,
  balanceApi,
  activityApi
} from '../services/api';
import { getSocket } from '../services/socket';
import {
  Group,
  Expense,
  Settlement,
  GroupBalancesResponse,
  ActivityItem
} from '../types';
import { Modal } from '../components/Modal';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import {
  Users,
  PlusCircle,
  CreditCard,
  UserPlus,
  Share2,
  Calendar,
  Receipt,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Copy,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export const GroupDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group | null>(null);
  const [balances, setBalances] = useState<GroupBalancesResponse | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('MEMBER');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'members' | 'activity'>('expenses');

  // Modals state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteIdentifier, setInviteIdentifier] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [settleToUser, setSettleToUser] = useState<string>('');
  const [settleAmount, setSettleAmount] = useState<string>('');
  const [settleMethod, setSettleMethod] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER'>('UPI');
  const [settleNotes, setSettleNotes] = useState('');
  const [settleLoading, setSettleLoading] = useState(false);

  // Selected receipt for preview modal
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);

  const loadGroupData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [grpRes, expRes, setRes, actRes] = await Promise.all([
        groupApi.getById(id),
        expenseApi.getByGroup(id),
        settlementApi.getByGroup(id),
        activityApi.getGroupActivities(id)
      ]);

      if (grpRes.data.success) {
        setGroup(grpRes.data.group);
        setBalances(grpRes.data.balances);
        setCurrentUserRole(grpRes.data.currentUserRole);
      }
      if (expRes.data.success) {
        setExpenses(expRes.data.expenses);
      }
      if (setRes.data.success) {
        setSettlements(setRes.data.settlements);
      }
      if (actRes.data.success) {
        setActivities(actRes.data.activities);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load group details');
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadGroupData();

    // Socket.io room subscription
    const socket = getSocket();
    if (socket && id) {
      socket.emit('join:group', id);

      const handleExpenseCreated = (newExp: Expense) => {
        setExpenses((prev) => [newExp, ...prev]);
        toast.success(`New expense: "${newExp.description}"`);
        refreshBalances();
      };

      const handleExpenseDeleted = () => {
        toast('An expense was deleted', { icon: '🗑️' });
        loadGroupData();
      };

      const handleBalanceUpdated = (newBal: GroupBalancesResponse) => {
        setBalances(newBal);
      };

      const handleMemberJoined = () => {
        toast.success('A new member joined the group!');
        loadGroupData();
      };

      socket.on('expense:created', handleExpenseCreated);
      socket.on('expense:deleted', handleExpenseDeleted);
      socket.on('balance:updated', handleBalanceUpdated);
      socket.on('member:joined', handleMemberJoined);

      return () => {
        socket.emit('leave:group', id);
        socket.off('expense:created', handleExpenseCreated);
        socket.off('expense:deleted', handleExpenseDeleted);
        socket.off('balance:updated', handleBalanceUpdated);
        socket.off('member:joined', handleMemberJoined);
      };
    }
  }, [id, loadGroupData]);

  const refreshBalances = async () => {
    if (!id) return;
    try {
      const { data } = await balanceApi.getGroupBalances(id);
      if (data.success) setBalances(data.balances);
    } catch (e) {}
  };

  const handleCopyInviteLink = () => {
    if (!group) return;
    const url = `${window.location.origin}/join/${group.inviteCode}`;
    navigator.clipboard.writeText(url);
    toast.success('Invite link copied to clipboard!');
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !inviteIdentifier.trim()) return;

    try {
      setInviteLoading(true);
      const { data } = await groupApi.invite(id, inviteIdentifier.trim());
      if (data.success) {
        toast.success(data.message || 'Invitation sent successfully!');
        setIsInviteOpen(false);
        setInviteIdentifier('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleTriggerSettleModal = (toUserId?: string, amount?: number) => {
    if (toUserId) setSettleToUser(toUserId);
    if (amount) setSettleAmount(amount.toString());
    setIsSettleOpen(true);
  };

  const handleSubmitSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !settleToUser || !settleAmount || !user) {
      toast.error('Please provide the recipient and settlement amount');
      return;
    }

    try {
      setSettleLoading(true);
      const { data } = await settlementApi.create({
        groupId: id,
        fromUser: user._id,
        toUser: settleToUser,
        amount: parseFloat(settleAmount),
        paymentMethod: settleMethod,
        notes: settleNotes,
        autoConfirm: true
      });

      if (data.success) {
        toast.success(data.message || 'Settlement recorded successfully!');
        setIsSettleOpen(false);
        setSettleAmount('');
        setSettleNotes('');
        loadGroupData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record settlement');
    } finally {
      setSettleLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await expenseApi.delete(expenseId);
      setExpenses((prev) => prev.filter((e) => e._id !== expenseId));
      refreshBalances();
      toast.success('Expense deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  if (loading || !group) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={1} className="h-44" />
        <LoadingSkeleton count={3} className="h-28" />
      </div>
    );
  }

  const myBalance = balances?.balances?.find((b) => b.userId === user?._id);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={group.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${group.name}`}
              alt={group.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-purple/40 shadow-glow shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">{group.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
                  {group.category}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                  {currentUserRole}
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-1">
                {group.description || 'Collaborative expense sharing group'}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCopyInviteLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 border border-white/10 hover:bg-white/5 transition"
              title="Copy shareable link"
            >
              <Share2 className="w-4 h-4 text-brand-purple" />
              <span>Invite Link</span>
            </button>

            <button
              onClick={() => setIsInviteOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 border border-white/10 hover:bg-white/5 transition"
            >
              <UserPlus className="w-4 h-4 text-indigo-400" />
              <span>Add Member</span>
            </button>

            <button
              onClick={() => handleTriggerSettleModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
            >
              <CreditCard className="w-4 h-4" />
              <span>Settle Up</span>
            </button>

            <Link
              to={`/add-expense?groupId=${group._id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:opacity-95 transition shadow-glow"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Expense</span>
            </Link>
          </div>
        </div>

        {/* Financial Net Status Pill */}
        <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between text-xs gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Group Spending</span>
              <span className="text-white font-bold text-sm">₹{balances?.totalExpensesFormatted || '0.00'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Your Total Paid</span>
              <span className="text-white font-bold text-sm">₹{myBalance?.totalPaid.toFixed(2) || '0.00'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Your Share</span>
              <span className="text-white font-bold text-sm">₹{myBalance?.totalShare.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Your Net Balance:</span>
            <span
              className={`text-sm font-extrabold px-3 py-1 rounded-xl border ${
                myBalance && myBalance.netBalance > 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-glow-emerald'
                  : myBalance && myBalance.netBalance < 0
                  ? 'bg-coral-500/10 text-coral-400 border-coral-500/20 shadow-glow-coral'
                  : 'bg-white/5 text-slate-300 border-white/10'
              }`}
            >
              {myBalance && myBalance.netBalance > 0
                ? `+₹${myBalance.netBalance.toFixed(2)} (Owed)`
                : myBalance && myBalance.netBalance < 0
                ? `-₹${Math.abs(myBalance.netBalance).toFixed(2)} (Owes)`
                : 'Settled Up (₹0.00)'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeTab === 'expenses'
              ? 'bg-brand-purple text-white shadow-glow'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Expenses ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('balances')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeTab === 'balances'
              ? 'bg-brand-purple text-white shadow-glow'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Balances & Simplification
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeTab === 'members'
              ? 'bg-brand-purple text-white shadow-glow'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Members ({group.members?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeTab === 'activity'
              ? 'bg-brand-purple text-white shadow-glow'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Activity Log
        </button>
      </div>

      {/* Tab 1: Expenses List */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {expenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No expenses added yet"
              description="Split your first dinner, taxi, or ticket with the group."
              actionText="Add First Expense"
              actionLink={`/add-expense?groupId=${group._id}`}
            />
          ) : (
            <div className="space-y-3">
              {expenses.map((exp) => {
                const isPayer = exp.paidBy?._id === user?._id;
                const myShareObj = exp.participants?.find((p) => p.user?._id === user?._id);
                const myShareAmount = myShareObj ? myShareObj.share || (myShareObj.shareInPaise / 100) : 0;

                return (
                  <div
                    key={exp._id}
                    className="glass-panel p-4 rounded-2xl border border-white/5 hover:border-white/15 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-brand-purple/10 border border-brand-purple/20 text-brand-purple flex items-center justify-center font-bold text-sm shrink-0">
                        {exp.category?.charAt(0) || 'E'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-brand-purple transition">
                          {exp.description}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{exp.category}</span>
                          <span>•</span>
                          <span>Paid by <strong className="text-slate-300 font-semibold">{exp.paidBy?.fullName}</strong></span>
                          <span>•</span>
                          <span>{new Date(exp.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      {/* Amounts */}
                      <div className="text-right">
                        <div className="text-base font-extrabold text-white">
                          ₹{exp.amount.toFixed(2)}
                        </div>
                        <div className="text-[11px]">
                          {isPayer ? (
                            <span className="text-emerald-400 font-medium">
                              You paid full
                            </span>
                          ) : myShareObj ? (
                            <span className="text-coral-400 font-medium">
                              Your share: ₹{myShareAmount.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-500">Not participating</span>
                          )}
                        </div>
                      </div>

                      {/* Receipt & Delete actions */}
                      <div className="flex items-center gap-1.5">
                        {exp.receipt && (
                          <button
                            onClick={() => setReceiptPreviewUrl(exp.receipt!)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-purple hover:bg-white/5 transition"
                            title="View Receipt"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        )}
                        {(exp.createdBy?._id === user?._id || exp.paidBy?._id === user?._id || currentUserRole === 'OWNER') && (
                          <button
                            onClick={() => handleDeleteExpense(exp._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-coral-400 hover:bg-white/5 transition"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Balances & Debt Simplification */}
      {activeTab === 'balances' && (
        <div className="space-y-6">
          {/* Optimal Debt Simplification Recommendations */}
          <div className="glass-panel p-6 rounded-2xl border border-brand-purple/20 bg-gradient-to-br from-brand-purple/5 to-transparent space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-purple" />
              <div>
                <h3 className="text-base font-bold text-white">
                  Optimized Settlement Path (Min-Cash-Flow)
                </h3>
                <p className="text-xs text-slate-400">
                  Minimal peer-to-peer transactions calculated to square all debts with 100% precision.
                </p>
              </div>
            </div>

            {balances?.simplifiedDebts?.length === 0 ? (
              <div className="p-6 text-center text-xs text-emerald-400 font-semibold bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                🎉 All group members are completely settled up! Zero balance remaining.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {balances?.simplifiedDebts?.map((deb, idx) => {
                  const isYouPaying = deb.fromUser._id === user?._id;
                  const isYouReceiving = deb.toUser._id === user?._id;

                  return (
                    <div
                      key={idx}
                      className={`glass-card p-4 rounded-xl border flex items-center justify-between gap-3 ${
                        isYouPaying
                          ? 'border-coral-500/30 bg-coral-500/5'
                          : isYouReceiving
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : 'border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={deb.fromUser.avatar}
                          alt={deb.fromUser.fullName}
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10"
                        />
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{isYouPaying ? 'You' : deb.fromUser.fullName}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span>{isYouReceiving ? 'You' : deb.toUser.fullName}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Suggested settlement transfer
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-white">
                          ₹{deb.amountFormatted}
                        </span>

                        {isYouPaying && (
                          <button
                            onClick={() => handleTriggerSettleModal(deb.toUser._id, deb.amount)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-95 shadow-glow-emerald transition"
                          >
                            Settle Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Individual Member Balances Table */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-base font-bold text-white">Group Balance Breakdown</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Member</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Total Paid</th>
                    <th className="pb-3">Total Share</th>
                    <th className="pb-3 text-right">Net Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {balances?.balances?.map((b) => (
                    <tr key={b.userId} className="hover:bg-white/5 transition">
                      <td className="py-3 flex items-center gap-3">
                        <img
                          src={b.user.avatar}
                          alt={b.user.fullName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-bold text-white">
                            {b.user.fullName} {b.userId === user?._id && '(You)'}
                          </div>
                          <div className="text-[10px] text-slate-400">@{b.user.username}</div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-300">
                          {b.role}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-white">₹{b.totalPaid.toFixed(2)}</td>
                      <td className="py-3 font-semibold text-slate-300">₹{b.totalShare.toFixed(2)}</td>
                      <td className="py-3 text-right">
                        <span
                          className={`font-bold ${
                            b.netBalance > 0
                              ? 'text-emerald-400'
                              : b.netBalance < 0
                              ? 'text-coral-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {b.netBalance > 0
                            ? `+₹${b.netBalance.toFixed(2)}`
                            : b.netBalance < 0
                            ? `-₹${Math.abs(b.netBalance).toFixed(2)}`
                            : '₹0.00'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Group Members */}
      {activeTab === 'members' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h3 className="text-base font-bold text-white">Group Members</h3>
              <p className="text-xs text-slate-400">Collaborating in this shared workspace</p>
            </div>
            <button
              onClick={() => setIsInviteOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:opacity-90 shadow-glow transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Member</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {group.members?.map((m) => (
              <div
                key={m.user?._id || m.user?.id}
                className="glass-card p-4 rounded-xl border border-white/5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={m.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${m.user?.fullName}`}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {m.user?.fullName} {m.user?._id === user?._id && '(You)'}
                    </h4>
                    <p className="text-[11px] text-brand-purple">@{m.user?.username}</p>
                    <span className="text-[10px] text-slate-500">
                      Joined {new Date(m.joinedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/5 text-slate-300">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Activity Log */}
      {activeTab === 'activity' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-base font-bold text-white">Group Activity History</h3>

          {activities.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No activity recorded yet</p>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => (
                <div key={act._id} className="flex items-start gap-3 text-xs pb-3 border-b border-white/5 last:border-0">
                  <img
                    src={act.userId?.avatar}
                    alt="avatar"
                    className="w-7 h-7 rounded-lg object-cover mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-slate-200">{act.description}</p>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {new Date(act.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Invite Member */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite Member to Group"
      >
        <form onSubmit={handleSendInvite} className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Invite an existing EXPENSELY user by entering their unique username or email address.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Username or Email
            </label>
            <input
              type="text"
              required
              placeholder="e.g. rahul or rahul@expensely.app"
              value={inviteIdentifier}
              onChange={(e) => setInviteIdentifier(e.target.value)}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="truncate pr-2">
              <span className="text-[11px] text-slate-400 block">Or share invite code:</span>
              <span className="text-xs font-mono font-bold text-white">{group.inviteCode}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-brand-purple bg-brand-purple/10 hover:bg-brand-purple/20 transition shrink-0"
            >
              Copy Link
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsInviteOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviteLoading}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:opacity-95 shadow-glow disabled:opacity-50"
            >
              {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Invite'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Settle Up */}
      <Modal
        isOpen={isSettleOpen}
        onClose={() => setIsSettleOpen(false)}
        title="Record Payment & Settle Up"
      >
        <form onSubmit={handleSubmitSettlement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Who are you paying? *
            </label>
            <select
              value={settleToUser}
              onChange={(e) => setSettleToUser(e.target.value)}
              required
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm text-white bg-navy-900"
            >
              <option value="">Select recipient...</option>
              {group.members
                ?.filter((m) => m.user?._id !== user?._id)
                .map((m) => (
                  <option key={m.user?._id} value={m.user?._id}>
                    {m.user?.fullName} (@{m.user?.username})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={settleAmount}
              onChange={(e) => setSettleAmount(e.target.value)}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm text-white font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['UPI', 'CASH', 'BANK_TRANSFER', 'OTHER'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setSettleMethod(method)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                    settleMethod === method
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-glow-emerald'
                      : 'border-white/5 bg-navy-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  {method === 'BANK_TRANSFER' ? 'Bank Transfer' : method}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Payment Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Paid via GPay / UTR: 1234..."
              value={settleNotes}
              onChange={(e) => setSettleNotes(e.target.value)}
              className="glass-input w-full px-4 py-2 rounded-xl text-sm text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsSettleOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={settleLoading}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-95 shadow-glow-emerald disabled:opacity-50"
            >
              {settleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Receipt Preview */}
      <Modal
        isOpen={!!receiptPreviewUrl}
        onClose={() => setReceiptPreviewUrl(null)}
        title="Receipt Preview"
      >
        <div className="p-2 text-center">
          {receiptPreviewUrl && (
            <img
              src={receiptPreviewUrl}
              alt="Receipt"
              className="max-h-96 mx-auto rounded-xl object-contain border border-white/10"
            />
          )}
        </div>
      </Modal>
    </div>
  );
};
