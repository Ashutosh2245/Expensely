import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { groupApi, expenseApi, uploadApi } from '../services/api';
import { Group, User } from '../types';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Users,
  Percent,
  Calculator,
  UploadCloud,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Accommodation',
  'Groceries',
  'Utilities',
  'Travel',
  'Healthcare',
  'Other'
];

export const AddExpensePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialGroupId = searchParams.get('groupId') || '';

  const { user } = useAuth();
  const navigate = useNavigate();

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(initialGroupId);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);

  // Form Fields
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState<string>(user?._id || '');
  const [category, setCategory] = useState('Food & Dining');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [splitType, setSplitType] = useState<'EQUAL' | 'EXACT' | 'PERCENTAGE'>('EQUAL');

  // Participants splitting state
  // Equal: set of user IDs
  const [equalParticipantIds, setEqualParticipantIds] = useState<Set<string>>(new Set());
  // Exact: map of userId -> amount
  const [exactShares, setExactShares] = useState<Record<string, string>>({});
  // Percentage: map of userId -> percent
  const [percentageShares, setPercentageShares] = useState<Record<string, string>>({});

  // Receipt file upload
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Load groups on mount
  useEffect(() => {
    async function loadGroups() {
      try {
        const { data } = await groupApi.getAll();
        if (data.success && data.groups.length > 0) {
          setGroups(data.groups);
          const current = data.groups.find((g: Group) => g._id === initialGroupId) || data.groups[0];
          setSelectedGroupId(current._id);
          setActiveGroup(current);
        }
      } catch (err) {
        console.error('Failed to load groups');
      }
    }
    loadGroups();
  }, [initialGroupId]);

  // When group changes, update participants selection
  useEffect(() => {
    if (!selectedGroupId || groups.length === 0) return;
    const grp = groups.find((g) => g._id === selectedGroupId);
    if (grp) {
      setActiveGroup(grp);
      const memberIds = grp.members.map((m) => m.user._id);
      setEqualParticipantIds(new Set(memberIds));

      // Reset exact & percentage maps
      const exactObj: Record<string, string> = {};
      const percentObj: Record<string, string> = {};
      const equalShare = memberIds.length > 0 ? (100 / memberIds.length).toFixed(2) : '0';
      memberIds.forEach((mId) => {
        exactObj[mId] = '';
        percentObj[mId] = equalShare;
      });
      setExactShares(exactObj);
      setPercentageShares(percentObj);

      if (user && memberIds.includes(user._id)) {
        setPaidBy(user._id);
      } else if (memberIds.length > 0) {
        setPaidBy(memberIds[0]);
      }
    }
  }, [selectedGroupId, groups, user]);

  const toggleEqualParticipant = (userId: string) => {
    setEqualParticipantIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        if (next.size > 1) next.delete(userId);
        else toast.error('At least one participant must be selected');
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  // Computations & validations
  const totalAmountNum = parseFloat(amount) || 0;

  // Exact split validation
  const exactSum = Object.values(exactShares).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
  const exactDiff = totalAmountNum - exactSum;

  // Percentage split validation
  const percentSum = Object.values(percentageShares).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
  const percentDiff = 100 - percentSum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGroupId) {
      toast.error('Please select a group');
      return;
    }

    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    if (totalAmountNum <= 0) {
      toast.error('Amount must be greater than zero');
      return;
    }

    if (!paidBy) {
      toast.error('Please select who paid');
      return;
    }

    let participantsPayload: any[] = [];

    if (splitType === 'EQUAL') {
      if (equalParticipantIds.size === 0) {
        toast.error('Select at least one participant');
        return;
      }
      participantsPayload = Array.from(equalParticipantIds);
    } else if (splitType === 'EXACT') {
      if (Math.abs(exactDiff) > 0.01) {
        toast.error(`Exact amounts sum (₹${exactSum.toFixed(2)}) must match total (₹${totalAmountNum.toFixed(2)})`);
        return;
      }
      participantsPayload = Object.entries(exactShares)
        .filter(([_, val]) => parseFloat(val) > 0)
        .map(([uId, val]) => ({
          user: uId,
          amount: parseFloat(val)
        }));
    } else if (splitType === 'PERCENTAGE') {
      if (Math.abs(percentDiff) > 0.1) {
        toast.error(`Percentages must sum to 100%. Current sum: ${percentSum.toFixed(2)}%`);
        return;
      }
      participantsPayload = Object.entries(percentageShares)
        .filter(([_, val]) => parseFloat(val) > 0)
        .map(([uId, val]) => ({
          user: uId,
          percentage: parseFloat(val)
        }));
    }

    try {
      setSubmitting(true);

      // Upload receipt if selected
      let receiptUrl = '';
      if (receiptFile) {
        setUploadingReceipt(true);
        try {
          const upRes = await uploadApi.uploadFile(receiptFile);
          if (upRes.data.success) {
            receiptUrl = upRes.data.url;
          }
        } catch (upErr) {
          console.warn('Receipt upload failed, saving without receipt');
        } finally {
          setUploadingReceipt(false);
        }
      }

      const { data } = await expenseApi.create({
        groupId: selectedGroupId,
        description: description.trim(),
        amount: totalAmountNum,
        paidBy,
        splitType,
        participants: participantsPayload,
        category,
        date,
        notes,
        receipt: receiptUrl
      });

      if (data.success) {
        toast.success(`Expense "${description}" added!`);
        navigate(`/groups/${selectedGroupId}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  if (groups.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h2 className="text-xl font-bold text-white mb-2">No Groups Found</h2>
        <p className="text-xs text-slate-400 mb-6">
          You must create or join at least one group before adding expenses.
        </p>
        <Link
          to="/create-group"
          className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-purple to-brand-indigo shadow-glow"
        >
          Create Group
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Add New Expense</h1>
          <p className="text-xs text-slate-400">Log bill and automatically calculate peer balances</p>
        </div>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Group and Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Group *
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                required
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm text-white bg-navy-900"
              >
                {groups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name} ({g.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm text-white bg-navy-900"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description & Amount Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Expense Description *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Seafood Dinner at Thalassa, Beach Villa Booking"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="glass-input w-full pl-8 pr-4 py-2.5 rounded-xl text-sm text-white font-extrabold"
                />
              </div>
            </div>
          </div>

          {/* Payer and Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Paid By *
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                required
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm text-white bg-navy-900"
              >
                {activeGroup?.members?.map((m) => (
                  <option key={m.user?._id} value={m.user?._id}>
                    {m.user?.fullName} {m.user?._id === user?._id && '(You)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="glass-input w-full px-4 py-2 rounded-xl text-sm text-white bg-navy-900"
              />
            </div>
          </div>

          {/* Splitting Method Selector Tabs */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Split Method
            </label>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {[
                { id: 'EQUAL', label: 'Split Equally', mobileLabel: 'Equal', icon: Users },
                { id: 'EXACT', label: 'Exact Amounts', mobileLabel: 'Exact', icon: Calculator },
                { id: 'PERCENTAGE', label: 'By Percentage', mobileLabel: 'Percent', icon: Percent }
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = splitType === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSplitType(m.id as any)}
                    className={`py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition ${
                      isSelected
                        ? 'border-brand-purple bg-brand-purple/15 text-white shadow-glow'
                        : 'border-white/5 bg-navy-900/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="hidden sm:inline">{m.label}</span>
                    <span className="sm:hidden">{m.mobileLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Splitting Form Content */}
          <div className="glass-card p-4 rounded-xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 border-b border-white/5 pb-2">
              <span>Participating Members</span>
              <span>
                {splitType === 'EQUAL' &&
                  `₹${(totalAmountNum / (equalParticipantIds.size || 1)).toFixed(2)} / person`}
                {splitType === 'EXACT' && (
                  <span className={Math.abs(exactDiff) < 0.01 ? 'text-emerald-400' : 'text-coral-400'}>
                    Sum: ₹{exactSum.toFixed(2)} (Diff: ₹{exactDiff.toFixed(2)})
                  </span>
                )}
                {splitType === 'PERCENTAGE' && (
                  <span className={Math.abs(percentDiff) < 0.1 ? 'text-emerald-400' : 'text-coral-400'}>
                    Sum: {percentSum.toFixed(1)}% (Diff: {percentDiff.toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>

            <div className="space-y-2">
              {activeGroup?.members?.map((m) => {
                const mId = m.user?._id;
                const isSelected = equalParticipantIds.has(mId);

                return (
                  <div
                    key={mId}
                    className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      {splitType === 'EQUAL' && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleEqualParticipant(mId)}
                          className="w-4 h-4 rounded text-brand-purple focus:ring-0 cursor-pointer"
                        />
                      )}
                      <img
                        src={m.user?.avatar}
                        alt="avatar"
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <span className="text-xs font-medium text-white">
                        {m.user?.fullName} {mId === user?._id && '(You)'}
                      </span>
                    </div>

                    {splitType === 'EXACT' && (
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={exactShares[mId] || ''}
                          onChange={(e) =>
                            setExactShares((prev) => ({ ...prev, [mId]: e.target.value }))
                          }
                          className="glass-input w-full pl-6 pr-2 py-1 rounded-lg text-xs text-right text-white font-bold"
                        />
                      </div>
                    )}

                    {splitType === 'PERCENTAGE' && (
                      <div className="relative w-24">
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="0"
                          value={percentageShares[mId] || ''}
                          onChange={(e) =>
                            setPercentageShares((prev) => ({ ...prev, [mId]: e.target.value }))
                          }
                          className="glass-input w-full pl-2 pr-6 py-1 rounded-lg text-xs text-right text-white font-bold"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Receipt Upload & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Receipt Attachment (Optional)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="receipt-file-input"
                />
                <label
                  htmlFor="receipt-file-input"
                  className="glass-input w-full py-2.5 px-4 rounded-xl flex items-center justify-between cursor-pointer hover:border-brand-purple/40 transition"
                >
                  <span className="text-xs text-slate-400 truncate">
                    {receiptFile ? receiptFile.name : 'Choose receipt image...'}
                  </span>
                  <UploadCloud className="w-4 h-4 text-brand-purple shrink-0" />
                </label>
              </div>

              {receiptPreview && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={receiptPreview}
                    alt="Receipt preview"
                    className="w-16 h-16 rounded-lg object-cover border border-white/10"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Notes
              </label>
              <input
                type="text"
                placeholder="Optional notes or details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm text-white"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:opacity-95 shadow-glow disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Expense</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
