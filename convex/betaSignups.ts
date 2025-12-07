import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Server-side Cardano stake address validation
 */
function validateStakeAddress(address: string): { isValid: boolean; error?: string } {
  const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

  const trimmed = address.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Stake address is required' };
  }

  if (trimmed.toLowerCase().startsWith('stake_test1')) {
    return {
      isValid: false,
      error: 'Testnet addresses are not accepted. Please use a mainnet stake address'
    };
  }

  if (!trimmed.toLowerCase().startsWith('stake1')) {
    return { isValid: false, error: 'Invalid stake address. Must start with "stake1"' };
  }

  if (trimmed.length < 59 || trimmed.length > 103) {
    return { isValid: false, error: 'Invalid stake address length' };
  }

  const lowercased = trimmed.toLowerCase();
  for (let i = 0; i < lowercased.length; i++) {
    const char = lowercased[i];
    if (char !== '1' && !BECH32_CHARSET.includes(char)) {
      return { isValid: false, error: 'Invalid character in stake address' };
    }
  }

  const hasUppercase = /[A-Z]/.test(trimmed);
  const hasLowercase = /[a-z]/.test(trimmed);
  if (hasUppercase && hasLowercase) {
    return { isValid: false, error: 'Mixed case is not allowed' };
  }

  return { isValid: true };
}

/**
 * Submit a beta signup with stake address
 */
export const submitBetaSignup = mutation({
  args: {
    stakeAddress: v.string(),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log('[🎮BETA-SERVER] Received signup:', args.stakeAddress, 'from IP:', args.ipAddress);

    // Validate stake address
    const validation = validateStakeAddress(args.stakeAddress);
    if (!validation.isValid) {
      console.log('[🎮BETA-SERVER] Validation failed:', validation.error);
      throw new Error(validation.error || 'Invalid stake address');
    }

    // Normalize to lowercase
    const normalizedAddress = args.stakeAddress.trim().toLowerCase();

    // Check for existing signup with this stake address (using index for performance)
    const existingAddress = await ctx.db
      .query("betaSignups")
      .withIndex("by_stakeAddress", (q: any) => q.eq("stakeAddress", normalizedAddress))
      .first();

    if (existingAddress) {
      console.log('[🎮BETA-SERVER] Address already registered');
      throw new Error('Stake address has already been added to the Phase 2 beta. Be sure to join our Discord and keep an eye on the MekTycoon channels for more information going forward.');
    }

    // Check for existing signup from this IP address
    if (args.ipAddress && args.ipAddress !== 'unknown') {
      const existingIP = await ctx.db
        .query("betaSignups")
        .withIndex("by_ipAddress", (q: any) => q.eq("ipAddress", args.ipAddress ?? null))
        .first();

      if (existingIP) {
        console.log('[🎮BETA-SERVER] IP address already used');
        throw new Error('We detect this could be the same user with a different stake address. We highly discourage this, since this future small perk being applied too many times could negatively affect the natural in-game economy. We care greatly about the economy unfolding in a realistic way. Thus, we would appreciate you refraining from accumulating multiple perks.');
      }
    }

    // Store the signup
    const signupId = await ctx.db.insert("betaSignups", {
      stakeAddress: normalizedAddress,
      submittedAt: Date.now(),
      ipAddress: args.ipAddress || null,
    });

    console.log('[🎮BETA-SERVER] Signup successful:', signupId);

    return {
      success: true,
      signupId,
    };
  },
});

/**
 * Get all beta signups (admin only)
 */
export const getAllBetaSignups = query({
  args: {},
  handler: async (ctx) => {
    const signups = await ctx.db
      .query("betaSignups")
      .order("desc")
      .collect();

    return signups;
  },
});

/**
 * Check if stake address is already registered
 */
export const checkStakeAddressRegistered = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const normalized = args.stakeAddress.trim().toLowerCase();

    // Use index for efficient lookup
    const existing = await ctx.db
      .query("betaSignups")
      .withIndex("by_stakeAddress", (q: any) => q.eq("stakeAddress", normalized))
      .first();

    return {
      isRegistered: !!existing,
    };
  },
});

/**
 * Get total count of beta signups (for landing page stats)
 */
export const getBetaSignupCount = query({
  args: {},
  handler: async (ctx) => {
    const signups = await ctx.db
      .query("betaSignups")
      .collect();

    return signups.length;
  },
});

/**
 * Delete a beta signup (admin only)
 */
export const deleteBetaSignup = mutation({
  args: {
    signupId: v.id("betaSignups"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.signupId);
    return { success: true };
  },
});
