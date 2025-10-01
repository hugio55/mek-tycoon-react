# Gold Invariant Violation Fix

## Problem Summary
The admin panel's `updateWalletGold` mutation was throwing the error:
```
Gold invariant violation: totalCumulativeGold < accumulatedGold + totalSpent
```

This occurred when trying to manually update a wallet's gold amount via the admin interface.

## Root Cause

### The Invariant
The gold tracking system maintains a critical invariant:
```
totalCumulativeGold >= accumulatedGold + totalGoldSpentOnUpgrades
```

This ensures:
- `totalCumulativeGold` = All gold ever earned (never decreases)
- `accumulatedGold` = Current spendable gold (can decrease via spending or admin removal)
- `totalGoldSpentOnUpgrades` = All gold spent on Mek upgrades (only increases)

### The Bug
The issue occurred in three scenarios:

1. **Uninitialized `totalCumulativeGold`**:
   - Old records had `totalCumulativeGold = 0` (unset)
   - When admins tried to add gold, the calculation failed because there was no baseline

2. **Corrupted State**:
   - Some records had `totalCumulativeGold` values that were already violating the invariant
   - Attempting to modify these records would fail the validation check

3. **Missing Type Safety**:
   - The `recordToUse` object wasn't explicitly typed with all required fields
   - This could lead to undefined values being passed to `calculateGoldIncrease()`

## The Solution

### 1. Enhanced `calculateGoldIncrease()` (convex/lib/goldCalculations.ts)
```typescript
// Track uncapped value to detect gold lost to 50k cap
const uncappedAccumulated = currentAccumulated + goldToAdd;
const newAccumulatedGold = Math.min(GOLD_CAP, uncappedAccumulated);
const goldLostToCap = uncappedAccumulated - newAccumulatedGold;

// Enhanced error logging with detailed diagnostics
console.error("[GOLD ERROR] Invariant violation detected!", {
  newAccumulatedGold,
  newTotalCumulativeGold,
  totalSpent,
  goldToAdd,
  goldLostToCap,
  currentAccumulated,
  currentCumulative,
  baseCumulative,
  uncappedAccumulated,
  calculation: {
    expected: `${newTotalCumulativeGold} >= ${newAccumulatedGold} + ${totalSpent}`,
    actual: `${newTotalCumulativeGold} >= ${newAccumulatedGold + totalSpent}`,
    difference: newTotalCumulativeGold - (newAccumulatedGold + totalSpent)
  }
});
```

### 2. Defensive Initialization (convex/adminVerificationReset.ts)
```typescript
// Explicitly construct recordToUse with all required fields
let recordToUse = {
  ...goldMiningRecord,
  accumulatedGold: currentAccumulated,
  totalGoldSpentOnUpgrades: totalSpent,
  totalCumulativeGold: goldMiningRecord.totalCumulativeGold || 0,
  createdAt: goldMiningRecord.createdAt,
  totalGoldPerHour: goldMiningRecord.totalGoldPerHour
};

// Initialize totalCumulativeGold if unset
if (!recordToUse.totalCumulativeGold || recordToUse.totalCumulativeGold === 0) {
  recordToUse.totalCumulativeGold = currentAccumulated + totalSpent;
}

// Validate BEFORE making changes
try {
  validateGoldInvariant(recordToUse);
} catch (error) {
  // Force-fix corrupted state
  recordToUse.totalCumulativeGold = Math.max(
    recordToUse.totalCumulativeGold,
    currentAccumulated + totalSpent
  );
}
```

### 3. Safe Gold Removal
```typescript
// When removing gold, check that invariant will still hold
if (newCumulativeGold < args.newGoldAmount + totalSpent) {
  return {
    success: false,
    message: `Cannot reduce gold to ${args.newGoldAmount} - would violate tracking invariant`
  };
}
```

### 4. Diagnostic Tools (convex/debugGoldInvariants.ts)

New utility functions to identify and fix broken records:

- **`findBrokenInvariants`**: Query to find all wallets with invariant violations
- **`fixAllBrokenInvariants`**: Mutation to repair all broken records (with dry-run mode)
- **`inspectWalletGold`**: Detailed diagnostic view of a specific wallet's gold state

## How to Use

### Check for Broken Records
```typescript
// In your frontend or admin panel
const result = await convex.query(api.debugGoldInvariants.findBrokenInvariants);
console.log(`Found ${result.brokenCount} broken records out of ${result.totalWallets}`);
```

### Fix Broken Records
```typescript
// Dry run first (safe, no changes)
const preview = await convex.mutation(api.debugGoldInvariants.fixAllBrokenInvariants, {
  dryRun: true
});
console.log(`Would fix ${preview.fixedCount} records`);

// Apply fixes
const fixed = await convex.mutation(api.debugGoldInvariants.fixAllBrokenInvariants, {
  dryRun: false
});
console.log(`Fixed ${fixed.fixedCount} records`);
```

### Inspect Specific Wallet
```typescript
const inspection = await convex.query(api.debugGoldInvariants.inspectWalletGold, {
  walletAddress: "stake1..."
});
console.log(inspection.invariant); // Shows if wallet is valid
```

## Edge Cases Handled

1. **Uninitialized `totalCumulativeGold = 0`**: Automatically initialized to `accumulated + spent`
2. **Corrupted records**: Force-corrected before any operations
3. **50k gold cap**: Properly tracked - cumulative can exceed cap
4. **Negative gold amounts**: Rejected with error message
5. **Insufficient gold removal**: Prevented if it would violate invariant

## Testing Recommendations

1. **Test adding gold to new wallet** (totalCumulativeGold = 0)
2. **Test adding gold near 50k cap** (e.g., from 48k to 52k)
3. **Test removing gold** (ensure invariant still holds)
4. **Test with spent gold** (wallets that have purchased upgrades)
5. **Run `findBrokenInvariants`** on production data

## Preventive Measures

- All gold operations now validate invariant BEFORE proceeding
- Enhanced logging shows exact calculation steps
- Defensive initialization ensures no undefined values
- Explicit type construction prevents missing fields

## Files Modified

1. `convex/lib/goldCalculations.ts` - Enhanced error logging and cap tracking
2. `convex/adminVerificationReset.ts` - Defensive initialization and validation
3. `convex/debugGoldInvariants.ts` - **NEW** - Diagnostic and repair utilities

## Future Improvements

Consider adding:
- Database migration to initialize all `totalCumulativeGold = 0` records
- Automatic invariant validation as a cron job
- Admin panel UI integration for the diagnostic tools
- Alerts when invariant violations are detected
