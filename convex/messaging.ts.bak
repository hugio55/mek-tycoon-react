import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Maximum message length
const MAX_MESSAGE_LENGTH = 2000;
const PREVIEW_LENGTH = 80;

// ============================================================================
// QUERIES
// ============================================================================

// Get all conversations for a user (inbox view) - Optimized with batched lookups
export const getConversations = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    // Get conversations where user is participant1
    const asParticipant1 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q: any) => q.eq("participant1", args.walletAddress))
      .order("desc")
      .collect();

    // Get conversations where user is participant2
    const asParticipant2 = await ctx.db
      .query("conversations")
      .withIndex("by_participant2", (q: any) => q.eq("participant2", args.walletAddress))
      .order("desc")
      .collect();

    // Combine, filter hidden, and sort by last message time
    const allConversations = [...asParticipant1, ...asParticipant2]
      .filter((conv) => {
        // Filter out conversations hidden by this user
        const isParticipant1 = conv.participant1 === args.walletAddress;
        if (isParticipant1 && conv.hiddenForParticipant1) return false;
        if (!isParticipant1 && conv.hiddenForParticipant2) return false;
        return true;
      })
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt);

    // Early return if no conversations
    if (allConversations.length === 0) {
      return [];
    }

    // Collect all other wallet addresses for batch lookup
    const otherWallets = new Set<string>();
    for (const conv of allConversations) {
      const otherWallet = conv.participant1 === args.walletAddress
        ? conv.participant2
        : conv.participant1;
      otherWallets.add(otherWallet);
    }

    // Batch fetch: Get all unread counts for this user in one query
    const unreadRecords = await ctx.db
      .query("messageUnreadCounts")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
      .collect();
    const unreadMap = new Map(unreadRecords.map((r: any) => [r.conversationId.toString(), r.count]));

    // Batch fetch: Get all user info for other participants
    const userMap = new Map<string, { companyName: string; displayName: string }>();
    for (const wallet of otherWallets) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", wallet))
        .first();
      userMap.set(wallet, {
        companyName: user?.companyName ?? "Unknown Corporation",
        displayName: user?.displayName ?? user?.companyName ?? "Unknown",
      });
    }

    // Batch fetch: Get all blocks where I am the blocker
    const myBlocks = await ctx.db
      .query("messageBlocks")
      .withIndex("by_blocker", (q: any) => q.eq("blockerWallet", args.walletAddress))
      .collect();
    const iBlockedSet = new Set(myBlocks.map((b: any) => b.blockedWallet));

    // Batch fetch: Get all blocks where I am the blocked
    const blocksAgainstMe = await ctx.db
      .query("messageBlocks")
      .withIndex("by_blocked", (q: any) => q.eq("blockedWallet", args.walletAddress))
      .collect();
    const theyBlockedMeSet = new Set(blocksAgainstMe.map((b: any) => b.blockerWallet));

    // Build final conversation list with all data
    const conversationsWithDetails = allConversations.map((conv) => {
      const otherWallet = conv.participant1 === args.walletAddress
        ? conv.participant2
        : conv.participant1;

      const userInfo = userMap.get(otherWallet) ?? { companyName: "Unknown Corporation", displayName: "Unknown" };
      const iBlockedThem = iBlockedSet.has(otherWallet);
      const theyBlockedMe = theyBlockedMeSet.has(otherWallet);

      return {
        ...conv,
        unreadCount: unreadMap.get(conv._id.toString()) ?? 0,
        otherParticipant: {
          walletAddress: otherWallet,
          companyName: userInfo.companyName,
          displayName: userInfo.displayName,
        },
        blockStatus: {
          iBlockedThem,
          theyBlockedMe,
          isBlocked: iBlockedThem || theyBlockedMe,
        },
      };
    });

    return conversationsWithDetails;
  },
});

