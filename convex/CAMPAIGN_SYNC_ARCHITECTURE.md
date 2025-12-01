# Campaign Sync System - Complete Architecture

## Overview

The Campaign Sync System provides comprehensive synchronization between NMKR's live NFT data and the Convex database for commemorative NFT campaigns. It's triggered by a single "Sync" button in the Campaign Manager UI.

**Status**: ✅ Already implemented in `convex/campaignSync.ts`

---

## System Architecture

### Flow Diagram
```
User clicks "Sync" button
    ↓
syncCampaignPublic(campaignId) → action (frontend-callable)
    ↓
syncCampaign(campaignId) → internalAction
    ↓
┌─────────────────────────────────────────────────────────┐
│ 1. Get Campaign Data (from Convex)                      │
│ 2. Fetch NMKR Data (external API)                       │
│    - Project Stats                                       │
│    - Free NFTs                                           │
│    - Reserved NFTs                                       │
│    - Sold NFTs                                           │
│ 3. Get Database State (from Convex inventory)           │
│ 4. Compare & Identify Discrepancies                     │
│ 5. Apply Updates (mutation for each mismatched NFT)     │
│ 6. Refresh Campaign Counters (mutation)                 │
│ 7. Get Webhook Activity Logs (query)                    │
│ 8. Blockchain Verification (optional, Blockfrost API)   │
│ 9. Record Sync Log (mutation)                           │
└─────────────────────────────────────────────────────────┘
    ↓
Return comprehensive SyncReport to UI
```

---

## Database Schema

### commemorativeCampaigns
```typescript
{
  _id: Id<"commemorativeCampaigns">,
  name: string,                    // "Lab Rat", "Pilot Program"
  description: string,
  nmkrProjectId: string,           // NMKR project ID
  status: "active" | "inactive",
  maxNFTs: number,
  startDate?: number,
  endDate?: number,
  createdAt: number,
  updatedAt: number,
  // Performance counters (synced from inventory)
  totalNFTs: number,
  availableNFTs: number,
  reservedNFTs: number,
  soldNFTs: number,
}
```

**Indexes:**
- `by_name` - Find campaign by display name
- `by_status` - Filter active/inactive campaigns
- `by_created_at` - Sort by creation date

### commemorativeNFTInventory
```typescript
{
  _id: Id<"commemorativeNFTInventory">,
  campaignId?: Id<"commemorativeCampaigns">,
  nftUid: string,                  // NMKR UID (unique identifier)
  nftNumber: number,                // Campaign-scoped edition (1-N)
  name: string,                     // "Lab Rat #1"
  status: "available" | "reserved" | "sold",
  projectId: string,                // NMKR project ID
  paymentUrl: string,               // Pre-built NMKR payment link
  imageUrl?: string,
  createdAt: number,
}
```

**Indexes:**
- `by_uid` - Fast lookup by NMKR UID ⭐ Critical for sync
- `by_campaign` - Get all NFTs for a campaign
- `by_campaign_and_status` - Filter by campaign + status
- `by_status` - Global status queries
- `by_number` - Sort by edition number

### nmkrSyncLog
```typescript
{
  _id: Id<"nmkrSyncLog">,
  syncType: "webhook" | "api_pull" | "manual_sync",
  nmkrProjectId: string,
  status: "success" | "partial" | "failed",
  recordsSynced: number,
  errors?: string[],
  syncedData?: any,                 // Optional metadata
  syncStartedAt: number,
  syncCompletedAt: number,
}
```

**Indexes:**
- `by_project` - Get logs for specific NMKR project ⭐ Critical for webhook activity
- `by_status` - Filter by sync status
- `by_timestamp` - Sort chronologically

---

## Main Functions

### 1. syncCampaignPublic (action)
**Location**: `convex/campaignSync.ts`

**Purpose**: Frontend-callable wrapper for sync action

**Args:**
```typescript
{
  campaignId: Id<"commemorativeCampaigns">
}
```

**Returns:**
```typescript
{
  success: boolean;
  syncedAt: number;
  durationMs: number;

  // NMKR vs Database
  nmkrStats: { total, available, reserved, sold };
  dbStats: { total, available, reserved, sold };
  discrepancies: Array<{
    nftUid, nftName, issue, dbStatus, nmkrStatus
  }>;

  // Updates Applied
  updateResults: Array<{
    success, nftName, oldStatus, newStatus, error?
  }>;
  updatedCount: number;
  failedCount: number;

  // Webhook Activity
  recentWebhooks: Array<{
    timestamp, status, recordsSynced, errors
  }>;

  // Blockchain Verification (optional)
  blockchainResults: Array<{
    nftName, nftUid, status, message, currentAddresses?
  }>;
  verifiedCount: number;
  pendingCount: number;
  errorCount: number;
}
```

