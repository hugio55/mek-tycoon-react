# Implementation Guide: Refactored Verification System

## Quick Start

### Option 1: Side-by-Side Testing (Recommended)

Test the new system alongside the old one using a feature flag.

**Step 1: Add feature flag to UI component**

```typescript
// src/components/BlockchainVerificationPanel.tsx

// At the top of the file
const USE_NEW_VERIFICATION = false; // Change to true to test new system

// In the component
const verifyOld = useAction(api.blockchainVerification.verifyNFTOwnership);
const verifyNew = useAction(api.blockchainVerificationRefactored.verifyNFTOwnershipV2);

const verifyNFTOwnership = USE_NEW_VERIFICATION ? verifyNew : verifyOld;
```

**Step 2: Test with a small wallet (1-10 NFTs)**
- Change `USE_NEW_VERIFICATION = true`
- Connect wallet
- Click "Verify on Blockchain"
- Verify console logs show new system
- Verify success/error messages are clear

**Step 3: Test with a large wallet (100+ NFTs)**
- Use same wallet or test wallet
- Verify timeout handling
- Check error messages

**Step 4: Test error scenarios**
- Disconnect internet (network error)
- Try 10+ verifications quickly (rate limit)
- Use invalid wallet address (not found)

**Step 5: Gradual rollout**
```typescript
// Production rollout strategy
const userId = getCurrentUserId();
const USE_NEW_VERIFICATION = userId % 10 === 0; // 10% of users
```

### Option 2: Direct Replacement

Switch all users to the new system immediately.

**Step 1: Update UI component**

```typescript
// src/components/BlockchainVerificationPanel.tsx

// Change this line:
const verifyNFTOwnership = useAction(api.blockchainVerification.verifyNFTOwnership);

// To this:
const verifyNFTOwnership = useAction(api.blockchainVerificationRefactored.verifyNFTOwnershipV2);
```

**Step 2: Deploy and monitor**
- Watch error rates in console
- Monitor support tickets
- Track verification success rate

---

## API Changes

### Old Action (Still Works)

```typescript
const result = await verifyNFTOwnership({
  stakeAddress: 'stake1...',
  paymentAddress: 'addr1...', // optional
  walletReportedMeks: [
    { assetId: '...', assetName: 'Mek #1', mekNumber: 1 }
  ]
});

// Returns:
{
  success: true,
  verified: true,
  source: 'blockfrost',
  timestamp: 1234567890,
  walletReportedCount: 1,
  blockchainVerifiedCount: 1,
  falsePositives: [],
  missingMeks: [],
  verifiedMeks: [...]
}
```

### New Action (Improved)

```typescript
const result = await verifyNFTOwnershipV2({
  stakeAddress: 'stake1...',
  paymentAddress: 'addr1...', // optional
  walletReportedMeks: [
    { assetId: '...', assetName: 'Mek #1', mekNumber: 1 }
  ]
});

// Returns (success):
{
  success: true,
  verified: true,
  source: 'blockfrost',
  timestamp: 1234567890,
  walletReportedCount: 1,
  blockchainVerifiedCount: 1,
  falsePositives: [],
  missingMeks: [],
  verifiedMeks: [...],
  confidence: 100  // NEW: confidence score 0-100
}

// Returns (error):
{
  success: false,
  verified: false,
  timestamp: 1234567890,
  walletReportedCount: 1,
  blockchainVerifiedCount: 0,
  error: 'Blockfrost request timed out after 45s',  // Technical
  userMessage: 'Large collections may require...',   // NEW: User-friendly
  retryable: true,                                    // NEW: Can retry?
  retryAfter: 5000,                                   // NEW: Wait time (ms)
  confidence: 0
}
```

**Key Differences:**
1. `confidence` score (0-100) - NEW
2. `userMessage` for display to users - NEW
3. `retryable` boolean - NEW
4. `retryAfter` milliseconds - NEW

---

## UI Integration Guide

### Update Error Display

**Old way:**
```typescript
if (result.error) {
  setVerificationError(result.error);
}
```

**New way (user-friendly):**
```typescript
if (!result.success) {
  setVerificationError(result.userMessage || result.error);

  // Show retry button if retryable
  if (result.retryable) {
    setShowRetryButton(true);

    // Auto-enable retry after suggested delay
    if (result.retryAfter) {
      setTimeout(() => {
        setRetryDisabled(false);
      }, result.retryAfter);
    }
  }
}
```

### Show Confidence Score

```typescript
if (result.verified) {
  setVerificationStatus({
    verified: true,
    confidence: result.confidence,
    message: result.confidence === 100
      ? 'Fully verified'
      : `Verified with ${result.confidence}% confidence`
  });
}
```

### Progress Messages

The new system provides detailed progress through console logs. You can tap into these:

```typescript
// In BlockchainVerificationPanel.tsx
const handleVerifyOwnership = async () => {
  setProgressPercent(0);
  setProgressMessage('Initializing verification...');

  // Progress: 10%
  setProgressPercent(10);
  setProgressMessage('Connecting to blockchain...');

  // Progress: 25%
  setProgressPercent(25);
  setProgressMessage(
    meks.length > 200
      ? `Querying ${meks.length} NFTs (Large collection - may take 45s)...`
      : `Querying ${meks.length} NFTs...`
  );

  // Progress: 50%
  const result = await verifyNFTOwnershipV2(...);

  // Progress: 75%
  setProgressPercent(75);
  setProgressMessage('Processing verification results...');

  // Progress: 100%
  if (result.verified) {
    setProgressPercent(100);
    setProgressMessage('Verification complete!');
  }
};
```

