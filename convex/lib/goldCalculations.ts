/**
 * Shared gold calculation utilities
 * Used across frontend and backend to ensure consistency
 */

export interface GoldCalculationParams {
  accumulatedGold: number;
  goldPerHour: number;
  lastSnapshotTime: number;
  isVerified: boolean;
  consecutiveSnapshotFailures?: number; // Number of consecutive failed snapshots
}

/**
 * Calculates current gold based on accumulated gold and time elapsed
 * @param params - Gold calculation parameters
 * @returns Current gold amount (capped at GOLD_CAP: 10,000,000)
 */
export function calculateCurrentGold(params: GoldCalculationParams): number {
  // If not verified, return accumulated gold (frozen)
  if (!params.isVerified) {
    return params.accumulatedGold;
  }

  // If 3+ consecutive snapshot failures, pause gold accumulation
  const failureThreshold = 3;
  const consecutiveFailures = params.consecutiveSnapshotFailures || 0;

  if (consecutiveFailures >= failureThreshold) {
    // Freeze at accumulated gold - no new earnings until snapshots succeed
    return params.accumulatedGold;
  }

  // Normal calculation - user is verified and snapshots are working
  const now = Date.now();
  const hoursSinceLastUpdate = (now - params.lastSnapshotTime) / (1000 * 60 * 60);
  const goldSinceLastUpdate = params.goldPerHour * hoursSinceLastUpdate;
  const calculatedGold = Math.min(GOLD_CAP, params.accumulatedGold + goldSinceLastUpdate);

  return calculatedGold;
}

/**
 * Calculates gold earned since last update
 * @param goldPerHour - Gold mining rate per hour
 * @param lastSnapshotTime - Timestamp of last snapshot
 * @returns Gold earned since last snapshot
 */
export function calculateGoldSinceLastUpdate(
  goldPerHour: number,
  lastSnapshotTime: number
): number {
  const now = Date.now();
  const hoursSinceLastUpdate = (now - lastSnapshotTime) / (1000 * 60 * 60);
  return goldPerHour * hoursSinceLastUpdate;
}

/**
 * Gold cap constant
 */
export const GOLD_CAP = 10000000;

/**
 * Helper interface for gold mining record updates
 */
export interface GoldMiningRecord {
  accumulatedGold?: number;
  totalCumulativeGold?: number;
  totalGoldSpentOnUpgrades?: number;
  lastSnapshotTime?: number;
  updatedAt?: number;
  createdAt: number;
  totalGoldPerHour: number;
}

/**
 * CRITICAL GOLD TRACKING FUNCTION
 * Calculates the new gold values when gold is added (earned or manually added)
 * This ensures the invariant: totalCumulativeGold >= accumulatedGold + totalGoldSpentOnUpgrades
 *
 * @param currentRecord - Current gold mining record
 * @param goldToAdd - Amount of gold to add (positive number)
 * @returns Updated values for accumulatedGold and totalCumulativeGold
 */
