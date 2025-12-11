import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Support chat identifier - used as a "virtual wallet" for the Overexposed dev team
export const SUPPORT_WALLET_ID = "SUPPORT_OVEREXPOSED";

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
            companyName: otherUser?.corporationName || "Unknown Corp",
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
    const filteredMessages = messages
      .filter((msg) => {
        if (msg.isDeleted) return false;
        if (msg.senderId === walletAddress && msg.deletedForSender) return false;
        if (msg.recipientId === walletAddress && msg.deletedForRecipient) return false;
        return true;
      })
      .sort((a, b) => a.createdAt - b.createdAt);

    // Resolve attachment URLs
    const messagesWithUrls = await Promise.all(
      filteredMessages.map(async (msg) => {
        if (msg.attachments && msg.attachments.length > 0) {
          const attachmentsWithUrls = await Promise.all(
            msg.attachments.map(async (att: any) => {
              const url = await ctx.storage.getUrl(att.storageId);
              console.log('[📎ATTACH] storageId:', att.storageId, 'url:', url);
              return { ...att, url };
            })
          );
          return { ...msg, attachments: attachmentsWithUrls };
        }
        return msg;
      })
    );

    return messagesWithUrls;
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
        companyName: u.corporationName || "Unknown Corp",
        achievementPoints: (u as any).achievementPoints || 0,
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

// Get typing indicators for a conversation (who else is typing)
export const getTypingIndicators = query({
  args: {
    conversationId: v.id("conversations"),
    excludeWallet: v.string(),
  },
  handler: async (ctx, args) => {
    const { conversationId, excludeWallet } = args;
    const now = Date.now();

    // Get all typing indicators for this conversation
    const indicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();

    // Filter out expired indicators and the current user
    const activeIndicators = indicators.filter(
      (ind) => ind.walletAddress !== excludeWallet && ind.expiresAt > now
    );

    // Enrich with corporation names
    const enrichedIndicators = await Promise.all(
      activeIndicators.map(async (ind) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_stake_address", (q) => q.eq("stakeAddress", ind.walletAddress))
          .first();
        return {
          walletAddress: ind.walletAddress,
          corporationName: user?.corporationName || "Unknown Corp",
        };
      })
    );

    return enrichedIndicators;
  },
});

// Admin: Get all conversations (excluding support conversations - those go to Support tab)
export const getAllConversationsAdmin = query({
  args: {
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allConversations = await ctx.db.query("conversations").collect();

    // Filter out support conversations - those are handled by the Support tab
    const nonSupportConversations = allConversations.filter(
      conv => conv.participant1 !== SUPPORT_WALLET_ID && conv.participant2 !== SUPPORT_WALLET_ID
    );

    const enriched = await Promise.all(
      nonSupportConversations.map(async (conv) => {
        // Get participant info
        const user1 = await ctx.db
          .query("users")
          .withIndex("by_stake_address", (q) => q.eq("stakeAddress", conv.participant1))
          .first();
        const user2 = await ctx.db
          .query("users")
          .withIndex("by_stake_address", (q) => q.eq("stakeAddress", conv.participant2))
          .first();

        // Get message count
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .collect();
        const messageCount = messages.filter(m => !m.isDeleted).length;

        return {
          ...conv,
          participant1Info: {
            companyName: user1?.corporationName || "Unknown",
            walletAddress: conv.participant1,
          },
          participant2Info: {
            companyName: user2?.corporationName || "Unknown",
            walletAddress: conv.participant2,
          },
          messageCount,
        };
      })
    );

    // Apply search filter if provided
    let filtered = enriched;
    if (args.searchQuery && args.searchQuery.trim()) {
      const query = args.searchQuery.toLowerCase();
      filtered = enriched.filter(conv =>
        conv.participant1Info.companyName.toLowerCase().includes(query) ||
        conv.participant2Info.companyName.toLowerCase().includes(query) ||
        conv.participant1.toLowerCase().includes(query) ||
        conv.participant2.toLowerCase().includes(query)
      );
    }

    // Sort by most recent activity
    const sorted = filtered.sort((a, b) => b.lastMessageAt - a.lastMessageAt);

    // Return in expected format
    return {
      conversations: sorted.slice(0, 50), // Limit to 50 for performance
      hasMore: sorted.length > 50,
    };
  },
});