// Get messages for a specific conversation
export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    walletAddress: v.string(), // For filtering deleted messages
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()), // createdAt timestamp for pagination
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let messagesQuery = ctx.db
      .query("messages")
      .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId));

    // If we have a cursor, only get messages before it
    if (args.cursor) {
      messagesQuery = messagesQuery.filter((q) =>
        q.lt(q.field("createdAt"), args.cursor!)
      );
    }

    const messages = await messagesQuery
      .order("desc")
      .take(limit);

    // Filter out deleted messages based on who's viewing
    const filteredMessages = messages.filter((msg) => {
      if (msg.isDeleted) return false; // Deleted for everyone
      if (msg.senderId === args.walletAddress && msg.deletedForSender) return false;
      if (msg.recipientId === args.walletAddress && msg.deletedForRecipient) return false;
      return true;
    });

    // Populate attachment URLs
    const messagesWithUrls = await Promise.all(
      filteredMessages.map(async (msg) => {
        if (!msg.attachments || msg.attachments.length === 0) {
          return msg;
        }

        // Get URLs for all attachments
        const attachmentsWithUrls = await Promise.all(
          msg.attachments.map(async (att: { storageId: Id<"_storage">; filename: string; mimeType: string; size: number }) => ({
            ...att,
            url: await ctx.storage.getUrl(att.storageId),
          }))
        );

        return {
          ...msg,
          attachments: attachmentsWithUrls,
        };
      })
    );

    // Return in chronological order
    return messagesWithUrls.reverse();
  },
});

// Get total unread count for a user (for badge in nav)
export const getTotalUnreadCount = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const unreadRecords = await ctx.db
      .query("messageUnreadCounts")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
      .collect();

    return unreadRecords.reduce((sum, record) => sum + record.count, 0);
  },
});

// Check if a conversation exists between two users
export const getConversationBetween = query({
  args: {
    wallet1: v.string(),
    wallet2: v.string(),
  },
  handler: async (ctx, args) => {
    // Check both orderings
    const conv1 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q: any) => q.eq("participant1", args.wallet1))
      .filter((q) => q.eq(q.field("participant2"), args.wallet2))
      .first();

    if (conv1) return conv1;

    const conv2 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q: any) => q.eq("participant1", args.wallet2))
      .filter((q) => q.eq(q.field("participant2"), args.wallet1))
      .first();

    return conv2;
  },
});

// Get typing indicators for a conversation
export const getTypingIndicators = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const now = Date.now();

    const indicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();

    return indicators;
  },
});

