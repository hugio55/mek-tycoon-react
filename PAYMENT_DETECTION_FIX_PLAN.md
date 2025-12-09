# Payment Detection Fix Plan
**Critical Issue: Lab Rat #3 purchased but inventory not updated to "sold"**
**Date: December 8, 2025**

## Root Cause Analysis

### PRIMARY CAUSE: Missing Convex Functions

The webhook handler at `src/app/api/nmkr-webhook/route.ts` references **THREE Convex functions that DO NOT EXIST**:

1. **`api.webhooks.checkProcessedWebhook`** (line 107-110)
   - File `convex/webhooks.ts` does not exist
   - Purpose: Check for duplicate webhooks (idempotency)
   - **Impact**: Throws error, caught silently, processing continues

2. **`api.commemorativeNFTInventorySetup.markInventoryAsSoldByUid`** (line 277)
   - File `convex/commemorativeNFTInventorySetup.ts` does not exist
   - Purpose: Mark NFT as sold when no reservation found (fallback path)
   - **Impact**: When completeReservationByWallet fails to find a reservation, this fallback ALSO fails, so inventory is NEVER updated to "sold"

3. **`api.webhooks.recordProcessedWebhook`** (line 302-308)
   - Same missing file
   - Purpose: Record webhook as processed
   - **Impact**: Non-critical for sales, but breaks idempotency protection

### SECONDARY CAUSE: Reservation Lookup Can Fail

The `completeReservationByWallet` function in `convex/commemorativeNFTReservations.ts` (line 289-330) looks for reservations where:
```
reservedBy === walletAddress
```

This can fail if:
- NMKR sends `ReceiverStakeAddress` in a different format than what was stored during reservation
- The reservation expired before the webhook arrived
- Address normalization differences (uppercase vs lowercase)

When this fails, the code falls back to `markInventoryAsSoldByUid` which **DOESN'T EXIST**.

### TERTIARY CAUSE: No Frontend Fallback

The frontend polling (`checkReservationPaid` query) only checks if `nft.status === 'sold'`. Since the webhook can't update this status, the frontend never detects the successful payment.

---

## Failure Flow Diagram

```
User pays via NMKR
        |
        v
NMKR sends webhook to /api/nmkr-webhook
        |
        v
Webhook calls api.webhooks.checkProcessedWebhook
        |
        v
ERROR: Function doesn't exist (caught silently)
        |
        v
Webhook calls api.commemorative.updatePurchaseStatus
        |
        v
Works, updates commemorativePurchases table
        |
        v
Webhook calls api.commemorativeNFTClaims.recordClaim
        |
        v
Works, creates claim record in commemorativeNFTClaims table
        |
        v
Webhook calls api.commemorativeNFTReservations.completeReservationByWallet
        |
        v
FAILS: No active reservation found (expired or address mismatch)
        |
        v
Webhook tries fallback: api.commemorativeNFTInventorySetup.markInventoryAsSoldByUid
        |
        v
ERROR: Function doesn't exist!
        |
        v
Inventory status stays "reserved", never becomes "sold"
        |
        v
Frontend polling keeps checking, never sees "sold"
        |
        v
User sees "Reserved" even though they have the NFT in their wallet
```

---

## Fix Plan (Priority Order)

### FIX 1: Create Missing `convex/webhooks.ts` (Critical)

Create the file with:
- `checkProcessedWebhook` - Query to check if webhook already processed
- `recordProcessedWebhook` - Mutation to record webhook as processed
- Create `processedWebhooks` table in schema

### FIX 2: Add `markInventoryAsSoldByUid` Function (Critical)

Either:
- Add to `convex/commemorativeCampaigns.ts` (existing file)
- Or create `convex/commemorativeNFTInventorySetup.ts`

This function should:
1. Find NFT by `nftUid`
2. Update `status` to "sold"
3. Set `soldTo`, `soldAt`, `transactionHash` fields
4. Update campaign counters

### FIX 3: Improve Address Matching in Reservation Lookup (Important)