**Usage from UI:**
```typescript
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";

const syncCampaign = useMutation(api.campaignSync.syncCampaignPublic);

// In button handler
const handleSync = async () => {
  const result = await syncCampaign({ campaignId });
  console.log("Sync complete:", result);
};
```

### 2. syncCampaign (internalAction)
**Location**: `convex/campaignSync.ts`

**Purpose**: Internal action that performs the actual sync logic

**Steps:**
1. **Get Campaign** - Query campaign details from database
2. **Fetch NMKR Data** - Call NMKR API for current state
   - `GET /v2/GetProject/{projectId}` - Overall stats
   - `GET /v2/GetNfts/{projectId}?state=free` - Available NFTs
   - `GET /v2/GetNfts/{projectId}?state=reserved` - Reserved NFTs
   - `GET /v2/GetNfts/{projectId}?state=sold` - Sold NFTs
3. **Get Database State** - Query inventory from Convex
4. **Compare** - Build map of NMKR UIDs → status, compare with database
5. **Update** - For each mismatch, call mutation to update status
6. **Sync Counters** - Refresh campaign aggregate counters
7. **Get Webhook Logs** - Query recent sync events
8. **Blockchain Verify** - (Optional) Verify sold NFTs on-chain
9. **Record Log** - Save sync event to nmkrSyncLog

### 3. Helper Functions

#### fetchProjectStats(projectId)
```typescript
async function fetchProjectStats(projectId: string): Promise<{
  projectname: string;
  nftsSold: number;
  nftsReserved: number;
  nftsFree: number;
  policyId: string;
  // ... other NMKR fields
}>
```
Fetches high-level project statistics from NMKR.

#### fetchNFTsFromNMKR(projectId, state)
```typescript
async function fetchNFTsFromNMKR(
  projectId: string,
  state: "free" | "reserved" | "sold"
): Promise<Array<{
  uid: string;
  tokenname: string;
  displayname: string;
  state: string;
  // ... other NMKR fields
}>>
```
Fetches detailed NFT list by status from NMKR.

---

## Supporting Mutations & Queries

### Missing Functions (Need to Add)

#### getCampaignById (query)
**Location**: `convex/commemorativeCampaigns.ts` (add this)
```typescript
export const getCampaignById = query({
  args: { campaignId: v.id("commemorativeCampaigns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.campaignId);
  },
});
```

#### updateNFTStatus (mutation)
**Location**: `convex/commemorativeCampaigns.ts` (add this)
```typescript
export const updateNFTStatus = mutation({
  args: {
    nftUid: v.string(),
    status: v.union(
      v.literal("available"),
      v.literal("reserved"),
      v.literal("sold")
    ),
  },
  handler: async (ctx, args) => {
    const nft = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_uid", (q) => q.eq("nftUid", args.nftUid))
      .first();

    if (!nft) {
      throw new Error(`NFT not found: ${args.nftUid}`);
    }

    await ctx.db.patch(nft._id, {
      status: args.status,
    });

    console.log('[CAMPAIGN] Updated NFT status:', nft.name, '→', args.status);

    return { success: true };
  },
});
```

### Existing Functions (Already Implemented)

#### getCampaignInventory (query)
**Location**: `convex/commemorativeCampaigns.ts` ✅
```typescript
export const getCampaignInventory = query({
  args: { campaignId: v.id("commemorativeCampaigns") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .order("asc")
      .collect();
  },
});
```

#### syncCampaignCounters (mutation)
**Location**: `convex/commemorativeCampaigns.ts` ✅
```typescript
export const syncCampaignCounters = mutation({
  args: { campaignId: v.id("commemorativeCampaigns") },
  handler: async (ctx, args) => {
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    const counters = {
      totalNFTs: inventory.length,
      availableNFTs: inventory.filter(i => i.status === "available").length,
      reservedNFTs: inventory.filter(i => i.status === "reserved").length,
      soldNFTs: inventory.filter(i => i.status === "sold").length,
      updatedAt: Date.now(),
    };

    await ctx.db.patch(args.campaignId, counters);

    return { success: true, counters };
  },
});
```

