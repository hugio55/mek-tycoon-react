# Event NFT Purchase System

## Overview
The Event NFT System allows players to purchase limited-edition NFTs using real ADA cryptocurrency after completing event nodes in the Story Climb game. Each event node offers three tiers of NFT art (Easy/Medium/Hard) with varying quantities, prices, and visual quality.

## Core Concept

### Player Flow
1. **Complete Event Node**: Player sends Meks on contract and defeats the event challenge
2. **Gold Check**: System verifies player has sufficient gold (in-game currency)
3. **Purchase Opportunity**: Modal displays available NFT tiers with remaining quantities
4. **Selection**: Player chooses desired tier (Easy/Medium/Hard)
5. **Gold Deduction**: In-game gold is deducted from player account
6. **ADA Payment**: Payment portal opens for real cryptocurrency transaction
7. **NFT Transfer**: Upon successful payment, NFT is transferred to player's connected wallet
8. **Confirmation**: Player receives confirmation and NFT appears in their collection

### Event Structure
- **Total Events**: 20 events in Chapter 1
- **NFTs per Event**: 3 tiers (Easy/Medium/Hard)
- **Total Art Pieces Needed**: 60 unique pieces (20 events × 3 tiers)
- **Total NFTs to Mint**: 1,140 individual NFTs (quantities vary per tier, interpolated from start to end values)
- **Purchase Limit**: Each wallet can buy ONE of each difficulty tier per event (max 3 NFTs per event per wallet)

## NFT Tier System

### Visual Quality Tiers
1. **Easy**: Base version of the art (good quality)
2. **Medium**: Enhanced version (cooler/more detailed)
3. **Hard**: Premium version (most impressive/rare)

Think of it as Bronze/Silver/Gold variants of the same core artwork theme.

### Example Pricing Structure (from Admin Master Data)

**Event Node #1 (Starting Node):**
- Easy: 50 quantity @ 100 ADA each = 5,000 ADA
- Medium: 25 quantity @ 200 ADA each = 5,000 ADA
- Hard: 5 quantity @ 300 ADA each = 1,500 ADA
- **Event #1 Total**: 80 NFTs, 11,500 ADA revenue

**Event Node #20 (Final Node):**
- Easy: 25 quantity @ 150 ADA each = 3,750 ADA
- Medium: 8 quantity @ 300 ADA each = 2,400 ADA
- Hard: 1 quantity @ 500 ADA each = 500 ADA
- **Event #20 Total**: 34 NFTs, 6,650 ADA revenue

**Nodes 2-19**: Values interpolated automatically via Admin Master Data calculator

**Total Revenue Projection**: 193,302.56 ADA from all 1,140 NFTs (~$96k-193k USD at $0.50-$1.00 ADA prices)

## Technical Architecture

### Progressive Minting Strategy

**APPROVED STRATEGY: Mint Event-by-Event as Players Progress**

**How It Works:**
1. **Game Launch**: Pre-mint ONLY Event #1 NFTs (80 NFTs total)
   - 50 Easy @ 100 ADA
   - 25 Medium @ 200 ADA
   - 5 Hard @ 300 ADA
   - Cost: ~160-240 ADA in minting fees

2. **Trigger for Next Batch**: When ANY player beats Event #1 (any difficulty)
   - Immediately begin minting Event #2 NFTs
   - Upload Event #2 art to IPFS
   - Add Event #2 NFTs to treasury wallet

3. **Progressive Pattern**: Repeat for all 20 events
   - Event N completion triggers Event N+1 minting
   - Players can see new NFTs appearing in treasury wallet (creates excitement)
   - Artist has time to finish remaining art as game progresses

**Benefits:**
- **Reduced upfront capital**: ~200 ADA instead of ~2,280 ADA
- **Lower risk**: Don't mint 1,140 NFTs if nobody plays the game
- **Flexible timing**: Can gauge player interest and adjust quantities/prices
- **Organic growth**: Treasury wallet grows visibly as community progresses
- **Artist buffer time**: Don't need all 60 art pieces at launch (can finish first 5-10)

