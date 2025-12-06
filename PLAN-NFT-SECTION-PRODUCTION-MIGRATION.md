# NFT Section Production Migration Plan

> ⚠️ **DATABASE ARCHITECTURE NOTE (December 2025)**
> This document was written during the dual-database era (Trout/Sturgeon).
> **We now use a UNIFIED SINGLE DATABASE**: Sturgeon (fabulous-sturgeon-691.convex.cloud)
> - Trout (wry-trout-962) is DEPRECATED and no longer used
> - The migration goals in this document remain valid - remove Trout references from NFT code
> - All new code should only reference Sturgeon

## Overview

**Goal:** Make the entire NFT admin section (all 4 tabs) always use Sturgeon (production) database, removing the confusing dual-database selector system.

**Why:** NFT-related data is inherently production data - real sales, real eligibility, real whitelists. There's no value in a "dev version" of this data.

**Current State:**
| Tab | Component | Current Database | Issue |
|-----|-----------|-----------------|-------|
| Commemorative | CommemorativeToken1Admin | Switchable (Trout/Sturgeon) | Unnecessary complexity |
| Whitelist Manager | WhitelistManagerAdmin | Switchable (Trout/Sturgeon) | Unnecessary complexity |
| JSON System | NMKRJSONGenerator | N/A (client-side only) | No changes needed |
| Campaigns | CampaignManagerWithDatabase | BROKEN | NFTInventoryTable ignores database selection |

**Target State:**
- All tabs always query Sturgeon (production)
- No database selector UI
- Clear "PRODUCTION DATA" visual indicator
- Mutation safety rails (confirmation dialogs)
- Read-only mode toggle as safety net

---

## PHASE 1: Safety Infrastructure & Preparation
**Estimated scope: Foundation work before any migration**

### 1.1 Create Production-Only Database Context

**File:** `src/contexts/ProductionDatabaseContext.tsx` (NEW)

**Purpose:** A simplified context that ONLY connects to Sturgeon, replacing the switchable DatabaseContext for NFT components.

**Features:**
- Always uses `sturgeonClient`
- Built-in `readOnlyMode` state (default: true)
- `enableMutations()` function requiring explicit confirmation
- Visual state for UI indicators

**Implementation:**
```typescript
// New context that ONLY uses Sturgeon (production)
// - No database switching
// - Read-only by default
// - Explicit mutation enablement with confirmation
```

### 1.2 Create Production Safety Banner Component

**File:** `src/components/admin/ProductionBanner.tsx` (NEW)

**Purpose:** Consistent visual indicator across all NFT tabs showing:
- "PRODUCTION DATA" warning
- Current read-only/mutation status
- Toggle button to enable mutations (with confirmation dialog)

**Design:**
- Red/orange banner when mutations enabled
- Green banner when read-only
- Pulsing indicator for production status
- Clear labeling: "You are viewing LIVE production data"

### 1.3 Create Mutation Confirmation Dialog

**File:** `src/components/admin/MutationConfirmDialog.tsx` (NEW)

**Purpose:** Reusable confirmation dialog for any mutation attempt

**Features:**
- Explains what action is about to happen
- Shows "This affects REAL users on the LIVE site"
- Requires typing "CONFIRM" or similar
- Cancel button prominently displayed

### 1.4 Audit & Document All Mutations

**Task:** Create a reference list of every mutation in the NFT section

**CommemorativeToken1Admin mutations:**
- `api.nftEligibility.setActiveSnapshot`
- `api.nftEligibility.clearActiveSnapshot`

**WhitelistManagerAdmin mutations:**
- `api.whitelists.initializeDefaultCriteria`
- `api.whitelists.deleteWhitelist`
- `api.whitelists.generateWhitelist`
- `api.whitelists.removeUserFromWhitelist`
- `api.whitelists.addUserToWhitelistByCompanyName`
- `api.whitelists.addUserToWhitelistByAddress`
- `api.whitelists.createSnapshot`
- `api.whitelists.deleteSnapshot`
- `api.whitelists.createManualWhitelist`

