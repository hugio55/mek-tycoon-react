/**
 * Wallet Authentication Module
 * Implements secure wallet authentication using nonce-based challenge-response
 * Uses CIP-30 standard for Cardano wallet signatures
 */

import { mutation, query, action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

// Type for verification result
type VerificationResult = {
  success: boolean;
  verified: boolean;
  expiresAt?: number;
  error?: string;
};

// Nonce expires after 5 minutes (300000 ms)
const NONCE_EXPIRY_MS = 5 * 60 * 1000;

// Session expires after 24 hours
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

// Rate limit: max 10 failed attempts per hour per wallet
const MAX_FAILED_ATTEMPTS = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Lockout duration: 1 hour after too many failed attempts
const LOCKOUT_DURATION_MS = 60 * 60 * 1000;

/**
 * Generate a secure random nonce for wallet signing
 */
function generateRandomNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

/**
 * Build the message that the wallet will sign
 */
function buildSigningMessage(nonce: string, origin?: string): string {
  const timestamp = new Date().toISOString();
  const originPart = origin ? `\nOrigin: ${origin}` : '';
  return `Sign this message to verify wallet ownership for Mek Tycoon.\n\nNonce: ${nonce}\nTimestamp: ${timestamp}${originPart}\n\nThis signature will not trigger any blockchain transactions or cost any ADA.`;
}

/**
 * Generate a nonce for wallet authentication
 * Called when a user initiates wallet connection
 */
export const generateNonce = mutation({
  args: {
    stakeAddress: v.string(),
    walletName: v.string(),
    origin: v.optional(v.string()),
    deviceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("[WalletAuth] Generating nonce for:", args.stakeAddress.substring(0, 20) + "...");

    // Check rate limit - look for lockouts
    const lockout = await ctx.db
      .query("walletAuthLockouts")
      .withIndex("by_stake_address", (q) => q.eq("stakeAddress", args.stakeAddress))
      .first();

    if (lockout && lockout.lockedUntil > Date.now()) {
      const remainingMs = lockout.lockedUntil - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw new Error(`Rate limit exceeded. Please wait ${remainingMin} minutes before trying again.`);
    }

    // Generate new nonce
    const nonce = generateRandomNonce();
    const expiresAt = Date.now() + NONCE_EXPIRY_MS;
    const message = buildSigningMessage(nonce, args.origin);

    // Delete any existing unused nonces for this wallet
    const existingNonces = await ctx.db
      .query("walletSignatures")
      .withIndex("by_stake_address", (q) => q.eq("stakeAddress", args.stakeAddress))
      .filter((q) => q.eq(q.field("usedAt"), undefined))
      .collect();

    for (const existing of existingNonces) {
      await ctx.db.delete(existing._id);
    }

    // Create new nonce record
    await ctx.db.insert("walletSignatures", {
      stakeAddress: args.stakeAddress,
      nonce,
      signature: "", // Will be filled when verified
      walletName: args.walletName,
      verified: false,
      expiresAt,
      createdAt: Date.now(),
      deviceId: args.deviceId,
      origin: args.origin,
    });

    console.log("[WalletAuth] Nonce generated, expires at:", new Date(expiresAt).toISOString());

    return {
      nonce,
      expiresAt,
      message,
    };
  },
});

/**
 * Verify the signature from the wallet
 * This is an action because it calls the verifyCardanoSignature action
 */
export const verifySignature = action({
  args: {
    stakeAddress: v.string(),
    nonce: v.string(),
    signature: v.string(),
    walletName: v.string(),
  },
  handler: async (ctx, args): Promise<VerificationResult> => {
    console.log("[WalletAuth] Verifying signature for:", args.stakeAddress.substring(0, 20) + "...");

    try {
      // Find the nonce record
      const nonceRecord = await ctx.runQuery(internal.walletAuthentication.getNonceRecord, {
        stakeAddress: args.stakeAddress,
        nonce: args.nonce,
      });

      if (!nonceRecord) {
        console.error("[WalletAuth] Nonce not found");
        return { success: false, verified: false, error: "Invalid or expired nonce" };
      }

      if (nonceRecord.usedAt) {
        console.error("[WalletAuth] Nonce already used");
        return { success: false, verified: false, error: "Nonce already consumed" };
      }

      if (nonceRecord.expiresAt < Date.now()) {
        console.error("[WalletAuth] Nonce expired");
        return { success: false, verified: false, error: "Nonce expired" };
      }

      // Rebuild the message that should have been signed
      const message = buildSigningMessage(args.nonce, nonceRecord.origin);

      // Verify the signature using the Cardano signature verifier
      const verifyResult: { valid: boolean; error?: string } = await ctx.runAction(api.actions.verifyCardanoSignature.verifyCardanoSignature, {
        stakeAddress: args.stakeAddress,
        signature: args.signature,
        message,
        nonce: args.nonce,
      });

      if (!verifyResult.valid) {
        console.error("[WalletAuth] Signature verification failed:", verifyResult.error);

        // Record failed attempt
        await ctx.runMutation(internal.walletAuthentication.recordFailedAttempt, {
          stakeAddress: args.stakeAddress,
        });

        return { success: false, verified: false, error: verifyResult.error || "Invalid signature" };
      }

      // Mark nonce as used and store signature
      const sessionExpiresAt = Date.now() + SESSION_EXPIRY_MS;
      await ctx.runMutation(internal.walletAuthentication.markNonceUsed, {
        stakeAddress: args.stakeAddress,
        nonce: args.nonce,
        signature: args.signature,
        sessionExpiresAt,
      });

      // Clear any failed attempt counter
      await ctx.runMutation(internal.walletAuthentication.clearFailedAttempts, {
        stakeAddress: args.stakeAddress,
      });

      console.log("[WalletAuth] Signature verified successfully");

      return {
        success: true,
        verified: true,
        expiresAt: sessionExpiresAt,
      };
    } catch (error: any) {
      console.error("[WalletAuth] Verification error:", error);
      return {
        success: false,
        verified: false,
        error: error.message || "Verification failed",
      };
    }
  },
});

/**
 * Check if a wallet is currently authenticated
 */
export const checkAuthentication = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the most recent used nonce for this wallet
    const latestAuth = await ctx.db
      .query("walletSignatures")
      .withIndex("by_stake_address", (q) => q.eq("stakeAddress", args.stakeAddress))
      .filter((q) =>
        q.and(
          q.neq(q.field("usedAt"), undefined),
          q.eq(q.field("revokedAt"), undefined)
        )
      )
      .order("desc")
      .first();

    if (!latestAuth) {
      return { authenticated: false };
    }

    // Check if session is still valid
    const sessionExpiresAt = (latestAuth.usedAt || 0) + SESSION_EXPIRY_MS;
    if (sessionExpiresAt < Date.now()) {
      return { authenticated: false, reason: "Session expired" };
    }

    return {
      authenticated: true,
      expiresAt: sessionExpiresAt,
      walletName: latestAuth.walletName,
    };
  },
});

