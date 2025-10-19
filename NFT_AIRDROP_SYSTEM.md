# NFT Airdrop System - Implementation Documentation

## Overview
Complete NFT airdrop system for awarding commemorative NFTs to early supporters who have connected wallets and accumulated gold. Users submit Cardano receive addresses, and admins export addresses as CSV for batch distribution via NMKR.

## Current Status: Phase 4 Complete ✅

### ✅ Completed Phases
- **Phase 1**: Database schema for airdrop system
- **Phase 2**: Admin toggle to show/hide airdrop button
- **Phase 2.5**: Fixed eligibility query to use goldMining table
- **Phase 3**: Airdrop claim banner with eligibility logic
- **Phase 3.5**: Finalized claim button styling (HolographicButton)
- **Phase 4**: Address submission lightbox with validation

### ⏳ Remaining Phases
- **Phase 5**: Test full submission flow end-to-end
- **Phase 6**: NMKR API integration for automatic sending (optional)
- **Phase 7**: Admin dashboard enhancements (partially complete)

---

## Database Schema

### Tables Added to `convex/schema.ts`

#### `airdropConfig`
Stores campaign configuration and settings.

```typescript
airdropConfig: defineTable({
  campaignName: v.string(),
  isActive: v.boolean(),
  nftName: v.string(),
  nftDescription: v.string(),
  imageUrl: v.optional(v.string()),
  minimumGold: v.number(),
  startDate: v.optional(v.number()),
  endDate: v.optional(v.number()),
  nmkrProjectId: v.optional(v.string()),
  policyId: v.optional(v.string()),
  totalEligible: v.optional(v.number()),
  totalSubmitted: v.optional(v.number()),
  totalSent: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_campaign", ["campaignName"])
  .index("by_active", ["isActive"])
```

#### `airdropSubmissions`
Stores user address submissions and distribution status.

```typescript
airdropSubmissions: defineTable({
  userId: v.id("users"),
  walletAddress: v.string(),
  receiveAddress: v.string(),
  goldAtSubmission: v.number(),
  submittedAt: v.number(),
  status: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("sent"),
    v.literal("failed")
  ),
  sentAt: v.optional(v.number()),
  transactionHash: v.optional(v.string()),
  transactionUrl: v.optional(v.string()),
  errorMessage: v.optional(v.string()),
  retryCount: v.optional(v.number()),
  lastRetryAt: v.optional(v.number()),
  campaignName: v.string(),
  adminNotes: v.optional(v.string()),
})
  .index("by_user", ["userId"])
  .index("by_wallet", ["walletAddress"])
  .index("by_status", ["status"])
  .index("by_campaign", ["campaignName"])
  .index("by_submitted_date", ["submittedAt"])
  .index("by_receive_address", ["receiveAddress"])
```

---

## Backend API (`convex/airdrop.ts`)

### Queries

#### `getActiveConfig`
Returns the currently active airdrop campaign.

```typescript
export const getActiveConfig = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("airdropConfig")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();
  },
});
```

#### `getConfigByCampaign`
Get config by campaign name.

```typescript
export const getConfigByCampaign = query({
  args: { campaignName: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("airdropConfig")
      .withIndex("by_campaign", (q) => q.eq("campaignName", args.campaignName))
      .first();
  },
});
```

#### `getUserSubmission`
Check if user already submitted for a campaign.

```typescript
export const getUserSubmission = query({
  args: {
    userId: v.id("users"),
    campaignName: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("airdropSubmissions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("campaignName"), args.campaignName))
      .first();
  },
});
```

#### `getAllSubmissions`
Get all submissions (admin only), with optional filters.

```typescript
export const getAllSubmissions = query({
  args: {
    campaignName: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("sent"),
      v.literal("failed")
    ))
  },
  handler: async (ctx, args) => {
    // Returns submissions with user details
  },
});
```

#### `getEligibleUsersCount`
**CRITICAL**: Uses `goldMining` table, not `users` table!

