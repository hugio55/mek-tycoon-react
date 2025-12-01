/**
 * Validates Cardano mainnet stake addresses
 *
 * Mainnet stake addresses:
 * - Start with "stake1"
 * - Use Bech32 encoding (lowercase letters and numbers)
 * - Typically 59-103 characters total
 *
 * Testnet stake addresses (REJECTED):
 * - Start with "stake_test1"
 */

export interface StakeAddressValidation {
  isValid: boolean;
  error?: string;
}

const MAINNET_PREFIX = 'stake1';
const TESTNET_PREFIX = 'stake_test1';
const MIN_LENGTH = 59;
const MAX_LENGTH = 103;
const BECH32_REGEX = /^[a-z0-9]+$/;

export function validateStakeAddress(address: string): StakeAddressValidation {
  // Remove whitespace
  const trimmed = address.trim();

  // Check for empty
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Stake address is required'
    };
  }

  // Check for testnet (reject explicitly)
  if (trimmed.startsWith(TESTNET_PREFIX)) {
    return {
      isValid: false,
      error: 'Testnet addresses are not accepted. Please use a mainnet stake address (stake1...)'
    };
  }

  // Check for mainnet prefix
  if (!trimmed.startsWith(MAINNET_PREFIX)) {
    return {
      isValid: false,
      error: 'Stake address must start with "stake1"'
    };
  }

  // Check length
  if (trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH) {
    return {
      isValid: false,
      error: `Stake address must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters`
    };
  }

  // Extract the part after the prefix
  const afterPrefix = trimmed.substring(MAINNET_PREFIX.length);

  // Check Bech32 format (lowercase letters and numbers only)
  if (!BECH32_REGEX.test(afterPrefix)) {
    return {
      isValid: false,
      error: 'Stake address contains invalid characters. Only lowercase letters and numbers are allowed'
    };
  }

  return {
    isValid: true
  };
}
