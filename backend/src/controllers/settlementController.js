import { Settlement } from '../models/Settlement.js';
import { Group } from '../models/Group.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Notification } from '../models/Notification.js';
import { calculateGroupBalances } from '../services/balanceService.js';
import { emitToGroup, emitToUser } from '../sockets/socketHandler.js';

export async function createSettlement(req, res) {
  try {
    const {
      groupId,
      fromUser, // debtor
      toUser, // creditor
      amount, // rupees
      paymentMethod = 'CASH',
      notes = '',
      autoConfirm = false
    } = req.body;

    if (!groupId || !fromUser || !toUser || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required settlement fields' });
    }

    if (fromUser.toString() === toUser.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot record settlement with oneself' });
    }

    const amountInPaise = Math.round(Number(amount) * 100);
    if (isNaN(amountInPaise) || amountInPaise <= 0) {
      return res.status(400).json({ success: false, message: 'Settlement amount must be positive' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const memberIds = new Set(group.members.map((m) => m.user.toString()));
    if (!memberIds.has(fromUser.toString()) || !memberIds.has(toUser.toString())) {
      return res.status(400).json({ success: false, message: 'Both parties must be members of the group' });
    }

    const isCreditor = req.user._id.toString() === toUser.toString();
    const isDebtor = req.user._id.toString() === fromUser.toString();
    const isAdmin = group.members.find((m) => m.user.toString() === req.user._id.toString())?.role === 'OWNER';

    // If creditor records it or admin confirms it, or autoConfirm flag is set: CONFIRMED
    const status = (isCreditor || autoConfirm || isAdmin) ? 'CONFIRMED' : 'PENDING';

    const settlement = await Settlement.create({
      groupId,
      fromUser,
      toUser,
      amountInPaise,
      status,
      paymentMethod,
      notes: notes.trim(),
      confirmedAt: status === 'CONFIRMED' ? new Date() : null,
      createdBy: req.user._id
    });

    const populated = await Settlement.findById(settlement._id)
      .populate('fromUser', 'username fullName avatar email')
      .populate('toUser', 'username fullName avatar email')
      .populate('createdBy', 'username fullName');

    const formattedAmount = (amountInPaise / 100).toFixed(2);

    await ActivityLog.create({
      groupId,
      userId: req.user._id,
      action: status === 'CONFIRMED' ? 'SETTLEMENT_CONFIRMED' : 'SETTLEMENT_REQUESTED',
      description: status === 'CONFIRMED'
        ? `${populated.fromUser.fullName} settled ₹${formattedAmount} with ${populated.toUser.fullName} via ${paymentMethod}.`
        : `${populated.fromUser.fullName} recorded a payment of ₹${formattedAmount} to ${populated.toUser.fullName} (pending confirmation).`,
      metadata: { settlementId: settlement._id }
    });

    // Notify other party
    const targetUserId = isCreditor ? fromUser : toUser;
    const notif = await Notification.create({
      userId: targetUserId,
      type: status === 'CONFIRMED' ? 'SETTLEMENT_CONFIRMED' : 'SETTLEMENT_REQUESTED',
      title: status === 'CONFIRMED' ? 'Settlement Completed' : 'Settlement Confirmation Needed',
      message: `${req.user.fullName} recorded a settlement of ₹${formattedAmount} in "${group.name}".`,
      relatedEntity: {
        entityType: 'settlement',
        entityId: settlement._id
      }
    });
    emitToUser(targetUserId, 'notification:new', notif);

    const updatedBalances = await calculateGroupBalances(groupId);
    emitToGroup(groupId, 'settlement:created', populated);
    emitToGroup(groupId, 'balance:updated', updatedBalances);

    return res.status(201).json({
      success: true,
      message: status === 'CONFIRMED' ? 'Payment settled successfully' : 'Payment recorded, awaiting confirmation',
      settlement: {
        ...populated.toObject(),
        amount: amountInPaise / 100
      },
      balances: updatedBalances
    });
  } catch (err) {
    console.error('[createSettlement] Error:', err);
    return res.status(400).json({ success: false, message: 'Failed to record settlement' });
  }
}

export async function getGroupSettlements(req, res) {
  try {
    const groupId = req.params.groupId || req.params.id;
    const settlements = await Settlement.find({ groupId })
      .populate('fromUser', 'username fullName avatar email')
      .populate('toUser', 'username fullName avatar email')
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 });

    const formatted = settlements.map((s) => ({
      ...s.toObject(),
      amount: s.amountInPaise / 100
    }));

    return res.json({ success: true, settlements: formatted });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve settlements' });
  }
}

export async function confirmSettlement(req, res) {
  try {
    const settlementId = req.params.id;
    const settlement = await Settlement.findById(settlementId)
      .populate('fromUser', 'username fullName avatar')
      .populate('toUser', 'username fullName avatar');

    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement record not found' });
    }

    if (settlement.status === 'CONFIRMED') {
      return res.status(400).json({ success: false, message: 'Settlement is already confirmed' });
    }

    // Only the recipient (toUser) or an admin can confirm receipt
    const userIdStr = req.user._id.toString();
    if (settlement.toUser._id.toString() !== userIdStr) {
      return res.status(403).json({ success: false, message: 'Only the payment recipient can confirm settlement' });
    }

    settlement.status = 'CONFIRMED';
    settlement.confirmedAt = new Date();
    await settlement.save();

    await ActivityLog.create({
      groupId: settlement.groupId,
      userId: req.user._id,
      action: 'SETTLEMENT_CONFIRMED',
      description: `${settlement.toUser.fullName} confirmed receipt of ₹${(settlement.amountInPaise / 100).toFixed(2)} from ${settlement.fromUser.fullName}.`
    });

    const notif = await Notification.create({
      userId: settlement.fromUser._id,
      type: 'SETTLEMENT_CONFIRMED',
      title: 'Payment Confirmed',
      message: `${settlement.toUser.fullName} confirmed your payment of ₹${(settlement.amountInPaise / 100).toFixed(2)}.`,
      relatedEntity: {
        entityType: 'settlement',
        entityId: settlement._id
      }
    });
    emitToUser(settlement.fromUser._id, 'notification:new', notif);

    const updatedBalances = await calculateGroupBalances(settlement.groupId);
    emitToGroup(settlement.groupId, 'balance:updated', updatedBalances);

    return res.json({
      success: true,
      message: 'Settlement confirmed successfully',
      settlement: {
        ...settlement.toObject(),
        amount: settlement.amountInPaise / 100
      },
      balances: updatedBalances
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to confirm settlement' });
  }
}

export async function rejectSettlement(req, res) {
  try {
    const settlementId = req.params.id;
    const settlement = await Settlement.findById(settlementId)
      .populate('fromUser', 'username fullName')
      .populate('toUser', 'username fullName');

    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement record not found' });
    }

    const userIdStr = req.user._id.toString();
    if (settlement.toUser._id.toString() !== userIdStr && settlement.fromUser._id.toString() !== userIdStr) {
      return res.status(403).json({ success: false, message: 'Unauthorized to reject this settlement' });
    }

    settlement.status = 'REJECTED';
    await settlement.save();

    const notif = await Notification.create({
      userId: settlement.fromUser._id,
      type: 'SETTLEMENT_REJECTED',
      title: 'Settlement Rejected',
      message: `${req.user.fullName} rejected or cancelled the settlement of ₹${(settlement.amountInPaise / 100).toFixed(2)}.`,
      relatedEntity: {
        entityType: 'settlement',
        entityId: settlement._id
      }
    });
    emitToUser(settlement.fromUser._id, 'notification:new', notif);

    return res.json({ success: true, message: 'Settlement marked as rejected' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to reject settlement' });
  }
}
