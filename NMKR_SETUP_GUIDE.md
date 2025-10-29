# NMKR Studio Integration Guide
**Mek Tycoon - Beta Commemorative NFT System**

## Project Overview

**What We're Building:**
- Monthly phase-based NFT releases for beta testers
- Each phase = different artwork, different supply, different timing
- All phases share ONE policy ID = appear as one collection on-chain
- Uses NMKR Studio for minting infrastructure (not custom minting system)

**Why NMKR:**
- Previous custom minting system had persistent bugs
- NMKR is battle-tested, handles payments, webhooks, IPFS automatically
- Focus on game development, not minting infrastructure

---

## Use Cases

### 1. Beta Commemorative NFTs (Whitelist-Based)
**Volume:** 1% of total NFT volume
**Purpose:** Reward beta testers who complete each phase
**Pricing:** ~10 ADA per NFT
**Supply:** Variable per phase (35, 100, 150, etc.)
**Payment:** Players pay for NFT (not free rewards)
**Timing:** Monthly releases as new beta phases complete

**Example Phases:**
- **Phase 1 (Bronze):** 35 beta testers complete first month → 35 bronze NFTs
- **Phase 2 (Silver):** 100 testers complete second month → 100 silver NFTs
- **Phase 3 (Gold):** 150 testers complete third month → 150 gold NFTs
- **Result:** 285 total NFTs across 3 phases, all in one collection

### 2. Mission Completion NFTs (Future - 99% of Volume)
**Volume:** 99% of total NFT volume
**Purpose:** Players complete contract missions, then purchase commemorative NFT
**Pricing:** ~300 ADA per NFT
**Supply:** Unlimited (ongoing)
**Payment:** NMKR Pay widget pops up after mission completion
**Timing:** Weekly new NFT designs uploaded
**Whitelist:** No whitelist - anyone who completes mission can buy

---

## Critical NMKR Concept: Projects vs Policy IDs

### The Core Limitation
**NMKR projects are static containers:**
- You create a project and upload NFTs
- Supply is permanently fixed at creation time
- **You CANNOT add more NFTs to a project later**
- **You CANNOT increase max supply after creation**

### Why This Matters for Phased Releases
**You CANNOT do this:**
- Create one project called "Beta Commemorative"
- Upload 35 bronze NFTs now
- Come back in a month and add 100 silver NFTs to same project
- NMKR platform doesn't support this workflow

**You MUST do this:**
- Create separate NMKR projects for each phase
- Share the policy ID across all projects
- Each project = one phase = fixed supply at creation

### What Cardano Blockchain Allows
- ✅ Mint 35 NFTs from policy today
- ✅ Mint 100 more from SAME policy next month (before locking)
- ✅ Mint 150 more from SAME policy in month 3
- ✅ All share same policy ID = one collection
- ✅ Policy can stay unlocked indefinitely

**The constraint is NMKR's platform design, NOT Cardano.**

### The Solution: Multiple Projects, Shared Policy ID