Modify `completeReservationByWallet` to:
1. Normalize addresses (lowercase, trim whitespace)
2. Try matching by stake address prefix if full match fails
3. Add logging for debugging address mismatches

### FIX 4: Add Claims Table Check to Frontend Polling (Important)

The `checkReservationPaid` query currently ONLY checks inventory status. Enhance to also check:
1. `commemorativeNFTClaims` table for claim by wallet
2. `commemorativePurchases` table for completed purchase

This creates multiple detection paths:
- Path A: Inventory status === "sold" (current)
- Path B: Claim exists for wallet (new fallback)
- Path C: Purchase completed for wallet (new fallback)

### FIX 5: Add "Check Blockchain" Manual Fallback (Nice to Have)

Add a button in the lightbox that:
1. User clicks "I paid, check blockchain"
2. Frontend calls Blockfrost API to verify transaction
3. If transaction found and confirmed, manually trigger inventory update

### FIX 6: Improve Webhook Logging (Important)

Add searchable tags to all webhook logs:
- `[WEBHOOK-SUCCESS]` for successful operations
- `[WEBHOOK-FAIL]` for failures
- `[WEBHOOK-FALLBACK]` when using fallback paths
- Include full stack traces for errors

---

## Immediate Actions Required

### Step 1: Create `convex/webhooks.ts`

```typescript
// Schema addition needed in convex/schema.ts:
processedWebhooks: defineTable({
  transactionHash: v.string(),
  stakeAddress: v.string(),
  nftUid: v.string(),
  reservationId: v.optional(v.id("commemorativeNFTReservations")),
  eventType: v.string(),
  processedAt: v.number(),
}).index("by_transaction", ["transactionHash"]),

// Functions:
- checkProcessedWebhook(transactionHash) -> boolean
- recordProcessedWebhook(transactionHash, stakeAddress, nftUid, eventType)
```

### Step 2: Add `markInventoryAsSoldByUid` to `commemorativeCampaigns.ts`

```typescript
export const markInventoryAsSoldByUid = mutation({
  args: {
    nftUid: v.string(),
    transactionHash: v.string(),
  },
  handler: async (ctx, args) => {
    const nft = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_uid", (q) => q.eq("nftUid", args.nftUid))
      .first();

    if (!nft) {
      return { success: false, error: "NFT not found" };
    }

    await ctx.db.patch(nft._id, {
      status: "sold",
      transactionHash: args.transactionHash,
      soldAt: Date.now(),
    });

    // Update campaign counters
    if (nft.campaignId) {
      // ... sync counters
    }

    return { success: true, nftNumber: nft.nftNumber };
  },
});
```

### Step 3: Fix the Webhook Import Path

Change from:
```typescript
api.commemorativeNFTInventorySetup.markInventoryAsSoldByUid
```
To:
```typescript
api.commemorativeCampaigns.markInventoryAsSoldByUid
```

### Step 4: Enhance Frontend Polling

Add multi-source detection to `checkReservationPaid`:
```typescript
// Check 1: Inventory status (current)
// Check 2: Claims table
// Check 3: Purchases table
// Return true if ANY source confirms payment
```

---

## Testing Plan

1. **Unit Test**: Verify all Convex functions exist and work
2. **Integration Test**: Send test webhook and verify inventory updates
3. **Manual Test**: Complete actual purchase and verify full flow
4. **Edge Cases**:
   - Reservation expires before webhook arrives
   - Duplicate webhook received
   - Address format mismatches

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking changes to webhook | High | Test thoroughly in dev before prod |
| Address mismatch still possible | Medium | Add multiple fallback detection paths |
| Webhook delivery failure | Medium | Add manual "check blockchain" option |
| Schema migration needed | Low | Use additive changes only |

---

## Timeline

- **Fix 1-2** (Critical): Implement immediately
- **Fix 3-4** (Important): Same session
- **Fix 5-6** (Nice to have): Follow-up session

---

## Approval Required

Please review this plan and confirm:
1. Do you want me to proceed with implementing all fixes?
2. Should I prioritize any specific fix?
3. Are there any concerns about the proposed changes?
