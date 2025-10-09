# Multi-Wallet Support - Detailed Implementation Plan

## Overview
Allow users to link multiple Cardano wallets to a single Discord account while maintaining snapshot security and preventing gold exploitation.

---

## Phase 1: Database Schema Changes

### 1.1 Update discordConnections Table
**Current State:**
- Unique constraint on `discordUserId` (one wallet per user)
- Fields: `walletAddress`, `discordUserId`, `discordUsername`, `guildId`

**Changes Needed:**
- **REMOVE** unique constraint on `discordUserId`
- **ADD** index: `by_discord_user` on `(discordUserId, guildId)`
- **ADD** field: `walletNickname` (string, optional) - user-defined name like "Main Wallet", "Cold Storage"
- **ADD** field: `isPrimary` (boolean) - one wallet marked as primary per user
- **ADD** field: `linkedAt` (number) - timestamp when wallet was linked
- **KEEP** unique constraint on `(walletAddress, guildId)` - same wallet can't be linked twice

**New Index Structure:**
```typescript
discordConnections: defineTable({
  walletAddress: v.string(),
  discordUserId: v.string(),
  discordUsername: v.string(),
  guildId: v.string(),
  walletNickname: v.optional(v.string()),
  isPrimary: v.boolean(),
  linkedAt: v.number(),
})
  .index("by_discord_user", ["discordUserId", "guildId"])
  .index("by_wallet", ["walletAddress", "guildId"])
  .index("by_primary", ["discordUserId", "isPrimary"])
```

### 1.2 goldMiningSnapshots Table
**No changes needed** - already tracks per wallet via `walletAddress`

### 1.3 ownedMeks Table
**No changes needed** - already tracks per wallet via `walletAddress`

---

## Phase 2: Backend Convex Functions

### 2.1 Discord Integration Changes (`convex/discordIntegration.ts`)

#### 2.1.1 Update `linkDiscordToWallet` Mutation
**Current:** Throws error if user already has wallet linked
**New Behavior:**
```typescript
- Check if walletAddress already linked to ANY user → throw error
- Check if discordUserId already has this wallet → throw error (duplicate)
- Count existing wallets for this user
- If count === 0:
  - Set isPrimary = true
- Else:
  - Set isPrimary = false
- Insert new connection with linkedAt = Date.now()
- Return success message with wallet count
```

**Error Messages:**
- "This wallet is already linked to another Discord account"
- "You've already linked this wallet"
- "Successfully linked wallet #3 to your account"

#### 2.1.2 Update `unlinkDiscordFromWallet` Mutation
**Current:** Removes single wallet connection
**New Behavior:**
```typescript
- Verify user owns this wallet
- Check if wallet is primary
- If primary AND user has other wallets:
  - Promote oldest linked wallet to primary
- Delete connection
- Return remaining wallet count
```

**Error Messages:**
- "You don't have this wallet linked"
- "Wallet unlinked. You have 2 wallets remaining"
- "Last wallet unlinked. Link a wallet to continue earning gold"

#### 2.1.3 NEW: `setPrimaryWallet` Mutation
```typescript
export const setPrimaryWallet = mutation({
  args: {
    walletAddress: v.string(),
    discordUserId: v.string(),
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify user owns this wallet
    // Set all user's wallets isPrimary = false
    // Set this wallet isPrimary = true
  }
});
```

#### 2.1.4 NEW: `setWalletNickname` Mutation
```typescript
export const setWalletNickname = mutation({
  args: {
    walletAddress: v.string(),
    discordUserId: v.string(),
    nickname: v.string(), // max 20 chars
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify user owns wallet
    // Update walletNickname field
  }
});
```

#### 2.1.5 NEW: `getUserWallets` Query
```typescript
export const getUserWallets = query({
  args: {
    discordUserId: v.string(),
    guildId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all wallets for user
    // Sort by isPrimary DESC, linkedAt ASC
    // Return array of wallet connections
  }
});
```

