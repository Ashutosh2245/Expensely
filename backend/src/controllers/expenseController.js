import { Expense } from '../models/Expense.js';
import { Group } from '../models/Group.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Notification } from '../models/Notification.js';
import { calculateEqualSplit, validateExactSplit, calculatePercentageSplit } from '../utils/splitEngine.js';
import { calculateGroupBalances } from '../services/balanceService.js';
import { emitToGroup, emitToUser } from '../sockets/socketHandler.js';

export async function createExpense(req, res) {
  try {
    const {
      groupId,
      description,
      amount, // In rupees (can be decimal, e.g. 1500 or 1500.50)
      paidBy,
      splitType = 'EQUAL',
      participants, // Array of user IDs or { user, shareInPaise, percentage }
      category = 'Other',
      date = new Date(),
      receipt = '',
      notes = ''
    } = req.body;

    if (!groupId || !description || !amount || !paidBy || !participants || participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required expense fields: groupId, description, amount, paidBy, participants'
      });
    }

    const totalAmountPaise = Math.round(Number(amount) * 100);
    if (isNaN(totalAmountPaise) || totalAmountPaise <= 0) {
      return res.status(400).json({ success: false, message: 'Expense amount must be greater than zero' });
    }

    // Verify group and membership
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const memberIds = new Set(group.members.map((m) => m.user.toString()));
    if (!memberIds.has(paidBy.toString())) {
      return res.status(400).json({ success: false, message: 'Payer must be an active member of this group' });
    }

    let calculatedParticipants = [];

    if (splitType === 'EQUAL') {
      // participants can be an array of user IDs
      const participantIds = participants.map((p) => (typeof p === 'string' ? p : p.user));
      for (const pId of participantIds) {
        if (!memberIds.has(pId.toString())) {
          return res.status(400).json({ success: false, message: `Participant ${pId} is not a member of this group` });
        }
      }
      calculatedParticipants = calculateEqualSplit(totalAmountPaise, participantIds);
    } else if (splitType === 'EXACT') {
      const formatted = participants.map((p) => ({
        user: p.user,
        shareInPaise: Math.round(Number(p.amount != null ? p.amount * 100 : p.shareInPaise))
      }));
      for (const p of formatted) {
        if (!memberIds.has(p.user.toString())) {
          return res.status(400).json({ success: false, message: `Participant ${p.user} is not in this group` });
        }
      }
      calculatedParticipants = validateExactSplit(totalAmountPaise, formatted);
    } else if (splitType === 'PERCENTAGE') {
      for (const p of participants) {
        if (!memberIds.has(p.user.toString())) {
          return res.status(400).json({ success: false, message: `Participant ${p.user} is not in this group` });
        }
      }
      calculatedParticipants = calculatePercentageSplit(totalAmountPaise, participants);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid split type. Must be EQUAL, EXACT, or PERCENTAGE.' });
    }

    const expense = await Expense.create({
      groupId,
      description: description.trim(),
      amountInPaise: totalAmountPaise,
      paidBy,
      participants: calculatedParticipants,
      splitType,
      category,
      date: new Date(date),
      receipt,
      notes: notes?.trim() || '',
      createdBy: req.user._id
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'username fullName avatar email')
      .populate('participants.user', 'username fullName avatar email')
      .populate('createdBy', 'username fullName');

    // Create activity log
    await ActivityLog.create({
      groupId,
      userId: req.user._id,
      action: 'EXPENSE_ADDED',
      description: `${req.user.fullName} added "${description.trim()}" for ₹${(totalAmountPaise / 100).toFixed(2)}.`,
      metadata: { expenseId: expense._id, amount: totalAmountPaise / 100 }
    });

    // Notify other participants
    for (const p of calculatedParticipants) {
      if (p.user.toString() !== req.user._id.toString()) {
        const notif = await Notification.create({
          userId: p.user,
          type: 'EXPENSE_ADDED',
          title: 'New Expense Added',
          message: `${req.user.fullName} added "${description.trim()}" for ₹${(totalAmountPaise / 100).toFixed(2)} in "${group.name}".`,
          relatedEntity: {
            entityType: 'expense',
            entityId: expense._id
          }
        });
        emitToUser(p.user, 'notification:new', notif);
      }
    }

    // Calculate updated balances and emit real-time updates
    const updatedBalances = await calculateGroupBalances(groupId);
    emitToGroup(groupId, 'expense:created', populatedExpense);
    emitToGroup(groupId, 'balance:updated', updatedBalances);

    return res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      expense: {
        ...populatedExpense.toObject(),
        amount: totalAmountPaise / 100
      },
      balances: updatedBalances
    });
  } catch (err) {
    console.error('[createExpense] Error:', err);
    return res.status(400).json({ success: false, message: err.message || 'Failed to add expense' });
  }
}

