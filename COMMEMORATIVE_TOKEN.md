# Commemorative Token #1 - NMKR Payment Integration

## Overview

**Purpose:** Reward early users who verified wallets and accumulated gold by offering a commemorative NFT for purchase via NMKR.

**Business Model:** Pay-to-claim (5 ADA) using NMKR's payment widget

**Target Users:** Any user with:
- Connected wallet (blockchain verified via Blockfrost)
- Gold amount > 0 (having 1+ Mek automatically qualifies)
- No previous purchase (1 NFT per qualified user)

**Campaign Name:** "Commemorative Token 1"

---

## System Architecture

### Payment Flow (NMKR Widget Handles Everything)

```
User (verified + gold > 0)
  → Sees banner "Claim Your Commemorative NFT - 5 ADA"
  → Clicks "Purchase NFT"
  → We check: not already purchased
  → We fetch their payment address (addr1...) from connected wallet
  → NMKR payment widget opens (pre-filled with their address)
  → User confirms payment (5 ADA)
  → NMKR processes payment automatically
  → NMKR mints and sends NFT to their wallet
  → NMKR webhook notifies our backend (payment succeeded)
  → We record purchase in database
  → Banner updates to "NFT Purchased! Check your wallet"
```

**Key Advantage:** NMKR handles ALL the complex parts:
- Payment processing
- NFT minting
- Blockchain transaction
- Error handling
- Transaction confirmation

**We only handle:**
- Eligibility check (verified + gold > 0)
- One-per-user enforcement
- Fetching payment address from wallet
- Opening NMKR widget
- Recording successful purchases via webhook

---

## User Eligibility Requirements

### Must Have:
1. **Verified Wallet** - Completed Blockfrost signature verification
2. **Gold > 0** - Any amount qualifies (1 Mek = instant qualification)
3. **No Previous Purchase** - Check `commemorativePurchases` table

### Auto-Qualification:
- Any user with ≥1 Mek automatically has gold > 0
- Meks generate gold passively
- Even brand new Mek = immediately eligible

### Checking Eligibility:
```typescript
const isEligible = (
  user.isBlockchainVerified === true &&
  currentGold > 0 &&
  !alreadyPurchased
);
```

---

## Database Schema

### New Table: `commemorativePurchases`

```typescript
commemorativePurchases: defineTable({
  userId: v.id("users"),
  walletAddress: v.string(), // Their verified stake address
  paymentAddress: v.string(), // addr1... where NFT was sent
  campaignName: v.string(), // "Commemorative Token 1"

  goldAtPurchase: v.number(), // Proof they were eligible
  purchasedAt: v.number(), // Timestamp

  // NMKR Data (from webhook)
  nmkrTransactionId: v.optional(v.string()),
  nmkrPaymentId: v.optional(v.string()),
  transactionHash: v.optional(v.string()), // Cardano tx hash
  policyId: v.optional(v.string()),
  assetName: v.optional(v.string()),

  // Status
  status: v.union(
    v.literal("pending"),    // Widget opened, awaiting payment
    v.literal("paid"),       // Payment confirmed, NFT minting
    v.literal("completed"),  // NFT successfully sent
    v.literal("failed")      // Payment or minting failed
  ),

  errorMessage: v.optional(v.string()),
})
  .index("by_user", ["userId"])
  .index("by_wallet", ["walletAddress"])
  .index("by_campaign", ["campaignName"])
  .index("by_status", ["status"]);
```

### Existing Table: `airdropConfig` (Repurposed)

Rename or reuse for campaign settings:
- `campaignName`: "Commemorative Token 1"
- `isActive`: Master on/off switch
- `nmkrProjectId`: NMKR project ID
- `price`: 5 (ADA)
- `testMode`: Enable for testnet testing
- `testWallets`: Whitelist during testing

---

## NMKR Integration

### API Credentials

**NMKR API Key:** `b51a09ab3dd14e2a83140a2a77b8bb80`
- **Created:** 2025-10-22
- **Expires:** 2026-10-22
- **Environment Variable:** `NMKR_API_KEY` (stored in `.env.local`)
- **Usage:** Server-side API calls for project creation, NFT upload, and minting

### NMKR Payment Widget

**Documentation:** https://docs.nmkr.io/developer-tools/pay-button

**Implementation:**
```html
<script src="https://pay.nmkr.io/widget/v1/paybutton.js"></script>

<button id="nmkr-pay-button">Buy NFT - 5 ADA</button>

<script>
  NMKR.PayButton.init({
    projectId: "{NMKR_PROJECT_ID}",
    receiverAddress: "{USER_ADDR1_ADDRESS}",
    price: 5,
    network: "testnet", // or "mainnet"
    onSuccess: (data) => {
      // Call our backend webhook
      recordPurchase(data);
    },
    onError: (error) => {
      console.error("Payment failed:", error);
    }
  });
</script>
```

### Webhook Integration

**NMKR sends webhook to our backend when:**
- Payment confirmed
- NFT minted
- NFT sent to user

**Our endpoint:** `/api/nmkr-webhook`

**Webhook payload:**
```json
{
  "transactionId": "...",
  "paymentId": "...",
  "receiverAddress": "addr1...",
  "transactionHash": "...",
  "assetName": "...",
  "policyId": "...",
  "status": "completed"
}
```

**We update database:**
```typescript
await ctx.db.patch(purchaseId, {
  status: "completed",
  nmkrTransactionId: data.transactionId,
  transactionHash: data.transactionHash,
  policyId: data.policyId,
  assetName: data.assetName,
});
```

---

## Wallet Address Extraction

### Problem: We Only Have Stake Address

