# Fix: Mek Level Boosts Not Persisting After Page Reload

## Problem
When users reload the page, their gold mining rate reverts to the base rate, ignoring all level bonuses from upgraded Meks. The Mek levels themselves persist correctly, but the bonuses aren't being applied to the gold rate calculation.

## Root Cause Analysis

### Issue 1: Backend Not Including Level Boosts on Initialization
**Location:** `convex/goldMining.ts` - `initializeWithBlockfrost` action (line 473-591)

The `initializeWithBlockfrost` action was fetching Meks from blockchain but NOT:
- Querying the `mekLevels` table for existing level data
- Applying level boosts to the gold rates
- Storing effective rates in the database

### Issue 2: Frontend Not Properly Syncing Level Boosts
**Location:** `src/app/mek-rate-logging/page.tsx` - Level sync effect (line 424-498)

The frontend was:
- Updating `levelBoostAmount` and `currentLevel` properties
- BUT not recalculating the `goldPerHour` field to include boosts
- Not updating the total gold per hour when levels changed

### Issue 3: No Detection of Rate Mismatches
The system had no way to detect when stored rates didn't include level boosts, making the issue invisible until users noticed lower rates.

## Solution Implemented

### Backend Fix (goldMining.ts)
```typescript
// Added to initializeWithBlockfrost (lines 537-561):
// Get level data for these Meks to include boosts
const mekLevels = await ctx.runQuery(api.mekLeveling.getMekLevels, {
  walletAddress: args.stakeAddress
});

// Apply level boosts to Mek rates
const meksWithLevelBoosts = meksWithRates.map(m => {
  const levelData = levelMap.get(m.assetId);
  const currentLevel = levelData?.currentLevel || 1;
  const boostAmount = levelData?.currentBoostAmount || 0;

  // Calculate effective rate (base + boost)
  const effectiveRate = m.goldPerHour + boostAmount;

  return {
    ...m,
    goldPerHour: effectiveRate // Use effective rate as the main rate
  };
});
```

### Frontend Fix (page.tsx)
```typescript
// Updated level sync (lines 448-462):
// Calculate effective gold per hour (base + boost)
const effectiveGoldPerHour = baseRate + levelBoostAmount;

return {
  ...mek,
  goldPerHour: effectiveGoldPerHour, // Update the main rate to include boost
};

// Also update total rate (lines 493-495):
const newTotalRate = updatedMeks.reduce((sum, mek) => sum + mek.goldPerHour, 0);
setGoldPerHour(newTotalRate);
```

### Added Rate Mismatch Detection (page.tsx)
```typescript
// Added logging to detect mismatches (lines 220-241):
if (Math.abs(expectedTotalWithBoosts - goldMiningData.totalGoldPerHour) > 1) {
  console.log('[Level Boost Check] Rate mismatch detected on page load:', {
    storedTotal: goldMiningData.totalGoldPerHour,
    expectedWithBoosts: expectedTotalWithBoosts,
    difference: expectedTotalWithBoosts - goldMiningData.totalGoldPerHour
  });
}
```

## Testing Instructions

1. **Connect Wallet**: Connect and verify Meks load with correct rates
2. **Upgrade a Mek**: Upgrade any Mek to level 2 or higher
3. **Note the Rate**: Record the new gold/hour rate (should be higher)
4. **Reload Page**: Press F5 or refresh browser
5. **Verify Fix**:
   - Mek should still show correct level
   - Gold rate should still include the level bonus
   - Total gold/hour should match pre-refresh value

## Verification

Check browser console for these logs:
- `[Level Sync] Found level changes...` - Shows levels being applied with effective rates
- `[Level Boost Check] Rate mismatch detected...` - Only appears if rates need correction
- Look for `effectiveRate` matching `baseRate + boost` in the logs

## Files Modified

1. `convex/goldMining.ts` (lines 537-591)
   - Modified `initializeWithBlockfrost` to include level boosts

2. `src/app/mek-rate-logging/page.tsx` (lines 220-261, 439-498)
   - Updated level sync to calculate effective rates
   - Added rate mismatch detection
   - Fixed total gold per hour calculation

## Impact

This fix ensures that:
- Level bonuses are always included in gold mining rates
- Rates persist correctly across page reloads
- Users see consistent, accurate gold earning rates
- The system can detect and log rate inconsistencies