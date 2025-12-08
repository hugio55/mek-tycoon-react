import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get conversations for a user
export const getConversations = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const { walletAddress } = args;

    // Get conversations where user is participant1
    const asParticipant1 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) => q.eq("participant1", walletAddress))
      .collect();

    // Get conversations where user is participant2
    const asParticipant2 = await ctx.db
      .query("conversations")
      .withIndex("by_participant2", (q) => q.eq("participant2", walletAddress))
      .collect();

    // Combine and filter hidden conversations
    const allConversations = [...asParticipant1, ...asParticipant2].filter((conv) => {
      const isParticipant1 = conv.participant1 === walletAddress;
      if (isParticipant1 && conv.hiddenForParticipant1) return false;
      if (!isParticipant1 && conv.hiddenForParticipant2) return false;
      return true;
    });

    // Get unread counts and enrich with participant info
    const enrichedConversations = await Promise.all(
      allConversations.map(async (conv) => {
        const otherWallet = conv.participant1 === walletAddress ? conv.participant2 : conv.participant1;
        const otherUser = await ctx.db
          .query("users")
          .withIndex("by_stake_address", (q) => q.eq("stakeAddress", otherWallet))
          .first();

        const unreadCount = await ctx.db
          .query("messageUnreadCounts")
          .withIndex("by_wallet_conversation", (q) =>
            q.eq("walletAddress", walletAddress).eq("conversationId", conv._id)
          )
          .first();

        return {
          ...conv,
          otherParticipant: {
            walletAddress: otherWallet,
            corporationName: otherUser?.corporationName || "Unknown Corp",
          },
          unreadCount: unreadCount?.count || 0,
        };
      })
    );

    // Sort by lastMessageAt descending
    return enrichedConversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  },
});

// Get messages for a conversation
export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const { conversationId, walletAddress } = args;

    // Verify user is participant
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) return [];
    if (conversation.participant1 !== walletAddress && conversation.participant2 !== walletAddress) {
      return [];
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();

    // Filter deleted messages based on who's viewing
    return messages
      .filter((msg) => {
        if (msg.isDeleted) return false;
        if (msg.senderId === walletAddress && msg.deletedForSender) return false;
        if (msg.recipientId === walletAddress && msg.deletedForRecipient) return false;
        return true;
      })
      .sort((a, b) => a.createdAt - b.createdAt);
  },
});

// Get conversation between two wallets
export const getConversationBetween = query({
  args: {
    wallet1: v.string(),
    wallet2: v.string(),
  },
  handler: async (ctx, args) => {
    const { wallet1, wallet2 } = args;

    // Check both orderings
    const conv1 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) => q.eq("participant1", wallet1))
      .filter((q) => q.eq(q.field("participant2"), wallet2))
      .first();

    if (conv1) return conv1;

    const conv2 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) => q.eq("participant1", wallet2))
      .filter((q) => q.eq(q.field("participant2"), wallet1))
      .first();

    return conv2;
  },
});

// Get all corporations (for new message recipient selection)
export const getAllCorporations = query({
  args: { excludeWallet: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    return users
      .filter((u) => u.stakeAddress && u.stakeAddress !== args.excludeWallet && u.corporationName)
      .map((u) => ({
        walletAddress: u.stakeAddress!,
        corporationName: u.corporationName || "Unknown Corp",
      }));
  },
});

// Get blocked users for a wallet
export const getBlockedUsers = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const blocks = await ctx.db
      .query("messageBlocks")
      .withIndex("by_blocker", (q) => q.eq("blockerWallet", args.walletAddress))
      .collect();

    return blocks.map((b) => b.blockedWallet);
  },
});

// Get total unread count across all conversations
export const getTotalUnreadCount = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const unreadCounts = await ctx.db
      .query("messageUnreadCounts")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .collect();

    return unreadCounts.reduce((sum, uc) => sum + uc.count, 0);
  },
});

// Admin: Get all conversations
export const getAllConversationsAdmin = query({
  args: {},
  handler: async (ctx) => {
    const conversations = await ctx.db.query("conversations").collect();

    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const user1 = await ctx.db
          .query("users")
          .withIndex("by_stake_address", (q) => q.eq("stakeAddress", conv.participant1))
          .first();
        const user2 = await ctx.db
          .query("users")
          .withIndex("by_stake_address", (q) => q.eq("stakeAddress", conv.participant2))
          .first();

        return {
          ...conv,
          participant1Name: user1?.corporationName || "Unknown",
          participant2Name: user2?.corporationName || "Unknown",
        };
      })
    );

    return enriched.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  },
});

