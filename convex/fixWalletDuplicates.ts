import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Query to find all duplicate wallet entries
export const findDuplicateWallets = query({
  args: {},
  handler: async (ctx) => {
    const allWallets = await ctx.db.query("goldMining").collect();

    // Group wallets by common patterns
    const groups: Record<string, any[]> = {};

    for (const wallet of allWallets) {
      // Extract potential common identifier
      let groupKey = wallet.walletAddress;

      // If it's a hex address, use the suffix
      if (/^[0-9a-fA-F]{56,}/.test(wallet.walletAddress)) {
        const suffix = wallet.walletAddress.slice(-8);
        groupKey = suffix;
      }
      // If it's a stake address, extract the last part
      else if (wallet.walletAddress.startsWith('stake1')) {
        const parts = wallet.walletAddress.split(/[0-9]/);
        groupKey = wallet.walletAddress.slice(-8);
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(wallet);
    }

    // Find groups with duplicates
    const duplicateGroups = Object.entries(groups)
      .filter(([_, wallets]) => wallets.length > 1)
      .map(([key, wallets]) => ({
        groupKey: key,
        wallets: wallets.map(w => ({
          id: w._id,
          address: w.walletAddress,
          type: w.walletType || 'unknown',
          mekCount: w.snapshotMekCount || 0,
          goldPerHour: w.totalGoldPerHour || 0,
          paymentAddresses: w.paymentAddresses || [],
          hasPaymentAddresses: (w.paymentAddresses?.length || 0) > 0
        }))
      }));

    return duplicateGroups;
  },
});

// Mutation to merge duplicate wallets and keep the best data
export const mergeDuplicatesAndFix = mutation({
  args: {
    primaryWalletAddress: v.string(), // The stake address to keep
  },
  handler: async (ctx, args) => {
    // Find all potential duplicates
    const allWallets = await ctx.db.query("goldMining").collect();

    // Find the primary wallet (stake address)
    const primaryWallet = allWallets.find(w =>
      w.walletAddress === args.primaryWalletAddress ||
      w.walletAddress.startsWith('stake1') &&
      w.walletAddress.includes(args.primaryWalletAddress.slice(-8))
    );

    if (!primaryWallet) {
      return {
        success: false,
        error: "Primary wallet not found"
      };
    }

    // Find related wallets (hex addresses with same suffix)
    const suffix = primaryWallet.walletAddress.slice(-8);
    const relatedWallets = allWallets.filter(w =>
      w._id !== primaryWallet._id &&
      (w.walletAddress.includes(suffix) ||
       w.walletAddress.endsWith(suffix))
    );

    // Collect all payment addresses from all related wallets
    const allPaymentAddresses = new Set<string>();

    // Add existing payment addresses from primary
    if (primaryWallet.paymentAddresses) {
      primaryWallet.paymentAddresses.forEach(addr => allPaymentAddresses.add(addr));
    }

    // Add payment addresses from related wallets
    for (const wallet of relatedWallets) {
      if (wallet.paymentAddresses) {
        wallet.paymentAddresses.forEach(addr => allPaymentAddresses.add(addr));
      }
    }

    // Update the primary wallet with all payment addresses
    await ctx.db.patch(primaryWallet._id, {
      paymentAddresses: Array.from(allPaymentAddresses),
      walletType: 'Cardano',
      updatedAt: Date.now(),
    });

    // Delete the duplicate wallets
    for (const wallet of relatedWallets) {
      await ctx.db.delete(wallet._id);
    }

    return {
      success: true,
      message: `Merged ${relatedWallets.length} duplicates into primary wallet`,
      primaryWallet: primaryWallet.walletAddress,
      paymentAddresses: Array.from(allPaymentAddresses),
      deletedCount: relatedWallets.length
    };
  },
});

// Action to fix wallet and run snapshot
export const fixWalletAndSnapshot = action({
  args: {
    stakeAddress: v.string(), // The stake1... address
    paymentAddress: v.optional(v.string()), // Optional payment address to add
  },
  handler: async (ctx, args) => {
    // Step 1: Merge any duplicates
    // FIXED: Actions CAN call mutations directly via ctx.runMutation
    const mergeResult = await ctx.runMutation(api.fixWalletDuplicates.mergeDuplicatesAndFix, {
      primaryWalletAddress: args.stakeAddress
    });

    if (!mergeResult.success) {
      return mergeResult;
    }

    // Step 2: Add payment address if provided
    if (args.paymentAddress) {
      // FIXED: Actions CAN call mutations directly via ctx.runMutation
      await ctx.runMutation(api.debugWalletSnapshot.addPaymentAddresses, {
        walletAddress: args.stakeAddress,
        paymentAddresses: [args.paymentAddress]
      });
    }

    // Step 3: Run a targeted snapshot for just this wallet
    const walletData = await ctx.runAction(api.getWalletAssetsFlexible.getWalletAssetsFlexible, {
      walletIdentifier: args.stakeAddress,
      paymentAddresses: mergeResult.paymentAddresses || [],
    });

    if (walletData.success && walletData.meks) {
      // Calculate gold rates for the found MEKs
      const goldRates = await ctx.runQuery(api.goldMining.calculateGoldRates, {
        meks: walletData.meks.map((m: any) => ({
          assetId: m.assetId,
          rarityRank: m.mekNumber
        }))
      });

      // Calculate total gold per hour
      const totalGoldPerHour = goldRates.reduce((sum: number, rate: any) =>
        sum + rate.goldPerHour, 0
      );

      // Update the wallet with the correct MEK count and gold rate
      // FIXED: Actions CAN call mutations directly via ctx.runMutation
      await ctx.runMutation(api.goldMining.initializeGoldMining, {
        walletAddress: args.stakeAddress,
        walletType: 'Cardano',
        paymentAddresses: mergeResult.paymentAddresses,
        ownedMeks: walletData.meks.map((m: any, index: number) => ({
          assetId: m.assetId,
          policyId: m.policyId || 'ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3',
          assetName: m.assetName,
          goldPerHour: goldRates[index]?.goldPerHour || 0,
          rarityRank: m.mekNumber,
          headVariation: m.headVariation || '',
          bodyVariation: m.bodyVariation || '',
          itemVariation: m.traitVariation || ''
        }))
      });

      return {
        success: true,
        message: `Fixed wallet! Found ${walletData.meks.length} MEKs earning ${totalGoldPerHour.toFixed(2)} gold/hr`,
        mekCount: walletData.meks.length,
        goldPerHour: totalGoldPerHour,
        mergedDuplicates: mergeResult.deletedCount
      };
    }

    return {
      success: false,
      error: `Could not fetch MEKs: ${walletData.error}`,
      mergeResult
    };
  },
});