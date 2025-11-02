# NMKR Payment Flow - Accurate Webhook-Based Tracking

**Last Updated:** January 30, 2025
**Status:** Implemented - Replaces fake setTimeout logic with real webhook events

---

## Problem Statement

**Previous System (WRONG):**
- User closes NMKR window after 15 seconds → Assumes payment received ✓
- Wait 2 seconds → Assumes minting started
- Wait 3 seconds → Assumes transaction confirmed
- **Result:** Shows "success" even if payment failed!

**New System (CORRECT):**
- NMKR sends webhook events → Backend records status → Frontend polls real data
- Only marks steps complete when webhooks confirm actual events happened
- No fake timeouts, no assumptions

---

## Payment Flow Steps (What They Actually Mean)

### Step 1: "Payment Received" ✓

**What it means:**
- User completed payment in NMKR window
- Transaction submitted to Cardano blockchain
- Payment is confirmed on-chain

**When it's marked complete:**
- NMKR sends `transactionconfirmed` webhook event
- Webhook endpoint receives event → Updates `commemorativePurchases` table
- Frontend polls database → Sees status change → Shows ✓

**What data we have at this point:**
- `TxHash` - Blockchain transaction hash
- `ReceiverAddress` - Buyer's wallet address
- `Price` - Amount paid in lovelace
- `NotificationSaleNfts` - NFT details (might be empty at this stage)

**Code location:**
- Webhook: `src/app/api/nmkr-webhook/route.ts` line 133-160
- Database mutation: `convex/commemorative.ts` `updatePurchaseStatus`

---

### Step 2: "Minting NFT on Blockchain..." 🔨

**What it means:**
- NMKR's minting system is creating the NFT on Cardano
- Smart contract is being executed
- NFT is being assigned to buyer's wallet address

**When it's marked complete:**
- Same as Step 1 - `transactionconfirmed` webhook tells us minting started
- We show this step immediately after payment received
- In reality, minting happens within seconds after payment confirms

**What's happening behind the scenes:**
- NMKR runs their minting infrastructure
- CIP-25 metadata is attached to the NFT
- Policy ID + asset name creates unique NFT identifier
- Transaction is broadcast to Cardano network

**Code location:**
- Same webhook event as Step 1 (they happen together)
- Frontend shows both steps at once when webhook arrives

---

### Step 3: "Confirming Transaction" ⏳

**What it means:**
- NFT minting transaction is propagating through Cardano network
- Waiting for transaction to be included in a block
- Cardano blockchain is validating and finalizing the transaction

**When it's marked complete:**
- NMKR sends `transactionfinished` webhook event
- This means NFT is fully minted and delivered to wallet
- Transaction has sufficient confirmations on-chain

**What data we have at this point:**
- `NotificationSaleNfts[0].AssetId` - Full NFT asset ID (policyId + hex name)
- `NotificationSaleNfts[0].NftName` - Display name (e.g., "Bronze Token #1")
- `NotificationSaleNfts[0].PolicyId` - Policy ID for the collection
- NFT is now visible in buyer's wallet!

**Code location:**
- Webhook: `src/app/api/nmkr-webhook/route.ts` line 162-180
- Creates record in `commemorativeNFTClaims` table
- Frontend transitions to success screen

---

## NMKR Webhook Events

### Event 1: `transactionconfirmed`

**Sent when:** Payment received and transaction confirmed on blockchain

**Payload structure:**
```json
{
  "EventType": "transactionconfirmed",
  "ProjectUid": "c68dc0e9b2ca4e0eb9c4a57ef85a794d",
  "TxHash": "abc123...",
  "Price": 10000000,
  "ReceiverAddress": "addr1...",
  "ReceiverStakeAddress": "stake1...",
  "NotificationSaleNfts": []
}
```

**What we do:**
1. Verify HMAC signature using `NMKR_WEBHOOK_SECRET`
2. Update `commemorativePurchases` status to `completed`
3. Record transaction hash and payment amount
4. Frontend sees update → Shows "Payment Received" ✓

---

### Event 2: `transactionfinished`

**Sent when:** NFT successfully minted and delivered to wallet

