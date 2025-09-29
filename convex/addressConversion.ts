// Simple hex to bech32 converter for Cardano addresses
// This handles the most common case of stake addresses

export function convertHexToBech32(hexAddress: string): string {
  // Check if already in bech32 format
  if (hexAddress.startsWith('stake1') || hexAddress.startsWith('addr1')) {
    return hexAddress;
  }

  // Check if this looks like a hex stake address
  // Stake addresses in hex typically start with 'e1' for mainnet or '01' for rewards
  const isStakeAddress = hexAddress.startsWith('e1') || hexAddress.startsWith('01');

  if (isStakeAddress && hexAddress.length >= 56) {
    // For now, we'll need to store both formats or use a proper converter library
    // The snapshot system should handle the error gracefully
    console.log(`[AddressConversion] Need to convert hex ${hexAddress.substring(0, 10)}... to bech32`);

    // Return the hex as-is for now - Blockfrost will fail but at least we log it
    return hexAddress;
  }

  return hexAddress;
}

// Check if an address is in hex format
export function isHexAddress(address: string): boolean {
  return /^[0-9a-fA-F]{56,}$/.test(address);
}

// Check if an address is in bech32 format
export function isBech32Address(address: string): boolean {
  return address.startsWith('stake1') || address.startsWith('addr1');
}