// Get all corporations for new conversation search
export const getAllCorporations = query({
  args: { excludeWallet: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Get all users with company names
    const users = await ctx.db
      .query("users")
      .collect();

    // Filter to users with company names and map to corporation data
    const corporations = users
      .filter((user) => user.companyName && user.companyName.trim().length > 0)
      .filter((user) => !args.excludeWallet || user.walletAddress !== args.excludeWallet)
      .map((user) => ({
        walletAddress: user.walletAddress,
        companyName: user.companyName!,
        displayName: user.displayName || user.companyName!,
      }))
      .sort((a, b) => a.companyName.localeCompare(b.companyName));

    return corporations;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

// Send a new message
// Maximum attachments per message
const MAX_ATTACHMENTS_PER_MESSAGE = 3;

export const sendMessage = mutation({
  args: {
    senderWallet: v.string(),
    recipientWallet: v.string(),
    content: v.string(),
    attachments: v.optional(v.array(v.object({
      storageId: v.id("_storage"),
      filename: v.string(),
      mimeType: v.string(),
      size: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    // Validate content - allow empty if there are attachments
    const hasContent = args.content && args.content.trim().length > 0;
    const hasAttachments = args.attachments && args.attachments.length > 0;

    if (!hasContent && !hasAttachments) {
      throw new Error("Message must have text or attachments");
    }
    if (args.content.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Message exceeds ${MAX_MESSAGE_LENGTH} character limit`);
    }

    // Validate attachment count
    if (args.attachments && args.attachments.length > MAX_ATTACHMENTS_PER_MESSAGE) {
      throw new Error(`Maximum ${MAX_ATTACHMENTS_PER_MESSAGE} attachments per message`);
    }

    // Check if either user has blocked the other
    const senderBlockedRecipient = await ctx.db
      .query("messageBlocks")
      .withIndex("by_blocker_blocked", (q: any) =>
        q.eq("blockerWallet", args.senderWallet).eq("blockedWallet", args.recipientWallet)
      )
      .first();

    if (senderBlockedRecipient) {
      throw new Error("You have blocked this user. Unblock them to send messages.");
    }

    const recipientBlockedSender = await ctx.db
      .query("messageBlocks")
      .withIndex("by_blocker_blocked", (q: any) =>
        q.eq("blockerWallet", args.recipientWallet).eq("blockedWallet", args.senderWallet)
      )
      .first();

    if (recipientBlockedSender) {
      throw new Error("This user has blocked you and cannot receive your messages.");
    }

    const now = Date.now();
    const content = args.content.trim();

    // Find or create conversation
    let conversation = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q: any) => q.eq("participant1", args.senderWallet))
      .filter((q) => q.eq(q.field("participant2"), args.recipientWallet))
      .first();

    if (!conversation) {
      // Check reverse order
      conversation = await ctx.db
        .query("conversations")
        .withIndex("by_participant1", (q: any) => q.eq("participant1", args.recipientWallet))
        .filter((q) => q.eq(q.field("participant2"), args.senderWallet))
        .first();
    }

    let conversationId: Id<"conversations">;

    if (!conversation) {
      // Create new conversation
      conversationId = await ctx.db.insert("conversations", {
        participant1: args.senderWallet,
        participant2: args.recipientWallet,
        lastMessageAt: now,
        lastMessagePreview: content.slice(0, PREVIEW_LENGTH),
        lastMessageSender: args.senderWallet,
        createdAt: now,
      });
    } else if (conversation.disabledByAdmin) {
      // Conversation has been disabled by admin
      throw new Error("This conversation has been disabled by an administrator due to a Terms of Service violation. You may no longer interact with this corporation. If you feel this was a mistake, please reach out to us on Discord by creating a ticket.");
    } else {
      conversationId = conversation._id;
      // Update conversation with latest message info
      // Also unhide conversation for both participants if either deleted it
      // This allows users to restart conversations by sending a new message
      await ctx.db.patch(conversationId, {
        lastMessageAt: now,
        lastMessagePreview: content.slice(0, PREVIEW_LENGTH),
        lastMessageSender: args.senderWallet,
        hiddenForParticipant1: false,
        hiddenForParticipant2: false,
      });
    }

    // Create the message with optional attachments
    const messageId = await ctx.db.insert("messages", {
      conversationId,
      senderId: args.senderWallet,
      recipientId: args.recipientWallet,
      content,
      // Use "delivered" since Convex guarantees immediate persistence
      // "sent" would imply pending/in-flight, but message is already stored
      // "read" is set when recipient opens conversation via markConversationAsRead
      status: "delivered",
      createdAt: now,
      isDeleted: false,
      attachments: args.attachments,
    });

    // Update unread count for recipient
    const existingUnread = await ctx.db
      .query("messageUnreadCounts")
      .withIndex("by_wallet_conversation", (q: any) =>
        q.eq("walletAddress", args.recipientWallet).eq("conversationId", conversationId)
      )
      .first();

    if (existingUnread) {
      await ctx.db.patch(existingUnread._id, {
        count: existingUnread.count + 1,
      });
    } else {
      await ctx.db.insert("messageUnreadCounts", {
        walletAddress: args.recipientWallet,
        conversationId,
        count: 1,
      });
    }

    return { messageId, conversationId };
  },
});

// Mark messages as read in a conversation
export const markConversationAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get all unread messages for this user in this conversation
    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
      .filter((q) =>
        q.and(
          q.eq(q.field("recipientId"), args.walletAddress),
          q.neq(q.field("status"), "read")
        )
      )
      .collect();

    // Mark each as read
    for (const msg of unreadMessages) {
      await ctx.db.patch(msg._id, {
        status: "read",
        readAt: now,
      });
    }

    // Reset unread count
    const unreadRecord = await ctx.db
      .query("messageUnreadCounts")
      .withIndex("by_wallet_conversation", (q: any) =>
        q.eq("walletAddress", args.walletAddress).eq("conversationId", args.conversationId)
      )
      .first();

    if (unreadRecord) {
      await ctx.db.patch(unreadRecord._id, { count: 0 });
    }

    return { markedCount: unreadMessages.length };
  },
});

// Update typing indicator
export const setTypingIndicator = mutation({
  args: {
    conversationId: v.id("conversations"),
    walletAddress: v.string(),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("walletAddress"), args.walletAddress))
      .first();

    if (args.isTyping) {
      // Set typing indicator with 5 second expiry
      const expiresAt = Date.now() + 5000;

      if (existing) {
        await ctx.db.patch(existing._id, { expiresAt });
      } else {
        await ctx.db.insert("typingIndicators", {
          conversationId: args.conversationId,
          walletAddress: args.walletAddress,
          expiresAt,
        });
      }
    } else {
      // Remove typing indicator
      if (existing) {
        await ctx.db.delete(existing._id);
      }
    }
  },
});

// Delete a message
export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    walletAddress: v.string(),
    deleteForEveryone: v.boolean(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Verify the user is the sender or recipient
    if (message.senderId !== args.walletAddress && message.recipientId !== args.walletAddress) {
      throw new Error("Not authorized to delete this message");
    }

    if (args.deleteForEveryone) {
      // Only sender can delete for everyone (no time limit, like Discord)
      if (message.senderId !== args.walletAddress) {
        throw new Error("Only the sender can delete for everyone");
      }

      // Delete attachments from storage to prevent orphaned files
      if (message.attachments && message.attachments.length > 0) {
        for (const attachment of message.attachments) {
          try {
            await ctx.storage.delete(attachment.storageId);
          } catch (e) {
            // Storage file may already be deleted, continue
            console.error("Failed to delete attachment:", attachment.storageId, e);
          }
        }
      }

      await ctx.db.patch(args.messageId, {
        isDeleted: true,
        content: "", // Clear content for privacy
        attachments: [], // Clear attachments array
      });

      // Update conversation's lastMessagePreview if this was the last message
      const conversation = await ctx.db.get(message.conversationId);
      if (conversation) {
        // Find the most recent non-deleted message
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q: any) => q.eq("conversationId", message.conversationId))
          .filter((q) => q.neq(q.field("isDeleted"), true))
          .order("desc")
          .take(1);

        if (messages.length > 0) {
          const lastMsg = messages[0];
          const preview = lastMsg.content
            ? lastMsg.content.slice(0, 100)
            : lastMsg.attachments?.length
              ? "[Image]"
              : "";
          await ctx.db.patch(message.conversationId, {
            lastMessageAt: lastMsg.createdAt,
            lastMessagePreview: preview,
          });
        } else {
          // No messages left, clear preview
          await ctx.db.patch(message.conversationId, {
            lastMessagePreview: "",
          });
        }
      }
    } else {
      // Delete for self only
      if (message.senderId === args.walletAddress) {
        await ctx.db.patch(args.messageId, { deletedForSender: true });
      } else {
        await ctx.db.patch(args.messageId, { deletedForRecipient: true });
      }
    }

    return { success: true };
  },
});

// Edit a message (within time limit)
export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    walletAddress: v.string(),
    newContent: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Cannot edit deleted messages
    if (message.isDeleted) {
      throw new Error("Cannot edit a deleted message");
    }

    // Only sender can edit
    if (message.senderId !== args.walletAddress) {
      throw new Error("Only the sender can edit a message");
    }

    // Check time limit (30 minutes)
    const thirtyMinutes = 30 * 60 * 1000;
    if (Date.now() - message.createdAt > thirtyMinutes) {
      throw new Error("Cannot edit message after 30 minutes");
    }

    // Validate new content
    const newContent = args.newContent.trim();
    if (!newContent || newContent.length === 0) {
      throw new Error("Message cannot be empty");
    }
    if (newContent.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Message exceeds ${MAX_MESSAGE_LENGTH} character limit`);
    }

    await ctx.db.patch(args.messageId, {
      content: newContent,
      editedAt: Date.now(),
    });

    return { success: true };
  },
});

// Clean up expired typing indicators (scheduled function)
export const cleanupExpiredTypingIndicators = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const expired = await ctx.db
      .query("typingIndicators")
      .withIndex("by_expires", (q: any) => q.lt("expiresAt", now))
      .collect();

    for (const indicator of expired) {
      await ctx.db.delete(indicator._id);
    }

    return { cleaned: expired.length };
  },
});

// Delete/hide a conversation for a user (soft delete - other user still sees it)
export const deleteConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Verify user is a participant
    if (
      conversation.participant1 !== args.walletAddress &&
      conversation.participant2 !== args.walletAddress
    ) {
      throw new Error("Not authorized to delete this conversation");
    }

    // Determine which participant is deleting
    const isParticipant1 = conversation.participant1 === args.walletAddress;

    // Soft delete - mark as hidden for this user
    if (isParticipant1) {
      await ctx.db.patch(args.conversationId, { hiddenForParticipant1: true });
    } else {
      await ctx.db.patch(args.conversationId, { hiddenForParticipant2: true });
    }

    // Also mark all messages as deleted for this user
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const msg of messages) {
      if (msg.senderId === args.walletAddress) {
        await ctx.db.patch(msg._id, { deletedForSender: true });
      } else {
        await ctx.db.patch(msg._id, { deletedForRecipient: true });
      }
    }

    // Reset unread count for this user (prevent stale badge count)
    const unreadRecord = await ctx.db
      .query("messageUnreadCounts")
      .withIndex("by_wallet_conversation", (q: any) =>
        q.eq("walletAddress", args.walletAddress).eq("conversationId", args.conversationId)
      )
      .first();

    if (unreadRecord) {
      await ctx.db.delete(unreadRecord._id);
    }

    return { success: true };
  },
});

