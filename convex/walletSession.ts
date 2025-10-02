import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Session duration: 7 days for mobile, 24 hours for desktop
const MOBILE_SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const DESKTOP_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Helper to detect platform from user agent
function detectPlatform(userAgent?: string): string {
  if (!userAgent) return "desktop";

  const ua = userAgent.toLowerCase();

  // Mobile detection
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
    return "mobile_ios";
  }
  if (ua.includes("android")) {
    // Check if it's a mobile web browser or wallet app
    if (ua.includes("chrome") || ua.includes("firefox") || ua.includes("safari")) {
      return "mobile_web";
    }
    return "mobile_android";
  }
  if (ua.includes("mobile")) {
    return "mobile_web";
  }

  return "desktop";
}

// Helper to generate session ID
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

// Enhanced wallet connection with session tracking
export const connectWalletEnhanced = mutation({
  args: {
    stakeAddress: v.string(),
    walletType: v.string(), // eternl, nami, flint, etc.
    platform: v.optional(v.string()), // Override platform detection
    deviceInfo: v.optional(v.object({
      userAgent: v.optional(v.string()),
      screenWidth: v.optional(v.number()),
      screenHeight: v.optional(v.number()),
      deviceType: v.optional(v.string()),
      os: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Detect platform from user agent if not provided
    const platform = args.platform || detectPlatform(args.deviceInfo?.userAgent);

    // Determine session duration based on platform
    const isMobile = platform.startsWith("mobile_");
    const sessionDuration = isMobile ? MOBILE_SESSION_DURATION : DESKTOP_SESSION_DURATION;
    const sessionExpiresAt = now + sessionDuration;

    // Generate new session ID
    const sessionId = generateSessionId();

    // Find or create user
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.stakeAddress))
      .first();

    if (existingUser) {
      // Update existing user with session info
      const connectionCount = (existingUser.totalConnectionCount || 0) + 1;

      await ctx.db.patch(existingUser._id, {
        lastWalletType: args.walletType,
        lastConnectionPlatform: platform,
        lastConnectionTime: now,
        activeSessionId: sessionId,
        sessionExpiresAt,
        totalConnectionCount: connectionCount,
        walletType: args.walletType,
        walletName: args.walletType,
        lastLogin: now,
        updatedAt: now,
      });

      return {
        success: true,
        sessionId,
        expiresAt: sessionExpiresAt,
        platform,
        isMobile,
        userId: existingUser._id,
      };
    } else {
      // Create new user with session info
      const userId = await ctx.db.insert("users", {
        walletAddress: args.stakeAddress,
        walletStakeAddress: args.stakeAddress,
        walletType: args.walletType,
        walletName: args.walletType,
        walletVerified: false,

        // Session tracking
        lastWalletType: args.walletType,
        lastConnectionPlatform: platform,
        lastConnectionTime: now,
        activeSessionId: sessionId,
        sessionExpiresAt,
        preferredWallet: args.walletType,
        totalConnectionCount: 1,

        // Initialize game resources
        totalEssence: {
          stone: 0, disco: 0, paul: 0, cartoon: 0, candy: 0,
          tiles: 0, moss: 0, bullish: 0, journalist: 0, laser: 0,
          flashbulb: 0, accordion: 0, turret: 0, drill: 0, security: 0,
        },
        gold: 0,
        craftingSlots: 1,

        // Timestamps
        lastLogin: now,
        createdAt: now,
        updatedAt: now,
      });

      return {
        success: true,
        sessionId,
        expiresAt: sessionExpiresAt,
        platform,
        isMobile,
        userId,
        isNewUser: true,
      };
    }
  },
});

// Validate if a session is still valid
export const validateSession = query({
  args: {
    stakeAddress: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.stakeAddress))
      .first();

    if (!user) {
      return {
        valid: false,
        reason: "user_not_found",
      };
    }

    // Check if session ID matches
    if (user.activeSessionId !== args.sessionId) {
      return {
        valid: false,
        reason: "session_mismatch",
      };
    }

    // Check if session expired
    const now = Date.now();
    if (user.sessionExpiresAt && user.sessionExpiresAt < now) {
      return {
        valid: false,
        reason: "session_expired",
        expiredAt: user.sessionExpiresAt,
      };
    }

    return {
      valid: true,
      expiresAt: user.sessionExpiresAt,
      platform: user.lastConnectionPlatform,
      walletType: user.lastWalletType,
    };
  },
});