---

## Migration Checklist

### Pre-Deployment
- [ ] New service files created (`lib/nftFetchingService.ts`, `lib/verificationService.ts`)
- [ ] Refactored orchestration created (`blockchainVerificationRefactored.ts`)
- [ ] Convex schema includes `auditLogs` table
- [ ] Environment variables set (`BLOCKFROST_API_KEY`)

### Deployment
- [ ] Run `npx convex dev` to generate new API exports
- [ ] Update UI component imports (if using direct replacement)
- [ ] Add feature flag (if using side-by-side)
- [ ] Deploy to staging environment
- [ ] Test all scenarios (success, timeout, rate limit, errors)

### Post-Deployment
- [ ] Monitor error logs for first 24 hours
- [ ] Check support tickets for verification issues
- [ ] Verify cache is working (check logs for "Returning cached result")
- [ ] Confirm rate limiting is working (try 10+ verifications)
- [ ] Validate timeout protection (test with 500+ NFT wallet if available)

### Rollout Schedule
- **Week 1:** 10% of users
- **Week 2:** 25% of users (if <5 support tickets)
- **Week 3:** 50% of users (if <10 support tickets)
- **Week 4:** 100% of users (if all metrics good)

### Rollback Plan
If issues arise:
```typescript
// Immediate rollback
const USE_NEW_VERIFICATION = false;
```

Or percentage-based rollback:
```typescript
const userId = getCurrentUserId();
const USE_NEW_VERIFICATION = userId % 100 < 5; // Roll back to 5%
```

---

## Testing Scenarios

### Test Case 1: Small Collection Success
```
Wallet: 5 NFTs
Expected: Verify in <5s, show success message
```

### Test Case 2: Large Collection Success
```
Wallet: 240+ NFTs
Expected: Show "Large collection" warning, verify in <45s, show success
```

### Test Case 3: Timeout Handling
```
Simulate: Blockfrost delay >45s
Expected: Show timeout error with retry guidance
User action: Wait 5s, retry
Expected: Success on second attempt
```

### Test Case 4: Rate Limiting
```
Action: Click verify 10+ times rapidly
Expected: Show rate limit error after 10th attempt
Message: "Too many requests. Wait 60s before trying again."
User action: Wait 60s, retry
Expected: Success
```

### Test Case 5: Network Error
```
Simulate: Disconnect internet
Expected: Show network error
Message: "Unable to connect to blockchain service. Please check your internet."
```

### Test Case 6: Verification Failure
```
Scenario: Wallet reports 5 NFTs, blockchain has 3
Expected: Show verification failed
Details: "2 NFT(s) claimed by wallet but not found on blockchain"
```

---

## Monitoring & Metrics

### Key Metrics to Track

**Success Rate:**
```sql
SELECT
  COUNT(*) as total_verifications,
  SUM(verified) as successful,
  AVG(confidence) as avg_confidence
FROM auditLogs
WHERE type = 'verification'
  AND timestamp > NOW() - INTERVAL '24 hours'
```

**Error Distribution:**
```sql
SELECT
  error_type,
  COUNT(*) as count,
  AVG(retry_count) as avg_retries
FROM auditLogs
WHERE success = false
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY error_type
ORDER BY count DESC
```

**Performance:**
```sql
SELECT
  collection_size,
  AVG(duration_ms) as avg_duration,
  MAX(duration_ms) as max_duration,
  COUNT(*) as count
FROM auditLogs
WHERE type = 'verification'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY
  CASE
    WHEN nft_count < 10 THEN 'small'
    WHEN nft_count < 100 THEN 'medium'
    ELSE 'large'
  END as collection_size
```

### Alerts to Set Up

1. **Error Rate Alert:** >10% failure rate in 1 hour
2. **Timeout Alert:** >5 timeouts in 1 hour
3. **Rate Limit Alert:** >20 rate limits in 1 hour
4. **Slow Performance:** >30s average for <100 NFT collections

---

## Troubleshooting

### Issue: Verification always fails
**Check:**
1. Is Blockfrost API key set? `console.log(process.env.BLOCKFROST_API_KEY)`
2. Is rate limiter blocking? Check console for "Rate limit exceeded"
3. Is cache stale? Clear cache: `await clearVerificationCache()`

### Issue: Timeouts on small collections
**Check:**
1. Network latency to Blockfrost
2. Is Blockfrost API experiencing issues? (check status page)
3. Try clearing cache and retry

### Issue: "Cannot read properties of undefined"
**This is the old error! You should not see this with the new system.**
If you do, check:
1. Are you using the new action? (`verifyNFTOwnershipV2`)
2. Is ctx properly passed to services?
3. Check defensive null checks in `markWalletAsVerified`

### Issue: Fallback to Koios not working
**Note:** Koios fallback is not yet implemented in the new system.
To add it:
1. Update `fetchFromKoios` in `lib/nftFetchingService.ts`
2. Use same pattern as Blockfrost implementation
3. Add Koios-specific error mapping

---

## Support

For issues or questions:
1. Check console logs for detailed error trails
2. Review `VERIFICATION_REFACTORING.md` for architecture details
3. Review `ARCHITECTURE_COMPARISON.md` for before/after context
4. Contact development team with specific error messages and wallet addresses