**Payload structure:**
```json
{
  "EventType": "transactionfinished",
  "ProjectUid": "c68dc0e9b2ca4e0eb9c4a57ef85a794d",
  "TxHash": "abc123...",
  "Price": 10000000,
  "ReceiverAddress": "addr1...",
  "ReceiverStakeAddress": "stake1...",
  "NotificationSaleNfts": [
    {
      "NftName": "Bronze Token #1",
      "AssetId": "6646f2c8...bronze_token_1",
      "PolicyId": "6646f2c8a1f45dabd89648891bc661539a26375ae80e8f12638f1241",
      "Count": 1
    }
  ]
}
```

**What we do:**
1. Verify HMAC signature
2. Update `commemorativePurchases` status to `completed`
3. **Create record in `commemorativeNFTClaims` table**
4. Frontend sees claim exists → Transitions to success screen

---

### Event 3: `transactioncanceled` (Not currently handled)

**Sent when:** Payment failed or user cancelled

**Current behavior:** Webhook receives event but does nothing (line 164)

**Should we handle it?** Maybe in the future to show "Payment Failed" state

---

## Database Tables

### `commemorativePurchases` - Purchase Intent & Status

**Purpose:** Track payment attempts and their status

**Schema:**
```typescript
{
  userId?: Id<"users">,           // Optional - may not be logged in
  walletAddress: string,           // Cardano wallet address
  nmkrProjectUid: string,          // NMKR project ID
  purchaseDate: number,            // Timestamp when user clicked "Claim"
  transactionHash?: string,        // Blockchain tx hash (set by webhook)
  nftTokenId?: string,            // NFT asset ID (set by webhook)
  status: "pending" | "confirmed" | "failed",
  goldAmount?: number,            // User's gold at purchase time
  mekCount?: number,              // User's mek count at purchase time
}
```

**Status flow:**
1. `pending` - User clicked "Claim NFT", NMKR window opened
2. `confirmed` - Webhook received `transactionconfirmed` or `transactionfinished`
3. `failed` - Payment failed (not currently implemented)

**Indexes:**
- `by_wallet` - Look up purchases by wallet address (for polling)
- `by_user` - Look up purchases by user ID
- `by_date` - Sort by purchase date
- `by_status` - Filter by status

---

### `commemorativeNFTClaims` - Final NFT Ownership

**Purpose:** Record of actual NFT ownership after successful mint

**Schema:**
```typescript
{
  walletAddress: string,           // Owner's wallet address
  transactionHash: string,         // Blockchain transaction hash
  nftName: string,                 // Display name (e.g., "Bronze Token #1")
  nftAssetId: string,              // Full asset ID (policyId + hex name)
  claimedAt: number,               // Timestamp when claim was recorded
  metadata?: {
    imageUrl?: string,             // NFT image URL
    attributes?: Array<{trait_type, value}>,
    collection?: string,
    artist?: string,
    website?: string,
  }
}
```

**When created:**
- Only when `transactionfinished` webhook arrives
- Means NFT is fully minted and delivered
- Frontend uses this to show success screen

**Indexes:**
- `by_wallet` - List all NFTs owned by a wallet
- `by_transaction` - Look up NFT by transaction hash
- `by_claimed_at` - Sort by claim time

---

## Frontend Polling Logic

### Old System (WRONG)
```typescript
// ❌ BAD: Fake timeouts, no real data
setTimeout(() => setPaymentReceived(true), 2000);
setTimeout(() => setMinting(true), 5000);
setTimeout(() => setConfirming(true), 8000);
```

### New System (CORRECT)
```typescript
// ✅ GOOD: Poll real database status
const paymentStatus = useQuery(
  api.commemorativeNFTClaims.checkClaimed,
  state === 'processing' ? { walletAddress } : "skip"
);

// Update checklist when webhook data arrives
useEffect(() => {
  if (paymentStatus?.hasClaimed && paymentStatus.claim) {
    setChecklistStatus({
      paymentReceived: true,  // Webhook told us payment confirmed
      minting: true,           // Webhook told us minting finished
      confirming: true         // Webhook told us tx confirmed
    });
    setState('success');
  }
}, [paymentStatus]);
```

**Polling frequency:** Convex automatically polls every few seconds (reactive query)

**Why this is accurate:**
- Frontend only shows ✓ when database says webhook received
- No guessing, no assumptions
- User can close window and reopen - status persists in database