**Time Calculations:**
- Each event node has minimum completion time (based on contract duration)
- Example: If Event #1 requires 24-hour contracts, earliest completion is ~3-5 days
- This gives 3-5 days to prepare Event #2 art and minting
- As events get harder, completion time increases (more buffer time)

**Implementation:**
- Store in secure **multi-sig treasury wallet** (visible on Cardano blockchain) - See "Treasury Wallet Security" section below
- Each NFT has unique asset ID tracked in database
- Monitor event completions via Convex real-time triggers
- Automated minting pipeline (or manual if preferred for security)

### Treasury Wallet Security

**RECOMMENDATION: Use 2-of-3 Multi-Sig Wallet**

For storing 193,302 ADA worth of NFTs, a multi-signature wallet is strongly recommended.

**Single-Sig vs Multi-Sig Comparison:**

| Feature | Single-Sig | Multi-Sig (2-of-3) |
|---------|------------|-------------------|
| **Security** | ⚠️ One key = all NFTs lost if compromised | ✅ Need 2 of 3 keys to steal |
| **Setup Time** | 5 minutes | 15-30 minutes |
| **Transaction Speed** | Instant | Requires coordination |
| **Automation** | Easy | Moderate complexity |
| **Cost** | Free | Free (slight network fee increase) |
| **Risk Level** | HIGH for 193k ADA | LOW |

**Single-Sig Risks:**
- Phishing attacks
- Malware/keyloggers
- Lost/damaged seed phrase
- Insider threats
- **If compromised: ALL 1,140 NFTs stolen instantly**

**Multi-Sig Benefits:**
- Thief must compromise 2+ separate keys (exponentially harder)
- Protection against lost keys (still have backups)
- Operational security (second signer reviews transaction)
- Industry standard for high-value crypto custody
- Peace of mind

**Recommended 2-of-3 Setup:**
1. **Key 1**: Your primary device (laptop/phone) - Daily operations
2. **Key 2**: Hardware wallet (Ledger/Trezor) - Secure location
3. **Key 3**: Paper wallet backup - Safety deposit box or fireproof safe

**Implementation:**
- Use **Round Table Wallet** (roundtable.adahandle.com) - Browser-based Cardano multi-sig
- Or **Typhon Wallet** / **GeroWallet** multi-sig features
- CIP-1854 standard compliance

**Automated Minting with Multi-Sig:**
- Key 1 initiates minting transaction (your automated system)
- Key 2 auto-approves via script (if you want full automation)
- OR Key 2 manual approval (more secure, but requires your action)
- This balances security with operational efficiency

### Payment Service Recommendation

**✅ DECISION: NMKR (NFT Maker)**

After evaluating options including Tangocrypto (defunct), Blockfrost (too risky), and NMKR, **NMKR** has been selected for Mek Tycoon's NFT payment system.

**Why NMKR:**
- ✅ **Battle-tested security** - Millions in transactions processed, proven track record
- ✅ **Managed service** - They handle all security, edge cases, and vulnerabilities
- ✅ **Fast integration**: 1-2 weeks to production
- ✅ **Automated minting**: Well-documented API for triggering mints
- ✅ **Multi-sig support**: Secure treasury wallet integration
- ✅ **Established trust**: Most recognized Cardano NFT service
- ✅ **Lower risk**: For 193k ADA worth of NFTs, security > aesthetics

**Cost Analysis (1,140 NFTs, 193,302 ADA revenue):**
- NMKR fees: ~5,790 ADA (3% of revenue) = ~$2,895 USD
- Network fees: Additional 0.2-0.7 ADA per transaction
- **Total cost: ~$3,000-3,500 over project lifetime**

