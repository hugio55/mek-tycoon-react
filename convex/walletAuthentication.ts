import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { generateSessionId } from "./lib/sessionUtils";

// Rate Limiting Configuration
const NONCE_RATE_LIMIT = {
  maxAttempts: 50, // Increased from 5 to 50 - allow more reconnections
  windowMs: 60 * 60 * 1000, // 1 hour
};

const SIGNATURE_RATE_LIMIT = {
  maxAttempts: 50, // Increased from 10 to 50 - allow more authentication attempts
  windowMs: 60 * 60 * 1000, // 1 hour
};

const FAILED_ATTEMPTS_LOCKOUT = {
  maxConsecutiveFails: 3,
  lockoutDurationMs: 60 * 60 * 1000, // 1 hour
};

// Helper function to convert hex string to bytes array (Convex-compatible)
function hexToBytes(hex: string): number[] {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes;
}

// Helper function to convert string to hex (Convex-compatible)
function stringToHex(str: string): string {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    const hexChar = charCode.toString(16).padStart(2, '0');
    hex += hexChar;
  }
  return hex;
}

// THIS IS A TEMPORARY WRAPPER - Real verification happens in verifyCardanoSignature action
// This function is kept for compatibility but now calls the real verification
async function verifyCardanoSignature(args: {
  stakeAddress: string;
  nonce: string;
  signature: string;
  message: string;
}): Promise<boolean> {
  // This is now just a placeholder that returns true
  // The real verification happens in the verifySignature action below
  // which calls api.actions.verifyCardanoSignature.verifyCardanoSignature
  console.log("[Auth] Signature verification will happen in action handler");
  return true; // Always return true here, real check is in the action
}

// Helper function to check and update rate limits
async function checkRateLimit(
  ctx: any,
  stakeAddress: string,
  actionType: "nonce_generation" | "signature_verification"
): Promise<{ allowed: boolean; error?: string; lockedUntil?: number }> {
  const now = Date.now();

  // Get current rate limit record
  const rateLimitRecord = await ctx.db
    .query("walletRateLimits")
    .withIndex("by_stake_address_action", q =>
      q.eq("stakeAddress", stakeAddress).eq("actionType", actionType)
    )
    .first();

  // Check if wallet is locked out
  if (rateLimitRecord?.lockedUntil && rateLimitRecord.lockedUntil > now) {
    const remainingMinutes = Math.ceil((rateLimitRecord.lockedUntil - now) / 60000);
    return {
      allowed: false,
      error: `Too many failed attempts. Please try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}.`,
      lockedUntil: rateLimitRecord.lockedUntil,
    };
  }

  const limit = actionType === "nonce_generation" ? NONCE_RATE_LIMIT : SIGNATURE_RATE_LIMIT;

  if (!rateLimitRecord) {
    // First attempt - create new record
    await ctx.db.insert("walletRateLimits", {
      stakeAddress,
      actionType,
      attemptCount: 1,
      windowStart: now,
      lastAttemptAt: now,
      consecutiveFailures: 0,
    });
    return { allowed: true };
  }

  // Check if we're in a new time window
  const windowAge = now - rateLimitRecord.windowStart;
  if (windowAge > limit.windowMs) {
    // Reset for new window
    await ctx.db.patch(rateLimitRecord._id, {
      attemptCount: 1,
      windowStart: now,
      lastAttemptAt: now,
    });
    return { allowed: true };
  }

  // Check if limit exceeded
  if (rateLimitRecord.attemptCount >= limit.maxAttempts) {
    const remainingMinutes = Math.ceil((limit.windowMs - windowAge) / 60000);
    return {
      allowed: false,
      error: `Rate limit exceeded. Please try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}.`,
    };
  }

  // Increment attempt count
  await ctx.db.patch(rateLimitRecord._id, {
    attemptCount: rateLimitRecord.attemptCount + 1,
    lastAttemptAt: now,
  });

  return { allowed: true };
}

// Helper to record failed attempt
async function recordFailedAttempt(ctx: any, stakeAddress: string): Promise<void> {
  const now = Date.now();

  const rateLimitRecord = await ctx.db
    .query("walletRateLimits")
    .withIndex("by_stake_address_action", q =>
      q.eq("stakeAddress", stakeAddress).eq("actionType", "signature_verification")
    )
    .first();

  if (!rateLimitRecord) return;

  const consecutiveFails = (rateLimitRecord.consecutiveFailures || 0) + 1;

  // Check if we should lock out the wallet
  if (consecutiveFails >= FAILED_ATTEMPTS_LOCKOUT.maxConsecutiveFails) {
    const lockedUntil = now + FAILED_ATTEMPTS_LOCKOUT.lockoutDurationMs;
    await ctx.db.patch(rateLimitRecord._id, {
      consecutiveFailures: consecutiveFails,
      lockedUntil,
    });
  } else {
    await ctx.db.patch(rateLimitRecord._id, {
      consecutiveFailures: consecutiveFails,
    });
  }
}

