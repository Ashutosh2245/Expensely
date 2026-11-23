import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { expenseApi } from '../services/api';
import { Expense } from '../types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import {
  ArrowLeft,
  Receipt,
  Calendar,
  Users,
  CreditCard,
  CheckCircle2,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ExpenseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExpense() {
      if (!id) return;
      try {
        setLoading(true);
        const { data } = await expenseApi.getById(id);
        if (data.success) {
          setExpense(data.expense);
        }
      } catch (err: any) {
        toast.error('Expense not found');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    }
    loadExpense();
  }, [id, navigate]);

  if (loading || !expense) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <LoadingSkeleton count={2} className="h-44" />
      </div>
    );
  }

  const groupData = expense.groupId as any;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Expense Details</h1>
          <p className="text-xs text-slate-400">
            {groupData?.name ? `In group "${groupData.name}"` : 'Shared transaction'}
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6">
        {/* Main Amount Card */}
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-white/5">
          <div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
              {expense.category}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-2">
              {expense.description}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(expense.date).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              <span>•</span>
              <span>Split Mode: {expense.splitType}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">Total</span>
            <span className="text-2xl sm:text-3xl font-black text-white">
              ₹{expense.amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payer Card */}
        <div className="glass-card p-4 rounded-xl border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={expense.paidBy?.avatar}
              alt={expense.paidBy?.fullName}
              className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10"
            />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Paid in full by</span>
              <span className="text-sm font-bold text-white">{expense.paidBy?.fullName}</span>
              <span className="text-[11px] text-brand-purple ml-1.5">@{expense.paidBy?.username}</span>
            </div>
          </div>
          <span className="text-sm font-extrabold text-emerald-400">
            ₹{expense.amount.toFixed(2)}
          </span>
        </div>

        {/* Participating Shares Breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-brand-purple" />
            <span>Participating Member Shares ({expense.participants?.length})</span>
          </h3>

          <div className="glass-card rounded-xl border border-white/5 divide-y divide-white/5 overflow-hidden">
            {expense.participants?.map((p) => (
              <div key={p.user?._id} className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={p.user?.avatar}
                    alt={p.user?.fullName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <span className="text-xs font-bold text-white">{p.user?.fullName}</span>
                    <span className="text-[10px] text-slate-400 block">@{p.user?.username}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-200">
                  ₹{(p.share != null ? p.share : p.shareInPaise / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Receipt Attachment if present */}
        {expense.receipt && (
          <div className="space-y-2 pt-2 border-t border-white/5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-slate-400" />
              <span>Receipt Proof</span>
            </h3>
            <img
              src={expense.receipt}
              alt="Receipt"
              className="max-h-80 rounded-xl object-contain border border-white/10 mx-auto"
            />
          </div>
        )}

        {/* Notes */}
        {expense.notes && (
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
            <span className="font-semibold text-white block mb-0.5">Notes:</span>
            {expense.notes}
          </div>
        )}
      </div>
    </div>
  );
};