**Phase 1 (Now):**
1. Create NMKR project: "Beta Commemorative - Phase 1 (Bronze)"
2. Upload 35 bronze NFT metadata
3. NMKR generates new policy ID: `abc123def456...`
4. **Save this policy ID securely** (you'll need it for Phase 2)
5. Mint all 35 bronze NFTs

**Phase 2 (Next Month):**
1. Create NEW NMKR project: "Beta Commemorative - Phase 2 (Silver)"
2. In CARDANO tab: Select **"Use existing policy"**
3. **Paste Phase 1's policy ID** (`abc123def456...`)
4. Upload 100 silver NFT metadata
5. Mint all 100 silver NFTs
6. **Result:** Silver NFTs share same policy as bronze = same collection

**Phase 3 (Month 3):**
1. Create NEW NMKR project: "Beta Commemorative - Phase 3 (Gold)"
2. Use **SAME policy ID from Phase 1** again
3. Upload 150 gold NFT metadata
4. Mint all 150 gold NFTs
5. **Result:** All 285 NFTs (35+100+150) share one policy ID

**On-Chain Result:**
- Policy ID: `abc123def456...` contains 285 NFTs
- Wallets/explorers group them as one collection
- But each phase has different artwork, metadata (Phase=1, Phase=2, Phase=3)
- Users see: "Beta Commemorative Collection (285 items)"

---

## Environment Configuration

### Current Setup (.env.local)

**Existing NMKR Variables (OLD mainnet account):**
```bash
# These will be REPLACED with new NMKR account credentials
NEXT_PUBLIC_NMKR_NETWORK=mainnet
NEXT_PUBLIC_NMKR_PROJECT_ID=37f3f44a1d004aceb88aa43fb400cedd
NMKR_WEBHOOK_SECRET=4c5cbb57ebdc8bc00aa727fbdb90ef7e8657fc4fdf044d026ed6b942db53c4a7
NMKR_API_KEY=b51a09ab3dd14e2a83140a2a77b8bb80
```

**New Variables (After Phase 1 Setup):**
```bash
# Phase 1 Bronze - Preprod (Testnet)
NEXT_PUBLIC_NMKR_NETWORK=preprod
NEXT_PUBLIC_NMKR_PROJECT_ID_PHASE1_PREPROD=<generated-after-project-creation>
NEXT_PUBLIC_POLICY_ID_BETA_COMMEMORATIVE_PREPROD=<save-from-phase-1>

# Phase 2 Silver - Preprod (will use SAME policy ID)
NEXT_PUBLIC_NMKR_PROJECT_ID_PHASE2_PREPROD=<generated-next-month>

# Phase 1 Bronze - Mainnet (Production)
NEXT_PUBLIC_NMKR_PROJECT_ID_PHASE1_MAINNET=<after-preprod-testing>
NEXT_PUBLIC_POLICY_ID_BETA_COMMEMORATIVE_MAINNET=<mainnet-policy>

# API Keys (from NMKR Studio Settings)
NMKR_API_KEY=<get-from-nmkr-dashboard>
NMKR_WEBHOOK_SECRET=<get-from-nmkr-webhook-config>
```

---

## Phase 1 Setup: Step-by-Step (Preprod)

### INFORMATION Tab
✅ **Completed:**
- Blockchain: CARDANO
- Project Type: Non fungible token (NFT) project
- Project Name: "Beta Commemorative" (should be "Phase 1 (Bronze)" for clarity)
- Project URL: "https://mek.overexposed.io/"
- Description: "Exclusive commemorative NFT for Mek Tycoon beta testers"
- Twitter: "@Over___Exposed"
- TokenName Prefix: "MekBeta" (NFTs named MekBeta001, MekBeta002, etc.)
- Storage Provider: IPFS
- NFT Reservation Time: 20 Minutes

### CARDANO Tab
✅ **Completed:**
- Payout wallet: nmkr pre prod round 2 etrni... (preprod testnet wallet)
- CIP Standard: CIP25 (standard NFT metadata)
- Policy: New policy (NMKR will generate - **SAVE THIS POLICY ID!**)
- Policyscript will lock: OFF (keep unlocked for Phase 2 reuse)

### METADATA Tab
⏳ **In Progress:**

**Static Fields to Add:**
- **Key:** `Phase` | **Value:** `1`
- **Key:** `Collection` | **Value:** `Beta Commemorative`
- **Key:** `Tier` | **Value:** `Bronze`

**Placeholder Fields to Add:**
- `Mint Number` (different per NFT: 1, 2, 3, ..., 35)

**Still Need to Configure:**
- NFT artwork upload (bronze token image)
- Max supply: 35
- Pricing: 10 tADA (testnet ADA)
- Whitelist configuration (35 beta player addresses)

---

## Testing Strategy (Current Plan)

### Phase 1 Test (Preprod)
1. ✅ Create "Beta Commemorative - Phase 1" project
2. ⏳ Configure METADATA tab
3. Upload 35 bronze NFT metadata
4. Document the generated **Policy ID** from project dashboard
5. Add 35 beta tester wallet addresses to whitelist
6. Test purchase flow with NMKR Pay widget
7. Verify NFTs appear in wallets correctly
8. Verify webhooks trigger properly

### Phase 2 Test (Preprod - Next Step)
1. Create NEW project: "Beta Commemorative - Phase 2 (Silver)"
2. In CARDANO tab: Select **"Use existing policy"**
3. **Paste Policy ID from Phase 1** (from preprod test)
4. Upload 100 silver NFT metadata (different artwork)
5. Configure metadata with `Phase: 2`, `Tier: Silver`
6. Test minting 100 silver NFTs
7. **VERIFY:** Both bronze and silver NFTs appear under same policy ID
8. **VERIFY:** Collection shows 135 total NFTs (35 bronze + 100 silver)

### Validation Criteria
If Phase 1 + Phase 2 preprod tests succeed:
- ✅ Multi-project with shared policy ID works
- ✅ Payment flow works
- ✅ Webhooks work
- ✅ Collection appears unified on-chain
- ✅ Ready to replicate on mainnet for production

**Don't need to test Phase 3, 4, etc. - pattern is proven.**

---

## Future Database Schema (Convex)

### New Tables for NMKR Integration

**`nmkrProjects` - Track NMKR Projects**
```typescript
{
  projectId: string;           // NMKR project ID
  projectName: string;         // "Beta Commemorative - Phase 1 (Bronze)"
  policyId: string;           // Cardano policy ID (shared across phases)
  phase: number;              // 1, 2, 3, etc.
  tier: string;               // "Bronze", "Silver", "Gold"
  network: "preprod" | "mainnet";
  maxSupply: number;          // 35, 100, 150, etc.
  price: number;              // 10, 300, etc. (in ADA)
  totalMinted: number;        // Real-time count from webhooks
  isActive: boolean;          // Is this phase currently selling?
  createdAt: number;
}
```

**`nftClaims` - Track Player Claims**
```typescript
{
  userId: string;             // Convex user ID
  walletAddress: string;      // Cardano wallet address
  projectId: string;          // Which NMKR project
  phase: number;              // Which phase (1, 2, 3)
  tier: string;               // "Bronze", "Silver", "Gold"
  assetName: string;          // MekBeta001, MekBeta002, etc.
  policyId: string;           // Cardano policy ID
  txHash: string;             // Blockchain transaction hash
  claimedAt: number;          // Timestamp
  paymentStatus: "pending" | "completed" | "failed";
}
```

**`nmkrWebhookLogs` - Webhook Debugging**
```typescript
{
  projectId: string;
  eventType: string;          // "payment_complete", "nft_minted", etc.
  payload: object;            // Full webhook payload
  processed: boolean;
  receivedAt: number;
}
```

**`missionNFTs` - Mission-to-NFT Mapping (Future)**
```typescript
{
  missionId: string;          // Which contract mission
  nmkrProjectId: string;      // Which NMKR project to use
  nftName: string;            // "Steampunk Mission Complete"
  nftDescription: string;
  imageUrl: string;           // IPFS URL
  price: number;              // 300 ADA
  isActive: boolean;
}
```

---

## Admin Panel Requirements

**READ-ONLY Dashboard** (No batch minting UI, no policy creation UI)

**Features:**
1. **Phase Management:**
   - View all phases (Phase 1 Bronze, Phase 2 Silver, etc.)
   - See current phase status (active, completed, upcoming)
   - View real-time mint counts per phase

2. **Claim Tracking:**
   - Who claimed which NFT (user + wallet address + timestamp)
   - Total claims per phase
   - Failed payment tracking

3. **Statistics:**
   - Total NFTs minted across all phases
   - Total revenue per phase
   - Policy ID display
   - Link to Cardano explorer for policy

4. **Webhook Monitoring:**
   - Recent webhook events
   - Payment confirmations
   - Error logs

**What's NOT Needed:**
- ❌ Batch minting UI (use NMKR Studio directly)
- ❌ Policy creation UI (NMKR handles this)
- ❌ Metadata editor (configure in NMKR Studio)
- ❌ IPFS uploader (NMKR handles this)

---

## NMKR Pay Widget Integration

### Frontend Implementation
```typescript
// Open NMKR Pay widget
const openNMKRWidget = (phase: number) => {
  // Determine which project ID to use based on phase
  const projectId = phase === 1
    ? process.env.NEXT_PUBLIC_NMKR_PROJECT_ID_PHASE1_PREPROD
    : process.env.NEXT_PUBLIC_NMKR_PROJECT_ID_PHASE2_PREPROD;

  // Open NMKR Pay widget (they provide JavaScript SDK)
  window.NMKRPay.open({
    projectId: projectId,
    walletAddress: userWalletAddress, // From wallet connection
    network: process.env.NEXT_PUBLIC_NMKR_NETWORK,
    onSuccess: (txHash) => {
      // Webhook will handle database update
      console.log('Payment successful:', txHash);
    },
    onError: (error) => {
      console.error('Payment failed:', error);
    }
  });
};
```

### When to Switch Project IDs
- **Phase 1 active:** Use `NEXT_PUBLIC_NMKR_PROJECT_ID_PHASE1`
- **Phase 2 active:** Use `NEXT_PUBLIC_NMKR_PROJECT_ID_PHASE2`
- **Phase 3 active:** Use `NEXT_PUBLIC_NMKR_PROJECT_ID_PHASE3`

All NFTs still go to same policy ID on-chain, but different NMKR projects manage different phases.

---

## Webhook Endpoint Design

### Endpoint: `/api/nmkr-webhook`
```typescript
export async function POST(request: Request) {
  // Verify webhook signature
  const signature = request.headers.get('x-nmkr-signature');
  const isValid = verifyWebhookSignature(signature, request.body);

  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  const payload = await request.json();

  // Log webhook event
  await ctx.db.insert('nmkrWebhookLogs', {
    projectId: payload.projectId,
    eventType: payload.eventType,
    payload: payload,
    processed: false,
    receivedAt: Date.now()
  });

  // Handle payment complete event
  if (payload.eventType === 'payment_complete') {
    await ctx.db.insert('nftClaims', {
      userId: payload.userId,
      walletAddress: payload.walletAddress,
      projectId: payload.projectId,
      phase: payload.metadata.Phase,
      tier: payload.metadata.Tier,
      assetName: payload.assetName,
      policyId: payload.policyId,
      txHash: payload.txHash,
      claimedAt: Date.now(),
      paymentStatus: 'completed'
    });
  }

  return new Response('OK', { status: 200 });
}
```

---

## Critical Information to Document

### After Phase 1 Creation - SAVE THESE:
1. **Policy ID** (56-character hex string starting with letters/numbers)
   - Example: `a1b2c3d4e5f6789...`
   - **Where to find:** NMKR project dashboard after creation
   - **Where to save:** `.env.local` as `NEXT_PUBLIC_POLICY_ID_BETA_COMMEMORATIVE_PREPROD`

2. **Project ID** (NMKR's internal ID)
   - Example: `19244`
   - **Where to find:** NMKR project dashboard URL
   - **Where to save:** `.env.local` as `NEXT_PUBLIC_NMKR_PROJECT_ID_PHASE1_PREPROD`

3. **API Keys**
   - Get from NMKR Studio → Settings → API Keys
   - Save to `.env.local`

4. **Webhook Secret**
   - Get from NMKR Studio → Settings → Webhooks
   - Save to `.env.local`

### Verification Checklist
After Phase 1 Preprod Launch:
- [ ] Policy ID documented in `.env.local`
- [ ] Project ID documented in `.env.local`
- [ ] Test purchase completed successfully
- [ ] NFT appeared in test wallet
- [ ] Policy ID verified on Cardano explorer (preprod.cardanoscan.io)
- [ ] Webhook triggered and logged in database
- [ ] Ready to create Phase 2 with policy ID reuse

---

## Common Pitfalls to Avoid

### 1. Forgetting to Save Policy ID
**Problem:** Phase 1 creates policy ID, you forget to save it, can't reuse for Phase 2.
**Solution:** Immediately after Phase 1 creation, copy policy ID and save to `.env.local`.

### 2. Locking Policy Too Early
**Problem:** Lock policy in Phase 1, can't mint Phase 2 NFTs.
**Solution:** Keep "Policyscript will lock" toggle OFF until ALL phases complete.

### 3. Trying to Add NFTs to Existing Project
**Problem:** Create Phase 1 project, try to add Phase 2 NFTs to it later.
**Solution:** Remember NMKR projects are static - create separate projects per phase.

### 4. Inconsistent Metadata Structure
**Problem:** Phase 1 has metadata field "Tier", Phase 2 doesn't - collection looks fragmented.
**Solution:** Keep metadata structure identical across all phases (just change values).

### 5. Using Different Policy IDs Per Phase
**Problem:** Phase 1 creates new policy, Phase 2 creates NEW policy instead of reusing.
**Solution:** In Phase 2+ setup, select "Use existing policy" and paste Phase 1's policy ID.

---

## Next Steps

### Immediate (Current Session)
1. ⏳ Finish METADATA tab configuration
2. Add static fields: Phase=1, Collection, Tier=Bronze
3. Add placeholder field: Mint Number
4. Scroll down to complete NFT upload section
5. Configure max supply (35), pricing (10 tADA), whitelist
6. Create project and **SAVE POLICY ID**

### Week 1 (After Phase 1 Created)
1. Generate NMKR API keys
2. Configure webhook endpoint
3. Test Phase 1 purchase flow
4. Verify NFTs mint correctly
5. Document Policy ID in `.env.local`

### Week 2 (Phase 2 Test)
1. Create Phase 2 Silver project
2. Reuse Phase 1 policy ID
3. Test minting from second project
4. Verify both phases appear in same collection

### After Preprod Validation
1. Replicate exact process on mainnet
2. Build admin panel for tracking claims
3. Integrate NMKR Pay widget on frontend
4. Launch Phase 1 Bronze for production

---

## Resources

- **NMKR Studio Dashboard:** https://studio.nmkr.io/
- **NMKR API Docs:** https://docs.nmkr.io/
- **Cardano Explorer (Preprod):** https://preprod.cardanoscan.io/
- **Cardano Explorer (Mainnet):** https://cardanoscan.io/
- **NMKR Pay Widget Docs:** https://docs.nmkr.io/nmkr-pay

---

**Last Updated:** January 2025 (during Phase 1 Preprod setup)
**Status:** Phase 1 METADATA tab in progress
**Next:** Complete METADATA configuration and create project
