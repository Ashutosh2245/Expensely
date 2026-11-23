import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { balanceApi, groupApi, analyticsApi, activityApi } from '../services/api';
import { UserOverallBalances, Group, ActivityItem } from '../types';
import { StatCard } from '../components/StatCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Scale,
  Users,
  PlusCircle,
  CreditCard,
  History,
  PieChart as PieIcon,
  ChevronRight,
  Layers
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#F59E0B',
  'Transportation': '#3B82F6',
  'Shopping': '#EC4899',
  'Entertainment': '#8B5CF6',
  'Accommodation': '#10B981',
  'Groceries': '#14B8A6',
  'Utilities': '#6366F1',
  'Travel': '#06B6D4',
  'Healthcare': '#EF4444',
  'Other': '#64748B'
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<UserOverallBalances | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [balRes, grpRes, actRes, anaRes] = await Promise.all([
          balanceApi.getUserBalances(),
          groupApi.getAll(),
          activityApi.getUserActivities(),
          analyticsApi.getAnalytics()
        ]);

        if (balRes.data.success) setBalances(balRes.data.summary);
        if (grpRes.data.success) setGroups(grpRes.data.groups);
        if (actRes.data.success) setActivities(actRes.data.activities);
        if (anaRes.data.success) setAnalytics(anaRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <LoadingSkeleton count={4} className="h-32" />
        </div>
        <LoadingSkeleton count={2} className="h-72" />
      </div>
    );
  }

  const netBalance = balances?.netBalance || 0;
  const isPositive = netBalance > 0;
  const isZero = netBalance === 0;

  return (
    <div className="space-y-8">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time balance settlement & collaborative expenses overview
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/create-group"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 border border-white/10 hover:bg-white/5 transition"
          >
            <Users className="w-4 h-4 text-brand-purple" />
            <span>Create Group</span>
          </Link>
          <Link
            to="/add-expense"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:opacity-95 transition shadow-glow"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Expense</span>
          </Link>
        </div>
      </div>

      {/* 4 Core Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Net Balance"
          value={`${isPositive ? '+' : ''}₹${Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle={
            isZero
              ? 'You are all settled up!'
              : isPositive
              ? 'Overall you are owed money'
              : 'Overall you owe others'
          }
          icon={Scale}
          variant={isZero ? 'neutral' : isPositive ? 'emerald' : 'coral'}
        />

        <StatCard
          title="You Are Owed"
          value={`₹${(balances?.totalOwedToYou || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="Money incoming from peers"
          icon={ArrowDownLeft}
          variant="emerald"
        />

        <StatCard
          title="You Owe"
          value={`₹${(balances?.totalYouOwe || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="Pending dues to settle"
          icon={ArrowUpRight}
          variant="coral"
        />

        <StatCard
          title="Total Group Spending"
          value={`₹${(balances?.totalGroupExpenses || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle={`Across ${groups.length} collaborative groups`}
          icon={TrendingUp}
          variant="purple"
        />
      </div>

      {/* Charts Section: Monthly Spending Trend & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Monthly Spending Trend</h3>
              <p className="text-xs text-slate-400">Total expenditure by billing cycle</p>
            </div>
            <Link to="/analytics" className="text-xs text-brand-purple hover:underline flex items-center gap-1">
              Full Analytics &rarr;
            </Link>
          </div>

          <div className="h-64 w-full">
            {analytics?.monthlyChartData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.monthlyChartData}>
                  <defs>
                    <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#FFF',
                      fontSize: '12px'
                    }}
                    formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'Spending']}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#8B5CF6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#purpleGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Add expenses to see monthly analytics
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Top Categories</h3>
              <PieIcon className="w-4 h-4 text-brand-purple" />
            </div>

            <div className="h-44 w-full">
              {analytics?.categoryChartData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.categoryChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                    >
                      {analytics.categoryChartData.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[entry.name] || '#8B5CF6'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#FFF',
                        fontSize: '12px'
                      }}
                      formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'Amount']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No category data yet
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5 mt-2">
            {analytics?.categoryChartData?.slice(0, 3).map((item: any) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-300">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[item.name] || '#8B5CF6' }}
                  />
                  {item.name}
                </span>
                <span className="font-semibold text-white">₹{item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Groups & Live Activity Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Groups List */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Active Groups</h3>
            <Link to="/groups" className="text-xs text-brand-purple hover:underline">
              View all ({groups.length}) &rarr;
            </Link>
          </div>

          {groups.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No groups joined yet"
              description="Create a group for trips, roommates, or outings to start splitting bills."
              actionText="Create First Group"
              actionLink="/create-group"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {groups.map((group) => {
                const bal = group.userNetBalance || 0;
                return (
                  <Link
                    key={group._id}
                    to={`/groups/${group._id}`}
                    className="glass-card p-4 rounded-xl border border-white/5 hover:border-brand-purple/30 transition group flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={group.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${group.name}`}
                        alt={group.name}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10"
                      />
                      <div className="truncate">
                        <h4 className="text-sm font-semibold text-white group-hover:text-brand-purple transition truncate">
                          {group.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {group.category} • {group.membersCount || group.members?.length || 0} members
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Your balance:</span>
                      <span
                        className={`font-bold ${
                          bal > 0
                            ? 'text-emerald-400'
                            : bal < 0
                            ? 'text-coral-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {bal > 0 ? `+₹${bal.toFixed(2)}` : bal < 0 ? `-₹${Math.abs(bal).toFixed(2)}` : 'Settled'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Real-Time Activity Feed */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Recent Activity</h3>
            <History className="w-4 h-4 text-slate-400" />
          </div>

          {activities.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No recent activity yet</p>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 5).map((act) => (
                <div key={act._id} className="flex items-start gap-3 text-xs pb-3 border-b border-white/5 last:border-0 last:pb-0">
                  <img
                    src={act.userId?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${act.userId?.fullName || 'User'}`}
                    alt="user"
                    className="w-7 h-7 rounded-lg object-cover shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 leading-snug break-words">
                      {act.description}
                    </p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {new Date(act.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