User's connected wallet gives us `stake1...` address, but NFTs should be sent to payment address `addr1...`

### Solution: CIP-30 Wallet API

```typescript
// Get connected wallet instance
const wallet = await window.cardano[walletName].enable();

// Get payment addresses (returns array of Bech32 encoded addresses)
const addressesHex = await wallet.getUsedAddresses();

// Decode from hex to Bech32 (addr1...)
const paymentAddress = decodeAddress(addressesHex[0]);

// Pass to NMKR widget
NMKR.PayButton.init({
  receiverAddress: paymentAddress, // addr1...
  // ...
});
```

**Fallback:** If we can't get payment address:
- Let user manually enter addr1... address
- Validate Bech32 format
- Store for future use

---

## User Flow (Frontend)

### Step 1: Banner Visibility
**Location:** Global (all pages)
**Component:** `CommemorativeNFTBanner.tsx`

**Logic:**
```typescript
// Check eligibility
const goldMining = await getGoldMining(userId);
const currentGold = calculateCurrentGold(goldMining);
const previousPurchase = await getPurchase(userId, "Commemorative Token 1");

if (
  user.isBlockchainVerified &&
  currentGold > 0 &&
  !previousPurchase &&
  config.isActive
) {
  // Show banner
  if (config.testMode) {
    // Only show if in testWallets
    if (config.testWallets.includes(user.walletAddress)) {
      showBanner = true;
    }
  } else {
    showBanner = true;
  }
}
```

### Step 2: Purchase Click
**User clicks "Purchase NFT" button**

1. Fetch payment address from wallet (CIP-30 API)
2. Create pending purchase record in database
3. Open NMKR payment widget with:
   - Project ID
   - Payment address (addr1...)
   - Price: 5 ADA
   - Network: testnet or mainnet

### Step 3: Payment Processing
**User completes payment in NMKR widget**

- NMKR handles payment validation
- NMKR mints NFT
- NMKR sends NFT to user's addr1... address
- NMKR sends webhook to our backend

### Step 4: Confirmation
**Our backend receives webhook**

1. Verify webhook signature (NMKR security)
2. Find purchase record by walletAddress + campaignName
3. Update status to "completed"
4. Store transaction hash
5. Frontend polls for status update
6. Banner changes to "NFT Sent! View in Wallet"

---

## Testnet Development Strategy

### The Challenge: No Meks on Testnet

**The Problem:**
- Testnet is a **completely separate blockchain** from mainnet
- Your 4000+ Mek NFTs exist on mainnet only
- On testnet, wallets are empty (no Meks, no gold history)
- Eligibility requires verified wallet + gold > 0
- Gold comes from owning Meks... which don't exist on testnet

**Solution: Don't recreate the entire NFT ecosystem - mock eligibility instead.**

### Recommended Approach: Partial Mock (Option B)

**Environment-Based Testing:**
```bash
# .env.local (testnet)
TESTNET_MODE=true
NMKR_NETWORK=testnet
NMKR_PROJECT_ID=<testnet-project-id>

# .env.local (mainnet)
TESTNET_MODE=false
NMKR_NETWORK=mainnet
NMKR_PROJECT_ID=<mainnet-project-id>
```

**Testnet Behavior:**
- ✅ Real wallet connection (Eternl/Nami/Flint)
- ✅ Real signature verification (Blockfrost works on testnet!)
- ✅ Real payment flow (5 tADA)
- ✅ Real NFT delivery
- ⚠️ **MOCKED:** Gold/Mek ownership check (auto-pass)
- ⚠️ **MOCKED:** Gold balance display (show fake 9999)

**Eligibility Logic with Testnet Override:**
```typescript
// convex/commemorative.ts
export const checkEligibility = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { eligible: false, reason: "User not found" };

    // TESTNET MODE: Auto-qualify if wallet connected
    const isTestnet = process.env.TESTNET_MODE === "true";
    if (isTestnet && user.walletAddress) {
      return {
        eligible: true,
        reason: "Testnet auto-qualified",
        goldAmount: 9999,
        mekCount: 42,
        testMode: true,
      };
    }

    // MAINNET: Real checks
    const goldMining = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", q => q.eq("walletAddress", user.walletAddress))
      .first();

    const currentGold = calculateGold(goldMining);
    const verified = user.isBlockchainVerified === true;

    return {
      eligible: verified && currentGold > 0,
      reason: !verified ? "Not verified" : currentGold === 0 ? "No gold" : "Qualified",
      goldAmount: currentGold,
      mekCount: goldMining?.mekCount || 0,
      testMode: false,
    };
  },
});
```

### What Gets Tested on Testnet

**Payment Flow (Primary Goal):**
- [x] NMKR widget opens correctly
- [x] User pays 5 tADA (free testnet ADA)
- [x] NFT mints successfully
- [x] NFT arrives in wallet
- [x] Webhook notification received
- [x] Database records purchase
- [x] UI updates to "NFT Sent!"
- [x] Transaction link works (testnet.cardanoscan.io)

**Wallet Integration:**
- [x] Wallet connection (Eternl testnet mode)
- [x] Signature verification via Blockfrost
- [x] Payment address extraction (CIP-30 API)
- [x] Multiple wallet support (Nami, Flint, etc.)

**UI/UX:**
- [x] Banner visibility
- [x] Purchase button interaction
- [x] Loading states
- [x] Success/error messages
- [x] Responsive design

**What Gets Mocked:**
- [ ] Mek ownership (bypassed)
- [ ] Gold calculation (fake value)
- [ ] Gold accumulation history (not tested)

### Testnet → Mainnet Switch (15 Minutes)

