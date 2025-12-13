// Helper functions for maintaining user mekCount field
// This cached count avoids expensive full meks table scans in admin queries

/**
 * Recalculate and update a user's mekCount based on actual ownership in meks table.
 * Uses the by_owner_stake index for efficient counting.
 *
 * @param ctx - Mutation context
 * @param stakeAddress - The user's stake address
 * @returns The new mekCount value
 */
export async function recalculateUserMekCount(
  ctx: any,
  stakeAddress: string
): Promise<number> {
  if (!stakeAddress) {
    return 0;
  }

  // Count meks owned by this stake address using index
  const ownedMeks = await ctx.db
    .query("meks")
    .withIndex("by_owner_stake", (q: any) => q.eq("ownerStakeAddress", stakeAddress))
    .collect();

  const mekCount = ownedMeks.length;

  // Find and update the user record
  const user = await ctx.db
    .query("users")
    .withIndex("by_stake_address", (q: any) => q.eq("stakeAddress", stakeAddress))
    .first();

  if (user) {
    await ctx.db.patch(user._id, {
      mekCount: mekCount,
    });
  }

  return mekCount;
}

/**
 * Recalculate mekCount for multiple users at once.
 * More efficient than calling recalculateUserMekCount multiple times
 * when you need to update counts for several users.
 *
 * @param ctx - Mutation context
 * @param stakeAddresses - Array of stake addresses to update
 * @returns Map of stakeAddress -> new mekCount
 */
export async function recalculateMultipleUserMekCounts(
  ctx: any,
  stakeAddresses: string[]
): Promise<Map<string, number>> {
  const results = new Map<string, number>();

  // Dedupe and filter empty addresses
  const uniqueAddresses = [...new Set(stakeAddresses.filter(addr => addr))];

  for (const stakeAddress of uniqueAddresses) {
    const count = await recalculateUserMekCount(ctx, stakeAddress);
    results.set(stakeAddress, count);
  }

  return results;
}