// Admin: Get messages for a conversation (includes sender info)
export const getMessagesAdmin = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    const filteredMessages = messages
      .filter((m) => !m.isDeleted)
      .sort((a, b) => a.createdAt - b.createdAt);

    // Resolve attachment URLs and add sender info
    const messagesWithDetails = await Promise.all(
      filteredMessages.map(async (msg) => {
        // Get sender info
        let senderInfo = { companyName: "Unknown" };
        if (msg.senderId === SUPPORT_WALLET_ID) {
          senderInfo = { companyName: "Over Exposed Support" };
        } else {
          const sender = await ctx.db
            .query("users")
            .withIndex("by_stake_address", (q) => q.eq("stakeAddress", msg.senderId))
            .first();
          if (sender) {
            senderInfo = { companyName: sender.corporationName || "Unknown" };
          }
        }

        // Resolve attachments
        let attachments = msg.attachments;
        if (msg.attachments && msg.attachments.length > 0) {
          attachments = await Promise.all(
            msg.attachments.map(async (att: any) => ({
              ...att,
              url: await ctx.storage.getUrl(att.storageId),
            }))
          );
        }

        return {
          ...msg,
          senderInfo,
          attachments,
        };
      })
    );

    return { messages: messagesWithDetails };
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

    const deletedMessages = messages
      .filter((m) => m.isDeleted || m.deletedByAdmin)
      .sort((a, b) => a.createdAt - b.createdAt);

    // Add sender info and resolve attachments
    const messagesWithDetails = await Promise.all(
      deletedMessages.map(async (msg) => {
        // Get sender info
        let senderInfo = { companyName: "Unknown" };
        if (msg.senderId === SUPPORT_WALLET_ID) {
          senderInfo = { companyName: "Over Exposed Support" };
        } else {
          const sender = await ctx.db
            .query("users")
            .withIndex("by_stake_address", (q) => q.eq("stakeAddress", msg.senderId))
            .first();
          if (sender) {
            senderInfo = { companyName: sender.corporationName || "Unknown" };
          }
        }

        // Resolve attachments
        let attachments = msg.attachments;
        if (msg.attachments && msg.attachments.length > 0) {
          attachments = await Promise.all(
            msg.attachments.map(async (att: any) => ({
              ...att,
              url: await ctx.storage.getUrl(att.storageId),
            }))
          );
        }

        return {
          ...msg,
          senderInfo,
          attachments,
        };
      })
    );

    return messagesWithDetails;
  },
});

// Get message count for a conversation (visible and deleted)
export const getConversationMessageCount = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    const visible = messages.filter((m) => !m.isDeleted && !m.deletedByAdmin).length;
    const deleted = messages.filter((m) => m.isDeleted || m.deletedByAdmin).length;

    return { visible, deleted };
  },
});

// Send a message
export const sendMessage = mutation({
  args: {
    senderWallet: v.string(),
    recipientWallet: v.string(),
    content: v.string(),
    conversationId: v.optional(v.id("conversations")),
    attachments: v.optional(v.array(v.object({
      storageId: v.id("_storage"),
      filename: v.string(),
      mimeType: v.string(),
      size: v.number(),
    }))),
    replyToMessageId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const { senderWallet, recipientWallet, content, conversationId, attachments, replyToMessageId } = args;

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
      attachments: attachments,
      replyToMessageId: replyToMessageId,
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

// Edit an existing message
export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    walletAddress: v.string(),
    newContent: v.string(),
  },
  handler: async (ctx, args) => {
    const { messageId, walletAddress, newContent } = args;

    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Only sender can edit their own messages
    if (message.senderId !== walletAddress) {
      throw new Error("You can only edit your own messages");
    }

    // Can't edit deleted messages
    if (message.isDeleted) {
      throw new Error("Cannot edit a deleted message");
    }

    // Can't edit messages with Mek attachments (those are verified at send time)
    if (message.mekAttachment) {
      throw new Error("Cannot edit messages with Mek attachments");
    }

    // Update the message
    await ctx.db.patch(messageId, {
      content: newContent,
      editedAt: Date.now(),
    });

    // Update conversation preview if this was the last message
    const conversation = await ctx.db.get(message.conversationId);
    if (conversation && conversation.lastMessageSender === walletAddress) {
      // Check if this was the most recent message
      const recentMessages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", message.conversationId))
        .order("desc")
        .first();

      if (recentMessages && recentMessages._id === messageId) {
        await ctx.db.patch(message.conversationId, {
          lastMessagePreview: newContent.substring(0, 80),
        });
      }
    }

    return { success: true };
  },
});