**Step 1: Create Mainnet NMKR Project**
- Copy testnet project settings
- Upload same GIF artwork
- Set price to 5 ADA (not tADA)
- Copy new Project ID

**Step 2: Update Environment Variables**
```bash
TESTNET_MODE=false
NMKR_NETWORK=mainnet
NMKR_PROJECT_ID=<new-mainnet-id>
```

**Step 3: Deploy**
- Code unchanged (environment handles switching)
- Real eligibility checks activate automatically
- Test with your own wallet first (costs 5 ADA)

**That's it!** No code changes needed - just config.

### Testing Timeline

**Week 1: Testnet Development**
- Set up NMKR testnet project
- Get testnet tADA from faucet
- Implement payment widget
- Test purchase flow
- Verify NFT delivery
- Test webhook integration
- Test with multiple wallets

**Week 2: Mainnet Preparation**
- Create mainnet NMKR project
- Switch environment variables
- Deploy to production
- Test with own wallet (1 purchase)
- Verify real eligibility checks work
- Test with test wallet (if available)

**Week 3: Launch**
- Enable for all users
- Monitor first purchases
- Verify transactions
- Community announcement

### Alternative Strategies (Not Recommended)

**Option A: Full Bypass**
- Auto-qualify everyone on testnet
- Skip all checks
- Pros: Simplest
- Cons: Doesn't test eligibility UI

**Option C: Test Data in Database**
- Create fake user records with fake gold
- Create fake Mek metadata (not real NFTs)
- Pros: Most realistic
- Cons: Complex, database pollution, still not real NFTs

**Why Option B (Partial Mock) is Best:**
- Tests real wallet integration
- Tests real payment flow
- Tests real NFT delivery
- Minimal mocking (only gold/Meks)
- Easy to switch to mainnet
- No database pollution
- No fake NFT creation

---

## NMKR Project Setup

### Testnet Project (First)

**Steps:**
1. Go to NMKR Studio: https://studio.nmkr.io
2. Create New Project
3. Select **Cardano Testnet**
4. Upload NFT Metadata:
   - Name: "Early Miner Commemorative NFT"
   - Description: "Awarded to early supporters of Mek Tycoon who verified wallets and accumulated gold"
   - Image: Upload GIF file
   - Attributes (optional):
     - `type`: "Commemorative"
     - `series`: "1"
     - `rarity`: "Limited"
5. Set Price: 5 tADA (test ADA)
6. Enable Payment Widget
7. Copy Project ID
8. Configure Webhook URL: `https://mek.overexposed.io/api/nmkr-webhook`
9. Test with your own wallet first

### Mainnet Project (After Testing)

**Once testnet works:**
1. Create new project on **Cardano Mainnet**
2. Use same metadata and settings
3. Copy new Project ID
4. Update `airdropConfig` in database
5. Switch `network: "mainnet"` in widget code

**Easy to Switch:**
- Just update project ID in config
- Change network parameter
- Deploy updated code
- ~15 minutes total

---

## Implementation Checklist

### Phase 1: NMKR Project Setup (Testnet)
- [ ] Create NMKR account
- [ ] Create testnet project
- [ ] Upload GIF artwork
- [ ] Configure metadata (name, description, attributes)
- [ ] Set price to 5 tADA
- [ ] Enable payment widget
- [ ] Configure webhook URL
- [ ] Get testnet tADA from faucet
- [ ] Test purchase with your own wallet
- [ ] Verify NFT appears in wallet

### Phase 2: Database Changes
- [ ] Create `commemorativePurchases` table in schema
- [ ] Add indexes (by_user, by_wallet, by_campaign, by_status)
- [ ] Deploy schema changes to Convex
- [ ] Test table creation

### Phase 3: Backend Logic
- [ ] Create `getPurchase` query (check if user already bought)
- [ ] Create `getEligibleUsers` query (verified + gold > 0)
- [ ] Create `createPurchase` mutation (pending record)
- [ ] Create `/api/nmkr-webhook` endpoint
- [ ] Implement webhook verification
- [ ] Test webhook with NMKR's test tool

