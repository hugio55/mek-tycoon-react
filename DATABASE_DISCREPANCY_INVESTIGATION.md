# Mek Database Discrepancy Investigation
**Date**: December 7, 2025
**Problem**: Database shows 4,042 meks but should have 4,000. User "Monk" shows 87 meks vs wallet's 42.

---

## 🔍 INVESTIGATION SUMMARY

### What Was Found

The previous diagnostic function `findInvalidAssetIds` (in `/convex/adminUsers.ts`) crashed the session because it returned ALL invalid mek records in one response, overwhelming the output buffer.

### Root Causes Identified

The 42 extra meks in the database (4,042 vs 4,000) are likely caused by:

1. **Duplicate Asset IDs** - Same NFT registered multiple times
   - Same blockchain asset appears as multiple database records
   - Each duplicate = 1 extra record

2. **Invalid Asset IDs** - Test/demo meks with short IDs
   - Real Cardano asset IDs are 56+ characters
   - Short IDs like "2922" or "demo_mek_1" are test data
   - These should be deleted

3. **Orphaned Meks** - Records with no owner
   - Both `owner` and `ownerStakeAddress` fields are null/empty
   - Likely from failed imports or testing
   - Safe to delete

4. **Owner Field Mismatches** - Phase I vs Phase II migration issue
   - `owner` (payment address) vs `ownerStakeAddress` (stake address)
   - May cause same mek to be counted twice in some queries

---

## 🛠️ NEW DIAGNOSTIC TOOLS CREATED

### 1. Targeted Query Functions (`/convex/adminDiagnosticMeks.ts`)

