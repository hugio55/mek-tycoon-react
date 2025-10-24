// BANDWIDTH OPTIMIZATION: Query result caching
// Reduces bandwidth by caching expensive query results with TTL

import { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { DataModel } from "../_generated/dataModel";

type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;

export async function getCached<T>(
  ctx: QueryCtx,
  cacheKey: string,
  ttlMs: number = 30000 // Default: 30 seconds
): Promise<T | null> {
  const cached = await ctx.db
    .query("queryCache")
    .withIndex("by_key", (q) => q.eq("cacheKey", cacheKey))
    .first();

  if (!cached) {
    return null;
  }

  const now = Date.now();
  const age = now - cached.timestamp;

  // Check if cache is still valid
  if (age < cached.ttl) {
    console.log(`[Cache HIT] ${cacheKey} (age: ${(age / 1000).toFixed(1)}s / ${(cached.ttl / 1000).toFixed(1)}s)`);
    return cached.data as T;
  }

  console.log(`[Cache EXPIRED] ${cacheKey} (age: ${(age / 1000).toFixed(1)}s > ${(cached.ttl / 1000).toFixed(1)}s)`);
  return null;
}

export async function setCache<T>(
  ctx: MutationCtx,
  cacheKey: string,
  data: T,
  ttlMs: number = 30000 // Default: 30 seconds
): Promise<void> {
  const existing = await ctx.db
    .query("queryCache")
    .withIndex("by_key", (q) => q.eq("cacheKey", cacheKey))
    .first();

  const now = Date.now();

  if (existing) {
    // Update existing cache entry
    await ctx.db.patch(existing._id, {
      data,
      timestamp: now,
      ttl: ttlMs,
    });
    console.log(`[Cache UPDATE] ${cacheKey} (TTL: ${(ttlMs / 1000).toFixed(1)}s)`);
  } else {
    // Create new cache entry
    await ctx.db.insert("queryCache", {
      cacheKey,
      data,
      timestamp: now,
      ttl: ttlMs,
    });
    console.log(`[Cache CREATE] ${cacheKey} (TTL: ${(ttlMs / 1000).toFixed(1)}s)`);
  }
}

export async function invalidateCache(
  ctx: MutationCtx,
  cacheKey: string
): Promise<void> {
  const cached = await ctx.db
    .query("queryCache")
    .withIndex("by_key", (q) => q.eq("cacheKey", cacheKey))
    .first();

  if (cached) {
    await ctx.db.delete(cached._id);
    console.log(`[Cache INVALIDATE] ${cacheKey}`);
  }
}

// Cleanup old cache entries (run via cron)
export async function cleanupExpiredCache(ctx: MutationCtx): Promise<number> {
  const now = Date.now();
  const allCached = await ctx.db.query("queryCache").collect();

  let deletedCount = 0;

  for (const cached of allCached) {
    const age = now - cached.timestamp;
    if (age > cached.ttl) {
      await ctx.db.delete(cached._id);
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    console.log(`[Cache CLEANUP] Deleted ${deletedCount} expired cache entries`);
  }

  return deletedCount;
}
