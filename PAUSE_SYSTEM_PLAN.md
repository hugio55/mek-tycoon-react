# PAUSE SYSTEM PLAN - Mek Upgrading & Snapshot Systems

> ⚠️ **DATABASE UPDATED (December 2025)**
> This document originally referenced Trout (wry-trout-962) as the development environment.
> **We now use a UNIFIED SINGLE DATABASE**: Sturgeon (fabulous-sturgeon-691.convex.cloud)
> All deployments now go directly to the unified Sturgeon database.

**Date:** December 1, 2025
**Target Environment:** Sturgeon (fabulous-sturgeon-691) - Unified Database
**Purpose:** Disable gold mining snapshots, Blockfrost API calls, and related cron jobs

---

## OVERVIEW

The Mekanism upgrading phase is complete. This plan disables all cron jobs related to:
- Blockchain snapshots (Blockfrost API calls)
- Gold backup snapshots
- Leaderboard updates
- Anti-cheat duplicate detection

**Infrastructure is preserved** - only scheduled tasks are disabled. The system can be re-enabled by uncommenting the cron jobs.

---

## CHANGES TO MAKE

### File: `convex/crons.ts`

#### DISABLE (Comment Out):

**1. Wallet Snapshot Checks (Lines 7-15)**
- Frequency: Every 24 hours
- Impact: Main Blockfrost consumer (~7,000 API calls/day)
- Calls: `api.goldMiningSnapshot.triggerSnapshot`

**2. Gold Backups (Lines 17-24)**
- Frequency: Every 12 hours
- Impact: Creates gold backup snapshots
- Calls: `api.goldBackups.triggerManualDailyBackup`

**3. Leaderboard Rankings (Lines 26-33)**
- Frequency: Every 6 hours
- Impact: Pre-computes leaderboard (users can't see - maintenance page)
- Calls: `internal.leaderboardUpdater.updateGoldLeaderboard`

**4. Auto-fix Asset Overlaps (Lines 64-71)**
- Frequency: Every 24 hours
- Impact: Anti-cheat Blockfrost calls
- Calls: `internal.duplicateWalletDetection.autoFixAssetOverlaps`

#### KEEP RUNNING (Do NOT Touch):

- Lines 35-42: `cleanup expired nonces` - Wallet auth (needed for re-enable)
- Lines 44-53: `cleanup expired NFT reservations` - NFT system
- Lines 55-62: `cleanup expired lockouts` - Security/rate limiting
- **Lines 73-90: ESSENCE CHECKPOINTS - ABSOLUTELY DO NOT MODIFY**
- Lines 102-181: All cleanup/retention jobs (low impact, just delete old data)

---

## IMPLEMENTATION STEPS

### Step 1: Edit crons.ts
Comment out the 4 cron jobs listed above with a clear "PAUSED" comment explaining why.

### Step 2: Deploy to Sturgeon (Unified Database)
Run `npx convex deploy` to deploy changes. **Note**: With unified database, all changes affect production immediately.

### Step 3: Verify in Convex Dashboard
Check the Convex dashboard to confirm:
- Disabled crons no longer appear in scheduled functions
- Enabled crons still running normally

### Step 4: Monitor
Watch for 24 hours to ensure:
- No errors from orphaned processes
- Essence system continues working
- Cleanup jobs continue working

---

## EXPECTED RESULTS

After deployment to Sturgeon:
- Blockfrost API calls: ~0 (down from thousands)
- Database writes to goldMining table: Stopped
- Database writes to mekOwnershipHistory: Stopped
- Database writes to goldBackups: Stopped
- Database writes to leaderboardCache: Stopped
- Essence system: UNCHANGED (still running)

---

## ROLLBACK PLAN

If issues arise:
1. Uncomment the disabled cron jobs in `crons.ts`
2. Run `npx convex dev` to redeploy
3. Crons will resume on next scheduled interval

---

## NEXT STEPS

> ⚠️ **Section Obsolete**: With unified database, there's no separate "Trout verification" step.
> All deployments go directly to Sturgeon (production). Exercise caution and follow CLAUDE.md deployment protocol.

---

## FILES MODIFIED

- `convex/crons.ts` - Comment out 4 cron jobs

## FILES NOT MODIFIED

- `convex/essence.ts` - DO NOT TOUCH
- `convex/goldMining.ts` - Infrastructure preserved
- `convex/mekLeveling.ts` - Infrastructure preserved
- `convex/goldMiningSnapshot.ts` - Infrastructure preserved
- All frontend components - Maintenance page covers everything
