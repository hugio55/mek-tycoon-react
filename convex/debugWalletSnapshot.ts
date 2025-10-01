import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Debug query to check what's stored for a wallet
export const getWalletDebugInfo = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Find all records for this wallet (could be duplicates)
    const records = await ctx.db
      .query("goldMining")
      .filter((q) =>
        q.or(
          q.eq(q.field("walletAddress"), args.walletAddress),
          q.eq(q.field("walletAddress"), args.walletAddress.toLowerCase()),
          // Check if it's a substring match (for hex addresses)
          q.gte(q.field("walletAddress"), args.walletAddress.substring(0, 20))
        )
      )
      .collect();

    return records.map(record => ({
      id: record._id,
      walletAddress: record.walletAddress,
      walletType: record.walletType,
      paymentAddresses: record.paymentAddresses || [],
      ownedMeks: record.ownedMeks || [],
      totalGoldPerHour: record.totalGoldPerHour,
      lastSnapshotTime: record.lastSnapshotTime,
      snapshotMekCount: record.snapshotMekCount,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
  },
});

// Mutation to manually add payment addresses to a wallet
export const addPaymentAddresses = mutation({
  args: {
    walletAddress: v.string(),
    paymentAddresses: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!record) {
      return {
        success: false,
        error: "Wallet not found in gold mining system"
      };
    }

    await ctx.db.patch(record._id, {
      paymentAddresses: args.paymentAddresses,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: `Added ${args.paymentAddresses.length} payment addresses to wallet`
    };
  },
});

// Query to test Blockfrost connection with different address formats
export const testBlockfrostQuery = query({
  args: {
    address: v.string(),
  },
  handler: async (ctx, args) => {
    // This is just for debugging - returns what type of address it appears to be
    const address = args.address;

    let addressType = "unknown";
    let isValid = false;

    if (address.startsWith("stake1")) {
      addressType = "bech32_stake_address";
      isValid = address.length > 50;
    } else if (address.startsWith("addr1")) {
      addressType = "bech32_payment_address";
      isValid = address.length > 50;
    } else if (/^[0-9a-fA-F]{56,60}$/.test(address)) {
      addressType = "hex_stake_credential";
      isValid = true;
    } else if (/^[0-9a-fA-F]{100,}$/.test(address)) {
      addressType = "hex_payment_address";
      isValid = true;
    }

    return {
      address: address.substring(0, 30) + "...",
      addressType,
      isValid,
      canQueryBlockfrost: addressType.includes("bech32"),
      needsConversion: addressType.includes("hex"),
    };
  },
});