export function calculateGoldIncrease(
  currentRecord: GoldMiningRecord,
  goldToAdd: number
): {
  newAccumulatedGold: number;
  newTotalCumulativeGold: number;
} {
  if (goldToAdd < 0) {
    throw new Error("goldToAdd must be positive. Use calculateGoldDecrease for spending gold.");
  }

  const currentAccumulated = currentRecord.accumulatedGold || 0;
  const currentCumulative = currentRecord.totalCumulativeGold || 0;
  const totalSpent = currentRecord.totalGoldSpentOnUpgrades || 0;

  // DEFENSIVE: Ensure cumulative is at least accumulated + spent
  // This auto-fixes any corrupted data where cumulative < accumulated + spent
  const requiredMinimum = currentAccumulated + totalSpent;
  const baseCumulative = Math.max(currentCumulative, requiredMinimum);

  // Log if we're auto-fixing corruption
  if (currentCumulative > 0 && currentCumulative < requiredMinimum) {
    console.warn("[GOLD AUTO-FIX] Repairing corrupted cumulative gold:", {
      currentCumulative,
      requiredMinimum,
      deficit: requiredMinimum - currentCumulative,
      currentAccumulated,
      totalSpent
    });
  }

  // Add gold to both accumulated and cumulative
  // CRITICAL: Track uncapped value to detect gold lost to cap
  const uncappedAccumulated = currentAccumulated + goldToAdd;
  const newAccumulatedGold = Math.min(GOLD_CAP, uncappedAccumulated);
  const goldLostToCap = uncappedAccumulated - newAccumulatedGold;

  // Add to cumulative (including any gold lost to cap)
  const newTotalCumulativeGold = baseCumulative + goldToAdd;

  // Defensive logging for edge cases
  if (goldLostToCap > 0) {
    console.log(`[GOLD CAP] Gold capped at ${GOLD_CAP.toLocaleString()}:`, {
      goldToAdd,
      currentAccumulated,
      uncappedValue: uncappedAccumulated,
      cappedValue: newAccumulatedGold,
      goldLostToCap,
      cumulativeStillGrows: newTotalCumulativeGold
    });
  }

  // Verify invariant - MUST account for gold lost to cap
  // The invariant allows for: cumulative >= accumulated + spent
  // When accumulated hits cap, cumulative can be higher (tracking all-time gold)
  // Use epsilon to handle floating-point precision errors
  const EPSILON = 1e-10;
  const difference = newTotalCumulativeGold - (newAccumulatedGold + totalSpent);
  if (difference < -EPSILON) {
    console.error("[GOLD ERROR] Invariant violation detected!", {
      newAccumulatedGold,
      newTotalCumulativeGold,
      totalSpent,
      goldToAdd,
      goldLostToCap,
      currentAccumulated,
      currentCumulative,
      baseCumulative,
      uncappedAccumulated,
      calculation: {
        expected: `${newTotalCumulativeGold} >= ${newAccumulatedGold} + ${totalSpent}`,
        actual: `${newTotalCumulativeGold} >= ${newAccumulatedGold + totalSpent}`,
        difference: difference
      }
    });
    throw new Error("Gold invariant violation: totalCumulativeGold < accumulatedGold + totalSpent");
  }

  return {
    newAccumulatedGold,
    newTotalCumulativeGold
  };
}

/**
 * CRITICAL GOLD TRACKING FUNCTION
 * Calculates the new gold values when gold is spent (on upgrades, purchases, etc)
 * This ensures the invariant: totalCumulativeGold >= accumulatedGold + totalGoldSpentOnUpgrades
 *
 * @param currentRecord - Current gold mining record
 * @param goldToSpend - Amount of gold to spend (positive number)
 * @returns Updated values for accumulatedGold (totalCumulativeGold stays the same)
 */
export function calculateGoldDecrease(
  currentRecord: GoldMiningRecord,
  goldToSpend: number
): {
  newAccumulatedGold: number;
  newTotalGoldSpentOnUpgrades: number;
} {
  if (goldToSpend < 0) {
    throw new Error("goldToSpend must be positive");
  }

  const currentAccumulated = currentRecord.accumulatedGold || 0;
  const totalSpent = currentRecord.totalGoldSpentOnUpgrades || 0;

  if (currentAccumulated < goldToSpend) {
    throw new Error(`Insufficient gold: have ${currentAccumulated}, need ${goldToSpend}`);
  }

  // Deduct from accumulated, track in totalSpent (cumulative stays the same)
  const newAccumulatedGold = currentAccumulated - goldToSpend;
  const newTotalGoldSpentOnUpgrades = totalSpent + goldToSpend;

  return {
    newAccumulatedGold,
    newTotalGoldSpentOnUpgrades
  };
}

/**
 * Validates that a gold mining record maintains the critical invariant:
 * totalCumulativeGold >= accumulatedGold + totalGoldSpentOnUpgrades
 *
 * @param record - Gold mining record to validate
 * @returns true if valid, throws error if invalid
 */
export function validateGoldInvariant(record: GoldMiningRecord): boolean {
  const accumulated = record.accumulatedGold || 0;
  const cumulative = record.totalCumulativeGold || 0;
  const spent = record.totalGoldSpentOnUpgrades || 0;

  // If cumulative is not set yet, we'll initialize it later
  if (cumulative === 0 && accumulated === 0 && spent === 0) {
    return true;
  }

  // If cumulative is initialized, it must be >= accumulated + spent
  // Use epsilon to handle floating-point precision errors
  const EPSILON = 1e-10;
  const difference = cumulative - (accumulated + spent);
  if (cumulative > 0 && difference < -EPSILON) {
    console.error("[GOLD VALIDATION ERROR] Invariant violation!", {
      accumulated,
      cumulative,
      spent,
      expected: accumulated + spent,
      difference: difference
    });
    throw new Error(
      `Gold invariant violation: totalCumulativeGold (${cumulative}) < accumulatedGold (${accumulated}) + totalSpent (${spent})`
    );
  }

  return true;
}
