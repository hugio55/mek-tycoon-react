/**
 * Wallet Address Extraction Utility for CIP-30 Wallets
 *
 * Extracts payment addresses from connected Cardano wallets for NMKR integration.
 * Works with Nami, Eternl, Flint, and other CIP-30 compatible wallets.
 */

/**
 * Extracts the first payment address from a CIP-30 wallet
 *
 * @param walletApi - The CIP-30 wallet API object
 * @returns Payment address in bech32 format (addr1...)
 */
export async function extractPaymentAddress(walletApi: any): Promise<string | null> {
  try {
    // Get unused addresses (includes payment addresses)
    const unusedAddresses = await walletApi.getUnusedAddresses();

    if (unusedAddresses && unusedAddresses.length > 0) {
      // First unused address is typically the payment address
      const hexAddress = unusedAddresses[0];
      return hexToBech32Address(hexAddress);
    }

    // Fallback: Get used addresses if no unused addresses
    const usedAddresses = await walletApi.getUsedAddresses();

    if (usedAddresses && usedAddresses.length > 0) {
      const hexAddress = usedAddresses[0];
      return hexToBech32Address(hexAddress);
    }

    console.error('No addresses found in wallet');
    return null;
  } catch (error) {
    console.error('Error extracting payment address:', error);
    return null;
  }
}

/**
 * Extracts the stake address from a CIP-30 wallet
 *
 * @param walletApi - The CIP-30 wallet API object
 * @returns Stake address in bech32 format (stake1...)
 */
export async function extractStakeAddress(walletApi: any): Promise<string | null> {
  try {
    // Get reward addresses (stake addresses)
    const rewardAddresses = await walletApi.getRewardAddresses();

    if (rewardAddresses && rewardAddresses.length > 0) {
      const hexAddress = rewardAddresses[0];
      return hexToBech32Address(hexAddress, true);
    }

    console.error('No stake address found in wallet');
    return null;
  } catch (error) {
    console.error('Error extracting stake address:', error);
    return null;
  }
}

/**
 * Gets both payment and stake addresses from a wallet
 *
 * @param walletApi - The CIP-30 wallet API object
 * @returns Object containing payment and stake addresses
 */
export async function extractWalletAddresses(walletApi: any): Promise<{
  paymentAddress: string | null;
  stakeAddress: string | null;
}> {
  const [paymentAddress, stakeAddress] = await Promise.all([
    extractPaymentAddress(walletApi),
    extractStakeAddress(walletApi)
  ]);

  return {
    paymentAddress,
    stakeAddress
  };
}

/**
 * Converts a hex address to bech32 format
 *
 * @param hexAddress - Address in hex format
 * @param isStakeAddress - Whether this is a stake address (default: false)
 * @returns Bech32 formatted address
 */
function hexToBech32Address(hexAddress: string, isStakeAddress = false): string {
  try {
    // Simple conversion - in production, use proper Cardano SDK
    // This is a placeholder that returns the hex as-is
    // In real implementation, use @emurgo/cardano-serialization-lib-browser

    // For now, return a mock address for development
    if (isStakeAddress) {
      return `stake1${hexAddress.slice(0, 20)}...`;
    } else {
      return `addr1${hexAddress.slice(0, 20)}...`;
    }

    // TODO: Implement proper hex to bech32 conversion
    // import { Address } from '@emurgo/cardano-serialization-lib-browser';
    // const bytes = Buffer.from(hexAddress, 'hex');
    // const address = Address.from_bytes(bytes);
    // return address.to_bech32();
  } catch (error) {
    console.error('Error converting hex to bech32:', error);
    return hexAddress; // Return hex if conversion fails
  }
}

/**
 * Checks if a wallet is connected and can provide addresses
 *
 * @param walletName - Name of the wallet (e.g., 'nami', 'eternl', 'flint')
 * @returns True if wallet is available and connected
 */
export async function isWalletConnected(walletName: string): Promise<boolean> {
  try {
    // Check if wallet extension exists
    const walletExtension = (window as any).cardano?.[walletName.toLowerCase()];
    if (!walletExtension) {
      return false;
    }

    // Check if wallet is enabled (connected)
    const isEnabled = await walletExtension.isEnabled();
    return isEnabled;
  } catch (error) {
    console.error(`Error checking ${walletName} connection:`, error);
    return false;
  }
}

/**
 * Gets the connected wallet API object
 *
 * @param walletName - Name of the wallet (e.g., 'nami', 'eternl', 'flint')
 * @returns Wallet API object or null if not connected
 */
export async function getWalletApi(walletName: string): Promise<any | null> {
  try {
    const walletExtension = (window as any).cardano?.[walletName.toLowerCase()];
    if (!walletExtension) {
      console.error(`${walletName} wallet not found`);
      return null;
    }

    // Enable wallet if not already enabled
    const api = await walletExtension.enable();
    return api;
  } catch (error) {
    console.error(`Error getting ${walletName} API:`, error);
    return null;
  }
}

/**
 * Utility to format address for display (shortened)
 *
 * @param address - Full bech32 address
 * @param startChars - Number of characters to show at start (default: 8)
 * @param endChars - Number of characters to show at end (default: 4)
 * @returns Formatted address like "addr1qxy...7890"
 */
export function formatAddressForDisplay(
  address: string,
  startChars = 8,
  endChars = 4
): string {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}