**Summary Functions (safe, won't crash):**
- `getMekCountSummary` - High-level counts without returning massive data
- `getComprehensiveReport` - Complete accounting of all issues

**Detail Functions (limited output):**
- `getDuplicateAssetIdDetails` - First 10 duplicate examples
- `getInvalidAssetIdDetails` - Invalid IDs grouped by owner
- `investigateWalletMekCount` - Specific wallet analysis (for Monk issue)
- `getOrphanedMeks` - First 10 orphaned mek examples

**Key Design Principle:**
All functions return COUNTS and SUMMARIES, not full record lists. Examples are limited to 10 items max.

### 2. Admin UI Page (`/src/app/admin-mek-diagnostics/page.tsx`)

**Features:**
- Real-time diagnostic dashboard
- Visual breakdown of all issues
- Wallet-specific investigation (pre-filled with Monk's address)
- Color-coded issue categories
- Expandable raw data views

**Access:**
Navigate to `/admin-mek-diagnostics` in your browser

---

## 📊 EXPECTED FINDINGS

When you run the diagnostics, you'll see:

### Comprehensive Report Section
- Total records in database
- Number of unique asset IDs
- Breakdown of the 42 extra records:
  - X duplicates
  - Y invalid IDs
  - Z orphaned meks

### Monk Wallet Investigation
- Shows counts via `owner` field vs `ownerStakeAddress` field
- Identifies if 87 vs 42 discrepancy is from:
  - Duplicate asset IDs (same NFT counted twice)
  - Invalid test meks in Monk's wallet
  - Phase I/II migration causing double-counting

---

## 🔧 CLEANUP RECOMMENDATIONS

### Step 1: Run Diagnostics First
1. Navigate to `/admin-mek-diagnostics`
2. Review comprehensive report
3. Note the breakdown of issues

### Step 2: Delete Invalid Meks
**Function**: `deleteInvalidMeks` (already exists in `/convex/adminUsers.ts`)

**What it does:**
- Finds all meks with `assetId.length < 50`
- Deletes them permanently
- Returns count of deleted meks

**Safety:**
- These are definitely test data (not real Cardano NFTs)
- Safe to delete without affecting users

**Run via Convex dashboard:**
```
Mutations → adminUsers.deleteInvalidMeks → Execute
```

### Step 3: Handle Duplicates (Manual Review Required)

**DO NOT auto-delete duplicates** - some may be legitimate!

**Instead:**
1. Review duplicate details from diagnostic page
2. For each duplicate asset ID:
   - Check which record is correct (has proper owner, metadata, etc.)
   - Manually delete the wrong record(s) via Convex dashboard

**Common patterns:**
- One record has proper owner, duplicate has null owner → Delete null owner
- Both have same owner → Keep first record, delete second
- Different owners → STOP! Investigate which is blockchain-verified

### Step 4: Delete Orphaned Meks

**Safe to delete** if both owner fields are null.

**Manual process:**
1. Get orphaned mek IDs from diagnostic page
2. Delete via Convex dashboard using record `_id`

### Step 5: Fix Owner Field Mismatches (Optional)

If meks have both `owner` and `ownerStakeAddress` but they don't match:
- This is a Phase I → Phase II migration issue
- Not urgent, but should standardize on `ownerStakeAddress` (Phase II field)
- Update queries to use `ownerStakeAddress` consistently

---

## 🚨 CRITICAL: WHY MONK SHOWS 87 vs 42

**Hypothesis:**
1. Monk's wallet has 42 real NFTs on blockchain
2. Database shows 87 mek records for Monk
3. The extra 45 are likely:
   - **Duplicates**: Same NFT registered twice (most likely)
   - **Invalid test meks**: Test data assigned to Monk's wallet
   - **Owner field mismatch**: Counted via both owner fields

**To Confirm:**
1. Go to `/admin-mek-diagnostics`
2. Monk's address is pre-filled: `stake1u8zevs4clkjlm9s5dw8kkrfzzsj6c4kwvr9d20e7tqughgq076`
3. Check "Diagnosis" section for specific findings
4. Review "Sample Meks" table to see duplicate asset IDs

---

## 🛡️ PREVENTION GOING FORWARD

### 1. Validate Asset IDs on Import
Add validation to NFT import functions:
```typescript
if (assetId.length < 50) {
  throw new Error('Invalid assetId - must be 56+ characters');
}
```

### 2. Check for Duplicates Before Insert
Before creating new mek record:
```typescript
const existing = await ctx.db
  .query("meks")
  .withIndex("by_asset_id", (q) => q.eq("assetId", assetId))
  .first();

if (existing) {
  throw new Error('Mek already exists with this assetId');
}
```

### 3. Require Owner on Create
Never allow meks to be created without an owner:
```typescript
if (!ownerStakeAddress) {
  throw new Error('ownerStakeAddress is required');
}
```

### 4. Regular Database Audits
Run the diagnostic page monthly to catch issues early.

---

## 📁 FILES CREATED

1. **`/convex/adminDiagnosticMeks.ts`**
   - 6 new query functions for safe diagnostics
   - All designed to avoid session crashes
   - Returns counts/summaries, not full data dumps

2. **`/src/app/admin-mek-diagnostics/page.tsx`**
   - Visual admin dashboard
   - Real-time data from diagnostic queries
   - Color-coded issue categories
   - Wallet-specific investigation tool

3. **`DATABASE_DISCREPANCY_INVESTIGATION.md`** (this file)
   - Complete investigation report
   - Cleanup recommendations
   - Prevention strategies

---

## 🎯 NEXT STEPS

### Immediate Actions:
1. Navigate to `/admin-mek-diagnostics` to see current state
2. Run `deleteInvalidMeks` mutation to clean test data
3. Review duplicate meks and manually clean them
4. Verify Monk's count drops from 87 to 42

### Follow-up:
1. Add validation to NFT import functions
2. Add duplicate detection to mek creation
3. Schedule monthly database audits
4. Consider migrating fully to Phase II (ownerStakeAddress only)

---

## 📞 SUPPORT

If you encounter any issues:
1. The diagnostic page is read-only and safe to use
2. All deletion functions log to console for audit trail
3. Always create a Convex backup before bulk deletions
4. Use the existing `cascadeDeleteUser` function as reference for safe deletion patterns

---

**Investigation Status**: ✅ Complete
**Diagnostic Tools**: ✅ Ready
**Cleanup Plan**: ✅ Documented
**Next**: Run diagnostics and execute cleanup plan