// ============================================================================
// BLOCKING SYSTEM
// ============================================================================

// Check if a user is blocked (either direction)
export const isUserBlocked = query({
  args: {
    myWallet: v.string(),
    otherWallet: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if I blocked them
    const iBlockedThem = await ctx.db
      .query("messageBlocks")
      .withIndex("by_blocker_blocked", (q: any) =>
        q.eq("blockerWallet", args.myWallet).eq("blockedWallet", args.otherWallet)
      )
      .first();

    // Check if they blocked me
    const theyBlockedMe = await ctx.db
      .query("messageBlocks")
      .withIndex("by_blocker_blocked", (q: any) =>
        q.eq("blockerWallet", args.otherWallet).eq("blockedWallet", args.myWallet)
      )
      .first();

    return {
      iBlockedThem: !!iBlockedThem,
      theyBlockedMe: !!theyBlockedMe,
      isBlocked: !!iBlockedThem || !!theyBlockedMe,
      blockDetails: iBlockedThem || theyBlockedMe || null,
    };
  },
});

// Get all users I have blocked (for unblock menu)
export const getBlockedUsers = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const blocks = await ctx.db
      .query("messageBlocks")
      .withIndex("by_blocker", (q: any) => q.eq("blockerWallet", args.walletAddress))
      .order("desc")
      .collect();

    // Get user info for each blocked user
    const blockedUsersWithInfo = await Promise.all(
      blocks.map(async (block) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_wallet", (q: any) => q.eq("walletAddress", block.blockedWallet))
          .first();

        return {
          ...block,
          blockedUser: {
            walletAddress: block.blockedWallet,
            companyName: user?.companyName ?? "Unknown Corporation",
            displayName: user?.displayName ?? user?.companyName ?? "Unknown",
          },
        };
      })
    );

    return blockedUsersWithInfo;
  },
});

