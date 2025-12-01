/**
 * Cardano Stake Address Validation
 *
 * Validates Cardano mainnet stake addresses (stake1...)
 * Rejects testnet addresses (stake_test1...)
 */

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a Cardano mainnet stake address
 *
 * Rules:
 * - Must start with "stake1" (mainnet)
 * - Must be 59-103 characters long
 * - Must use valid Bech32 characters only
 * - Rejects testnet addresses (stake_test1)
 */
export function validateStakeAddress(address: string): ValidationResult {
  // Trim whitespace
  const trimmed = address.trim();

  // Check if empty
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Stake address is required'
    };
  }

  // Check if testnet (must reject)
  if (trimmed.toLowerCase().startsWith('stake_test1')) {
    return {
      isValid: false,
      error: 'Testnet addresses are not accepted. Please use a mainnet stake address (stake1...)'
    };
  }

  // Check if mainnet prefix
  if (!trimmed.toLowerCase().startsWith('stake1')) {
    return {
      isValid: false,
      error: 'Invalid stake address. Must start with "stake1"'
    };
  }

  // Check length (typical range is 59-103 characters)
  if (trimmed.length < 59 || trimmed.length > 103) {
    return {
      isValid: false,
      error: 'Invalid stake address length. Must be between 59-103 characters'
    };
  }

  // Validate Bech32 character set
  const lowercased = trimmed.toLowerCase();
  for (let i = 0; i < lowercased.length; i++) {
    const char = lowercased[i];
    if (char !== '1' && !BECH32_CHARSET.includes(char)) {
      return {
        isValid: false,
        error: `Invalid character "${char}" in stake address. Only Bech32 characters allowed`
      };
    }
  }

  // Check for mixed case (Bech32 should be all lowercase or all uppercase)
  const hasUppercase = /[A-Z]/.test(trimmed);
  const hasLowercase = /[a-z]/.test(trimmed);
  if (hasUppercase && hasLowercase) {
    return {
      isValid: false,
      error: 'Invalid stake address. Mixed case is not allowed'
    };
  }

  // All checks passed
  return {
    isValid: true
  };
}

/**
 * Quick check if address looks like a valid mainnet stake address
 * Useful for real-time UI feedback
 */
export function isValidStakeAddressFormat(address: string): boolean {
  const trimmed = address.trim().toLowerCase();
  return (
    trimmed.startsWith('stake1') &&
    trimmed.length >= 59 &&
    trimmed.length <= 103 &&
    !trimmed.startsWith('stake_test1')
  );
}

/**
 * Get user-friendly error message for invalid stake address
 */
export function getStakeAddressError(address: string): string | null {
  const result = validateStakeAddress(address);
  return result.error || null;
}
