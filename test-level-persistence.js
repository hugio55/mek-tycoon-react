// Test script to verify Mek level boosts persist after page reload
// Run with: node test-level-persistence.js

console.log(`
================================================================================
MEK LEVEL BOOST PERSISTENCE TEST
================================================================================

This test verifies that Mek level bonuses are properly applied to gold rates
after page reload.

ISSUE IDENTIFIED:
- Mek levels persist correctly (stored in mekLevels table)
- BUT gold rate bonuses from levels were NOT being applied on page reload
- The base rates were being used instead of effective rates (base + boost)

ROOT CAUSES FOUND:
1. initializeWithBlockfrost wasn't fetching level data when reconnecting
2. Frontend wasn't recalculating effective rates with level boosts
3. goldMining record wasn't storing effective rates with boosts

FIXES APPLIED:
1. Modified initializeWithBlockfrost to:
   - Query mekLevels for the wallet
   - Calculate effective rates (base + boost) for each Mek
   - Store effective rates in goldMining.ownedMeks

2. Updated frontend level sync to:
   - Properly calculate effective goldPerHour for each Mek
   - Update total gold per hour when levels change
   - Check for rate mismatches on page load

3. Added logging to detect when rates don't include boosts

HOW TO TEST:
1. Connect wallet and verify Meks load with correct rates
2. Upgrade a Mek to level 2+ (should show increased rate)
3. Note the total gold/hour rate
4. Refresh the page (F5)
5. Check that:
   - Mek still shows as level 2+
   - Gold rate still includes the level bonus
   - Total gold/hour matches pre-refresh value

EXPECTED BEHAVIOR:
- Before fix: Rate reverts to base rate after refresh
- After fix: Rate maintains level bonus after refresh

VERIFICATION IN CONSOLE:
Look for these logs:
- "[Level Sync] Syncing level data..." - Shows levels being applied
- "[Level Boost Check] Rate mismatch detected..." - Shows if rates need fixing
- Check that effectiveRate = baseRate + boost

================================================================================
`);