#### 2.1.6 Update `getUserGoldAndEmoji` Query
**Current:** Takes single `walletAddress`
**New:** Takes `discordUserId` + `guildId`, aggregates all wallets
```typescript
- Get all wallets for user via getUserWallets
- For each wallet:
  - Get gold data
  - Get goldPerHour
  - Get owned meks
- Aggregate:
  - totalGold = sum of all wallet golds
  - totalGoldPerHour = sum of all wallet rates
  - allMeks = combined array of all meks (deduped by assetId)
  - highestEarner = max goldPerHour mek across all wallets
- Return aggregated data + tierName/emoji based on total
```

### 2.2 Gold Mining Changes (`convex/goldMining.ts`)

#### 2.2.1 Update `getGoldMiningData` Query
**Current:** Takes `walletAddress`
**New:** Add optional `aggregateWallets` parameter
```typescript
export const getGoldMiningData = query({
  args: {
    walletAddress: v.optional(v.string()),
    discordUserId: v.optional(v.string()),
    aggregateWallets: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.aggregateWallets && args.discordUserId) {
      // Get all wallets for discord user
      // Aggregate gold data across all wallets
      // Return combined totals
    } else {
      // Original single-wallet behavior
    }
  }
});
```

#### 2.2.2 Snapshot Logic
**No changes needed** - snapshots remain per-wallet, aggregation happens at query time

### 2.3 Leaderboard Changes (`convex/goldLeaderboard.ts`)

#### 2.3.1 Update `getGoldLeaderboard` Query
**Current:** One row per wallet
**New:** One row per Discord user (aggregate wallets)
```typescript
- Get all discord connections
- Group by discordUserId
- For each user:
  - Get all their wallets
  - Sum cumulativeGold across wallets
  - Sum goldPerHour across wallets
  - Count total meks across wallets
- Sort by total cumulative gold
- Return top 100
```

**Display Format:**
```
Rank | Discord User | Wallets | Total Gold | Gold/hr | Meks
1    | wrenellis    | 3       | 150,000    | 45.2    | 42
```

---

## Phase 3: Discord Bot Changes

### 3.1 Update `/linkwallet` Command

#### Current Flow:
1. User: `/linkwallet wallet:stake1...`
2. Bot: Links wallet or shows error

#### New Flow:
```
1. User: `/linkwallet wallet:stake1...`
2. Bot checks: Is this wallet already linked to someone else?
   - YES → Error: "This wallet is already linked to another user"
   - NO → Continue
3. Bot checks: Does user already have this wallet?
   - YES → Error: "You've already linked this wallet"
   - NO → Continue
4. Bot checks: How many wallets does user have?
   - Count = 0 → Link as primary
   - Count > 0 → Link as secondary
5. Bot: "✅ Wallet linked! You now have X wallet(s) connected."
6. Ask: "Would you like to set a nickname for this wallet? (Reply with name or 'skip')"
```

**Optional Enhancement:**
After linking, show button:
- "Set as Primary" (if not already primary)
- "Set Nickname"

### 3.2 Update `/unlinkwallet` Command

#### Current Implementation:
```typescript
// Takes no arguments, unlinks user's only wallet
```

#### New Implementation - DROPDOWN SELECTION:
```typescript
/unlinkwallet
→ Shows dropdown menu with all user's wallets
→ Format: "Wallet 1 (Primary) - stake1u8zev...ghgq076 - Main Wallet"
→ User selects wallet to unlink
→ Confirmation: "Are you sure? This wallet will stop earning gold."
→ Unlink and promote new primary if needed
```

**Dropdown Options:**
```
[Dropdown Menu]
Option 1: "🌟 Wallet 1 (Primary) - stake1u8ze...076 - Main Wallet"
Option 2: "Wallet 2 - stake1u9abc...123 - Cold Storage"
Option 3: "Wallet 3 - stake1uxyz...789"

[Confirm Button] [Cancel Button]
```