**Campaigns tab mutations:**
- `api.commemorativeNFTReservationsCampaign.toggleCampaignReservationCleanup`
- `api.commemorativeNFTReservationsCampaign.cleanupExpiredCampaignReservationsMutation`
- `api.commemorativeCampaigns.syncCampaignCounters`
- `api.commemorativeCampaigns.batchUpdateNFTImages`

### 1.5 Phase 1 Deliverables Checklist

- [ ] ProductionDatabaseContext.tsx created
- [ ] ProductionBanner.tsx created
- [ ] MutationConfirmDialog.tsx created
- [ ] All mutations documented
- [ ] Unit test safety components work correctly
- [ ] No existing functionality broken

---

## PHASE 2: Component Migration
**Estimated scope: Update each tab to use production-only**

### 2.1 Migrate CommemorativeToken1Admin

**File:** `src/components/CommemorativeToken1Admin.tsx`

**Current state:**
- Uses `<DatabaseProvider>` wrapper
- Has own database selector dropdown
- Uses `useDatabaseContext()` for queries/mutations

**Changes needed:**
1. Replace `<DatabaseProvider>` with `<ProductionDatabaseProvider>`
2. Remove database selector dropdown UI
3. Add `<ProductionBanner />` at top
4. Wrap all mutations with confirmation dialog
5. Update imports

**Before:**
```tsx
<DatabaseProvider>
  <CommemorativeContent />
</DatabaseProvider>
```

**After:**
```tsx
<ProductionDatabaseProvider>
  <ProductionBanner />
  <CommemorativeContent />
</ProductionDatabaseProvider>
```

### 2.2 Migrate WhitelistManagerAdmin

**File:** `src/components/WhitelistManagerAdmin.tsx`

**Current state:**
- Uses `<DatabaseProvider>` wrapper
- Has own database selector dropdown
- Uses `useDatabaseContext()` for queries/mutations
- Has many mutations (whitelist management)

**Changes needed:**
1. Replace `<DatabaseProvider>` with `<ProductionDatabaseProvider>`
2. Remove database selector dropdown UI
3. Add `<ProductionBanner />` at top
4. Wrap ALL mutations with confirmation dialog (this component has many!)
5. Update imports

**Special consideration:** This component has 9+ mutations. Each needs safety wrapping.

### 2.3 NMKRJSONGenerator - No Changes

**File:** `src/components/admin/nft/NMKRJSONGenerator.tsx`

**Current state:** Client-side only, uses localStorage, no Convex queries

**Changes needed:** NONE - this component doesn't access any database

**Optional:** Could add ProductionBanner for visual consistency, but not required

### 2.4 Migrate Campaigns Tab (Most Complex)

**Files:**
- `src/app/admin/page.tsx` (NFTAdminTabs function, lines 4528-4719)
- `src/app/admin/page.tsx` (CampaignManagerWithDatabase function, lines 4374-4524)
- `src/components/admin/campaign/NFTInventoryTable.tsx`

**Current state:**
- NFTAdminTabs has database selector
- Passes `troutClient` or `sturgeonClient` based on selection
- CampaignManagerWithDatabase receives and passes client
- NFTInventoryTable IGNORES the client prop (uses useQuery directly)

**Changes needed:**

#### 2.4.1 Update NFTAdminTabs
1. Remove `campaignDatabase` state
2. Remove database selector UI
3. Always use `sturgeonClient`
4. Add ProductionBanner
5. Simplify props passed to CampaignManagerWithDatabase

**Before:**
```tsx
const [campaignDatabase, setCampaignDatabase] = useState<'trout' | 'sturgeon'>('trout');
const client = campaignDatabase === 'trout' ? troutClient : sturgeonClient;
```

**After:**
```tsx
const client = sturgeonClient; // Always production
```

