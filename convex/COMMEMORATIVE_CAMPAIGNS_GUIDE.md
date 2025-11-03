# Commemorative Campaigns - Multi-Campaign System Guide

## Overview

The commemorative NFT system has been upgraded to support **multiple concurrent campaigns** with independent numbering (#1-#N per campaign). This allows running several NFT drops simultaneously without conflicts.

## Architecture

### Core Tables

#### 1. `commemorativeCampaigns` (NEW)
Master table for all campaigns. Each campaign is independent.

**Fields:**
- `name`: Display name (e.g., "Lab Rat", "Pilot Program")
- `description`: Campaign description shown to users
- `nmkrProjectId`: NMKR project ID for this campaign
- `status`: `"active"` or `"inactive"` (controls if users can claim)
- `maxNFTs`: Total NFTs in this campaign (e.g., 10, 20, 50)
- `startDate`/`endDate`: Optional campaign window
- `totalNFTs`, `availableNFTs`, `reservedNFTs`, `soldNFTs`: Real-time counters

**Indexes:**
- `by_name`: Find campaign by name (for routing)
- `by_status`: List all active campaigns
- `by_created_at`: Newest campaigns first

#### 2. `commemorativeNFTInventory` (UPDATED)
Pre-populated NFT list, now campaign-scoped.

**New Fields:**
- `campaignId`: Links NFT to its campaign (optional for backward compatibility)

**New Indexes:**
- `by_campaign`: Get all NFTs in a campaign
- `by_campaign_and_status`: Find available NFTs in a campaign
- `by_campaign_and_number`: Lookup specific NFT number in campaign

#### 3. `commemorativeNFTReservations` (UPDATED)
Active reservations, now campaign-scoped.

**New Fields:**
- `campaignId`: Links reservation to its campaign (optional for backward compatibility)

**New Indexes:**
- `by_campaign`: All reservations for a campaign
- `by_campaign_and_wallet`: Check if user has reservation in this campaign
- `by_wallet_and_status`: User's claim history across all campaigns

#### 4. `commemorativeNFTClaims` (UPDATED)
Completed claims, now campaign-scoped.

**New Fields:**
- `campaignId`: Links claim to its campaign (optional for backward compatibility)

**New Indexes:**
- `by_campaign`: All claims from a campaign

---

## File Structure

### Core Campaign Management
- **`commemorativeCampaigns.ts`** - Campaign CRUD, statistics, queries
  - `createCampaign()` - Create new campaign container
  - `activateCampaign()` / `deactivateCampaign()` - Control campaign status
  - `populateCampaignInventory()` - Add NFTs to campaign
  - `listActiveCampaigns()` - Get all claimable campaigns
  - `getCampaignStats()` - Real-time campaign statistics

### Campaign-Aware Reservations
- **`commemorativeNFTReservationsCampaign.ts`** - Multi-campaign reservation system
  - `createCampaignReservation()` - Reserve NFT from specific campaign
  - `completeCampaignReservation()` - Complete payment for reservation
  - `getActiveCampaignReservation()` - Check user's reservation in campaign
  - Enforces: One active reservation per user per campaign

### Migration Tools
- **`commemorativeCampaignMigration.ts`** - Manual migration utilities
  - `analyzeExistingData()` - See what needs migration
  - `createLabRatCampaign()` - Step 1: Create Lab Rat campaign
  - `migrateLabRatInventory()` - Step 2: Link inventory to campaign
  - `migrateLabRatReservations()` - Step 3: Link reservations to campaign
  - `migrateLabRatClaims()` - Step 4: Link claims to campaign
  - `activateLabRatCampaign()` - Step 5: Make campaign active

### Legacy Files (Still Work)
- **`commemorativeNFTReservations.ts`** - Original reservation system
  - Still functional for backward compatibility
  - Works with `campaignId: undefined` NFTs
  - Will be deprecated once all data is migrated

---

## Migration Guide - Converting Lab Rat to Campaign System

### Prerequisites
- Existing Lab Rat inventory in `commemorativeNFTInventory`
- Access to Convex dashboard (for running mutations)
- NMKR project ID for Lab Rat

### Step-by-Step Migration

#### Step 1: Analyze Existing Data
Run from Convex dashboard:
```
commemorativeCampaignMigration.analyzeExistingData()
```

This shows:
- How many inventory items need migration
- How many reservations need migration
- Sample data preview
- Recommended next steps

#### Step 2: Create Lab Rat Campaign
```
commemorativeCampaignMigration.createLabRatCampaign({
  nmkrProjectId: "your-nmkr-project-id-here",
  description: "Original commemorative NFT collection for Mek Tycoon Lab Rats"
})
```

Returns `campaignId` - **copy this for next steps!**

#### Step 3: Migrate Inventory
```
commemorativeCampaignMigration.migrateLabRatInventory({
  campaignId: "paste-campaign-id-here"
})
```

This links all existing NFTs to the Lab Rat campaign.
- Non-destructive (only adds `campaignId` field)
- Updates campaign counters automatically

#### Step 4: Migrate Reservations
```
commemorativeCampaignMigration.migrateLabRatReservations({
  campaignId: "paste-campaign-id-here"
})
```

Links all existing reservations to the campaign.

#### Step 5: Migrate Claims (if any)
```
commemorativeCampaignMigration.migrateLabRatClaims({
  campaignId: "paste-campaign-id-here"
})
```

Links any existing claims to the campaign.
- Returns success even if no claims exist yet (normal case)

#### Step 6: Activate Campaign
```
commemorativeCampaignMigration.activateLabRatCampaign({
  campaignId: "paste-campaign-id-here"
})
```

Makes the Lab Rat campaign active and claimable!

#### Verification
After migration, verify everything:
```
commemorativeCampaigns.getCampaignStats({
  campaignId: "paste-campaign-id-here"
})
```

Should show:
- `totalNFTs: 10` (or your count)
- Correct breakdown of available/reserved/sold
- `status: "active"`

### Rollback (if needed)

If migration fails and you need to retry:
```
commemorativeCampaignMigration.rollbackLabRatMigration({
  campaignId: "paste-campaign-id-here",
  confirmRollback: true
})
```

This removes `campaignId` from all data so you can re-run migration.

---

## Creating New Campaigns

### Example: "Pilot Program" Campaign

#### Step 1: Create Campaign
```
commemorativeCampaigns.createCampaign({
  name: "Pilot Program",
  description: "Exclusive NFTs for Mek Tycoon pilot testers",
  nmkrProjectId: "your-new-project-id",
  maxNFTs: 20, // 20 NFTs in this campaign
  startDate: 1704067200000, // Optional: January 1, 2024
  endDate: 1735689600000    // Optional: January 1, 2025
})
```

Returns `campaignId` - copy this!

#### Step 2: Populate Inventory
Get NFT UIDs from NMKR Studio, then:
```
commemorativeCampaigns.populateCampaignInventory({
  campaignId: "your-campaign-id",
  nfts: [
    { nftUid: "uid-1", nftNumber: 1, name: "Pilot Program #1" },
    { nftUid: "uid-2", nftNumber: 2, name: "Pilot Program #2" },
    // ... up to #20
  ]
})
```

#### Step 3: Activate Campaign
```
commemorativeCampaigns.activateCampaign({
  campaignId: "your-campaign-id"
})
```

Campaign is now live!

---

## Frontend Integration

### List Active Campaigns
```typescript
const campaigns = useQuery(api.commemorativeCampaigns.listActiveCampaigns);

// Show campaign selection UI
campaigns?.map(campaign => (
  <CampaignCard
    name={campaign.name}
    description={campaign.description}
    availableNFTs={campaign.availableNFTs}
    totalNFTs={campaign.totalNFTs}
  />
))
```

### Reserve NFT from Campaign
```typescript
const createReservation = useMutation(api.commemorativeNFTReservationsCampaign.createCampaignReservation);

// User selects a campaign
const handleClaim = async (campaignId) => {
  const result = await createReservation({
    campaignId,
    walletAddress: userWallet
  });

  if (result.success) {
    // Show reservation UI with payment link
    console.log("Reserved NFT:", result.nft.name);
    console.log("Payment URL:", result.nft.paymentUrl);
  }
}
```

### Check User's Reservation
```typescript
const reservation = useQuery(api.commemorativeNFTReservationsCampaign.getActiveCampaignReservation, {
  campaignId: selectedCampaignId,
  walletAddress: userWallet
});

if (reservation && !reservation.isExpired) {
  // Show countdown timer, payment button
  const timeRemaining = reservation.remainingMs;
}
```

### Get Campaign Stats
```typescript
const stats = useQuery(api.commemorativeCampaigns.getCampaignStats, {
  campaignId: selectedCampaignId
});

// Display: "12/20 NFTs Available"
```

---

## Key Behaviors

### Per-Campaign Numbering
- Each campaign has independent numbering (1-N)
- "Lab Rat #1" and "Pilot Program #1" are different NFTs
- Numbers restart at 1 for each new campaign

### One Claim Per Campaign
- Users can claim ONE NFT per campaign
- Can participate in multiple campaigns simultaneously
- Example: User can claim "Lab Rat #3" AND "Pilot Program #5"

### Campaign Lifecycle
1. **Inactive** - Created but not yet claimable (default state)
2. **Active** - Users can claim NFTs
3. **Inactive** - Campaign closed (manual deactivation)

### Reservation Rules
- One active reservation per user per campaign
- 10-minute reservation window
- 30-second grace period after expiry
- Auto-cleanup of expired reservations
- Payment window pauses timer (tracked but not extended)

### Backward Compatibility
- `campaignId` is optional in all tables
- Legacy reservations (without `campaignId`) still work
- Original `commemorativeNFTReservations.ts` still functional
- After migration, all new data will have `campaignId`

---

## Database Query Patterns

### Find Next Available NFT in Campaign
```typescript
// Uses by_campaign_and_status index (efficient)
const availableNFT = await ctx.db
  .query("commemorativeNFTInventory")
  .withIndex("by_campaign_and_status", q =>
    q.eq("campaignId", campaignId).eq("status", "available")
  )
  .order("asc") // Lowest number first
  .first();
```

### Check if User Already Claimed
```typescript
// Uses by_campaign_and_wallet index (efficient)
const hasCompleted = await ctx.db
  .query("commemorativeNFTReservations")
  .withIndex("by_campaign_and_wallet", q =>
    q.eq("campaignId", campaignId).eq("reservedBy", walletAddress)
  )
  .filter(q => q.eq(q.field("status"), "completed"))
  .first();
```

### Get User's Claim History
```typescript
// Uses by_wallet_and_status index (efficient)
const completedReservations = await ctx.db
  .query("commemorativeNFTReservations")
  .withIndex("by_wallet_and_status", q =>
    q.eq("reservedBy", walletAddress).eq("status", "completed")
  )
  .collect();
```

---

## Performance Considerations

### Campaign Counters
- `totalNFTs`, `availableNFTs`, `reservedNFTs`, `soldNFTs` are cached for quick access
- Updated on every inventory state change
- Use `syncCampaignCounters()` mutation if counters drift

### Index Strategy
All indexes support O(log n) lookups:
- Campaign-scoped queries use `by_campaign_*` indexes
- User-scoped queries use `by_wallet_*` indexes
- Status filtering uses composite indexes (e.g., `by_campaign_and_status`)

### Cleanup Operations
- `cleanupExpiredCampaignReservationsMutation()` - Cleanup one campaign
- `cleanupAllExpiredReservations()` - Cleanup all campaigns
- Called automatically before creating new reservations
- Can be scheduled as cron job for production

---

## Admin Operations

### View Campaign Stats
```
commemorativeCampaigns.getCampaignStats({ campaignId })
```

### List All Campaigns
```
commemorativeCampaigns.listAllCampaigns()
```

### Clear Campaign Inventory (Caution!)
```
commemorativeCampaigns.clearCampaignInventory({
  campaignId: "campaign-id-here"
})
```

Deletes:
- All inventory items for this campaign
- All reservations for this campaign
- Resets campaign counters to 0

### Sync Campaign Counters
If counters drift from actual inventory:
```
commemorativeCampaigns.syncCampaignCounters({
  campaignId: "campaign-id-here"
})
```

Recalculates all counters from inventory state.

---

## Testing Strategy

### Test Campaign Creation
1. Create test campaign with `maxNFTs: 3`
2. Populate with 3 test NFTs
3. Activate campaign
4. Verify stats show correct counts

### Test Reservations
1. Create reservation for test user
2. Verify `availableNFTs` decrements
3. Verify `reservedNFTs` increments
4. Verify user can't create second reservation in same campaign

### Test Campaign Isolation
1. Create two campaigns: "Test A" and "Test B"
2. Reserve NFT from "Test A"
3. Verify "Test B" inventory is unaffected
4. Verify user can reserve from "Test B" simultaneously

### Test Migration
1. Create test inventory without `campaignId`
2. Run migration steps
3. Verify all data has `campaignId` after migration
4. Verify counters match actual inventory

---

## Troubleshooting

### "Campaign not found"
- Verify `campaignId` is correct (it's a Convex ID, not project ID)
- Check campaign exists: `commemorativeCampaigns.listAllCampaigns()`

### "Campaign is not currently active"
- Check campaign status: `getCampaignStats({ campaignId })`
- Activate: `activateCampaign({ campaignId })`

### "All NFTs have been claimed"
- Check `availableNFTs` in campaign stats
- Verify inventory has available NFTs: filter by status

### Counters don't match inventory
- Run `syncCampaignCounters({ campaignId })`
- Recalculates from actual inventory state

### Migration stuck
- Check which step completed: `analyzeExistingData()`
- Rollback if needed: `rollbackLabRatMigration()`
- Re-run from last successful step

---

## Future Enhancements

Possible additions to the system:

1. **Campaign Templates** - Preset configurations for common campaign types
2. **Bulk Operations** - Create multiple campaigns at once
3. **Campaign Analytics** - Track claim rates, revenue, popular NFTs
4. **Campaign Categories** - Group campaigns by type (commemorative, seasonal, etc.)
5. **Campaign Prerequisites** - Require specific wallet holdings to participate
6. **Campaign Rewards** - Bonus rewards for early claimers or complete sets
7. **Campaign Visibility** - Public vs private campaigns
8. **Campaign Notifications** - Alert users when new campaigns launch

---

## Summary

The multi-campaign system provides:
- ✅ Multiple concurrent NFT drops
- ✅ Independent numbering per campaign
- ✅ One claim per user per campaign
- ✅ Campaign-scoped inventory and reservations
- ✅ Efficient queries with proper indexes
- ✅ Backward compatible with existing data
- ✅ Manual migration tools for Lab Rat conversion
- ✅ Production-ready with counter caching and cleanup

All new campaigns should use the campaign-aware mutations in `commemorativeNFTReservationsCampaign.ts`.
