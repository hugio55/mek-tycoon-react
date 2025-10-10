/**
 * Session Management
 *
 * Robust session tracking system that separates authentication (signatures)
 * from authorization (sessions). This prevents the "24-hour cleanup bug"
 * where sessions were expired early due to signature cleanup.
 *
 * Key Features:
 * - Sessions have independent 24-hour lifecycle
 * - Session extension support
 * - Multi-device session tracking
 * - Manual revocation support
 * - Clean separation from signature verification
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Create a new session after successful signature verification
 */
export const createSession = mutation({
  args: {
    sessionId: v.string(),
    stakeAddress: v.string(),
    walletName: v.string(),
    deviceId: v.optional(v.string()),
    platform: v.optional(v.string()),
    origin: v.optional(v.string()),
    nonce: v.optional(v.string()),
    signatureId: v.optional(v.id("walletSignatures")),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + SESSION_DURATION;

    // Check for existing active session with same sessionId
    const existingSession = await ctx.db
      .query("walletSessions")
      .withIndex("by_session_id", q => q.eq("sessionId", args.sessionId))
      .first();

    if (existingSession && existingSession.isActive) {
      // Update existing session instead of creating duplicate
      await ctx.db.patch(existingSession._id, {
        lastActivityAt: now,
        expiresAt: expiresAt,
      });

      console.log(`[Sessions] Refreshed existing session for ${args.stakeAddress}`);
      return {
        sessionId: args.sessionId,
        expiresAt,
        refreshed: true,
      };
    }

    // Create new session
    await ctx.db.insert("walletSessions", {
      sessionId: args.sessionId,
      stakeAddress: args.stakeAddress,
      walletName: args.walletName,
      createdAt: now,
      expiresAt,
      lastActivityAt: now,
      isActive: true,
      deviceId: args.deviceId,
      platform: args.platform,
      origin: args.origin,
      nonce: args.nonce,
      signatureId: args.signatureId,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });

    console.log(`[Sessions] Created new session for ${args.stakeAddress}, expires at ${new Date(expiresAt).toISOString()}`);

    return {
      sessionId: args.sessionId,
      expiresAt,
      created: true,
    };
  }
});

/**
 * Validate a session by sessionId
 * Returns session data if valid, null if expired/invalid
 */
export const validateSession = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("walletSessions")
      .withIndex("by_session_id", q => q.eq("sessionId", args.sessionId))
      .first();

    if (!session) {
      return null;
    }

    const now = Date.now();

    // Check if session is expired
    if (session.expiresAt < now) {
      console.log(`[Sessions] Session ${args.sessionId} expired at ${new Date(session.expiresAt).toISOString()}`);
      return null;
    }

    // Check if session is revoked
    if (session.revokedAt) {
      console.log(`[Sessions] Session ${args.sessionId} was revoked at ${new Date(session.revokedAt).toISOString()}`);
      return null;
    }

    // Check if session is inactive
    if (!session.isActive) {
      console.log(`[Sessions] Session ${args.sessionId} is inactive`);
      return null;
    }

    return {
      sessionId: session.sessionId,
      stakeAddress: session.stakeAddress,
      walletName: session.walletName,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      lastActivityAt: session.lastActivityAt,
      platform: session.platform,
      deviceId: session.deviceId,
    };
  }
});

/**
 * Validate session by stake address
 * Returns the most recent active session for this wallet
 */
export const validateSessionByAddress = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find the most recent active session
    const sessions = await ctx.db
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

    if (sessions.length === 0) {
      return null;
    }

    const session = sessions[0];

    return {
      sessionId: session.sessionId,
      stakeAddress: session.stakeAddress,
      walletName: session.walletName,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      lastActivityAt: session.lastActivityAt,
      platform: session.platform,
      deviceId: session.deviceId,
    };
  }
});

/**
 * Restore/refresh session from localStorage during auto-reconnect
 * This is more lenient than extendSession - it can revive expired backend sessions
 * if the localStorage session is still valid (within 24 hours)
 */
export const restoreOrCreateSession = mutation({
  args: {
    sessionId: v.string(),
    stakeAddress: v.string(),
    walletName: v.string(),
    deviceId: v.optional(v.string()),
    platform: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const newExpiresAt = now + SESSION_DURATION;

    // Look for existing session by sessionId
    const existingSession = await ctx.db
      .query("walletSessions")
      .withIndex("by_session_id", q => q.eq("sessionId", args.sessionId))
      .first();

    if (existingSession) {
      // Found existing session - refresh it (even if expired/inactive)
      // This allows localStorage to "revive" backend sessions
      await ctx.db.patch(existingSession._id, {
        lastActivityAt: now,
        expiresAt: newExpiresAt,
        isActive: true, // Reactivate if it was marked inactive
        revokedAt: undefined, // Clear revocation (localStorage takes precedence)
      });

      console.log(`[Sessions] Restored existing session ${args.sessionId} for ${args.stakeAddress}, new expiry: ${new Date(newExpiresAt).toISOString()}`);

      return {
        success: true,
        expiresAt: newExpiresAt,
        restored: true,
      };
    }

    // No existing session - create a new one
    // This handles the case where backend session was deleted but localStorage is still valid
    await ctx.db.insert("walletSessions", {
      sessionId: args.sessionId,
      stakeAddress: args.stakeAddress,
      walletName: args.walletName,
      createdAt: now,
      expiresAt: newExpiresAt,
      lastActivityAt: now,
      isActive: true,
      deviceId: args.deviceId,
      platform: args.platform,
    });

    console.log(`[Sessions] Created new session from localStorage ${args.sessionId} for ${args.stakeAddress}, expires: ${new Date(newExpiresAt).toISOString()}`);

    return {
      success: true,
      expiresAt: newExpiresAt,
      created: true,
    };
  }
});