### Phase 4: Frontend - Payment Address Extraction
- [ ] Create utility function to get wallet instance
- [ ] Implement `getPaymentAddress()` using CIP-30 API
- [ ] Add hex to Bech32 decoding
- [ ] Test with Eternl wallet (user's wallet)
- [ ] Add fallback for manual address entry
- [ ] Validate Bech32 format

### Phase 5: Frontend - Banner Component
- [ ] Create `CommemorativeNFTBanner.tsx`
- [ ] Implement eligibility logic
- [ ] Add styling (industrial theme)
- [ ] Test mode visibility (testWallets only)
- [ ] Position globally (all pages)
- [ ] Make dismissible (temporary hide)

### Phase 6: Frontend - Payment Widget Integration
- [ ] Add NMKR widget script to layout
- [ ] Create purchase button handler
- [ ] Fetch payment address on click
- [ ] Initialize NMKR widget with config
- [ ] Handle success callback
- [ ] Handle error callback
- [ ] Show loading states

### Phase 7: Status Polling & Updates
- [ ] Poll database for purchase status
- [ ] Update banner when status changes
- [ ] Show "Processing..." state
- [ ] Show "Completed" with transaction link
- [ ] Generate Cardanoscan URL
- [ ] Handle error states

### Phase 8: Admin Dashboard
- [ ] Add purchases table to admin UI
- [ ] Show all purchases (wallet, status, tx hash)
- [ ] Filter by status
- [ ] Search by wallet address
- [ ] Display statistics (total sold, revenue, etc.)
- [ ] Manual override buttons (mark complete, refund)

### Phase 9: Testing (Testnet)
- [ ] Enable testMode in config
- [ ] Add your wallet to testWallets
- [ ] Verify banner appears when eligible
- [ ] Test purchase flow end-to-end
- [ ] Verify NFT arrives in wallet
- [ ] Test with different wallets (Eternl, Nami, etc.)
- [ ] Test error handling (insufficient funds, etc.)
- [ ] Verify webhook updates database correctly

### Phase 10: Mainnet Launch
- [ ] Create mainnet NMKR project
- [ ] Update project ID in config
- [ ] Change network to "mainnet"
- [ ] Disable testMode
- [ ] Set isActive to true
- [ ] Monitor first purchases
- [ ] Verify transactions on Cardanoscan
- [ ] Announce to community

---

## User Preferences & Decisions

### Confirmed Decisions (2025-10-20)

**Price:** 5 ADA per NFT

**Eligibility:**
- Must be blockchain verified (Blockfrost signature)
- Must have gold > 0 (any amount)
- One NFT per qualified user

**Network Strategy:**
- Start with Cardano Testnet for safe testing
- Switch to Mainnet after successful testnet verification
- Easy to switch (just update project ID)

**Payment Address:**
- Extract addr1... from connected wallet via CIP-30 API
- Allow user to edit if they want different address
- Both stake1... and addr1... can receive NFTs (but addr1... is standard)

**Artwork:**
- GIF format (ready)
- Commemorative theme
- Early supporter focus

**User Experience:**
- Banner visible on all pages when eligible
- NMKR widget handles payment (user pays with any wallet)
- Automatic NFT delivery to specified address
- Transaction confirmation link to Cardanoscan

---

## Technical Details

### CIP-30 Wallet API Methods

```typescript
// Get wallet instance
const cardano = window.cardano;
const wallet = await cardano[walletName].enable();

// Get payment addresses (returns hex-encoded addresses)
const usedAddresses = await wallet.getUsedAddresses();
// Returns: ["01abc..."] (hex format)

// Get unused addresses
const unusedAddresses = await wallet.getUnusedAddresses();

// Get change address
const changeAddress = await wallet.getChangeAddress();

// Decode hex to Bech32 (addr1...)
import { Address } from '@emurgo/cardano-serialization-lib-browser';
const address = Address.from_bytes(Buffer.from(usedAddresses[0], 'hex'));
const bech32Address = address.to_bech32();
// Returns: "addr1..."
```

### Address Validation

```typescript
function isValidCardanoAddress(address: string): boolean {
  // Payment address
  if (address.startsWith('addr1')) return validateBech32(address);

  // Stake address (also valid for NFTs)
  if (address.startsWith('stake1')) return validateBech32(address);

  // Testnet addresses
  if (address.startsWith('addr_test1')) return validateBech32(address);
  if (address.startsWith('stake_test1')) return validateBech32(address);

  return false;
}
```

---

## Known Issues & Questions

### Answered ✅
1. **Price:** 5 ADA (confirmed)
2. **Testnet vs Mainnet:** Start with testnet (confirmed)
3. **Wallet Address:** Use CIP-30 API to get addr1... (solution found)
4. **Eligibility:** Verified + gold > 0 (confirmed)
5. **One per user:** Yes, enforced by database (confirmed)
6. **Artwork:** GIF ready (confirmed)

### Still To Resolve ❓
1. **NFT Supply:** Unlimited or limited quantity? (check NMKR pricing)
2. **Metadata Attributes:** What attributes to include beyond name/description/image?
3. **Webhook Security:** How does NMKR sign webhooks for verification?
4. **Testnet tADA:** Where to get testnet ADA for testing? (faucet link needed)
5. **Widget Customization:** Can we style NMKR widget to match site theme?
6. **Transaction Time:** How long does NMKR take to send NFT after payment?
7. **Refunds:** What if user pays but NFT doesn't send? NMKR refund process?

### Security Considerations
1. **Webhook Verification:** Verify NMKR webhook signatures to prevent fake notifications
2. **Double Purchase Prevention:** Check database before allowing widget to open
3. **Address Validation:** Ensure user doesn't submit invalid addresses
4. **Rate Limiting:** Prevent spam purchases (if needed)

---

## Next Steps (Immediate)

### Right Now (NMKR Setup)
1. **Create NMKR Testnet Project**
   - Go to studio.nmkr.io
   - Create project on testnet
   - Upload GIF artwork
   - Set metadata

2. **Get Testnet tADA**
   - Find Cardano testnet faucet
   - Get test ADA for your wallet
   - Verify you can make test transactions

3. **Configure Project**
   - Set price to 5 tADA
   - Enable payment widget
   - Get project ID
   - Set webhook URL (can be localhost for now)

4. **Test Purchase**
   - Use NMKR's test widget on their site
   - Buy NFT with your wallet
   - Verify NFT appears in wallet
   - Confirm webhook fires

### This Week (Integration)
1. **Database Updates**
   - Add `commemorativePurchases` table
   - Deploy schema changes

2. **Backend Endpoints**
   - Create purchase queries/mutations
   - Build webhook endpoint
   - Test with NMKR webhook simulator

3. **Frontend - Payment Address**
   - Implement CIP-30 address extraction
   - Test with Eternl wallet
   - Add validation

4. **Frontend - Widget Integration**
   - Add NMKR script to site
   - Create purchase button
   - Test widget opening

### Next Week (Polish & Test)
1. **Banner Component**
   - Design and implement
   - Add eligibility logic
   - Style to match site

2. **End-to-End Testing**
   - Full flow on testnet
   - Multiple test wallets
   - Error scenarios

3. **Admin Dashboard**
   - Purchases table
   - Statistics
   - Manual controls

### Future (Launch)
1. **Mainnet Setup**
   - Create mainnet project
   - Switch config
   - Final testing

2. **Go Live**
   - Enable for all users
   - Monitor first sales
   - Community announcement

---

## Code References

### Database Schema
- **File:** `convex/schema.ts`
- **Table:** `commemorativePurchases` (to be added after line ~920)

### Backend Logic
- **File:** `convex/commemorative.ts` (to be created)
- **Functions to create:**
  - `getPurchase(userId, campaignName)` - Check if already purchased
  - `getEligibleUsers(campaignName)` - Count qualified users
  - `createPurchase(userId, paymentAddress, campaignName)` - Start purchase
  - `updatePurchaseStatus(purchaseId, status, nmkrData)` - Webhook handler

### Webhook Endpoint
- **File:** `src/app/api/nmkr-webhook/route.ts` (to be created)
- **Handles:** NMKR payment/minting notifications

### Frontend Components
- **Banner:** `src/components/CommemorativeNFTBanner.tsx` (to be created)
- **Widget Integration:** `src/lib/nmkr-widget.ts` (to be created)
- **Address Utils:** `src/lib/cardano-addresses.ts` (to be created)

### Admin UI
- **File:** `src/components/CommemorativeToken1Admin.tsx` (exists, needs updates)
- **Updates needed:**
  - Show purchases table instead of submissions
  - Add payment widget test button
  - Display revenue statistics

---

## Changelog

### 2025-10-20 (Late Evening)
- **Testnet strategy finalized:** Added comprehensive "Testnet Development Strategy" section
- **Partial mock approach:** Environment-based testing with auto-qualification on testnet
- **No fake NFTs needed:** Skip Mek ownership check on testnet, focus on payment flow
- **15-minute mainnet switch:** Just change environment variables and NMKR project ID
- **Code examples added:** checkEligibility query with testnet override logic
- **Testing timeline:** Week-by-week breakdown (testnet → mainnet → launch)

### 2025-10-20 (Evening)
- **Major pivot:** Changed from free airdrop to 5 ADA paid NFT
- **Implementation simplified:** NMKR widget handles everything
- **Testnet first strategy:** Confirmed for safe testing
- **Payment address solution:** CIP-30 API extraction method
- **Eligibility confirmed:** Verified + gold > 0, one per user
- **Artwork ready:** GIF format confirmed
- Document renamed from `NMKR_AIRDROP_IMPLEMENTATION.md` to `COMMEMORATIVE_TOKEN.md`
- Complete rewrite to reflect payment-based approach

### 2025-10-20 (Afternoon)
- Document created
- Initial airdrop approach documented
- Research phase completed

---

## Resources

### NMKR Documentation
- **Main Docs:** https://docs.nmkr.io
- **Payment Widget:** https://docs.nmkr.io/developer-tools/pay-button
- **API Reference:** https://studio-api.nmkr.io/docs
- **Webhook Guide:** https://docs.nmkr.io/webhooks

### Cardano Development
- **CIP-30 (Wallet API):** https://cips.cardano.org/cips/cip30/
- **Cardano Serialization Library:** https://github.com/Emurgo/cardano-serialization-lib
- **Address Format (CIP-19):** https://cips.cardano.org/cips/cip19/

### Testnet Tools
- **Testnet Faucet:** https://docs.cardano.org/cardano-testnet/tools/faucet/
- **Testnet Explorer:** https://testnet.cardanoscan.io
- **Get Test ADA:** Search "Cardano testnet faucet 2025"

### Libraries Needed
```bash
npm install @emurgo/cardano-serialization-lib-browser
# For address encoding/decoding
```

---

---

# PHASE 1 BETA COMMEMORATIVE TOKEN (CUSTOM MINTING)

## Overview - NEW IMPLEMENTATION (2025-10-23)

**IMPORTANT:** This is a DIFFERENT system from the NMKR-based commemorative token above. This uses our custom minting system with sequential editions.

**Purpose:** Reward Phase 1 beta testers with a commemorative NFT minted on-demand

**Business Model:** Pay-to-mint (10 ADA) using custom minting system

**Target Users:** Beta testers (anyone with activity in the Convex database)

**Key Features:**
- Sequential edition numbering: "Phase 1: I Was There #1", "#2", "#3", etc.
- Shared policy ID (can be reused for future commemorative drops)
- jpg.store compatible (CIP-25 + CIP-27 metadata with royalties)
- Mint on demand (not pre-minted)
- Atomic edition reservation (no race conditions)

---

## Technical Architecture

### Shared Minting Policy

**Challenge:** Need a policy that can be reused for multiple commemorative tokens over time.

**Solution:** Signature-based policy with NO time lock
```typescript
// Create long-lived policy (signature-based only)
const commemorativePolicy = {
  type: "sig",
  keyHash: TREASURY_KEY_HASH, // Controlled by project treasury
};

// This policy can mint multiple commemorative tokens:
// - "Phase 1: I Was There" (launch)
// - "Phase 2: First 1000 Players" (future)
// - "Anniversary Edition" (future)
// All share same policy ID for jpg.store collection
```

**Policy Management:**
- Treasury wallet holds signing key
- Backend signs minting transactions
- Policy never expires (no time lock)
- Can mint new commemorative tokens anytime

### Sequential Edition System

**Race Condition Prevention:**
```typescript
// convex/commemorativeTokens.ts

export const reserveEdition = mutation({
  args: {
    tokenType: v.string(), // "phase_1_beta"
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Check if user already minted this token
    const existing = await ctx.db
      .query("commemorativeTokens")
      .withIndex("by_wallet_type", q =>
        q.eq("walletAddress", args.walletAddress)
         .eq("tokenType", args.tokenType)
      )
      .first();

    if (existing) {
      throw new Error("Already minted this commemorative token");
    }

    // 2. Get current edition counter
    const counter = await ctx.db
      .query("commemorativeTokenCounters")
      .withIndex("by_type", q => q.eq("tokenType", args.tokenType))
      .first();

    let nextEdition = 1;
    if (counter) {
      nextEdition = counter.currentEdition + 1;
      // Atomic increment
      await ctx.db.patch(counter._id, {
        currentEdition: nextEdition,
      });
    } else {
      // First mint - create counter
      await ctx.db.insert("commemorativeTokenCounters", {
        tokenType: args.tokenType,
        currentEdition: 1,
      });
    }

    // 3. Reserve this edition for the user
    const reservationId = await ctx.db.insert("commemorativeTokens", {
      tokenType: args.tokenType,
      editionNumber: nextEdition,
      walletAddress: args.walletAddress,
      status: "reserved",
      reservedAt: Date.now(),
    });

    return {
      reservationId,
      editionNumber: nextEdition,
    };
  },
});
```

### Minting Flow

**Step-by-Step Process:**
```
1. User clicks "Mint Commemorative Token" button
   ↓
2. Frontend checks eligibility (beta tester?)
   ↓
3. Frontend checks if already minted (query Convex)
   ↓
4. Reserve edition number (Convex mutation - atomic)
   ↓
5. Build transaction:
   - Mint NFT: "Phase 1: I Was There #42"
   - Metadata: CIP-25 + CIP-27 (royalties)
   - Payment: 10 ADA to treasury address
   ↓
6. User signs transaction in wallet
   ↓
7. Submit to blockchain
   ↓
8. Wait for confirmation
   ↓
9. Update Convex:
   - Mark reservation as "minted"
   - Store txHash
   - Record timestamp
   ↓
10. NFT appears in user's wallet!
```

**Important:** Edition is reserved BEFORE minting to prevent race conditions. If minting fails, reservation can be cancelled or retried.

---

## Database Schema

### New Tables

```typescript
// Commemorative Token Counters (one row per token type)
commemorativeTokenCounters: defineTable({
  tokenType: v.string(), // "phase_1_beta", "phase_2_1000", etc.
  currentEdition: v.number(), // Auto-increments
  totalMinted: v.number(), // Confirmed mints only
  maxEditions: v.optional(v.number()), // Optional limit (null = unlimited)
})
  .index("by_type", ["tokenType"]),

// Commemorative Token Mints (one row per mint)
commemorativeTokens: defineTable({
  // Token Info
  tokenType: v.string(), // "phase_1_beta"
  editionNumber: v.number(), // 1, 2, 3, etc.
  policyId: v.string(), // Shared commemorative policy
  assetName: v.string(), // Hex-encoded name
  assetId: v.string(), // policyId.assetName

  // User Info
  walletAddress: v.string(),
  userId: v.optional(v.id("users")),

  // Minting Status
  status: v.union(
    v.literal("reserved"),    // Edition reserved, awaiting mint
    v.literal("minting"),     // Transaction submitted
    v.literal("confirmed"),   // NFT minted successfully
    v.literal("failed"),      // Minting failed
    v.literal("cancelled")    // Reservation cancelled
  ),

  // Blockchain Data
  txHash: v.optional(v.string()),
  explorerUrl: v.optional(v.string()),

  // Metadata
  nftName: v.string(), // "Phase 1: I Was There #42"
  imageUrl: v.string(), // IPFS URL

  // Timestamps
  reservedAt: v.number(),
  mintedAt: v.optional(v.number()),
  confirmedAt: v.optional(v.number()),

  // Payment
  paymentAmount: v.number(), // 10 (ADA)
  treasuryAddress: v.string(), // Where payment went
})
  .index("by_wallet_type", ["walletAddress", "tokenType"])
  .index("by_edition", ["tokenType", "editionNumber"])
  .index("by_status", ["status"])
  .index("by_tx_hash", ["txHash"])
  .index("by_minted_at", ["mintedAt"]),
```

---

## Eligibility Requirements

### Beta Tester Definition

**Who Qualifies:**
- Anyone who participated in Phase 1 beta testing
- Evidence in database:
  - Has user record
  - Has Mek ownership records
  - Has gold mining activity
  - Has wallet verification
  - Has any gameplay activity (story climb, achievements, etc.)

**Eligibility Check:**
```typescript
export const checkBetaTesterEligibility = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    // 1. Find user by wallet
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!user) {
      return {
        eligible: false,
        reason: "Not a registered user",
      };
    }

    // 2. Check if already minted
    const existingMint = await ctx.db
      .query("commemorativeTokens")
      .withIndex("by_wallet_type", q =>
        q.eq("walletAddress", args.walletAddress)
         .eq("tokenType", "phase_1_beta")
      )
      .first();

    if (existingMint) {
      return {
        eligible: false,
        reason: "Already minted this commemorative token",
        editionNumber: existingMint.editionNumber,
      };
    }

    // 3. Check beta participation (any activity qualifies)
    const goldMining = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .first();

    if (goldMining) {
      return {
        eligible: true,
        reason: "Beta tester - has gold mining activity",
        userId: user._id,
      };
    }

    // Add more checks as needed (achievements, story climb, etc.)

    return {
      eligible: false,
      reason: "No beta participation found",
    };
  },
});
```

---

## Metadata Format

### CIP-25 + CIP-27 Compliant

```typescript
export function buildCommemorativeMetadata(
  policyId: string,
  assetName: string,
  params: {
    editionNumber: number;
    tokenType: string; // "phase_1_beta"
    displayName: string; // "Phase 1: I Was There"
    imageUrl: string; // IPFS URL
    walletAddress: string;
  }
) {
  const network = process.env.NEXT_PUBLIC_CARDANO_NETWORK || 'preprod';
  const royaltyAddress = network === 'mainnet'
    ? process.env.NEXT_PUBLIC_ROYALTY_ADDRESS_MAINNET
    : process.env.NEXT_PUBLIC_ROYALTY_ADDRESS_TESTNET;
  const royaltyRate = process.env.NEXT_PUBLIC_ROYALTY_RATE || '0.05';

  return {
    "721": {
      [policyId]: {
        [assetName]: {
          // Required CIP-25 fields
          "name": `${params.displayName} #${params.editionNumber}`,
          "image": params.imageUrl,
          "mediaType": "image/gif",

          // CIP-27 Royalty fields
          "royalty_addr": royaltyAddress,
          "royalty_rate": royaltyRate,

          // Commemorative metadata
          "description": `Awarded to Phase 1 beta testers of Mek Tycoon. Edition ${params.editionNumber} of unlimited.`,
          "edition": params.editionNumber,
          "series": "Commemorative Tokens",
          "tokenType": params.tokenType,

          // Provenance
          "mintedBy": params.walletAddress,
          "mintTimestamp": Date.now(),

          // Marketplace tags
          "tags": [
            "Mek Tycoon",
            "Commemorative",
            "Phase 1",
            "Beta Tester",
            `Edition ${params.editionNumber}`
          ],

          // Project info
          "project": "Mek Tycoon",
          "category": "Commemorative Token",
          "website": "https://mek.overexposed.io"
        }
      }
    }
  };
}
```

---

## Implementation Plan

### Phase 1: Database Setup ✅ COMPLETED
- [x] Add `commemorativeTokenCounters` table to schema
- [x] Add `commemorativeTokens` table to schema
- [x] Deploy schema to Convex (deployed at 14:45:47)
- [ ] Create seed data for "phase_1_beta" counter (needs initializeTokenType mutation)

### Phase 2: Backend Logic ✅ COMPLETED
- [x] Create `checkBetaTesterEligibility` query
- [x] Create `reserveEdition` mutation
- [x] Create `confirmMint` mutation
- [x] Create `getCommemorativeTokens` query (admin: `getAllCommemorativeTokens`)
- [x] Create `getMyCommemorativeTokens` query (user)
- [x] Create `markMintFailed` mutation (error handling)
- [x] Create `cancelReservation` mutation (allow edition reuse)
- [x] Create `getTokenTypeInfo` query (shows next edition)
- [x] Create `getTokenTypeStats` query (statistics dashboard)
- [x] Create `initializeTokenType` mutation (admin setup)
- [x] Create `updateTokenType` mutation (admin configuration)
- [x] All functions deployed to Convex successfully

### Phase 3: Metadata Builder ✅ COMPLETED
- [x] Create `buildCommemorativeMetadata` function
- [x] Add to `/src/lib/cardano/metadata.ts` (line 205-263)
- [x] CIP-25 + CIP-27 compliant (royalty fields included)
- [ ] Test metadata validation (pending actual mint)

### Phase 4: Frontend UI ✅ COMPLETED
- [x] Create `CommemorativeMintButton.tsx` component (464 lines)
- [x] Add eligibility check on page load (uses `checkBetaTesterEligibility` query)
- [x] Show edition count: "Next Edition: #42" (uses `getTokenTypeInfo` query)
- [x] Implement mint flow with progress steps (5 states: reserving → building_tx → signing → submitting → confirming)
- [x] Add success confirmation with explorer link (links to Cardanoscan)
- [x] Integrated into profile page (`/profile`) - visible when user is viewing own profile
- [x] Error handling with retry functionality
- [ ] Test in browser (needs environment variables configured)

### Phase 5: Minting Transaction
- [ ] Generate/load shared commemorative policy
- [ ] Build transaction with:
  - NFT minting
  - 10 ADA payment to treasury
  - Metadata attachment
- [ ] Sign and submit
- [ ] Wait for confirmation

### Phase 6: Testing
- [ ] Test on preprod testnet
- [ ] Verify sequential editions work
- [ ] Test race condition prevention (multiple simultaneous mints)
- [ ] Verify jpg.store compatibility
- [ ] Confirm royalties work

### Phase 7: Admin Dashboard
- [ ] Display minted tokens table
- [ ] Show edition counter
- [ ] Statistics (total minted, latest edition, etc.)
- [ ] Manual controls (cancel reservation, refund, etc.)

---

## Payment Flow

### 10 ADA Payment

**Transaction Structure:**
```typescript
const tx = new Transaction({ initiator: wallet });

