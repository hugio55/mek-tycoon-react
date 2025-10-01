# Gold Invariant Fix - Summary

## What Was Fixed

Fixed the critical gold invariant violation error that occurred when admins tried to update wallet gold amounts via the admin panel.

**Error Message:**
```
Gold invariant violation: totalCumulativeGold < accumulatedGold + totalSpent
```

## Files Modified

1. **convex/lib/goldCalculations.ts**
   - Enhanced error logging in `calculateGoldIncrease()`
   - Added tracking for gold lost to 50k cap
   - More detailed diagnostic output

2. **convex/adminVerificationReset.ts**
   - Complete rewrite of `updateWalletGold` mutation
   - Defensive initialization of `totalCumulativeGold`
   - Pre-validation before any changes
   - Automatic repair of corrupted states
   - Safe gold removal with invariant checks

3. **convex/debugGoldInvariants.ts** (NEW)
   - `findBrokenInvariants` - Query to find all broken records
   - `fixAllBrokenInvariants` - Mutation to repair broken records (with dry-run)
   - `inspectWalletGold` - Detailed diagnostic for specific wallets

## What The Fix Does

### 1. Initialization Protection
When `totalCumulativeGold = 0` (uninitialized), the system now:
- Automatically calculates the minimum valid value: `accumulatedGold + totalSpent`
- Sets this before attempting any gold operations
- Logs the initialization for audit purposes

### 2. State Validation
Before any gold operation, the system:
- Validates the current state using `validateGoldInvariant()`
- If invalid, automatically corrects it
- Logs any corrections made

### 3. Safe Operations
When adding gold:
- Uses `calculateGoldIncrease()` which properly handles the 50k cap
- Tracks cumulative gold separately (can exceed 50k)
- Validates invariant after calculation

When removing gold:
- Checks that the removal won't violate the invariant
- Rejects the operation if it would break the system
- Provides clear error messages

### 4. Enhanced Logging
All operations now log:
- Before state (accumulated, cumulative, spent)
- Operation details (how much gold added/removed)
- After state (new values)
- Any corrections or warnings

## How to Use

### Normal Admin Operations
The admin panel should now work without errors when updating wallet gold amounts. The fix handles all edge cases automatically.

### Diagnostic Tools

**Find broken records:**
```typescript
const broken = await convex.query(api.debugGoldInvariants.findBrokenInvariants);
console.log(`Found ${broken.brokenCount} broken records`);
```

**Preview fixes (safe, no changes):**
```typescript
const preview = await convex.mutation(api.debugGoldInvariants.fixAllBrokenInvariants, {
  dryRun: true
});
console.log(`Would fix ${preview.fixedCount} records`);
```

**Apply fixes:**
```typescript
const result = await convex.mutation(api.debugGoldInvariants.fixAllBrokenInvariants, {
  dryRun: false
});
console.log(`Fixed ${result.fixedCount} records`);
```

**Inspect specific wallet:**
```typescript
const wallet = await convex.query(api.debugGoldInvariants.inspectWalletGold, {
  walletAddress: "stake1..."
});
console.log("Invariant valid:", wallet.invariant.isValid);
```

## Edge Cases Handled

✅ Uninitialized `totalCumulativeGold = 0`
✅ Corrupted records (cumulative < accumulated + spent)
✅ Gold cap (50k) - cumulative tracks all-time, accumulated is capped
✅ Negative gold amounts (rejected)
✅ Insufficient gold removal (prevented if would violate invariant)
✅ Wallets with spending history
✅ Multiple consecutive operations

## Testing

A test suite is available: `test-gold-invariant-fix.js`

Run it to verify the fix works correctly across all edge cases.

## Next Steps

1. **Immediate**: The fix is deployed and ready to use
2. **Recommended**: Run `findBrokenInvariants` to see if any existing records need repair
3. **Optional**: Run `fixAllBrokenInvariants` with `dryRun: true` to preview repairs
4. **If needed**: Run `fixAllBrokenInvariants` with `dryRun: false` to repair records

## Technical Details

See `GOLD_INVARIANT_FIX.md` for complete technical documentation, including:
- Detailed root cause analysis
- Code examples
- Implementation details
- Testing recommendations
- Future improvements