// Get users who have blocked me (for debugging/admin)
export const getUsersWhoBlockedMe = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const blocks = await ctx.db
      .query("messageBlocks")
      .withIndex("by_blocked", (q: any) => q.eq("blockedWallet", args.walletAddress))
      .collect();

    return blocks;
  },
});

// Block a user
export const blockUser = mutation({
  args: {
    blockerWallet: v.string(),
    blockedWallet: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Can't block yourself
    if (args.blockerWallet === args.blockedWallet) {
      throw new Error("Cannot block yourself");
    }

    // Validate reason length (max 500 characters)
    if (args.reason && args.reason.length > 500) {
      throw new Error("Block reason cannot exceed 500 characters");
    }

    // Check if already blocked
    const existingBlock = await ctx.db
      .query("messageBlocks")
      .withIndex("by_blocker_blocked", (q: any) =>
        q.eq("blockerWallet", args.blockerWallet).eq("blockedWallet", args.blockedWallet)
      )
      .first();

    if (existingBlock) {
      throw new Error("User is already blocked");
    }

    // Create the block
    const blockId = await ctx.db.insert("messageBlocks", {
      blockerWallet: args.blockerWallet,
      blockedWallet: args.blockedWallet,
      createdAt: Date.now(),
      reason: args.reason,
    });

    return { success: true, blockId };
  },
});

// Unblock a user
export const unblockUser = mutation({
  args: {
    blockerWallet: v.string(),
    blockedWallet: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the block
    const existingBlock = await ctx.db
      .query("messageBlocks")
      .withIndex("by_blocker_blocked", (q: any) =>
        q.eq("blockerWallet", args.blockerWallet).eq("blockedWallet", args.blockedWallet)
      )
      .first();

    if (!existingBlock) {
      throw new Error("User is not blocked");
    }

    // Delete the block
    await ctx.db.delete(existingBlock._id);

    return { success: true };
  },
});