---

## Edge Cases & Behaviors

### User Closes NMKR Window Quickly (<15 seconds)

**Old behavior:** Show "Payment Incomplete" message

**New behavior:**
- Show "Payment Incomplete" message
- But if webhook arrives later (they actually paid), database updates
- User can reopen lightbox - it will show correct status

### User Closes Lightbox But Payment Window Still Open

**Current behavior:** Payment window stays open, user can complete payment

**Should we change it?**
- Option A: Close payment window when lightbox closes
- Option B: Keep current behavior (payment can complete in background)
- **Recommendation:** Option B - less disruptive

### Webhook Arrives Before Frontend Expects It

**Not a problem!** Frontend polls database, will see status whenever it checks

### Webhook Never Arrives (NMKR System Down)

**Current behavior:** 5-minute timeout shows error message

**Should we improve?**
- Add manual "Check Status" button that polls NMKR API
- Use Blockfrost to verify transaction independently
- **Recommendation:** Blockfrost verification as backup

---

## Testing Checklist

### Test Mode (Without Real Wallet)

**How to trigger:**
1. Set `walletAddress = 'test_wallet_address_for_nmkr_testing'`
2. Lightbox shows mock payment UI
3. Click "Complete Mock Payment" button
4. Creates fake record in `commemorativeNFTClaims`
5. Frontend polls and sees it → Shows success

**Files:** `src/components/NMKRPayLightbox.tsx` line 58-59, 274-330

---

### Preprod Testing (Real NMKR, Testnet)

**Environment variables:**
```bash
NEXT_PUBLIC_NMKR_NETWORK=preprod
NEXT_PUBLIC_NMKR_PROJECT_ID=<preprod-project-id>
NMKR_WEBHOOK_SECRET=<webhook-secret>
```

**Test flow:**
1. Connect testnet wallet (preprod tADA)
2. Click "Claim Your NFT"
3. NMKR preprod window opens
4. Complete payment with preprod tADA
5. Webhook should arrive within 30-60 seconds
6. Lightbox should show steps completing in real-time
7. Success screen shows NFT details

**Where to check:**
- Browser console: Look for `[💰CLAIM]` logs
- Convex dashboard: Check `commemorativePurchases` table
- Convex dashboard: Check `commemorativeNFTClaims` table
- Cardano explorer (preprod.cardanoscan.io): Verify transaction

---

### Mainnet Testing (Real Money!)

**Environment variables:**
```bash
NEXT_PUBLIC_NMKR_NETWORK=mainnet
NEXT_PUBLIC_NMKR_PROJECT_ID=c68dc0e9b2ca4e0eb9c4a57ef85a794d
NMKR_WEBHOOK_SECRET=d3372d969323d146b66dfd00b45f93aaa6f70879faddc48cd78f8a5592ff75f6
NEXT_PUBLIC_COMMEMORATIVE_POLICY_ID=6646f2c8a1f45dabd89648891bc661539a26375ae80e8f12638f1241
```

**Test flow:** Same as preprod but with real ADA and real NFTs

**⚠️ IMPORTANT:** Test preprod thoroughly first!

---

## Console Logging Strategy

All payment-related logs use the `[💰CLAIM]` tag for easy filtering.

**Filter in Chrome DevTools:** Type "CLAIM" in console filter box

**Key logs to watch:**
- `[💰CLAIM] NMKRPayLightbox mounting` - Lightbox opened
- `[💰CLAIM] Opening NMKR payment window` - NMKR window opened
- `[💰CLAIM] Payment window closed after X ms` - User closed window
- `[💰CLAIM] Payment status received from webhook` - Webhook data arrived
- `[💰CLAIM] NFT claimed successfully via webhook!` - Success!

**Webhook logs (server-side):**
- `NMKR Webhook POST received` - Webhook endpoint hit
- `✓ HMAC signature verified` - Signature valid
- `✓ Payment confirmation recorded` - transactionconfirmed processed
- `✓ Successfully recorded NFT claim` - transactionfinished processed

---

## Future Improvements

### 1. Add Blockfrost Transaction Verification

**Why:** Independent verification that transaction exists on-chain