#### 2.4.2 Update CampaignManagerWithDatabase
1. Remove `campaignDatabase` prop (no longer needed)
2. Always expect Sturgeon client
3. Wrap mutations with confirmation dialog

#### 2.4.3 FIX NFTInventoryTable (Critical)

**This is the broken component that needs the most work.**

**Current props:**
```typescript
interface NFTInventoryTableProps {
  campaignId: Id<"commemorativeCampaigns">;
}
```

**New props:**
```typescript
interface NFTInventoryTableProps {
  campaignId: Id<"commemorativeCampaigns">;
  client: ConvexReactClient;
}
```

**Current query (broken):**
```typescript
const inventory = useQuery(
  api.commemorativeCampaigns.getCampaignInventory,
  { campaignId }
);
```

**New query (fixed):**
```typescript
// Option A: Use client.query() with useEffect
const [inventory, setInventory] = useState<NFTInventory[] | undefined>();

useEffect(() => {
  if (!client) return;

  const fetchInventory = async () => {
    const data = await client.query(
      api.commemorativeCampaigns.getCampaignInventory,
      { campaignId }
    );
    setInventory(data);
  };

  fetchInventory();
  const interval = setInterval(fetchInventory, 3000); // Poll for updates

  return () => clearInterval(interval);
}, [client, campaignId]);
```

**Also fix:**
- `getCompanyNamesForWallets` query - same pattern
- `batchUpdateNFTImages` mutation - use client.mutation() + confirmation

### 2.5 Phase 2 Deliverables Checklist

- [ ] CommemorativeToken1Admin migrated
- [ ] WhitelistManagerAdmin migrated
- [ ] NFTAdminTabs updated (remove selector)
- [ ] CampaignManagerWithDatabase updated
- [ ] NFTInventoryTable FIXED to use client prop
- [ ] All tabs show ProductionBanner
- [ ] All mutations wrapped with confirmation
- [ ] Manual testing of each tab complete

---

## PHASE 3: Cleanup, Polish & Verification
**Estimated scope: Remove dead code, add polish, verify everything works**

### 3.1 Remove Old DatabaseContext Usage

**File:** `src/contexts/DatabaseContext.tsx`

**Decision:** Keep or remove?

**Option A - Keep:** Other parts of the app might use it
**Option B - Remove:** If only NFT section used it

**Task:** Search codebase for all `DatabaseContext` imports. If only NFT components use it, remove entirely. If other components use it, leave it but ensure NFT section doesn't import it.

### 3.2 Clean Up NFTAdminTabs

**Remove:**
- `campaignDatabase` state variable
- `setCampaignDatabase` function
- Database selector JSX
- All Trout-related logic
- `troutClient` prop (if not needed elsewhere)

**Simplify:**
- Component should be much shorter
- Single client reference throughout

### 3.3 Clean Up CampaignManagerWithDatabase

**Consider:** This function might be unnecessary now. Could potentially inline into NFTAdminTabs since there's no database switching logic.