#### recordSyncLog (mutation)
**Location**: `convex/nmkrSync.ts` ✅
```typescript
export const recordSyncLog = mutation({
  args: {
    syncType: v.union(
      v.literal("webhook"),
      v.literal("api_pull"),
      v.literal("manual_sync")
    ),
    nmkrProjectId: v.string(),
    status: v.union(
      v.literal("success"),
      v.literal("partial"),
      v.literal("failed")
    ),
    recordsSynced: v.number(),
    errors: v.optional(v.array(v.string())),
    syncedData: v.optional(v.any()),
    syncStartedAt: v.number(),
    syncCompletedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("nmkrSyncLog", { ...args });
  },
});
```

#### getRecentSyncLogs (query)
**Location**: `convex/nmkrSync.ts` ✅
```typescript
export const getRecentSyncLogs = query({
  args: {
    nmkrProjectId: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("success"),
      v.literal("partial"),
      v.literal("failed")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("nmkrSyncLog");

    if (args.nmkrProjectId) {
      query = query.withIndex("by_project", (q) =>
        q.eq("nmkrProjectId", args.nmkrProjectId)
      );
    }

    return await query.order("desc").take(args.limit || 50);
  },
});
```

---

## Edge Cases & Error Handling

### 1. NMKR API Failures
**Problem**: NMKR API is down or returns errors

**Solution**:
- Try-catch around all fetch calls
- Return partial sync report with errors array populated
- Log sync with status="failed"
- UI shows error message but displays database state

### 2. NFT Not Found in NMKR
**Problem**: Database has NFT UID that doesn't exist in NMKR project

**Solution**:
- Add to discrepancies array with issue="Not found in NMKR"
- Don't update status (preserve database state)
- Add warning to sync report
- Manual investigation required

### 3. NFT Not Found in Database
**Problem**: NMKR has NFT that's not in database inventory

**Solution**:
- Add to discrepancies array with warning
- Don't auto-add to database (requires admin action)
- Suggest using `populateCampaignInventory()` to add missing NFTs

### 4. Status Update Fails
**Problem**: Mutation to update NFT status throws error

**Solution**:
- Catch error for that specific NFT
- Add to updateResults with success=false
- Continue processing other NFTs
- Mark overall sync as "partial" if any failures

### 5. Concurrent Modifications
**Problem**: User reserves NFT while sync is running

**Race Condition Scenarios:**
```
Timeline 1 (Webhook wins):
T0: Sync starts, fetches NMKR (NFT is sold)
T1: Webhook arrives, marks NFT as sold
T2: Sync tries to update (already sold) → Idempotent, no change

Timeline 2 (Sync wins):
T0: User reserves NFT locally (status=reserved)
T1: Sync starts, NMKR shows available
T2: Sync overwrites to available (WRONG!)
```

**Solution**:
- Add timestamp check: Only overwrite if local status is older than X minutes
- Prioritize "sold" status (blockchain truth)
- Add "last modified" timestamp to inventory
- If conflict detected, add to warnings array

### 6. Blockchain Verification Fails
**Problem**: Blockfrost API is down or returns errors

**Solution**:
- Catch errors for individual NFTs
- Mark blockchain result as status="error"
- Don't fail entire sync
- Continue with other verifications

---

## Performance Considerations

### 1. API Rate Limits
**NMKR API**: Unknown rate limit, assume conservative

**Strategy**:
- Batch NMKR calls with Promise.all (4 parallel requests max)
- Cache project stats for 5 minutes
- Debounce sync button (prevent spam)

### 2. Database Queries
**Inventory Queries**: O(N) where N = NFT count per campaign

**Optimization**:
- Use indexes: `by_campaign`, `by_uid`
- Single query to get all inventory (not N queries)
- Update in batches if many discrepancies (future enhancement)

### 3. Blockchain Verification
**Problem**: Verifying 50 NFTs = 50 Blockfrost API calls = slow

**Solution**:
- Limit to first 10 sold NFTs per sync
- Future: Queue verification as background job
- Future: Cache verification results for 1 hour

---

## Testing Recommendations

