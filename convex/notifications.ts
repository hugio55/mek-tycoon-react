import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_NOTIFICATIONS_PER_USER = 100; // Cap at 100 notifications per player
const DROPDOWN_LIMIT = 5; // Show 5 most recent in dropdown
const LIGHTBOX_PAGE_SIZE = 10; // Show 10 per page in "View All"

// ============================================================================
// QUERIES
// ============================================================================

// Get user ID by wallet address (helper for frontend to get userId)
export const getUserIdByWallet = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    return user?._id ?? null;
  },
});

// Get unread notification count for badge display
export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    return notifications.length;
  },
});

// Get recent notifications for dropdown (quick view) - shows 5 most recent
export const getRecentNotifications = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? DROPDOWN_LIMIT;

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    return notifications;
  },
});

// Get all notifications for lightbox (paginated) - 10 per page, max 100 total
export const getAllNotifications = query({
  args: {
    userId: v.id("users"),
    cursor: v.optional(v.number()), // Timestamp cursor for pagination
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? LIGHTBOX_PAGE_SIZE;

    let notificationsQuery = ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc");

    // If cursor provided, filter to notifications older than cursor
    const allNotifications = await notificationsQuery.collect();

    let filteredNotifications = allNotifications;
    if (args.cursor) {
      filteredNotifications = allNotifications.filter(
        (n) => n.createdAt < args.cursor!
      );
    }

    // Take limit + 1 to check if there are more
    const notifications = filteredNotifications.slice(0, limit + 1);
    const hasMore = notifications.length > limit;

    // Return only the requested limit
    const result = notifications.slice(0, limit);
    const nextCursor = result.length > 0 ? result[result.length - 1].createdAt : undefined;

    return {
      notifications: result,
      nextCursor: hasMore ? nextCursor : undefined,
      hasMore,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

// Mark a single notification as read
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      isRead: true,
    });
    return { success: true };
  },
});

// Mark all notifications as read for a user
export const markAllAsRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, { isRead: true });
    }

    return { success: true, count: unreadNotifications.length };
  },
});

// Clear all notifications for a user
export const clearAllNotifications = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    return { success: true, count: notifications.length };
  },
});

// Create a notification (internal use - called by other systems)
// Enforces 100-notification cap per user, auto-deletes oldest when exceeded
export const createNotification = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    subtitle: v.optional(v.string()),
    linkTo: v.optional(v.string()),
    linkParams: v.optional(v.any()),
    sourceType: v.optional(v.string()),
    sourceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check for duplicate notification if sourceType and sourceId provided
    if (args.sourceType && args.sourceId) {
      const existing = await ctx.db
        .query("notifications")
        .withIndex("by_source", (q) =>
          q.eq("sourceType", args.sourceType!).eq("sourceId", args.sourceId!)
        )
        .first();

      if (existing) {
        // Don't create duplicate notification
        return { success: false, reason: "duplicate", existingId: existing._id };
      }
    }

    // Enforce notification cap - delete oldest if at limit
    const userNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("asc") // Oldest first
      .collect();

    // If at or over cap, delete oldest to make room
    if (userNotifications.length >= MAX_NOTIFICATIONS_PER_USER) {
      const toDelete = userNotifications.slice(0, userNotifications.length - MAX_NOTIFICATIONS_PER_USER + 1);
      for (const notification of toDelete) {
        await ctx.db.delete(notification._id);
      }
    }

    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      subtitle: args.subtitle,
      linkTo: args.linkTo,
      linkParams: args.linkParams,
      isRead: false,
      createdAt: Date.now(),
      sourceType: args.sourceType,
      sourceId: args.sourceId,
    });

    return { success: true, notificationId };
  },
});

// Public mutation to create notification (for admin/testing)
export const createNotificationPublic = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    subtitle: v.optional(v.string()),
    linkTo: v.optional(v.string()),
    linkParams: v.optional(v.any()),
    sourceType: v.optional(v.string()),
    sourceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check for duplicate notification if sourceType and sourceId provided
    if (args.sourceType && args.sourceId) {
      const existing = await ctx.db
        .query("notifications")
        .withIndex("by_source", (q) =>
          q.eq("sourceType", args.sourceType!).eq("sourceId", args.sourceId!)
        )
        .first();

      if (existing) {
        return { success: false, reason: "duplicate", existingId: existing._id };
      }
    }

    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      subtitle: args.subtitle,
      linkTo: args.linkTo,
      linkParams: args.linkParams,
      isRead: false,
      createdAt: Date.now(),
      sourceType: args.sourceType,
      sourceId: args.sourceId,
    });

    return { success: true, notificationId };
  },
});

// ============================================================================
// ADMIN QUERIES & MUTATIONS
// ============================================================================