// Send a message with a verified Mek attachment (proves ownership)
export const sendMessageWithMek = mutation({
  args: {
    senderWallet: v.string(),
    recipientWallet: v.string(),
    conversationId: v.optional(v.id("conversations")),
    mekAssetId: v.string(), // The Mek to send
  },
  handler: async (ctx, args) => {
    const { senderWallet, recipientWallet, mekAssetId, conversationId } = args;

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

    // Verify the sender owns this Mek
    const mek = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q: any) => q.eq("assetId", mekAssetId))
      .first();

    if (!mek) {
      throw new Error("Mek not found");
    }

    if (mek.ownerStakeAddress !== senderWallet) {
      throw new Error("You don't own this Mek");
    }

    const now = Date.now();
    let convId = conversationId;

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
          lastMessagePreview: `[Mekanism #${mek.assetId}]`,
          lastMessageSender: senderWallet,
          createdAt: now,
        });
      }
    }

    // Create the mekAttachment with verified ownership snapshot
    const mekAttachment = {
      assetId: mek.assetId,
      assetName: mek.assetName,
      sourceKey: mek.sourceKey || "",
      sourceKeyBase: mek.sourceKeyBase,
      headVariation: mek.headVariation,
      bodyVariation: mek.bodyVariation,
      itemVariation: mek.itemVariation,
      customName: mek.customName,
      rarityRank: mek.rarityRank,
      gameRank: mek.gameRank,
      verifiedOwner: senderWallet,
      verifiedAt: now,
    };

    // Insert message with Mek attachment
    await ctx.db.insert("messages", {
      conversationId: convId,
      senderId: senderWallet,
      recipientId: recipientWallet,
      content: "", // No text content for Mek messages
      status: "sent",
      createdAt: now,
      isDeleted: false,
      mekAttachment,
    });

    // Update conversation
    await ctx.db.patch(convId, {
      lastMessageAt: now,
      lastMessagePreview: `[Mekanism #${mek.assetId}]`,
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

// ============================================
// SUPPORT CHAT FUNCTIONS
// ============================================

// Get support conversation for a player (if exists)
export const getSupportConversation = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const { walletAddress } = args;

    // Check both orderings
    const conv1 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) => q.eq("participant1", SUPPORT_WALLET_ID))
      .filter((q) => q.eq(q.field("participant2"), walletAddress))
      .first();

    if (conv1) return conv1;

    const conv2 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) => q.eq("participant1", walletAddress))
      .filter((q) => q.eq(q.field("participant2"), SUPPORT_WALLET_ID))
      .first();

    return conv2;
  },
});

// Create support conversation for a player (with welcome message)
export const createSupportConversation = mutation({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const { walletAddress } = args;
    const now = Date.now();

    // Check if already exists
    const existing1 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) => q.eq("participant1", SUPPORT_WALLET_ID))
      .filter((q) => q.eq(q.field("participant2"), walletAddress))
      .first();

    const existing2 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) => q.eq("participant1", walletAddress))
      .filter((q) => q.eq(q.field("participant2"), SUPPORT_WALLET_ID))
      .first();

    const existing = existing1 || existing2;

    if (existing) {
      // If it exists but is hidden, unhide it
      if (existing.participant1 === walletAddress && existing.hiddenForParticipant1) {
        await ctx.db.patch(existing._id, { hiddenForParticipant1: false });
      } else if (existing.participant2 === walletAddress && existing.hiddenForParticipant2) {
        await ctx.db.patch(existing._id, { hiddenForParticipant2: false });
      }
      return { success: true, conversationId: existing._id, alreadyExists: true };
    }

    // Create new support conversation
    const welcomeMessage = "Welcome to Mek Tycoon! If you ever have any questions, feel free to reach out to us here.";

    const convId = await ctx.db.insert("conversations", {
      participant1: SUPPORT_WALLET_ID,
      participant2: walletAddress,
      lastMessageAt: now,
      lastMessagePreview: welcomeMessage.substring(0, 80),
      lastMessageSender: SUPPORT_WALLET_ID,
      createdAt: now,
    });

    // Insert welcome message
    await ctx.db.insert("messages", {
      conversationId: convId,
      senderId: SUPPORT_WALLET_ID,
      recipientId: walletAddress,
      content: welcomeMessage,
      status: "sent",
      createdAt: now,
      isDeleted: false,
    });

    // Create unread count for player (1 unread welcome message)
    await ctx.db.insert("messageUnreadCounts", {
      walletAddress: walletAddress,
      conversationId: convId,
      count: 1,
    });

    return { success: true, conversationId: convId, alreadyExists: false };
  },
});

