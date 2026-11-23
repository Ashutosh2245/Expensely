import { calculateGroupBalances, calculateUserOverallBalances } from '../services/balanceService.js';

export async function getGroupBalances(req, res) {
  try {
    const groupId = req.params.groupId || req.params.id;
    const balances = await calculateGroupBalances(groupId);
    return res.json({ success: true, balances });
  } catch (err) {
    console.error('[getGroupBalances] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to calculate group balances' });
  }
}

export async function getSettlementSuggestions(req, res) {
  try {
    const groupId = req.params.groupId || req.params.id;
    const balances = await calculateGroupBalances(groupId);
    return res.json({
      success: true,
      suggestions: balances.simplifiedDebts,
      balances: balances.balances
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to generate settlement suggestions' });
  }
}

export async function getUserOverallBalances(req, res) {
  try {
    const userId = req.user._id;
    const summary = await calculateUserOverallBalances(userId);
    return res.json({ success: true, summary });
  } catch (err) {
    console.error('[getUserOverallBalances] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to calculate user balances' });
  }
}
