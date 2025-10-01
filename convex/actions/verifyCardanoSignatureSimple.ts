"use node";

/**
 * Simplified Cardano Signature Verification
 * Uses a more straightforward approach for CIP-30 signature verification
 */

import { action } from "../_generated/server";
import { v } from "convex/values";

export const verifyCardanoSignature = action({
  args: {
    stakeAddress: v.string(),
    signature: v.string(), // Hex-encoded COSE_Sign1 signature
    message: v.string(),   // Original message that was signed
    nonce: v.string(),     // Nonce for replay protection
  },
  handler: async (ctx, args) => {
    console.log("[Signature Verification Simple] Starting verification");
    console.log("[Signature Verification Simple] Stake address:", args.stakeAddress);
    console.log("[Signature Verification Simple] Signature length:", args.signature.length);
    console.log("[Signature Verification Simple] Nonce:", args.nonce);

    try {
      // For now, we'll use a simplified verification that checks:
      // 1. Signature format is valid hex
      // 2. Signature is of reasonable length for COSE_Sign1
      // 3. Nonce matches what we expect
      // 4. Stake address format is valid

      // This is a temporary solution while we debug the CSL library loading issue
      // In production, you'd want full cryptographic verification

      // Step 1: Validate signature format
      if (!args.signature || args.signature.length < 100) {
        console.error("[Signature Verification Simple] Signature too short");
        return {
          valid: false,
          error: "Invalid signature format: too short"
        };
      }

      if (!/^[0-9a-fA-F]+$/.test(args.signature)) {
        console.error("[Signature Verification Simple] Signature not valid hex");
        return {
          valid: false,
          error: "Invalid signature format: not hex"
        };
      }

      // Step 2: Validate stake address format
      const isValidStakeFormat = args.stakeAddress.startsWith('stake1') ||
                                 args.stakeAddress.startsWith('stake_test1');

      if (!isValidStakeFormat) {
        console.error("[Signature Verification Simple] Invalid stake address format");
        return {
          valid: false,
          error: "Invalid stake address format"
        };
      }

      // Step 3: Check that the nonce is in the message
      if (!args.message.includes(args.nonce)) {
        console.error("[Signature Verification Simple] Nonce not found in message");
        return {
          valid: false,
          error: "Nonce not found in message"
        };
      }

      // Step 4: Try to parse the signature as COSE_Sign1 (basic check)
      try {
        const signatureBytes = Buffer.from(args.signature, 'hex');

        // COSE_Sign1 structure starts with specific CBOR tags
        // We can at least check if it looks like valid CBOR
        if (signatureBytes[0] === 0x84 || // Array of 4 elements (common COSE_Sign1 structure)
            signatureBytes[0] === 0x98 || // Array with more elements
            signatureBytes[0] === 0xd2 || // CBOR tag 18 (COSE_Sign1)
            signatureBytes[0] === 0xd0) { // Alternative CBOR tag

          console.log("[Signature Verification Simple] Signature appears to be valid COSE structure");

          // For MVP, we accept signatures that:
          // - Are valid hex
          // - Have reasonable length
          // - Look like COSE_Sign1 structure
          // - Come from a valid stake address
          // - Include the correct nonce

          console.log("[Signature Verification Simple] ✓ Signature accepted (simplified verification)");
          return {
            valid: true,
            warning: "Using simplified verification - full cryptographic verification pending"
          };
        } else {
          console.error("[Signature Verification Simple] Not a valid COSE_Sign1 structure");
          return {
            valid: false,
            error: "Invalid COSE_Sign1 structure"
          };
        }
      } catch (parseError: any) {
        console.error("[Signature Verification Simple] Error parsing signature:", parseError);
        return {
          valid: false,
          error: "Failed to parse signature structure"
        };
      }

    } catch (error: any) {
      console.error("[Signature Verification Simple] Unexpected error:", error);
      return {
        valid: false,
        error: `Verification failed: ${error.message}`
      };
    }
  }
});