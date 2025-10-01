# Gold Tracking System Fix - Cumulative Gold Invariant

## Problem Identified

**Critical Issue**: `totalCumulativeGold` was less than `accumulatedGold`, violating the fundamental accounting rule:

```
totalCumulativeGold >= accumulatedGold + totalGoldSpentOnUpgrades
```

**Example from your system**:
- Current gold: 27,159
- Cumulative gold: 24,429
- **VIOLATION**: Cumulative should be >= current

## Root Cause

Manual gold additions via the admin panel were updating `accumulatedGold` but NOT updating `totalCumulativeGold`. This caused the cumulative total to fall behind the actual gold amount.

### Affected Operations

1. **Hourly gold accumulation** (`updateGoldCheckpoint`) - ❌ Not updating cumulative
2. **Manual admin additions** (`updateWalletGold`) - ❌ Not updating cumulative
3. **Mek level upgrades** (`upgradeMekLevel`) - ⚠️ Spending gold but not tracking properly

## Solution Implemented

### 1. Centralized Gold Calculation Functions

Created helper functions in `convex/lib/goldCalculations.ts`:

#### `calculateGoldIncrease(record, goldToAdd)`
- Used when gold is **earned** or **manually added**
- Updates BOTH `accumulatedGold` AND `totalCumulativeGold`
- Validates the invariant after update
- Throws error if invariant would be violated

#### `calculateGoldDecrease(record, goldToSpend)`
- Used when gold is **spent** on upgrades
- Decreases `accumulatedGold`
- Increases `totalGoldSpentOnUpgrades`
- Keeps `totalCumulativeGold` THE SAME (cumulative never decreases)

#### `validateGoldInvariant(record)`
- Validates that the invariant holds
- Throws error with detailed logging if violated
- Can be called anywhere to ensure data integrity

### 2. Fixed Mutations

#### A. `updateGoldCheckpoint` (convex/goldMining.ts)
**Before**: Only updated `accumulatedGold`
**After**: Uses `calculateGoldIncrease()` to update both fields atomically

```typescript
// OLD (BROKEN)
const newAccumulatedGold = cappedGold;
const newCumulativeGold = currentCumulativeGold + goldEarnedThisUpdate;

// NEW (FIXED)
const goldUpdate = calculateGoldIncrease(existing, goldEarnedThisUpdate);
newAccumulatedGold = goldUpdate.newAccumulatedGold;
newTotalCumulativeGold = goldUpdate.newTotalCumulativeGold;
```

#### B. `upgradeMekLevel` (convex/mekLeveling.ts)
**Before**: Deducted gold but didn't track properly
**After**: Uses `calculateGoldDecrease()` to maintain invariant

```typescript
// NEW (FIXED)
const goldDecrease = calculateGoldDecrease(goldMiningData, upgradeCost);

await ctx.db.patch(goldMiningData._id, {
  accumulatedGold: goldDecrease.newAccumulatedGold,
  totalCumulativeGold: newTotalCumulativeGold, // Preserved!
  totalGoldSpentOnUpgrades: goldDecrease.newTotalGoldSpentOnUpgrades,
  // ... other fields
});
```

#### C. `updateWalletGold` (convex/adminVerificationReset.ts)
**Before**: Directly set `accumulatedGold`, ignored cumulative
**After**: Detects if adding/removing gold and updates accordingly

```typescript
// NEW (FIXED)
if (goldDifference > 0) {
  // Adding gold - use calculateGoldIncrease
  const goldUpdate = calculateGoldIncrease(goldMiningRecord, goldDifference);
  // Updates both accumulated and cumulative
} else if (goldDifference < 0) {
  // Removing gold - decrease accumulated, preserve cumulative
  await ctx.db.patch(goldMiningRecord._id, {
    accumulatedGold: args.newGoldAmount,
    totalCumulativeGold: newTotalCumulativeGold, // Keep same
  });
}
```

### 3. Validation & Repair Tools

Created `convex/validateGoldInvariants.ts` with three admin functions:

#### `checkGoldInvariantViolations` (query)
- Scans all wallets
- Reports violations and uninitialized records
- Read-only, safe to run anytime