// Unblock by block ID (for unblock menu)
export const unblockById = mutation({
  args: {
    blockId: v.id("messageBlocks"),
    walletAddress: v.string(), // For verification
  },
  handler: async (ctx, args) => {
    const block = await ctx.db.get(args.blockId);

    if (!block) {
      throw new Error("Block not found");
    }

    // Verify the requester is the blocker
    if (block.blockerWallet !== args.walletAddress) {
      throw new Error("Not authorized to unblock this user");
    }

    await ctx.db.delete(args.blockId);

    return { success: true };
  },
});

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

// Get conversations for admin view (with pagination and search)
export const getAllConversationsAdmin = query({
  args: {
    searchQuery: v.optional(v.string()),
    limit: v.optional(v.number()), // Default 20
    cursor: v.optional(v.number()), // lastMessageAt timestamp for pagination
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Build query with optional cursor for pagination
    let conversationsQuery = ctx.db
      .query("conversations")
      .withIndex("by_last_activity")
      .order("desc");

    // If we have a cursor, only get conversations older than it
    if (args.cursor) {
      conversationsQuery = conversationsQuery.filter((q) =>
        q.lt(q.field("lastMessageAt"), args.cursor!)
      );
    }

    // Get one extra to check if there are more
    const conversations = await conversationsQuery.take(limit + 1);
    const hasMore = conversations.length > limit;
    const pageConversations = conversations.slice(0, limit);

    // Batch collect all unique wallet addresses for user lookups
    const walletAddresses = new Set<string>();
    for (const conv of pageConversations) {
      walletAddresses.add(conv.participant1);
      walletAddresses.add(conv.participant2);
    }

    // Batch lookup users (one query for all wallets)
    const userMap = new Map<string, { companyName: string; stakeAddress: string }>();
    for (const wallet of walletAddresses) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", wallet))
        .first();
      userMap.set(wallet, {
        companyName: user?.companyName ?? "Unknown",
        stakeAddress: user?.stakeAddress ?? "",
      });
    }

    // Build conversation details without counting all messages (use preview as indicator)
    const conversationsWithDetails = pageConversations.map((conv) => {
      const p1Info = userMap.get(conv.participant1) ?? { companyName: "Unknown", stakeAddress: "" };
      const p2Info = userMap.get(conv.participant2) ?? { companyName: "Unknown", stakeAddress: "" };

      return {
        ...conv,
        participant1Info: {
          walletAddress: conv.participant1,
          companyName: p1Info.companyName,
          stakeAddress: p1Info.stakeAddress,
        },
        participant2Info: {
          walletAddress: conv.participant2,
          companyName: p2Info.companyName,
          stakeAddress: p2Info.stakeAddress,
        },
        // Don't count messages here - too expensive. Count when conversation is selected.
        messageCount: undefined as number | undefined,
      };
    });

    // Filter by search query if provided (client-side filter on current page)
    let filteredConversations = conversationsWithDetails;
    if (args.searchQuery && args.searchQuery.trim()) {
      const query = args.searchQuery.toLowerCase().trim();
      filteredConversations = conversationsWithDetails.filter((conv) => {
        return (
          conv.participant1Info.companyName.toLowerCase().includes(query) ||
          conv.participant2Info.companyName.toLowerCase().includes(query) ||
          conv.participant1.toLowerCase().includes(query) ||
          conv.participant2.toLowerCase().includes(query) ||
          conv.participant1Info.stakeAddress.toLowerCase().includes(query) ||
          conv.participant2Info.stakeAddress.toLowerCase().includes(query)
        );
      });
    }

    // Get cursor for next page (lastMessageAt of last conversation)
    const nextCursor = hasMore && pageConversations.length > 0
      ? pageConversations[pageConversations.length - 1].lastMessageAt
      : undefined;

    return {
      conversations: filteredConversations,
      hasMore,
      nextCursor,
    };
  },
});

// Get message count for a specific conversation (called when conversation is selected)
export const getConversationMessageCount = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
      .collect();

    return {
      total: messages.length,
      visible: messages.filter((m: any) => !m.isDeleted).length,
      deleted: messages.filter((m: any) => m.isDeleted).length,
    };
  },
});

