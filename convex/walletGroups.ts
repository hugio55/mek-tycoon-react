import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// SECURITY CONFIGURATION
const MAX_WALLETS_PER_GROUP = 50; // Configurable limit to prevent abuse (supports whales)

// Helper function to generate a unique group ID
function generateGroupId(): string {
  return `grp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to log audit events
async function logAuditEvent(
  ctx: any,
  args: {
    groupId: string;
    action: string;
    performedBy: string;
    targetWallet?: string;
    signature?: string;
    nonce?: string;
    success: boolean;
    errorMessage?: string;
  }
) {
  await ctx.db.insert("walletGroupAudit", {
    groupId: args.groupId,
    action: args.action,
    performedBy: args.performedBy,
    targetWallet: args.targetWallet,
    signature: args.signature,
    nonce: args.nonce,
    timestamp: Date.now(),
    success: args.success,
    errorMessage: args.errorMessage,
  });
}

// Create a new wallet group with the first wallet
export const createWalletGroup = mutation({
  args: {
    walletAddress: v.string(),
    nickname: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if wallet is already in a group
    const existing = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (existing) {
      return {
        success: false,
        message: "Wallet already belongs to a group",
        groupId: existing.groupId,
      };
    }

    const groupId = generateGroupId();
    const now = Date.now();

    // PRESERVE ORIGINAL NAME: Get the wallet's current company name before creating group
    const goldMining = await ctx.db
      .query("goldMining")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    const originalCompanyName = goldMining?.companyName || null;

    // Create the wallet group
    await ctx.db.insert("walletGroups", {
      groupId,
      primaryWallet: args.walletAddress,
      createdAt: now,
    });

    // Add the wallet as the first member (preserving original company name for restoration)
    await ctx.db.insert("walletGroupMemberships", {
      groupId,
      walletAddress: args.walletAddress,
      addedAt: now,
      nickname: args.nickname,
      originalCompanyName, // Store for restoration when wallet is removed
    });

    // Log audit event
    await logAuditEvent(ctx, {
      groupId,
      action: "create_group",
      performedBy: args.walletAddress,
      success: true,
    });

    return {
      success: true,
      groupId,
      isPrimary: true,
    };
  },
});

// SECURE: Add a wallet to an existing group with cryptographic verification
export const addWalletToGroup = action({
  args: {
    existingWalletInGroup: v.string(), // Any wallet already in the group
    newWalletAddress: v.string(),
    signature: v.string(), // Cryptographic signature from newWalletAddress
    nonce: v.string(), // Nonce from wallet authentication
    nickname: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // STEP 1: Verify the new wallet owns the signature
      console.log(`[WalletGroup] Verifying signature for ${args.newWalletAddress}`);

      // Get the nonce record to build the message
      const nonceRecord: any = await ctx.runQuery(api.walletAuthentication.getNonceRecord, {
        nonce: args.nonce
      });

      if (!nonceRecord) {
        await ctx.runMutation(api.walletGroups.logAddWalletFailure, {
          existingWallet: args.existingWalletInGroup,
          newWallet: args.newWalletAddress,
          error: "Invalid nonce"
        });
        throw new Error("Invalid nonce - please generate a new one");
      }

      if (Date.now() > nonceRecord.expiresAt) {
        await ctx.runMutation(api.walletGroups.logAddWalletFailure, {
          existingWallet: args.existingWalletInGroup,
          newWallet: args.newWalletAddress,
          error: "Nonce expired"
        });
        throw new Error("Nonce expired - please generate a new one");
      }

      // Verify the cryptographic signature
      const verificationResult = await ctx.runAction(api.actions.verifyCardanoSignature.verifyCardanoSignature, {
        stakeAddress: args.newWalletAddress,
        nonce: args.nonce,
        signature: args.signature,
        message: `Please sign this message to verify ownership of your wallet:\n\nNonce: ${args.nonce}\nApplication: Mek Tycoon\nTimestamp: ${new Date(nonceRecord.createdAt).toISOString()}`
      });

      if (!verificationResult.valid) {
        await ctx.runMutation(api.walletGroups.logAddWalletFailure, {
          existingWallet: args.existingWalletInGroup,
          newWallet: args.newWalletAddress,
          error: verificationResult.error || "Signature verification failed"
        });
        throw new Error(verificationResult.error || "Invalid signature - cryptographic verification failed");
      }

      console.log(`[WalletGroup] ✓ Signature verified for ${args.newWalletAddress}`);

      // STEP 2: Add the wallet to the group (via mutation for atomicity)
      const result = await ctx.runMutation(api.walletGroups.addWalletToGroupVerified, {
        existingWalletInGroup: args.existingWalletInGroup,
        newWalletAddress: args.newWalletAddress,
        signature: args.signature,
        nonce: args.nonce,
        nickname: args.nickname,
      });

      return result;

    } catch (error: any) {
      console.error(`[WalletGroup] Failed to add wallet:`, error);
      throw error;
    }
  },
});

// Internal mutation: Add wallet after signature verification (called by action)
export const addWalletToGroupVerified = mutation({
  args: {
    existingWalletInGroup: v.string(),
    newWalletAddress: v.string(),
    signature: v.string(),
    nonce: v.string(),
    nickname: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find the group via the existing wallet
    let membership = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("", (q: any) => q.eq("walletAddress", args.existingWalletInGroup))
      .first();

    // If the existing wallet doesn't have a group yet, create one
    // This happens when user connects first wallet but never linked Discord
    if (!membership) {
      console.log('[WalletGroup] Existing wallet has no group, creating new group for:', args.existingWalletInGroup);

      const groupId = generateGroupId();
      const now = Date.now();

      // PRESERVE ORIGINAL NAME: Get the existing wallet's current company name before creating group
      const existingWalletGoldMining = await ctx.db
        .query("goldMining")
        .withIndex("", (q: any) => q.eq("walletAddress", args.existingWalletInGroup))
        .first();

      const existingOriginalCompanyName = existingWalletGoldMining?.companyName || null;

      // Create the wallet group
      await ctx.db.insert("walletGroups", {
        groupId,
        primaryWallet: args.existingWalletInGroup,
        createdAt: now,
      });

      // Add the existing wallet as the first member (preserving its original company name)
      await ctx.db.insert("walletGroupMemberships", {
        groupId,
        walletAddress: args.existingWalletInGroup,
        addedAt: now,
        originalCompanyName: existingOriginalCompanyName, // Store for restoration when wallet is removed
      });

      // Log the auto-creation
      await logAuditEvent(ctx, {
        groupId,
        action: "create_group",
        performedBy: args.existingWalletInGroup,
        success: true,
      });

      membership = { groupId, walletAddress: args.existingWalletInGroup };
    }

    const groupId = membership.groupId;

    // Check if new wallet is already in a group
    const existingNew = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("", (q: any) => q.eq("walletAddress", args.newWalletAddress))
      .first();

    if (existingNew) {
      // Check if it's the same group or a different group
      const isSameGroup = existingNew.groupId === groupId;

      if (isSameGroup) {
        const errorMessage = "You have already connected this wallet to your corporation";
        await logAuditEvent(ctx, {
          groupId,
          action: "add_wallet",
          performedBy: args.existingWalletInGroup,
          targetWallet: args.newWalletAddress,
          signature: args.signature,
          nonce: args.nonce,
          success: false,
          errorMessage,
        });
        throw new Error(errorMessage);
      }

      // Wallet is in a different group - check if it's a single-wallet group
      const oldGroupMembers = await ctx.db
        .query("walletGroupMemberships")
        .withIndex("", (q: any) => q.eq("groupId", existingNew.groupId))
        .collect();

      if (oldGroupMembers.length === 1) {
        // This is a single-wallet group - automatically migrate the wallet
        console.log(`[WalletGroup] Auto-migrating wallet from single-wallet group ${existingNew.groupId} to ${groupId}`);

        // Remove from old group
        await ctx.db.delete(existingNew._id);

        // Delete the old group
        const oldGroup = await ctx.db
          .query("walletGroups")
          .withIndex("", (q: any) => q.eq("groupId", existingNew.groupId))
          .first();

        if (oldGroup) {
          await ctx.db.delete(oldGroup._id);
        }

        // Log the migration
        await logAuditEvent(ctx, {
          groupId: existingNew.groupId,
          action: "auto_migrate_solo_wallet",
          performedBy: args.existingWalletInGroup,
          targetWallet: args.newWalletAddress,
          signature: args.signature,
          nonce: args.nonce,
          success: true,
        });

        console.log(`[WalletGroup] ✓ Removed ${args.newWalletAddress} from solo group ${existingNew.groupId}`);
      } else {
        // Wallet is in a multi-wallet group - cannot auto-migrate
        const errorMessage = "This wallet is already part of a different corporation with multiple wallets. You must remove it from that corporation first.";
        await logAuditEvent(ctx, {
          groupId,
          action: "add_wallet",
          performedBy: args.existingWalletInGroup,
          targetWallet: args.newWalletAddress,
          signature: args.signature,
          nonce: args.nonce,
          success: false,
          errorMessage,
        });
        throw new Error(errorMessage);
      }
    }

    // SECURITY: Check group size limit
    const groupWallets = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("", (q: any) => q.eq("groupId", groupId))
      .collect();

    if (groupWallets.length >= MAX_WALLETS_PER_GROUP) {
      await logAuditEvent(ctx, {
        groupId,
        action: "add_wallet",
        performedBy: args.existingWalletInGroup,
        targetWallet: args.newWalletAddress,
        signature: args.signature,
        nonce: args.nonce,
        success: false,
        errorMessage: `Group wallet limit reached (max: ${MAX_WALLETS_PER_GROUP})`,
      });
      throw new Error(`Cannot add wallet: group has reached maximum limit of ${MAX_WALLETS_PER_GROUP} wallets`);
    }

    // PRESERVE ORIGINAL NAME: Get the wallet's current company name before merging
    const newWalletGoldMining = await ctx.db
      .query("goldMining")
      .withIndex("", (q: any) => q.eq("walletAddress", args.newWalletAddress))
      .first();

    const originalCompanyName = newWalletGoldMining?.companyName || null;

    // Add the new wallet to the same group
    await ctx.db.insert("walletGroupMemberships", {
      groupId,
      walletAddress: args.newWalletAddress,
      addedAt: Date.now(),
      nickname: args.nickname,
      originalCompanyName, // Store for restoration when wallet is removed
    });

    // Log successful audit event
    await logAuditEvent(ctx, {
      groupId,
      action: "add_wallet",
      performedBy: args.existingWalletInGroup,
      targetWallet: args.newWalletAddress,
      signature: args.signature,
      nonce: args.nonce,
      success: true,
    });

    // Trigger an immediate NFT sync for the newly added wallet
    await ctx.scheduler.runAfter(0, api.nftSyncSaga.syncWalletNFTsWithSaga, {
      stakeAddress: args.newWalletAddress,
      walletType: 'Multi-Wallet', // Mark as added via multi-wallet flow
      forceResync: true, // Force fresh data for newly added wallet
    });

    console.log(`[WalletGroup] ✓ Wallet ${args.newWalletAddress} added to group ${groupId}`);

    return {
      success: true,
      groupId,
    };
  },
});

// Helper mutation: Log failed wallet addition attempts
export const logAddWalletFailure = mutation({
  args: {
    existingWallet: v.string(),
    newWallet: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    // Try to find the group to log properly
    const membership = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("", (q: any) => q.eq("walletAddress", args.existingWallet))
      .first();

    await logAuditEvent(ctx, {
      groupId: membership?.groupId || "unknown",
      action: "add_wallet",
      performedBy: args.existingWallet,
      targetWallet: args.newWallet,
      success: false,
      errorMessage: args.error,
    });
  },
});

// Remove a wallet from a group
export const removeWalletFromGroup = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the membership
    const membership = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!membership) {
      throw new Error("Wallet not found in any group");
    }

    const groupId = membership.groupId;

    // Get all wallets in this group
    const allWallets = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("", (q: any) => q.eq("groupId", groupId))
      .collect();

    // If this is the only wallet, delete the entire group
    if (allWallets.length === 1) {
      // RESTORE ORIGINAL NAME: Get the original company name before deleting
      const originalCompanyName = membership.originalCompanyName;

      await ctx.db.delete(membership._id);

      const group = await ctx.db
        .query("walletGroups")
        .withIndex("", (q: any) => q.eq("groupId", groupId))
        .first();

      if (group) {
        await ctx.db.delete(group._id);
      }

      // Restore the wallet's original company name (if it had one)
      if (originalCompanyName) {
        const goldMining = await ctx.db
          .query("goldMining")
          .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
          .first();

        if (goldMining) {
          await ctx.db.patch(goldMining._id, {
            companyName: originalCompanyName,
          });
          console.log(`[RemoveWallet] Restored original company name "${originalCompanyName}" for ${args.walletAddress}`);
        }
      }

      // Log audit event
      await logAuditEvent(ctx, {
        groupId,
        action: "remove_wallet",
        performedBy: args.walletAddress,
        targetWallet: args.walletAddress,
        success: true,
      });

      return {
        success: true,
        groupDeleted: true,
      };
    }

    // RESTORE ORIGINAL NAME: Get the original company name before removing membership
    const originalCompanyName = membership.originalCompanyName;

    // Remove the wallet membership
    await ctx.db.delete(membership._id);

    // Restore the wallet's original company name (if it had one)
    if (originalCompanyName) {
      const goldMining = await ctx.db
        .query("goldMining")
        .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
        .first();

      if (goldMining) {
        await ctx.db.patch(goldMining._id, {
          companyName: originalCompanyName,
        });
        console.log(`[RemoveWallet] Restored original company name "${originalCompanyName}" for ${args.walletAddress}`);
      }
    }

    // If this was the primary wallet, promote the next one
    const group = await ctx.db
      .query("walletGroups")
      .withIndex("", (q: any) => q.eq("groupId", groupId))
      .first();

    let primaryTransferred = false;
    if (group && group.primaryWallet === args.walletAddress) {
      // Find the next wallet (sorted by addedAt)
      const remaining = allWallets.filter((w: any) => w.walletAddress !== args.walletAddress);
      remaining.sort((a, b) => a.addedAt - b.addedAt);

      if (remaining.length > 0) {
        await ctx.db.patch(group._id, {
          primaryWallet: remaining[0].walletAddress,
        });
        primaryTransferred = true;

        // Log primary transfer
        await logAuditEvent(ctx, {
          groupId,
          action: "transfer_primary",
          performedBy: args.walletAddress,
          targetWallet: remaining[0].walletAddress,
          success: true,
        });
      }
    }

    // Log wallet removal
    await logAuditEvent(ctx, {
      groupId,
      action: "remove_wallet",
      performedBy: args.walletAddress,
      targetWallet: args.walletAddress,
      success: true,
    });

    return {
      success: true,
      groupDeleted: false,
    };
  },
});

// Get wallet group by any wallet address in the group
export const getWalletGroup = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!membership) {
      return null;
    }

    const group = await ctx.db
      .query("walletGroups")
      .withIndex("", (q: any) => q.eq("groupId", membership.groupId))
      .first();

    return group;
  },
});

// Get all wallets in a group
export const getGroupWallets = query({
  args: {
    groupId: v.string(),
  },
  handler: async (ctx, args) => {
    const wallets = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("", (q: any) => q.eq("groupId", args.groupId))
      .collect();

    const group = await ctx.db
      .query("walletGroups")
      .withIndex("", (q: any) => q.eq("groupId", args.groupId))
      .first();

    // Sort by addedAt, with primary wallet first
    wallets.sort((a, b) => {
      if (group) {
        if (a.walletAddress === group.primaryWallet) return -1;
        if (b.walletAddress === group.primaryWallet) return 1;
      }
      return a.addedAt - b.addedAt;
    });

    return wallets.map((w: any) => ({
      walletAddress: w.walletAddress,
      nickname: w.nickname,
      addedAt: w.addedAt,
      isPrimary: group?.primaryWallet === w.walletAddress,
    }));
  },
});

// Get all wallets for a specific wallet (convenience function)
export const getMyGroupWallets = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!membership) {
      // Return just this wallet if no group exists
      return [{
        walletAddress: args.walletAddress,
        nickname: undefined,
        addedAt: Date.now(),
        isPrimary: true,
      }];
    }

    const group = await ctx.db
      .query("walletGroups")
      .withIndex("", (q: any) => q.eq("groupId", membership.groupId))
      .first();

    const wallets = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("", (q: any) => q.eq("groupId", membership.groupId))
      .collect();

    // Sort by addedAt, with primary wallet first
    wallets.sort((a, b) => {
      if (group) {
        if (a.walletAddress === group.primaryWallet) return -1;
        if (b.walletAddress === group.primaryWallet) return 1;
      }
      return a.addedAt - b.addedAt;
    });

    return wallets.map((w: any) => ({
      walletAddress: w.walletAddress,
      nickname: w.nickname,
      addedAt: w.addedAt,
      isPrimary: group?.primaryWallet === w.walletAddress,
    }));
  },
});

// Set nickname for a wallet in a group
export const setWalletNickname = mutation({
  args: {
    walletAddress: v.string(),
    nickname: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!membership) {
      throw new Error("Wallet not found in any group");
    }

    await ctx.db.patch(membership._id, {
      nickname: args.nickname,
    });

    return { success: true };
  },
});

// Get company name for a wallet
export const getWalletCompanyName = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const goldMining = await ctx.db
      .query("goldMining")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    return goldMining?.companyName || null;
  },
});

// Update company name for all wallets in a group
export const updateGroupCompanyName = mutation({
  args: {
    groupId: v.string(),
    companyName: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all wallets in the group
    const wallets = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("", (q: any) => q.eq("groupId", args.groupId))
      .collect();

    // Update company name for each wallet's goldMining record
    for (const wallet of wallets) {
      const goldMining = await ctx.db
        .query("goldMining")
        .withIndex("", (q: any) => q.eq("walletAddress", wallet.walletAddress))
        .first();

      if (goldMining) {
        await ctx.db.patch(goldMining._id, {
          companyName: args.companyName,
        });
      }
    }

    return { success: true };
  },
});
