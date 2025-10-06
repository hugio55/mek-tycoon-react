/**
 * Session Encryption Module
 * Encrypts wallet sessions using Web Crypto API with AES-GCM
 * Provides device-bound, non-extractable encryption keys
 */

import { generateDeviceId } from './platformDetection';
import { SecurityStateLogger } from './securityStateLogger';

const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits recommended for AES-GCM
const SALT_KEY = 'mek_encryption_salt';

/**
 * Encrypted session data structure
 */
interface EncryptedData {
  ciphertext: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  deviceId: string; // Device fingerprint for binding
  origin: string; // Origin URL for binding
  userAgentHash: string; // Hash of user agent for binding
  timestamp: number; // Encryption timestamp
}

/**
 * Get or generate installation-specific salt
 * Salt is generated once per installation and reused
 */
function getInstallationSalt(): string {
  if (typeof window === 'undefined') {
    throw new Error('[Encryption] Cannot access localStorage on server side');
  }

  let salt = localStorage.getItem(SALT_KEY);

  if (!salt) {
    // Generate new random salt
    const saltArray = new Uint8Array(16);
    crypto.getRandomValues(saltArray);
    salt = Array.from(saltArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    localStorage.setItem(SALT_KEY, salt);
    console.log('[Encryption] Generated new installation salt');
  }

  return salt;
}

/**
 * Generate device-bound encryption key using Web Crypto API
 * Key is non-extractable and bound to device fingerprint
 */
async function getDeviceKey(): Promise<CryptoKey> {
  if (typeof window === 'undefined') {
    throw new Error('[Encryption] Web Crypto API not available on server side');
  }

  if (!crypto.subtle) {
    throw new Error('[Encryption] Web Crypto API (crypto.subtle) not available. HTTPS required.');
  }

  // Combine device fingerprint with installation salt
  const deviceId = generateDeviceId();
  const salt = getInstallationSalt();
  const origin = window.location.origin;

  const keyMaterial = `${deviceId}|${salt}|${origin}`;

  // Convert key material to buffer
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyMaterial);

  // Import key material
  const baseKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive AES key using PBKDF2
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000, // High iteration count for security
      hash: 'SHA-256'
    },
    baseKey,
    {
      name: ENCRYPTION_ALGORITHM,
      length: KEY_LENGTH
    },
    false, // Non-extractable - key cannot be exported
    ['encrypt', 'decrypt']
  );

  return derivedKey;
}

/**
 * Hash user agent for privacy while maintaining binding
 */
async function hashUserAgent(): Promise<string> {
  if (typeof window === 'undefined') return 'server';

  const encoder = new TextEncoder();
  const data = encoder.encode(navigator.userAgent);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convert to hex string (first 16 chars for brevity)
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 16);
}

/**
 * Encrypt session data
 * @param session - Session object to encrypt
 * @returns Base64-encoded encrypted data with metadata
 */
export async function encryptSession(session: any): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('[Encryption] Cannot encrypt on server side');
  }

  const logger = new SecurityStateLogger('SessionEncrypt');

  try {
    logger.log('session_encrypt_start', {
      walletAddress: session.walletAddress?.slice(0, 12) + '...' || 'unknown',
      platform: session.platform
    });

    // Get device-bound encryption key
    const key = await getDeviceKey();

    // Generate random IV (initialization vector)
    const iv = new Uint8Array(IV_LENGTH);
    crypto.getRandomValues(iv);

    // Convert session to JSON and encode
    const encoder = new TextEncoder();
    const sessionJson = JSON.stringify(session);
    const sessionData = encoder.encode(sessionJson);

    // Encrypt data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: iv
      },
      key,
      sessionData
    );

    // Prepare encrypted data structure with binding information
    const encryptedData: EncryptedData = {
      ciphertext: bufferToBase64(encryptedBuffer),
      iv: bufferToBase64(iv.buffer),
      deviceId: generateDeviceId(),
      origin: window.location.origin,
      userAgentHash: await hashUserAgent(),
      timestamp: Date.now()
    };

    // Return as JSON string
    const result = JSON.stringify(encryptedData);

    logger.log('session_encrypt_complete', {
      size: result.length,
      deviceId: encryptedData.deviceId.substring(0, 16) + '...',
      origin: encryptedData.origin
    });
    logger.complete({ encryptedSize: result.length });

    return result;
  } catch (error) {
    logger.error('session_encrypt_error', error, { sessionData: session });
    throw new Error('Session encryption failed: ' + (error as Error).message);
  }
}

