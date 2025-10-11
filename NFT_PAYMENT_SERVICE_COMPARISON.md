# NFT Payment Service Comparison for Mek Tycoon

## Executive Summary

After researching Cardano NFT payment services, here are the viable options ranked by UI customization capability (most important factor for maintaining your black/yellow industrial aesthetic):

**Recommendation Ranking:**
1. **Tangocrypto (BEST for customization)** - Open-source, fully customizable
2. **Blockfrost + Custom Build (BEST for control)** - Complete UI control, lowest fees
3. **NMKR (EASIEST but limited styling)** - Established service but "vibe killer" lightbox
4. **Saturn NFT (LIMITED info)** - GraphQL API, unclear customization

---

## Detailed Service Breakdown

### 1. Tangocrypto ⭐ RECOMMENDED FOR YOUR USE CASE

**Overview:**
Open-source Cardano minting platform with payment gateway and wallet integration. Built for developers who need full customization.

**Pricing:**
- **2 ADA per sale** (up to 20 NFTs per sale)
- Effectively **~0.1 ADA per NFT** if batching
- No percentage-based fees
- Cardano network fees: 0.2-0.7 ADA per transaction

**UI Customization:** ⭐⭐⭐⭐⭐
- **FULLY OPEN-SOURCE** - Complete control over UI
- Deploy as Docker containers in Kubernetes cluster
- Can build custom payment interface matching your black/yellow theme
- No forced branding or lightbox templates
- CSS/React/Next.js compatible

**API Capabilities:**
- Full REST API with real-time webhooks
- Automated minting support
- Payment notifications (instant alerts on successful transactions)
- Custom transaction logic (swap, send, mint, burn)
- CIP-25 metadata standard support
- Asset activity tracking

**Automated Minting:**
✅ YES - Webhooks trigger on payment completion, can auto-mint next event

**Integration Complexity:**
⚠️ MEDIUM-HIGH (requires Docker/backend setup, but you have full control)

**Best For:**
- Projects needing custom-branded payment experience
- Industrial/sci-fi aesthetic preservation
- Developers comfortable with backend infrastructure
- Projects needing webhooks for automation

**Downsides:**
- Requires more technical setup than turnkey solutions
- Need to host/maintain infrastructure
- More development time upfront

---

### 2. Blockfrost + Custom Build ⭐ BEST FOR CONTROL

**Overview:**
Build your own payment and minting system using Blockfrost API (free Cardano blockchain access). Maximum control, maximum work.

**Pricing:**
- **FREE API** (generous free tier, paid plans available)
- Only pay Cardano network fees: **~0.17-0.49 ADA per NFT**
- NO service fees or percentages
- Cheapest option long-term

**UI Customization:** ⭐⭐⭐⭐⭐
- **100% CUSTOM** - You build everything
- Perfect black/yellow industrial theme integration
- Payment modal, checkout flow, confirmation screens all custom
- No third-party branding whatsoever

**API Capabilities:**
- Complete Cardano blockchain API
- Query balances, transactions, assets
- Listen for payments (polling or webhooks)
- Build transactions, submit to blockchain
- NFT minting endpoints
- QR code generation for wallet payments (CIP-13)

**Automated Minting:**
✅ YES - You build the automation (Convex triggers → Blockfrost API calls)

**Integration Complexity:**
⚠️⚠️ HIGH (build everything from scratch)

**Required Implementation:**
1. Payment listener system (check wallet for incoming ADA)
2. Transaction verification logic
3. NFT minting pipeline
4. Metadata generation and IPFS upload
5. Refund mechanism for failed mints
6. Security hardening (race conditions, double-spends)

**Best For:**
- Maximum cost savings (no service fees)
- Complete branding control
- Projects with strong technical team
- Long-term scalability

**Downsides:**
- Highest development time (3-6 weeks minimum)
- You handle all security concerns
- Need robust error handling and monitoring
- Maintenance burden on your team

---

### 3. NMKR (formerly NFT Maker) - ESTABLISHED BUT LIMITED