**Trade-offs Accepted:**
- ⚠️ **Limited UI customization** - Payment popup is generic (not black/yellow industrial theme)
- ⚠️ **Higher fees** - 3% vs alternatives (but worth it for security)
- ⚠️ **Third-party dependency** - Reliant on NMKR infrastructure

**Why NOT Custom Build (Blockfrost):**
- ❌ **Security risk too high** - 193k ADA at stake, can't guarantee bulletproof security
- ❌ **Liability exposure** - Any vulnerability = potential catastrophic loss
- ❌ **Development complexity** - Race conditions, double-spends, refund logic, wallet spoofing
- ❌ **Maintenance burden** - Ongoing security monitoring and updates required

**UX Mitigation Strategy:**
To minimize "vibe killer" impact of generic payment popup:
1. Build beautiful pre-payment flow in industrial theme (event completion, NFT selection, confirmation)
2. NMKR handles ONLY the 30-second payment transaction popup
3. Immediately return to custom post-payment celebration screen
4. Result: 95% of experience is custom design, only brief payment popup is generic

**Decision Rationale:**
Security and reliability are prioritized over aesthetic perfection for real-money transactions. The 3% fee is acceptable insurance for a $96k-193k revenue project.

## NFT Purchase Planning Calculator Integration

**CRITICAL: Calculator is Source of Truth**

The NFT Purchase Planning Calculator on the Admin Master Data page is the **single source of truth** for:
- NFT quantities per event/difficulty
- ADA prices per event/difficulty
- Gold costs (if included in calculator)
- Interpolated values for Events 2-19

**Implementation Requirements:**
1. Calculator data must sync to Convex database (see eventNftConfig table below)
2. All minting/pricing logic reads from database, never hardcoded
3. Admin can update calculator at any time → values update in game
4. Add "Sync to Database" button in Admin Master Data interface

**Sync Options:**
- **Manual Sync**: Admin clicks "Save to Database" after calculator changes
- **Auto-Sync**: If calculator already uses Convex, query directly
- **CSV Import**: Export calculator → upload CSV → parse and update

## Database Schema

### Table: eventNftConfig (NEW - Calculator Sync)
Stores the single source of truth from NFT Purchase Planning Calculator.

```typescript
{
  eventNodeId: number,           // 1-20
  difficulty: "easy" | "medium" | "hard",
  quantity: number,              // From calculator (e.g., Event #1 Easy = 50)
  adaPrice: number,              // From calculator (e.g., Event #1 Easy = 100 ADA)
  goldCost: number,              // From calculator or formula
  lastUpdated: number,           // Timestamp of last sync
  calculatorVersion: string      // Track which calculator version
}
```

### Table: eventNftInventory
Tracks available NFTs for each event node and difficulty tier (runtime state).

```typescript
{
  eventNodeId: number,           // 1-20
  difficulty: "easy" | "medium" | "hard",
  totalQuantity: number,         // Total minted for this tier (copied from eventNftConfig)
  remainingQuantity: number,     // How many left unsold
  soldQuantity: number,          // How many sold
  adaPrice: number,              // Price in ADA (copied from eventNftConfig)
  goldCost: number,              // Required gold (copied from eventNftConfig)
  nftPolicyId: string,           // Cardano policy ID
  nftAssetIds: string[],         // Array of pre-minted asset IDs
  artworkIpfsUrl: string,        // IPFS link to artwork
  metadata: object               // NFT metadata
}
```

### Table: eventNftPurchases
Records all successful NFT purchases.

```typescript
{
  _id: string,
  userId: string,                // Convex user ID
  walletAddress: string,         // Buyer's Cardano wallet
  eventNodeId: number,           // Which event (1-20)
  difficulty: "easy" | "medium" | "hard",
  nftAssetId: string,            // Specific NFT transferred
  adaPaid: number,               // Amount paid in ADA
  goldSpent: number,             // In-game gold deducted
  transactionHash: string,       // On-chain tx hash
  purchaseTimestamp: number,     // Unix timestamp
  paymentProvider: string        // "nftmaker", "nmkr", etc.
}
```

