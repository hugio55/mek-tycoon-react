import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { validateUsername, normalizeUsername } from "../src/lib/usernameValidation";

export const checkUsernameAvailability = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const validation = validateUsername(args.username);
    if (!validation.valid) {
      return { available: false, error: validation.error };
    }

    const normalized = normalizeUsername(args.username);
    const existing = await ctx.db
      .query("users")
      .withIndex("by_display_name_lower", (q) => q.eq("displayNameLower", normalized))
      .first();

    return { 
      available: !existing, 
      error: existing ? "Username already taken (case-insensitive)" : undefined 
    };
  },
});

export const setDisplayName = mutation({
  args: { 
    walletAddress: v.string(),
    displayName: v.string() 
  },
  handler: async (ctx, args) => {
    // Validate username format
    const validation = validateUsername(args.displayName);
    if (!validation.valid) {
      throw new Error(validation.error || "Invalid username");
    }

    // Find the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Remove the permanent check - allow changing usernames

    // Check availability (case-insensitive, but allow user to keep their own name)
    const normalized = normalizeUsername(args.displayName);
    const existing = await ctx.db
      .query("users")
      .withIndex("by_display_name_lower", (q) => q.eq("displayNameLower", normalized))
      .first();

    if (existing && existing._id !== user._id) {
      throw new Error("Username already taken (case-insensitive)");
    }

    // Set the display name
    await ctx.db.patch(user._id, {
      displayName: args.displayName, // Keep original case
      displayNameLower: normalized,   // Store lowercase for uniqueness
      displayNameSet: true,
    });

    return { success: true, displayName: args.displayName };
  },
});

export const getUserDisplayName = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!user) {
      return null;
    }

    return {
      displayName: user.displayName,
      displayNameSet: user.displayNameSet || false,
    };
  },
});

export const getAllUsersWithDisplayNames = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("displayNameSet"), undefined))
      .filter((q) => q.eq(q.field("displayNameSet"), true))
      .collect();

    return users.map(user => ({
      walletAddress: user.walletAddress,
      displayName: user.displayName,
      gold: user.gold,
      level: user.level,
    }));
  },
});