# Mobile Wallet Verification Architecture
**Version:** 1.0
**Date:** October 2, 2025
**Status:** Design Document - Implementation Pending

---

## Executive Summary

This document outlines the comprehensive architecture for implementing cryptographically secure wallet verification for both mobile and desktop Cardano wallets in Mek Tycoon. The current implementation uses simplified signature verification that validates format but does not perform full cryptographic verification. This architecture provides a roadmap for transitioning to production-grade security while maintaining compatibility across all platforms.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Mobile vs Desktop Wallet Differences](#mobile-vs-desktop-wallet-differences)
3. [Verification Flow Architecture](#verification-flow-architecture)
4. [Security Model](#security-model)
5. [Session Management](#session-management)
6. [Implementation Recommendations](#implementation-recommendations)
7. [Attack Vectors & Mitigations](#attack-vectors--mitigations)
8. [Testing Strategy](#testing-strategy)

---

## 1. Current State Analysis

### 1.1 Existing Implementation

**Current Verification Logic** (`convex/actions/verifyCardanoSignatureSimple.ts`):
- Basic format validation (hex check, minimum length)
- CBOR/COSE_Sign1 structure detection
- Nonce presence verification
- Stake address format validation
- **NO cryptographic signature verification**

**Status:** MVP-level security suitable for testing only.

### 1.2 What's Missing

1. **Cryptographic Verification**
   - No public key extraction from signature
   - No signature payload verification
   - No key derivation validation
   - No address reconstruction check

2. **Replay Attack Protection**
   - Nonce reuse not prevented at verification layer
   - No timestamp validation window
   - No signature binding to specific operations

3. **Session Security**
   - No token rotation
   - No device fingerprinting
   - No suspicious activity detection

4. **Platform-Specific Handling**
   - No differentiation between mobile/desktop signature formats
   - No wallet-specific quirks handling
   - No platform capability detection

---

## 2. Mobile vs Desktop Wallet Differences

### 2.1 CIP-30 Standard Compliance

**CIP-30 (Cardano dApp-Wallet Web Bridge)** defines the standard API for wallet interactions. Both mobile and desktop wallets should implement this standard, but with platform-specific variations.

#### Desktop Wallets (Browser Extension)

**Injection Method:**
```javascript
window.cardano = {
  nami: { ... },
  eternl: { ... },
  flint: { ... }
}
```

**Characteristics:**
- Synchronous API injection on page load
- Direct JavaScript bridge to wallet
- Persistent across page navigation
- Same-origin security model

**Signature Format (CIP-30):**
```typescript
signData(addr: Address, payload: string): Promise<DataSignature>

// Returns:
{
  signature: string,  // Hex-encoded COSE_Sign1 structure
  key: string         // Hex-encoded COSE_Key public key
}
```

**Common Quirks:**
- **Nami**: Sometimes includes network tag in address
- **Eternl**: Available as both `eternl` and `ccvault`
- **Flint**: Requires explicit network selection
- **Typhon**: Uses `typhon` key (not `typhoncip30`)

#### Mobile Wallets (Native Apps)

**Injection Method:**
```javascript
// After deep link return
window.cardano.eternl = { ... } // Injected asynchronously
```

**Characteristics:**
- Asynchronous API injection (50ms - 3000ms delay)
- Deep link-based connection flow
- May lose injection on background/foreground
- WebView security context differences

**Signature Format (Same CIP-30 but with variations):**
```typescript
// iOS WebView may wrap response differently
{
  signature: string,
  key: string,
  platform: "ios" | "android" // Some wallets include this
}
```

**Platform-Specific Issues:**

**iOS Wallets:**
- WebView context may reset on app switch
- Deep link return may reload page (losing state)
- Stricter CORS and CSP policies
- WKWebView vs SFSafariViewController differences
- Touch events vs mouse events

**Android Wallets:**
- Custom tab vs WebView variance
- Different deep link handling per manufacturer
- Intent-based return flow
- Chrome Custom Tabs vs in-app browser

### 2.2 Signature Structure Differences

**Desktop (Standard CIP-30):**
```
COSE_Sign1 Structure:
[
  protected: { alg: "EdDSA" },    // Header
  unprotected: {},                 // Additional data
  payload: bytes,                  // Message being signed
  signature: bytes                 // Ed25519 signature
]
```

**Mobile (May include wrapper):**
```
Some mobile wallets wrap COSE_Sign1 with:
{
  coseSign1: "...",    // Standard structure
  metadata: {          // Platform metadata
    wallet: "eternl",
    version: "1.2.3",
    platform: "ios"
  }
}
```

### 2.3 Detection & Capability Checking

**Desktop Detection:**
```typescript
function detectDesktopWallets(): string[] {
  if (typeof window === 'undefined' || !window.cardano) return [];

  return Object.keys(window.cardano).filter(key =>
    typeof window.cardano[key]?.enable === 'function'
  );
}
```

**Mobile Detection:**
```typescript
function detectMobileWallet(): Promise<string | null> {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 60; // 30 seconds at 500ms intervals

    const interval = setInterval(() => {
      attempts++;

      if (window.cardano && Object.keys(window.cardano).length > 0) {
        clearInterval(interval);
        const walletKey = Object.keys(window.cardano)[0];
        resolve(walletKey);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        resolve(null);
      }
    }, 500);
  });
}
```

**Capability Detection:**
```typescript
interface WalletCapabilities {
  signData: boolean;      // CIP-30 data signing
  signTx: boolean;        // Transaction signing
  getNetworkId: boolean;  // Network detection
  getUtxos: boolean;      // UTXO access
  platform: 'desktop' | 'mobile' | 'unknown';
}

async function detectCapabilities(walletApi: any): Promise<WalletCapabilities> {
  return {
    signData: typeof walletApi.signData === 'function',
    signTx: typeof walletApi.signTx === 'function',
    getNetworkId: typeof walletApi.getNetworkId === 'function',
    getUtxos: typeof walletApi.getUtxos === 'function',
    platform: detectPlatform()
  };
}
```

---

## 3. Verification Flow Architecture

### 3.1 High-Level Flow Diagram

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Request Nonce
       ▼
┌──────────────────────┐
│  API: /generate-nonce │
│  - Generate nonce     │
│  - Store in DB        │
│  - Return to client   │
└──────┬───────────────┘
       │
       │ 2. Nonce + Message
       ▼
┌──────────────────┐
│ Wallet (Desktop/ │
│     Mobile)      │
│ - User signs msg │
│ - Returns COSE   │
└──────┬───────────┘
       │
       │ 3. Signature + Key
       ▼
┌─────────────────────────┐
│ API: /verify-signature   │
│ - Platform detection     │
│ - Route to verifier      │
└──────┬──────────────────┘
       │
       ├─────────────┬──────────────┐
       │             │              │
       ▼             ▼              ▼
   Desktop      Mobile iOS    Mobile Android
   Verifier     Verifier       Verifier
       │             │              │
       └─────────────┴──────────────┘
                     │
                     ▼
            ┌────────────────────┐
            │ Core Verification  │
            │ - COSE parse       │
            │ - Ed25519 verify   │
            │ - Key derivation   │
            │ - Address match    │
            └────────┬───────────┘
                     │
                     ▼
            ┌────────────────────┐
            │ Session Creation   │
            │ - Generate token   │
            │ - Store session    │
            │ - Return to client │
            └────────────────────┘
```

### 3.2 Platform Detection Strategy

**Detection Order:**
1. User agent analysis (mobile vs desktop)
2. Wallet API injection timing (sync vs async)
3. Wallet metadata inspection (if available)
4. Signature structure analysis

**Detection Code:**
```typescript
interface PlatformContext {
  type: 'desktop' | 'mobile-ios' | 'mobile-android' | 'unknown';
  walletName: string;
  walletVersion?: string;
  browserInfo: {
    name: string;
    version: string;
    engine: string; // WebKit, Blink, Gecko
  };
}

function detectPlatformContext(walletName: string): PlatformContext {
  const userAgent = navigator.userAgent.toLowerCase();

  // iOS detection
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isMobileSafari = isIOS && /safari/.test(userAgent) && !/crios|fxios/.test(userAgent);

  // Android detection
  const isAndroid = /android/.test(userAgent);
  const isMobileChrome = isAndroid && /chrome/.test(userAgent);

  // Desktop detection
  const isDesktop = !isIOS && !isAndroid;

  return {
    type: isIOS ? 'mobile-ios' : isAndroid ? 'mobile-android' : 'desktop',
    walletName,
    browserInfo: {
      name: detectBrowserName(userAgent),
      version: detectBrowserVersion(userAgent),
      engine: detectEngine(userAgent)
    }
  };
}
```

### 3.3 Verification Strategy Router

**Strategy Pattern Implementation:**
```typescript
interface VerificationStrategy {
  canHandle(context: PlatformContext): boolean;
  verify(args: VerificationArgs): Promise<VerificationResult>;
  extractPublicKey(signature: string): Promise<PublicKey>;
  validateAddress(key: PublicKey, stakeAddress: string): Promise<boolean>;
}

class DesktopVerificationStrategy implements VerificationStrategy {
  canHandle(context: PlatformContext): boolean {
    return context.type === 'desktop';
  }

  async verify(args: VerificationArgs): Promise<VerificationResult> {
    // Standard CIP-30 verification
    const coseSign1 = parseCOSE_Sign1(args.signature);
    const publicKey = await this.extractPublicKey(args.signature);
    const isValid = await verifyEd25519Signature(
      coseSign1.payload,
      coseSign1.signature,
      publicKey
    );

    if (!isValid) {
      return { valid: false, error: "Invalid signature" };
    }

    const addressMatch = await this.validateAddress(publicKey, args.stakeAddress);
    if (!addressMatch) {
      return { valid: false, error: "Address mismatch" };
    }

    return { valid: true };
  }

  // ... implementation details
}

class IOSMobileVerificationStrategy implements VerificationStrategy {
  canHandle(context: PlatformContext): boolean {
    return context.type === 'mobile-ios';
  }

  async verify(args: VerificationArgs): Promise<VerificationResult> {
    // iOS-specific handling
    // Some iOS wallets may wrap the signature differently
    let signature = args.signature;

    // Try unwrapping if needed
    if (this.isWrappedSignature(signature)) {
      signature = this.unwrapIOSSignature(signature);
    }

    // Then proceed with standard verification
    return new DesktopVerificationStrategy().verify({
      ...args,
      signature
    });
  }

  private isWrappedSignature(sig: string): boolean {
    // Check if signature has iOS-specific wrapper
    try {
      const parsed = JSON.parse(Buffer.from(sig, 'hex').toString());
      return parsed.hasOwnProperty('coseSign1');
    } catch {
      return false;
    }
  }

  private unwrapIOSSignature(sig: string): string {
    const parsed = JSON.parse(Buffer.from(sig, 'hex').toString());
    return parsed.coseSign1;
  }
}

class AndroidMobileVerificationStrategy implements VerificationStrategy {
  canHandle(context: PlatformContext): boolean {
    return context.type === 'mobile-android';
  }

  async verify(args: VerificationArgs): Promise<VerificationResult> {
    // Android verification (usually same as desktop)
    // But may have Chrome Custom Tabs quirks
    return new DesktopVerificationStrategy().verify(args);
  }
}

// Strategy selector
class VerificationStrategySelector {
  private strategies: VerificationStrategy[] = [
    new DesktopVerificationStrategy(),
    new IOSMobileVerificationStrategy(),
    new AndroidMobileVerificationStrategy()
  ];

  selectStrategy(context: PlatformContext): VerificationStrategy {
    const strategy = this.strategies.find(s => s.canHandle(context));
    if (!strategy) {
      throw new Error(`No verification strategy for platform: ${context.type}`);
    }
    return strategy;
  }
}
```

### 3.4 Fallback Mechanisms

**Verification Fallback Chain:**
```typescript
class FallbackVerifier {
  async verifyWithFallbacks(args: VerificationArgs): Promise<VerificationResult> {
    const context = detectPlatformContext(args.walletName);

    // Try primary strategy
    try {
      const strategy = selector.selectStrategy(context);
      return await strategy.verify(args);
    } catch (primaryError) {
      console.warn('[Verification] Primary strategy failed:', primaryError);

      // Fallback 1: Try generic verification
      try {
        return await this.genericVerification(args);
      } catch (fallbackError) {
        console.warn('[Verification] Generic fallback failed:', fallbackError);

        // Fallback 2: Extended validation (less strict)
        try {
          return await this.extendedValidation(args);
        } catch (extendedError) {
          console.error('[Verification] All verification methods failed');

          // Final fallback: Reject but log for investigation
          await this.logVerificationFailure(args, {
            primaryError,
            fallbackError,
            extendedError
          });

          return {
            valid: false,
            error: "Verification failed - signature could not be validated"
          };
        }
      }
    }
  }

  private async genericVerification(args: VerificationArgs): Promise<VerificationResult> {
    // Try to verify without platform-specific handling
    const coseSign1 = parseCOSE_Sign1(args.signature);
    // ... standard verification
  }

  private async extendedValidation(args: VerificationArgs): Promise<VerificationResult> {
    // More lenient validation for edge cases
    // Still validates core security properties but allows format variations
    // This should still be cryptographically secure, just more flexible
  }
}
```

---

## 4. Security Model

### 4.1 Cryptographic Verification Requirements

**Full verification must include:**

1. **COSE_Sign1 Parsing**
   - Validate CBOR structure
   - Extract protected headers
   - Extract payload (message)
   - Extract signature bytes

2. **Public Key Extraction**
   - Parse COSE_Key from signature
   - Validate key type (Ed25519)
   - Extract public key bytes

3. **Signature Verification**
   - Reconstruct signing payload: `Sig_structure`
   - Verify Ed25519 signature against payload
   - Ensure signature matches public key

4. **Address Derivation & Matching**
   - Derive stake address from public key
   - Hash public key: `blake2b_224(public_key)`
   - Construct stake address with network tag
   - Compare with claimed stake address

**Implementation Pseudocode:**
```typescript
async function fullCryptographicVerification(
  signature: string,
  message: string,
  stakeAddress: string
): Promise<VerificationResult> {

  // 1. Parse COSE_Sign1
  const signatureBytes = Buffer.from(signature, 'hex');
  const coseSign1 = cbor.decode(signatureBytes);

  if (!Array.isArray(coseSign1) || coseSign1.length !== 4) {
    return { valid: false, error: "Invalid COSE_Sign1 structure" };
  }

  const [protectedHeaders, unprotectedHeaders, payload, sig] = coseSign1;

  // 2. Extract public key from headers or separate 'key' field
  const publicKeyHex = unprotectedHeaders.get(COSE_KEY_HEADER) || // from headers
                       extractKeyFromSignature(signature);          // or separate
  const publicKey = Buffer.from(publicKeyHex, 'hex');

  // 3. Reconstruct Sig_structure (COSE signing payload)
  const sigStructure = [
    "Signature1",           // Context
    protectedHeaders,       // Protected headers
    Buffer.alloc(0),        // External AAD (empty)
    payload                 // Payload
  ];
  const sigBytes = cbor.encode(sigStructure);

  // 4. Verify Ed25519 signature
  const isValidSignature = await ed25519.verify(
    sig,           // Signature bytes
    sigBytes,      // Data that was signed
    publicKey      // Public key
  );

  if (!isValidSignature) {
    return { valid: false, error: "Invalid Ed25519 signature" };
  }

  // 5. Verify payload matches expected message
  const payloadText = payload.toString('utf8');
  if (payloadText !== message) {
    return { valid: false, error: "Message mismatch" };
  }

  // 6. Derive stake address from public key and verify
  const derivedStakeAddress = await deriveStakeAddress(publicKey, networkId);
  if (derivedStakeAddress !== stakeAddress) {
    return { valid: false, error: "Stake address mismatch" };
  }

  return { valid: true };
}
```

### 4.2 Nonce Management

**Nonce Requirements:**
- Unique per authentication attempt
- Single-use only (prevent replay)
- Time-bound expiration
- Cryptographically random

**Database Schema (Existing):**
```typescript
walletSignatures: {
  _id: Id,
  stakeAddress: string,
  nonce: string,           // Unique nonce
  signature: string,       // Filled after verification
  walletName: string,
  verified: boolean,       // True only after successful verification
  expiresAt: number,       // Timestamp
  createdAt: number,
  usedAt?: number          // NEW: Track when nonce was consumed
}
```

**Nonce Validation:**
```typescript
async function validateNonce(nonce: string): Promise<NonceValidation> {
  const record = await db.query('walletSignatures')
    .withIndex('by_nonce', q => q.eq('nonce', nonce))
    .first();

  if (!record) {
    return { valid: false, error: 'Nonce not found' };
  }

  if (record.verified) {
    return { valid: false, error: 'Nonce already used' };
  }

  if (Date.now() > record.expiresAt) {
    return { valid: false, error: 'Nonce expired' };
  }

  // Additional check: Nonce age (should not be too old even if not expired)
  const nonceAge = Date.now() - record.createdAt;
  const MAX_NONCE_AGE = 5 * 60 * 1000; // 5 minutes

  if (nonceAge > MAX_NONCE_AGE) {
    return { valid: false, error: 'Nonce too old' };
  }

  return { valid: true, record };
}
```

### 4.3 Rate Limiting

**Multi-Layer Rate Limiting:**

**Layer 1: Nonce Generation**
```typescript
// Per stake address
const NONCE_RATE_LIMIT = {
  perAddress: {
    requests: 5,      // 5 nonce requests
    window: 60000     // per 1 minute
  }
};

async function rateLimitNonceGeneration(stakeAddress: string): Promise<boolean> {
  const recentNonces = await db.query('walletSignatures')
    .withIndex('by_stake_address', q => q.eq('stakeAddress', stakeAddress))
    .filter(q => q.gt(q.field('createdAt'), Date.now() - 60000))
    .collect();

  if (recentNonces.length >= 5) {
    await logSecurityEvent('RATE_LIMIT_NONCE', {
      stakeAddress,
      attempts: recentNonces.length
    });
    return false; // Rate limit hit
  }

  return true; // OK to generate
}
```

**Layer 2: Signature Verification**
```typescript
const VERIFICATION_RATE_LIMIT = {
  perAddress: {
    requests: 10,     // 10 verification attempts
    window: 60000     // per 1 minute
  },
  perIP: {
    requests: 20,     // 20 attempts from same IP
    window: 60000     // per 1 minute
  }
};

// Track failed attempts separately
const FAILED_ATTEMPT_LIMIT = {
  perAddress: {
    failures: 3,      // 3 failed attempts
    window: 300000,   // in 5 minutes
    lockout: 900000   // = 15 minute lockout
  }
};
```

**Layer 3: IP-Based Protection**
```typescript
// Detect distributed attacks
const GLOBAL_RATE_LIMIT = {
  requests: 100,      // 100 total verification requests
  window: 60000       // per 1 minute globally
};

async function checkGlobalRateLimit(): Promise<boolean> {
  const recentAttempts = await db.query('auditLogs')
    .withIndex('by_type', q => q.eq('type', 'WALLET_CONNECTION'))
    .filter(q => q.gt(q.field('timestamp'), Date.now() - 60000))
    .collect();

  if (recentAttempts.length >= 100) {
    // Potential DDoS - alert and block
    await alertSecurityTeam('GLOBAL_RATE_LIMIT_HIT', {
      attempts: recentAttempts.length,
      window: '1 minute'
    });
    return false;
  }

  return true;
}
```

### 4.4 Signature Binding

**Bind Signatures to Specific Context:**
```typescript
interface SignatureContext {
  action: 'authenticate' | 'transaction' | 'message';
  timestamp: number;
  nonce: string;
  application: string;
  version: string;
  metadata?: Record<string, any>;
}

function createSignatureMessage(context: SignatureContext): string {
  return `
${context.application} - ${context.action}

Nonce: ${context.nonce}
Timestamp: ${new Date(context.timestamp).toISOString()}
Version: ${context.version}

By signing this message, you confirm you want to ${context.action} with this application.

This signature is only valid for this specific action and cannot be reused.
  `.trim();
}

// Verify message structure matches expected context
function validateMessageStructure(
  message: string,
  expectedContext: SignatureContext
): boolean {
  return message.includes(expectedContext.nonce) &&
         message.includes(expectedContext.application) &&
         message.includes(expectedContext.action) &&
         message.includes(new Date(expectedContext.timestamp).toISOString());
}
```

---

## 5. Session Management

### 5.1 Session Architecture

**Session Lifecycle:**
```
Connection → Authentication → Session Creation → Token Issuance → Session Refresh → Expiration
```

**Database Schema (Recommended Addition):**
```typescript
walletSessions: {
  _id: Id,
  stakeAddress: string,
  sessionToken: string,       // JWT or random token
  refreshToken: string,       // For token renewal
  deviceFingerprint: string,  // Browser fingerprint
  platform: 'desktop' | 'mobile-ios' | 'mobile-android',
  walletName: string,
  ipAddress: string,
  userAgent: string,
  createdAt: number,
  expiresAt: number,
  lastActivity: number,
  isActive: boolean,
  revokedAt?: number,
  metadata: {
    loginCount: number,
    lastIP: string,
    suspicious: boolean
  }
}
```

### 5.2 Token Strategy

**Access Token (Short-lived):**
- Duration: 1 hour
- Stored: Client-side (memory or httpOnly cookie)
- Contains: Stake address, wallet name, permissions
- Refreshable: Yes, using refresh token

**Refresh Token (Long-lived):**
- Duration: 7 days (mobile), 30 days (desktop)
- Stored: Database + httpOnly cookie
- Rotation: New refresh token on each use
- Revocable: Yes, stored in database

**Implementation:**
```typescript
interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

async function createSession(
  stakeAddress: string,
  walletName: string,
  platform: PlatformContext
): Promise<SessionTokens> {

  const deviceFingerprint = await generateDeviceFingerprint();

  // Create access token (JWT)
  const accessToken = jwt.sign(
    {
      sub: stakeAddress,
      wallet: walletName,
      platform: platform.type,
      type: 'access'
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Create refresh token (random)
  const refreshToken = await generateSecureToken();

  // Store session in database
  await db.insert('walletSessions', {
    stakeAddress,
    sessionToken: hashToken(accessToken),
    refreshToken: hashToken(refreshToken),
    deviceFingerprint,
    platform: platform.type,
    walletName,
    ipAddress: getCurrentIP(),
    userAgent: navigator.userAgent,
    createdAt: Date.now(),
    expiresAt: Date.now() + (platform.type === 'desktop' ? 30 : 7) * 24 * 60 * 60 * 1000,
    lastActivity: Date.now(),
    isActive: true,
    metadata: {
      loginCount: 1,
      lastIP: getCurrentIP(),
      suspicious: false
    }
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: 3600, // 1 hour in seconds
    tokenType: 'Bearer'
  };
}
```

### 5.3 Session Persistence Across Page Refreshes

**Challenge:** Mobile wallets may lose injection on page refresh.

**Solution: Multi-Layer Persistence**

**Layer 1: Session Token in httpOnly Cookie**
```typescript
// On successful authentication
res.cookie('session_token', accessToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 3600000 // 1 hour
});

res.cookie('refresh_token', refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 3600000 // 7 days for mobile
});
```

**Layer 2: Client-Side Session Check**
```typescript
async function restoreSession(): Promise<SessionInfo | null> {
  try {
    // Check if session exists on server
    const response = await fetch('/api/wallet/check-session', {
      credentials: 'include' // Include cookies
    });

    if (response.ok) {
      const session = await response.json();
      return {
        stakeAddress: session.stakeAddress,
        walletName: session.walletName,
        authenticated: true
      };
    }
  } catch (error) {
    console.error('Session restoration failed:', error);
  }

  return null;
}

// On app mount
useEffect(() => {
  restoreSession().then(session => {
    if (session) {
      setWalletConnected(session);
    }
  });
}, []);
```

**Layer 3: Auto-Refresh Mechanism**
```typescript
// Token refresh loop
function setupTokenRefresh(expiresIn: number) {
  // Refresh 5 minutes before expiration
  const refreshTime = (expiresIn - 300) * 1000;

  setTimeout(async () => {
    try {
      const response = await fetch('/api/wallet/refresh-token', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const { expiresIn: newExpiresIn } = await response.json();
        setupTokenRefresh(newExpiresIn);
      } else {
        // Refresh failed - logout
        handleSessionExpired();
      }
    } catch (error) {
      handleSessionExpired();
    }
  }, refreshTime);
}
```

### 5.4 Device Fingerprinting

**Purpose:** Detect session hijacking and suspicious activity.

**Fingerprint Components:**
```typescript
interface DeviceFingerprint {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  touchSupport: boolean;
  hash: string; // Combined hash of above
}

async function generateDeviceFingerprint(): Promise<string> {
  const components = {
    browser: detectBrowser(),
    browserVersion: detectBrowserVersion(),
    os: detectOS(),
    osVersion: detectOSVersion(),
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    touchSupport: 'ontouchstart' in window
  };

  // Create hash
  const fingerprint = await hashObject(components);
  return fingerprint;
}

// On session validation
async function validateDeviceFingerprint(
  sessionId: string,
  currentFingerprint: string
): Promise<boolean> {
  const session = await db.get(sessionId);

  if (session.deviceFingerprint !== currentFingerprint) {
    // Fingerprint mismatch - potential session hijacking
    await logSecurityEvent('FINGERPRINT_MISMATCH', {
      sessionId,
      expected: session.deviceFingerprint,
      actual: currentFingerprint,
      stakeAddress: session.stakeAddress
    });

    // Allow but mark as suspicious
    await db.patch(sessionId, {
      metadata: {
        ...session.metadata,
        suspicious: true
      }
    });

    return false; // Suspicious but not blocking
  }

  return true;
}
```

---

## 6. Implementation Recommendations

### 6.1 Phased Implementation Approach

**Phase 1: Core Cryptographic Verification (Week 1-2)**
- [ ] Implement COSE_Sign1 parser using `@emurgo/cardano-serialization-lib`
- [ ] Add Ed25519 signature verification
- [ ] Implement public key extraction
- [ ] Add stake address derivation and matching
- [ ] Create unit tests for each component
- [ ] Test with desktop wallets (Nami, Eternl, Flint)

**Phase 2: Platform-Specific Handling (Week 3)**
- [ ] Implement platform detection logic
- [ ] Create verification strategy pattern
- [ ] Add iOS-specific signature handling
- [ ] Add Android-specific handling
- [ ] Test with mobile wallets on real devices

**Phase 3: Security Hardening (Week 4)**
- [ ] Implement rate limiting at all layers
- [ ] Add device fingerprinting
- [ ] Create audit logging system
- [ ] Add suspicious activity detection
- [ ] Implement lockout mechanisms

**Phase 4: Session Management (Week 5)**
- [ ] Implement JWT token system
- [ ] Add refresh token rotation
- [ ] Create session persistence
- [ ] Add auto-refresh mechanism
- [ ] Test session restoration on mobile

**Phase 5: Testing & Monitoring (Week 6)**
- [ ] Comprehensive integration testing
- [ ] Security penetration testing
- [ ] Performance testing under load
- [ ] Add monitoring dashboards
- [ ] Create incident response procedures

### 6.2 Library Recommendations

**Core Cryptography:**
```typescript
// Option 1: Cardano Serialization Lib (Official)
import * as CSL from '@emurgo/cardano-serialization-lib-browser'; // Desktop
import * as CSLNode from '@emurgo/cardano-serialization-lib-nodejs'; // Server

// Option 2: Cardano Message Signing (CIP-8/30 specific)
import { COSESign1, COSEKey } from '@emurgo/cardano-message-signing-browser';

// Option 3: Lucid (Higher-level abstraction)
import { Lucid, Blockfrost } from 'lucid-cardano';
```

**Recommended Stack:**
```json
{
  "dependencies": {
    "@emurgo/cardano-serialization-lib-browser": "^11.5.0",
    "@emurgo/cardano-serialization-lib-nodejs": "^11.5.0",
    "@emurgo/cardano-message-signing-browser": "^1.0.3",
    "jsonwebtoken": "^9.0.2",
    "cbor": "^9.0.1",
    "tweetnacl": "^1.0.3",
    "@peculiar/webcrypto": "^1.4.3"
  }
}
```

### 6.3 Code Architecture

**Recommended Project Structure:**
```
convex/
  actions/
    verification/
      verifyCardanoSignature.ts       # Main verification action
      strategies/
        DesktopStrategy.ts             # Desktop verification
        IOSMobileStrategy.ts           # iOS-specific
        AndroidMobileStrategy.ts       # Android-specific
        BaseStrategy.ts                # Shared logic
      utils/
        coseParser.ts                  # COSE_Sign1 parsing
        ed25519.ts                     # Signature verification
        addressDerivation.ts           # Key to address
        platformDetection.ts           # Platform detection

  security/
    rateLimit.ts                       # Rate limiting logic
    deviceFingerprint.ts               # Fingerprinting
    auditLog.ts                        # Security event logging

  session/
    sessionManager.ts                  # Session CRUD
    tokenManager.ts                    # JWT operations
    refreshTokenRotation.ts            # Token renewal

src/
  lib/
    walletVerification/
      client.ts                        # Client-side verification API
      sessionPersistence.ts            # Session restoration
      platformDetection.ts             # Browser-side detection
```

### 6.4 Testing Strategy

**Unit Tests:**
```typescript
describe('COSE_Sign1 Parser', () => {
  it('should parse valid COSE_Sign1 structure', async () => {
    const validSignature = '84...'; // Real signature hex
    const parsed = await parseCOSE_Sign1(validSignature);
    expect(parsed).toHaveProperty('payload');
    expect(parsed).toHaveProperty('signature');
  });

  it('should reject invalid CBOR', async () => {
    const invalidSignature = 'notvalidhex';
    await expect(parseCOSE_Sign1(invalidSignature)).rejects.toThrow();
  });
});

describe('Ed25519 Verification', () => {
  it('should verify valid Ed25519 signature', async () => {
    const publicKey = Buffer.from('...', 'hex');
    const message = Buffer.from('test message');
    const signature = await ed25519.sign(message, privateKey);

    const isValid = await verifyEd25519(message, signature, publicKey);
    expect(isValid).toBe(true);
  });
});

describe('Address Derivation', () => {
  it('should derive correct stake address from public key', async () => {
    const publicKey = Buffer.from('...', 'hex');
    const expectedAddress = 'stake1...';

    const derived = await deriveStakeAddress(publicKey, 1); // Mainnet
    expect(derived).toBe(expectedAddress);
  });
});
```

**Integration Tests:**
```typescript
describe('Mobile Wallet Verification Flow', () => {
  it('should verify iOS Eternl signature', async () => {
    const mockSignature = {
      signature: '84...', // Real iOS Eternl signature
      key: '...',
      stakeAddress: 'stake1...'
    };

    const result = await verifySignature({
      ...mockSignature,
      nonce: testNonce,
      walletName: 'eternl',
      userAgent: 'iOS Safari...'
    });

    expect(result.valid).toBe(true);
  });

  it('should handle rate limiting correctly', async () => {
    // Generate 6 nonces rapidly
    for (let i = 0; i < 6; i++) {
      await generateNonce(testAddress, 'eternl');
    }

    // 7th should be rate limited
    await expect(
      generateNonce(testAddress, 'eternl')
    ).rejects.toThrow('Rate limit exceeded');
  });
});
```

**End-to-End Tests (Playwright):**
```typescript
test('Mobile wallet connection on iOS', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'iOS Safari only');

  await page.goto('http://localhost:3100');

  // Click mobile wallet button
  await page.click('[data-testid="eternl-mobile-button"]');

  // Mock deep link return with signature
  await page.evaluate(() => {
    window.cardano = {
      eternl: {
        enable: async () => ({
          signData: async (addr, payload) => ({
            signature: mockIOSSignature,
            key: mockPublicKey
          })
        })
      }
    };
  });

  // Wait for connection
  await page.waitForSelector('[data-testid="wallet-connected"]');

  // Verify session persists on refresh
  await page.reload();
  await page.waitForSelector('[data-testid="wallet-connected"]');
});
```

---

## 7. Attack Vectors & Mitigations

### 7.1 Identified Attack Vectors

#### Attack 1: Signature Replay Attack

**Description:** Attacker intercepts a valid signature and reuses it for unauthorized access.

**Current Vulnerability:** Nonces can potentially be reused if verification doesn't properly mark them as consumed.

**Mitigation:**
```typescript
// Atomic nonce consumption
async function consumeNonce(nonce: string): Promise<boolean> {
  const record = await db.query('walletSignatures')
    .withIndex('by_nonce', q => q.eq('nonce', nonce))
    .first();

  if (!record || record.verified) {
    return false; // Already used or not found
  }

  // Atomic update - mark as verified and used
  await db.patch(record._id, {
    verified: true,
    usedAt: Date.now()
  });

  return true;
}

// In verification flow
const nonceConsumed = await consumeNonce(args.nonce);
if (!nonceConsumed) {
  return { valid: false, error: 'Nonce already used or invalid' };
}
```

**Additional Protection:**
- Timestamp validation (reject old signatures)
- Bind signature to specific action/context
- Short nonce expiration (5 minutes max)

#### Attack 2: Man-in-the-Middle (MITM)

**Description:** Attacker intercepts signature request and modifies message content.

**Current Vulnerability:** No verification that signed message matches expected format.

**Mitigation:**
```typescript
// Strict message format validation
function validateSignedMessage(
  message: string,
  expectedNonce: string,
  expectedTimestamp: number
): boolean {
  const messagePattern = /^Please sign this message to verify ownership.*Nonce: (.+).*Timestamp: (.+)$/s;
  const match = message.match(messagePattern);

  if (!match) return false;

  const [_, nonce, timestamp] = match;

  // Verify nonce matches
  if (nonce !== expectedNonce) return false;

  // Verify timestamp is within acceptable range (±2 minutes)
  const messageTime = new Date(timestamp).getTime();
  const timeDiff = Math.abs(messageTime - expectedTimestamp);

  if (timeDiff > 120000) return false; // 2 minutes

  return true;
}
```

**Additional Protection:**
- HTTPS only (enforce TLS)
- Content Security Policy (CSP)
- Subresource Integrity (SRI)

#### Attack 3: Session Hijacking

**Description:** Attacker steals session token and impersonates user.

**Current Vulnerability:** No device fingerprinting or anomaly detection.

**Mitigation:**
```typescript
// Session validation with fingerprint check
async function validateSession(
  sessionToken: string,
  currentFingerprint: string,
  currentIP: string
): Promise<SessionValidation> {
  const session = await db.query('walletSessions')
    .withIndex('by_token', q => q.eq('sessionToken', hashToken(sessionToken)))
    .first();

  if (!session || !session.isActive) {
    return { valid: false, error: 'Invalid session' };
  }

  // Check expiration
  if (Date.now() > session.expiresAt) {
    await db.patch(session._id, { isActive: false });
    return { valid: false, error: 'Session expired' };
  }

  // Fingerprint check
  if (session.deviceFingerprint !== currentFingerprint) {
    await logSecurityEvent('SUSPICIOUS_SESSION', {
      sessionId: session._id,
      reason: 'Fingerprint mismatch'
    });
    // Don't block, but flag as suspicious
    await db.patch(session._id, {
      metadata: { ...session.metadata, suspicious: true }
    });
  }

  // IP change detection
  if (session.ipAddress !== currentIP) {
    const ipDistance = await getIPDistance(session.ipAddress, currentIP);
    if (ipDistance > 1000) { // km
      await logSecurityEvent('SUSPICIOUS_SESSION', {
        sessionId: session._id,
        reason: 'Significant IP change',
        distance: ipDistance
      });
      // Could require re-authentication for high-risk actions
    }
  }

  // Update last activity
  await db.patch(session._id, {
    lastActivity: Date.now()
  });

  return { valid: true, session };
}
```

**Additional Protection:**
- httpOnly, secure, sameSite cookies
- Short session durations
- Require re-authentication for sensitive operations

#### Attack 4: Brute Force / Credential Stuffing

**Description:** Automated attacks trying multiple wallet addresses.

**Current Vulnerability:** No comprehensive rate limiting.

**Mitigation:**
```typescript
// Multi-layer rate limiting
class RateLimiter {
  private limits = {
    noncePerAddress: { count: 5, window: 60000 },
    verifyPerAddress: { count: 10, window: 60000 },
    verifyPerIP: { count: 20, window: 60000 },
    failedPerAddress: { count: 3, window: 300000, lockout: 900000 }
  };

  async checkLimit(
    type: string,
    identifier: string
  ): Promise<RateLimitResult> {
    const limit = this.limits[type];
    const key = `${type}:${identifier}`;

    // Get recent attempts
    const attempts = await this.getRecentAttempts(key, limit.window);

    if (attempts.length >= limit.count) {
      // Check for lockout
      if (type === 'failedPerAddress' && limit.lockout) {
        const lockoutUntil = attempts[0].timestamp + limit.lockout;
        if (Date.now() < lockoutUntil) {
          return {
            allowed: false,
            error: 'Account temporarily locked',
            retryAfter: lockoutUntil
          };
        }
      }

      return {
        allowed: false,
        error: 'Rate limit exceeded',
        retryAfter: attempts[0].timestamp + limit.window
      };
    }

    // Record attempt
    await this.recordAttempt(key);

    return { allowed: true };
  }
}
```

**Additional Protection:**
- CAPTCHA after failed attempts
- Progressive delays (exponential backoff)
- IP blocking for egregious abuse

#### Attack 5: Address Spoofing

**Description:** Attacker provides signature from different address than claimed.

**Current Vulnerability:** Simplified verification doesn't derive and check address.

**Mitigation:**
```typescript
// Always derive and verify address
async function verifyAddressOwnership(
  publicKey: Buffer,
  claimedStakeAddress: string,
  networkId: number
): Promise<boolean> {
  // Derive stake address from public key
  const derivedAddress = await deriveStakeAddress(publicKey, networkId);

  // Compare with claimed address
  if (derivedAddress !== claimedStakeAddress) {
    await logSecurityEvent('ADDRESS_SPOOF_ATTEMPT', {
      claimed: claimedStakeAddress,
      derived: derivedAddress,
      publicKey: publicKey.toString('hex')
    });
    return false;
  }

  return true;
}
```

### 7.2 Security Checklist

**Pre-Production Security Requirements:**

- [ ] Full cryptographic signature verification implemented
- [ ] COSE_Sign1 structure validation
- [ ] Ed25519 signature verification with public key
- [ ] Stake address derivation and matching
- [ ] Nonce single-use enforcement (atomic consumption)
- [ ] Timestamp validation (reject old signatures)
- [ ] Message format validation
- [ ] Rate limiting at all layers (nonce, verify, IP, global)
- [ ] Failed attempt tracking and lockout
- [ ] Device fingerprinting
- [ ] Session token security (httpOnly, secure, sameSite)
- [ ] Refresh token rotation
- [ ] Session expiration enforcement
- [ ] Suspicious activity detection
- [ ] Comprehensive audit logging
- [ ] Security event alerting
- [ ] HTTPS enforced (redirect HTTP → HTTPS)
- [ ] CSP headers configured
- [ ] XSS protection headers
- [ ] CSRF protection (SameSite cookies)
- [ ] Input validation and sanitization
- [ ] SQL injection prevention (using Convex ORM properly)
- [ ] Secrets management (env vars, not hardcoded)
- [ ] Security incident response plan documented
- [ ] Regular security audits scheduled
- [ ] Penetration testing completed
- [ ] Monitoring dashboards active
- [ ] Alerting configured for anomalies

---

## 8. Testing Strategy

### 8.1 Test Scenarios

#### Desktop Wallet Tests

**Test 1: Standard Desktop Flow (Nami)**
```typescript
test('Desktop Nami wallet signature verification', async () => {
  // 1. Generate nonce
  const { nonce, message } = await generateNonce('stake1...', 'nami');

  // 2. Sign with Nami (mocked)
  const signature = await mockNamiSignature(message);

  // 3. Verify signature
  const result = await verifySignature({
    stakeAddress: 'stake1...',
    nonce,
    signature: signature.signature,
    walletName: 'nami'
  });

  expect(result.valid).toBe(true);
  expect(result.verified).toBe(true);
});
```

**Test 2: Desktop Eternl (ccvault alias)**
```typescript
test('Desktop Eternl with ccvault name', async () => {
  // Eternl is available as both 'eternl' and 'ccvault'
  const signature = await mockEternlSignature(message);

  const result = await verifySignature({
    stakeAddress: 'stake1...',
    nonce,
    signature: signature.signature,
    walletName: 'ccvault' // Alias
  });

  expect(result.valid).toBe(true);
});
```

#### Mobile Wallet Tests

**Test 3: iOS Eternl Mobile**
```typescript
test('iOS Eternl mobile signature', async () => {
  // Mock iOS user agent
  mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) ...');

  const { nonce, message } = await generateNonce('stake1...', 'eternl');

  // iOS Eternl may wrap signature differently
  const signature = await mockIOSEternlSignature(message);

  const result = await verifySignature({
    stakeAddress: 'stake1...',
    nonce,
    signature: signature.signature,
    walletName: 'eternl'
  });

  expect(result.valid).toBe(true);
  expect(result.platform).toBe('mobile-ios');
});
```

**Test 4: Android Flint Mobile**
```typescript
test('Android Flint mobile signature', async () => {
  mockUserAgent('Mozilla/5.0 (Linux; Android 12; ...) ...');

  const signature = await mockAndroidFlintSignature(message);

  const result = await verifySignature({
    stakeAddress: 'stake1...',
    nonce,
    signature: signature.signature,
    walletName: 'flint'
  });

  expect(result.valid).toBe(true);
  expect(result.platform).toBe('mobile-android');
});
```

#### Security Tests

**Test 5: Replay Attack Prevention**
```typescript
test('Should reject reused nonce', async () => {
  const { nonce, message } = await generateNonce('stake1...', 'nami');
  const signature = await mockNamiSignature(message);

  // First verification succeeds
  const result1 = await verifySignature({ stakeAddress: 'stake1...', nonce, signature: signature.signature, walletName: 'nami' });
  expect(result1.valid).toBe(true);

  // Second verification with same nonce fails
  const result2 = await verifySignature({ stakeAddress: 'stake1...', nonce, signature: signature.signature, walletName: 'nami' });
  expect(result2.valid).toBe(false);
  expect(result2.error).toContain('already used');
});
```

**Test 6: Expired Nonce**
```typescript
test('Should reject expired nonce', async () => {
  const { nonce } = await generateNonce('stake1...', 'nami');

  // Fast-forward time by 6 minutes (beyond 5 minute limit)
  jest.advanceTimersByTime(6 * 60 * 1000);

  const result = await verifySignature({ stakeAddress: 'stake1...', nonce, signature: mockSignature, walletName: 'nami' });
  expect(result.valid).toBe(false);
  expect(result.error).toContain('expired');
});
```

**Test 7: Rate Limiting**
```typescript
test('Should enforce rate limits', async () => {
  const address = 'stake1test...';

  // Generate 5 nonces (at limit)
  for (let i = 0; i < 5; i++) {
    await generateNonce(address, 'nami');
  }

  // 6th should be rejected
  await expect(generateNonce(address, 'nami'))
    .rejects.toThrow('Rate limit exceeded');
});
```

**Test 8: Address Spoofing Detection**
```typescript
test('Should detect address mismatch', async () => {
  const { nonce, message } = await generateNonce('stake1_real...', 'nami');

  // Sign with different wallet
  const signature = await signWithDifferentWallet(message);

  const result = await verifySignature({
    stakeAddress: 'stake1_real...',  // Claimed address
    nonce,
    signature: signature.signature,
    walletName: 'nami'
  });

  expect(result.valid).toBe(false);
  expect(result.error).toContain('address mismatch');
});
```

#### Session Management Tests

**Test 9: Session Persistence**
```typescript
test('Session persists across page refresh', async () => {
  // Login and get session
  const session = await login('stake1...', mockSignature);

  // Simulate page refresh (new request)
  const restored = await restoreSession(session.accessToken);

  expect(restored).toBeTruthy();
  expect(restored.stakeAddress).toBe('stake1...');
});
```

**Test 10: Token Refresh**
```typescript
test('Should refresh expired access token', async () => {
  const { accessToken, refreshToken } = await createSession('stake1...', 'nami');

  // Fast-forward past access token expiration
  jest.advanceTimersByTime(61 * 60 * 1000); // 61 minutes

  // Access token should be invalid
  await expect(validateAccessToken(accessToken)).rejects.toThrow();

  // Refresh should work
  const newTokens = await refreshAccessToken(refreshToken);
  expect(newTokens.accessToken).toBeTruthy();
  expect(newTokens.accessToken).not.toBe(accessToken);
});
```

### 8.2 Load Testing

**Concurrent Users Test:**
```typescript
import { check } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Ramp to 100 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
};

export default function () {
  // Generate nonce
  let nonceRes = http.post('https://api.example.com/wallet/generate-nonce', JSON.stringify({
    stakeAddress: `stake1test${__VU}...`,
    walletName: 'nami'
  }), { headers: { 'Content-Type': 'application/json' } });

  check(nonceRes, {
    'nonce generated': (r) => r.status === 200,
  });

  // Verify signature
  let verifyRes = http.post('https://api.example.com/wallet/verify-signature', JSON.stringify({
    stakeAddress: `stake1test${__VU}...`,
    nonce: JSON.parse(nonceRes.body).nonce,
    signature: mockSignature,
    walletName: 'nami'
  }), { headers: { 'Content-Type': 'application/json' } });

  check(verifyRes, {
    'signature verified': (r) => r.status === 200,
  });
}
```

---

## 9. Monitoring & Observability

### 9.1 Key Metrics to Track

**Authentication Metrics:**
- Nonce generation rate (per minute)
- Signature verification attempts (total, success, failure)
- Verification latency (p50, p95, p99)
- Platform distribution (desktop vs mobile-ios vs mobile-android)
- Wallet distribution (nami, eternl, flint, etc.)

**Security Metrics:**
- Rate limit hits (per address, per IP, global)
- Failed verification attempts
- Nonce reuse attempts
- Expired nonce usage
- Address spoofing attempts
- Session hijacking indicators (fingerprint mismatches, IP changes)
- Locked accounts

**Session Metrics:**
- Active sessions (total, by platform)
- Session duration (average, median)
- Session creation rate
- Token refresh rate
- Session expiration rate

### 9.2 Alerting Rules

**Critical Alerts (Immediate Response):**
```typescript
const CRITICAL_ALERTS = {
  'GLOBAL_RATE_LIMIT_HIT': {
    threshold: 100,
    window: 60000,
    action: 'Enable DDoS protection'
  },
  'MASS_FAILED_VERIFICATIONS': {
    threshold: 50,
    window: 300000,
    action: 'Investigate attack'
  },
  'ADDRESS_SPOOF_ATTEMPTS': {
    threshold: 10,
    window: 300000,
    action: 'Review security logs'
  }
};
```

**Warning Alerts (Review Within Hour):**
```typescript
const WARNING_ALERTS = {
  'HIGH_FAILURE_RATE': {
    threshold: 0.2, // 20% failure rate
    window: 600000,
    action: 'Check for integration issues'
  },
  'UNUSUAL_PLATFORM_DISTRIBUTION': {
    threshold: 0.5, // 50% change in platform mix
    window: 3600000,
    action: 'Investigate anomaly'
  }
};
```

### 9.3 Dashboard Recommendations

**Real-Time Dashboard:**
- Current active sessions (by platform)
- Verification attempts (last 5 minutes)
- Success/failure rate
- Rate limit hits
- Security events (last hour)

**Historical Dashboard:**
- Daily active wallets
- Platform trends over time
- Verification latency trends
- Security incident timeline

---

## 10. Migration Path from Current Implementation

### 10.1 Backward Compatibility Strategy

**Approach: Gradual Rollout with Feature Flag**

```typescript
// Feature flag for cryptographic verification
const ENABLE_FULL_CRYPTO_VERIFICATION =
  process.env.ENABLE_FULL_CRYPTO_VERIFICATION === 'true';

async function verifySignature(args: VerificationArgs): Promise<VerificationResult> {
  if (ENABLE_FULL_CRYPTO_VERIFICATION) {
    // New: Full cryptographic verification
    return await fullCryptographicVerification(args);
  } else {
    // Current: Simplified verification
    return await simplifiedVerification(args);
  }
}
```

**Rollout Phases:**

**Phase 1: Parallel Testing (Week 1-2)**
- Deploy full verification alongside simplified
- Run both verifications in parallel
- Log discrepancies
- 100% traffic still uses simplified
- Monitor for any differences

**Phase 2: Canary Deployment (Week 3)**
- Route 5% of traffic to full verification
- Monitor error rates and latency
- Compare success rates
- Increase to 25% if stable

**Phase 3: Progressive Rollout (Week 4-5)**
- Increase to 50% traffic
- Monitor for platform-specific issues
- Increase to 75% traffic
- Monitor performance under load

**Phase 4: Full Migration (Week 6)**
- Route 100% traffic to full verification
- Deprecate simplified verification
- Remove feature flag
- Update documentation

### 10.2 Fallback Strategy

**If Issues Arise:**
```typescript
// Automatic fallback on errors
async function verifyWithFallback(args: VerificationArgs): Promise<VerificationResult> {
  try {
    // Attempt full verification
    const result = await fullCryptographicVerification(args);
    return result;
  } catch (error) {
    // Log error
    await logVerificationError('FULL_VERIFICATION_FAILED', error, args);

    // Alert team
    await alertSecurityTeam('Verification fallback triggered', { error });

    // Fallback to simplified (temporary)
    return await simplifiedVerification(args);
  }
}
```

---

## 11. Conclusion

This architecture provides a comprehensive roadmap for implementing production-grade wallet verification for both mobile and desktop Cardano wallets. Key takeaways:

**Critical Success Factors:**
1. Full cryptographic verification using Ed25519 and COSE_Sign1
2. Platform-specific handling for mobile wallets (iOS/Android)
3. Comprehensive security measures (rate limiting, nonce management, session security)
4. Robust session persistence for mobile environments
5. Thorough testing across all platforms and wallets

**Timeline Estimate:**
- Implementation: 6 weeks
- Testing: 2 weeks
- Rollout: 2 weeks
- **Total: 10 weeks to production-ready**

**Next Steps:**
1. Review and approve architecture
2. Prioritize implementation phases
3. Set up development environment with required libraries
4. Begin Phase 1: Core Cryptographic Verification
5. Establish monitoring and alerting infrastructure

**Questions for Stakeholder Review:**
1. Is 6-week implementation timeline acceptable?
2. Should we prioritize mobile or desktop verification first?
3. What is acceptable downtime for security updates?
4. Do we need third-party security audit before production?
5. What is the budget for monitoring/alerting tools?

---

**Document Version:** 1.0
**Last Updated:** October 2, 2025
**Author:** Claude Code (Blockchain Architecture Specialist)
**Status:** Ready for Review
