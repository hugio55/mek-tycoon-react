# Commemorative Campaigns - Quick Reference

## Schema Summary

### commemorativeCampaigns (NEW)
```typescript
{
  name: string,                    // "Lab Rat", "Pilot Program"
  description: string,
  nmkrProjectId: string,
  status: "active" | "inactive",
  maxNFTs: number,
  startDate?: number,
  endDate?: number,
  totalNFTs: number,              // Counters (cached)
  availableNFTs: number,
  reservedNFTs: number,
  soldNFTs: number,
  createdAt: number,
  updatedAt: number
}

Indexes: by_name, by_status, by_created_at
```

### commemorativeNFTInventory (UPDATED)
```typescript
{
  campaignId?: Id<"commemorativeCampaigns">,  // NEW (optional)
  nftUid: string,
  nftNumber: number,              // Campaign-scoped (1-N per campaign)
  name: string,
  status: "available" | "reserved" | "sold",
  projectId: string,
  paymentUrl: string,
  imageUrl?: string,
  createdAt: number
}

New Indexes: by_campaign, by_campaign_and_status, by_campaign_and_number
```

### commemorativeNFTReservations (UPDATED)
```typescript
{
  campaignId?: Id<"commemorativeCampaigns">,  // NEW (optional)
  nftInventoryId: Id<"commemorativeNFTInventory">,
  nftUid: string,
  nftNumber: number,              // Campaign-scoped
  reservedBy: string,
  reservedAt: number,
  expiresAt: number,
  status: "active" | "expired" | "completed" | "cancelled",
  paymentWindowOpenedAt?: number,
  paymentWindowClosedAt?: number
}

New Indexes: by_campaign, by_campaign_and_wallet, by_wallet_and_status
```

### commemorativeNFTClaims (UPDATED)
```typescript
{
  campaignId?: Id<"commemorativeCampaigns">,  // NEW (optional)
  walletAddress: string,
  transactionHash: string,
  nftName: string,
  nftAssetId: string,
  claimedAt: number,
  metadata?: object
}

New Indexes: by_campaign
```

---

## Core Mutations (commemorativeCampaigns.ts)

### Campaign Lifecycle
```typescript
createCampaign({ name, description, nmkrProjectId, maxNFTs, startDate?, endDate? })
activateCampaign({ campaignId })
deactivateCampaign({ campaignId })
updateCampaign({ campaignId, name?, description?, startDate?, endDate? })
```

### Inventory Management
```typescript
populateCampaignInventory({ campaignId, nfts: [{ nftUid, nftNumber, name }] })
clearCampaignInventory({ campaignId })
```

### Statistics & Queries
```typescript
getCampaignStats({ campaignId })                    // Query
listAllCampaigns()                                  // Query
listActiveCampaigns()                               // Query
getCampaignByName({ name })                         // Query
getCampaignAvailableCount({ campaignId })           // Query
hasUserClaimedFromCampaign({ campaignId, walletAddress })  // Query
getUserClaimHistory({ walletAddress })              // Query
syncCampaignCounters({ campaignId })                // Mutation
```

---

## Campaign-Aware Reservations (commemorativeNFTReservationsCampaign.ts)

### Reservation Operations
```typescript
createCampaignReservation({ campaignId, walletAddress })
completeCampaignReservation({ reservationId, transactionHash })
completeCampaignReservationByWallet({ campaignId, walletAddress, transactionHash })
releaseCampaignReservation({ reservationId, reason?: "cancelled" | "expired" })
```

### Payment Window Tracking
```typescript
markPaymentWindowOpened({ reservationId })
markPaymentWindowClosed({ reservationId })
```

### Queries
```typescript
getActiveCampaignReservation({ campaignId, walletAddress })
getCampaignReservations({ campaignId, status? })
```

### Cleanup
```typescript
cleanupExpiredCampaignReservationsMutation({ campaignId })
cleanupAllExpiredReservations()
```

---

## Migration Utilities (commemorativeCampaignMigration.ts)

### Analysis
```typescript
analyzeExistingData()                    // Query - See what needs migration
checkLabRatCampaignExists()              // Query - Check if Lab Rat campaign exists
```

### Migration Steps (Run in order)
```typescript
// 1. Create Lab Rat campaign
createLabRatCampaign({ nmkrProjectId, description? })

// 2. Migrate inventory
migrateLabRatInventory({ campaignId })

// 3. Migrate reservations
migrateLabRatReservations({ campaignId })

// 4. Migrate claims (optional)
migrateLabRatClaims({ campaignId })

// 5. Activate campaign
activateLabRatCampaign({ campaignId })
```

### Rollback (if needed)
```typescript
rollbackLabRatMigration({ campaignId, confirmRollback: true })
deleteLabRatCampaign({ campaignId, confirmDelete: true })
```

---

## Frontend Usage Examples

### List Active Campaigns
```typescript
const campaigns = useQuery(api.commemorativeCampaigns.listActiveCampaigns);

{campaigns?.map(campaign => (
  <div>
    {campaign.name}: {campaign.availableNFTs}/{campaign.totalNFTs} available
  </div>
))}
```

### Reserve NFT from Campaign
```typescript
const createReservation = useMutation(api.commemorativeNFTReservationsCampaign.createCampaignReservation);

const handleClaim = async () => {
  const result = await createReservation({
    campaignId: selectedCampaignId,
    walletAddress: userWallet
  });

  if (result.success) {
    // Show payment UI
    window.open(result.nft.paymentUrl);
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
  const timeLeft = Math.floor(reservation.remainingMs / 1000);
  // Show countdown: ${timeLeft} seconds remaining
}
```

