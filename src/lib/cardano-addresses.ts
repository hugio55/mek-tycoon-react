/**
 * Cardano Address Utilities
 *
 * Handles conversion between hex-encoded addresses (from CIP-30 wallet API)
 * and human-readable Bech32 format (addr1..., stake1..., addr_test1...)
 *
 * NOTE: Dynamically imports WASM to avoid SSR issues
 */

// Lazy load CardanoWasm to avoid SSR issues with WASM
let CardanoWasm: any = null;

async function loadCardanoWasm() {
  if (!CardanoWasm) {
    CardanoWasm = await import("@emurgo/cardano-serialization-lib-browser");
  }
  return CardanoWasm;
}

/**
 * Convert hex-encoded address to Bech32 format
 * @param hexAddress - Hex-encoded address from wallet API
 * @returns Bech32 address string (addr1... or stake1... or addr_test1...)
 */
export async function hexToBech32(hexAddress: string): Promise<string> {
  try {
    const wasm = await loadCardanoWasm();
    const addressBytes = Buffer.from(hexAddress, "hex");
    const address = wasm.Address.from_bytes(addressBytes);
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
 * from the wallet using multiple fallback methods for compatibility.
 *
 * @param walletApi - CIP-30 wallet API object (e.g., window.cardano.nami)
 * @returns Payment address in Bech32 format
 */
export async function getPaymentAddress(walletApi: any): Promise<string> {
  try {
    let addressHex: string | null = null;

    // Method 1: Try getUsedAddresses() first (addresses with transaction history)
    try {
      const usedAddressesHex = await walletApi.getUsedAddresses();
      if (usedAddressesHex && usedAddressesHex.length > 0) {
        addressHex = usedAddressesHex[0];
        console.log("[Cardano] Found address via getUsedAddresses()");
      }
    } catch (err) {
      console.log("[Cardano] getUsedAddresses() failed:", err);
    }

    // Method 2: Try getUnusedAddresses() (addresses generated but not used on-chain)
    if (!addressHex) {
      try {
        const unusedAddressesHex = await walletApi.getUnusedAddresses();
        if (unusedAddressesHex && unusedAddressesHex.length > 0) {
          addressHex = unusedAddressesHex[0];
          console.log("[Cardano] Found address via getUnusedAddresses()");
        }
      } catch (err) {
        console.log("[Cardano] getUnusedAddresses() failed:", err);
      }
    }

    // Method 3: Fall back to getChangeAddress() (always available)
    if (!addressHex) {
      try {
        addressHex = await walletApi.getChangeAddress();
        console.log("[Cardano] Found address via getChangeAddress()");
      } catch (err) {
        console.log("[Cardano] getChangeAddress() failed:", err);
      }
    }

    if (!addressHex) {
      throw new Error("No addresses found in wallet");
    }

    // Convert from hex to Bech32
    const paymentAddress = await hexToBech32(addressHex);

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
export async function isValidCardanoAddress(address: string): Promise<boolean> {
  try {
    // Check prefix
    const validPrefixes = ["addr1", "addr_test1", "stake1", "stake_test1"];
    const hasValidPrefix = validPrefixes.some(prefix => address.startsWith(prefix));

    if (!hasValidPrefix) return false;

    // Try to parse with Cardano library
    const wasm = await loadCardanoWasm();
    wasm.Address.from_bech32(address);
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