// Admin: Get messages for a conversation (includes deleted)
export const getMessagesAdmin = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    return messages
      .filter((m) => !m.isDeleted)
      .sort((a, b) => a.createdAt - b.createdAt);
  },
});

// Admin: Get deleted messages for a conversation
export const getDeletedMessagesAdmin = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    return messages
      .filter((m) => m.isDeleted || m.deletedByAdmin)
      .sort((a, b) => a.createdAt - b.createdAt);
  },
});

// Get message count for a conversation
export const getConversationMessageCount = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    return messages.filter((m) => !m.isDeleted).length;
  },
});

// Send a message
export const sendMessage = mutation({
  args: {
    senderWallet: v.string(),
    recipientWallet: v.string(),
    content: v.string(),
    conversationId: v.optional(v.id("conversations")),
  },
  handler: async (ctx, args) => {
    const { senderWallet, recipientWallet, content, conversationId } = args;

    // Check if blocked
    const block = await ctx.db
      .query("messageBlocks")
      .withIndex("by_blocker_blocked", (q) =>
        q.eq("blockerWallet", recipientWallet).eq("blockedWallet", senderWallet)
      )
      .first();

    if (block) {
      throw new Error("You cannot message this user");
    }

    let convId = conversationId;
    const now = Date.now();

    // Create or get conversation
    if (!convId) {
      // Check for existing conversation
      const existing1 = await ctx.db
        .query("conversations")
        .withIndex("by_participant1", (q) => q.eq("participant1", senderWallet))
        .filter((q) => q.eq(q.field("participant2"), recipientWallet))
        .first();

      const existing2 = await ctx.db
        .query("conversations")
        .withIndex("by_participant1", (q) => q.eq("participant1", recipientWallet))
        .filter((q) => q.eq(q.field("participant2"), senderWallet))
        .first();

      const existing = existing1 || existing2;

      if (existing) {
        convId = existing._id;
      } else {
        convId = await ctx.db.insert("conversations", {
          participant1: senderWallet,
          participant2: recipientWallet,
          lastMessageAt: now,
          lastMessagePreview: content.substring(0, 80),
          lastMessageSender: senderWallet,
          createdAt: now,
        });
      }
    }

    // Insert message
    await ctx.db.insert("messages", {
      conversationId: convId,
      senderId: senderWallet,
      recipientId: recipientWallet,
      content,
      status: "sent",
      createdAt: now,
      isDeleted: false,
    });

    // Update conversation
    await ctx.db.patch(convId, {
      lastMessageAt: now,
      lastMessagePreview: content.substring(0, 80),
      lastMessageSender: senderWallet,
      hiddenForParticipant1: false,
      hiddenForParticipant2: false,
    });

    // Update unread count for recipient
    const unreadRecord = await ctx.db
      .query("messageUnreadCounts")
      .withIndex("by_wallet_conversation", (q) =>
        q.eq("walletAddress", recipientWallet).eq("conversationId", convId)
      )
      .first();

    if (unreadRecord) {
      await ctx.db.patch(unreadRecord._id, { count: unreadRecord.count + 1 });
    } else {
      await ctx.db.insert("messageUnreadCounts", {
        walletAddress: recipientWallet,
        conversationId: convId,
        count: 1,
      });
    }

    return { success: true, conversationId: convId };
  },
});

// Mark conversation as read
export const markConversationAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const { conversationId, walletAddress } = args;

    // Reset unread count
    const unreadRecord = await ctx.db
      .query("messageUnreadCounts")
      .withIndex("by_wallet_conversation", (q) =>
        q.eq("walletAddress", walletAddress).eq("conversationId", conversationId)
      )
      .first();

    if (unreadRecord) {
      await ctx.db.patch(unreadRecord._id, { count: 0 });
    }

    // Mark messages as read
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .filter((q) => q.eq(q.field("recipientId"), walletAddress))
      .collect();

    const now = Date.now();
    for (const msg of messages) {
      if (msg.status !== "read") {
        await ctx.db.patch(msg._id, { status: "read", readAt: now });
      }
    }

    return { success: true };
  },
});