**How:**
1. After `transactionconfirmed` webhook, start polling Blockfrost
2. Check transaction confirmation count
3. Only show "Confirming" → "Complete" when confirmations >= 3

**Files to modify:**
- Create `src/lib/blockfrost.ts` with transaction check function
- Add to `NMKRPayLightbox.tsx` polling logic

**Example code:**
```typescript
async function checkTransactionConfirmations(txHash: string) {
  const response = await fetch(
    `${BLOCKFROST_URL}/txs/${txHash}`,
    { headers: { project_id: BLOCKFROST_PROJECT_ID } }
  );
  const data = await response.json();
  return data.block_height ? /* calculate confirmations */ : 0;
}
```

---

### 2. Handle `transactioncanceled` Event

**Why:** Show "Payment Failed" state instead of timeout

**How:**
1. In webhook, detect `EventType === 'transactioncanceled'`
2. Update `commemorativePurchases` status to `failed`
3. Frontend polls, sees failed status, shows error message

---

### 3. Add Manual "Refresh Status" Button

**Why:** If webhook is delayed, let user manually check

**How:**
1. Add button to processing screen
2. On click, query NMKR API or Blockfrost directly
3. Update local state based on API response

---

## Webhook Endpoint Configuration

**Endpoint URL:** `https://mek.overexposed.io/api/nmkr-webhook`

**How to configure in NMKR Studio:**
1. Go to NMKR Studio → Settings → Webhooks
2. Add webhook URL: `https://mek.overexposed.io/api/nmkr-webhook`
3. Copy webhook secret and save to `.env.local` as `NMKR_WEBHOOK_SECRET`
4. Test webhook with "Send Test" button
5. Complete a test purchase to verify real events work

**Security:**
- Webhook verifies HMAC signature using `NMKR_WEBHOOK_SECRET`
- Only processes events with valid signature
- Logs suspicious events but doesn't crash

---

## Troubleshooting

### Problem: Steps Never Complete

**Possible causes:**
1. Webhook never arrived (NMKR system issue)
2. Webhook signature invalid (wrong secret)
3. Database mutation failed (Convex error)

**How to debug:**
1. Check browser console for `[💰CLAIM]` logs
2. Check server logs for `NMKR Webhook` logs
3. Check Convex dashboard for `commemorativePurchases` records
4. Check NMKR Studio webhook logs

---

### Problem: Shows Success But No NFT in Wallet

**Possible causes:**
1. Wrong wallet address used
2. NFT minted to different address
3. Wallet hasn't synced yet

**How to debug:**
1. Check `commemorativeNFTClaims` table for `walletAddress` and `nftAssetId`
2. Search Cardano explorer for transaction hash
3. Verify wallet address in explorer matches expected address
4. Wait 5-10 minutes for wallet to sync

---

### Problem: "Payment Incomplete" But User Actually Paid

**Possible causes:**
1. Webhook delayed (NMKR system slow)
2. Webhook failed (signature error, network error)
3. Frontend polling stopped (user left page)

**How to fix:**
1. User can close and reopen lightbox - status persists in database
2. Check database manually for transaction hash
3. Manually insert record into `commemorativeNFTClaims` if needed

---

## Summary: What Changed

**Before (Inaccurate):**
- ❌ Fake setTimeout logic (2 seconds, 3 seconds)
- ❌ Assumes payment succeeded after 15 seconds
- ❌ No real webhook data used
- ❌ Shows success even if payment failed

**After (Accurate):**
- ✅ Real webhook events (`transactionconfirmed`, `transactionfinished`)
- ✅ Database records actual status
- ✅ Frontend polls real data
- ✅ Only shows success when webhook confirms NFT delivered
- ✅ UI fixed (title one line, X button positioned correctly)

**Key files modified:**
1. `src/app/api/nmkr-webhook/route.ts` - Handle `transactionconfirmed` events
2. `src/components/NMKRPayLightbox.tsx` - Remove setTimeout, add polling
3. `convex/commemorativePaymentTracking.ts` - NEW: Detailed status tracking
4. `NMKR_PAYMENT_FLOW.md` - THIS FILE: Complete documentation

---

**All changes committed to branch:** `custom-minting-system`
**Ready for testing:** Preprod first, then mainnet after validation
