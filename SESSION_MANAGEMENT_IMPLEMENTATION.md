# Session Management & Mobile Wallet Tracking Implementation

## Overview
Implemented comprehensive session management and mobile wallet tracking in Convex with rate limiting protection.

## Files Modified

### 1. `/convex/schema.ts`
**Changes:**
- **Users Table** - Added session management fields:
  - `lastWalletType` - Track which wallet was last used (eternl, nami, etc.)
  - `lastConnectionPlatform` - Platform detection (mobile_ios, mobile_android, mobile_web, desktop)
  - `lastConnectionTime` - Timestamp of last connection
  - `activeSessionId` - Current active session identifier
  - `sessionExpiresAt` - Session expiration timestamp
  - `preferredWallet` - User's preferred wallet for auto-connect
  - `totalConnectionCount` - Total connection count for analytics

- **WalletSignatures Table** - Added platform tracking:
  - `platform` - Connection platform (mobile_ios, mobile_android, mobile_web, desktop)
  - `deviceInfo` - Optional device details object:
    - `userAgent` - Browser user agent string
    - `screenWidth` - Screen width in pixels
    - `screenHeight` - Screen height in pixels
    - `deviceType` - Device type (phone, tablet, desktop)
    - `os` - Operating system (iOS, Android, Windows, macOS, Linux)

- **WalletRateLimits Table** - NEW table for rate limiting:
  - `stakeAddress` - Wallet address being rate limited
  - `actionType` - Type of action (nonce_generation, signature_verification)
  - `attemptCount` - Number of attempts in current window
  - `windowStart` - Start of rate limit window
  - `consecutiveFailures` - Track consecutive failed attempts
  - `lockedUntil` - Lockout expiration timestamp
  - `lastAttemptAt` - Timestamp of last attempt

**Indexes Added:**
- `users.by_session_id` - Query by session ID
- `users.by_session_expiry` - Query by expiration time
- `walletSignatures.by_platform` - Query by platform
- `walletRateLimits.by_stake_address_action` - Query by wallet and action type
- `walletRateLimits.by_locked_until` - Query locked out wallets

### 2. `/convex/walletSession.ts` - NEW FILE
**Session Management Functions:**

#### Mutations:
- `connectWalletEnhanced` - Enhanced wallet connection with session tracking
  - Detects platform from user agent
  - Creates/updates user with session info
  - Mobile sessions: 7 days duration
  - Desktop sessions: 24 hours duration
  - Returns session ID and expiration

- `disconnectWalletEnhanced` - Clean disconnect with session cleanup
  - Validates session ID
  - Clears session data

- `refreshSession` - Extend active session
  - Validates session ID
  - Extends expiration based on platform

- `cleanupExpiredSessions` - Remove expired sessions (for cron)
  - Finds users with expired sessions
  - Clears session data

- `updatePreferredWallet` - Update user's preferred wallet
  - Sets preferred wallet for auto-connect

#### Queries:
- `validateSession` - Check if session is valid
  - Verifies session ID match
  - Checks expiration
  - Returns session details

- `getWalletConnectionState` - Get current connection state
  - Returns comprehensive connection info
  - Includes session validity, platform, wallet type

### 3. `/convex/walletAuthentication.ts`
**Rate Limiting Implementation:**

#### Configuration:
- **Nonce Generation Rate Limit:**
  - Max 5 attempts per hour
  - Prevents spam nonce requests

- **Signature Verification Rate Limit:**
  - Max 10 attempts per hour
  - Prevents brute force attempts

- **Failed Attempts Lockout:**
  - 3 consecutive failures = 1 hour lockout
  - Auto-resets on successful verification

#### Helper Functions:
- `checkRateLimit()` - Check and update rate limits
  - Creates rate limit record on first attempt
  - Resets window when expired
  - Returns lockout status

- `recordFailedAttempt()` - Track failed signature attempts
  - Increments consecutive failures
  - Triggers lockout after 3 failures

- `resetFailedAttempts()` - Clear failures on success
  - Resets consecutive failure counter
  - Removes lockout

#### Updated Functions:
- `generateNonce` - Now checks rate limits before generation
- `verifySignature` - Now checks rate limits and tracks failures
- Added helper mutations:
  - `checkSignatureRateLimit`
  - `recordSignatureFailure`
  - `resetSignatureFailures`
  - `cleanupExpiredLockouts`

