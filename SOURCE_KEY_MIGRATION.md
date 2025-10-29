# SourceKey Suffix Migration

## Problem
The top 10 rarest Meks (all one-of-ones) use repeating-digit sourceKeys (000, 111, 222, etc.). Each Mek has 3 parts (head, body, trait), resulting in 3 variations sharing the same sourceKey.

Example: Mek #6 (sourceKey "555-555-555") has:
- Head: Frost King (sourceKey: "555")
- Body: Frost Cage (sourceKey: "555")
- Trait: Nil (sourceKey: "555")

This causes confusion and makes sourceKeys non-unique.

## Solution
Add type suffixes (H/B/T) to repeating-digit sourceKeys:
- Head variations → add "H" (e.g., "555H")
- Body variations → add "B" (e.g., "555B")
- Trait variations → add "T" (e.g., "555T")

## Changes Made

### 1. Updated Source of Truth
**File:** `src/lib/completeVariationRarity.ts`
**Changes:** 27 sourceKeys updated with H/B/T suffixes
**Script:** `scripts/updateVariationSourceKeys.js`

### 2. Database Migration
**File:** `convex/updateVariationSourceKeys.ts`
**Purpose:** Updates `variationsReference` table to match new sourceKeys

## How to Run

1. **Verify completeVariationRarity.ts changes:**
   ```bash
   # Check for updated sourceKeys
   grep -E '"(000|111|222|333|444|555|666|777|888|999)[HBT]"' src/lib/completeVariationRarity.ts
   ```

2. **Run database migration:**
   - Convex dashboard → `updateVariationSourceKeysWithSuffixes` mutation
   - Click "Run"
   - Verify output shows updated count

3. **Test affected systems:**
   - Essence Distribution lightbox (essence images use variation names, not sourceKeys)
   - Mek images (use full sourceKey like "555-555-555.webp", not affected)
   - Variation lookups (should work correctly with new sourceKeys)

## What's NOT Affected

### Essence Bottle Images
Essence images use variation NAMES, not sourceKeys:
- Path: `/essence-images/${variationName}.png`
- Example: `/essence-images/frost-cage.png`
- **No changes needed**

### Mek Images
Mek images use the FULL sourceKey (e.g., "555-555-555.webp"):
- Path: `/mek-images/1000px/${sourceKey}.webp`
- Example: `/mek-images/1000px/555-555-555.webp`
- **No changes needed**

### Database Records
All other database records use variation IDs and names for lookups:
- `essenceSlots` - uses variationId and variationName
- `essenceBalances` - uses variationId and variationName
- **No changes needed**

## Verification Checklist

- [ ] Run migration in Convex dashboard
- [ ] Check migration output (should show ~27 updates)
- [ ] Test essence system (balances, generation rates)
- [ ] Verify variation lookups work correctly
- [ ] Check admin panels display correctly
- [ ] Confirm no console errors

## Affected Variations

Repeating-digit sourceKeys that were updated:
- 000, 111, 222, 333, 444, 555, 666, 777, 888, 999
- Each appears 3 times (once per type: head, body, trait)
- Total: ~30 variations affected (some may not exist in collection)
- Actual count: 27 variations updated

## Rollback Plan

If needed, revert by:
1. Restore `src/lib/completeVariationRarity.ts` from git
2. Re-run `migrateToRarityBasedIds` mutation to sync database
