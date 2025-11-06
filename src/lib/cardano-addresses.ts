import * as CardanoWasm from "@emurgo/cardano-serialization-lib-nodejs";

/**
 * Cardano Address Utilities
 *
 * Handles conversion between hex-encoded addresses (from CIP-30 wallet API)
 * and human-readable Bech32 format (addr1..., stake1..., addr_test1...)
 */

/**
 * Convert hex-encoded address to Bech32 format
 * @param hexAddress - Hex-encoded address from wallet API
 * @returns Bech32 address string (addr1... or stake1... or addr_test1...)
 */
export function hexToBech32(hexAddress: string): string {
  try {
    const addressBytes = Buffer.from(hexAddress, "hex");
    const address = CardanoWasm.Address.from_bytes(addressBytes);
    return address.to_bech32();
  } catch (error) {
    console.error("[Cardano] Failed to convert hex to Bech32:", error);
    throw new Error("Invalid Cardano address format");
  }
}

/**
 * Get payment address from connected wallet using CIP-30 API
 *
 * This extracts the first payment address (addr1... or addr_test1...)
 * from the wallet's used addresses. This is where the NMKR NFT will be sent.
 *
 * @param walletApi - CIP-30 wallet API object (e.g., window.cardano.nami)
 * @returns Payment address in Bech32 format
 */
export async function getPaymentAddress(walletApi: any): Promise<string> {
  try {
    // Get used addresses from wallet (returns hex-encoded array)
    const usedAddressesHex = await walletApi.getUsedAddresses();

    if (!usedAddressesHex || usedAddressesHex.length === 0) {
      throw new Error("No addresses found in wallet");
    }

    // Convert first address from hex to Bech32
    const firstAddressHex = usedAddressesHex[0];
    const paymentAddress = hexToBech32(firstAddressHex);

    // Verify it's a payment address (not stake address)
    if (!paymentAddress.startsWith("addr1") && !paymentAddress.startsWith("addr_test1")) {
      throw new Error("Address is not a payment address");
    }

    console.log("[Cardano] Extracted payment address:", paymentAddress);
    return paymentAddress;

  } catch (error) {
    console.error("[Cardano] Failed to get payment address:", error);
    throw new Error("Could not extract payment address from wallet");
  }
}

/**
 * Validate Cardano address format
 * @param address - Bech32 address to validate
 * @returns true if valid payment or stake address
 */
export function isValidCardanoAddress(address: string): boolean {
  try {
    // Check prefix
    const validPrefixes = ["addr1", "addr_test1", "stake1", "stake_test1"];
    const hasValidPrefix = validPrefixes.some(prefix => address.startsWith(prefix));

    if (!hasValidPrefix) return false;

    // Try to parse with Cardano library
    CardanoWasm.Address.from_bech32(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if address is a mainnet address
 * @param address - Bech32 address
 * @returns true if mainnet, false if testnet
 */
export function isMainnetAddress(address: string): boolean {
  return address.startsWith("addr1") || address.startsWith("stake1");
}

/**
 * Check if address is a testnet address
 * @param address - Bech32 address
 * @returns true if testnet, false if mainnet
 */
export function isTestnetAddress(address: string): boolean {
  return address.startsWith("addr_test1") || address.startsWith("stake_test1");
}
