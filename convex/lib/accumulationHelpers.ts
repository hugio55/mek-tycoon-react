/**
 * Shared time-based accumulation utilities for essence, tenure, and gold systems.
 *
 * These pure functions extract common math patterns used across multiple accumulation systems.
 * They don't modify state - they just calculate values.
 */

/**
 * Calculate accumulated value over time with rate and optional cap.
 *
 * Used by:
 * - Tenure system (points per second)
 * - Essence system (essence per day with cap)
 * - Gold system (gold per second)
 *
 * @param params Configuration for the calculation
 * @returns Total accumulated amount (saved + earned), optionally capped
 *
 * @example
 * // Tenure: Calculate points earned since last update
 * const currentTenure = calculateTimeBasedAccumulation({
 *   savedAmount: mek.tenurePoints || 0,
 *   lastUpdateTime: mek.lastTenureUpdate,
 *   currentTime: Date.now(),
 *   ratePerUnit: effectiveRate,
 *   timeUnit: 'seconds',
 * });
 *
 * @example
 * // Essence: Calculate with cap
 * const currentEssence = calculateTimeBasedAccumulation({
 *   savedAmount: balance.accumulatedAmount,
 *   lastUpdateTime: tracking.lastCalculationTime,
 *   currentTime: Date.now(),
 *   ratePerUnit: effectiveRate,
 *   timeUnit: 'days',
 *   multiplier: variationCount,
 *   cap: effectiveCap,
 * });
 */
export function calculateTimeBasedAccumulation(params: {
  savedAmount: number;        // Base amount saved in database
  lastUpdateTime: number;     // Timestamp of last save (milliseconds)
  currentTime: number;        // Current timestamp (milliseconds)
  ratePerUnit: number;        // Rate per second or per day
  timeUnit: 'seconds' | 'days';
  multiplier?: number;        // Count or buff multiplier (default: 1)
  cap?: number;               // Optional max value (Infinity if not specified)
}): number {
  // Convert milliseconds to the target time unit
  const divisor = params.timeUnit === 'seconds'
    ? 1000
    : (1000 * 60 * 60 * 24); // days

  const elapsed = (params.currentTime - params.lastUpdateTime) / divisor;
  const multiplier = params.multiplier ?? 1;
  const earned = elapsed * params.ratePerUnit * multiplier;
  const total = params.savedAmount + earned;

  // Apply cap if specified
  const cap = params.cap ?? Infinity;
  return Math.min(total, cap);
}

/**
 * Calculate effective rate with buffs applied.
 *
 * @param baseRate Base rate before buffs
 * @param globalBuffMultiplier Global buff multiplier (additive)
 * @param perEntityBuffMultiplier Per-entity buff multiplier (additive)
 * @returns Effective rate with all buffs applied
 *
 * @example
 * // Tenure rate calculation
 * const effectiveRate = calculateEffectiveRate(
 *   baseRatePerSecond,
 *   globalBuffMultiplier,
 *   perMekBuffMultiplier
 * );
 * // effectiveRate = baseRate * (1 + globalBuffs + perMekBuffs)
 */
export function calculateEffectiveRate(
  baseRate: number,
  globalBuffMultiplier: number,
  perEntityBuffMultiplier: number
): number {
  return baseRate * (1 + globalBuffMultiplier + perEntityBuffMultiplier);
}
