# Phase II: Meks Table as Single Source of Truth

## Overview

**Goal**: Make the `meks` table the **single source of truth** for all 4000 Mek NFTs, eliminating the duplicated `goldMining.ownedMeks[]` array.

**Current State (Phase I)**:
- `goldMining.ownedMeks[]` - Array of mek objects per user (denormalized, duplicated data)
- `meks` table exists but isn't fully utilized for ownership queries
- Frontend queries `api.goldMining.getGoldMiningData` everywhere

**Target State (Phase II)**:
- `meks` table is the master record for all 4000 NFTs
- `meks.ownerStakeAddress` is THE owner field (FK to users.stakeAddress)
- Frontend queries `meks` table via `userData.ts` or `meks.ts`
- `goldMining` table deleted entirely

---

## Step 1: Add Missing Fields to `meks` Table

The `goldMining.ownedMeks[]` has level boost fields that `meks` table lacks:

| goldMining.ownedMeks[] Field | meks Table Field | Status |
|------------------------------|------------------|--------|
| `assetId` | `assetId` | ✅ Exists |
| `policyId` | - | ❌ Missing (add) |
| `assetName` | `assetName` | ✅ Exists |
| `imageUrl` | `iconUrl` | ✅ Exists (different name) |
| `goldPerHour` | `goldRate` | ✅ Exists (different name) |
| `rarityRank` | `rarityRank` | ✅ Exists |
| `headVariation` | `headVariation` | ✅ Exists |
| `bodyVariation` | `bodyVariation` | ✅ Exists |
| `itemVariation` | `itemVariation` | ✅ Exists |
| `sourceKey` | `sourceKey` | ✅ Exists |
| `sourceKeyBase` | `sourceKeyBase` | ✅ Exists |
| `customName` | `customName` | ✅ Added (Phase II) |
| `baseGoldPerHour` | - | ❌ Missing (add as `baseGoldRate`) |
| `currentLevel` | - | ❌ Missing (add as `mekLevel`, not `level` which is battle) |
| `levelBoostPercent` | - | ❌ Missing (add) |
| `levelBoostAmount` | - | ❌ Missing (add) |
| `effectiveGoldPerHour` | - | ❌ Missing (add as `effectiveGoldRate`) |

### Fields to Add to schema.ts `meks` table:

```typescript
// Policy ID for blockchain verification
policyId: v.optional(v.string()),

// ═══════════════════════════════════════════════════════════════════════════
// PHASE II: Mek Leveling System
// ═══════════════════════════════════════════════════════════════════════════
baseGoldRate: v.optional(v.number()),      // Original rate from rarity (immutable)
mekLevel: v.optional(v.number()),          // Current level (1-10), default 1
levelBoostPercent: v.optional(v.number()), // Boost percentage from level (0-90%)
levelBoostAmount: v.optional(v.number()),  // Actual boost amount in gold/hr
effectiveGoldRate: v.optional(v.number()), // baseGoldRate + levelBoostAmount
```

**Note**: Using `mekLevel` instead of `level` because `level` already exists for legacy battle system.

---

## Step 2: Backend Functions to Create/Update

### A. `convex/meks.ts` (Expand existing)

```
Already Created:
✅ getMeksByOwner(stakeAddress) - Get all meks owned by user
✅ getMekByAssetId(assetId) - Get single mek
✅ getMeksByAssetIds(assetIds) - Get multiple meks
✅ getMekCount(stakeAddress) - Get count of meks
✅ setMekName(stakeAddress, mekAssetId, newName) - Set custom name
✅ checkMekNameAvailability(mekName, currentMekAssetId) - Check name available

Need to Add:
- levelUpMek(stakeAddress, mekAssetId) - Spend gold to level up a mek
- getMekLevelCost(currentLevel) - Get cost to level up
- syncMekFromBlockchain(assetId, ownerStakeAddress) - Update mek record from blockchain
```

### B. `convex/userData.ts` (Expand existing)

The `getUserData` function already queries `meks` table! Just needs minor updates:

```
Current:
✅ getUserData(walletAddress) - Returns user + ownedMeks from meks table

Needs Update:
- Include level boost fields in mek mapping
- Return calculated totals (totalGoldRate, baseGoldRate, boostGoldRate)
```

### C. `convex/blockchainVerification.ts` (Update)

```
Current: Updates goldMining.ownedMeks[] after verification
Target: Update meks.ownerStakeAddress after verification

Key Function: verifyNFTOwnership action
- Should update meks table directly
- Set ownerStakeAddress on each verified mek
- Clear ownerStakeAddress on meks no longer owned
```

---

## Step 3: Frontend Migration

