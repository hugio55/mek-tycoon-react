# Gold Invariant Fix - Quick Reference

## What Just Got Fixed

The admin panel's gold update feature now works correctly. No more errors when trying to update wallet gold amounts.

## Files Changed

- `convex/lib/goldCalculations.ts` - Better error logging
- `convex/adminVerificationReset.ts` - Complete rewrite of `updateWalletGold`
- `convex/debugGoldInvariants.ts` - **NEW** diagnostic tools

## The Fix (In Plain English)

**Before:** System crashed when trying to update gold for wallets with uninitialized tracking data.

**After:** System automatically detects and fixes broken states, then safely updates gold amounts.

## What To Do Next

### Option 1: Just Use It (Recommended)
The fix is automatic. Just use the admin panel normally. It will handle everything.

### Option 2: Clean Up Existing Issues (Optional)

1. **Check for broken records:**
   ```typescript
   const broken = await convex.query(api.debugGoldInvariants.findBrokenInvariants);
   ```

2. **Preview fixes (safe, no changes):**
   ```typescript
   const preview = await convex.mutation(api.debugGoldInvariants.fixAllBrokenInvariants, {
     dryRun: true
   });
   ```

3. **Apply fixes:**
   ```typescript
   await convex.mutation(api.debugGoldInvariants.fixAllBrokenInvariants, {
     dryRun: false
   });
   ```

## What Changed in the Admin Panel

**Adding Gold:**
- ✅ Handles uninitialized wallets
- ✅ Handles the 50k gold cap
- ✅ Handles wallets with spending history
- ✅ Auto-repairs corrupted data

**Removing Gold:**
- ✅ Validates the removal is safe
- ✅ Rejects if it would corrupt data
- ✅ Clear error messages if rejected

## Edge Cases Now Handled

- Uninitialized `totalCumulativeGold = 0`
- Corrupted states (already broken before fix)
- Gold cap scenarios (48k → 53k)
- Wallets with spending history
- Negative amounts (rejected)
- Multiple consecutive operations

## Error Messages

**Before Fix:**
```
Gold invariant violation: totalCumulativeGold < accumulatedGold + totalSpent
```

**After Fix:**
```
✅ Success! Added 5000 gold. New balance: 15000, cumulative: 17000
```

OR (if unsafe removal):
```
❌ Cannot reduce gold to 5000 - would violate tracking invariant (cumulative: 10000, need: 12000)
```

## Documentation

- **Quick overview:** This file
- **Summary:** `GOLD_INVARIANT_SUMMARY.md`
- **Technical details:** `GOLD_INVARIANT_FIX.md`
- **Visual guide:** `GOLD_INVARIANT_DIAGRAM.md`

## Questions?

**Is it safe to use?** Yes, the fix includes defensive checks and auto-repair.

**Will it break existing data?** No, it only corrects corrupted states.

**Do I need to do anything?** No, but running `fixAllBrokenInvariants` is recommended to clean up any existing issues.

**What if I still get errors?** Check the console logs - they now show detailed diagnostics.

## Testing

A test suite is available: `test-gold-invariant-fix.js`

Run it to verify the fix works on your system.

---

**TL;DR:** The admin gold update feature is fixed. Use it normally. Optionally run `fixAllBrokenInvariants` to clean up old data.
