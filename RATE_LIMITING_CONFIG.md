# Rate Limiting Configuration

## Overview
Comprehensive rate limiting system to protect wallet authentication endpoints from abuse, spam, and brute force attacks.

## Rate Limit Rules

### 1. Nonce Generation
**Purpose:** Prevent spam creation of authentication nonces

**Limits:**
- **5 requests per hour** per wallet address
- Window: 60 minutes (3,600,000 ms)
- No lockout on exceeding limit
- Window resets after 1 hour

**Error Message:**
```
"Rate limit exceeded. Please try again in X minutes."
```

### 2. Signature Verification
**Purpose:** Prevent brute force signature attacks

**Limits:**
- **10 attempts per hour** per wallet address
- Window: 60 minutes (3,600,000 ms)
- Tracks consecutive failures
- Lockout triggered after 3 consecutive failures

**Error Message:**
```
"Rate limit exceeded. Please try again in X minutes."
```

### 3. Consecutive Failure Lockout
**Purpose:** Block wallets with repeated failed signature attempts

**Limits:**
- **3 consecutive failures** = lockout
- Lockout duration: 1 hour (3,600,000 ms)
- Auto-resets on successful verification
- Cleared when lockout expires

**Error Message:**
```
"Too many failed attempts. Please try again in X minutes."
```

## Database Schema

### walletRateLimits Table
```typescript
{
  stakeAddress: string,          // Wallet being rate limited
  actionType: string,             // "nonce_generation" | "signature_verification"
  attemptCount: number,           // Current attempts in window
  windowStart: number,            // Start timestamp of current window
  consecutiveFailures?: number,   // Failed attempts in a row
  lockedUntil?: number,          // Lockout expiration (if locked)
  lastAttemptAt: number,         // Last attempt timestamp
}
```

### Indexes
- `by_stake_address_action` - Primary lookup: [stakeAddress, actionType]
- `by_locked_until` - Find expired lockouts: [lockedUntil]

## Algorithm Flow

### Nonce Generation Flow
```
1. User requests nonce
2. Check if wallet has rate limit record for "nonce_generation"
3. If no record → Create new record, allow request
4. If record exists:
   a. Check if current time > windowStart + 1 hour
      - If yes: Reset window, allow request
   b. Check if attemptCount >= 5
      - If yes: Deny with time remaining
      - If no: Increment count, allow request
```

### Signature Verification Flow
```
1. User submits signature
2. Check if wallet has rate limit record for "signature_verification"
3. If locked (lockedUntil > now) → Deny immediately
4. If no record → Create new record, proceed
5. If record exists:
   a. Check if current time > windowStart + 1 hour
      - If yes: Reset window, proceed
   b. Check if attemptCount >= 10
      - If yes: Deny with time remaining
      - If no: Increment count, proceed
6. Verify signature cryptographically
7. If verification succeeds:
   - Reset consecutiveFailures to 0
   - Clear lockedUntil
8. If verification fails:
   - Increment consecutiveFailures
   - If consecutiveFailures >= 3:
     * Set lockedUntil = now + 1 hour
```

## Configuration Constants

### Location: `/convex/walletAuthentication.ts`

```typescript
const NONCE_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
};

const SIGNATURE_RATE_LIMIT = {
  maxAttempts: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
};

const FAILED_ATTEMPTS_LOCKOUT = {
  maxConsecutiveFails: 3,
  lockoutDurationMs: 60 * 60 * 1000, // 1 hour
};
```

## Tuning Guidelines

### Increasing Security (Stricter Limits)
```typescript
// More restrictive for high-security scenarios
const NONCE_RATE_LIMIT = {
  maxAttempts: 3,              // Reduced from 5
  windowMs: 60 * 60 * 1000,
};

const SIGNATURE_RATE_LIMIT = {
  maxAttempts: 5,              // Reduced from 10
  windowMs: 60 * 60 * 1000,
};

const FAILED_ATTEMPTS_LOCKOUT = {
  maxConsecutiveFails: 2,      // Reduced from 3
  lockoutDurationMs: 2 * 60 * 60 * 1000, // 2 hours instead of 1
};
```

### Increasing User Convenience (Looser Limits)
```typescript
// More permissive for better UX
const NONCE_RATE_LIMIT = {
  maxAttempts: 10,             // Increased from 5
  windowMs: 60 * 60 * 1000,
};

const SIGNATURE_RATE_LIMIT = {
  maxAttempts: 20,             // Increased from 10
  windowMs: 60 * 60 * 1000,
};

const FAILED_ATTEMPTS_LOCKOUT = {
  maxConsecutiveFails: 5,      // Increased from 3
  lockoutDurationMs: 30 * 60 * 1000, // 30 minutes instead of 1 hour
};
```

## Monitoring & Analytics

### Key Metrics to Track

1. **Rate Limit Hits:**
   - Count of denied requests per day
   - Peak times for rate limit hits
   - Most frequently rate-limited wallets

2. **Lockout Events:**
   - Number of wallets locked per day
   - Average lockout duration
   - Wallets with repeated lockouts

3. **Success vs Failure Ratio:**
   - Signature verification success rate
   - Failed attempts before lockout
   - Time to successful verification