### 4. `/convex/testSessionManagement.ts` - NEW FILE
**Testing Functions:**

- `testSchemaBackwardCompatibility` - Verify old data still works
- `testRateLimiting` - Check rate limit status
- `testSessionManagement` - Verify session queries

## Migration Safety

### Backward Compatibility:
✅ **All new fields are optional** - Existing users continue to work
✅ **No breaking changes** - Old wallet connections still function
✅ **Graceful degradation** - Missing session data handled properly

### Data Migration:
- No migration required
- New fields populate on next connection
- Old users get session data on next login

## Security Features

### Rate Limiting:
1. **Nonce Generation:**
   - 5 requests per hour per wallet
   - Prevents DoS attacks

2. **Signature Verification:**
   - 10 attempts per hour per wallet
   - 3 consecutive failures = 1 hour lockout
   - Prevents brute force attacks

3. **Automatic Cleanup:**
   - Expired sessions removed
   - Expired lockouts cleared
   - Rate limit windows reset

### Session Security:
1. **Session ID Validation:**
   - Unique session IDs per connection
   - Session ID must match for disconnect

2. **Expiration:**
   - Mobile: 7 day sessions (convenience)
   - Desktop: 24 hour sessions (security)
   - Automatic expiration checking

3. **Platform Detection:**
   - Accurate platform identification
   - Device fingerprinting support

## Usage Examples

### Connect Wallet with Session:
```typescript
const result = await connectWalletEnhanced({
  stakeAddress: "stake1...",
  walletType: "eternl",
  deviceInfo: {
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  }
});

// Returns:
// {
//   success: true,
//   sessionId: "session-123...",
//   expiresAt: 1234567890,
//   platform: "mobile_ios",
//   isMobile: true,
//   userId: "...",
// }
```

### Validate Session:
```typescript
const validation = await validateSession({
  stakeAddress: "stake1...",
  sessionId: "session-123..."
});

// Returns:
// {
//   valid: true,
//   expiresAt: 1234567890,
//   platform: "mobile_ios",
//   walletType: "eternl"
// }
```

### Check Rate Limit Status:
```typescript
const status = await testRateLimiting({
  stakeAddress: "stake1..."
});

// Returns:
// {
//   stakeAddress: "stake1...",
//   nonceRateLimit: {
//     attemptCount: 2,
//     consecutiveFailures: 0,
//     isLocked: false
//   },
//   signatureRateLimit: { ... }
// }
```

## Recommended Cron Jobs

Add to Convex cron configuration:

```typescript
// Clean up expired sessions every hour
export const cleanupSessions = {
  schedule: "0 * * * *", // Every hour
  handler: cleanupExpiredSessions,
};

// Clean up expired lockouts every 30 minutes
export const cleanupLockouts = {
  schedule: "*/30 * * * *", // Every 30 minutes
  handler: cleanupExpiredLockouts,
};

// Clean up expired signatures daily
export const cleanupSignatures = {
  schedule: "0 2 * * *", // Daily at 2 AM
  handler: cleanupExpiredSignatures,
};
```

## Next Steps

### Frontend Integration:
1. Update wallet connection UI to use `connectWalletEnhanced`
2. Store session ID in localStorage/sessionStorage
3. Validate session on app load
4. Show session expiry warnings
5. Handle rate limit errors in UI

### Mobile Optimization:
1. Detect mobile wallets (Eternl, Vespr, etc.)
2. Implement auto-reconnect with session ID
3. Show platform-specific UI
4. Handle mobile deep links

### Analytics:
1. Track connection patterns by platform
2. Monitor rate limit violations
3. Analyze session durations
4. Device type statistics

### Security Enhancements:
1. Add IP address tracking (optional)
2. Implement suspicious activity detection
3. Add admin dashboard for rate limit management
4. Session revocation capability

## Testing Checklist

- [x] Schema compiles without errors
- [x] All indexes created correctly
- [x] Backward compatibility verified
- [x] Rate limiting logic tested
- [x] Session management functions working
- [ ] Frontend integration testing
- [ ] Mobile wallet testing
- [ ] Rate limit edge cases
- [ ] Session expiration handling

## Notes

- All new fields are optional for backward compatibility
- Session durations can be adjusted via constants
- Rate limits can be tuned based on usage patterns
- Platform detection uses user agent parsing
- Mobile sessions longer for better UX