```typescript
export const getEligibleUsersCount = query({
  args: { minimumGold: v.number() },
  handler: async (ctx, args) => {
    const miners = await ctx.db.query("goldMining").collect();
    const now = Date.now();

    const eligible = miners.filter(miner => {
      // Calculate real-time gold including accumulation
      let currentGold = miner.accumulatedGold || 0;

      if (miner.isBlockchainVerified === true) {
        const lastUpdateTime = miner.lastSnapshotTime || miner.updatedAt || miner.createdAt;
        const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
        const goldSinceLastUpdate = miner.totalGoldPerHour * hoursSinceLastUpdate;
        currentGold = (miner.accumulatedGold || 0) + goldSinceLastUpdate;
      }

      return (
        currentGold > args.minimumGold &&  // Strictly greater than
        miner.walletAddress &&
        miner.isBlockchainVerified === true
      );
    });

    return eligible.length;
  },
});
```

### Mutations

#### `submitAddress`
User submits receive address for NFT.

```typescript
export const submitAddress = mutation({
  args: {
    userId: v.id("users"),
    receiveAddress: v.string(),
    campaignName: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Verify campaign is active
    // 2. Check user has goldMining record
    // 3. Verify wallet is blockchain verified
    // 4. Calculate real-time gold
    // 5. Check gold > minimum
    // 6. Validate Cardano address format
    // 7. Check no duplicate submission
    // 8. Create submission record
    // 9. Update campaign stats
  },
});
```

#### `upsertConfig`
Create or update campaign config (admin only).

```typescript
export const upsertConfig = mutation({
  args: {
    campaignName: v.string(),
    isActive: v.boolean(),
    nftName: v.string(),
    nftDescription: v.string(),
    minimumGold: v.number(),
    imageUrl: v.optional(v.string()),
    // ... other optional fields
  },
  handler: async (ctx, args) => {
    // Creates new or updates existing campaign
  },
});
```

#### `toggleActive`
Enable/disable campaign.

```typescript
export const toggleActive = mutation({
  args: {
    campaignName: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Toggle campaign active status
  },
});
```

---

## Components

### 1. AirdropClaimBanner (`src/components/AirdropClaimBanner.tsx`)

**Location**: Appears on hub page (`src/app/hub/page.tsx`) between title and verification warning.

**Purpose**: Shows purple-themed banner to eligible users with claim button.

**Eligibility Logic** (all must be true):
- Campaign is active
- User hasn't already submitted
- Wallet is verified (`isBlockchainVerified === true`)
- Gold > minimum (calculated with real-time accumulation)

**Features**:
- Real-time gold calculation
- Purple gradient banner with pulsing animation
- Opens address submission modal on click
- Address validation (addr1 or addr_test1, length 58-108)
- Live validation feedback (green/red borders)
- Submit button disabled until valid address
- Success state with auto-close
- Error handling with user-friendly messages

**Key Code Sections**:

```typescript
// Validation function
const validateAddress = (addr: string): { valid: boolean; message?: string } => {
  if (!addr) return { valid: false, message: 'Address is required' };
  const trimmed = addr.trim();

  if (!trimmed.startsWith('addr1') && !trimmed.startsWith('addr_test1')) {
    return { valid: false, message: 'Must start with addr1 or addr_test1' };
  }

  if (trimmed.length < 58 || trimmed.length > 108) {
    return { valid: false, message: 'Invalid address length (58-108 characters)' };
  }

  return { valid: true };
};

// Submit handler
const handleSubmit = async () => {
  setIsSubmitting(true);
  try {
    await submitAddress({
      userId,
      receiveAddress: receiveAddress.trim(),
      campaignName: activeConfig.campaignName,
    });
    setSubmitSuccess(true);
    // Auto-close after 2 seconds
  } catch (error) {
    setSubmitError(error.message);
  } finally {
    setIsSubmitting(false);
  }
};
```

**Modal Styling**:
- Industrial sci-fi theme with purple accents
- Corner brackets
- Grid pattern overlay
- Glass-morphism background
- Orbitron font for headers
- Real-time validation feedback colors