**Edge Cases:**
- User has only 1 wallet → No dropdown, just confirm unlink
- User tries to unlink primary → Auto-promote oldest remaining wallet
- User unlinks last wallet → Loses all gold accumulation until relink

### 3.3 NEW: `/wallets` Command

```typescript
/wallets [hidden:boolean]
```

Shows user's linked wallets with management options.

**Response Format:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💼 YOUR LINKED WALLETS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌟 WALLET 1 (PRIMARY)
Address: stake1u8zev...ghgq076
Nickname: Main Wallet
Gold: 45,230 | Rate: 12.5 g/hr | Meks: 15
Linked: 3 days ago

WALLET 2
Address: stake1u9abc...123
Nickname: Cold Storage
Gold: 28,450 | Rate: 8.2 g/hr | Meks: 12
Linked: 1 day ago

WALLET 3
Address: stake1uxyz...789
Nickname: (none)
Gold: 15,200 | Rate: 5.1 g/hr | Meks: 8
Linked: 2 hours ago

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 COMBINED TOTALS
Total Gold: 88,880
Total Rate: 25.8 g/hr
Total Meks: 35
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Manage Wallets] [Set Primary] [Set Nicknames]
```

**Buttons:**
- **Manage Wallets** → Shows options to unlink specific wallet
- **Set Primary** → Dropdown to choose new primary
- **Set Nicknames** → Modal to set nickname for a wallet

### 3.4 Update `/mygold` Command

**Current:** Shows gold for single wallet
**New:** Shows aggregated gold from all wallets

```
💰 YOUR GOLD STATS

Total Gold: 88,880 (across 3 wallets)
Gold per Hour: 25.8 g/hr
Tier: Diamond 💎

Highest Earner: Mek #2404 - 4.2 g/hr (in Wallet 1)

[View Wallets] → Opens /wallets command
```

### 3.5 Update `/corp` Command

**Current:** Shows single wallet address
**New:** Show wallet count, use primary wallet for display

```
Corporation Image (unchanged)

Buttons:
[Complete Workforce] → Shows all meks from all wallets
[View Wallets (3)] → Opens /wallets command

Footer text:
"WrenCo • 3 Wallets Linked • 42 Meks"
```

---

## Phase 4: Frontend Changes

### 4.1 Profile Page (`/profile`)

#### 4.1.1 Wallet Display Section
**Current:**
```tsx
<div>Connected Wallet: stake1u8zev...076</div>
```

**New:**
```tsx
<div className="wallet-section">
  <h3>Linked Wallets ({wallets.length})</h3>

  {wallets.map(wallet => (
    <div className="wallet-card" key={wallet.walletAddress}>
      <div className="wallet-header">
        {wallet.isPrimary && <span className="primary-badge">⭐ Primary</span>}
        <span className="wallet-nickname">{wallet.walletNickname || "Unnamed"}</span>
      </div>

      <div className="wallet-address">
        {truncateAddress(wallet.walletAddress)}
        <button onClick={() => copyAddress(wallet.walletAddress)}>📋</button>
      </div>

      <div className="wallet-stats">
        <span>Gold: {wallet.gold?.toLocaleString()}</span>
        <span>Rate: {wallet.goldPerHour} g/hr</span>
        <span>Meks: {wallet.mekCount}</span>
      </div>

      <div className="wallet-actions">
        <button onClick={() => setPrimary(wallet.walletAddress)}>Set Primary</button>
        <button onClick={() => setNickname(wallet.walletAddress)}>Rename</button>
        <button onClick={() => unlinkWallet(wallet.walletAddress)}>Unlink</button>
      </div>
    </div>
  ))}

  <button className="add-wallet-btn">+ Link Another Wallet</button>
</div>
```

#### 4.1.2 Mek Grid
**No visual changes** - just show all meks from all wallets combined
**Backend:** Update query to fetch from multiple wallets

### 4.2 Corp Page (`/corp/[identifier]`)

#### 4.2.1 Header Section
**Current:**
```tsx
<div>Wallet: stake1u8zev...076</div>
```

**New:**
```tsx
<div className="corp-wallets">
  <span>{walletCount} Wallet{walletCount > 1 ? 's' : ''} Linked</span>
  <button onClick={showWalletsModal}>View All</button>
