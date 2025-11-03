/**
 * Tenure Calculation Utilities
 *
 * Provides functions for calculating current tenure based on snapshots and elapsed time.
 * Matches the pattern used in goldCalculations.ts for consistency.
 */

export interface TenureCalculationParams {
  accumulatedTenure: number;
  tenureRatePerSecond: number;
  lastTenureSnapshotTime: number;
  tenureRateBuffMultiplier?: number;
  isSlotted: boolean;
}

/**
 * Calculate current tenure based on baseline + elapsed time
 *
 * @param params - Tenure calculation parameters
 * @returns Current tenure value
 *
 * @example
 * const current = calculateCurrentTenure({
 *   accumulatedTenure: 500,
 *   tenureRatePerSecond: 1,
 *   lastTenureSnapshotTime: Date.now() - 60000, // 1 minute ago
 *   tenureRateBuffMultiplier: 1.5,
 *   isSlotted: true
 * });
 * // Returns: 500 + (60 seconds × 1 × 1.5) = 590
 */
export function calculateCurrentTenure(params: TenureCalculationParams): number {
  const {
    accumulatedTenure,
    tenureRatePerSecond,
    lastTenureSnapshotTime,
    tenureRateBuffMultiplier = 1.0,
    isSlotted
  } = params;

  // If not slotted, tenure doesn't accumulate
  if (!isSlotted) {
    return accumulatedTenure;
  }

  const now = Date.now();
  const elapsedMs = now - lastTenureSnapshotTime;
  const elapsedSeconds = elapsedMs / 1000;

  // Apply buff multiplier to base rate
  const effectiveRate = tenureRatePerSecond * tenureRateBuffMultiplier;

  // Calculate accumulated tenure since last snapshot
  const accumulatedSinceSnapshot = elapsedSeconds * effectiveRate;
  const currentTenure = accumulatedTenure + accumulatedSinceSnapshot;

  return currentTenure;
}

/**
 * Clamp tenure to maximum level requirement
 *
 * @param tenure - Current tenure value
 * @param maxTenure - Maximum tenure for current level
 * @returns Clamped tenure value
 */
export function clampTenure(tenure: number, maxTenure: number): number {
  return Math.min(tenure, maxTenure);
}

/**
 * Calculate percentage progress toward next level
 *
 * @param currentTenure - Current tenure value
 * @param maxTenure - Maximum tenure for next level
 * @returns Percentage (0-100)
 */
export function calculateTenurePercentage(currentTenure: number, maxTenure: number): number {
  if (maxTenure <= 0) return 0;
  return Math.min((currentTenure / maxTenure) * 100, 100);
}

/**
 * Calculate time remaining until level up
 *
 * @param currentTenure - Current tenure value
 * @param maxTenure - Maximum tenure for next level
 * @param ratePerSecond - Effective tenure rate (base × multiplier)
 * @returns Seconds until level up (0 if already complete)
 */
export function calculateTimeToLevelUp(
  currentTenure: number,
  maxTenure: number,
  ratePerSecond: number
): number {
  if (currentTenure >= maxTenure) return 0;
  if (ratePerSecond <= 0) return Infinity;

  const remainingTenure = maxTenure - currentTenure;
  return remainingTenure / ratePerSecond;
}

/**
 * Format time remaining for display
 *
 * @param seconds - Time in seconds
 * @returns Formatted string (e.g., "5m 30s", "2h 15m", "45s")
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds === Infinity) return "∞";
  if (seconds <= 0) return "Ready";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Calculate effective tenure rate with buffs applied
 *
 * @param baseRate - Base tenure rate per second
 * @param buffMultiplier - Buff multiplier (e.g., 1.5 = +50%)
 * @returns Effective rate
 */
export function calculateEffectiveTenureRate(
  baseRate: number,
  buffMultiplier: number = 1.0
): number {
  return baseRate * buffMultiplier;
}