// Dismiss (hide) support conversation for a player
export const dismissSupportConversation = mutation({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const { walletAddress } = args;

    // Find the support conversation
    const conv1 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) => q.eq("participant1", SUPPORT_WALLET_ID))
      .filter((q) => q.eq(q.field("participant2"), walletAddress))
      .first();

    const conv2 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) => q.eq("participant1", walletAddress))
      .filter((q) => q.eq(q.field("participant2"), SUPPORT_WALLET_ID))
      .first();

    const conversation = conv1 || conv2;

    if (!conversation) {
      throw new Error("Support conversation not found");
    }

    // Hide for the player (not for support/admin side)
    if (conversation.participant1 === walletAddress) {
      await ctx.db.patch(conversation._id, { hiddenForParticipant1: true });
    } else {
      await ctx.db.patch(conversation._id, { hiddenForParticipant2: true });
    }

    return { success: true };
  },
});

// Reopen support conversation for a player
export const reopenSupportConversation = mutation({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const { walletAddress } = args;
    const now = Date.now();

    // Find the support conversation
    const conv1 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) => q.eq("participant1", SUPPORT_WALLET_ID))
      .filter((q) => q.eq(q.field("participant2"), walletAddress))
      .first();

    const conv2 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) => q.eq("participant1", walletAddress))
      .filter((q) => q.eq(q.field("participant2"), SUPPORT_WALLET_ID))
      .first();

    const conversation = conv1 || conv2;

    if (!conversation) {
      // If no conversation exists, create one with welcome message
      const welcomeMessage = "Welcome to Mek Tycoon! If you ever have any questions, feel free to reach out to us here.";

      const convId = await ctx.db.insert("conversations", {
        participant1: SUPPORT_WALLET_ID,
        participant2: walletAddress,
        lastMessageAt: now,
        lastMessagePreview: welcomeMessage.substring(0, 80),
        lastMessageSender: SUPPORT_WALLET_ID,
        createdAt: now,
      });

      await ctx.db.insert("messages", {
        conversationId: convId,
        senderId: SUPPORT_WALLET_ID,
        recipientId: walletAddress,
        content: welcomeMessage,
        status: "sent",
        createdAt: now,
        isDeleted: false,
      });

      await ctx.db.insert("messageUnreadCounts", {
        walletAddress: walletAddress,
        conversationId: convId,
        count: 1,
      });

      return { success: true, conversationId: convId, created: true };
    }

    // Unhide for the player
    if (conversation.participant1 === walletAddress) {
      await ctx.db.patch(conversation._id, { hiddenForParticipant1: false });
    } else {
      await ctx.db.patch(conversation._id, { hiddenForParticipant2: false });
    }

    return { success: true, conversationId: conversation._id, created: false };
  },
});

// Admin: Get all support conversations
export const getAllSupportConversations = query({
  args: {},
  handler: async (ctx) => {
    // Get all conversations where SUPPORT_WALLET_ID is a participant
    const asParticipant1 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) => q.eq("participant1", SUPPORT_WALLET_ID))
      .collect();

    const asParticipant2 = await ctx.db
      .query("conversations")
      .withIndex("by_participant2", (q) => q.eq("participant2", SUPPORT_WALLET_ID))
      .collect();

    const allConversations = [...asParticipant1, ...asParticipant2];

    // Enrich with player info and unread counts
    const enriched = await Promise.all(
      allConversations.map(async (conv) => {
        const playerWallet = conv.participant1 === SUPPORT_WALLET_ID
          ? conv.participant2
          : conv.participant1;

        const player = await ctx.db
          .query("users")
          .withIndex("by_stake_address", (q) => q.eq("stakeAddress", playerWallet))
          .first();

        // Get unread count for support side (messages from player that support hasn't read)
        // Since support doesn't have a real wallet, we track unread differently
        // For now, count messages where sender is player and status is not "read"
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .collect();

        const unreadForSupport = messages.filter(
          (m) => m.senderId === playerWallet && m.status !== "read" && !m.isDeleted
        ).length;

        return {
          ...conv,
          playerWallet,
          playerCorporationName: player?.corporationName || "Unknown Corp",
          unreadForSupport,
        };
      })
    );

    // Sort by most recent activity
    return enriched.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  },
});

// Admin: Get total unread count across all support conversations
export const getSupportUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    // Get all support conversations
    const asParticipant1 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) => q.eq("participant1", SUPPORT_WALLET_ID))
      .collect();

    const asParticipant2 = await ctx.db
      .query("conversations")
      .withIndex("by_participant2", (q) => q.eq("participant2", SUPPORT_WALLET_ID))
      .collect();

    const allConversations = [...asParticipant1, ...asParticipant2];

    let totalUnread = 0;

    for (const conv of allConversations) {
      const playerWallet = conv.participant1 === SUPPORT_WALLET_ID
        ? conv.participant2
        : conv.participant1;

      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
        .collect();

      totalUnread += messages.filter(
        (m) => m.senderId === playerWallet && m.status !== "read" && !m.isDeleted
      ).length;
    }

    return totalUnread;
  },
});

