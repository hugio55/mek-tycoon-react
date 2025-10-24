/**
 * Shared essence calculation utilities
 * Used across frontend and backend to ensure consistency
 * Mirrors goldCalculations.ts pattern for essence accumulation
 */

export interface EssenceCalculationParams {
  accumulatedAmount: number;   // Snapshot value at lastSnapshotTime
  ratePerDay: number;           // Essence generation rate per day
  lastSnapshotTime: number;     // Timestamp when snapshot was taken
  essenceCap: number;           // Maximum capacity for this essence type
}

/**
 * Calculates current essence based on accumulated amount and time elapsed
 *
 * This function is IDENTICAL on frontend and backend, ensuring no drift
 * between client-side animation and server-side persistence.
 *
 * @param params - Essence calculation parameters
 * @returns Current essence amount (capped at essenceCap)
 */
export function calculateCurrentEssence(params: EssenceCalculationParams): number {
  const now = Date.now();
  const daysSinceLastUpdate = (now - params.lastSnapshotTime) / (1000 * 60 * 60 * 24);
  const essenceSinceLastUpdate = params.ratePerDay * daysSinceLastUpdate;
  const calculatedEssence = params.accumulatedAmount + essenceSinceLastUpdate;

  // Apply capacity cap
  return Math.min(calculatedEssence, params.essenceCap);
}

/**
 * Calculates essence earned since last snapshot
 * Helper function for backend calculations
 *
 * @param ratePerDay - Essence generation rate per day
 * @param lastSnapshotTime - Timestamp of last snapshot
 * @returns Essence earned since last snapshot
 */
export function calculateEssenceSinceLastUpdate(
  ratePerDay: number,
  lastSnapshotTime: number
): number {
  const now = Date.now();
  const daysSinceLastUpdate = (now - lastSnapshotTime) / (1000 * 60 * 60 * 24);
  return ratePerDay * daysSinceLastUpdate;
}

/**
 * Helper interface for essence balance record updates
 */
export interface EssenceBalanceRecord {
  accumulatedAmount: number;
  lastSnapshotTime: number;
  lastUpdated: number;
  variationId: number;
  variationName: string;
  variationType: "head" | "body" | "item";
}

/**
 * Calculates new essence values when essence accumulates
 * Used by backend when updating snapshots
 *
 * @param currentRecord - Current essence balance record
 * @param essenceToAdd - Amount of essence to add (from time-based accumulation)
 * @param essenceCap - Maximum capacity
 * @returns Updated values for accumulatedAmount
 */
export function calculateEssenceIncrease(
  currentRecord: EssenceBalanceRecord,
  essenceToAdd: number,
  essenceCap: number
): {
  newAccumulatedAmount: number;
} {
  if (essenceToAdd < 0) {
    throw new Error("essenceToAdd must be positive. Use a separate function for spending essence.");
  }

  const currentAccumulated = currentRecord.accumulatedAmount || 0;
  const newAmount = currentAccumulated + essenceToAdd;

  // Apply cap
  const newAccumulatedAmount = Math.min(newAmount, essenceCap);

  return {
    newAccumulatedAmount
  };
}

/**
 * Validates that essence amount doesn't exceed capacity
 *
 * @param amount - Essence amount to validate
 * @param cap - Capacity limit
 * @returns true if valid, throws error if invalid
 */
export function validateEssenceCap(amount: number, cap: number): boolean {
  if (amount > cap) {
    console.warn(`[Essence Validation] Amount ${amount} exceeds cap ${cap}`);
    return false;
  }
  return true;
}
