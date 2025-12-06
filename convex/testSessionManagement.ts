import { query } from "./_generated/server";
import { v } from "convex/values";

// Test query to verify schema changes are backward compatible
export const testSchemaBackwardCompatibility = query({
  args: {},
  handler: async (ctx) => {
    // Test reading users with new optional fields
    const users = await ctx.db.query("users").take(5);

    const results = users.map((user: any) => ({
      walletAddress: user.walletAddress,
      hasOldFields: {
        walletType: !!user.walletType,
        walletName: !!user.walletName,
        lastLogin: !!user.lastLogin,
      },
      hasNewFields: {
        lastWalletType: user.lastWalletType !== undefined,
        lastConnectionPlatform: user.lastConnectionPlatform !== undefined,
        activeSessionId: user.activeSessionId !== undefined,
        sessionExpiresAt: user.sessionExpiresAt !== undefined,
      },
    }));

    // Test reading walletSignatures with new optional fields
    const signatures = await ctx.db.query("walletSignatures").take(5);

    const signatureResults = signatures.map((sig: any) => ({
      stakeAddress: sig.stakeAddress,
      hasOldFields: {
        nonce: !!sig.nonce,
        verified: sig.verified !== undefined,
      },
      hasNewFields: {
        platform: sig.platform !== undefined,
        deviceInfo: sig.deviceInfo !== undefined,
      },
    }));

    // Test reading walletRateLimits (new table)
    const rateLimits = await ctx.db.query("walletRateLimits").take(5);

    return {
      success: true,
      userCount: users.length,
      users: results,
      signatureCount: signatures.length,
      signatures: signatureResults,
      rateLimitCount: rateLimits.length,
      message: "Schema is backward compatible. All queries succeeded.",
    };
  },
});

// Test query for rate limiting
export const testRateLimiting = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if rate limit records exist for this wallet
    const nonceRateLimit = await ctx.db
      .query("walletRateLimits")
      .withIndex("by_stake_address_action", q =>
        q.eq("stakeAddress", args.stakeAddress).eq("actionType", "nonce_generation")
      )
      .first();

    const signatureRateLimit = await ctx.db
      .query("walletRateLimits")
      .withIndex("by_stake_address_action", q =>
        q.eq("stakeAddress", args.stakeAddress).eq("actionType", "signature_verification")
      )
      .first();

    return {
      stakeAddress: args.stakeAddress,
      nonceRateLimit: nonceRateLimit ? {
        attemptCount: nonceRateLimit.attemptCount,
        consecutiveFailures: nonceRateLimit.consecutiveFailures || 0,
        isLocked: nonceRateLimit.lockedUntil ? nonceRateLimit.lockedUntil > Date.now() : false,
      } : null,
      signatureRateLimit: signatureRateLimit ? {
        attemptCount: signatureRateLimit.attemptCount,
        consecutiveFailures: signatureRateLimit.consecutiveFailures || 0,
        isLocked: signatureRateLimit.lockedUntil ? signatureRateLimit.lockedUntil > Date.now() : false,
      } : null,
    };
  },
});

// Test session management queries
export const testSessionManagement = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.stakeAddress))
      .first();

    if (!user) {
      return {
        found: false,
        message: "User not found",
      };
    }

    const now = Date.now();
    const sessionValid = user.activeSessionId &&
                        user.sessionExpiresAt &&
                        user.sessionExpiresAt > now;

    return {
      found: true,
      user: {
        walletAddress: user.walletAddress,
        lastWalletType: user.lastWalletType,
        lastConnectionPlatform: user.lastConnectionPlatform,
        lastConnectionTime: user.lastConnectionTime,
        activeSessionId: user.activeSessionId,
        sessionExpiresAt: user.sessionExpiresAt,
        sessionValid,
        totalConnections: user.totalConnectionCount || 0,
      },
    };
  },
});