### Query Examples

```typescript
// Count rate limit violations today
const today = Date.now() - 24 * 60 * 60 * 1000;
const violations = await ctx.db
  .query("walletRateLimits")
  .filter(q =>
    q.and(
      q.gt(q.field("lastAttemptAt"), today),
      q.gte(q.field("attemptCount"), 5) // Hit the limit
    )
  )
  .collect();

// Find currently locked wallets
const lockedWallets = await ctx.db
  .query("walletRateLimits")
  .filter(q =>
    q.and(
      q.gt(q.field("lockedUntil"), Date.now()),
      q.eq(q.field("actionType"), "signature_verification")
    )
  )
  .collect();
```

## Cleanup & Maintenance

### Automatic Cleanup Functions

1. **cleanupExpiredLockouts** - Removes expired lockouts
   - Runs every 30 minutes (recommended)
   - Clears `lockedUntil` field
   - Resets `consecutiveFailures`

2. **cleanupExpiredSignatures** - Removes expired nonces
   - Runs daily at 2 AM (recommended)
   - Deletes signatures past expiration

### Manual Cleanup Queries

```typescript
// Clear all rate limits for a wallet (admin use)
export const clearWalletRateLimits = mutation({
  args: { stakeAddress: v.string() },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("walletRateLimits")
      .filter(q => q.eq(q.field("stakeAddress"), args.stakeAddress))
      .collect();

    for (const record of records) {
      await ctx.db.delete(record._id);
    }
  }
});

// Reset failed attempts for a wallet (support use)
export const resetWalletFailures = mutation({
  args: { stakeAddress: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("walletRateLimits")
      .withIndex("by_stake_address_action", q =>
        q.eq("stakeAddress", args.stakeAddress)
         .eq("actionType", "signature_verification")
      )
      .first();

    if (record) {
      await ctx.db.patch(record._id, {
        consecutiveFailures: 0,
        lockedUntil: undefined,
      });
    }
  }
});
```

## Admin Dashboard Integration

### Recommended UI Features

1. **Rate Limit Status Panel:**
   - Show wallets near rate limit
   - Display locked wallets with countdown
   - Allow manual unlock (admin only)

2. **Analytics Charts:**
   - Rate limit hits over time
   - Lockout events timeline
   - Success/failure ratio trends

3. **Alert System:**
   - Email/Discord alerts for suspicious patterns
   - Notify on mass rate limit violations
   - Alert on repeated lockouts from same wallet

## Security Considerations

### Attack Scenarios Prevented

1. **Nonce Spam Attack:**
   - Attacker floods nonce endpoint
   - Rate limit prevents excessive nonce creation
   - 5 per hour limit stops spam

2. **Brute Force Signature:**
   - Attacker tries multiple signatures
   - 10 attempts per hour with 3-strike lockout
   - Makes brute force impractical

3. **Distributed Attack:**
   - Each wallet tracked separately
   - Rate limits per wallet, not global
   - Prevents one bad actor affecting others

### Known Limitations

1. **Multiple Wallets:**
   - Attacker with many wallets can bypass per-wallet limits
   - Consider adding IP-based rate limiting (future)

2. **Legitimate Users Locked Out:**
   - Users with multiple devices may hit limits
   - Support can manually unlock
   - Consider device fingerprinting (future)

3. **Window Reset Exploitation:**
   - Attacker can wait for window to reset
   - 1-hour window is reasonable trade-off
   - Consider exponential backoff (future)

## Testing Rate Limits

### Test Scenarios

1. **Normal Usage:**
   ```typescript
   // Should succeed
   for (let i = 0; i < 5; i++) {
     await generateNonce({ stakeAddress, walletName });
   }
   ```

2. **Rate Limit Hit:**
   ```typescript
   // 6th attempt should fail
   for (let i = 0; i < 6; i++) {
     const result = await generateNonce({ stakeAddress, walletName });
     if (i === 5) {
       expect(result).toThrow("Rate limit exceeded");
     }
   }
   ```

3. **Lockout Trigger:**
   ```typescript
   // 3 failed signatures should lock
   for (let i = 0; i < 3; i++) {
     await verifySignature({
       stakeAddress,
       nonce,
       signature: "invalid",
       walletName
     });
   }

   // 4th attempt should show lockout
   const result = await verifySignature(...);
   expect(result.error).toContain("Too many failed attempts");
   ```

## Future Enhancements

1. **IP-Based Rate Limiting:**
   - Track requests per IP address
   - Prevent distributed attacks
   - GDPR considerations needed

2. **Exponential Backoff:**
   - Increase lockout duration on repeated violations
   - 1st lockout: 1 hour
   - 2nd lockout: 2 hours
   - 3rd lockout: 24 hours

3. **Reputation System:**
   - Track wallet trustworthiness
   - Higher limits for trusted wallets
   - Lower limits for suspicious wallets

4. **Adaptive Limits:**
   - Adjust limits based on platform load
   - Stricter during high traffic
   - Relaxed during low traffic

5. **Whitelist/Blacklist:**
   - Whitelist trusted wallets (no limits)
   - Blacklist abusive wallets (permanent ban)
   - Admin-managed lists