// Get messages from any conversation (admin view)
export const getMessagesAdmin = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()), // Default 100, max 500
    cursor: v.optional(v.string()), // For pagination
  },
  handler: async (ctx, args) => {
    const pageSize = Math.min(args.limit ?? 100, 500);

    let query = ctx.db
      .query("messages")
      .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
      .order("asc");

    // Apply cursor if provided (skip messages before cursor)
    const result = await query.paginate({ numItems: pageSize, cursor: args.cursor ?? null });
    const messages = result.page;

    // Get sender info for each message
    const messagesWithSenderInfo = await Promise.all(
      messages.map(async (msg) => {
        const senderUser = await ctx.db
          .query("users")
          .withIndex("by_wallet", (q: any) => q.eq("walletAddress", msg.senderId))
          .first();

        // Get attachment URLs if any
        let attachmentsWithUrls = msg.attachments;
        if (msg.attachments && msg.attachments.length > 0) {
          attachmentsWithUrls = await Promise.all(
            msg.attachments.map(async (att: { storageId: Id<"_storage">; filename: string; mimeType: string; size: number }) => {
              const url = await ctx.storage.getUrl(att.storageId);
              return {
                ...att,
                url: url ?? undefined,
              };
            })
          );
        }

        return {
          ...msg,
          attachments: attachmentsWithUrls,
          senderInfo: {
            walletAddress: msg.senderId,
            companyName: (senderUser as any)?.companyName ?? "Unknown",
          },
        };
      })
    );

    return {
      messages: messagesWithSenderInfo,
      nextCursor: result.continueCursor,
      hasMore: !result.isDone,
    };
  },
});

// Admin: Disable a conversation (ToS violation)
export const disableConversationAdmin = mutation({
  args: {
    conversationId: v.id("conversations"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    await ctx.db.patch(args.conversationId, {
      disabledByAdmin: true,
      disabledAt: Date.now(),
      disabledReason: args.reason || "Terms of Service violation",
    });

    return { success: true };
  },
});

// Admin: Re-enable a disabled conversation
export const enableConversationAdmin = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    await ctx.db.patch(args.conversationId, {
      disabledByAdmin: false,
      disabledAt: undefined,
      disabledReason: undefined,
    });

    return { success: true };
  },
});

// Admin: Delete a conversation permanently (including all attachments from storage)
export const deleteConversationAdmin = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Delete all messages in the conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const msg of messages) {
      // Delete attachments from storage first
      if (msg.attachments && msg.attachments.length > 0) {
        for (const att of msg.attachments) {
          try {
            await ctx.storage.delete(att.storageId);
          } catch (e) {
            // Attachment may already be deleted, continue
          }
        }
      }
      await ctx.db.delete(msg._id);
    }

    // Delete unread counts for this conversation
    const unreadCounts = await ctx.db
      .query("messageUnreadCounts")
      .filter((q) => q.eq(q.field("conversationId"), args.conversationId))
      .collect();

    for (const count of unreadCounts) {
      await ctx.db.delete(count._id);
    }

    // Delete typing indicators for this conversation
    const typingIndicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const indicator of typingIndicators) {
      await ctx.db.delete(indicator._id);
    }

    // Delete the conversation itself
    await ctx.db.delete(args.conversationId);

    return { success: true };
  },
});

// Admin: Delete any message (preserves content for admin review)
export const deleteMessageAdmin = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Mark as deleted but preserve original content for admin review
    await ctx.db.patch(args.messageId, {
      isDeleted: true,
      deletedByAdmin: true,
      deletedByAdminAt: Date.now(),
    });

    return { success: true };
  },
});

// Admin: Get deleted messages for a conversation (for reviewing TOS violations)
export const getDeletedMessagesAdmin = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    // Get all deleted messages in this conversation
    const deletedMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("isDeleted"), true))
      .order("asc")
      .collect();

    // Get sender info for each message
    const messagesWithSenderInfo = await Promise.all(
      deletedMessages.map(async (msg) => {
        const senderUser = await ctx.db
          .query("users")
          .withIndex("by_wallet", (q: any) => q.eq("walletAddress", msg.senderId))
          .first();

        // Get attachment URLs if any
        let attachmentsWithUrls = msg.attachments;
        if (msg.attachments && msg.attachments.length > 0) {
          attachmentsWithUrls = await Promise.all(
            msg.attachments.map(async (att: { storageId: Id<"_storage">; filename: string; mimeType: string; size: number }) => {
              const url = await ctx.storage.getUrl(att.storageId);
              return {
                ...att,
                url: url ?? undefined,
              };
            })
          );
        }

        return {
          ...msg,
          attachments: attachmentsWithUrls,
          senderInfo: {
            walletAddress: msg.senderId,
            companyName: (senderUser as any)?.companyName ?? "Unknown",
          },
        };
      })
    );

    return messagesWithSenderInfo;
  },
});