### Table: eventNftWaitlist (Optional)
Allows players to register interest in sold-out NFTs.

```typescript
{
  userId: string,
  eventNodeId: number,
  difficulty: "easy" | "medium" | "hard",
  notified: boolean,
  timestamp: number
}
```

## Security Considerations

### Critical Security Features

1. **Atomic Transactions**
   - Gold deduction and NFT purchase must both succeed or both fail
   - Use Convex transactions for atomicity
   - Implement rollback mechanism for failed payments

2. **Race Condition Protection**
   - Two players buying last NFT simultaneously
   - Use Convex optimistic concurrency control
   - Lock inventory during purchase process
   - Show real-time quantity updates

3. **Wallet Verification**
   - Connected wallet must match user account
   - Verify wallet signature before deduction
   - Prevent wallet address spoofing

4. **Refund Mechanism**
   - If NFT transfer fails: refund gold + ADA
   - If gold deduction fails: abort before payment
   - Clear error messages for all failure states
   - Transaction log for dispute resolution

5. **Anti-Bot Measures**
   - Rate limiting on purchase attempts
   - Optional CAPTCHA for high-value purchases
   - Wallet age verification (prevent fresh wallet spam)
   - Max purchases per wallet per event

### Fraud Prevention

- **Purchase Limit System**: Each wallet can buy ONE of each difficulty tier per event
  - Example: Wallet X can buy 1 Easy + 1 Medium + 1 Hard from Event #5 (max 3 total)
  - Players can replay events on different difficulties to collect all tiers
  - If a player wants more NFTs, they must use a different wallet (allowed behavior)
  - Database tracks: `walletAddress + eventNodeId + difficulty` as unique constraint
- **Inventory Validation**: Always check remaining quantity before starting purchase flow
- **Payment Verification**: Confirm on-chain transaction before NFT transfer
- **Audit Trail**: Log every step of purchase process for review

## Gold Cost System

### Recommended Gold Requirements

**Option A: Flat Rate by Difficulty**
- Easy: 5,000 gold
- Medium: 15,000 gold
- Hard: 35,000 gold

**Option B: Scaling by Event Number**
- Event 1-5: Base cost
- Event 6-10: Base cost × 1.5
- Event 11-15: Base cost × 2
- Event 16-20: Base cost × 3

**Option C: Hybrid (Recommended)**
- Easy: 5k + (eventNumber × 500) gold
- Medium: 15k + (eventNumber × 1500) gold
- Hard: 35k + (eventNumber × 3500) gold

Example for Event 10:
- Easy: 10,000 gold (5k + 5k)
- Medium: 30,000 gold (15k + 15k)
- Hard: 70,000 gold (35k + 35k)

### Gold Sink Purpose
- Creates economy balance (prevents inflation)
- Adds prestige to late-game NFTs
- Rewards active players who grind gold
- Makes NFTs feel earned, not just bought

## User Experience Flow

### 1. Event Completion Screen
```
┌─────────────────────────────────────┐
│  🎉 EVENT NODE #5 COMPLETE! 🎉      │
│                                     │
│  You've unlocked exclusive NFT art! │
│                                     │
│  [View Available NFTs]              │
│  [Continue Story Climb]             │
└─────────────────────────────────────┘
```

### 2. NFT Selection Modal
```
┌───────────────────────────────────────────────┐
│  Event Node #5: "The Crystal Cavern"         │
│                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  EASY    │  │  MEDIUM  │  │   HARD   │   │
│  │  [IMG]   │  │  [IMG]   │  │  [IMG]   │   │
│  │          │  │          │  │          │   │
│  │ 50 ADA   │  │ 100 ADA  │  │ 200 ADA  │   │
│  │ 7,500 G  │  │ 22,500 G │  │ 52,500 G │   │
│  │          │  │          │  │          │   │
│  │ 8/10 left│  │ 3/5 left │  │ SOLD OUT │   │
│  │          │  │          │  │          │   │
│  │ [SELECT] │  │ [SELECT] │  │ [Notify] │   │
│  └──────────┘  └──────────┘  └──────────┘   │
│                                               │
│  Your Gold: 50,000 ⚡                         │
└───────────────────────────────────────────────┘
```