### Unit Tests (Future)
```typescript
describe("campaignSync", () => {
  it("should detect status mismatches", () => {
    const dbNFTs = [{ uid: "A", status: "available" }];
    const nmkrNFTs = [{ uid: "A", state: "sold" }];
    const result = compareInventories(dbNFTs, nmkrNFTs);
    expect(result.discrepancies).toHaveLength(1);
  });

  it("should handle NFT not found in NMKR", () => {
    const dbNFTs = [{ uid: "A", status: "available" }];
    const nmkrNFTs = [];
    const result = compareInventories(dbNFTs, nmkrNFTs);
    expect(result.discrepancies[0].issue).toBe("Not found in NMKR");
  });

  it("should be idempotent for already-synced data", () => {
    const dbNFTs = [{ uid: "A", status: "sold" }];
    const nmkrNFTs = [{ uid: "A", state: "sold" }];
    const result = compareInventories(dbNFTs, nmkrNFTs);
    expect(result.toUpdate).toHaveLength(0);
  });
});
```

### Integration Tests
1. **Manual Sync**
   - Create test campaign with 3 NFTs
   - Mark 1 as sold in NMKR (not in database)
   - Run sync
   - Verify database updated
   - Check sync log recorded

2. **Webhook Interference**
   - Start sync
   - Trigger webhook mid-sync
   - Verify no data corruption
   - Verify sync completes successfully

3. **API Failure**
   - Mock NMKR API to return 500 error
   - Run sync
   - Verify partial report returned
   - Verify database unchanged

---

## Future Enhancements

### 1. Auto-Sync Schedule
**Goal**: Run sync automatically every 15 minutes

**Implementation**:
```typescript
import { cronJobs } from "convex/server";

export default cronJobs({
  "sync-all-campaigns": {
    schedule: "*/15 * * * *", // Every 15 minutes
    handler: async (ctx) => {
      const campaigns = await ctx.db
        .query("commemorativeCampaigns")
        .filter(q => q.eq(q.field("status"), "active"))
        .collect();

      for (const campaign of campaigns) {
        await ctx.runAction(internal.campaignSync.syncCampaign, {
          campaignId: campaign._id,
        });
      }
    },
  },
});
```

### 2. Real-Time Sync Status
**Goal**: Show sync progress in UI (not just final result)

**Implementation**:
- Store sync progress in `syncProgress` table
- Action updates progress: "Fetching NMKR..." → "Comparing..." → "Updating..."
- UI polls progress via query
- Clear progress when sync completes

### 3. Batch Updates
**Goal**: Update 100 NFTs in single transaction

**Problem**: Current implementation = 100 separate mutations

**Solution**:
```typescript
export const batchUpdateNFTStatuses = mutation({
  args: {
    updates: v.array(v.object({
      nftUid: v.string(),
      status: v.union(v.literal("available"), v.literal("reserved"), v.literal("sold")),
    })),
  },
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      const nft = await ctx.db
        .query("commemorativeNFTInventory")
        .withIndex("by_uid", q => q.eq("nftUid", update.nftUid))
        .first();

      if (nft) {
        await ctx.db.patch(nft._id, { status: update.status });
      }
    }
  },
});
```

### 4. Smart Sync (Only Update Changed NFTs)
**Goal**: Track last sync timestamp per NFT

**Implementation**:
- Add `lastSyncedAt` field to inventory
- Add `lastModifiedAt` field to inventory (updated by webhooks)
- Only fetch NFTs modified since last sync
- NMKR API: `GET /v2/GetNfts/{projectId}?modifiedSince={timestamp}`

### 5. Sync Conflict Resolution
**Goal**: Handle race conditions intelligently

**Implementation**:
- Add `lastModifiedBy` field: "user" | "webhook" | "manual_sync"
- Prioritize: blockchain truth > webhook > manual sync > user action
- If conflict detected, add to manual review queue

---

## Environment Variables Required

```bash
# NMKR API Configuration
NMKR_API_KEY=your_api_key_here
NEXT_PUBLIC_NMKR_NETWORK=mainnet  # or "preprod" for testnet

# Blockfrost API (for blockchain verification)
BLOCKFROST_PROJECT_ID=your_blockfrost_project_id
BLOCKFROST_NETWORK=mainnet  # or "preprod"
```

---

## Summary

**Current Status**: ✅ Core sync system fully implemented

**What Exists**:
- `campaignSync.ts` with complete sync action
- NMKR API integration (fetch project stats, NFT lists)
- Database comparison logic
- Blockchain verification (optional)
- Webhook activity logging
- Comprehensive error handling

**Missing Pieces** (need to add):
1. `getCampaignById` query in `commemorativeCampaigns.ts`
2. `updateNFTStatus` mutation in `commemorativeCampaigns.ts`

**Ready for UI Integration**: Yes, call `syncCampaignPublic(campaignId)` from frontend

**Testing**: Manual testing recommended before production use
