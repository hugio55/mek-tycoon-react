// Cardano address format converter
// Converts between hex and bech32 formats for stake addresses

// Bech32 character set
const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

// Convert 5-bit groups to 8-bit bytes
function convert5to8(data: number[]): Uint8Array {
  let acc = 0;
  let bits = 0;
  const result: number[] = [];

  for (const value of data) {
    acc = (acc << 5) | value;
    bits += 5;

    while (bits >= 8) {
      bits -= 8;
      result.push((acc >> bits) & 0xff);
    }
  }

  return new Uint8Array(result);
}

// Convert 8-bit bytes to 5-bit groups
function convert8to5(data: Uint8Array): number[] {
  let acc = 0;
  let bits = 0;
  const result: number[] = [];

  for (const byte of data) {
    acc = (acc << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      bits -= 5;
      result.push((acc >> bits) & 0x1f);
    }
  }

  if (bits > 0) {
    result.push((acc << (5 - bits)) & 0x1f);
  }

  return result;
}

// Polymod for checksum calculation
function bech32Polymod(values: number[]): number {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;

  for (const value of values) {
    const b = chk >> 25;
    chk = (chk & 0x1ffffff) << 5 ^ value;

    for (let i = 0; i < 5; i++) {
      if ((b >> i) & 1) {
        chk ^= GEN[i];
      }
    }
  }

  return chk;
}

// Calculate bech32 checksum
function bech32CreateChecksum(hrp: string, data: number[]): number[] {
  const values: number[] = [];

  // Expand HRP
  for (const char of hrp) {
    values.push(char.charCodeAt(0) >> 5);
  }
  values.push(0);
  for (const char of hrp) {
    values.push(char.charCodeAt(0) & 0x1f);
  }

  // Add data
  values.push(...data);

  // Add padding for checksum
  values.push(...[0, 0, 0, 0, 0, 0]);

  const polymod = bech32Polymod(values) ^ 1;
  const checksum: number[] = [];

  for (let i = 0; i < 6; i++) {
    checksum.push((polymod >> (5 * (5 - i))) & 0x1f);
  }

  return checksum;
}

// Encode to bech32
function bech32Encode(hrp: string, data: Uint8Array): string {
  const data5bit = convert8to5(data);
  const checksum = bech32CreateChecksum(hrp, data5bit);

  let result = hrp + '1';
  for (const value of data5bit) {
    result += BECH32_CHARSET[value];
  }
  for (const value of checksum) {
    result += BECH32_CHARSET[value];
  }

  return result;
}

/**
 * Convert hex stake address to bech32 format
 * @param hexAddress Hex format stake address (starting with e1 for mainnet)
 * @returns Bech32 format stake address (stake1...)
 */
export function hexToBech32StakeAddress(hexAddress: string): string {
  // Check if already in bech32 format
  if (hexAddress.startsWith('stake1')) {
    return hexAddress;
  }

  // Validate hex format
  if (!/^[0-9a-fA-F]+$/.test(hexAddress)) {
    throw new Error('Invalid hex address format');
  }

  // Convert hex to bytes
  const bytes: number[] = [];
  const cleanHex = hexAddress.toLowerCase();

  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes.push(parseInt(cleanHex.substr(i, 2), 16));
  }

  // Check first byte for network
  // e1 = 225 = mainnet stake address
  // e0 = 224 = testnet stake address
  if (bytes[0] !== 0xe1 && bytes[0] !== 0xe0) {
    console.warn(`Warning: First byte is 0x${bytes[0].toString(16)}, expected 0xe1 for mainnet stake address`);
  }

  const hrp = bytes[0] === 0xe0 ? 'stake_test' : 'stake';
  const data = new Uint8Array(bytes);

  return bech32Encode(hrp, data);
}

/**
 * Convert payment address to stake address if possible
 * Note: This is a simplified version - full implementation would need proper address parsing
 */
export function extractStakeFromPayment(paymentAddress: string): string | null {
  // Payment addresses starting with addr1 contain stake key
  if (!paymentAddress.startsWith('addr1')) {
    return null;
  }

  // This would require full CBOR decoding to extract stake portion
  // For now, return null to indicate conversion not supported
  return null;
}

/**
 * Ensure we have a proper bech32 stake address
 * @param address Any format address from wallet
 * @returns Properly formatted bech32 stake address or original if can't convert
 */
export function ensureBech32StakeAddress(address: string): string {
  // Already bech32 stake address
  if (address.startsWith('stake1') || address.startsWith('stake_test')) {
    return address;
  }

  // Hex stake address (e1 prefix for mainnet, e0 for testnet)
  if (/^[0-9a-fA-F]{56,60}$/.test(address)) {
    try {
      const firstByte = parseInt(address.substr(0, 2), 16);

      // Check if it looks like a stake address (e0 or e1 prefix)
      if (firstByte === 0xe0 || firstByte === 0xe1) {
        return hexToBech32StakeAddress(address);
      }

      // If it starts with 01, it might be a different format
      // Log for debugging but return as-is
      console.log(`Address starts with 0x${address.substr(0, 2)}, not converting`);
    } catch (error) {
      console.error('Failed to convert hex to bech32:', error);
    }
  }

  // Return as-is if we can't convert
  return address;
}