### 3. Confirmation Step
```
┌─────────────────────────────────────┐
│  Confirm Purchase                   │
│                                     │
│  NFT: Event #5 - Medium Tier        │
│  Cost: 100 ADA + 22,500 Gold        │
│                                     │
│  Your Balance:                      │
│  • Gold: 50,000 → 27,500 ⚡         │
│  • Wallet: [Connected] ✓            │
│                                     │
│  [ Cancel ]  [ Confirm Purchase ]   │
└─────────────────────────────────────┘
```

### 4. Payment Portal (NFT Maker Integration)
```
┌─────────────────────────────────────┐
│  NFT Maker Payment Portal           │
│  [IFRAME OR POPUP]                  │
│                                     │
│  Sending payment to:                │
│  addr1qxxx...xxx                    │
│                                     │
│  Amount: 100 ADA                    │
│                                     │
│  [Confirm in Wallet]                │
└─────────────────────────────────────┘
```

### 5. Success Confirmation
```
┌─────────────────────────────────────┐
│  🎉 NFT Acquired! 🎉                │
│                                     │
│  Event #5 - Medium Tier             │
│  [NFT IMAGE PREVIEW]                │
│                                     │
│  Transaction: 0xabc...def           │
│  Transferred to: addr1q...          │
│                                     │
│  [View in Collection]               │
│  [Continue Story Climb]             │
└─────────────────────────────────────┘
```

## UX Enhancements

### 1. Preview System
- Show thumbnail of NFT art BEFORE completing event
- "Preview Rewards" button on event node screen
- Creates anticipation and motivation

### 2. Collection Gallery
- Dedicated page showing all owned event NFTs
- Rarity indicators (Easy/Medium/Hard)
- Display completion percentage (X/20 events)
- Filter by event number, difficulty, owned/unowned

### 3. Leaderboard
- "Rarest Collectors" - who has most Hard tier NFTs
- "Completionist" - who has all 20 events
- "Early Bird" - first to complete each event

### 4. Wishlist/Notifications
- Register interest in sold-out NFTs
- Email/Discord notification if re-released
- Secondary market links (if applicable)

### 5. Countdown Timers
- "Event X unlocks in 3 days" (if time-gated)
- "Limited time: Double gold discount!"

## Testing Strategy

### Pre-Launch Testing Checklist

**Phase 1: Testnet Testing (Cardano Preview)**
- [ ] Deploy smart contracts to Preview testnet
- [ ] Mint test NFTs with test ADA
- [ ] Test all purchase flows with test wallets
- [ ] Verify metadata appears correctly
- [ ] Test refund scenarios

**Phase 2: Security Testing**
- [ ] Simulate race conditions (10 simultaneous purchases)
- [ ] Test with insufficient gold
- [ ] Test with insufficient ADA
- [ ] Test wallet disconnection mid-purchase
- [ ] Test double-spending attempts
- [ ] Verify atomic transaction rollback

**Phase 3: Load Testing**
- [ ] 100 concurrent users browsing NFTs
- [ ] 50 simultaneous purchase attempts
- [ ] Database query performance under load
- [ ] Payment portal response times

**Phase 4: Integration Testing**
- [ ] End-to-end flow from event completion to NFT receipt
- [ ] Test with Nami, Eternl, Flint, Typhon wallets
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness

**Phase 5: Audit & Compliance**
- [ ] Smart contract security audit (if custom contracts)
- [ ] Legal review of terms & conditions
- [ ] Privacy policy for wallet data
- [ ] Refund policy documentation

### Mainnet Launch Strategy