/**
 * Decrypt session data
 * @param encryptedString - Encrypted session string
 * @returns Decrypted session object
 */
export async function decryptSession(encryptedString: string): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('[Encryption] Cannot decrypt on server side');
  }

  const logger = new SecurityStateLogger('SessionDecrypt');

  try {
    logger.log('session_decrypt_start', { encryptedSize: encryptedString.length });

    // Parse encrypted data
    const encryptedData: EncryptedData = JSON.parse(encryptedString);

    // Validate binding - check device ID
    const currentDeviceId = generateDeviceId();
    if (encryptedData.deviceId !== currentDeviceId) {
      logger.error('session_decrypt_error', new Error('Device mismatch'), {
        expected: encryptedData.deviceId.substring(0, 16) + '...',
        actual: currentDeviceId.substring(0, 16) + '...'
      });
      throw new Error('Session bound to different device');
    }

    // Validate binding - check origin
    const currentOrigin = window.location.origin;
    if (encryptedData.origin !== currentOrigin) {
      logger.error('session_decrypt_error', new Error('Origin mismatch'), {
        expected: encryptedData.origin,
        actual: currentOrigin
      });
      throw new Error('Session bound to different origin');
    }

    // Validate binding - check user agent hash
    const currentUserAgentHash = await hashUserAgent();
    if (encryptedData.userAgentHash !== currentUserAgentHash) {
      logger.log('signature_retry', {
        reason: 'User agent changed',
        expected: encryptedData.userAgentHash,
        actual: currentUserAgentHash
      });
      // Don't throw - user agent can change legitimately (browser updates)
      // But log the warning for security monitoring
    }

    // Get device-bound decryption key
    const key = await getDeviceKey();

    // Decode base64 data
    const ciphertext = base64ToBuffer(encryptedData.ciphertext);
    const iv = base64ToBuffer(encryptedData.iv);

    // Decrypt data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: iv
      },
      key,
      ciphertext
    );

    // Convert decrypted buffer to JSON
    const decoder = new TextDecoder();
    const sessionJson = decoder.decode(decryptedBuffer);
    const session = JSON.parse(sessionJson);

    logger.log('session_decrypt_complete', {
      deviceId: encryptedData.deviceId.substring(0, 16) + '...',
      age: Math.floor((Date.now() - encryptedData.timestamp) / 1000 / 60) + ' minutes',
      walletAddress: session.walletAddress?.slice(0, 12) + '...' || 'unknown'
    });
    logger.complete({ sessionRestored: true });

    return session;
  } catch (error) {
    // Check if this is a parsing error (might be legacy plaintext)
    if (error instanceof SyntaxError) {
      logger.error('session_decrypt_error', error, { reason: 'Invalid JSON format' });
      throw new Error('Invalid encrypted session format');
    }

    logger.error('session_decrypt_error', error);
    throw new Error('Session decryption failed: ' + (error as Error).message);
  }
}

/**
 * Check if a session string is encrypted (vs legacy plaintext)
 */
export function isEncryptedSession(sessionString: string): boolean {
  try {
    const parsed = JSON.parse(sessionString);
    // Encrypted sessions have ciphertext and iv fields
    return parsed.ciphertext && parsed.iv && parsed.deviceId;
  } catch {
    return false;
  }
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Clear encryption salt (for troubleshooting/reset)
 * WARNING: This will invalidate all encrypted sessions
 */
export function clearEncryptionSalt(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(SALT_KEY);
  console.warn('[Encryption] Cleared encryption salt - all sessions invalidated');
}
