/**
 * Minting Policy Generator
 *
 * Creates native script minting policies for Cardano NFTs
 *
 * References:
 * - Native Scripts: https://docs.cardano.org/native-tokens/minting/
 * - Policy Scripts: https://github.com/input-output-hk/cardano-node/blob/master/doc/reference/simple-scripts.md
 * - CIP-14 (Asset Naming): https://cips.cardano.org/cips/cip14/
 */

import { ForgeScript } from '@meshsdk/core';
import { resolvePaymentKeyHash, resolveNativeScriptHash } from '@meshsdk/core';
import { getCurrentSlot, dateToSlot } from './blockfrost';

/**
 * Generate a time-locked + signature-based minting policy
 *
 * This creates a policy that:
 * 1. Requires signature from a specific payment key
 * 2. Only allows minting before a certain slot (expiry)
 *
 * @param paymentKeyHash - Payment key hash (from wallet)
 * @param expiryDate - Optional: Date after which minting is disabled
 * @returns Policy script and Policy ID
 *
 * References:
 * - MeshSDK ForgeScript: https://meshjs.dev/apis/transaction/minting
 */
export async function generateMintingPolicy(
  paymentKeyHash: string,
  expiryDate?: Date
): Promise<{
  policyId: string;
  policyScript: any;
  expirySlot?: number;
}> {
  const network = process.env.NEXT_PUBLIC_CARDANO_NETWORK === 'mainnet' ? 'mainnet' : 'preprod';

  // Calculate expiry slot if date provided
  let expirySlot: number | undefined;
  if (expiryDate) {
    expirySlot = dateToSlot(expiryDate, network);
  }

  // Build native script
  const scripts: any[] = [
    {
      type: 'sig',
      keyHash: paymentKeyHash
    }
  ];

  // Add time lock if expiry provided
  if (expirySlot) {
    scripts.push({
      type: 'before',
      slot: expirySlot
    });
  }

  const policyScript = {
    type: scripts.length > 1 ? 'all' : 'sig',
    scripts: scripts.length > 1 ? scripts : undefined,
    keyHash: scripts.length === 1 ? paymentKeyHash : undefined
  };

  // Calculate policy ID (hash of the script)
  const policyId = resolveNativeScriptHash(policyScript);

  return {
    policyId,
    policyScript,
    expirySlot
  };
}

/**
 * Generate a simple signature-only policy (no time lock)
 *
 * Allows minting indefinitely as long as you have the signing key
 * Good for: Collectibles, ongoing mints, flexible projects
 */
export async function generateSimplePolicy(paymentKeyHash: string) {
  return generateMintingPolicy(paymentKeyHash);
}

/**
 * Generate a time-limited policy
 *
 * Minting expires after the given date
 * Good for: Limited editions, event-based NFTs
 */
export async function generateTimeLimitedPolicy(
  paymentKeyHash: string,
  expiryDate: Date
) {
  return generateMintingPolicy(paymentKeyHash, expiryDate);
}

/**
 * Generate asset name (must be hex-encoded)
 *
 * Format options:
 * 1. Event NFTs: "E1_Skull_Basher_042"
 * 2. Collectibles: "Gift_For_Alice_001"
 * 3. Custom: Any string
 *
 * @param displayName - Human-readable name
 * @param mintNumber - Optional: Mint number (e.g., 42 of 100)
 * @returns Hex-encoded asset name
 *
 * References:
 * - Asset naming: https://cips.cardano.org/cips/cip14/
 */
export function generateAssetName(displayName: string, mintNumber?: number): string {
  // Sanitize name (remove special chars, replace spaces with underscores)
  let sanitized = displayName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 32); // Max 32 chars before encoding

  // Add mint number if provided
  if (mintNumber !== undefined) {
    const numStr = mintNumber.toString().padStart(3, '0');
    sanitized = `${sanitized}_${numStr}`;
  }

  // Convert to hex
  return Buffer.from(sanitized, 'utf-8').toString('hex');
}

/**
 * Decode asset name from hex
 */
export function decodeAssetName(hexAssetName: string): string {
  try {
    return Buffer.from(hexAssetName, 'hex').toString('utf-8');
  } catch {
    return hexAssetName; // Return as-is if decode fails
  }
}

/**
 * Generate full asset ID (policy ID + asset name)
 *
 * Format: {policyId}.{assetName}
 * Example: "7a3b2c...{asset_name_hex}"
 */
export function generateAssetId(policyId: string, assetName: string): string {
  return `${policyId}.${assetName}`;
}

/**
 * Parse asset ID into policy ID and asset name
 */
export function parseAssetId(assetId: string): { policyId: string; assetName: string } {
  const [policyId, assetName] = assetId.split('.');
  return { policyId, assetName };
}

/**
 * Validate policy script structure
 */
export function validatePolicyScript(script: any): boolean {
  if (!script || typeof script !== 'object') {
    return false;
  }

  // Check for required type
  if (!script.type) {
    return false;
  }

  // Validate based on type
  if (script.type === 'sig') {
    return !!script.keyHash;
  }

  if (script.type === 'all' || script.type === 'any') {
    return Array.isArray(script.scripts) && script.scripts.length > 0;
  }

  if (script.type === 'before' || script.type === 'after') {
    return typeof script.slot === 'number';
  }

  return false;
}

/**
 * Example policy script for reference
 *
 * This is what a complete policy looks like:
 */
export const EXAMPLE_POLICY_SCRIPT = {
  type: 'all',
  scripts: [
    {
      type: 'sig',
      keyHash: 'abcd1234...' // Payment key hash from wallet
    },
    {
      type: 'before',
      slot: 99999999 // Slot number expiry
    }
  ]
};