### Files That Import `api.goldMining.getGoldMiningData`:

| File | Current Usage | Migration Action |
|------|---------------|------------------|
| `src/components/NavigationBar.tsx` | Gets mek count, company name | Use `api.userData.getUserData` |
| `src/components/UnifiedHeader.tsx` | Gets mek count, company name | Use `api.userData.getUserData` |
| `src/app/home/page.tsx` | Gets ownedMeks array | Use `api.userData.getUserData` |
| `src/app/essence-market/page.tsx` | Gets ownedMeks for selection | Use `api.meks.getMeksByOwner` |

### Migration Pattern:

**Before (Phase I)**:
```typescript
const goldData = useQuery(api.goldMining.getGoldMiningData, { walletAddress });
const mekCount = goldData?.ownedMeks?.length ?? 0;
const companyName = goldData?.companyName;
```

**After (Phase II)**:
```typescript
const userData = useQuery(api.userData.getUserData, { walletAddress });
const mekCount = userData?.mekCount ?? 0;
const companyName = userData?.corporationName;
const ownedMeks = userData?.ownedMeks ?? [];
```

---

## Step 4: Data Migration

Since we're starting fresh (no user migration), data migration is simple:

1. **New users**: When user connects wallet:
   - Create `users` record with stakeAddress
   - Blockchain verification populates `meks.ownerStakeAddress`
   - No goldMining record created

2. **Existing meks table**: Already has 4000 NFTs from previous sync
   - Need to populate `ownerStakeAddress` from blockchain
   - Need to set initial values for level fields (mekLevel=1, baseGoldRate from goldRate)

3. **Cleanup**: After migration complete, delete `goldMining` table entirely

---

## Step 5: Implementation Order

### Phase 2A: Schema & Backend (Safe to do now)
1. ✅ Add new fields to `meks` table in schema.ts
2. ✅ Create/expand `convex/meks.ts` with query functions
3. ⬜ Update `convex/userData.ts` to return complete mek data with levels
4. ⬜ Create mek leveling functions in `meks.ts`

### Phase 2B: Blockchain Verification (Requires careful testing)
5. ⬜ Update `blockchainVerification.ts` to write to meks table
6. ⬜ Add migration action to populate `ownerStakeAddress` for existing meks
7. ⬜ Test with dev database (Trout) first

### Phase 2C: Frontend Migration (After backend stable)
8. ⬜ Update `userData.ts` query to be complete replacement for goldMining
9. ⬜ Migrate NavigationBar.tsx to use userData
10. ⬜ Migrate UnifiedHeader.tsx to use userData
11. ⬜ Migrate home/page.tsx to use userData
12. ⬜ Migrate essence-market/page.tsx to use meks queries

### Phase 2D: Cleanup (After frontend working)
13. ⬜ Verify no remaining references to goldMining
14. ⬜ Delete goldMining table from schema
15. ⬜ Delete goldMining.ts backend file

---

## Key Decisions

### Q: Where does accumulated gold live?
**A**: On `users.gold` - single spendable balance per user, NOT per mek.

### Q: Where does gold income rate come from?
**A**: Sum of `meks.effectiveGoldRate` for all meks where `ownerStakeAddress = user.stakeAddress`

### Q: Where do level boosts live?
**A**: On each mek record (`mekLevel`, `levelBoostPercent`, `levelBoostAmount`)

### Q: What about job slots?
**A**: `userJobSlots` table remains separate - slots reference meks by assetId

### Q: What about essence?
**A**: `userEssence` table remains separate - sparse storage for 291 types

---

## Benefits of This Architecture

1. **Single Source of Truth**: One place for mek data, no duplication
2. **Efficient Queries**: Index by ownerStakeAddress for fast ownership lookups
3. **Atomic Updates**: Update mek record directly, not nested array
4. **NFT Tracking**: Can see full history of a mek (who owned it, what they named it)
5. **Scalability**: Works for any number of users without duplicating mek data
6. **Clean Schema**: Clear separation between users, meks, slots, essence

---

## Files Modified in This Plan

### Schema
- `convex/schema.ts` - Add 5 new fields to meks table

### Backend (Create/Update)
- `convex/meks.ts` - Expand with level functions
- `convex/userData.ts` - Update to return complete mek data
- `convex/blockchainVerification.ts` - Update to write to meks table

### Frontend (Migrate)
- `src/components/NavigationBar.tsx`
- `src/components/UnifiedHeader.tsx`
- `src/app/home/page.tsx`
- `src/app/essence-market/page.tsx`

### Delete (After migration)
- `convex/goldMining.ts`
- `goldMining` table from schema