</div>
```

#### 4.2.2 Wallets Modal (New Component)
```tsx
<Modal title="Corporation Wallets">
  {wallets.map(wallet => (
    <div className="modal-wallet-row">
      <span className="wallet-label">
        {wallet.isPrimary && "⭐ "}
        {wallet.walletNickname || `Wallet ${index + 1}`}
      </span>
      <span className="wallet-address">{truncate(wallet.walletAddress)}</span>
      <span className="wallet-meks">{wallet.mekCount} Meks</span>
    </div>
  ))}
</Modal>
```

### 4.3 Admin Pages

#### 4.3.1 Admin Wallet Management (`/admin/wallets` or similar)

**New Admin View:**
```tsx
<AdminTable>
  <thead>
    <tr>
      <th>Discord User</th>
      <th>Wallets</th>
      <th>Primary Wallet</th>
      <th>Total Gold</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {users.map(user => (
      <tr>
        <td>{user.discordUsername}</td>
        <td>{user.walletCount}</td>
        <td>{truncate(user.primaryWallet)}</td>
        <td>{user.totalGold}</td>
        <td>
          <button onClick={() => viewWallets(user)}>View All</button>
          <button onClick={() => forceUnlink(user)}>Force Unlink</button>
        </td>
      </tr>
    ))}
  </tbody>
</AdminTable>
```

**Expandable Row Details:**
```tsx
<ExpandedRow>
  {user.wallets.map(wallet => (
    <div className="wallet-detail-row">
      <span>{wallet.isPrimary && "⭐ "}{wallet.walletNickname}</span>
      <span>{wallet.walletAddress}</span>
      <span>{wallet.gold} gold</span>
      <span>{wallet.mekCount} meks</span>
      <button onClick={() => forceUnlinkWallet(wallet)}>Unlink</button>
    </div>
  ))}
</ExpandedRow>
```

---

## Phase 5: Security & Validation

### 5.1 Wallet Linking Security

**Prevent Exploits:**
1. **Duplicate Prevention:**
   - Same wallet can't be linked to multiple Discord users
   - Same wallet can't be linked twice to same user

2. **Snapshot Integrity:**
   - Snapshots remain per-wallet (no changes needed)
   - Moving NFT between linked wallets doesn't create extra gold
   - Gold calculation uses snapshot data, not live wallet state

3. **Rate Limiting:**
   - Max 5 wallet link/unlink actions per hour per user
   - Prevent spam linking/unlinking

### 5.2 NFT Transfer Detection

**Scenario:** User moves Mek from Wallet A → Wallet B (both linked)

**System Behavior:**
```
Before Move:
- Wallet A snapshot: has Mek #123
- Wallet B snapshot: doesn't have Mek #123
- Gold calculation: Mek #123 earns from Wallet A

After Move (before next snapshot):
- Wallet A: doesn't have Mek #123 (live)
- Wallet B: has Mek #123 (live)
- Gold calculation: STILL uses snapshot (Wallet A credited)

