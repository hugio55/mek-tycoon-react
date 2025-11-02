/**
 * Helper functions for essence cap reduction warnings
 * Detects when actions will cause essence loss and calculates the impact
 */

import { clampEssenceToCap } from "./essenceCalculations";

export interface EssenceCapChangeImpact {
  variationId: number;
  variationName: string;
  variationType: "head" | "body" | "item";
  currentCap: number;
  newCap: number;
  currentAmount: number;
  newAmount: number;
  lossAmount: number;
  willLoseEssence: boolean;
}

/**
 * Calculate the impact of removing a buff on essence balances
 *
 * @param balances - Current essence balances
 * @param buffs - Current active buffs
 * @param buffToRemove - The buff being removed
 * @param baseConfig - Base essence config (essenceRate, essenceCap)
 * @returns Array of affected essence types with loss calculations
 */
export function calculateBuffRemovalImpact(
  balances: Array<{
    variationId: number;
    variationName: string;
    variationType: "head" | "body" | "item";
    accumulatedAmount: number;
  }>,
  buffs: Array<{
    variationId: number;
    rateMultiplier: number;
    capBonus: number;
  }>,
  buffToRemove: {
    variationId: number;
    capBonus: number;
  },
  baseConfig: {
    essenceCap: number;
  }
): EssenceCapChangeImpact[] {
  const impacts: EssenceCapChangeImpact[] = [];

  // Find the balance for this variation
  const balance = balances.find((b) => b.variationId === buffToRemove.variationId);
  if (!balance) return impacts; // No balance exists, no loss possible

  // Find the buff for this variation
  const buff = buffs.find((b) => b.variationId === buffToRemove.variationId);
  if (!buff) return impacts; // No buff exists (shouldn't happen, but safety check)

  const currentCap = baseConfig.essenceCap + buff.capBonus;
  const newCap = baseConfig.essenceCap; // Removing buff means back to base cap
  const currentAmount = balance.accumulatedAmount;

  // Calculate what the new amount will be after clamping to new cap
  const newAmount = clampEssenceToCap(currentAmount, newCap);
  const lossAmount = Math.max(0, currentAmount - newAmount);

  impacts.push({
    variationId: balance.variationId,
    variationName: balance.variationName,
    variationType: balance.variationType,
    currentCap,
    newCap,
    currentAmount,
    newAmount,
    lossAmount,
    willLoseEssence: lossAmount > 0,
  });

  return impacts;
}

/**
 * Calculate the impact of unslotting a Mek on essence balances
 * Note: Unslotting doesn't reduce caps (only reduces generation rate going forward)
 * This function returns empty array because unslotting never causes essence loss
 *
 * @returns Empty array (unslotting doesn't cause cap reduction or loss)
 */
export function calculateUnslotImpact(): EssenceCapChangeImpact[] {
  // Unslotting a Mek only reduces generation rate, it does NOT:
  // - Reduce essence caps
  // - Remove any accumulated essence
  // - Cause any loss
  //
  // Therefore, no warning needed for unslotting
  return [];
}

/**
 * Calculate the impact of multiple buffs expiring simultaneously
 *
 * @param balances - Current essence balances
 * @param buffs - Current active buffs
 * @param buffsToRemove - Array of buffs that are expiring
 * @param baseConfig - Base essence config
 * @returns Array of affected essence types with loss calculations
 */
export function calculateMultipleBuffExpirationImpact(
  balances: Array<{
    variationId: number;
    variationName: string;
    variationType: "head" | "body" | "item";
    accumulatedAmount: number;
  }>,
  buffs: Array<{
    variationId: number;
    rateMultiplier: number;
    capBonus: number;
  }>,
  buffsToRemove: Array<{
    variationId: number;
    capBonus: number;
  }>,
  baseConfig: {
    essenceCap: number;
  }
): EssenceCapChangeImpact[] {
  const impacts: EssenceCapChangeImpact[] = [];

  for (const buffToRemove of buffsToRemove) {
    const singleImpact = calculateBuffRemovalImpact(
      balances,
      buffs,
      buffToRemove,
      baseConfig
    );
    impacts.push(...singleImpact);
  }

  return impacts;
}

/**
 * Check if any changes will result in essence loss
 */
export function willAnyEssenceBeLost(impacts: EssenceCapChangeImpact[]): boolean {
  return impacts.some((impact) => impact.willLoseEssence);
}

/**
 * Calculate total essence that will be lost
 */
export function calculateTotalLoss(impacts: EssenceCapChangeImpact[]): number {
  return impacts.reduce((sum, impact) => sum + impact.lossAmount, 0);
}