**Overview:**
The most established Cardano NFT service. Proven track record, easy API, but limited UI customization (the "vibe killer" you mentioned).

**Pricing:**
- **3% of transaction value** OR minimum **2 ADA per token** (whichever is higher)
- Example: 100 ADA NFT = 3 ADA fee, 50 ADA NFT = 2 ADA fee
- Volume discounts available (contact them)
- Multi-sig option eliminates 2 ADA sendback fee

**UI Customization:** ⭐⭐
- **LIMITED** - Forced to use their branded lightbox/payment widget
- Cannot significantly customize appearance
- Standard web form styling (doesn't match industrial theme)
- **This is the "vibe killer" issue you identified**

**API Capabilities:**
- Well-documented REST API
- Automated minting via API calls
- Smart contract integration
- Multi-sig minting (secure)
- CIP-25 metadata support

**Automated Minting:**
✅ YES - API supports automated minting triggers

**Integration Complexity:**
⭐ LOW-MEDIUM (easiest turnkey solution)

**Best For:**
- Projects prioritizing speed-to-market over aesthetics
- Teams wanting managed service (they handle security)
- Projects needing established trust/reputation
- Lower technical expertise teams

**Downsides:**
- **❌ Cannot customize payment UI to match your theme**
- Higher fees (3% adds up on 193k ADA = ~5,790 ADA in fees)
- Locked into their branding
- Less control over user experience

---

### 4. Saturn NFT - UNCLEAR DOCUMENTATION

**Overview:**
Cardano NFT platform with multi-sig and GraphQL API. Limited public information about customization.

**Pricing:**
- **UNKNOWN** - No clear service fee structure found
- Only Cardano network fees documented (~0.05 ADA per NFT)
- May need to contact directly for pricing

**UI Customization:** ⭐⭐⭐ (UNKNOWN)
- **UNCLEAR** - No documentation found on payment UI customization
- Has GraphQL API, suggests some flexibility
- Sample integration library exists (copy-paste code)

**API Capabilities:**
- GraphQL API (more flexible than REST for complex queries)
- Multi-sig minting (most secure option)
- CIP-68 support (dynamic NFTs with upgradeable metadata)
- Integration library provided

**Automated Minting:**
❓ LIKELY YES (GraphQL mutations support minting)

**Integration Complexity:**
⚠️ MEDIUM (GraphQL learning curve, but sample code provided)

**Best For:**
- Projects needing CIP-68 dynamic NFTs
- Teams familiar with GraphQL
- Projects needing multi-sig security

**Downsides:**
- Limited public documentation
- Unclear pricing structure
- Unknown customization capabilities
- Would need to contact them directly for details

---

## Cost Comparison (Based on Your 193,302.56 ADA Revenue)

| Service | Per-NFT Cost | Total Fees (1,140 NFTs) | % of Revenue | UI Customization |
|---------|--------------|-------------------------|--------------|------------------|
| **Tangocrypto** | 2 ADA/sale (~0.1 if batch) | ~2,280 ADA | 1.18% | ⭐⭐⭐⭐⭐ |
| **Blockfrost** | ~0.3 ADA (network only) | ~342 ADA | 0.18% | ⭐⭐⭐⭐⭐ |
| **NMKR** | 2-3 ADA (3% or min 2) | ~5,790 ADA | 3% | ⭐⭐ |
| **Saturn** | Unknown | Unknown | Unknown | ⭐⭐⭐ (?) |

**10-Year Cost Projection:**
- Tangocrypto: ~$1,140 USD (at $0.50/ADA)
- Blockfrost: ~$171 USD + development time
- NMKR: ~$2,895 USD
- **Savings vs NMKR: $1,755 - $2,724**

---

## Treasury Wallet Security Explained

### Single-Sig Wallet
**How it works:**
- ONE private key (seed phrase) controls the wallet
- Anyone with that key can send all NFTs/ADA instantly
- Like having a bank account with one password

**Pros:**
- Simple to set up and manage
- Fast transactions (no coordination needed)
- Easy integration with automated systems
- No additional tools required

**Cons:**
- **SINGLE POINT OF FAILURE** - If seed phrase compromised, all 193k ADA worth of NFTs are stolen
- Vulnerable to:
  - Phishing attacks
  - Malware/keyloggers
  - Insider threats
  - Lost/damaged backup

**Best For:**
- Low-value holdings (< 10k ADA)
- Test environments
- Temporary wallets

---

### Multi-Sig Wallet (RECOMMENDED for 193k ADA)
**How it works:**
- Requires **M of N** signatures to send transactions
- Example: "2 of 3" = need 2 out of 3 key holders to approve
- Example: "3 of 5" = need 3 out of 5 key holders to approve

**Common Setup (2-of-3):**
- Key 1: Your main device (laptop/phone)
- Key 2: Your backup device (hardware wallet, different location)
- Key 3: Trusted partner or cold storage

**Pros:**
- **Extremely secure** - Thief needs to compromise multiple keys
- Protection against:
  - Single device compromise
  - Lost/stolen keys (still have others)
  - Insider threats (one person can't steal alone)
  - Operational errors (second signer reviews transaction)
- Industry standard for high-value crypto custody
- Peace of mind

**Cons:**
- More complex setup (15-30 minutes)
- Slower transactions (need coordination between signers)
- Harder to automate (need signing coordination)
- Requires multi-sig-compatible wallet software

**Best For:**
- High-value holdings (> 10k ADA) ✅ YOUR CASE
- Production environments
- Long-term NFT storage
- Projects with multiple stakeholders

---

### Multi-Sig Implementation Options on Cardano

**1. Round Table Wallet (roundtable.adahandle.com)**
- Browser-based multi-sig for Cardano
- Easy to set up
- Supports 2-of-3, 3-of-5 configurations
- Free to use

**2. GeroWallet Multi-Sig**
- Native Cardano multi-sig support
- Mobile and desktop
- CIP-1854 standard

**3. Typhon Wallet Multi-Sig**
- Advanced multi-sig features
- Good for technical users

**Recommendation for Your Use Case:**
- **Start with 2-of-3 multi-sig using Round Table**
- Key 1: Your primary device (daily minting operations)
- Key 2: Hardware wallet (Ledger/Trezor) in secure location
- Key 3: Paper wallet backup in safety deposit box/fireproof safe
- This balances security with operational speed

---

## Automated Minting Architecture

### Option A: Tangocrypto Webhooks (RECOMMENDED)

**Flow:**
1. Player beats Event #1 → Convex mutation logs completion
2. Convex action queries "is this the FIRST completion?" → YES
3. Convex action calls your backend API endpoint
4. Your backend triggers Tangocrypto minting API for Event #2
5. Tangocrypto webhook notifies when minting complete
6. Update Convex database with new NFT asset IDs
7. NFTs now available for purchase

**Benefits:**
- Real-time notifications (webhooks)
- Open-source = can customize everything
- Relatively low development time (1-2 weeks)
- Good balance of control vs complexity

---

### Option B: Blockfrost Polling (MAXIMUM CONTROL)

**Flow:**
1. Player beats Event #1 → Convex mutation logs completion
2. Convex scheduled function checks "first completion?" every 5 min
3. If YES → Trigger Blockfrost minting API calls
4. Generate metadata, upload to IPFS
5. Submit minting transaction to Cardano
6. Poll Blockfrost to confirm transaction on-chain
7. Update Convex with new asset IDs

**Benefits:**
- Zero service fees (only network fees)
- Complete control
- No third-party dependencies

**Downsides:**
- More code to write and maintain
- Need to handle edge cases yourself
- Longer development time (3-4 weeks)

---

### Option C: NMKR API (EASIEST)

**Flow:**
1. Player beats Event #1 → Convex mutation
2. Convex action calls NMKR API
3. NMKR handles minting
4. NMKR returns asset IDs
5. Update Convex database

**Benefits:**
- Simplest integration
- Proven reliability
- Managed service

**Downsides:**
- 3% fees (expensive at scale)
- Locked into their payment UI ("vibe killer")

---

## Integration with NFT Purchase Planning Calculator

**Critical Requirement:** The Admin Master Data calculator is **source of truth** for:
- NFT quantities per event/difficulty
- ADA prices per event/difficulty
- Interpolated values for Events 2-19

**Implementation Plan:**

### Database Schema Addition
```typescript
// In Convex schema
eventNftConfig: defineTable({
  eventNodeId: v.number(),          // 1-20
  difficulty: v.string(),           // "easy", "medium", "hard"
  quantity: v.number(),             // From calculator
  adaPrice: v.number(),             // From calculator
  goldCost: v.number(),             // From calculator (or formula)
  lastUpdated: v.number(),          // Timestamp
  calculatorVersion: v.string()     // Track which calculator version
})
```

### Sync Strategy
**Option 1: Manual Sync**
- Admin updates calculator → clicks "Save to Database" button
- Convex mutation updates eventNftConfig table
- All future minting/pricing uses these values

**Option 2: Auto-Sync (if calculator is already in Convex)**
- If calculator data is already stored in Convex tables
- Just query those tables directly when minting
- No separate sync needed

**Option 3: CSV Export/Import**
- Calculator exports CSV with all values
- Admin uploads CSV to game
- Convex mutation parses and updates tables

**Recommended:**
- Use **Option 1 (Manual Sync with UI button)** if calculator is separate
- Use **Option 2 (Direct Query)** if calculator already in Convex
- This ensures calculator remains single source of truth
- No hardcoded values in code

---

## Final Recommendation

### For Maximum Customization + Reasonable Development Time:
**Use Tangocrypto**

**Reasoning:**
1. ✅ **FULL UI customization** - Build payment modal matching your industrial theme
2. ✅ **Low fees** - 2 ADA per sale (~1.18% of revenue vs NMKR's 3%)
3. ✅ **Automated minting** - Webhooks for event triggers
4. ✅ **Open-source** - Can host and customize everything
5. ✅ **Proven service** - Active Cardano community project
6. ✅ **Reasonable complexity** - 2-3 week implementation vs 5-6 for Blockfrost

**Implementation Timeline:**
- Week 1: Set up Tangocrypto account, deploy containers, integrate API
- Week 2: Build custom payment UI (black/yellow theme), test on Preview testnet
- Week 3: Integrate with Convex, add webhooks, add calculator sync, production deploy

**Saves vs NMKR:** ~$1,755 in fees, keeps your aesthetic intact

---

### For Maximum Control + Minimum Cost:
**Use Blockfrost + Custom Build**

**Reasoning:**
1. ✅ **ZERO service fees** - Only network fees (~$171 vs ~$2,895 for NMKR)
2. ✅ **100% custom everything** - Perfect industrial sci-fi UI
3. ✅ **No third-party dependencies** - You control entire stack
4. ⚠️ **Higher development time** - 4-6 weeks
5. ⚠️ **More maintenance** - You handle all edge cases

**Best if:**
- You have 4-6 weeks for development
- Want to save maximum money long-term
- Enjoy building infrastructure
- Want zero reliance on external services

---

## Next Steps

1. **Decide on service:** Tangocrypto (recommended) vs Blockfrost (if you have time/want control)
2. **Set up multi-sig wallet:** Use Round Table for 2-of-3 setup
3. **Connect calculator to database:** Implement sync button in Admin Master Data page
4. **Design custom payment modal:** Match black/yellow industrial theme
5. **Implement automated minting trigger:** Convex action on event completion
6. **Test on Preview testnet:** Full flow before mainnet launch

**Questions to Clarify:**
- How is the NFT Purchase Planning Calculator currently implemented? (In Convex? Separate tool?)
- Do you want me to implement the Tangocrypto integration, or just document the architecture?
- Should I create a design mockup for the custom payment modal in your industrial style?