### Get Campaign Stats
```typescript
const stats = useQuery(api.commemorativeCampaigns.getCampaignStats, {
  campaignId: selectedCampaignId
});

// Display: {stats.stats.available}/{stats.stats.total} NFTs available
```

---

## Common Patterns

### Creating New Campaign (Full Flow)
```typescript
// 1. Create campaign
const result = await createCampaign({
  name: "Pilot Program",
  description: "Exclusive NFTs for pilot testers",
  nmkrProjectId: "project-xyz",
  maxNFTs: 20
});

const campaignId = result.campaignId;

// 2. Get NFT UIDs from NMKR Studio

// 3. Populate inventory
await populateCampaignInventory({
  campaignId,
  nfts: [
    { nftUid: "uid-1", nftNumber: 1, name: "Pilot #1" },
    { nftUid: "uid-2", nftNumber: 2, name: "Pilot #2" },
    // ... up to 20
  ]
});

// 4. Activate campaign
await activateCampaign({ campaignId });
```

### User Claiming Flow
```typescript
// 1. User selects campaign
// 2. Check if already claimed
const hasClaimed = await hasUserClaimedFromCampaign({
  campaignId,
  walletAddress
});

if (hasClaimed) {
  return "You already claimed from this campaign";
}

// 3. Check if has active reservation
const existingReservation = await getActiveCampaignReservation({
  campaignId,
  walletAddress
});

if (existingReservation) {
  // Resume existing reservation
  return { paymentUrl: existingReservation.nft.paymentUrl };
}

// 4. Create new reservation
const reservation = await createCampaignReservation({
  campaignId,
  walletAddress
});

// 5. Show payment link
return { paymentUrl: reservation.nft.paymentUrl };
```

### Admin Dashboard
```typescript
// Get all campaigns with stats
const campaigns = await listAllCampaigns();

for (const campaign of campaigns) {
  const stats = await getCampaignStats({ campaignId: campaign._id });

  console.log(`${campaign.name}:`, {
    status: campaign.status,
    available: stats.stats.available,
    reserved: stats.stats.reserved,
    sold: stats.stats.sold
  });
}
```

---

## Index Usage (Performance)

### Efficient Queries
```typescript
// ✅ GOOD - Uses by_campaign_and_status index
await ctx.db
  .query("commemorativeNFTInventory")
  .withIndex("by_campaign_and_status", q =>
    q.eq("campaignId", id).eq("status", "available")
  )
  .first();

// ✅ GOOD - Uses by_campaign_and_wallet index
await ctx.db
  .query("commemorativeNFTReservations")
  .withIndex("by_campaign_and_wallet", q =>
    q.eq("campaignId", id).eq("reservedBy", wallet)
  )
  .first();
```

### Avoid Inefficient Queries
```typescript
// ❌ BAD - No index, scans entire table
await ctx.db
  .query("commemorativeNFTInventory")
  .filter(q => q.eq(q.field("campaignId"), id))
  .collect();

// ✅ GOOD - Uses by_campaign index
await ctx.db
  .query("commemorativeNFTInventory")
  .withIndex("by_campaign", q => q.eq("campaignId", id))
  .collect();
```

---

## Key Behaviors

### Campaign Independence
- Each campaign has separate numbering (1-N)
- "Lab Rat #1" ≠ "Pilot #1" (different campaigns)
- Users can claim from multiple campaigns

### Reservation Rules
- One active reservation per user per campaign
- 10-minute window + 30-second grace period
- Auto-cleanup of expired reservations
- Can reserve from multiple campaigns simultaneously

### Campaign States
- **Inactive** (default) - Not claimable yet
- **Active** - Users can claim
- **Inactive** (closed) - Campaign ended

### Backward Compatibility
- `campaignId` is optional (undefined = legacy data)
- Legacy mutations still work
- After migration, all new data has `campaignId`

---

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| "Campaign not found" | Wrong campaignId | Check `listAllCampaigns()` |
| "Campaign not active" | Status = inactive | Run `activateCampaign()` |
| "All NFTs claimed" | No available NFTs | Check `getCampaignStats()` |
| "Already claimed" | User has completed reservation | User can only claim once per campaign |
| Counters wrong | Drift from inventory | Run `syncCampaignCounters()` |

---

## Files Overview

| File | Purpose | Key Functions |
|------|---------|---------------|
| `commemorativeCampaigns.ts` | Campaign management | create, activate, populate, stats |
| `commemorativeNFTReservationsCampaign.ts` | Campaign reservations | createReservation, complete, release |
| `commemorativeCampaignMigration.ts` | Migration tools | analyze, migrate, rollback |
| `commemorativeNFTReservations.ts` | Legacy reservations | (Backward compatibility) |
| `schema.ts` | Database schema | Table definitions + indexes |

---

## Migration Checklist

Lab Rat Data → Campaign System:

- [ ] Run `analyzeExistingData()` to see what exists
- [ ] Run `createLabRatCampaign({ nmkrProjectId })` - Copy campaignId!
- [ ] Run `migrateLabRatInventory({ campaignId })`
- [ ] Run `migrateLabRatReservations({ campaignId })`
- [ ] Run `migrateLabRatClaims({ campaignId })` (if any)
- [ ] Run `activateLabRatCampaign({ campaignId })`
- [ ] Verify with `getCampaignStats({ campaignId })`
- [ ] Update frontend to use campaign-aware mutations

---

## Next Steps

After migration:
1. Update frontend to list campaigns
2. Update claim flow to require `campaignId`
3. Test new campaign creation
4. Consider deprecating legacy mutations
5. Add campaign selection UI
6. Implement campaign analytics

---

## Support

For detailed documentation, see `COMMEMORATIVE_CAMPAIGNS_GUIDE.md`
