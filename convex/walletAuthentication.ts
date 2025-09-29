import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Helper function to convert hex string to bytes array (Convex-compatible)
function hexToBytes(hex: string): number[] {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes;
}

// Helper function to convert string to hex (Convex-compatible)
function stringToHex(str: string): string {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    const hexChar = charCode.toString(16).padStart(2, '0');
    hex += hexChar;
  }
  return hex;
}

// THIS IS A TEMPORARY WRAPPER - Real verification happens in verifyCardanoSignature action
// This function is kept for compatibility but now calls the real verification
async function verifyCardanoSignature(args: {
  stakeAddress: string;
  nonce: string;
  signature: string;
  message: string;
}): Promise<boolean> {
  // This is now just a placeholder that returns true
  // The real verification happens in the verifySignature action below
  // which calls api.actions.verifyCardanoSignature.verifyCardanoSignature
  console.log("[Auth] Signature verification will happen in action handler");
  return true; // Always return true here, real check is in the action
}

// Generate a unique nonce for wallet signature
export const generateNonce = mutation({
  args: {
    stakeAddress: v.string(),
    walletName: v.string()
  },
  handler: async (ctx, args) => {
    // Generate a random nonce
    const nonce = `mek-auth-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Store the nonce with expiration (24 hours for session-based persistence)
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    await ctx.db.insert("walletSignatures", {
      stakeAddress: args.stakeAddress,
      nonce,
      signature: "", // Will be filled after verification
      walletName: args.walletName,
      verified: false,
      expiresAt,
      createdAt: Date.now()
    });

    return {
      nonce,
      expiresAt,
      message: `Please sign this message to verify ownership of your wallet:\n\nNonce: ${nonce}\nApplication: Mek Tycoon\nTimestamp: ${new Date().toISOString()}`
    };
  }
});

// Verify wallet signature
export const verifySignature = action({
  args: {
    stakeAddress: v.string(),
    nonce: v.string(),
    signature: v.string(),
    walletName: v.string()
  },
  handler: async (ctx, args): Promise<{success: boolean, error?: string, verified?: boolean, expiresAt?: number}> => {
    try {
      // Get the nonce record
      const nonceRecord: any = await ctx.runQuery(api.walletAuthentication.getNonceRecord, {
        nonce: args.nonce
      });

      if (!nonceRecord) {
        return {
          success: false,
          error: "Invalid nonce"
        };
      }

      // Check if expired
      if (Date.now() > nonceRecord.expiresAt) {
        return {
          success: false,
          error: "Nonce expired. Please generate a new one."
        };
      }

      // Check if already verified
      if (nonceRecord.verified) {
        return {
          success: false,
          error: "Nonce already used"
        };
      }

      // REAL CRYPTOGRAPHIC SIGNATURE VERIFICATION
      // Call the new action with proper Emurgo library verification
      const verificationResult = await ctx.runAction(api.actions.verifyCardanoSignature.verifyCardanoSignature, {
        stakeAddress: args.stakeAddress,
        nonce: args.nonce,
        signature: args.signature,
        message: `Please sign this message to verify ownership of your wallet:\n\nNonce: ${args.nonce}\nApplication: Mek Tycoon\nTimestamp: ${new Date(nonceRecord.createdAt).toISOString()}`
      });

      console.log("[Auth] Verification result:", verificationResult);

      if (verificationResult.valid) {
        // Update the signature record
        await ctx.runMutation(api.walletAuthentication.updateSignatureRecord, {
          nonce: args.nonce,
          signature: args.signature,
          verified: true
        });

        // No multi-wallet linking needed - one wallet per account

        // Log the successful connection
        await ctx.runMutation(api.auditLogs.logWalletConnection, {
          stakeAddress: args.stakeAddress,
          walletName: args.walletName,
          signatureVerified: true,
          nonce: args.nonce,
          timestamp: Date.now()
        });

        return {
          success: true,
          verified: true,
          expiresAt: nonceRecord.expiresAt
        };
      } else {
        // Log failed attempt
        await ctx.runMutation(api.auditLogs.logWalletConnection, {
          stakeAddress: args.stakeAddress,
          walletName: args.walletName,
          signatureVerified: false,
          nonce: args.nonce,
          timestamp: Date.now()
        });

        return {
          success: false,
          error: verificationResult.error || "Invalid signature - cryptographic verification failed"
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Verification failed"
      };
    }
  }
});

// Get nonce record
export const getNonceRecord = query({
  args: {
    nonce: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("walletSignatures")
      .withIndex("by_nonce", q => q.eq("nonce", args.nonce))
      .first();
  }
});

// Update signature record
export const updateSignatureRecord = mutation({
  args: {
    nonce: v.string(),
    signature: v.string(),
    verified: v.boolean()
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("walletSignatures")
      .withIndex("by_nonce", q => q.eq("nonce", args.nonce))
      .first();

    if (record) {
      await ctx.db.patch(record._id, {
        signature: args.signature,
        verified: args.verified
      });
    }
  }
});

// Check if a wallet has valid authentication
export const checkAuthentication = query({
  args: {
    stakeAddress: v.string()
  },
  handler: async (ctx, args) => {
    // Find the most recent valid signature
    const signatures = await ctx.db
      .query("walletSignatures")
      .withIndex("by_stake_address", q => q.eq("stakeAddress", args.stakeAddress))
      .filter(q =>
        q.and(
          q.eq(q.field("verified"), true),
          q.gt(q.field("expiresAt"), Date.now())
        )
      )
      .order("desc")
      .take(1);

    if (signatures.length > 0) {
      return {
        authenticated: true,
        expiresAt: signatures[0].expiresAt,
        walletName: signatures[0].walletName
      };
    }

    return {
      authenticated: false,
      expiresAt: null,
      walletName: null
    };
  }
});

// Clean up expired signatures
export const cleanupExpiredSignatures = mutation({
  args: {},
  handler: async (ctx) => {
    const expired = await ctx.db
      .query("walletSignatures")
      .filter(q => q.lt(q.field("expiresAt"), Date.now()))
      .collect();

    for (const record of expired) {
      await ctx.db.delete(record._id);
    }

    return {
      cleaned: expired.length
    };
  }
});