// 1. Mint NFT
tx.mintAsset(forgeScript, {
  assetName: assetName,
  assetQuantity: '1',
  metadata: commemorativeMetadata,
  label: '721',
  recipient: walletAddress,
});

// 2. Add 10 ADA payment to treasury
tx.sendLovelace(
  TREASURY_ADDRESS, // Your treasury wallet
  '10000000' // 10 ADA in lovelace
);

// User signs (pays tx fee + 10 ADA payment)
const unsignedTx = await tx.build();
const signedTx = await wallet.signTx(unsignedTx);
const txHash = await wallet.submitTx(signedTx);
```

**Treasury Address:**
- Set in environment variables
- Receives 10 ADA per mint
- Can be mainnet or testnet address

---

## jpg.store Compatibility

### Requirements for jpg.store

**CIP-25 Compliance:**
- ✅ Policy ID (shared commemorative policy)
- ✅ Asset name (hex-encoded)
- ✅ Name, image, mediaType
- ✅ Description

**CIP-27 Royalties:**
- ✅ `royalty_addr` (your royalty wallet)
- ✅ `royalty_rate` (0.05 = 5%)

**Collection Setup:**
- All commemorative tokens share same policy ID
- jpg.store auto-detects collection
- Tokens appear together in collection view
- Editions visible: "Phase 1: I Was There #1", "#2", etc.

---

## Race Condition Prevention

### The Problem

**Scenario:**
- User A clicks mint (edition 42 available)
- User B clicks mint simultaneously
- Both build transactions with edition 42
- One mint succeeds, other is duplicate

### The Solution

**Atomic Reservation:**
```typescript
// 1. Reserve edition FIRST (atomic mutation)
const { editionNumber } = await reserveEdition({
  tokenType: "phase_1_beta",
  walletAddress: userAddress,
});