// Set typing indicator
export const setTypingIndicator = mutation({
  args: {
    conversationId: v.id("conversations"),
    walletAddress: v.string(),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { conversationId, walletAddress, isTyping } = args;

    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .filter((q) => q.eq(q.field("walletAddress"), walletAddress))
      .first();

    if (isTyping) {
      const expiresAt = Date.now() + 5000; // 5 second expiry
      if (existing) {
        await ctx.db.patch(existing._id, { expiresAt });
      } else {
        await ctx.db.insert("typingIndicators", {
          conversationId,
          walletAddress,
          expiresAt,
        });
      }
    } else if (existing) {
      await ctx.db.delete(existing._id);
    }

    return { success: true };
  },
});

// Delete message
export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    walletAddress: v.string(),
    deleteForEveryone: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { messageId, walletAddress, deleteForEveryone } = args;

    const message = await ctx.db.get(messageId);
    if (!message) throw new Error("Message not found");

    if (deleteForEveryone && message.senderId === walletAddress) {
      await ctx.db.patch(messageId, { isDeleted: true });
    } else if (message.senderId === walletAddress) {
      await ctx.db.patch(messageId, { deletedForSender: true });
    } else if (message.recipientId === walletAddress) {
      await ctx.db.patch(messageId, { deletedForRecipient: true });
    }

    return { success: true };
  },
});

// Delete/hide conversation for user
export const deleteConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const { conversationId, walletAddress } = args;

    const conversation = await ctx.db.get(conversationId);
    if (!conversation) throw new Error("Conversation not found");

    if (conversation.participant1 === walletAddress) {
      await ctx.db.patch(conversationId, { hiddenForParticipant1: true });
    } else if (conversation.participant2 === walletAddress) {
      await ctx.db.patch(conversationId, { hiddenForParticipant2: true });
    }

    return { success: true };
  },
});

// Block user
export const blockUser = mutation({
  args: {
    blockerWallet: v.string(),
    blockedWallet: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { blockerWallet, blockedWallet, reason } = args;

    // Check if already blocked
    const existing = await ctx.db
      .query("messageBlocks")
      .withIndex("by_blocker_blocked", (q) =>
        q.eq("blockerWallet", blockerWallet).eq("blockedWallet", blockedWallet)
      )
      .first();

    if (existing) return { success: true, alreadyBlocked: true };

    await ctx.db.insert("messageBlocks", {
      blockerWallet,
      blockedWallet,
      createdAt: Date.now(),
      reason,
    });

    return { success: true };
  },
});

// Unblock user
export const unblockUser = mutation({
  args: {
    blockerWallet: v.string(),
    blockedWallet: v.string(),
  },
  handler: async (ctx, args) => {
    const { blockerWallet, blockedWallet } = args;

    const block = await ctx.db
      .query("messageBlocks")
      .withIndex("by_blocker_blocked", (q) =>
        q.eq("blockerWallet", blockerWallet).eq("blockedWallet", blockedWallet)
      )
      .first();

    if (block) {
      await ctx.db.delete(block._id);
    }

    return { success: true };
  },
});

// Admin: Disable conversation
export const disableConversationAdmin = mutation({
  args: {
    conversationId: v.id("conversations"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      disabledByAdmin: true,
      disabledAt: Date.now(),
      disabledReason: args.reason,
    });

    return { success: true };
  },
});

// Admin: Enable conversation
export const enableConversationAdmin = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      disabledByAdmin: false,
      disabledAt: undefined,
      disabledReason: undefined,
    });

    return { success: true };
  },
});

// Admin: Delete conversation permanently
export const deleteConversationAdmin = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    // Delete all messages
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    // Delete unread counts
    const unreadCounts = await ctx.db
      .query("messageUnreadCounts")
      .filter((q) => q.eq(q.field("conversationId"), args.conversationId))
      .collect();

    for (const uc of unreadCounts) {
      await ctx.db.delete(uc._id);
    }

    // Delete conversation
    await ctx.db.delete(args.conversationId);

    return { success: true };
  },
});

// Admin: Delete message
export const deleteMessageAdmin = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      isDeleted: true,
      deletedByAdmin: true,
      deletedByAdminAt: Date.now(),
    });

    return { success: true };
  },
});
