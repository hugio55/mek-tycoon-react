# Custom Minting System Development Plan

**Project:** Mek Tycoon Custom NFT Minting System
**Started:** 2025-10-23
**Status:** Planning Phase
**Current Phase:** Not Started

---

## Table of Contents
- [Overview](#overview)
- [Why Custom vs NMKR](#why-custom-vs-nmkr)
- [Technical Architecture](#technical-architecture)
- [Development Phases](#development-phases)
- [Current Status](#current-status)
- [Key Decisions](#key-decisions)
- [Resources & References](#resources--references)

---

## Overview

Building a custom Cardano NFT minting system to replace NMKR for Mek Tycoon. This system will handle TWO distinct use cases:

### Use Case 1: Collectibles Collection (One-Off Art)
- **Purpose**: Mint individual NFTs for friends, special pieces, airdrops
- **Policy IDs**: Multiple (different projects/collections)
- **Workflow**: Admin uploads art, names it, sets metadata, mints, sends
- **Volume**: Low (occasional)
- **Similar to**: Existing NMKR admin portal functionality

### Use Case 2: Story Climb Event NFTs (Main Revenue System)
- **Purpose**: Monetize in-game achievements through NFT rewards
- **Policy ID**: ONE parent policy for all event NFTs
- **Structure**: Each event has 3 difficulty NFTs (Easy, Medium, Hard)
  - Easy: "E1: Skull Basher" (e.g., 100 max supply, 10 ADA)
  - Medium: "E1: Bone Crusher" (e.g., 50 max supply, 25 ADA)
  - Hard: "E1: Death Dealer" (e.g., 10 max supply, 100 ADA)
- **Naming Convention**: `E{eventNumber}: {CustomName}` (fully customizable per variation)
- **Pricing**: Configurable per variation, changeable in admin anytime before mint
- **Minting Type**: **ON-DEMAND** (user completes contract → pays ADA → minted to wallet)
- **Key Feature**: Avoids pre-minting all NFTs upfront (saves costs)
- **Integration**: Tied to Story Climb contract completion system

### Goals
- ✅ Full control over UX/UI (match industrial aesthetic)
- ✅ ~60% cost savings (2-3 ADA per mint vs NMKR fees)
- ✅ On-demand minting (no upfront costs for max supply)
- ✅ Contract completion → mint eligibility tracking
- ✅ Direct database integration (no webhooks)
- ✅ Support multiple policy IDs for different collections
- ✅ Admin tools for both collectibles and event management

---

## Why Custom vs NMKR

### NMKR Costs
- Transaction fee: ~0.17 ADA
- Min ADA locked: ~1.5-2 ADA
- **NMKR service fee: ~2-3 ADA** (this is what we're eliminating)
- **Total per mint: ~4.5 ADA**

### Custom System Costs
- Transaction fee: ~0.17 ADA
- Min ADA locked: ~1.5-2 ADA
- Blockfrost API: ~$50/month (fixed cost)
- IPFS pinning: ~$10-20/month
- **Total per mint: ~1.7-2.2 ADA**
- **Monthly fixed: ~$60-70**

### Break-Even Analysis
- **Break-even: ~25-30 mints per month**
- After that, pure savings
- For 1000 mints: Save ~$1,000

### What We DON'T Need (NMKR bloat)
- ❌ Fiat payment processing
- ❌ Random generation/reveal systems
- ❌ Whitelist/allowlist management
- ❌ Vending machine modes
- ❌ Generic collection templates
- ❌ Payment plans/installments

### What We GET with Custom
- ✅ Lean, efficient, exactly what we need
- ✅ Custom metadata structure for sub-assets
- ✅ Direct game integration
- ✅ Full control over pricing logic
- ✅ No external dependencies
- ✅ Better user experience (no redirects)

---

## Technical Architecture

### Core Components

#### 1. Minting Policy (Native Script)
**Type:** Simple JSON native script (NOT Plutus smart contract)

```json
{
  "type": "all",
  "scripts": [
    {
      "type": "sig",
      "keyHash": "your_key_hash"
    },
    {
      "type": "before",
      "slot": 99999999
    }
  ]
}
```

**Status:** Not created yet
**Testnet Policy ID:** TBD
**Mainnet Policy ID:** TBD

#### 2. Metadata Structure (CIP-25 + CIP-27)

**A) Event NFTs (Story Climb)**
```json
{
  "721": {
    "policy_id": {
      "event_1_easy_42": {
        "name": "E1: Skull Basher",
        "image": "ipfs://event1-easy-image-hash",
        "mediaType": "image/gif",
        "description": "Awarded for completing Event 1 on Easy difficulty",

        // Royalty info (CIP-27)
        "royalty_addr": "addr1_mek_tycoon_treasury",
        "royalty_rate": "0.05",

        // Event metadata
        "eventNumber": 1,
        "eventName": "Skull Challenge", // Internal event name
        "difficulty": "Easy",
        "displayName": "E1: Skull Basher", // What users see
        "maxSupply": 100,
        "mintNumber": 42, // Which # out of max supply (e.g., #42/100)
        "priceAda": 10, // Price paid for this mint

        // Provenance
        "mintedBy": "wallet_address",
        "mintTimestamp": 1729728000,
        "contractCompleted": "story_node_id_123"
      }
    }
  }
}
```

**B) Collectibles NFTs (One-Off Art)**
```json
{
  "721": {
    "policy_id_collectibles": {
      "gift_for_alice": {
        "name": "Special Mek Tribute",
        "image": "ipfs://collectible-image-hash",
        "mediaType": "image/png",
        "description": "Custom artwork for Alice",

        // Royalty info (CIP-27)
        "royalty_addr": "addr1_mek_tycoon_treasury",
        "royalty_rate": "0.05",

        // Custom fields (flexible)
        "artist": "Mek Tycoon Studios",
        "edition": "1 of 1",
        "recipient": "Alice",
        "occasion": "Birthday 2025"
      }
    }
  }
}
```

**Status:** Designed, not implemented

#### 3. Transaction Building
**Library:** MeshSDK (already installed)
**Fallback:** Lucid (if needed)

**Process:**
1. User selects Mek configuration (head/body/trait)
2. Calculate total cost: `mint_price + min_ADA + tx_fee`
3. Build transaction with minting policy
4. Attach metadata
5. Request signature from user's wallet (CIP-30)
6. Submit via Blockfrost
7. Monitor confirmation
8. Update Convex database

**Status:** Not started

#### 4. IPFS Integration
**Service:** Pinata or NFT.Storage
**Content to upload:**
- Individual head images (150px, 500px, 1000px)
- Individual body images (150px, 500px, 1000px)
- Individual trait images (150px, 500px, 1000px)
- Composite Mek images (generated on-demand)
- Metadata JSON files

**Strategy:**
- Pre-upload all variation images
- Generate composite images on crafting
- Pin metadata JSON at mint time

**Status:** Not started

#### 5. Payment Lightbox Component
**Framework:** React + TypeScript
**Styling:** Industrial design system (match existing aesthetic)

**Features:**
- Display Mek preview (composite image)
- Show cost breakdown:
  - Base mint price: X ADA
  - Min ADA locked: ~1.5 ADA
  - Transaction fee: ~0.17 ADA
  - **Total: ~XX.XX ADA**
- Wallet connection status
- Transaction preview (what they're approving)
- Policy ID verification display
- Step-by-step progress
- Error handling with clear messages

**Status:** Not started

#### 6. Convex Database Integration
**New Tables/Fields Needed:**
- Track minted NFTs (policy ID, asset name, metadata)
- Link NFTs to user wallets
- Store transaction hashes
- Minting history/logs
- Failed transaction tracking

**Status:** Schema not designed yet

---

## Development Phases

### Phase 1: Testnet Setup & Basic Flow (Week 1)
**Environment:** Cardano Preprod Testnet
**Goals:** Get basic payment → mint → confirmation working

**Tasks:**
- [ ] Set up testnet wallet (Nami/Eternl on preprod network)
- [ ] Get testnet ADA from faucet
- [ ] Set up Blockfrost testnet API key
- [ ] Create testnet minting policy
- [ ] Build basic payment lightbox UI
- [ ] Implement wallet connection (CIP-30)
- [ ] Calculate transaction costs
- [ ] Build simple minting transaction (MeshSDK)
- [ ] Submit to testnet
- [ ] Verify on Cardano testnet explorer
- [ ] Display success/failure to user

**Success Criteria:**
- User can connect wallet
- User sees cost breakdown
- User approves transaction in wallet
- NFT appears in testnet wallet
- Transaction visible on explorer

**Current Status:** Not started

---

### Phase 2: Metadata & IPFS (Week 2)
**Environment:** Testnet
**Goals:** Rich metadata, IPFS integration, proper NFT structure

**Tasks:**
- [ ] Set up IPFS service (Pinata or NFT.Storage)
- [ ] Upload test variation images to IPFS
- [ ] Generate composite test images
- [ ] Build metadata JSON generator
- [ ] Implement CIP-25 metadata structure
- [ ] Add CIP-27 royalty fields (5%)
- [ ] Include sub-asset details (head/body/trait)
- [ ] Add game stats to metadata
- [ ] Mint test NFTs with full metadata
- [ ] Verify metadata displays in wallets
- [ ] Verify metadata shows on testnet explorers
- [ ] Test different variation combinations

**Success Criteria:**
- NFT metadata shows correctly in wallet
- Sub-asset details visible
- Royalty info present
- Images display properly
- Game stats included

**Current Status:** Not started

---

### Phase 3: Edge Cases & Error Handling (Week 3)
**Environment:** Testnet
**Goals:** Robust error handling, multi-wallet support, UX polish

**Tasks:**
- [ ] Handle insufficient funds gracefully
- [ ] Handle wallet rejection (user cancels)
- [ ] Handle network errors (timeout, etc.)
- [ ] Handle duplicate mint attempts
- [ ] Test with multiple wallets (Nami, Eternl, Flint, Typhon)
- [ ] Test on mobile wallets
- [ ] Test with slow network
- [ ] Test with pending transactions
- [ ] Add transaction status polling
- [ ] Add retry mechanisms
- [ ] Improve loading states
- [ ] Add helpful error messages
- [ ] Get community testers to try testnet version
- [ ] Fix discovered bugs

**Success Criteria:**
- All error states handled gracefully
- Clear user feedback for all scenarios
- Works across major wallets
- Mobile-friendly
- Community validates UX

**Current Status:** Not started

---

### Phase 4: Game Integration (Week 3-4)
**Environment:** Testnet
**Goals:** Connect minting to crafting system, database integration

**Tasks:**
- [ ] Design Convex schema for minted NFTs
- [ ] Create mutations for mint tracking
- [ ] Link minted NFTs to user profiles
- [ ] Update crafting UI to include mint option
- [ ] Calculate mint cost based on variation rarity
- [ ] Deduct gold cost on successful mint
- [ ] Add minted Meks to user's collection
- [ ] Display minted vs crafted Meks differently
- [ ] Add mint history view
- [ ] Add "View on Cardano Explorer" links
- [ ] Test full crafting → minting flow

**Success Criteria:**
- User can craft and mint in one flow
- Database tracks minted NFTs
- Gold costs handled correctly
- Minted Meks show in collection
- History tracked properly

**Current Status:** Not started

---

### Phase 5: Polish & Mainnet Prep (Week 4)
**Environment:** Testnet → Mainnet
**Goals:** Final artwork, mainnet policy, production config

**Tasks:**
- [ ] Finalize all Mek artwork (if not done)
- [ ] Upload final IPFS assets (all sizes)
- [ ] Generate mainnet minting policy
- [ ] Set up mainnet Blockfrost API key
- [ ] Update environment variables for mainnet
- [ ] Set royalty address (mainnet wallet)
- [ ] Create mainnet config file
- [ ] Test environment switching
- [ ] Do 2-3 test mints on mainnet (your wallets)
- [ ] Verify mainnet NFTs display correctly
- [ ] Update documentation
- [ ] Create user guide (how to verify real Meks)
- [ ] Post policy ID publicly (Twitter, Discord)
- [ ] Create video tutorial

**Success Criteria:**
- All config points to mainnet
- Test mints successful on mainnet
- NFTs display correctly in wallets
- Policy ID published
- User guide ready

**Current Status:** Not started

---

### Phase 6: Launch & Monitoring
**Environment:** Mainnet
**Goals:** Soft launch, monitor, iterate

**Tasks:**
- [ ] Soft launch to small group (Discord)
- [ ] Monitor first 10-20 mints closely
- [ ] Collect feedback
- [ ] Fix any issues discovered
- [ ] Expand to wider audience
- [ ] Monitor Blockfrost usage/costs
- [ ] Monitor IPFS pinning
- [ ] Set up alerts for errors
- [ ] Create admin dashboard for mint tracking
- [ ] Public launch announcement

**Success Criteria:**
- 100+ successful mints
- No critical errors
- Positive user feedback
- Costs within budget

**Current Status:** Not started

---

## On-Demand Minting Architecture (Critical Feature)

### The Problem with Pre-Minting
Pre-minting all NFTs (e.g., 100 Easy + 50 Medium + 10 Hard = 160 NFTs per event) costs:
- ~1.7 ADA transaction fee per NFT
- ~1.5 ADA locked per NFT UTXO
- **Total: ~500 ADA per event** (~$200 at current prices)
- For 50 events: **~25,000 ADA** (~$10,000) upfront

### The Solution: On-Demand Minting
Only mint NFTs when someone actually wants to buy them:
1. User completes Story Climb contract (Easy/Medium/Hard)
2. User earns **eligibility** to mint that difficulty NFT
3. User clicks "Mint NFT" button
4. User pays ADA (mint price + fees)
5. Transaction built client-side and minted on-demand
6. NFT sent directly to user's wallet

**Cost savings:** Only pay when someone buys. No upfront inventory costs.

### Implementation Flow

```
CONTRACT COMPLETION → MINT ELIGIBILITY → MINT BUTTON → PAY ADA → MINT & SEND
```

**Detailed Steps:**
1. **Contract Completion** (Backend) - Database marks contract complete
2. **Eligibility Check** (Backend Query) - Verify completion + supply remaining
3. **Mint Button** (Frontend) - Show "Mint NFT" with price
4. **Build Transaction** (Frontend MeshSDK) - Generate metadata, build tx
5. **User Signs** (Wallet) - Approve transaction
6. **Submit** (Blockfrost) - Send to blockchain
7. **Monitor** (Frontend) - Poll for confirmation
8. **Update Database** (Backend Mutation) - Increment supplyMinted, record purchase
9. **Success** (Frontend) - Show NFT + explorer link

### Supply Tracking (Already Built)

**Database Schema:** `convex/nftEvents.ts`
```typescript
nftVariations {
  supplyTotal: 100      // Max allowed
  supplyMinted: 42      // Current count
  supplyRemaining: 58   // Computed: total - minted
}
```

**Before Each Mint:** Check `supplyMinted < supplyTotal`
**Concurrency:** Atomic increment in Convex mutation (one succeeds, others get graceful error)

---

## Current Status

### Already Built (Existing System - ~30% Complete)
- ✅ **Database schema** (nftEvents, nftVariations, nftPurchases) - `convex/nftEvents.ts`
- ✅ **Admin event manager** - `src/components/admin/nft/EventManager.tsx`
- ✅ **Variation editor** (Easy/Medium/Hard) - `src/components/admin/nft/VariationEditor.tsx`
- ✅ **Event statistics** - Supply tracking, revenue analytics
- ✅ **Story Climb system** - Contract completion tracking - `src/app/scrap-yard/story-climb/`
- ✅ **NMKR integration** (to be replaced) - `convex/nmkrApi.ts`

### What Needs to Be Built (Custom Minting - ~70% Remaining)
- ❌ **Minting policy generator** (native scripts, multi-policy support)
- ❌ **On-demand transaction builder** (MeshSDK)
- ❌ **Payment lightbox UI** (user-facing, shows dynamic price from DB)
- ❌ **IPFS metadata uploader**
- ❌ **Contract completion → mint eligibility** integration
- ❌ **User mint button/flow** in Story Climb UI
- ❌ **Collectibles admin tool** (one-off minting, separate from Event Manager)
- ❌ **Price configuration** in Variation Editor (add priceAda field)
- ❌ **Testnet development environment**
- ❌ **Mainnet deployment**

### Overall Progress: 30% (Infrastructure Built, Minting System Not Built)

**Phase Completion:**
- [ ] Phase 1: Testnet Setup & Basic Flow (0%)
- [ ] Phase 2: Metadata & IPFS (0%)
- [ ] Phase 3: Edge Cases & Error Handling (0%)
- [ ] Phase 4: Game Integration (0%)
- [ ] Phase 5: Polish & Mainnet Prep (0%)
- [ ] Phase 6: Launch & Monitoring (0%)

### Latest Updates
**2025-10-23 (Session 2 - Clarifications):**
- ✅ **Pricing**: Configurable per variation, changeable in admin anytime
- ✅ **Naming**: Custom format `E{#}: {Name}` (e.g., "E1: Skull Basher")
- ✅ **Event Manager**: Existing admin UI at `src/components/admin/nft/EventManager.tsx`
- ✅ Updated metadata structure with priceAda and displayName fields

**2025-10-23 (Session 1 - Initial Discovery):**
- ✅ Clarified ACTUAL use cases (Collectibles vs Event NFTs)
- ✅ Understood on-demand minting requirement
- ✅ Identified existing infrastructure (30% complete)
- ✅ Confirmed testnet-first approach
- ✅ Decided ADA-only (no fiat)
- ✅ Confirmed native scripts (no Plutus smart contracts)
- ✅ Confirmed 5% royalty rate
- ✅ Located existing admin tools and database schema

### Next Steps
1. Review existing admin tools to understand what NOT to rebuild
2. Set up testnet environment
3. Create payment lightbox UI mockup
4. Set up Blockfrost testnet API access
5. Begin Phase 1 implementation

---

## Key Decisions

### Technical Decisions
- **Blockchain:** Cardano mainnet (testnet for development)
- **Smart Contracts:** NOT using Plutus - native minting scripts only
- **Transaction Library:** MeshSDK (primary), Lucid (fallback)
- **API Provider:** Blockfrost (~$50/month)
- **IPFS Service:** Pinata or NFT.Storage (~$10-20/month)
- **Metadata Standards:** CIP-25 (NFT) + CIP-27 (Royalties)
- **Database:** Convex (existing)

### Business Decisions
- **Payment Methods:** ADA only (no fiat)
- **Royalty Rate:** 5%
- **Royalty Address:** TBD (mainnet wallet)
- **Mint Pricing:** TBD (will vary by rarity)
- **Development Approach:** Testnet first, then mainnet

### Design Decisions
- **UI Style:** Industrial aesthetic (match existing site)
- **Payment Flow:** In-game lightbox (no external redirect)
- **Metadata Structure:** Rich sub-asset details + game stats
- **User Trust:** Policy ID verification + educational content

### Security Decisions
- **Transparency:** Show full transaction details before signing
- **Verification:** Display policy ID prominently
- **Testing:** Extensive testnet testing before mainnet
- **Fallback:** Consider hybrid NMKR option for cautious users

---

## Resources & References

### Cardano Standards
- [CIP-25: NFT Metadata Standard](https://cips.cardano.org/cips/cip25/)
- [CIP-27: Royalty Standard](https://cips.cardano.org/cips/cip27/)
- [CIP-30: Wallet Connector](https://cips.cardano.org/cips/cip30/)

### Development Tools
- [MeshSDK Documentation](https://meshjs.dev/)
- [Blockfrost API](https://blockfrost.io/)
- [Cardano Testnet Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet/)

### Explorers
- **Testnet:**
  - https://preprod.cardanoscan.io/
  - https://preprod.cexplorer.io/
- **Mainnet:**
  - https://cardanoscan.io/
  - https://cexplorer.io/

### IPFS Services
- [Pinata](https://www.pinata.cloud/)
- [NFT.Storage](https://nft.storage/)

### Testnet Details
- **Network:** Preprod (recommended) or Preview
- **Faucet:** https://docs.cardano.org/cardano-testnet/tools/faucet/
- **Amount per request:** ~1000 tADA
- **Cooldown:** Varies by faucet

### Environment Variables Needed
```bash
# Testnet
CARDANO_NETWORK=preprod
BLOCKFROST_URL=https://cardano-preprod.blockfrost.io
BLOCKFROST_API_KEY=preprod_xxxxx
POLICY_ID=testnet_policy_id_here
ROYALTY_ADDRESS=addr_test1_xxxxx

# Mainnet (when ready)
CARDANO_NETWORK=mainnet
BLOCKFROST_URL=https://cardano-mainnet.blockfrost.io
BLOCKFROST_API_KEY=mainnet_xxxxx
POLICY_ID=mainnet_policy_id_here
ROYALTY_ADDRESS=addr1_xxxxx
```

---

## Notes & Learnings

### Things to Remember
- Testnet and mainnet use different address formats (`addr_test1` vs `addr1`)
- Policy IDs will be different on testnet vs mainnet
- IPFS content uploaded during testing is permanent
- Min ADA locked in NFT UTXO is ~1.5-2 ADA (user gets this back when burning/trading)
- Transaction fees are ~0.17 ADA (this is consumed, not recoverable)
- Blockfrost has rate limits (check tier limits)

### Common Gotchas
- Wallet must be switched to testnet network
- Testnet faucets have cooldowns
- Policy scripts must match exactly between generation and usage
- Metadata must be valid JSON (strict formatting)
- Asset names have character limits
- IPFS URLs must use correct format: `ipfs://hash` not `https://ipfs.io/ipfs/hash`

### Future Enhancements (Post-Launch)
- Batch minting (multiple Meks at once)
- Dynamic pricing based on game achievements
- Gold + ADA hybrid pricing (spend less ADA if you spend gold)
- Rarity-based pricing tiers
- Limited edition special Meks
- Seasonal variations
- Achievement-unlocked exclusive variations
- Referral minting discounts
- In-game minting achievements

---

## Change Log

### 2025-10-23 (Session 2 - Pricing & Naming Clarifications)
- **Pricing Model**: Configurable per variation in admin, changeable anytime before mint
  - Example: E1 Easy = 10 ADA, E1 Medium = 25 ADA, E1 Hard = 100 ADA
  - Added `priceAda` field to metadata and database requirements
- **Naming Convention**: `E{eventNumber}: {CustomName}` format
  - Examples: "E1: Skull Basher", "E1: Bone Crusher", "E1: Death Dealer"
  - NOT using "Intensifies/Blisteringly Amazing" pattern
  - Fully customizable per variation in admin
- **Event Manager**: Clarified existing admin UI location and purpose
- Updated metadata examples to reflect pricing and naming

### 2025-10-23 (Session 1 - Major Clarification)
- **CRITICAL UPDATE**: Corrected understanding of minting use cases
  - Use Case 1: Collectibles (one-off art, multiple policy IDs)
  - Use Case 2: Story Climb Event NFTs (main revenue, ONE policy ID)
- Documented on-demand minting architecture (avoids upfront costs)
- Identified existing infrastructure (~30% complete):
  - Database schema already built (`convex/nftEvents.ts`)
  - Admin tools already built (`EventManager.tsx`, `VariationEditor.tsx`)
  - Supply tracking already implemented
- Updated metadata structure for both use cases
- Clarified Event NFT structure: Easy/Medium/Hard per event
- Added implementation flow for on-demand minting
- Located existing Story Climb contract system
- Ready to begin custom minting implementation

### 2025-10-23 (Initial)
- Initial planning document created
- All phases planned
- Technical architecture designed
- Decision matrix established

---

**Last Updated:** 2025-10-23
**Next Review:** After Phase 1 completion or when beginning implementation