**Or rename:** `CampaignManager` (remove "WithDatabase" since there's only one database)

### 3.4 Remove Unused Imports

**Files to check:**
- `src/app/admin/page.tsx` - remove troutClient references if unused
- `src/components/CommemorativeToken1Admin.tsx` - remove old DatabaseContext
- `src/components/WhitelistManagerAdmin.tsx` - remove old DatabaseContext

### 3.5 Update Admin Page Header/Description

**Location:** The NFT section header in admin page

**Current:** "Manage NFT campaigns, eligibility, and distribution..."

**Add:** Visual indicator that this entire section uses production data

### 3.6 Add Visual Polish

**Consistent styling across all tabs:**
- Same ProductionBanner appearance
- Same mutation confirmation dialog style
- Same color coding (production = red/orange accents)

**Optional enhancements:**
- Subtle background tint to indicate "production mode"
- Icon consistency (warning icons, etc.)

### 3.7 Comprehensive Testing

**Test each tab:**

**Commemorative Tab:**
- [ ] Loads data from Sturgeon
- [ ] Shows ProductionBanner
- [ ] Mutations require confirmation
- [ ] Read-only mode works
- [ ] Data matches production dashboard

**Whitelist Manager Tab:**
- [ ] Loads whitelists from Sturgeon
- [ ] Shows ProductionBanner
- [ ] All 9+ mutations require confirmation
- [ ] Can create/delete whitelists (with confirmation)
- [ ] Data matches production dashboard

**JSON System Tab:**
- [ ] Still works (client-side only)
- [ ] No errors in console

**Campaigns Tab:**
- [ ] Campaign list loads from Sturgeon
- [ ] Campaign counters show Sturgeon data
- [ ] NFT Inventory table shows Sturgeon data (THE FIX!)
- [ ] Counters and table match (no more mismatch)
- [ ] Sync Counters works on Sturgeon
- [ ] Cleanup works on Sturgeon
- [ ] All mutations require confirmation

### 3.8 Documentation Update

**Update CLAUDE.md:**
- Document that NFT section always uses production
- Remove references to database switching for NFT components
- Add warning about production mutations

### 3.9 Phase 3 Deliverables Checklist

- [ ] Dead code removed
- [ ] Unused imports cleaned up
- [ ] Component names updated (if applicable)
- [ ] Visual polish applied
- [ ] All tabs tested thoroughly
- [ ] CLAUDE.md updated
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Production data displays correctly in all tabs

---

## Risk Assessment

### Low Risk
- NMKRJSONGenerator (no changes needed)
- Adding ProductionBanner (additive change)
- Adding MutationConfirmDialog (additive change)

### Medium Risk
- Migrating CommemorativeToken1Admin (well-structured, has context already)
- Migrating WhitelistManagerAdmin (many mutations to wrap)

### High Risk
- Fixing NFTInventoryTable (core logic change, polling vs reactive)
- Removing database switching from NFTAdminTabs (many dependencies)

### Mitigation
- Test each phase thoroughly before moving to next
- Keep old code commented (not deleted) until fully verified
- Have rollback plan (git revert if needed)

---

## Success Criteria

**Phase 1 Complete When:**
- New context and components created
- No existing functionality broken
- Safety infrastructure tested

**Phase 2 Complete When:**
- All 4 tabs use Sturgeon exclusively
- Database selector UI removed from all tabs
- NFTInventoryTable displays correct (Sturgeon) data
- Mutations require confirmation

**Phase 3 Complete When:**
- No dead code remaining
- All tests pass
- Visual polish applied
- Documentation updated
- User can manage NFT data confidently knowing it's always production

---

## Files to Modify (Summary)

### New Files (Phase 1)
- `src/contexts/ProductionDatabaseContext.tsx`
- `src/components/admin/ProductionBanner.tsx`
- `src/components/admin/MutationConfirmDialog.tsx`

### Modified Files (Phase 2)
- `src/components/CommemorativeToken1Admin.tsx`
- `src/components/WhitelistManagerAdmin.tsx`
- `src/app/admin/page.tsx` (NFTAdminTabs + CampaignManagerWithDatabase)
- `src/components/admin/campaign/NFTInventoryTable.tsx`

### Potentially Removed (Phase 3)
- Database selector UI code
- Trout client references in NFT section
- Old DatabaseContext imports (in NFT components only)

---

## Estimated Effort

| Phase | Tasks | Complexity |
|-------|-------|------------|
| Phase 1 | 5 tasks | Medium - Creating new infrastructure |
| Phase 2 | 5 tasks | High - Core migration work, fixing NFTInventoryTable |
| Phase 3 | 9 tasks | Low-Medium - Cleanup and verification |

**Recommendation:** Complete each phase fully before starting the next. Phase 2.4 (Campaigns tab) is the most complex and should be given extra attention.
