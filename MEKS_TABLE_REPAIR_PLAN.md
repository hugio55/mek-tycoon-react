# Meks Table Complete Repair Plan

## Executive Summary

The meks table has data integrity issues across both databases that need to be resolved to ensure all 4,000 Mekanisms are correctly represented and accessible to players.

---

## Current State Analysis

### Trout (Dev Database) - MOSTLY GOOD
| Metric | Status | Value |
|--------|--------|-------|
| Total meks | ✅ | 4,000 |
| mekNumber populated | ✅ | 4,000/4,000 |
| Variation data | ✅ | All correct (repaired) |
| Missing meks | ✅ | 0 |

**Known quirk:** 42 ChampCo meks have "Mek #" naming instead of "Mekanism #" (cosmetic only, functional)

### Sturgeon (Production Database) - NEEDS REPAIR
| Metric | Status | Value |
|--------|--------|-------|
| Total meks | ❌ | 3,955 (missing 45) |
| mekNumber populated | ❌ | 0/3,955 |
| Variation data | ❓ | Untested |
| Missing meks | ❌ | 45 |

**Impact:** 43 player-owned meks are invisible (42 ChampCo + 1 other player)

---

## Root Cause Analysis

### Why 45 Meks Are Missing from Production

1. **Original import**: 4,000 "Mekanism #XXXX" meks imported with correct data
2. **Blockfrost sync**: When ChampCo connected wallet, `blockfrostNftFetcher.ts` created NEW entries
3. **Naming conflict**: New entries used "Mek #XX" naming (line 294 of blockfrostNftFetcher.ts)
4. **Deduplication**: Logic preferred long assetIds (Cardano format) over short ones
5. **Wrong survivor**: The "Mek #" entries (with wrong/missing variation data) survived dedup
6. **Production divergence**: Production may have been imported before dedup ran, or with different logic

### Why Variation Data Gets Corrupted

The `blockfrostNftFetcher.ts` extracts NFTs from on-chain but:
- Does NOT look up variations from `mekRarityMaster.json`
- Sets variations to empty/null values
- Relies on later processes to populate variation data (which may not run)

### Why mekNumber Field Is Empty on Production

The mekNumber field migration was only run on Trout, never deployed to production.

---

## Repair Plan

### Phase 1: Audit Production (No Changes)

**Goal:** Understand exact state of production before making changes

#### Step 1.1: Check variation data on production
```
Run: previewVariationRepair on production
Expected: Count of meks with wrong variation data
```

#### Step 1.2: Verify the 45 missing mek numbers
```
Already done - confirmed missing:
#14, #176, #179, #253, #304, #338, #406, #795, #860, #995,
#1052, #1059, #1252, #1286, #1337, #1436, #1568, #1785, #1817, #1917,
#2024, #2051, #2071, #2147, #2191, #2268, #2557, #2561, #2683, #2685,
#2722, #2829, #2871, #2922, #3040, #3177, #3185, #3262, #3386, #3520,
#3575, #3605, #3678, #3910, #3972
```

#### Step 1.3: Document ownership of existing production meks
```
Export: List of all meks with owners on production
Purpose: Preserve ownership data before any restore
```

---

### Phase 2: Create Backup (Safety Net)

**Goal:** Ensure we can roll back if anything goes wrong

#### Step 2.1: Full production backup
```
Use: Deployment Control Center → Full Backup
Or: npx convex export --prod
Save: meks table export with timestamp
```

#### Step 2.2: Verify backup integrity
```
Check: Backup contains all 3,955 meks
Check: Ownership data preserved
Check: Variation data preserved
```

---

### Phase 3: Restore Missing 45 Meks

**Goal:** Add the 45 missing meks to production

#### Option A: Copy from Trout (Recommended)
Create mutation to:
1. Query the 45 specific meks from Trout
2. Insert them into production with correct data
3. Preserve ownership from Trout (ChampCo owns 42, one other owns 1, 2 unowned)

#### Option B: Restore from backup file
1. Load `trout_meks_array.json` or similar backup
2. Find the 45 missing entries
3. Insert with correct ownership

#### Implementation:
```typescript
// New mutation: restoreMissingMeks
// - Takes array of mek numbers to restore
// - Looks up full data from mekRarityMaster.json
// - Inserts with proper ownership from Trout data
// - Protected with unlock code
```

---

### Phase 4: Populate mekNumber Field

**Goal:** All 4,000 meks have mekNumber field populated

#### Step 4.1: Create/verify migration function
```typescript
// Migration: populateMekNumbers
// - Parse mekNumber from assetName
// - Update all meks missing the field
// - Already exists in deduplicateMeks.ts or similar
```

