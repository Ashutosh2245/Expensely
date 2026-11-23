import { Expense } from '../models/Expense.js';
import { Settlement } from '../models/Settlement.js';
import { Group } from '../models/Group.js';

/**
 * Calculates complete, integer-paise financial balances for a given group.
 * @param {string|mongoose.Types.ObjectId} groupId
 * @returns {Promise<Object>}
 */
export async function calculateGroupBalances(groupId) {
  const group = await Group.findById(groupId).populate('members.user', 'username fullName avatar email');
  if (!group) {
    throw new Error('Group not found');
  }

  // Fetch all expenses for this group
  const expenses = await Expense.find({ groupId })
    .populate('paidBy', 'username fullName avatar email')
    .populate('participants.user', 'username fullName avatar email')
    .sort({ date: -1 });

  // Fetch only CONFIRMED settlements
  const confirmedSettlements = await Settlement.find({
    groupId,
    status: 'CONFIRMED'
  })
    .populate('fromUser', 'username fullName avatar email')
    .populate('toUser', 'username fullName avatar email');

  // Initialize members map with string IDs
  const memberMap = new Map();
  group.members.forEach((m) => {
    if (m.user) {
      const uId = m.user._id.toString();
      memberMap.set(uId, {
        userId: uId,
        user: {
          _id: uId,
          username: m.user.username,
          fullName: m.user.fullName,
          avatar: m.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.user.fullName)}`,
          email: m.user.email
        },
        role: m.role,
        totalPaidPaise: 0,
        totalSharePaise: 0,
        totalSettlementsPaidPaise: 0,
        totalSettlementsReceivedPaise: 0,
        netBalancePaise: 0 // In paise: positive means owed money, negative means owes money
      });
    }
  });

  // Calculate expenses
  let totalGroupExpensePaise = 0;
  for (const exp of expenses) {
    totalGroupExpensePaise += exp.amountInPaise;
    const payerId = exp.paidBy._id ? exp.paidBy._id.toString() : exp.paidBy.toString();

    if (memberMap.has(payerId)) {
      memberMap.get(payerId).totalPaidPaise += exp.amountInPaise;
    }

    for (const part of exp.participants) {
      const partId = part.user._id ? part.user._id.toString() : part.user.toString();
      if (memberMap.has(partId)) {
        memberMap.get(partId).totalSharePaise += part.shareInPaise;
      }
    }
  }

  // Factor in confirmed settlements
  for (const set of confirmedSettlements) {
    const fromId = set.fromUser._id ? set.fromUser._id.toString() : set.fromUser.toString();
    const toId = set.toUser._id ? set.toUser._id.toString() : set.toUser.toString();

    if (memberMap.has(fromId)) {
      memberMap.get(fromId).totalSettlementsPaidPaise += set.amountInPaise;
    }
    if (memberMap.has(toId)) {
      memberMap.get(toId).totalSettlementsReceivedPaise += set.amountInPaise;
    }
  }

  // Calculate net balance for each member:
  // Net = (totalPaid + totalSettlementsPaid) - (totalShare + totalSettlementsReceived)
  let sumCheck = 0;
  const balancesList = [];

  for (const [_, data] of memberMap.entries()) {
    data.netBalancePaise =
      data.totalPaidPaise +
      data.totalSettlementsPaidPaise -
      (data.totalSharePaise + data.totalSettlementsReceivedPaise);

    sumCheck += data.netBalancePaise;
    balancesList.push(data);
  }

  // Verify group zero-sum invariant
  if (Math.abs(sumCheck) > 0) {
    console.warn(`[BalanceEngine] Warning: Zero-sum invariant discrepancy of ${sumCheck} paise`);
  }

  // Calculate Debt Simplification (Min-Cash-Flow Algorithm)
  const simplifiedDebts = simplifyDebts(balancesList);

  return {
    groupId: group._id.toString(),
    groupName: group.name,
    totalExpensesPaise: totalGroupExpensePaise,
    totalExpensesFormatted: (totalGroupExpensePaise / 100).toFixed(2),
    membersCount: group.members.length,
    balances: balancesList.map((b) => ({
      ...b,
      totalPaid: b.totalPaidPaise / 100,
      totalShare: b.totalSharePaise / 100,
      netBalance: b.netBalancePaise / 100,
      isCreditor: b.netBalancePaise > 0,
      isDebtor: b.netBalancePaise < 0,
      isSettled: b.netBalancePaise === 0
    })),
    simplifiedDebts
  };
}

/**
 * Min-Cash-Flow Algorithm for Debt Simplification
 * Greedily matches the largest debtor with the largest creditor
 * Minimizes number of transactions while maintaining exact net balances.
 * @param {Array} balancesList
 * @returns {Array} List of simplified transactions { fromUser, toUser, amountPaise, amount }
 */
export function simplifyDebts(balancesList) {
  // Separate into debtors (< 0) and creditors (> 0)
  // Deep clone to avoid mutating original balances
  const debtors = [];
  const creditors = [];

  for (const b of balancesList) {
    if (b.netBalancePaise < 0) {
      debtors.push({
        user: b.user,
        balance: -b.netBalancePaise // positive debt amount
      });
    } else if (b.netBalancePaise > 0) {
      creditors.push({
        user: b.user,
        balance: b.netBalancePaise
      });
    }
  }

  const transactions = [];

  // Sort debtors and creditors descending by balance
  debtors.sort((a, b) => b.balance - a.balance);
  creditors.sort((a, b) => b.balance - a.balance);

  let i = 0; // debtor index
  let j = 0; // creditor index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const settlePaise = Math.min(debtor.balance, creditor.balance);

    if (settlePaise > 0) {
      transactions.push({
        fromUser: debtor.user,
        toUser: creditor.user,
        amountPaise: settlePaise,
        amount: settlePaise / 100,
        amountFormatted: (settlePaise / 100).toFixed(2)
      });
    }

    debtor.balance -= settlePaise;
    creditor.balance -= settlePaise;

    if (debtor.balance === 0) i++;
    if (creditor.balance === 0) j++;
  }

  return transactions;
}

/**
 * Calculates a single user's aggregate balances across all groups they belong to.
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<Object>}
 */
export async function calculateUserOverallBalances(userId) {
  const uId = userId.toString();

  // Find all groups user belongs to
  const groups = await Group.find({ 'members.user': userId });

  let totalOwedToYouPaise = 0; // positive balances
  let totalYouOwePaise = 0; // negative balances
  let totalExpensesPaise = 0; // total group expenses

  const groupSummaries = [];

  for (const grp of groups) {
    const grpBal = await calculateGroupBalances(grp._id);
    totalExpensesPaise += grpBal.totalExpensesPaise;

    const userBal = grpBal.balances.find((b) => b.userId === uId);
    if (userBal) {
      if (userBal.netBalancePaise > 0) {
        totalOwedToYouPaise += userBal.netBalancePaise;
      } else if (userBal.netBalancePaise < 0) {
        totalYouOwePaise += Math.abs(userBal.netBalancePaise);
      }

      groupSummaries.push({
        groupId: grp._id.toString(),
        name: grp.name,
        category: grp.category,
        avatar: grp.avatar,
        netBalancePaise: userBal.netBalancePaise,
        netBalance: userBal.netBalance,
        totalPaid: userBal.totalPaid,
        totalShare: userBal.totalShare
      });
    }
  }

  const netOverallPaise = totalOwedToYouPaise - totalYouOwePaise;

  return {
    totalGroupExpenses: totalExpensesPaise / 100,
    totalOwedToYou: totalOwedToYouPaise / 100,
    totalYouOwe: totalYouOwePaise / 100,
    netBalance: netOverallPaise / 100,
    netBalancePaise: netOverallPaise,
    groups: groupSummaries
  };
}