**Soft Launch (Recommended)**
1. Launch Event Nodes 1-5 only
2. Monitor transactions and errors closely
3. Gather user feedback on UX
4. Fix any issues before full rollout
5. Launch Events 6-20 after 1 week if stable

**Full Launch**
- All 20 events available from day one
- Requires extensive testnet validation
- Higher risk but simpler user experience

## Art Asset Requirements

### File Specifications
- **Format**: PNG with transparency (for layering) or JPG (if no transparency)
- **Resolution**: Minimum 2048×2048 pixels (for print quality)
- **File Size**: Under 5MB per image (IPFS efficiency)
- **Color Profile**: sRGB (web-safe)

### Metadata Standards (CIP-25)
```json
{
  "721": {
    "<policy_id>": {
      "<asset_name>": {
        "name": "Event #5: The Crystal Cavern - Medium",
        "description": "Exclusive NFT artwork commemorating completion of Event Node #5 in Mek Tycoon Chapter 1. Medium difficulty tier.",
        "image": "ipfs://Qm...",
        "attributes": {
          "Event Number": "5",
          "Difficulty": "Medium",
          "Chapter": "1",
          "Artist": "Artist Name",
          "Collection": "Mek Tycoon Event NFTs",
          "Rarity": "Uncommon",
          "Total Supply": "5"
        }
      }
    }
  }
}
```

### Art Production Timeline
- **60 unique pieces** (20 events × 3 tiers)
- **Estimated time**: 2-4 weeks for experienced artist
- **Budget estimate**: $1,500-6,000 depending on complexity
- **Delivery format**: Source files + optimized IPFS-ready versions

## Cost Analysis