#### Step 4.2: Run on production
```
After: Phase 3 complete (all 4,000 meks exist)
Run: populateMekNumbers migration on production
Verify: hasMekNumberField === 4000
```

---

### Phase 5: Verify Variation Data

**Goal:** All 4,000 meks have correct head/body/item variations

#### Step 5.1: Run variation preview on production
```
Run: previewVariationRepair --prod
Expected: 0 meks needing repair (if restore used correct data)
          OR X meks needing repair (if restore used raw data)
```

#### Step 5.2: Repair if needed
```
If needsRepair > 0:
  Run: repairVariationData with unlock code
  Verify: All 4,000 correct
```

---

### Phase 6: Prevent Future Issues

**Goal:** Ensure blockfrost sync doesn't corrupt data again

#### Option A: Fix blockfrostNftFetcher.ts
```typescript
// When creating/updating mek entries:
// 1. Look up sourceKey from on-chain metadata
// 2. Look up variations from mekRarityMaster.json
// 3. Use "Mekanism #" naming convention
// 4. Never overwrite existing variation data with empty values
```

#### Option B: Add validation layer
```typescript
// Before any mek write:
// - If sourceKey exists, verify variations match mekRarityMaster
// - If variations missing, look them up from sourceKey
// - Reject writes that would corrupt data
```

#### Option C: Make mekRarityMaster the source of truth
```typescript
// Runtime variation lookup:
// - Already implemented in tradeFloor.ts
// - Always use sourceKey → mekRarityMaster lookup
// - Database variation fields become cache only
```

---

### Phase 7: Final Validation

**Goal:** Confirm everything is correct

#### Checklist:
- [ ] Production has exactly 4,000 meks
- [ ] All meks have mekNumber field populated
- [ ] All meks have correct variation data (via sourceKey lookup)
- [ ] ChampCo can see all 87 of their meks
- [ ] Trade floor matching works correctly
- [ ] No duplicate mek numbers
- [ ] No orphaned records

#### Validation queries:
```
findMissingMekNumbers → missingCount: 0
previewVariationRepair → needsRepair: 0
findDuplicates → duplicateMekNumbers: 0
```

---

## Implementation Order

```
1. [AUDIT]    Phase 1: Check production state (read-only)
2. [BACKUP]   Phase 2: Create full backup
3. [RESTORE]  Phase 3: Add 45 missing meks
4. [MIGRATE]  Phase 4: Populate mekNumber field
5. [REPAIR]   Phase 5: Fix any variation data issues
6. [PREVENT]  Phase 6: Fix root cause in blockfrost fetcher
7. [VALIDATE] Phase 7: Confirm everything correct
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Backup fails | Low | High | Verify backup before changes |
| Wrong ownership restored | Medium | High | Cross-reference Trout ownership |
| Duplicate meks created | Medium | Medium | Check for existing before insert |
| Variation data still wrong | Low | Medium | Run repair after restore |
| Blockfrost re-corrupts data | High | High | Fix fetcher in Phase 6 |

---

## Estimated Effort

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: Audit | 15 min | None |
| Phase 2: Backup | 10 min | None |
| Phase 3: Restore | 30 min | Phases 1-2 |
| Phase 4: mekNumber | 10 min | Phase 3 |
| Phase 5: Variations | 15 min | Phase 4 |
| Phase 6: Prevention | 1-2 hrs | None (can parallel) |
| Phase 7: Validation | 15 min | Phases 3-5 |

**Total: ~2.5-3.5 hours**

---

## Open Questions

1. **Ownership source of truth**: Should Trout ownership be copied to production, or should production re-sync from on-chain?

2. **"Mek #" vs "Mekanism #" naming**: Should we standardize all to "Mekanism #" or leave ChampCo's as "Mek #"?

3. **When to run**: Should this be done during maintenance window when no users are active?

4. **Blockfrost behavior**: Should blockfrost fetcher be allowed to create new mek entries at all, or only update ownership on existing entries?

---

## Files Involved

| File | Purpose |
|------|---------|
| `convex/deduplicateMeks.ts` | Repair functions, queries |
| `convex/blockfrostNftFetcher.ts` | Root cause of corruption |
| `convex/mekRarityMaster.json` | Source of truth for variations |
| `backups/trout_meks_array.json` | Backup data source |
| `convex/schema.ts` | Meks table schema |

---

## Success Criteria

After completion:
- [ ] `findMissingMekNumbers --prod` returns 0 missing
- [ ] `previewVariationRepair --prod` returns 0 needing repair
- [ ] All 4,000 meks have mekNumber field
- [ ] ChampCo sees all 87 meks in their collection
- [ ] Trade floor finds Seafoam and other variations correctly
- [ ] No regression in existing functionality