/**
 * Revoke authentication (for wallet disconnect)
 */
export const revokeAuthentication = mutation({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("[WalletAuth] Revoking authentication for:", args.stakeAddress.substring(0, 20) + "...");

    // Find all active authentications for this wallet
    const activeAuths = await ctx.db
      .query("walletSignatures")
      .withIndex("by_stake_address", (q) => q.eq("stakeAddress", args.stakeAddress))
      .filter((q) =>
        q.and(
          q.neq(q.field("usedAt"), undefined),
          q.eq(q.field("revokedAt"), undefined)
        )
      )
      .collect();

    const revokedAt = Date.now();
    for (const auth of activeAuths) {
      await ctx.db.patch(auth._id, { revokedAt });
    }

    console.log("[WalletAuth] Revoked", activeAuths.length, "authentication(s)");

    return { success: true, revokedCount: activeAuths.length };
  },
});

/**
 * Admin function to reset rate limit for a wallet
 */
export const resetWalletRateLimit = mutation({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("[WalletAuth] Admin reset rate limit for:", args.stakeAddress.substring(0, 20) + "...");

    // Delete any lockouts
    const lockouts = await ctx.db
      .query("walletAuthLockouts")
      .withIndex("by_stake_address", (q) => q.eq("stakeAddress", args.stakeAddress))
      .collect();

    for (const lockout of lockouts) {
      await ctx.db.delete(lockout._id);
    }

    // Delete any failed attempt records
    const failedAttempts = await ctx.db
      .query("walletAuthFailedAttempts")
      .withIndex("by_stake_address", (q) => q.eq("stakeAddress", args.stakeAddress))
      .collect();

    for (const attempt of failedAttempts) {
      await ctx.db.delete(attempt._id);
    }

    return {
      success: true,
      lockoutsCleared: lockouts.length,
      failedAttemptsCleared: failedAttempts.length,
    };
  },
});

// ==========================================
// Internal mutations (not exposed via API)
// ==========================================

/**
 * Get nonce record (internal query)
 */
export const getNonceRecord = internalQuery({
  args: {
    stakeAddress: v.string(),
    nonce: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("walletSignatures")
      .withIndex("by_nonce", (q) => q.eq("nonce", args.nonce))
      .filter((q) => q.eq(q.field("stakeAddress"), args.stakeAddress))
      .first();
  },
});

/**
 * Mark nonce as used
 */