After Next Snapshot:
- New snapshots capture current state
- Wallet A snapshot: no Mek #123
- Wallet B snapshot: has Mek #123
- Gold calculation: Mek #123 now earns from Wallet B
```

**No exploit possible** - Mek can only earn once per snapshot period.

### 5.3 Primary Wallet Rules

**Enforcement:**
- User must ALWAYS have exactly 1 primary wallet (if any wallets linked)
- If primary is unlinked → oldest wallet auto-promoted
- Admin can force-change primary if needed

**Purpose of Primary:**
- Used for display in Discord embeds
- Used for corporation identification
- No functional gold difference vs secondary wallets

---

## Phase 6: Edge Cases & Testing

### 6.1 Edge Case: User Unlinks All Wallets

**Behavior:**
- All wallet connections deleted
- Snapshots remain in database (historical data)
- User can re-link later
- Gold accumulation stops until relink
- Leaderboard: user removed from rankings

**Recovery:**
- User links wallet again
- New snapshot created
- Gold starts accumulating again
- Previous cumulative gold: PRESERVED or RESET? (Decision needed)

**Recommendation:** Preserve cumulative gold even after unlinking/relinking

### 6.2 Edge Case: Wallet Already Linked to Another User

**Scenario:**
- UserA links Wallet1
- UserB tries to link Wallet1

**Behavior:**
```
Bot: "❌ This wallet is already linked to another Discord account.
Each wallet can only be linked to one user."
```

**Admin Override:**
- Admin can force-unlink wallet from UserA
- Then UserB can link it

### 6.3 Edge Case: User Links 10+ Wallets

**Current Discord Dropdown Limit:** 25 options max

**Behavior:**
- Allow up to 25 wallets per user (dropdown limit)
- Show warning at 20 wallets: "You're approaching the maximum of 25 wallets"
- At 25 wallets: "Maximum wallets reached. Unlink a wallet to add more"

**Alternative:** Implement pagination for 25+ wallets (future enhancement)

### 6.4 Edge Case: Primary Wallet Runs Out of Meks

**Scenario:**
- UserA has 3 wallets
- Primary wallet (Wallet1) sells all Meks
- Wallets 2 & 3 still have Meks

**Behavior:**
- User still earns gold from Wallets 2 & 3
- Primary wallet shows 0 g/hr but stays primary
- User can manually change primary if desired
- No automatic primary change based on gold rate

### 6.5 Edge Case: Rapid Link/Unlink Spam

**Prevention:**
- Rate limit: 5 link/unlink actions per hour
- Cooldown message: "⏱️ You're doing that too fast. Try again in X minutes"

### 6.6 Edge Case: Snapshot Taken During Wallet Link

**Scenario:**
- User links new wallet during snapshot process
- Snapshot system is currently snapshotting all wallets

**Behavior:**
- New wallet gets snapshotted in same cycle
- Or: New wallet waits until next snapshot cycle (1 hour later)

**Recommendation:** Wait until next snapshot cycle to avoid mid-snapshot inconsistencies

---

## Phase 7: Migration Plan

### 7.1 Database Migration

**Step 1: Add New Fields (Non-Breaking)**
```typescript
// Add to existing discordConnections records
await ctx.db.patch(connectionId, {
  isPrimary: true,  // All existing connections become primary
  linkedAt: Date.now(),
  walletNickname: undefined,
});
```

**Step 2: Drop Unique Constraint**
```typescript
// Update schema.ts
// OLD: .index("by_discord_user", ["discordUserId", "guildId"], { unique: true })
// NEW: .index("by_discord_user", ["discordUserId", "guildId"])
```

**Step 3: Deploy to Convex**
```bash
npx convex deploy --typecheck disable
```

### 7.2 Gradual Rollout (Optional)

**Feature Flag Approach:**
```typescript
const MULTI_WALLET_ENABLED = false; // Toggle in code