### 2. CommemorativeToken1Admin (`src/components/CommemorativeToken1Admin.tsx`)

**Location**: Admin Master Data page → NFTs tab → Commemorative Token 1 section

**Purpose**: Admin control panel for campaign management.

**Features**:
- Toggle campaign enable/disable
- Live statistics dashboard:
  - Eligible users count
  - Total submissions
  - Pending submissions
  - Sent NFTs
- CSV export of all submitted addresses
- Recent submissions viewer (shows 10 most recent)
- Auto-initialization on first load
- Visual status indicators

**CSV Export Format**:
```csv
Wallet Address,Receive Address,Gold at Submission,Submitted At,Status,Transaction Hash
"stake1...",addr1...",12345,"1/15/2025 3:45 PM","pending",""
```

**Auto-Initialization**:
```typescript
useEffect(() => {
  const initializeCampaign = async () => {
    if (config === undefined) return; // Still loading
    if (config !== null) return; // Already exists

    await upsertConfig({
      campaignName: "Commemorative Token 1",
      isActive: false, // Start disabled
      nftName: "Early Miner Commemorative NFT",
      nftDescription: "Awarded to early supporters who connected their wallet and accumulated gold",
      minimumGold: 0, // Any gold qualifies
    });
  };
  initializeCampaign();
}, [config]);
```

### 3. Test Button Page (`src/app/airdrop-button/page.tsx`)

**Purpose**: Hidden test page to preview claim button styling before adding to root page.

**URL**: `http://localhost:3100/airdrop-button`

**Button Configuration** (for future root page implementation):

```tsx
<HolographicButton
  text="Claim Your NFT"
  onClick={() => console.log('Claim clicked')}
  isActive={true}
  variant="yellow"
  alwaysOn={true}
  hideIcon={true}  // IMPORTANT: No upward arrow
  className="w-full [&>div]:h-full [&>div>div]:h-full [&>div>div]:!py-3 [&>div>div]:!px-6 [&_span]:!text-base [&_span]:!tracking-[0.15em]"
/>
```

**Component**: Uses `HolographicButton` from `src/components/ui/SciFiButtons/HolographicButton.tsx`

**Features**:
- Canvas particle animations (yellow particles)
- Holographic grid background
- Data stream effects
- Shimmer on hover
- Corner bracket decorations
- Same styling as "Initiate" button on root page

---

## Integration Points

### Hub Page (`src/app/hub/page.tsx`)

Banner appears between description section and verification warning:

```tsx
{/* AIRDROP CLAIM BANNER - Show if eligible and campaign is active */}
<AirdropClaimBanner userId={userId} walletAddress={walletAddress} />
```

### Admin Master Data Page (`src/app/admin-master-data/page.tsx`)

Added NFTs category with auto-expand:

```typescript
// Added to DATA_SYSTEMS array
{ id: 'nfts', name: 'NFTs', icon: '🎨', implemented: true }

// Auto-expand configuration
const subsections = {
  'nfts': ['commemorative-token-1']
};

// Render section
{activeTab === 'nfts' && (
  <div id="section-nfts">
    {/* Commemorative Token 1 Subsection */}
    <div className="mb-4 ml-6">
      <button onClick={() => toggleSection('commemorative-token-1')}>
        {/* ... */}
      </button>
      {expandedSections.has('commemorative-token-1') && (
        <div className="p-4">
          <CommemorativeToken1Admin />
        </div>
      )}
    </div>
  </div>
)}
```

---

## Data Model Notes

### Critical Data Location
- **Wallet verification**: `goldMining.isBlockchainVerified` (NOT `users.walletVerified`)
- **Gold accumulation**: `goldMining.accumulatedGold` + real-time calculation
- **User linking**: `users.walletAddress` matches `goldMining.walletAddress`

