# Phase 1 Commemorative NFT - NMKR Studio Setup Guide

## Overview
This guide walks through setting up the Phase 1 Commemorative NFT campaign on NMKR Studio and integrating it with the Mek Tycoon claim system.

---

## Assets & Information Needed

### 1. NFT Metadata
- **Collection Name**: Phase 1 Commemorative Token (or your preferred name)
- **NFT Name Pattern**: "Phase 1 Corporation #[EDITION]" (sequential numbering)
- **Description**: Text describing the commemorative nature and Phase 1 significance
- **Price**: 10 ADA (as specified in AirdropClaimBanner.tsx)
- **Total Supply**: TBD - based on whitelist size

### 2. Visual Assets
- **Main NFT Image**: The commemorative token artwork
  - Format: PNG or JPG
  - Recommended size: 1000x1000px minimum
  - IPFS upload: NMKR will handle this

### 3. Metadata Fields (Optional)
Consider adding these on-chain attributes:
- "Edition": Sequential number
- "Phase": "1"
- "Claim Date": Dynamic (can be set during minting)
- "Corporation Stake Address": The claimer's stake address

---

## NMKR Studio Configuration Steps

### Step 1: Create New Project
1. Log into NMKR Studio (https://studio.nmkr.io)
2. Click "Create New Project"
3. Select project type: **Pay Per Mint** (users pay when claiming)
4. Choose network: **Cardano Mainnet** (or Preprod for testing)

### Step 2: Upload Assets & Metadata
1. Upload the commemorative token image
2. Configure metadata template:
   - Name: "Phase 1 Corporation #[EDITION]"
   - Description: Your commemorative message
   - Set price: 10 ADA
3. Set total supply (match whitelist size)
4. Enable sequential minting (ensures #1, #2, #3... order)

### Step 3: Payment Configuration
1. Set recipient wallet address (your treasury wallet)
2. Configure pricing:
   - Base price: 10 ADA
   - No dynamic pricing
   - No discounts (whitelist controls access)
3. Enable "Reserve to Address" functionality
   - This allows backend to reserve specific NFTs for specific addresses
   - Critical for whitelist integration

### Step 4: Get Integration Details
After project creation, you'll receive:
- **Project ID**: Used in API calls
- **Payment URL**: Base URL for payment window
- **API Key**: For backend reservation calls
- **Webhook URL**: (optional) For payment confirmations

**Save these values - you'll need them for code integration**

---

## Code Integration Points

### 1. Update Environment Variables
Add to `.env.local`:
```
NMKR_PROJECT_ID=your_project_id_here
NMKR_API_KEY=your_api_key_here
NMKR_PAYMENT_BASE_URL=https://pay.nmkr.io/?p=your_project_id
```

### 2. Update NMKRPayLightbox.tsx
Replace placeholder values around line 50-60:
```typescript
const NMKR_PROJECT_ID = process.env.NEXT_PUBLIC_NMKR_PROJECT_ID || 'YOUR_PROJECT_ID';
const NMKR_PAYMENT_URL = process.env.NEXT_PUBLIC_NMKR_PAYMENT_URL || 'https://pay.nmkr.io/?p=YOUR_PROJECT_ID';
```

### 3. Backend Reservation Function
The existing `createNFTReservation` mutation in `convex/commemorativeNFTReservationsCampaign.ts` will need the NMKR API key to call:
- NMKR API endpoint: `POST /v2/ReserveNft`
- Reserves specific NFT for specific Cardano address
- Returns reservation token used in payment URL

### 4. Payment Window URL Construction
Current code in NMKRPayLightbox.tsx builds URL like:
```typescript
const paymentUrl = `${NMKR_PAYMENT_URL}&tokenname=${encodeURIComponent(tokenName)}&count=1&reservation=${reservationId}`;
```

This will need the actual NMKR project values.

---

## Testing Approach

### Phase 1: Preprod Testing
1. Create NMKR project on **Cardano Preprod testnet**
2. Use test ADA and test stake addresses
3. Test full flow:
   - Enter stake address
   - Eligibility check (use test whitelist)
   - Reservation creation
   - Payment window opens
   - Complete payment with test ADA
   - Verify NFT received in test wallet

### Phase 2: Mainnet Deployment
1. Create production NMKR project on **Cardano Mainnet**
2. Upload final commemorative token artwork
3. Set real pricing (10 ADA)
4. Import production whitelist
5. Test with your own wallet first
6. Enable for public claiming

---

## Whitelist Integration

### Upload Whitelist to NMKR
Option A: **NMKR Built-in Whitelist** (if using NMKR's whitelist feature)
- Upload CSV of stake addresses
- NMKR handles eligibility checking

Option B: **Custom Backend Whitelist** (current approach)
- Keep whitelist in Convex database
- Backend checks eligibility before creating reservation
- More control, integrates with existing campaign system

**Recommendation**: Use Option B (current approach) since you already have the admin panel and whitelist management built.

---

## Next Steps Checklist

### Immediate:
- [ ] Gather/create commemorative token artwork
- [ ] Decide on metadata (name, description, attributes)
- [ ] Determine total supply (count whitelist addresses)

### NMKR Setup:
- [ ] Create NMKR Studio account (if not already)
- [ ] Set up Preprod test project
- [ ] Upload assets and configure pricing
- [ ] Enable "Reserve to Address" feature
- [ ] Get Project ID, API Key, Payment URL

### Code Integration:
- [ ] Add NMKR credentials to .env.local
- [ ] Update NMKRPayLightbox with real project values
- [ ] Test reservation flow on Preprod
- [ ] Verify payment window opens correctly

### Production:
- [ ] Create Mainnet NMKR project
- [ ] Import production whitelist
- [ ] Test with personal wallet
- [ ] Deploy to Sturgeon (production) when ready

---

## Important Notes

1. **Sequential Minting**: Make sure NMKR project has sequential numbering enabled so users get #1, #2, #3 in order
2. **Whitelist Timing**: Upload whitelist BEFORE opening claims (prevent non-eligible claims)
3. **Testing**: Always test full flow on Preprod before going live on Mainnet
4. **Pricing**: 10 ADA is currently hardcoded in multiple places - ensure NMKR matches
5. **Reservation Expiry**: NMKR reservations typically expire after 30 minutes - coordinate with your database

---

## Questions to Answer Before NMKR Setup

1. What is the final commemorative token artwork?
2. What should the total supply be? (based on whitelist size)
3. Should metadata include any special attributes beyond basic info?
4. Do you want preprod testing first, or go straight to mainnet?
5. What wallet address should receive the 10 ADA payments?

---

**Ready to proceed when you have the artwork and these details finalized.**