// Enhanced disconnect with session cleanup
export const disconnectWalletEnhanced = mutation({
  args: {
    stakeAddress: v.string(),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.stakeAddress))
      .first();

    if (!user) {
      return {
        success: false,
        error: "user_not_found",
      };
    }

    // Verify session ID if provided
    if (args.sessionId && user.activeSessionId !== args.sessionId) {
      return {
        success: false,
        error: "session_mismatch",
      };
    }

    // Clear session data
    await ctx.db.patch(user._id, {
      activeSessionId: undefined,
      sessionExpiresAt: undefined,
      updatedAt: Date.now(),
    });

    return {
      success: true,
    };
  },
});

// Get current wallet connection state
export const getWalletConnectionState = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.stakeAddress))
      .first();

    if (!user) {
      return {
        connected: false,
        hasAccount: false,
      };
    }

    const now = Date.now();
    const sessionValid = user.activeSessionId &&
                        user.sessionExpiresAt &&
                        user.sessionExpiresAt > now;

    return {
      connected: sessionValid,
      hasAccount: true,
      sessionId: user.activeSessionId,
      expiresAt: user.sessionExpiresAt,
      platform: user.lastConnectionPlatform,
      walletType: user.lastWalletType,
      preferredWallet: user.preferredWallet,
      totalConnections: user.totalConnectionCount || 0,
      lastConnectionTime: user.lastConnectionTime,
    };
  },
});

// Refresh/extend an active session
export const refreshSession = mutation({
  args: {
    stakeAddress: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.stakeAddress))
      .first();

    if (!user) {
      return {
        success: false,
        error: "user_not_found",
      };
    }

    // Verify session ID
    if (user.activeSessionId !== args.sessionId) {
      return {
        success: false,
        error: "session_mismatch",
      };
    }

    // Check if session is expired
    const now = Date.now();
    if (user.sessionExpiresAt && user.sessionExpiresAt < now) {
      return {
        success: false,
        error: "session_expired",
      };
    }

    // Extend session
    const isMobile = user.lastConnectionPlatform?.startsWith("mobile_");
    const sessionDuration = isMobile ? MOBILE_SESSION_DURATION : DESKTOP_SESSION_DURATION;
    const newExpiresAt = now + sessionDuration;

    await ctx.db.patch(user._id, {
      sessionExpiresAt: newExpiresAt,
      lastConnectionTime: now,
      updatedAt: now,
    });

    return {
      success: true,
      expiresAt: newExpiresAt,
    };
  },
});

// Clean up expired sessions (run periodically via cron)
export const cleanupExpiredSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find all users with expired sessions
    const allUsers = await ctx.db.query("users").collect();

    let cleanedCount = 0;
    for (const user of allUsers) {
      if (user.sessionExpiresAt && user.sessionExpiresAt < now && user.activeSessionId) {
        await ctx.db.patch(user._id, {
          activeSessionId: undefined,
          sessionExpiresAt: undefined,
          updatedAt: now,
        });
        cleanedCount++;
      }
    }

    return {
      cleaned: cleanedCount,
      timestamp: now,
    };
  },
});

// Update preferred wallet
export const updatePreferredWallet = mutation({
  args: {
    stakeAddress: v.string(),
    preferredWallet: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.stakeAddress))
      .first();

    if (!user) {
      return {
        success: false,
        error: "user_not_found",
      };
    }

    await ctx.db.patch(user._id, {
      preferredWallet: args.preferredWallet,
      updatedAt: Date.now(),
    });

    return {
      success: true,
    };
  },
});
