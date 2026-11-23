import { Expense } from '../models/Expense.js';
import { Group } from '../models/Group.js';

export async function getAnalytics(req, res) {
  try {
    const userId = req.user._id;
    const { groupId, category, startDate, endDate } = req.query;

    // Find all groups user belongs to
    const userGroups = await Group.find({ 'members.user': userId }).select('_id name');
    const userGroupIds = userGroups.map((g) => g._id);

    const query = {};

    if (groupId) {
      // Ensure user belongs to this group
      if (!userGroupIds.some((id) => id.toString() === groupId.toString())) {
        return res.status(403).json({ success: false, message: 'Access denied to group analytics' });
      }
      query.groupId = groupId;
    } else {
      query.groupId = { $in: userGroupIds };
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .populate('groupId', 'name category')
      .populate('paidBy', 'username fullName')
      .populate('participants.user', 'username fullName')
      .sort({ date: 1 });

    // 1. Category breakdown
    const categoryTotals = {};
    // 2. Monthly spending trend
    const monthlyTotals = {};
    // 3. Group breakdown
    const groupTotals = {};
    // 4. User spending vs your personal share
    let totalExpenseAmount = 0;
    let yourTotalShare = 0;
    let yourTotalPaid = 0;

    const userIdStr = userId.toString();

    for (const exp of expenses) {
      const amount = exp.amountInPaise / 100;
      totalExpenseAmount += amount;

      // Category
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amount;

      // Group
      const gName = exp.groupId?.name || 'Unknown Group';
      groupTotals[gName] = (groupTotals[gName] || 0) + amount;

      // Month: YYYY-MM
      const d = new Date(exp.date);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + amount;

      // Personal calculations
      if (exp.paidBy && exp.paidBy._id.toString() === userIdStr) {
        yourTotalPaid += amount;
      }
      const myPart = exp.participants.find((p) => p.user && p.user._id.toString() === userIdStr);
      if (myPart) {
        yourTotalShare += myPart.shareInPaise / 100;
      }
    }

    // Format category data for Recharts
    const categoryChartData = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    })).sort((a, b) => b.value - a.value);

    // Format monthly data for Recharts
    const monthlyChartData = Object.entries(monthlyTotals).map(([month, amount]) => ({
      month,
      amount: parseFloat(amount.toFixed(2))
    }));

    // Format group data
    const groupChartData = Object.entries(groupTotals).map(([name, amount]) => ({
      name,
      amount: parseFloat(amount.toFixed(2))
    })).sort((a, b) => b.amount - a.amount);

    return res.json({
      success: true,
      summary: {
        totalExpenseAmount: parseFloat(totalExpenseAmount.toFixed(2)),
        yourTotalShare: parseFloat(yourTotalShare.toFixed(2)),
        yourTotalPaid: parseFloat(yourTotalPaid.toFixed(2)),
        totalExpensesCount: expenses.length,
        topCategory: categoryChartData[0]?.name || 'None'
      },
      categoryChartData,
      monthlyChartData,
      groupChartData,
      expensesCount: expenses.length
    });
  } catch (err) {
    console.error('[getAnalytics] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate analytics' });
  }
}

export async function exportCSV(req, res) {
  try {
    const userId = req.user._id;
    const { groupId } = req.query;

    const userGroups = await Group.find({ 'members.user': userId }).select('_id name');
    const userGroupIds = userGroups.map((g) => g._id);

    const query = groupId ? { groupId } : { groupId: { $in: userGroupIds } };

    const expenses = await Expense.find(query)
      .populate('groupId', 'name')
      .populate('paidBy', 'fullName username')
      .sort({ date: -1 });

    let csv = 'Date,Description,Category,Group,Paid By,Amount (INR)\n';
    for (const exp of expenses) {
      const dateStr = new Date(exp.date).toISOString().split('T')[0];
      const desc = `"${(exp.description || '').replace(/"/g, '""')}"`;
      const cat = `"${exp.category}"`;
      const grp = `"${(exp.groupId?.name || '').replace(/"/g, '""')}"`;
      const payer = `"${(exp.paidBy?.fullName || '').replace(/"/g, '""')}"`;
      const amt = (exp.amountInPaise / 100).toFixed(2);
      csv += `${dateStr},${desc},${cat},${grp},${payer},${amt}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="expensely-report.csv"');
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to export CSV' });
  }
}
