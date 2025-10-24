// Helper functions for essence balance management
// Prevents duplicate essence entries by always querying by NAME instead of ID

/**
 * Safely get or create an essence balance entry.
 * This function prevents duplicates by querying by variation NAME instead of ID.
 *
 * CRITICAL: Always use this function instead of directly querying/inserting essenceBalances
 * to prevent duplicate "Nothing" and other variation entries.
 */
export async function getOrCreateEssenceBalance(
  ctx: any,
  params: {
    walletAddress: string;
    variationId: number;
    variationName: string;
    variationType: "head" | "body" | "item";
    initialAmount?: number;
  }
) {
  const { walletAddress, variationId, variationName, variationType, initialAmount = 0 } = params;

  // Query by NAME to prevent duplicates with different IDs
  let balance = await ctx.db
    .query("essenceBalances")
    .withIndex("by_wallet_and_name", (q: any) =>
      q.eq("walletAddress", walletAddress).eq("variationName", variationName)
    )
    .first();

  const now = Date.now();

  if (balance) {
    // Balance exists - update variationId in case it changed
    await ctx.db.patch(balance._id, {
      variationId, // Normalize to current ID
      lastUpdated: now,
    });
    return balance._id;
  } else {
    // Balance doesn't exist - create it
    const newId = await ctx.db.insert("essenceBalances", {
      walletAddress,
      variationId,
      variationName,
      variationType,
      accumulatedAmount: initialAmount,
      lastSnapshotTime: now,
      lastUpdated: now,
    });
    return newId;
  }
}

/**
 * Safely add essence to a balance, creating the entry if it doesn't exist.
 * Returns the balance ID.
 */
export async function addEssenceToBalance(
  ctx: any,
  params: {
    walletAddress: string;
    variationId: number;
    variationName: string;
    variationType: "head" | "body" | "item";
    amountToAdd: number;
  }
) {
  const { walletAddress, variationId, variationName, variationType, amountToAdd } = params;

  // Query by NAME to prevent duplicates
  let balance = await ctx.db
    .query("essenceBalances")
    .withIndex("by_wallet_and_name", (q: any) =>
      q.eq("walletAddress", walletAddress).eq("variationName", variationName)
    )
    .first();

  const now = Date.now();

  if (balance) {
    // Balance exists - add to it
    await ctx.db.patch(balance._id, {
      variationId, // Normalize ID
      accumulatedAmount: balance.accumulatedAmount + amountToAdd,
      lastSnapshotTime: now,
      lastUpdated: now,
    });
    return balance._id;
  } else {
    // Balance doesn't exist - create it with the amount
    const newId = await ctx.db.insert("essenceBalances", {
      walletAddress,
      variationId,
      variationName,
      variationType,
      accumulatedAmount: amountToAdd,
      lastSnapshotTime: now,
      lastUpdated: now,
    });
    return newId;
  }
}

/**
 * Set essence balance to a specific amount, creating the entry if it doesn't exist.
 */
export async function setEssenceBalance(
  ctx: any,
  params: {
    walletAddress: string;
    variationId: number;
    variationName: string;
    variationType: "head" | "body" | "item";
    amount: number;
  }
) {
  const { walletAddress, variationId, variationName, variationType, amount } = params;

  // Query by NAME to prevent duplicates
  let balance = await ctx.db
    .query("essenceBalances")
    .withIndex("by_wallet_and_name", (q: any) =>
      q.eq("walletAddress", walletAddress).eq("variationName", variationName)
    )
    .first();

  const now = Date.now();

  if (balance) {
    // Balance exists - set it
    await ctx.db.patch(balance._id, {
      variationId, // Normalize ID
      accumulatedAmount: amount,
      lastSnapshotTime: now,
      lastUpdated: now,
    });
    return balance._id;
  } else {
    // Balance doesn't exist - create it
    const newId = await ctx.db.insert("essenceBalances", {
      walletAddress,
      variationId,
      variationName,
      variationType,
      accumulatedAmount: amount,
      lastSnapshotTime: now,
      lastUpdated: now,
    });
    return newId;
  }
}
