# Variation ID Migration Plan

## Problem
Database uses grouped IDs (1-102 heads, 103-214 bodies, 215-291 traits).
Should use rarity-based IDs (1-291 by rarity rank, types mixed).

## Solution
Single migration script fixes everything in 4 steps.

## How to Run

1. **Backup** (optional but recommended):
   - Convex dashboard → Export data

2. **Run migration**:
   - Convex dashboard → `migrateToRarityBasedIds` mutation
   - Click "Run"

3. **Verify**:
   - Run `verifyVariationMigration` query
   - Check all results show "pass: true"

## What It Does

1. Deletes all old variation records
2. Inserts 291 new variations with correct rarity-based IDs
3. Updates all essence slots with correct variation IDs
4. Updates all essence balances with correct variation IDs

## Expected Results
- Lightning: ID 260 (was 94)
- Iced: ID 94 (was 234)
- All 291 variations correctly ordered by rarity

## Files to Delete After Migration

**Diagnostic files (no longer needed):**
- `convex/diagnosticVariationIdMismatch.ts`
- `convex/diagnosticAllVariationTypes.ts`
- `convex/diagnosticMissingIds.ts`

**Fix files (replaced by migration):**
- `convex/fixLightningCompletely.ts`
- `convex/fixLightningType.ts`

**Old seed function:**
- Remove `seedAllMissingVariations` from `convex/essence.ts` (lines 1675-2020)

## Post-Migration Cleanup

After successful migration and verification, delete all files listed above.
Migration script can stay (useful for future reference).
