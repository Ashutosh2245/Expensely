/**
 * Utilities for calculating and validating expense splits in integer paise.
 */

/**
 * Calculates equal split across participants in integer paise.
 * Resolves odd division remainders by distributing remaining paise one by one to initial participants.
 * @param {number} totalAmountPaise
 * @param {Array<string>} participantIds
 * @returns {Array<{ user: string, shareInPaise: number }>}
 */
export function calculateEqualSplit(totalAmountPaise, participantIds) {
  if (!participantIds || participantIds.length === 0) {
    throw new Error('At least one participant required for splitting');
  }
  const n = participantIds.length;
  const baseShare = Math.floor(totalAmountPaise / n);
  const remainder = totalAmountPaise % n;

  return participantIds.map((userId, index) => ({
    user: userId,
    shareInPaise: baseShare + (index < remainder ? 1 : 0)
  }));
}

/**
 * Validates and converts exact split shares.
 * @param {number} totalAmountPaise
 * @param {Array<{ user: string, shareInPaise: number }>} participants
 * @returns {Array<{ user: string, shareInPaise: number }>}
 */
export function validateExactSplit(totalAmountPaise, participants) {
  if (!participants || participants.length === 0) {
    throw new Error('Participants list cannot be empty');
  }

  let sum = 0;
  const formatted = participants.map((p) => {
    const share = Math.round(Number(p.shareInPaise));
    if (isNaN(share) || share < 0) {
      throw new Error(`Invalid share amount for participant ${p.user}`);
    }
    sum += share;
    return {
      user: p.user,
      shareInPaise: share
    };
  });

  if (sum !== totalAmountPaise) {
    const diff = (totalAmountPaise - sum) / 100;
    throw new Error(`Sum of shares (₹${(sum / 100).toFixed(2)}) must exactly match total expense (₹${(totalAmountPaise / 100).toFixed(2)}). Difference: ₹${diff.toFixed(2)}`);
  }

  return formatted;
}

/**
 * Calculates percentage split in integer paise.
 * @param {number} totalAmountPaise
 * @param {Array<{ user: string, percentage: number }>} participantsWithPercentages
 * @returns {Array<{ user: string, shareInPaise: number }>}
 */
export function calculatePercentageSplit(totalAmountPaise, participantsWithPercentages) {
  if (!participantsWithPercentages || participantsWithPercentages.length === 0) {
    throw new Error('Participants list cannot be empty');
  }

  // Validate percentages sum to 100 with tolerance for tiny decimal float
  const totalPercent = participantsWithPercentages.reduce((acc, p) => acc + Number(p.percentage || 0), 0);
  if (Math.abs(totalPercent - 100) > 0.01) {
    throw new Error(`Percentages must sum to 100%. Current sum: ${totalPercent.toFixed(2)}%`);
  }

  let allocatedPaise = 0;
  const result = [];

  participantsWithPercentages.forEach((p, idx) => {
    // For the last participant, allocate whatever is remaining to guarantee exact match
    if (idx === participantsWithPercentages.length - 1) {
      const share = totalAmountPaise - allocatedPaise;
      result.push({
        user: p.user,
        shareInPaise: share
      });
    } else {
      const share = Math.round((totalAmountPaise * p.percentage) / 100);
      allocatedPaise += share;
      result.push({
        user: p.user,
        shareInPaise: share
      });
    }
  });

  return result;
}