// Admin: Send message as support (auto-reopens dismissed conversation for player)
export const sendSupportMessage = mutation({
  args: {
    playerWallet: v.string(),
    content: v.string(),
    conversationId: v.id("conversations"),
    // Optional attachments (images)
    attachments: v.optional(v.array(v.object({
      storageId: v.id("_storage"),
      filename: v.string(),
      mimeType: v.string(),
      size: v.number(),
    }))),
    // Optional Mek attachment (admin can share any Mek)
    mekAttachment: v.optional(v.object({
      assetId: v.string(),
      assetName: v.string(),
      sourceKey: v.string(),
      sourceKeyBase: v.optional(v.string()),
      headVariation: v.string(),
      bodyVariation: v.string(),
      itemVariation: v.optional(v.string()),
      customName: v.optional(v.string()),
      rarityRank: v.optional(v.number()),
      gameRank: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const { playerWallet, content, conversationId, attachments, mekAttachment } = args;
    const now = Date.now();

    const conversation = await ctx.db.get(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Verify this is a support conversation
    if (conversation.participant1 !== SUPPORT_WALLET_ID && conversation.participant2 !== SUPPORT_WALLET_ID) {
      throw new Error("This is not a support conversation");
    }

    // Build message object
    const messageData: any = {
      conversationId,
      senderId: SUPPORT_WALLET_ID,
      recipientId: playerWallet,
      content,
      status: "sent",
      createdAt: now,
      isDeleted: false,
    };

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      messageData.attachments = attachments;
    }

    // Add Mek attachment if provided (admin doesn't need ownership verification)
    if (mekAttachment) {
      messageData.mekAttachment = {
        ...mekAttachment,
        verifiedAt: now,
        verifiedOwner: "SUPPORT_ADMIN", // Mark as admin-sent
      };
    }

    // Insert message from support
    await ctx.db.insert("messages", messageData);

    // Update conversation (and auto-reopen for player if dismissed)
    await ctx.db.patch(conversationId, {
      lastMessageAt: now,
      lastMessagePreview: content.substring(0, 80),
      lastMessageSender: SUPPORT_WALLET_ID,
      // Auto-reopen for player when support replies
      hiddenForParticipant1: false,
      hiddenForParticipant2: false,
    });

    // Update unread count for player
    const unreadRecord = await ctx.db
      .query("messageUnreadCounts")
      .withIndex("by_wallet_conversation", (q) =>
        q.eq("walletAddress", playerWallet).eq("conversationId", conversationId)
      )
      .first();

    if (unreadRecord) {
      await ctx.db.patch(unreadRecord._id, { count: unreadRecord.count + 1 });
    } else {
      await ctx.db.insert("messageUnreadCounts", {
        walletAddress: playerWallet,
        conversationId,
        count: 1,
      });
    }

    return { success: true };
  },
});

// Admin: Mark support conversation as read (for support side)
export const markSupportConversationAsRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const { conversationId } = args;

    const conversation = await ctx.db.get(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Verify this is a support conversation
    if (conversation.participant1 !== SUPPORT_WALLET_ID && conversation.participant2 !== SUPPORT_WALLET_ID) {
      throw new Error("This is not a support conversation");
    }

    const playerWallet = conversation.participant1 === SUPPORT_WALLET_ID
      ? conversation.participant2
      : conversation.participant1;

    // Mark all messages from player as read
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .filter((q) => q.eq(q.field("senderId"), playerWallet))
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

// Check if player has dismissed support conversation
export const isSupportConversationDismissed = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const { walletAddress } = args;

    // Find the support conversation
    const conv1 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) => q.eq("participant1", SUPPORT_WALLET_ID))
      .filter((q) => q.eq(q.field("participant2"), walletAddress))
      .first();

    const conv2 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) => q.eq("participant1", walletAddress))
      .filter((q) => q.eq(q.field("participant2"), SUPPORT_WALLET_ID))
      .first();

    const conversation = conv1 || conv2;

    if (!conversation) {
      return { exists: false, isDismissed: false };
    }

    const isDismissed = conversation.participant1 === walletAddress
      ? !!conversation.hiddenForParticipant1
      : !!conversation.hiddenForParticipant2;

    return { exists: true, isDismissed, conversationId: conversation._id };
  },
});