/**
 * Extend session expiration by updating last activity
 */
export const extendSession = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("walletSessions")
      .withIndex("by_session_id", q => q.eq("sessionId", args.sessionId))
      .first();

    if (!session) {
      throw new Error("Session not found");
    }

    const now = Date.now();

    // Check if session is still valid
    if (session.expiresAt < now) {
      throw new Error("Session expired - cannot extend");
    }

    if (session.revokedAt) {
      throw new Error("Session revoked - cannot extend");
    }

    // Extend expiration by 24 hours from now
    const newExpiresAt = now + SESSION_DURATION;

    await ctx.db.patch(session._id, {
      lastActivityAt: now,
      expiresAt: newExpiresAt,
    });

    console.log(`[Sessions] Extended session ${args.sessionId} until ${new Date(newExpiresAt).toISOString()}`);

    return {
      success: true,
      expiresAt: newExpiresAt,
    };
  }
});

/**
 * Update last activity timestamp (lightweight extension)
 */
export const updateActivity = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("walletSessions")
      .withIndex("by_session_id", q => q.eq("sessionId", args.sessionId))
      .first();

    if (!session) {
      return { success: false, error: "Session not found" };
    }

    const now = Date.now();

    // Only update if session is still valid
    if (session.expiresAt < now || session.revokedAt || !session.isActive) {
      return { success: false, error: "Session invalid" };
    }

    await ctx.db.patch(session._id, {
      lastActivityAt: now,
    });

    return { success: true };
  }
});

/**
 * Revoke a session (manual logout)
 */
export const revokeSession = mutation({
  args: {
    sessionId: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("walletSessions")
      .withIndex("by_session_id", q => q.eq("sessionId", args.sessionId))
      .first();

    if (!session) {
      throw new Error("Session not found");
    }

    const now = Date.now();

    await ctx.db.patch(session._id, {
      isActive: false,
      revokedAt: now,
      revokeReason: args.reason || "Manual logout",
    });

    console.log(`[Sessions] Revoked session ${args.sessionId}: ${args.reason || "Manual logout"}`);

    return { success: true };
  }
});

/**
 * Revoke all sessions for a wallet (logout everywhere)
 */
export const revokeAllSessions = mutation({
  args: {
    stakeAddress: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("walletSessions")
      .withIndex("by_stake_and_active", q =>
        q.eq("stakeAddress", args.stakeAddress).eq("isActive", true)
      )
      .collect();

    const now = Date.now();
    let revokedCount = 0;

    for (const session of sessions) {
      await ctx.db.patch(session._id, {
        isActive: false,
        revokedAt: now,
        revokeReason: args.reason || "Logout from all devices",
      });
      revokedCount++;
    }

    console.log(`[Sessions] Revoked ${revokedCount} sessions for ${args.stakeAddress}`);

    return {
      success: true,
      revokedCount,
    };
  }
});

/**
 * Clean up expired sessions
 * Should be run on a schedule (e.g., hourly)
 */
export const cleanupExpiredSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find all expired sessions
    const allSessions = await ctx.db.query("walletSessions").collect();

    let expiredCount = 0;
    let revokedCount = 0;

    for (const session of allSessions) {
      let shouldDelete = false;

      // Delete if expired for more than 7 days (keep recent for audit)
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      if (session.expiresAt < sevenDaysAgo) {
        expiredCount++;
        shouldDelete = true;
      }

      // Delete if revoked for more than 7 days
      if (session.revokedAt && session.revokedAt < sevenDaysAgo) {
        revokedCount++;
        shouldDelete = true;
      }

      if (shouldDelete) {
        await ctx.db.delete(session._id);
      } else if (session.expiresAt < now && session.isActive) {
        // Mark as inactive but don't delete yet (for audit trail)
        await ctx.db.patch(session._id, {
          isActive: false,
        });
      }
    }

    const totalCleaned = expiredCount + revokedCount;

    console.log(`[Sessions] Cleanup: ${expiredCount} expired, ${revokedCount} revoked, ${totalCleaned} total deleted`);

    return {
      cleaned: totalCleaned,
      expired: expiredCount,
      revoked: revokedCount,
      timestamp: now,
    };
  }
});

/**
 * Get all active sessions for a wallet (for "active devices" view)
 */
export const getActiveSessions = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const sessions = await ctx.db
      .query("walletSessions")
      .withIndex("by_stake_and_active", q =>
        q.eq("stakeAddress", args.stakeAddress).eq("isActive", true)
      )
      .filter(q => q.gt(q.field("expiresAt"), now))
      .collect();

    return sessions.map(session => ({
      sessionId: session.sessionId,
      platform: session.platform,
      deviceId: session.deviceId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      lastActivityAt: session.lastActivityAt,
      origin: session.origin,
    }));
  }
});
