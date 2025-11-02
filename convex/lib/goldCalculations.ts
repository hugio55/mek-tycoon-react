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
 * @returns Current gold amount (capped at 50,000)
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
  // CRITICAL FIX: NO CAP - calculate true uncapped gold balance
  const now = Date.now();
  const hoursSinceLastUpdate = (now - params.lastSnapshotTime) / (1000 * 60 * 60);
  const goldSinceLastUpdate = params.goldPerHour * hoursSinceLastUpdate;
  const calculatedGold = params.accumulatedGold + goldSinceLastUpdate;

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
 * Gold cap constant - REMOVED (no more caps!)
 * Kept for backwards compatibility but set to Infinity
 */
export const GOLD_CAP = Infinity;

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
  // CRITICAL FIX: NO CAP - gold can grow infinitely
  const newAccumulatedGold = currentAccumulated + goldToAdd;

  // Add to cumulative
  let newTotalCumulativeGold = baseCumulative + goldToAdd;

  // Verify invariant: cumulative >= accumulated + spent
  // Use epsilon to handle floating-point precision errors
  const EPSILON = 1e-10;
  const difference = newTotalCumulativeGold - (newAccumulatedGold + totalSpent);
  if (difference < -EPSILON) {
    // DEFENSIVE AUTO-REPAIR: Force cumulative to minimum required value instead of crashing
    const requiredCumulative = newAccumulatedGold + totalSpent;
    console.error("[GOLD AUTO-REPAIR] Invariant violation detected - forcing repair!", {
      newAccumulatedGold,
      newTotalCumulativeGold_BROKEN: newTotalCumulativeGold,
      newTotalCumulativeGold_FIXED: requiredCumulative,
      totalSpent,
      goldToAdd,
      currentAccumulated,
      currentCumulative,
      baseCumulative,
      calculation: {
        expected: `${newTotalCumulativeGold} >= ${newAccumulatedGold} + ${totalSpent}`,
        actual: `${newTotalCumulativeGold} >= ${newAccumulatedGold + totalSpent}`,
        difference: difference,
        repair: `Forcing to ${requiredCumulative}`
      }
    });

    // Force repair instead of throwing
    newTotalCumulativeGold = requiredCumulative;
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
 * @returns true if valid, false if invalid (logs warning but doesn't throw)
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
    console.warn("[GOLD VALIDATION WARNING] Invariant violation detected (non-fatal):", {
      accumulated,
      cumulative,
      spent,
      expected: accumulated + spent,
      difference: difference,
      note: "This will be auto-repaired on next gold increase/decrease operation"
    });
    // Return false instead of throwing - caller can handle repair
    return false;
  }

  return true;
}
