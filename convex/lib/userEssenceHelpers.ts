// Helper functions for userEssence table (sparse spendable balances)
// This table stores essence that users can SPEND on crafting, trades, etc.
// Different from essenceBalances table which tracks production/accumulation

import { Doc, Id } from "../_generated/dataModel";

/**
 * Get a user's balance for a specific essence type.
 * Returns 0 if no record exists (sparse storage).
 */
export async function getUserEssenceBalance(
  ctx: any,
  stakeAddress: string,
  essenceType: string
): Promise<number> {
  const record = await ctx.db
    .query("userEssence")
    .withIndex("by_user_type", (q: any) =>
      q.eq("stakeAddress", stakeAddress).eq("essenceType", essenceType)
    )
    .first();

  return record?.balance ?? 0;
}

/**
 * Get all essence balances for a user.
 * Returns an object mapping essenceType -> balance (only types with balance > 0)
 */
export async function getAllUserEssenceBalances(
  ctx: any,
  stakeAddress: string
): Promise<Record<string, number>> {
  const records = await ctx.db
    .query("userEssence")
    .withIndex("by_user", (q: any) => q.eq("stakeAddress", stakeAddress))
    .collect();

  const balances: Record<string, number> = {};
  for (const record of records) {
    if (record.balance > 0) {
      balances[record.essenceType] = record.balance;
    }
  }
  return balances;
}

/**
 * Get the total sum of all essence balances for a user.
 * (Replaces the legacy totalEssence aggregate calculation)
 */
export async function getUserTotalEssenceSum(
  ctx: any,
  stakeAddress: string
): Promise<number> {
  const records = await ctx.db
    .query("userEssence")
    .withIndex("by_user", (q: any) => q.eq("stakeAddress", stakeAddress))
    .collect();

  return records.reduce((sum: number, record: any) => sum + (record.balance || 0), 0);
}

/**
 * Add essence to a user's balance.
 * Creates the record if it doesn't exist.
 * Returns the new balance.
 */
export async function addUserEssence(
  ctx: any,
  stakeAddress: string,
  essenceType: string,
  amount: number,
  source?: string
): Promise<number> {
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  const now = Date.now();

  const existing = await ctx.db
    .query("userEssence")
    .withIndex("by_user_type", (q: any) =>
      q.eq("stakeAddress", stakeAddress).eq("essenceType", essenceType)
    )
    .first();

  if (existing) {
    const newBalance = existing.balance + amount;
    await ctx.db.patch(existing._id, {
      balance: newBalance,
      lastUpdated: now,
      lastSource: source || "unknown",
    });
    return newBalance;
  } else {
    await ctx.db.insert("userEssence", {
      stakeAddress,
      essenceType,
      balance: amount,
      lastUpdated: now,
      lastSource: source || "unknown",
    });
    return amount;
  }
}

/**
 * Deduct essence from a user's balance.
 * Throws error if insufficient balance.
 * Deletes the record if balance reaches 0 (sparse storage).
 * Returns the new balance.
 */
export async function deductUserEssence(
  ctx: any,
  stakeAddress: string,
  essenceType: string,
  amount: number,
  source?: string
): Promise<number> {
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  const existing = await ctx.db
    .query("userEssence")
    .withIndex("by_user_type", (q: any) =>
      q.eq("stakeAddress", stakeAddress).eq("essenceType", essenceType)
    )
    .first();

  const currentBalance = existing?.balance ?? 0;

  if (currentBalance < amount) {
    throw new Error(
      `Insufficient ${essenceType} essence. Have: ${currentBalance}, Need: ${amount}`
    );
  }

  const newBalance = currentBalance - amount;
  const now = Date.now();

  if (existing) {
    if (newBalance === 0) {
      // Delete record to maintain sparse storage
      await ctx.db.delete(existing._id);
    } else {
      await ctx.db.patch(existing._id, {
        balance: newBalance,
        lastUpdated: now,
        lastSource: source || "unknown",
      });
    }
  }

  return newBalance;
}

/**
 * Set a user's essence balance to a specific amount.
 * Creates record if doesn't exist and amount > 0.
 * Deletes record if amount = 0 (sparse storage).
 */
export async function setUserEssenceBalance(
  ctx: any,
  stakeAddress: string,
  essenceType: string,
  amount: number,
  source?: string
): Promise<void> {
  if (amount < 0) {
    throw new Error("Amount cannot be negative");
  }

  const now = Date.now();

  const existing = await ctx.db
    .query("userEssence")
    .withIndex("by_user_type", (q: any) =>
      q.eq("stakeAddress", stakeAddress).eq("essenceType", essenceType)
    )
    .first();

  if (amount === 0) {
    // Delete record for sparse storage
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  } else if (existing) {
    await ctx.db.patch(existing._id, {
      balance: amount,
      lastUpdated: now,
      lastSource: source || "unknown",
    });
  } else {
    await ctx.db.insert("userEssence", {
      stakeAddress,
      essenceType,
      balance: amount,
      lastUpdated: now,
      lastSource: source || "unknown",
    });
  }
}

/**
 * Check if user has enough essence of a specific type.
 */
export async function hasEnoughEssence(
  ctx: any,
  stakeAddress: string,
  essenceType: string,
  requiredAmount: number
): Promise<boolean> {
  const balance = await getUserEssenceBalance(ctx, stakeAddress, essenceType);
  return balance >= requiredAmount;
}

/**
 * Check if user has enough of multiple essence types.
 * Returns { sufficient: boolean, missing: Record<string, number> }
 */
export async function checkMultipleEssenceRequirements(
  ctx: any,
  stakeAddress: string,
  requirements: Record<string, number>
): Promise<{
  sufficient: boolean;
  missing: Record<string, number>;
}> {
  const missing: Record<string, number> = {};
  let sufficient = true;

  for (const [essenceType, required] of Object.entries(requirements)) {
    if (required > 0) {
      const balance = await getUserEssenceBalance(ctx, stakeAddress, essenceType);
      if (balance < required) {
        sufficient = false;
        missing[essenceType] = required - balance;
      }
    }
  }

  return { sufficient, missing };
}

/**
 * Deduct multiple essence types at once (atomic operation).
 * Checks all balances first before deducting any.
 * Throws error if any balance is insufficient.
 */
export async function deductMultipleEssence(
  ctx: any,
  stakeAddress: string,
  costs: Record<string, number>,
  source?: string
): Promise<void> {
  // First check all balances
  const check = await checkMultipleEssenceRequirements(ctx, stakeAddress, costs);
  if (!check.sufficient) {
    const missingStr = Object.entries(check.missing)
      .map(([type, amt]) => `${type}: ${amt}`)
      .join(", ");
    throw new Error(`Insufficient essence. Missing: ${missingStr}`);
  }

  // All checks passed, deduct each type
  for (const [essenceType, amount] of Object.entries(costs)) {
    if (amount > 0) {
      await deductUserEssence(ctx, stakeAddress, essenceType, amount, source);
    }
  }
}

/**
 * Delete all essence records for a user (for cascade delete).
 * Returns count of deleted records.
 */
export async function deleteAllUserEssence(
  ctx: any,
  stakeAddress: string
): Promise<number> {
  const records = await ctx.db
    .query("userEssence")
    .withIndex("by_user", (q: any) => q.eq("stakeAddress", stakeAddress))
    .collect();

  for (const record of records) {
    await ctx.db.delete(record._id);
  }

  return records.length;
}
