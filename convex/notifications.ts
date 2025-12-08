import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get user ID from wallet address (for header component)
export const getUserIdByWallet = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q) => q.eq("stakeAddress", args.walletAddress))
      .first();

    return user?._id || null;
  },
});

// Get all notifications with pagination
export const getAllNotifications = query({
  args: {
    userId: v.id("users"),
    cursor: v.optional(v.number()),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId, cursor, limit } = args;

    // Get notifications sorted by createdAt descending
    let notificationsQuery = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc");

    const allNotifications = await notificationsQuery.collect();

    // Apply cursor-based pagination
    const startIndex = cursor ?? 0;
    const endIndex = startIndex + limit;
    const notifications = allNotifications.slice(startIndex, endIndex);
    const hasMore = endIndex < allNotifications.length;
    const nextCursor = hasMore ? endIndex : undefined;

    return {
      notifications,
      hasMore,
      nextCursor,
    };
  },
});

// Get recent notifications (for dropdown preview)
export const getRecentNotifications = query({
  args: {
    userId: v.id("users"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit);

    return notifications;
  },
});

// Get count of unread notifications
export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    return unreadNotifications.length;
  },
});

// Mark a notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.userId !== args.userId) {
      throw new Error("Not authorized to modify this notification");
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
    });

    return { success: true };
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

    return { success: true, deletedCount: notifications.length };
  },
});

// Create a new notification (utility for other parts of the system)
export const createNotification = mutation({
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
    // Check for duplicate if sourceType and sourceId provided
    if (args.sourceType && args.sourceId) {
      const existing = await ctx.db
        .query("notifications")
        .withIndex("by_source", (q) =>
          q.eq("sourceType", args.sourceType).eq("sourceId", args.sourceId)
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
