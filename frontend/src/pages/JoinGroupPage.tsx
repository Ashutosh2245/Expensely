import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { groupApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Sparkles, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const JoinGroupPage: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [joining, setJoining] = useState(false);
  const [success, setSuccess] = useState(false);
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!inviteCode) return;
    try {
      setJoining(true);
      const { data } = await groupApi.joinByCode(inviteCode);
      if (data.success) {
        setSuccess(true);
        setTargetGroupId(data.groupId);
        toast.success(data.message || 'Joined group successfully!');
        setTimeout(() => {
          navigate(`/groups/${data.groupId}`);
        }, 1500);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to join group. Link may be invalid.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center py-12 px-6 lg:px-8 relative selection:bg-brand-purple/30 selection:text-white">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-brand-purple/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-brand-purple/20 text-brand-purple flex items-center justify-center mx-auto mb-6 shadow-glow">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Join Expense Group</h2>
        <p className="text-xs text-slate-400 mt-1">
          You've been invited to collaborate and split expenses.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="glass-panel border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
          {success ? (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Welcome to the group!</h3>
              <p className="text-xs text-slate-400">Redirecting to group dashboard...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[11px] text-slate-400 block mb-1">Invite Code:</span>
                <span className="text-base font-mono font-bold text-brand-purple">{inviteCode}</span>
              </div>

              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:opacity-95 shadow-glow disabled:opacity-50"
              >
                {joining ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Accept & Join Group</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <Link to="/dashboard" className="text-xs text-slate-400 hover:text-white transition block">
                Go to my dashboard instead
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
