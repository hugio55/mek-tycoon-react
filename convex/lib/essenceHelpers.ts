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

/**
 * Calculate aggregate buff values from all active sources for a variation.
 * Returns total rateMultiplier and capBonus by summing all active sources.
 *
 * CRITICAL: This replaces direct queries to essencePlayerBuffs.
 * Use this function wherever you need buff values.
 */
export async function getAggregatedBuffs(
  ctx: any,
  params: {
    walletAddress: string;
    variationId: number;
  }
): Promise<{
  rateMultiplier: number;
  capBonus: number;
  sourceCount: number;
  sources: Array<{
    sourceId: string;
    sourceName: string;
    rateMultiplier: number;
    capBonus: number;
  }>;
}> {
  const { walletAddress, variationId } = params;

  // Query all active buff sources for this variation
  const sources = await ctx.db
    .query("essenceBuffSources")
    .withIndex("by_wallet_and_variation", (q: any) =>
      q.eq("walletAddress", walletAddress).eq("variationId", variationId)
    )
    .filter((q: any) => q.eq(q.field("isActive"), true))
    .collect();

  // Check for expired buffs and filter them out
  const now = Date.now();
  const activeSources = sources.filter(
    (s: any) => !s.expiresAt || s.expiresAt > now
  );

  // Calculate totals
  let totalRateMultiplier = 1.0; // Base rate
  let totalCapBonus = 0;

  const sourceDetails = activeSources.map((source: any) => {
    // Accumulate multipliers additively: 1.0 + 0.15 + 0.10 = 1.25x
    totalRateMultiplier += (source.rateMultiplier - 1.0);
    totalCapBonus += source.capBonus;

    return {
      sourceId: source.sourceId,
      sourceName: source.sourceName,
      rateMultiplier: source.rateMultiplier,
      capBonus: source.capBonus,
    };
  });

  return {
    rateMultiplier: totalRateMultiplier,
    capBonus: totalCapBonus,
    sourceCount: activeSources.length,
    sources: sourceDetails,
  };
}

/**
 * Add a new buff source, preventing duplicates.
 * Returns existing buff if sourceId already exists.
 */
export async function addBuffSource(
  ctx: any,
  params: {
    walletAddress: string;
    variationId: number;
    rateMultiplier: number;
    capBonus: number;
    sourceType: string;
    sourceId: string;
    sourceName: string;
    sourceDescription?: string;
    expiresAt?: number;
    grantedBy?: string;
    grantReason?: string;
  }
): Promise<{ created: boolean; buffId: string }> {
  const {
    walletAddress,
    variationId,
    rateMultiplier,
    capBonus,
    sourceType,
    sourceId,
    sourceName,
    sourceDescription,
    expiresAt,
    grantedBy,
    grantReason,
  } = params;

  // Check if this source already exists (prevent duplicates)
  const existing = await ctx.db
    .query("essenceBuffSources")
    .withIndex("by_wallet_variation_source", (q: any) =>
      q.eq("walletAddress", walletAddress)
       .eq("variationId", variationId)
       .eq("sourceId", sourceId)
    )
    .first();

  if (existing) {
    console.log(`⚠️ [BUFF SOURCE] Source "${sourceId}" already exists for variation ${variationId}`);
    return { created: false, buffId: existing._id };
  }

  // Create new buff source
  const now = Date.now();
  const buffId = await ctx.db.insert("essenceBuffSources", {
    walletAddress,
    variationId,
    rateMultiplier,
    capBonus,
    sourceType,
    sourceId,
    sourceName,
    sourceDescription,
    appliedAt: now,
    expiresAt,
    isActive: true,
    grantedBy: grantedBy || "system",
    grantReason,
  });

  console.log(`✅ [BUFF SOURCE] Added "${sourceName}" (${sourceId}) for variation ${variationId}: ${rateMultiplier}x rate, +${capBonus} cap`);

  return { created: true, buffId };
}

/**
 * Remove a specific buff source by sourceId.
 * Returns whether the buff was found and removed.
 */
export async function removeBuffSource(
  ctx: any,
  params: {
    walletAddress: string;
    variationId: number;
    sourceId: string;
  }
): Promise<{ removed: boolean }> {
  const { walletAddress, variationId, sourceId } = params;

  const existing = await ctx.db
    .query("essenceBuffSources")
    .withIndex("by_wallet_variation_source", (q: any) =>
      q.eq("walletAddress", walletAddress)
       .eq("variationId", variationId)
       .eq("sourceId", sourceId)
    )
    .first();

  if (!existing) {
    console.log(`⚠️ [BUFF SOURCE] Source "${sourceId}" not found for removal`);
    return { removed: false };
  }

  await ctx.db.delete(existing._id);
  console.log(`✅ [BUFF SOURCE] Removed "${existing.sourceName}" (${sourceId}) from variation ${variationId}`);

  return { removed: true };
}
