import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// QUERIES
// ============================================================================

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

// Get recent notifications for dropdown (quick view)
export const getRecentNotifications = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    return notifications;
  },
});

// Get all notifications for lightbox (paginated)
export const getAllNotifications = query({
  args: {
    userId: v.id("users"),
    cursor: v.optional(v.number()), // Timestamp cursor for pagination
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

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
