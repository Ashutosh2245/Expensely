import React, { useState, useEffect } from 'react';
import { groupApi, analyticsApi } from '../services/api';
import { Group } from '../types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import {
  PieChart as PieIcon,
  TrendingUp,
  Download,
  Filter,
  Calendar,
  Layers,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

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

export const AnalyticsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadGroups() {
      try {
        const { data } = await groupApi.getAll();
        if (data.success) {
          setGroups(data.groups || []);
        }
      } catch (err) {
        console.error('Failed to load groups');
      }
    }
    loadGroups();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedGroup) params.groupId = selectedGroup;
      if (selectedCategory && selectedCategory !== 'ALL') params.category = selectedCategory;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const { data } = await analyticsApi.getAnalytics(params);
      if (data.success) {
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedGroup, selectedCategory, startDate, endDate]);

  const handleExportCSV = () => {
    const csvUrl = analyticsApi.getCSVUrl(selectedGroup);
    window.open(csvUrl, '_blank');
    toast.success('Exporting CSV report...');
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text('EXPENSELY – Financial Expense Report', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 28);
      if (selectedGroup) {
        const gName = groups.find((g) => g._id === selectedGroup)?.name || 'Selected Group';
        doc.text(`Group: ${gName}`, 14, 34);
      }

      const summary = analyticsData?.summary;
      const summaryData = [
        ['Total Expenditure', `INR ${summary?.totalExpenseAmount?.toFixed(2) || '0.00'}`],
        ['Your Total Share', `INR ${summary?.yourTotalShare?.toFixed(2) || '0.00'}`],
        ['Your Total Paid', `INR ${summary?.yourTotalPaid?.toFixed(2) || '0.00'}`],
        ['Total Expenses Logged', `${summary?.totalExpensesCount || 0}`],
        ['Top Spending Category', `${summary?.topCategory || 'N/A'}`]
      ];

      autoTable(doc, {
        startY: 42,
        head: [['Metric', 'Summary Value']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] }
      });

      if (analyticsData?.categoryChartData?.length > 0) {
        const catRows = analyticsData.categoryChartData.map((c: any) => [
          c.name,
          `INR ${c.value.toFixed(2)}`
        ]);

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 12,
          head: [['Category Breakdown', 'Amount']],
          body: catRows,
          theme: 'grid',
          headStyles: { fillColor: [139, 92, 246] }
        });
      }

      doc.save('expensely-monthly-report.pdf');
      toast.success('Monthly PDF report downloaded!');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('Failed to generate PDF');
    }
  };

  const categories = [
    'ALL',
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

  return (
    <div className="space-y-6">
      {/* Header and Download Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Analytics & Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Deep-dive financial trends, category allocations, and exportable reports
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 border border-white/10 hover:bg-white/5 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:opacity-95 shadow-glow transition"
          >
            <FileText className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Group Filter</label>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="glass-input w-full px-3 py-2 rounded-xl text-xs text-white bg-navy-900"
          >
            <option value="">All Groups</option>
            {groups.map((g) => (
              <option key={g._id} value={g._id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Category Filter</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="glass-input w-full px-3 py-2 rounded-xl text-xs text-white bg-navy-900"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="glass-input w-full px-3 py-2 rounded-xl text-xs text-white bg-navy-900"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="glass-input w-full px-3 py-2 rounded-xl text-xs text-white bg-navy-900"
          />
        </div>
      </div>

      {/* Summary KPI Strip */}
      {analyticsData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="glass-panel p-3 sm:p-4 rounded-xl border border-white/5">
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Total Spend</span>
            <div className="text-base sm:text-xl font-bold text-white mt-1 truncate">
              ₹{(analyticsData.summary?.totalExpenseAmount || 0).toFixed(2)}
            </div>
          </div>
          <div className="glass-panel p-3 sm:p-4 rounded-xl border border-white/5">
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Your Share</span>
            <div className="text-base sm:text-xl font-bold text-coral-400 mt-1 truncate">
              ₹{(analyticsData.summary?.yourTotalShare || 0).toFixed(2)}
            </div>
          </div>
          <div className="glass-panel p-3 sm:p-4 rounded-xl border border-white/5">
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">You Paid</span>
            <div className="text-base sm:text-xl font-bold text-emerald-400 mt-1 truncate">
              ₹{(analyticsData.summary?.yourTotalPaid || 0).toFixed(2)}
            </div>
          </div>
          <div className="glass-panel p-3 sm:p-4 rounded-xl border border-white/5">
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Top Category</span>
            <div className="text-base sm:text-xl font-bold text-brand-purple mt-1 truncate">
              {analyticsData.summary?.topCategory || 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Main Charts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LoadingSkeleton count={2} className="h-72" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Spending Trend Area Chart */}
          <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-white/5 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs sm:text-sm font-bold text-white">Monthly Spending Dynamics</h3>
              <TrendingUp className="w-4 h-4 text-brand-purple" />
            </div>

            <div className="h-56 sm:h-64 w-full min-w-0 overflow-hidden">
              {analyticsData?.monthlyChartData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.monthlyChartData}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#FFF'
                      }}
                      formatter={(v: any) => [`₹${Number(v).toFixed(2)}`, 'Spend']}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#8B5CF6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#areaGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No monthly trend data available
                </div>
              )}
            </div>
          </div>

          {/* Category Expenditure Donut */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Expenditure by Category</h3>
              <PieIcon className="w-4 h-4 text-indigo-400" />
            </div>

            <div className="h-64 w-full">
              {analyticsData?.categoryChartData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.categoryChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={45}
                      paddingAngle={3}
                    >
                      {analyticsData.categoryChartData.map((c: any, i: number) => (
                        <Cell key={`cell-${i}`} fill={CATEGORY_COLORS[c.name] || '#8B5CF6'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#FFF'
                      }}
                      formatter={(v: any) => [`₹${Number(v).toFixed(2)}`, 'Amount']}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-[11px] text-slate-300">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No category data available
                </div>
              )}
            </div>
          </div>

          {/* Group-Wise Expenditure Bar Chart */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Group-Wise Spending Comparison</h3>
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="h-64 w-full">
              {analyticsData?.groupChartData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.groupChartData}>
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#FFF'
                      }}
                      formatter={(v: any) => [`₹${Number(v).toFixed(2)}`, 'Group Total']}
                    />
                    <Bar dataKey="amount" fill="#6366F1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No group comparison data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
