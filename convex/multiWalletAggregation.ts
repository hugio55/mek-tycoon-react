// Multi-wallet linking feature has been removed
// One wallet per account is now enforced
// This file is kept empty to prevent import errors

import { query } from "./_generated/server";
import { v } from "convex/values";

// Stub function to prevent import errors
// Returns empty data - multi-wallet linking is removed
export const getLinkedWallets = query({
  args: {
    walletAddress: v.string()
  },
  handler: async (ctx, args) => {
    return {
      primaryWallet: args.walletAddress,
      linkedWallets: [], // Always empty - feature removed
      totalWallets: 1
    };
  }
});

// Stub for getAggregatedMeks - feature removed
export const getAggregatedMeks = query({
  args: {
    walletAddress: v.string()
  },
  handler: async (ctx, args) => {
    return {
      success: false,
      error: "Multi-wallet aggregation has been removed - one wallet per account"
    };
  }
});