// Get all notifications system-wide (admin view)
export const adminGetAllNotifications = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    // Get all notifications ordered by creation time (newest first)
    const allNotifications = await ctx.db
      .query("notifications")
      .order("desc")
      .collect();

    // Apply cursor filter if provided
    let filteredNotifications = allNotifications;
    if (args.cursor) {
      filteredNotifications = allNotifications.filter(
        (n) => n.createdAt < args.cursor!
      );
    }

    // Paginate
    const notifications = filteredNotifications.slice(0, limit + 1);
    const hasMore = notifications.length > limit;
    const result = notifications.slice(0, limit);

    // Get user info for each notification
    const userIds = [...new Set(result.map((n) => n.userId))];
    const userMap = new Map<string, { walletAddress: string; companyName: string | null }>();

    for (const userId of userIds) {
      const user = await ctx.db.get(userId);
      if (user) {
        userMap.set(userId.toString(), {
          walletAddress: user.walletAddress,
          companyName: user.companyName ?? null,
        });
      }
    }

    // Enrich notifications with user data
    const enrichedNotifications = result.map((n) => ({
      ...n,
      user: userMap.get(n.userId.toString()) ?? { walletAddress: "Unknown", companyName: null },
    }));

    return {
      notifications: enrichedNotifications,
      nextCursor: hasMore && result.length > 0 ? result[result.length - 1].createdAt : undefined,
      hasMore,
      totalCount: allNotifications.length,
    };
  },
});

// Get notifications for a specific player by wallet address (admin view)
export const adminGetPlayerNotifications = query({
  args: {
    walletAddress: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    // Find the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!user) {
      return {
        notifications: [],
        user: null,
        totalCount: 0,
      };
    }

    // Get their notifications
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    return {
      notifications,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        companyName: user.companyName ?? null,
      },
      totalCount: notifications.length,
    };
  },
});

// Get notification statistics (admin dashboard)
export const adminGetNotificationStats = query({
  args: {},
  handler: async (ctx) => {
    const allNotifications = await ctx.db.query("notifications").collect();

    const totalCount = allNotifications.length;
    const unreadCount = allNotifications.filter((n) => !n.isRead).length;
    const readCount = totalCount - unreadCount;

    // Count by type
    const typeCountsMap = new Map<string, number>();
    for (const n of allNotifications) {
      typeCountsMap.set(n.type, (typeCountsMap.get(n.type) ?? 0) + 1);
    }
    const typeCounts = Object.fromEntries(typeCountsMap);

    // Recent activity (last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentCount = allNotifications.filter((n) => n.createdAt > oneDayAgo).length;

    // Unique users with notifications
    const uniqueUsers = new Set(allNotifications.map((n) => n.userId.toString())).size;

    return {
      totalCount,
      unreadCount,
      readCount,
      typeCounts,
      recentCount,
      uniqueUsers,
    };
  },
});

// Send notification to a specific player (admin)
export const adminSendNotification = mutation({
  args: {
    walletAddress: v.string(),
    type: v.string(),
    title: v.string(),
    subtitle: v.optional(v.string()),
    linkTo: v.optional(v.string()),
    linkParams: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Find the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const notificationId = await ctx.db.insert("notifications", {
      userId: user._id,
      type: args.type,
      title: args.title,
      subtitle: args.subtitle,
      linkTo: args.linkTo,
      linkParams: args.linkParams,
      isRead: false,
      createdAt: Date.now(),
      sourceType: "admin",
      sourceId: `admin-${Date.now()}`,
    });

    return { success: true, notificationId };
  },
});

// Broadcast notification to all players (admin)
export const adminBroadcastNotification = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    subtitle: v.optional(v.string()),
    linkTo: v.optional(v.string()),
    linkParams: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Get all users
    const users = await ctx.db.query("users").collect();

    const broadcastId = `broadcast-${Date.now()}`;
    let successCount = 0;

    for (const user of users) {
      await ctx.db.insert("notifications", {
        userId: user._id,
        type: args.type,
        title: args.title,
        subtitle: args.subtitle,
        linkTo: args.linkTo,
        linkParams: args.linkParams,
        isRead: false,
        createdAt: Date.now(),
        sourceType: "admin_broadcast",
        sourceId: broadcastId,
      });
      successCount++;
    }

    return { success: true, sentCount: successCount, broadcastId };
  },
});

// Delete a specific notification (admin)
export const adminDeleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
    return { success: true };
  },
});

// Clear all notifications for a player (admin)
export const adminClearPlayerNotifications = mutation({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    // Find the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!user) {
      return { success: false, error: "User not found", count: 0 };
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    return { success: true, count: notifications.length };
  },
});