if (MULTI_WALLET_ENABLED) {
  // New multi-wallet logic
} else {
  // Old single-wallet logic
}
```

**Rollout Plan:**
1. Deploy backend changes with flag OFF
2. Test with admin accounts
3. Enable flag for small user group
4. Enable for everyone after 24hr testing

---

## Phase 8: Testing Scenarios

### 8.1 Unit Tests

**Test Coverage:**
1. ✅ Link first wallet → isPrimary = true
2. ✅ Link second wallet → isPrimary = false
3. ✅ Unlink primary → oldest wallet promoted
4. ✅ Unlink non-primary → no promotion
5. ✅ Set wallet nickname → updates correctly
6. ✅ Set primary wallet → old primary demoted
7. ✅ Aggregate gold from 3 wallets → correct sum
8. ✅ NFT in Wallet1 moves to Wallet2 → no double counting
9. ✅ User with 0 wallets → no gold accumulation
10. ✅ User links duplicate wallet → error thrown

### 8.2 Integration Tests

**Discord Bot Tests:**
1. `/linkwallet` first wallet → success
2. `/linkwallet` second wallet → success
3. `/linkwallet` duplicate → error
4. `/unlinkwallet` → shows dropdown
5. `/unlinkwallet` → select & confirm
6. `/wallets` → shows all wallets
7. `/mygold` → shows aggregated gold
8. `/corp` → shows wallet count

**Frontend Tests:**
1. Profile page → shows multiple wallets
2. Click "Set Primary" → updates correctly
3. Click "Unlink" → confirmation modal
4. Admin page → shows user wallet list

### 8.3 Manual Testing Checklist

**Scenario 1: New User Links 3 Wallets**
- [ ] Link Wallet1 → verify primary
- [ ] Link Wallet2 → verify secondary
- [ ] Link Wallet3 → verify secondary
- [ ] Check `/wallets` → 3 wallets shown
- [ ] Check `/mygold` → aggregated totals
- [ ] Check profile page → 3 wallet cards

**Scenario 2: User Moves NFT Between Wallets**
- [ ] Wallet1 has Mek #123
- [ ] Take snapshot
- [ ] Move Mek #123 to Wallet2
- [ ] Check gold → still earning from Wallet1 snapshot
- [ ] Wait for next snapshot
- [ ] Check gold → now earning from Wallet2

**Scenario 3: User Unlinks Primary Wallet**
- [ ] User has 3 wallets, Wallet1 is primary
- [ ] Unlink Wallet1
- [ ] Verify Wallet2 promoted to primary
- [ ] Check Discord embeds → show new primary address

**Scenario 4: User Unlinks All Wallets**
- [ ] Unlink all 3 wallets
- [ ] Check leaderboard → user removed
- [ ] Check profile → "No wallets linked"
- [ ] Re-link wallet → starts fresh or preserves gold?

---

## Phase 9: Implementation Order

### Day 1: Backend Foundation
1. Update Convex schema (add fields, indexes)
2. Deploy schema changes
3. Update `linkDiscordToWallet` mutation
4. Update `unlinkDiscordFromWallet` mutation
5. Create `getUserWallets` query
6. Test with Convex dashboard

### Day 2: Backend Aggregation
1. Update `getUserGoldAndEmoji` to aggregate
2. Update `getGoldMiningData` for multi-wallet
3. Update `getGoldLeaderboard` to group by user
4. Create `setPrimaryWallet` mutation
5. Create `setWalletNickname` mutation
6. Test aggregation logic

### Day 3: Discord Bot
1. Update `/linkwallet` command
2. Update `/unlinkwallet` with dropdown
3. Create `/wallets` command
4. Update `/mygold` to show aggregates
5. Update `/corp` to show wallet count
6. Test all commands end-to-end

### Day 4: Frontend - Profile
1. Update profile page wallet section
2. Add wallet cards UI
3. Add "Link Another Wallet" button
4. Add set primary/nickname/unlink actions
5. Test wallet management flow

### Day 5: Frontend - Corp & Admin
1. Update corp page header
2. Add wallets modal
3. Update admin wallet management page
4. Add expandable wallet rows
5. Test admin functionality

### Day 6: Testing & Bug Fixes
1. Run full test suite
2. Manual testing of all scenarios
3. Fix bugs found during testing
4. Performance testing with multiple wallets
5. Security audit

---

## Phase 10: Rollback Plan

**If Critical Issues Found:**

### Rollback Steps:
1. **Disable feature flag** (if using flags)
2. **Revert Discord bot to single-wallet:**
   - Redeploy previous bot.js version
3. **Keep database changes:**
   - Don't delete new fields
   - Users with multiple wallets: keep all data
   - System uses only primary wallet
4. **Fix issues offline**
5. **Re-deploy when ready**

### Data Preservation:
- Never delete wallet connections
- Keep all snapshots
- Cumulative gold preserved
- Can always roll forward again

---

## Phase 11: Success Metrics

**How We Know It's Working:**

### Metrics to Track:
1. **Adoption:**
   - % of users with 2+ wallets
   - Average wallets per user
   - Total wallets linked

2. **Usage:**
   - `/wallets` command usage
   - Wallet link/unlink frequency
   - Primary wallet changes

3. **Gold Impact:**
   - Total gold distributed
   - Average gold per user (before/after)
   - Leaderboard position changes

4. **Errors:**
   - Failed wallet links
   - Duplicate wallet attempts
   - Snapshot errors

### Success Criteria:
- ✅ 0 critical bugs in 48 hours
- ✅ <1% error rate on wallet operations
- ✅ No gold exploitation detected
- ✅ Positive user feedback
- ✅ Snapshots work correctly with multi-wallet

---

## Phase 12: Future Enhancements (Post-Launch)

### Potential Additions:
1. **Wallet Groups:**
   - "Hot Wallets" vs "Cold Storage"
   - Filter meks by wallet group

2. **Wallet-Specific Stats:**
   - Gold earned per wallet over time
   - Best performing wallet
   - Wallet comparison charts

3. **NFT Transfer History:**
   - Track when NFTs moved between linked wallets
   - Show transfer timeline

4. **Bulk Wallet Operations:**
   - Link multiple wallets at once
   - Export wallet list

5. **Wallet Verification:**
   - Optional: Sign message to prove ownership
   - Enhanced security for high-value wallets

---

## Questions to Resolve Before Implementation

1. **Cumulative Gold After Unlink/Relink:**
   - Preserve or reset?
   - **Recommendation:** Preserve

2. **Maximum Wallets Per User:**
   - 25 (Discord limit) or fewer?
   - **Recommendation:** 25

3. **Primary Wallet Auto-Switch:**
   - If primary runs out of meks, auto-switch?
   - **Recommendation:** No auto-switch, manual only

4. **Rate Limiting:**
   - How strict? 5/hour? 10/hour?
   - **Recommendation:** 5 link/unlink per hour

5. **Wallet Nicknames:**
   - Required or optional?
   - **Recommendation:** Optional

6. **Admin Force Unlink:**
   - Should admins be able to force-unlink any wallet?
   - **Recommendation:** Yes, for support cases

---

## Files That Need Changes

### Backend (Convex):
- ✏️ `convex/schema.ts` - Update discordConnections table
- ✏️ `convex/discordIntegration.ts` - Update link/unlink, add new queries
- ✏️ `convex/goldMining.ts` - Add wallet aggregation
- ✏️ `convex/goldLeaderboard.ts` - Group by Discord user
- ➕ `convex/walletManagement.ts` - NEW file for wallet CRUD operations

### Discord Bot:
- ✏️ `discord-bot/bot.js` - Update all wallet-related commands
- ✏️ `discord-bot/.env` - No changes

### Frontend:
- ✏️ `src/app/profile/page.tsx` - Multi-wallet display
- ✏️ `src/app/corp/[identifier]/page.tsx` - Wallet count
- ✏️ `src/components/WalletManagement.tsx` - NEW wallet UI component
- ➕ `src/app/admin/wallets/page.tsx` - NEW admin wallet management

### Types:
- ✏️ `convex/_generated/api.d.ts` - Auto-generated, will update
- ➕ `src/types/wallet.ts` - NEW type definitions for multi-wallet

---

## Estimated Implementation Time

**Total Time:** 20-25 hours

**Breakdown:**
- Backend (Convex): 8-10 hours
- Discord Bot: 6-8 hours
- Frontend: 4-5 hours
- Testing: 2-3 hours
- Bug Fixes: 2-3 hours

**Timeline:** 5-6 working days with dedicated focus

---

## Notes
- This plan assumes local development/testing only
- No GitHub pushes until feature is stable
- All changes should be testable via `npm run dev:all`
- Use Convex dashboard for backend testing
- Use Discord test server for bot testing