export async function getGroupExpenses(req, res) {
  try {
    const groupId = req.params.groupId || req.params.id;
    const { category, search, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = { groupId };

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (search) {
      query.description = { $regex: search.trim(), $options: 'i' };
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .populate('paidBy', 'username fullName avatar email')
        .populate('participants.user', 'username fullName avatar email')
        .populate('createdBy', 'username fullName')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Expense.countDocuments(query)
    ]);

    const formattedExpenses = expenses.map((e) => ({
      ...e.toObject(),
      amount: e.amountInPaise / 100,
      participants: e.participants.map((p) => ({
        ...p.toObject(),
        share: p.shareInPaise / 100
      }))
    }));

    return res.json({
      success: true,
      expenses: formattedExpenses,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve expenses' });
  }
}

export async function getExpenseById(req, res) {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('groupId', 'name category avatar')
      .populate('paidBy', 'username fullName avatar email')
      .populate('participants.user', 'username fullName avatar email')
      .populate('createdBy', 'username fullName avatar');

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    return res.json({
      success: true,
      expense: {
        ...expense.toObject(),
        amount: expense.amountInPaise / 100,
        participants: expense.participants.map((p) => ({
          ...p.toObject(),
          share: p.shareInPaise / 100
        }))
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve expense' });
  }
}

export async function updateExpense(req, res) {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    // Check authorization: creator, payer or group admin
    const group = await Group.findById(expense.groupId);
    const userIdStr = req.user._id.toString();
    const membership = group.members.find((m) => m.user.toString() === userIdStr);

    const isCreator = expense.createdBy.toString() === userIdStr;
    const isPayer = expense.paidBy.toString() === userIdStr;
    const isAdmin = membership && (membership.role === 'OWNER' || membership.role === 'ADMIN');

    if (!isCreator && !isPayer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Permission denied to edit this expense' });
    }

    const { description, category, notes, receipt, date } = req.body;
    if (description) expense.description = description.trim();
    if (category) expense.category = category;
    if (notes !== undefined) expense.notes = notes.trim();
    if (receipt !== undefined) expense.receipt = receipt;
    if (date) expense.date = new Date(date);

    await expense.save();

    await ActivityLog.create({
      groupId: expense.groupId,
      userId: req.user._id,
      action: 'EXPENSE_UPDATED',
      description: `${req.user.fullName} updated expense "${expense.description}".`
    });

    const populated = await Expense.findById(expense._id)
      .populate('paidBy', 'username fullName avatar email')
      .populate('participants.user', 'username fullName avatar email');

    emitToGroup(expense.groupId, 'expense:updated', populated);

    return res.json({
      success: true,
      message: 'Expense updated successfully',
      expense: {
        ...populated.toObject(),
        amount: populated.amountInPaise / 100
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update expense' });
  }
}

export async function deleteExpense(req, res) {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const group = await Group.findById(expense.groupId);
    const userIdStr = req.user._id.toString();
    const membership = group.members.find((m) => m.user.toString() === userIdStr);

    const isCreator = expense.createdBy.toString() === userIdStr;
    const isPayer = expense.paidBy.toString() === userIdStr;
    const isAdmin = membership && (membership.role === 'OWNER' || membership.role === 'ADMIN');

    if (!isCreator && !isPayer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Permission denied to delete this expense' });
    }

    const groupId = expense.groupId;
    const desc = expense.description;
    await Expense.deleteOne({ _id: expense._id });

    await ActivityLog.create({
      groupId,
      userId: req.user._id,
      action: 'EXPENSE_DELETED',
      description: `${req.user.fullName} deleted expense "${desc}".`
    });

    const updatedBalances = await calculateGroupBalances(groupId);
    emitToGroup(groupId, 'expense:deleted', { expenseId: req.params.id });
    emitToGroup(groupId, 'balance:updated', updatedBalances);

    return res.json({
      success: true,
      message: 'Expense deleted successfully',
      balances: updatedBalances
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete expense' });
  }
}