### Real-Time Gold Calculation
```typescript
const now = Date.now();
let currentGold = goldMiningData.accumulatedGold || 0;

if (goldMiningData.isBlockchainVerified) {
  const lastUpdateTime = goldMiningData.lastSnapshotTime
    || goldMiningData.updatedAt
    || goldMiningData.createdAt;
  const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
  const goldSinceLastUpdate = goldMiningData.totalGoldPerHour * hoursSinceLastUpdate;
  currentGold = (goldMiningData.accumulatedGold || 0) + goldSinceLastUpdate;
}
```

### Eligibility Requirements
1. Campaign `isActive === true`
2. User has NOT already submitted for this campaign
3. Wallet is blockchain verified (`goldMining.isBlockchainVerified === true`)
4. Current gold **strictly greater than** minimum (not equal)

---

## Testing Workflow

### Admin Workflow
1. Navigate to Admin Master Data → NFTs tab
2. Commemorative Token 1 auto-expands
3. Campaign starts disabled by default
4. Toggle "Enable Airdrop" to activate
5. Monitor eligible users count
6. View submissions as they come in
7. Export CSV for NMKR batch distribution

### User Workflow
1. Connect wallet on hub page
2. Complete blockchain verification
3. Accumulate gold > 0
4. Purple banner appears when campaign is active
5. Click "Claim Your NFT Now" button
6. Modal opens with address submission form
7. Enter Cardano receive address (addr1...)
8. Real-time validation shows green/red feedback
9. Submit button enables when address is valid
10. Success message shows for 2 seconds
11. Modal auto-closes
12. Banner disappears (already submitted)

---

## Address Validation Rules

### Frontend Validation
```typescript
// Must start with addr1 or addr_test1
if (!addr.startsWith('addr1') && !addr.startsWith('addr_test1')) {
  return 'Must start with addr1 or addr_test1';
}

// Length must be 58-108 characters
if (addr.length < 58 || addr.length > 108) {
  return 'Invalid address length (58-108 characters)';
}
```

### Backend Validation (convex/airdrop.ts line 265-271)
Same validation rules enforced on backend to prevent bypass.

---

## Future Implementation

### Phase 5: Testing
- End-to-end submission flow testing
- Edge case validation
- Error handling verification

### Phase 6: NMKR API Integration (Optional)
If automatic distribution is desired:
- Create NMKR project integration
- Implement automatic NFT sending
- Update submission status to "sent"
- Record transaction hashes
- Update transaction URLs

### Phase 7: Admin Dashboard Enhancements
- Batch status updates
- Filter by status
- Search by wallet address
- Manual transaction hash entry
- Retry failed submissions
- Admin notes per submission

---

## File Reference

### Modified Files
- `convex/schema.ts` - Added airdropConfig and airdropSubmissions tables
- `src/components/AirdropClaimBanner.tsx` - User-facing banner and modal
- `src/components/CommemorativeToken1Admin.tsx` - Admin control panel
- `src/app/admin-master-data/page.tsx` - Added NFTs tab
- `src/app/hub/page.tsx` - Integrated claim banner

### New Files
- `convex/airdrop.ts` - Complete backend API
- `src/app/airdrop-button/page.tsx` - Test page for button styling

### Dependencies
- `convex` - Real-time database and backend
- `@/components/ui/SciFiButtons/HolographicButton` - Animated button component

---

## Important Notes

1. **Always use goldMining table** for eligibility checks, not users table
2. **Real-time gold calculation** is critical for accurate eligibility
3. **Button styling** finalized with HolographicButton (hideIcon=true)
4. **Campaign starts disabled** by default - admin must enable
5. **CSV export** is primary distribution method (NMKR integration optional)
6. **Address validation** enforced on both frontend and backend
7. **Auto-close on success** after 2-second delay for user feedback

---

## Next Steps

1. Enable campaign in admin panel to test live
2. Test full submission flow with valid address
3. Verify CSV export format
4. Test edge cases (invalid addresses, duplicate submissions)
5. Decide if NMKR API integration is needed
6. Implement root page button integration when ready

---

**Last Updated**: 2025-01-17
**Current Phase**: Phase 4 Complete
**Status**: Ready for testing