#### `fixGoldInvariantViolations` (mutation)
- Repairs violations by setting `totalCumulativeGold = accumulatedGold + totalSpent`
- Supports dry-run mode to preview changes
- Run this to fix existing data

#### `checkWalletGoldDetails` (query)
- Check specific wallet's gold values
- Shows formula and calculation
- Indicates if valid or violated

## How to Use

### Step 1: Check for Violations

Run in Convex dashboard or via API:

```typescript
await convex.query(api.validateGoldInvariants.checkGoldInvariantViolations);
```

This returns:
```json
{
  "total": 150,
  "violations": 3,
  "warnings": 12,
  "violationDetails": [...],
  "summary": {
    "critical": "⚠️ VIOLATIONS FOUND - Run fixGoldInvariantViolations to repair"
  }
}
```

### Step 2: Preview Fix (Dry Run)

```typescript
await convex.mutation(api.validateGoldInvariants.fixGoldInvariantViolations, {
  dryRun: true
});
```

Shows what would be fixed without changing data.

### Step 3: Apply Fix

```typescript
await convex.mutation(api.validateGoldInvariants.fixGoldInvariantViolations, {
  dryRun: false
});
```

This repairs all violations by initializing/correcting `totalCumulativeGold`.

### Step 4: Check Specific Wallet

```typescript
await convex.query(api.validateGoldInvariants.checkWalletGoldDetails, {
  walletAddress: "stake1..."
});
```

Returns detailed breakdown with formula and validation status.

## Going Forward

### The Hard Rules (Now Enforced)

1. **ANY gold increase** (earned, manual, etc.) → Use `calculateGoldIncrease()`
2. **ANY gold decrease** (spending) → Use `calculateGoldDecrease()`
3. **NEVER modify** `accumulatedGold` or `totalCumulativeGold` directly
4. **ALWAYS validate** with `validateGoldInvariant()` after changes

### Formula Reference

```
totalCumulativeGold = all gold ever earned
accumulatedGold = current gold balance
totalGoldSpentOnUpgrades = gold spent on upgrades

Invariant: totalCumulativeGold >= accumulatedGold + totalGoldSpentOnUpgrades
```

### When Gold Increases (earning/adding):
```
accumulatedGold += amount
totalCumulativeGold += amount
```

### When Gold Decreases (spending):
```
accumulatedGold -= amount
totalGoldSpentOnUpgrades += amount
totalCumulativeGold stays the same (never decreases!)
```

## Testing Checklist

- [ ] Run `checkGoldInvariantViolations` to see current state
- [ ] Run `fixGoldInvariantViolations` with `dryRun: true` to preview
- [ ] Run `fixGoldInvariantViolations` with `dryRun: false` to fix
- [ ] Verify violations = 0 after fix
- [ ] Test manual gold addition via admin panel
- [ ] Test Mek upgrade purchase
- [ ] Test hourly gold accumulation
- [ ] Confirm cumulative >= current for all operations

## Files Modified

1. `convex/lib/goldCalculations.ts` - Added helper functions
2. `convex/goldMining.ts` - Fixed `updateGoldCheckpoint`
3. `convex/mekLeveling.ts` - Fixed `upgradeMekLevel`
4. `convex/adminVerificationReset.ts` - Fixed `updateWalletGold`
5. `convex/validateGoldInvariants.ts` - NEW admin tools

## Expected Outcome

After implementing this fix:
- ✅ Cumulative gold will ALWAYS be >= current gold + spent gold
- ✅ Manual admin additions will update both fields
- ✅ Automatic accumulation will update both fields
- ✅ Spending gold will maintain the invariant
- ✅ Validation tools available to monitor and repair
- ✅ Future violations prevented by centralized functions

## Notes

- The fix is **backwards compatible** - it initializes `totalCumulativeGold` from existing data if not set
- Existing violations can be repaired with `fixGoldInvariantViolations`
- All future gold operations now use the centralized helpers
- Error handling includes detailed logging for debugging
- The invariant is now mathematically enforced at the function level