export const markNonceUsed = internalMutation({
  args: {
    stakeAddress: v.string(),
    nonce: v.string(),
    signature: v.string(),
    sessionExpiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("walletSignatures")
      .withIndex("by_nonce", (q) => q.eq("nonce", args.nonce))
      .filter((q) => q.eq(q.field("stakeAddress"), args.stakeAddress))
      .first();

    if (record) {
      await ctx.db.patch(record._id, {
        signature: args.signature,
        verified: true,
        usedAt: Date.now(),
      });
    }
  },
});

/**
 * Record a failed authentication attempt
 */
export const recordFailedAttempt = internalMutation({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    // Count recent failed attempts
    const recentAttempts = await ctx.db
      .query("walletAuthFailedAttempts")
      .withIndex("by_stake_address", (q) => q.eq("stakeAddress", args.stakeAddress))
      .filter((q) => q.gte(q.field("timestamp"), windowStart))
      .collect();

    // Record this attempt
    await ctx.db.insert("walletAuthFailedAttempts", {
      stakeAddress: args.stakeAddress,
      timestamp: now,
    });

    // Check if we should lock out
    if (recentAttempts.length + 1 >= MAX_FAILED_ATTEMPTS) {
      console.log("[WalletAuth] Rate limit exceeded for:", args.stakeAddress.substring(0, 20) + "...");

      // Create or update lockout
      const existingLockout = await ctx.db
        .query("walletAuthLockouts")
        .withIndex("by_stake_address", (q) => q.eq("stakeAddress", args.stakeAddress))
        .first();

      if (existingLockout) {
        await ctx.db.patch(existingLockout._id, {
          lockedUntil: now + LOCKOUT_DURATION_MS,
          failedAttempts: recentAttempts.length + 1,
        });
      } else {
        await ctx.db.insert("walletAuthLockouts", {
          stakeAddress: args.stakeAddress,
          lockedUntil: now + LOCKOUT_DURATION_MS,
          failedAttempts: recentAttempts.length + 1,
          createdAt: now,
        });
      }
    }
  },
});

/**
 * Clear failed attempts after successful auth
 */
export const clearFailedAttempts = internalMutation({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Delete all failed attempt records
    const attempts = await ctx.db
      .query("walletAuthFailedAttempts")
      .withIndex("by_stake_address", (q) => q.eq("stakeAddress", args.stakeAddress))
      .collect();

    for (const attempt of attempts) {
      await ctx.db.delete(attempt._id);
    }

    // Delete any lockouts
    const lockouts = await ctx.db
      .query("walletAuthLockouts")
      .withIndex("by_stake_address", (q) => q.eq("stakeAddress", args.stakeAddress))
      .collect();

    for (const lockout of lockouts) {
      await ctx.db.delete(lockout._id);
    }
  },
});

/**
 * Cleanup expired nonces (called by cron job)
 */
export const cleanupExpiredNonces = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let deletedCount = 0;

    // Find expired, unused nonces
    const expiredNonces = await ctx.db
      .query("walletSignatures")
      .withIndex("by_expires", (q) => q.lt("expiresAt", now))
      .filter((q) => q.eq(q.field("usedAt"), undefined))
      .take(100); // Limit to 100 per run

    for (const nonce of expiredNonces) {
      await ctx.db.delete(nonce._id);
      deletedCount++;
    }

    if (deletedCount > 0) {
      console.log("[WalletAuth Cleanup] Deleted", deletedCount, "expired nonces");
    }

    return { deletedCount };
  },
});

/**
 * Cleanup expired lockouts (called by cron job)
 */
export const cleanupExpiredLockouts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let deletedLockouts = 0;
    let deletedAttempts = 0;

    // Find expired lockouts
    const expiredLockouts = await ctx.db
      .query("walletAuthLockouts")
      .filter((q) => q.lt(q.field("lockedUntil"), now))
      .take(100);

    for (const lockout of expiredLockouts) {
      await ctx.db.delete(lockout._id);
      deletedLockouts++;
    }

    // Find old failed attempts (older than rate limit window)
    const windowStart = now - RATE_LIMIT_WINDOW_MS;
    const oldAttempts = await ctx.db
      .query("walletAuthFailedAttempts")
      .filter((q) => q.lt(q.field("timestamp"), windowStart))
      .take(100);

    for (const attempt of oldAttempts) {
      await ctx.db.delete(attempt._id);
      deletedAttempts++;
    }

    if (deletedLockouts > 0 || deletedAttempts > 0) {
      console.log("[WalletAuth Cleanup] Deleted", deletedLockouts, "lockouts,", deletedAttempts, "old attempts");
    }

    return { deletedLockouts, deletedAttempts };
  },
});