### Upfront Costs (Launch Day)
- **Art Production (First 5 Events)**: $500-2,000 (15 art pieces to start)
- **NFT Minting (Event #1 Only)**: ~160-240 ADA (80 NFTs × 2-3 ADA fee)
- **IPFS Hosting**: $5-20/month (Pinata or similar)
- **Smart Contract Audit**: $0 (if using NFT Maker) or $10k+ (if custom)
- **Development Time**: 2-4 weeks (using service) or 3-6 months (custom)
- **Total Upfront Investment**: ~$600-2,300 + development time

### Progressive Costs (As Game Progresses)
- **Art Production (Remaining 45 pieces)**: $1,000-4,000 over 3-6 months
- **NFT Minting (Events #2-20)**: ~2,120-3,180 ADA total as events unlock
- **Payment Service Fee**: 2-5% per transaction (~9,665 ADA over lifetime)
- **IPFS Pinning**: $5-20/month ongoing
- **Server/Database**: Covered by existing Convex plan

### Revenue Projection
- **Total Sales**: 193,302.56 ADA (~$96k-193k USD at $0.50-$1.00 ADA prices)
- **Total Costs**: ~12,000 ADA (minting + service fees) + ~$3,500 (art + hosting)
- **Net Revenue**: ~181,000 ADA (~$90k-181k USD)
- **ROI**: ~15,000% over game lifetime (assuming $6,000 total investment, $90k+ revenue)

### Risk Mitigation
- **Low upfront risk**: Only invest $600-2,300 to launch
- **Progressive investment**: Only spend more if players are engaged
- **Breakeven point**: Sell ~120 NFTs from Event #1 to cover initial costs
- **Scalable**: Can adjust quantities/prices for future events based on demand

## Implementation Roadmap

### Phase 1: Planning & Design (Week 1)
- [ ] Finalize NFT tier pricing and quantities
- [ ] Commission artwork (contract artist)
- [ ] Design purchase flow UI mockups
- [ ] Evaluate NFT Maker vs alternatives
- [ ] Define gold cost formula

### Phase 2: Art Production (Weeks 2-4 for Launch, Ongoing for Full Set)
- [ ] **Priority: Events 1-5** (15 art pieces for soft launch)
- [ ] Artist creates first batch of artwork
- [ ] Review and approve Event #1 artwork (must be perfect for launch)
- [ ] Optimize images for IPFS
- [ ] Upload Event #1 art to IPFS and pin
- [ ] Generate metadata JSON files for Event #1
- [ ] **Ongoing**: Commission remaining Events 6-20 as game progresses (45 pieces)

### Phase 3: Backend Development (Weeks 3-5)
- [ ] Create Convex schema (eventNftInventory, eventNftPurchases)
- [ ] Implement inventory management mutations
- [ ] Build purchase flow logic with atomic transactions
- [ ] Integrate NFT Maker API (or chosen service)
- [ ] Add race condition protection
- [ ] Implement refund mechanism

### Phase 4: Frontend Development (Weeks 4-6)
- [ ] Design NFT selection modal (match industrial aesthetic)
- [ ] Build tier comparison cards
- [ ] Implement real-time quantity updates
- [ ] Create payment confirmation flow
- [ ] Add success/error notifications
- [ ] Build collection gallery page

### Phase 5: Testing (Week 7)
- [ ] Testnet deployment and testing
- [ ] Security testing (race conditions, etc.)
- [ ] Load testing (concurrent purchases)
- [ ] UX testing with beta users
- [ ] Bug fixes and optimizations

### Phase 6: Launch (Week 8)
- [ ] **Mint ONLY Event #1 NFTs** on mainnet (80 NFTs total)
- [ ] Deploy to production
- [ ] Soft launch (Event #1 available, treasury wallet visible)
- [ ] Monitor transactions and player progress closely
- [ ] **Set up event completion trigger**: Detect when first player beats Event #1
- [ ] **Progressive rollout**: Mint Event #2 when triggered, repeat for all 20 events
- [ ] Adjust quantities/prices for future events based on demand data

## Open Questions & Decisions Needed

### ✅ CONFIRMED Decisions:
1. **Purchase Limit**: ✅ Each wallet can buy 1 of each difficulty per event (max 3 per event)
2. **Minting Strategy**: ✅ Progressive minting (only Event #1 at launch, mint next event when previous is beaten)
3. **Gold Cost Formula**: ✅ Using interpolated values from Admin Master Data calculator
4. **Total NFTs**: ✅ 1,140 NFTs across all 20 events
5. **Revenue Target**: ✅ 193,302.56 ADA total
6. **Artist**: ✅ User is the artist (no external contractor needed)
7. **Payment Service**: ✅ **NMKR (NFT Maker)** - Security prioritized over UI customization
8. **Event Unlock**: ✅ Progression-locked (stepping stones - can't skip ahead)
9. **Minting Automation**: ✅ Fully automatic (NMKR API triggers on event completion)
10. **Treasury Wallet**: ✅ Multi-sig recommended (2-of-3 setup for 193k ADA security)
11. **Calculator Integration**: ✅ Admin Master Data calculator is source of truth for all prices/quantities
12. **Security Priority**: ✅ Accept 3% fees and generic payment popup for battle-tested security

### ❓ Remaining Questions:
1. **Refund Policy**: Full refunds allowed? Time limit? Is gold returned if ADA payment fails?
2. **Secondary Market**: Will there be official resale support or just external marketplaces (JPG Store, etc.)?
3. **Multi-Sig Approval**: Key 2 auto-approve (full automation) or manual approval (more secure)?
4. **Calculator Storage**: Is the NFT Purchase Planning Calculator already in Convex, or separate tool?
5. **Implementation Priority**: Should I start implementing NMKR integration, or is this planning phase only?
6. **NMKR Account**: Do you already have an NMKR account, or should I document setup process?

### Technical Decisions Completed:
- [x] Payment service: **NMKR (NFT Maker)** - Battle-tested security, 3% fees
- [x] Minting strategy: **Progressive** (Event #1 only at launch)
- [x] Automation: **Fully automated** via NMKR API
- [x] Treasury security: **Multi-sig 2-of-3** (Round Table Wallet)
- [x] Source of truth: **Admin Master Data calculator** synced to Convex
- [x] Testing strategy: **Soft launch** (Event #1 → monitor → progressive rollout)
- [x] Security priority: **Managed service** over custom build to protect 193k ADA

### Technical Decisions Remaining:
- [ ] IPFS provider selection (Pinata, NFT.Storage, Infura) - **Recommend Pinata** ($5-20/month, reliable)
- [ ] Wallet connector library (MeshSDK currently disabled - re-enable?) - **YES, re-enable MeshSDK**
- [ ] Multi-sig Key 2 automation level (auto-approve vs manual) - **Depends on security preference**
- [ ] Mainnet deployment timeline - **TBD based on art completion + development**

## Future Enhancements (Post-Launch)

### V2 Features (Chapter 2+)
- **Dynamic Pricing**: Price increases as quantity decreases
- **Bundle Discounts**: Buy all 3 tiers at once for discount
- **Loyalty Rewards**: Discount for returning collectors
- **Rarity Tiers**: Add "Legendary" tier above Hard (1 per event)
- **Animated NFTs**: Some tiers could be animated GIFs or short videos
- **Utility NFTs**: Grant in-game bonuses (bonus gold, faster contracts)

### Integration Ideas
- **Discord Bot**: Show collection in Discord profile
- **Physical Merch**: Print NFT artwork on T-shirts/posters
- **Staking**: Stake NFTs for passive gold income
- **Crafting Materials**: Burn NFTs to get rare crafting components

## Summary

This system creates a sustainable revenue model while enhancing player engagement with minimal upfront risk. The **progressive minting strategy** is brilliant: only invest ~$600-2,300 to launch Event #1, then mint subsequent events as players progress through the game. This approach:

- **Reduces capital risk**: Don't mint 1,140 NFTs upfront if nobody plays
- **Creates organic excitement**: Players watch the treasury wallet grow as community progresses
- **Allows flexibility**: Adjust quantities/prices for later events based on demand
- **Buys time for art production**: Artist doesn't need all 60 pieces at launch

The **purchase limit system** (1 of each difficulty per event per wallet) creates:
- **Collectibility**: Players replay events on different difficulties to complete sets
- **Fair distribution**: No single whale can buy out entire event stock
- **Replay incentive**: Encourages multiple playthroughs at higher difficulties

The **gold cost requirement** adds a skill gate (must play game to earn gold) while the **ADA payment** creates real-world value.

## Payment Service: NMKR (Final Decision)

**NMKR (NFT Maker)** has been selected as the payment service provider. While the generic payment popup is not ideal aesthetically, **security is prioritized over UI customization** for a project handling 193k ADA worth of NFTs.

**Key Benefits:**
- Battle-tested with millions in transactions
- Managed service handles all security vulnerabilities
- Fast 1-2 week integration timeline
- Well-documented API for automated minting
- Multi-sig treasury wallet support

**Accepted Trade-offs:**
- 3% fees (~$2,895 over lifetime) - acceptable insurance cost
- Generic payment popup (30 seconds) - mitigated by custom pre/post-payment UX
- Third-party dependency - but with established, trusted provider

**UX Mitigation:** 95% of user experience (event completion, NFT selection, confirmation, celebration) will be custom industrial design. Only the brief payment transaction uses NMKR's generic popup.

**Revenue Potential**: 193,302.56 ADA (~$96k-193k USD) from 1,140 NFTs
**Service Fees**: ~5,790 ADA (3%) = ~$2,895 USD
**Net Revenue**: ~187,500 ADA (~$93k-187k USD)
**Upfront Investment**: ~$600-2,300 for Event #1 launch
**ROI**: ~14,000%+ over game lifetime if all events sell out

**Next Step**: Set up NMKR account, configure first project for Event #1, integrate API with Convex backend, implement calculator sync, design custom pre/post-payment UX.