// 2. Build transaction with reserved edition
const metadata = buildCommemorativeMetadata(
  policyId,
  assetName,
  {
    editionNumber: editionNumber, // Guaranteed unique
    // ...
  }
);

// 3. Mint with reserved edition
// If minting fails, reservation can be cancelled
```

**Benefits:**
- Edition reserved before wallet interaction
- No possibility of duplicate editions
- Failed mints can retry with same edition
- Cancelled reservations free up the edition

---

## Environment Variables

### Required

```bash
# Commemorative Token Policy
NEXT_PUBLIC_COMMEMORATIVE_POLICY_ID=
COMMEMORATIVE_POLICY_SCRIPT= # Server-side only

# Treasury Address (receives 10 ADA payments)
NEXT_PUBLIC_TREASURY_ADDRESS_TESTNET=
NEXT_PUBLIC_TREASURY_ADDRESS_MAINNET=

# Royalty Configuration (for jpg.store)
NEXT_PUBLIC_ROYALTY_ADDRESS_TESTNET=
NEXT_PUBLIC_ROYALTY_ADDRESS_MAINNET=
NEXT_PUBLIC_ROYALTY_RATE=0.05

# Token Images (IPFS)
NEXT_PUBLIC_PHASE_1_BETA_IMAGE_URL=ipfs://QmXxxx...
```

---

## Testing Checklist

### Preprod Testnet
- [ ] Create commemorative policy
- [ ] Set up treasury wallet
- [ ] Upload token image to IPFS
- [ ] Configure environment variables
- [ ] Test eligibility check
- [ ] Test edition reservation
- [ ] Mint first token (edition #1)
- [ ] Verify sequential numbering
- [ ] Test simultaneous mints (race condition)
- [ ] Verify payment to treasury
- [ ] Check metadata on Cardanoscan
- [ ] Verify jpg.store compatibility (if testnet supported)

### Mainnet Launch
- [ ] Create mainnet commemorative policy
- [ ] Update treasury address to mainnet
- [ ] Update royalty address to mainnet
- [ ] Switch to mainnet in environment
- [ ] Test with own wallet first (edition #1)
- [ ] Verify NFT appears in wallet
- [ ] Check jpg.store listing
- [ ] Announce to beta testers
- [ ] Monitor first 10 mints

---

## Changelog

### 2025-10-23 (Phase 4: UI Implementation)
- **Frontend Complete:** Created `CommemorativeMintButton.tsx` component (464 lines)
- **Profile Integration:** Added commemorative mint button to profile page (visible on own profile only)
- **Full Mint Flow:** Implemented complete mint flow with 5 progress states:
  - `reserving` - Atomic edition reservation
  - `building_tx` - Transaction construction with metadata
  - `signing` - Wallet signature request
  - `submitting` - Blockchain submission
  - `confirming` - Database confirmation
- **Error Handling:** Added retry functionality and failed mint tracking
- **Success State:** Shows edition number with Cardanoscan explorer link
- **Real-time Updates:** Component uses Convex queries for eligibility and edition count
- **Next Steps:** Environment variables setup, policy generation, IPFS upload

### 2025-10-23 (Phase 1-3: Backend & Schema)
- **New Implementation:** Added "Phase 1 Beta Commemorative Token" section
- **Custom Minting:** Using Phase 1 custom minting system (not NMKR)
- **Sequential Editions:** Atomic reservation system to prevent race conditions
- **Shared Policy:** Long-lived policy for multiple commemorative tokens
- **10 ADA Payment:** Treasury payment integrated into mint transaction
- **jpg.store Ready:** CIP-25 + CIP-27 compliant metadata
- **Database Schema:** Added 2 tables (`commemorativeTokenCounters`, `commemorativeTokens`)
- **Backend Functions:** Created 11 Convex functions (queries, mutations, admin)
- **Metadata Builder:** Added `buildCommemorativeMetadata()` function

---

## Notes for Future Claude Sessions

**START HERE when resuming:**
1. Read "Overview" section for business model
2. Check "Implementation Checklist" for current progress
3. Review "Next Steps (Immediate)" for priorities
4. Update "Changelog" with new progress

**Key Differences from Original Plan:**
- **Not a free airdrop** - users pay 5 ADA
- **NMKR widget does everything** - we don't manually mint/send
- **Much simpler** - just integrate widget + webhook
- **Testnet first** - safe testing before mainnet

**User's Confirmed Preferences:**
- 5 ADA price point
- Testnet for initial development
- Willing to pay to test (but testnet preferred)
- Has GIF artwork ready
- Wants simple, working solution

**Critical Implementation Detail:**
- We have stake1... address from user
- Need to get addr1... payment address via CIP-30 API
- NMKR widget needs addr1... for NFT delivery

**This is NOT a free airdrop - it's a paid commemorative NFT sale with eligibility requirements.**