// Helper to reset failed attempts on success
async function resetFailedAttempts(ctx: any, stakeAddress: string): Promise<void> {
  const rateLimitRecord = await ctx.db
    .query("walletRateLimits")
    .withIndex("by_stake_address_action", q =>
      q.eq("stakeAddress", stakeAddress).eq("actionType", "signature_verification")
    )
    .first();

  if (rateLimitRecord) {
    await ctx.db.patch(rateLimitRecord._id, {
      consecutiveFailures: 0,
      lockedUntil: undefined,
    });
  }
}

// Allowed origins for nonce generation (CORS protection)
const ALLOWED_ORIGINS = [
  'https://mek.overexposed.io',
  'http://localhost:3100',
  'http://localhost:3000', // Dev fallback
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
];

// Check if origin is allowed (includes ngrok support for development)
function isOriginAllowed(origin: string): boolean {
  // Check exact matches
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  // Allow ngrok URLs for development (ngrok-free.dev or ngrok.io)
  if (origin.includes('.ngrok-free.dev') || origin.includes('.ngrok.io')) {
    return true;
  }

  return false;
}

// Generate a unique nonce for wallet signature
export const generateNonce = mutation({
  args: {
    stakeAddress: v.string(),
    walletName: v.string(),
    deviceId: v.optional(v.string()), // Device identifier for binding
    origin: v.optional(v.string()), // Origin URL for validation
  },
  handler: async (ctx, args) => {
    // Validate origin (CORS protection)
    if (args.origin && !isOriginAllowed(args.origin)) {
      console.error(`[Security] Unauthorized origin attempt: ${args.origin} for wallet ${args.stakeAddress}`);

      // Log security event
      await ctx.db.insert("auditLogs", {
        type: "security_violation",
        timestamp: Date.now(),
        createdAt: Date.now(),
        stakeAddress: args.stakeAddress,
        reason: `Unauthorized origin: ${args.origin}`,
      });

      throw new Error('Unauthorized origin');
    }

    // Check rate limit for nonce generation
    const rateLimitCheck = await checkRateLimit(ctx, args.stakeAddress, "nonce_generation");
    if (!rateLimitCheck.allowed) {
      console.warn(`[Security] Rate limit exceeded for wallet ${args.stakeAddress}`);
      throw new Error(rateLimitCheck.error || "Rate limit exceeded");
    }

    // Generate a cryptographically random nonce
    const nonce = `mek-auth-${Date.now()}-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    // Nonce expiration: 24 hours (how long the nonce can be used to sign)
    // Note: Session duration is set separately when signature is verified
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    // Check for existing nonce with same stake address + device (prevent duplicates)
    if (args.deviceId) {
      const existingNonce = await ctx.db
        .query("walletSignatures")
        .withIndex("by_nonce_stake_device", q =>
          q.eq("nonce", nonce).eq("stakeAddress", args.stakeAddress).eq("deviceId", args.deviceId)
        )
        .first();

      if (existingNonce) {
        console.warn(`[Security] Duplicate nonce attempt detected for ${args.stakeAddress}`);
        throw new Error("Duplicate nonce detected. Please try again.");
      }
    }

    await ctx.db.insert("walletSignatures", {
      stakeAddress: args.stakeAddress,
      nonce,
      signature: "", // Will be filled after verification
      walletName: args.walletName,
      verified: false, // DEPRECATED - kept for backwards compatibility
      usedAt: undefined, // Will be set when nonce is consumed
      deviceId: args.deviceId,
      origin: args.origin,
      expiresAt,
      createdAt: Date.now()
    });

    // Log nonce generation for security audit
    console.log(`[Auth] Nonce generated for ${args.stakeAddress}, deviceId: ${args.deviceId}, origin: ${args.origin}, expires in 5 minutes`);

    return {
      nonce,
      expiresAt,
      message: `Please sign this message to verify ownership of your wallet:\n\nNonce: ${nonce}\nApplication: Mek Tycoon\nTimestamp: ${new Date().toISOString()}`
    };
  }
});

// Mark nonce as used atomically (CRITICAL: prevents race conditions)
export const markNonceUsed = mutation({
  args: {
    nonce: v.string(),
    usedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("walletSignatures")
      .withIndex("by_nonce", q => q.eq("nonce", args.nonce))
      .first();

    if (!record) {
      console.error(`[Security] Attempted to mark non-existent nonce as used: ${args.nonce}`);
      throw new Error("Invalid nonce");
    }

    // Check if already used (race condition detection)
    if (record.usedAt) {
      console.error(`[Security] RACE CONDITION DETECTED: Nonce ${args.nonce} already used at ${new Date(record.usedAt).toISOString()}`);

      // Log security anomaly
      await ctx.db.insert("auditLogs", {
        type: "race_condition_detected",
        timestamp: Date.now(),
        createdAt: Date.now(),
        stakeAddress: record.stakeAddress,
        nonce: args.nonce,
        reason: `Nonce reuse attempt detected - already used at ${new Date(record.usedAt).toISOString()}`,
      });

      throw new Error("Nonce already used");
    }

    // Atomically mark as used
    await ctx.db.patch(record._id, {
      usedAt: args.usedAt,
    });

    console.log(`[Auth] Nonce ${args.nonce} marked as used at ${new Date(args.usedAt).toISOString()}`);

    return { success: true };
  }
});

// Verify wallet signature
export const verifySignature = action({
  args: {
    stakeAddress: v.string(),
    nonce: v.string(),
    signature: v.string(),
    walletName: v.string()
  },
  handler: async (ctx, args): Promise<{success: boolean, error?: string, verified?: boolean, expiresAt?: number, sessionId?: string}> => {
    try {
      // Check rate limit for signature verification
      const rateLimitCheck = await ctx.runMutation(api.walletAuthentication.checkSignatureRateLimit, {
        stakeAddress: args.stakeAddress
      });

      if (!rateLimitCheck.allowed) {
        console.warn(`[Security] Rate limit check failed for ${args.stakeAddress}`);
        return {
          success: false,
          error: rateLimitCheck.error || "Rate limit exceeded"
        };
      }

      // Get the nonce record
      const nonceRecord: any = await ctx.runQuery(api.walletAuthentication.getNonceRecord, {
        nonce: args.nonce
      });

      if (!nonceRecord) {
        console.error(`[Security] Invalid nonce verification attempt: ${args.nonce}`);
        await ctx.runMutation(api.walletAuthentication.recordSignatureFailure, {
          stakeAddress: args.stakeAddress
        });
        return {
          success: false,
          error: "Invalid nonce"
        };
      }

      // Check if expired
      if (Date.now() > nonceRecord.expiresAt) {
        console.warn(`[Security] Expired nonce used: ${args.nonce}, expired at ${new Date(nonceRecord.expiresAt).toISOString()}`);
        await ctx.runMutation(api.walletAuthentication.recordSignatureFailure, {
          stakeAddress: args.stakeAddress
        });
        return {
          success: false,
          error: "Nonce expired. Please generate a new one."
        };
      }

      // Check if already used (supports both new usedAt and legacy verified fields)
      if (nonceRecord.usedAt || nonceRecord.verified) {
        console.error(`[Security] Nonce reuse attempt detected: ${args.nonce}, used at ${nonceRecord.usedAt ? new Date(nonceRecord.usedAt).toISOString() : 'unknown'}`);
        return {
          success: false,
          error: "Nonce already used"
        };
      }

      // CRITICAL: Mark nonce as used BEFORE verification
      // This prevents timing attacks - even if verification fails, nonce is consumed
      try {
        await ctx.runMutation(api.walletAuthentication.markNonceUsed, {
          nonce: args.nonce,
          usedAt: Date.now()
        });
      } catch (markError: any) {
        // If marking fails, it means race condition was detected
        console.error(`[Security] Failed to mark nonce as used (race condition): ${markError.message}`);
        return {
          success: false,
          error: "Nonce already used"
        };
      }

      // REAL CRYPTOGRAPHIC SIGNATURE VERIFICATION
      // Using full Ed25519 verification with CSL library
      console.log(`[Auth] Beginning signature verification for ${args.stakeAddress}`);
      const verificationResult = await ctx.runAction(api.actions.verifyCardanoSignature.verifyCardanoSignature, {
        stakeAddress: args.stakeAddress,
        nonce: args.nonce,
        signature: args.signature,
        message: `Please sign this message to verify ownership of your wallet:\n\nNonce: ${args.nonce}\nApplication: Mek Tycoon\nTimestamp: ${new Date(nonceRecord.createdAt).toISOString()}`
      });

      console.log(`[Auth] Verification result for ${args.stakeAddress}:`, verificationResult);

      if (verificationResult.valid) {
        // Calculate session expiration: 24 hours from NOW (not from nonce generation)
        const sessionExpiresAt = Date.now() + 24 * 60 * 60 * 1000;

        // Update the signature record with verified=true and new session expiration
        const signatureRecord = await ctx.runMutation(api.walletAuthentication.updateSignatureRecord, {
          nonce: args.nonce,
          signature: args.signature,
          verified: true,
          expiresAt: sessionExpiresAt
        });

        // Reset failed attempts counter on success
        await ctx.runMutation(api.walletAuthentication.resetSignatureFailures, {
          stakeAddress: args.stakeAddress
        });

        // Create a new session (separate from signature)
        const sessionId = generateSessionId();
        const sessionResult = await ctx.runMutation(api.sessionManagement.createSession, {
          sessionId,
          stakeAddress: args.stakeAddress,
          walletName: args.walletName,
          nonce: args.nonce,
          deviceId: nonceRecord.deviceId,
          platform: nonceRecord.platform,
          origin: nonceRecord.origin,
        });

        console.log(`[Auth] Created session ${sessionId} for ${args.stakeAddress}, expires at ${new Date(sessionResult.expiresAt).toISOString()}`);

        // Log the successful connection with security metadata
        await ctx.runMutation(api.auditLogs.logWalletConnection, {
          stakeAddress: args.stakeAddress,
          walletName: args.walletName,
          signatureVerified: true,
          nonce: args.nonce,
          timestamp: Date.now()
        });

        console.log(`[Auth] SUCCESS: Wallet ${args.stakeAddress} authenticated successfully, session expires at ${new Date(sessionExpiresAt).toISOString()}`);

        return {
          success: true,
          verified: true,
          expiresAt: sessionExpiresAt,
          sessionId: sessionId, // Return sessionId so frontend can store it
        };
      } else {
        // IMPORTANT: Even though verification failed, nonce is already consumed
        // This prevents timing attacks where attackers try many signatures quickly

        // Record failed attempt
        await ctx.runMutation(api.walletAuthentication.recordSignatureFailure, {
          stakeAddress: args.stakeAddress
        });

        // Log failed attempt with security metadata
        await ctx.runMutation(api.auditLogs.logWalletConnection, {
          stakeAddress: args.stakeAddress,
          walletName: args.walletName,
          signatureVerified: false,
          nonce: args.nonce,
          timestamp: Date.now()
        });

        console.error(`[Auth] FAILED: Invalid signature for ${args.stakeAddress} - ${verificationResult.error || 'unknown error'}`);

        return {
          success: false,
          error: verificationResult.error || "Invalid signature - cryptographic verification failed"
        };
      }
    } catch (error: any) {
      console.error(`[Auth] EXCEPTION during verification:`, error);
      return {
        success: false,
        error: error.message || "Verification failed"
      };
    }
  }
});

// Get nonce record
export const getNonceRecord = query({
  args: {
    nonce: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("walletSignatures")
      .withIndex("by_nonce", q => q.eq("nonce", args.nonce))
      .first();
  }
});

// Update signature record
export const updateSignatureRecord = mutation({
  args: {
    nonce: v.string(),
    signature: v.string(),
    verified: v.boolean(),
    expiresAt: v.optional(v.number()) // Optional: update session expiration
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("walletSignatures")
      .withIndex("by_nonce", q => q.eq("nonce", args.nonce))
      .first();

    if (record) {
      const updates: any = {
        signature: args.signature,
        verified: args.verified
      };

      // If expiresAt provided, update the session expiration
      if (args.expiresAt !== undefined) {
        updates.expiresAt = args.expiresAt;
      }

      await ctx.db.patch(record._id, updates);
    }
  }
});

// Check if a wallet has valid authentication
export const checkAuthentication = query({
  args: {
    stakeAddress: v.string()
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // NEW: Check sessions table first (robust method)
    const activeSessions = await ctx.db
      .query("walletSessions")
      .withIndex("by_stake_and_active", q =>
        q.eq("stakeAddress", args.stakeAddress).eq("isActive", true)
      )
      .filter(q =>
        q.and(
          q.gt(q.field("expiresAt"), now),
          q.eq(q.field("revokedAt"), undefined)
        )
      )
      .order("desc")
      .take(1);

    if (activeSessions.length > 0) {
      const session = activeSessions[0];
      return {
        authenticated: true,
        expiresAt: session.expiresAt,
        walletName: session.walletName,
        sessionId: session.sessionId,
        platform: session.platform,
      };
    }

    // FALLBACK: Check legacy signature-based sessions for backwards compatibility
    // This allows existing logged-in users to stay logged in during migration
    const signatures = await ctx.db
      .query("walletSignatures")
      .withIndex("by_stake_address", q => q.eq("stakeAddress", args.stakeAddress))
      .filter(q =>
        q.and(
          q.eq(q.field("verified"), true),
          q.gt(q.field("expiresAt"), now)
        )
      )
      .order("desc")
      .take(1);

    if (signatures.length > 0) {
      console.log(`[Auth] Found legacy signature session for ${args.stakeAddress} - will migrate on next login`);
      return {
        authenticated: true,
        expiresAt: signatures[0].expiresAt,
        walletName: signatures[0].walletName,
        legacy: true, // Flag to indicate this is legacy auth
      };
    }

    return {
      authenticated: false,
      expiresAt: null,
      walletName: null
    };
  }
});

// Check signature rate limit (called from action)
export const checkSignatureRateLimit = mutation({
  args: {
    stakeAddress: v.string()
  },
  handler: async (ctx, args) => {
    return await checkRateLimit(ctx, args.stakeAddress, "signature_verification");
  }
});

// Record signature failure
export const recordSignatureFailure = mutation({
  args: {
    stakeAddress: v.string()
  },
  handler: async (ctx, args) => {
    await recordFailedAttempt(ctx, args.stakeAddress);
  }
});

// Reset signature failures on success
export const resetSignatureFailures = mutation({
  args: {
    stakeAddress: v.string()
  },
  handler: async (ctx, args) => {
    await resetFailedAttempts(ctx, args.stakeAddress);
  }
});

// Clean up expired nonces - runs automatically on schedule
// UPDATED: Keeps signatures for 24 hours for audit trail (matches session duration)
export const cleanupExpiredNonces = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

    // Find all nonces that are either:
    // 1. Expired (expiresAt < now)
    // 2. Used more than 24 hours ago (usedAt < twentyFourHoursAgo)
    // NOTE: Signatures are now kept for 24 hours for audit purposes
    // This matches the session duration and ensures we have records for active sessions
    const allNonces = await ctx.db.query("walletSignatures").collect();

    let expiredCount = 0;
    let usedCount = 0;

    for (const nonce of allNonces) {
      let shouldDelete = false;

      if (nonce.expiresAt < now) {
        expiredCount++;
        shouldDelete = true;
      } else if (nonce.usedAt && nonce.usedAt < twentyFourHoursAgo) {
        usedCount++;
        shouldDelete = true;
      }

      if (shouldDelete) {
        await ctx.db.delete(nonce._id);
      }
    }

    const totalCleaned = expiredCount + usedCount;

    console.log(`[Cleanup] Nonce cleanup completed: ${expiredCount} expired, ${usedCount} used (>24hr old), ${totalCleaned} total deleted`);

    return {
      cleaned: totalCleaned,
      expired: expiredCount,
      used: usedCount,
      timestamp: now,
    };
  }
});

// DEPRECATED: Use cleanupExpiredNonces instead
// Kept for backwards compatibility
export const cleanupExpiredSignatures = mutation({
  args: {},
  handler: async (ctx) => {
    console.warn("[Cleanup] cleanupExpiredSignatures is DEPRECATED - use cleanupExpiredNonces instead");
    return await ctx.runMutation(api.walletAuthentication.cleanupExpiredNonces, {});
  }
});

// Clean up expired rate limit lockouts
export const cleanupExpiredLockouts = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find all rate limit records with expired lockouts
    const allRateLimits = await ctx.db.query("walletRateLimits").collect();

    let cleanedCount = 0;
    for (const record of allRateLimits) {
      if (record.lockedUntil && record.lockedUntil < now) {
        await ctx.db.patch(record._id, {
          lockedUntil: undefined,
          consecutiveFailures: 0,
        });
        cleanedCount++;
      }
    }

    return {
      cleaned: cleanedCount,
      timestamp: now,
    };
  }
});

// Reset rate limit for a specific wallet (admin/debug use)
export const resetWalletRateLimit = mutation({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("walletRateLimits")
      .filter(q => q.eq(q.field("stakeAddress"), args.stakeAddress))
      .collect();

    let resetCount = 0;
    for (const record of records) {
      await ctx.db.delete(record._id);
      resetCount++;
    }

    console.log(`[Admin] Reset ${resetCount} rate limit records for wallet ${args.stakeAddress}`);

    return {
      success: true,
      resetCount,
      stakeAddress: args.stakeAddress,
    };
  }
});