import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupApi, balanceApi, settlementApi } from '../services/api';
import { Group, SimplifiedDebt, Settlement } from '../types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Modal } from '../components/Modal';
import {
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  History,
  DollarSign,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export const SettleUpPage: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [suggestions, setSuggestions] = useState<SimplifiedDebt[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [settleToUser, setSettleToUser] = useState<string>('');
  const [settleAmount, setSettleAmount] = useState<string>('');
  const [settleMethod, setSettleMethod] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER'>('UPI');
  const [settleNotes, setSettleNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const { data } = await groupApi.getAll();
        if (data.success && data.groups.length > 0) {
          setGroups(data.groups);
          setSelectedGroupId(data.groups[0]._id);
        }
      } catch (err) {
        console.error('Failed to load groups');
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const loadGroupSettlementData = async (gId: string) => {
    try {
      const [sugRes, setRes] = await Promise.all([
        balanceApi.getSuggestions(gId),
        settlementApi.getByGroup(gId)
      ]);
      if (sugRes.data.success) {
        setSuggestions(sugRes.data.suggestions || []);
      }
      if (setRes.data.success) {
        setSettlements(setRes.data.settlements || []);
      }
    } catch (e) {
      console.error('Failed to load suggestions');
    }
  };

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupSettlementData(selectedGroupId);
    }
  }, [selectedGroupId]);

  const handleOpenSettle = (toUserId?: string, defaultAmt?: number) => {
    if (toUserId) setSettleToUser(toUserId);
    if (defaultAmt) setSettleAmount(defaultAmt.toString());
    setIsModalOpen(true);
  };

  const handleConfirmSettlement = async (settlementId: string) => {
    try {
      const { data } = await settlementApi.confirm(settlementId);
      if (data.success) {
        toast.success('Payment confirmed and balances squared!');
        loadGroupSettlementData(selectedGroupId);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to confirm settlement');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !settleToUser || !settleAmount || !user) return;

    try {
      setSubmitting(true);
      const { data } = await settlementApi.create({
        groupId: selectedGroupId,
        fromUser: user._id,
        toUser: settleToUser,
        amount: parseFloat(settleAmount),
        paymentMethod: settleMethod,
        notes: settleNotes,
        autoConfirm: true
      });

      if (data.success) {
        toast.success(data.message || 'Settlement recorded successfully!');
        setIsModalOpen(false);
        setSettleAmount('');
        setSettleNotes('');
        loadGroupSettlementData(selectedGroupId);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record settlement');
    } finally {
      setSubmitting(false);
    }
  };

  const currentGroup = groups.find((g) => g._id === selectedGroupId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Settle Up
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Square debts instantly using optimized debt simplification
          </p>
        </div>

        {/* Group Selector Dropdown */}
        {groups.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Group:</span>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="glass-input px-3 py-2 rounded-xl text-xs sm:text-sm text-white font-semibold bg-navy-900 border border-white/10"
            >
              {groups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <LoadingSkeleton count={3} className="h-32" />
      ) : groups.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-white/5">
          <CreditCard className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Active Groups</h3>
          <p className="text-xs text-slate-400">Join or create a group to view balances and settle dues.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: Simplified Debts */}
          <div className="glass-panel p-6 rounded-2xl border border-brand-purple/20 bg-gradient-to-br from-brand-purple/5 to-transparent space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-purple/20 text-brand-purple flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Optimized Settlement Transactions
                  </h3>
                  <p className="text-xs text-slate-400">
                    Calculated by the Min-Cash-Flow engine to minimize total payments
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleOpenSettle()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-95 shadow-glow-emerald transition"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Custom Payment</span>
              </button>
            </div>

            {suggestions.length === 0 ? (
              <div className="p-6 text-center text-xs text-emerald-400 font-semibold bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                🎉 No pending debts in "{currentGroup?.name}"! Everyone is square.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {suggestions.map((sug, i) => {
                  const isYouPaying = sug.fromUser._id === user?._id;
                  const isYouReceiving = sug.toUser._id === user?._id;

                  return (
                    <div
                      key={i}
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
                          src={sug.fromUser.avatar}
                          alt="debtor"
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10"
                        />
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{isYouPaying ? 'You' : sug.fromUser.fullName}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span>{isYouReceiving ? 'You' : sug.toUser.fullName}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Suggested settlement transfer
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-white">
                          ₹{sug.amountFormatted}
                        </span>

                        {isYouPaying && (
                          <button
                            onClick={() => handleOpenSettle(sug.toUser._id, sug.amount)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-95 shadow-glow-emerald transition"
                          >
                            Pay Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Settlement History */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <h3 className="text-base font-bold text-white">Settlement History</h3>
            </div>

            {settlements.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No settlements recorded for this group yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="pb-3">Payer</th>
                      <th className="pb-3">Recipient</th>
                      <th className="pb-3">Method</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {settlements.map((set) => {
                      const isPending = set.status === 'PENDING';
                      const canConfirm = isPending && set.toUser._id === user?._id;

                      return (
                        <tr key={set._id} className="hover:bg-white/5 transition">
                          <td className="py-3 font-semibold text-white">
                            {set.fromUser?.fullName}
                          </td>
                          <td className="py-3 font-semibold text-white">
                            {set.toUser?.fullName}
                          </td>
                          <td className="py-3 text-slate-300 font-mono text-[11px]">
                            {set.paymentMethod}
                          </td>
                          <td className="py-3 font-bold text-emerald-400">
                            ₹{set.amount.toFixed(2)}
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                set.status === 'CONFIRMED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : set.status === 'PENDING'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-coral-500/10 text-coral-400 border border-coral-500/20'
                              }`}
                            >
                              {set.status}
                            </span>
                          </td>
                          <td className="py-3 text-slate-400 text-[11px]">
                            {new Date(set.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="py-3 text-right">
                            {canConfirm ? (
                              <button
                                onClick={() => handleConfirmSettlement(set._id)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition"
                              >
                                Confirm Receipt
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-500">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settle Up Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Settlement Payment"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Recipient *
            </label>
            <select
              value={settleToUser}
              onChange={(e) => setSettleToUser(e.target.value)}
              required
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm text-white bg-navy-900"
            >
              <option value="">Select recipient...</option>
              {currentGroup?.members
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
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Paid via PhonePe / GPay"
              value={settleNotes}
              onChange={(e) => setSettleNotes(e.target.value)}
              className="glass-input w-full px-4 py-2 rounded-xl text-sm text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-95 shadow-glow-emerald disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Settlement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
