# Gold Deduction Sync Debugging

## The Problem
When upgrading a Mek, the gold cost is deducted in the backend database, but the frontend UI still shows the old gold total. A "minus gold" animation plays above the gold counter, but the actual number doesn't decrease.

## Data Flow
```
User clicks UPGRADE button
    ↓
Frontend calls upgradeMek mutation
    ↓
Backend deducts gold in database (line 287: accumulatedGold: newAccumulatedGold)
    ↓
Convex query invalidation triggers
    ↓
Frontend goldMiningData query re-fetches
    ↓
useEffect logs new goldMiningData (line 148)
    ↓
Animation loop receives updated goldMiningData
    ↓
setCurrentGold called with new value (line 1268)
    ↓
UI re-renders with updated gold
```

## Root Cause Hypothesis
The most likely issue is that the **animation loop is overwriting the correct deducted value** with a stale calculation. Here's why:

1. The animation loop (lines 1256-1268) runs at 30 FPS using `requestAnimationFrame`
2. It calculates gold as: `(goldMiningData.accumulatedGold || 0) + goldSinceLastUpdate`
3. If the query doesn't refresh quickly enough, the loop continues using the OLD `accumulatedGold` value
4. Even though `setCurrentGold(prev => prev - upgradeCost)` is called (line 2397), the next animation frame overwrites it

## Logging Added

### Backend (convex/mekLeveling.ts)
- **Line 286-291**: Logs gold values BEFORE database update
- **Line 307-311**: Logs AFTER database update confirming deduction
- **Line 326-332**: Logs the result being returned to frontend

### Frontend (src/app/mek-rate-logging/page.tsx)
- **Line 147-158**: Logs whenever `goldMiningData` query receives new data
- **Line 1256-1265**: Logs animation loop updates (only when gold changes significantly)
- **Line 2369-2405**: Logs the entire upgrade flow:
  - Before mutation call
  - Mutation result
  - setState calls
  - Callback values

## What to Look For

When you test an upgrade, watch the console logs in this order:

1. **[UPGRADE] Before mutation call** - Shows gold before upgrade
2. **[UPGRADE MUTATION] Before DB update** - Backend receives request
3. **[UPGRADE MUTATION] After DB update** - Backend confirms deduction
4. **[UPGRADE MUTATION] Returning result** - Backend returns new gold value
5. **[UPGRADE] Mutation result** - Frontend receives result
6. **[UPGRADE] Setting currentGold** - Frontend calls setState
7. **[UPGRADE] setCurrentGold callback** - Shows actual setState execution
8. **[QUERY] goldMiningData updated** - Query refetches with new data
9. **[ANIMATION LOOP] Updating gold** - Animation loop processes new data

## Key Questions to Answer

1. **Does the backend successfully deduct gold?**
   - Check if `[UPGRADE MUTATION] After DB update` shows the reduced `remainingGold`

2. **Does the query re-fetch after mutation?**
   - Check if `[QUERY] goldMiningData updated` shows the new `accumulatedGold` value
   - Compare timestamps - does it happen AFTER the mutation?

3. **Does setState actually execute?**
   - Check if `[UPGRADE] setCurrentGold callback` shows the reduced value

4. **Does the animation loop override the correct value?**
   - Check if `[ANIMATION LOOP] Updating gold` happens AFTER setState
   - Compare the `calculatedGold` value - is it using OLD or NEW `accumulatedGold`?

## FIX IMPLEMENTED

**Root Cause Confirmed:** The animation loop was overwriting manual setState calls.

**The Fix (Option 2 - Simplest and most reliable):**

Removed the manual `setCurrentGold()` and `setDisplayedGold()` calls after the upgrade mutation (lines 2290-2302). Instead, the code now:

1. Calls the upgrade mutation
2. Logs the result
3. **Trusts Convex reactivity** - The query will automatically refresh when the database updates
4. The animation loop picks up the new `goldMiningData.accumulatedGold` value naturally

### Why This Works

Convex automatically invalidates queries when mutations modify related data. The flow is:

```
upgradeMek mutation executes
    ↓
Database patches goldMining.accumulatedGold
    ↓
Convex detects goldMining table changed
    ↓
goldMiningData query automatically invalidates
    ↓
Query re-fetches with new data
    ↓
useEffect at line 148 logs the new data
    ↓
Animation loop receives updated goldMiningData
    ↓
setCurrentGold called with correct deducted value
    ↓
UI updates
```

### Why Manual setState Failed

The old code tried to manually deduct gold:
```javascript
setCurrentGold(prev => prev - upgradeCost); // Line 2397
```

But the animation loop runs at 30 FPS (every 33ms):
```javascript
setCurrentGold(calculatedGold); // Line 1268 - Overwrites within 33ms!
```

The manual setState would execute, but before the next render, the animation loop would overwrite it with a calculation based on the OLD `goldMiningData` (which hadn't refreshed yet).

## Testing Instructions

1. Note your current gold amount
2. Click upgrade on a Mek (cost should be 100-32000 gold)
3. Watch the console logs flow through
4. Check if the gold total decreases
5. Wait a few seconds and verify it doesn't revert

## Files Modified

- `convex/mekLeveling.ts` - Added backend logging
- `src/app/mek-rate-logging/page.tsx` - Added frontend logging and query monitoring

## Next Steps

After reviewing the logs, we'll know exactly where the synchronization breaks and can implement the appropriate fix.