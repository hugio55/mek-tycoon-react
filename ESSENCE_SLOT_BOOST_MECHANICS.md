# Essence Slot Boost Mechanics

## Overview
A slot-based upgrade system that allows players to purchase boosts for individual essence slots. Each boost enhances one of the three variations in that slot, giving players strategic choice over which essences to prioritize.

**Key Principle:** Boosts are tied to the **slot**, not the Mekanism. When you swap Meks, you lose the boosts.

---

## Core Mechanics

### Boost Type: Flat Bonus
- **Type**: Flat bonus (not percentage multiplier)
- **Example**: "+0.12/day" adds 0.12 to the base 0.1 generation rate
- **Result**: Boosted variation generates at 0.22/day instead of 0.1/day

### One Boost Per Slot at a Time
- Each slot can have **one active boost** targeting one of the three variations
- **Cannot** boost all three variations simultaneously (unless you buy multiple boost tiers - see below)
- Player chooses which variation to boost when purchasing

### Multiple Boost Tiers Per Slot
- Players can purchase multiple upgrade tiers for the same slot
- Each tier costs more than the previous
- Each tier provides a larger bonus
- **Example Progression** (exact values TBD):
  - Tier 1: 10,000 gold → +0.12/day bonus
  - Tier 2: 25,000 gold → +0.25/day bonus
  - Tier 3: 50,000 gold → +0.50/day bonus
  - Tier 4: 100,000 gold → +1.00/day bonus

### What Happens When You Swap Meks

**Boosts Are Lost:**
- When you remove a Mek from a slot, **all boosts for that slot are destroyed**
- Gold spent on boosts is NOT refunded
- You must purchase boosts again for the new Mek

**Why This Design:**
- Creates meaningful cost to swapping Meks
- Encourages keeping strong Meks slotted long-term
- Provides gold sink (economy balance)
- Makes slot upgrades feel valuable and permanent
- Strategic choice: "Is this new Mek worth losing my boosts?"

**Example Flow:**
1. Player slots Mek #1234 in Slot 1
2. Purchases Tier 1 boost (+0.12/day) targeting "Bumblebee" (10,000 gold)
3. Bumblebee now generates 0.22/day from Slot 1
4. Player decides to swap Mek (costs gold based on swap counter)
5. **Boost is destroyed** - gold spent is gone
6. New Mek #5678 is slotted
7. All three variations generate base 0.1/day
8. Player must purchase boosts again if desired

---

## Respec System

### Respec Button
- Allows player to remove boosts and get a fresh choice
- **Does NOT** refund the gold spent
- **Does NOT** return you to zero boosts
- Simply resets your choices so you can re-allocate

**What Respec Does:**
1. Removes all purchased boost upgrades from the slot
2. Gold spent is NOT refunded
3. Slot returns to "no boosts active" state
4. Player must purchase boosts again to apply new choices

**Why Pay to Respec?**
- This is essentially the same as swapping Meks (destroys boosts)
- Player made a mistake in their choice
- Essence priorities changed
- Prevents free constant re-optimization

**Example:**
- Player bought Tier 1 boost on "Bumblebee" for 10,000 gold
- Realizes they want to boost "Lightning" instead
- Clicks "Respec Slot 1"
- Boost on Bumblebee is removed (10,000 gold is NOT refunded)
- Must purchase new boost targeting Lightning (another 10,000 gold)
- **Total cost:** 20,000 gold to change their mind

---

## Purchase Flow

### When Player Clicks "Upgrade Slot X"

**UI Shows:**
```
┌─────────────────────────────────────────┐
│ Upgrade Slot 1                          │
│                                         │
│ Current Mek: #1234                      │
│ Variations in this slot:                │
│  • Bumblebee (head)                     │
│  • Lightning (body)                     │
│  • Moth (trait)                         │
│                                         │
│ Choose variation to boost:              │
│                                         │
│ ○ Bumblebee (head)  +0.12/day          │
│ ○ Lightning (body)   +0.12/day          │
│ ○ Moth (trait)       +0.12/day          │
│                                         │
│ Cost: 10,000 gold                       │
│                                         │
│ [Cancel] [Purchase & Apply]             │
└─────────────────────────────────────────┘
```

**After Purchase:**
- Chosen variation shows boost indicator (⭐ icon or "+0.12" badge)
- Generation rate updates immediately
- Next upgrade tier becomes available (if implemented)

---

## Stacking with Other Systems

### Interaction with Account-Wide Variation Upgrades
- **Account-wide upgrades** (from ESSENCE_ACCUMULATION_SYSTEM.md) still apply
- **Slot boosts** add on top of account-wide upgrades
- They stack additively

**Example:**
- Base Bumblebee rate: 0.1/day
- Account-wide Bumblebee upgrade (from Mek level-ups): +0.1/day
- Slot 1 boost targeting Bumblebee: +0.12/day
- **Total Bumblebee rate in Slot 1:** 0.1 + 0.1 + 0.12 = 0.32/day

### Interaction with Duplicate Variations
- If you have 2 Meks with Bumblebee slotted in different slots:
  - Slot 1: Bumblebee with boost (+0.12) = 0.22/day
  - Slot 2: Bumblebee without boost = 0.1/day
  - **Total Bumblebee:** 0.32/day (0.22 + 0.1)

---

## Database Schema

### New Table: `essenceSlotBoosts`

```typescript
{
  _id: Id<"essenceSlotBoosts">,
  _creationTime: number,

  walletAddress: string,        // Player who owns this boost
  slotNumber: number,            // Which slot (1-6)

  targetVariationId: number,     // Which variation is boosted
  targetVariationName: string,   // For display (e.g., "Bumblebee")
  targetVariationType: "head" | "body" | "item",

  bonusRate: number,             // Flat bonus (e.g., 0.12)
  tier: number,                  // Which tier (1, 2, 3, etc.)

  purchasedAt: number,           // Timestamp
  goldSpent: number,             // How much gold was spent
  lastModified: number,
}
```

**Indexes:**
- `by_wallet_and_slot` (walletAddress, slotNumber) - Get all boosts for a slot
- `by_wallet` (walletAddress) - Get all boosts for a player

**Important:** Multiple boosts can exist for the same slot (different tiers)

---

## Backend Functions Needed

### `purchaseSlotBoost(walletAddress, slotNumber, variationId, tier)`
1. Check slot exists and has a Mek slotted
2. Check variation exists in that slot's Mek
3. Get tier cost from config
4. Check player has enough gold
5. Deduct gold
6. Create boost record in `essenceSlotBoosts`
7. Return success

### `respecSlot(walletAddress, slotNumber)`
1. Get all boosts for this slot
2. Delete all boost records
3. Gold is NOT refunded
4. Return success

### `removeSlotBoosts(walletAddress, slotNumber)` (internal)
- Called automatically when Mek is unslotted or swapped
- Deletes all boost records for that slot
- No gold refund

### `calculateSlotEssenceRates(walletAddress, slotNumber)`
- Get slot data (which Mek, which variations)
- Get all boosts for this slot
- For each variation:
  - Start with base rate (0.1/day)
  - Add account-wide variation upgrades (if any)
  - Add slot boost (if targeting this variation)
  - Return final rate
- Return object: `{ headRate, bodyRate, itemRate, total }`

---

## Pricing Structure (TBD)

### Tier Progression Ideas

**Option A: Linear Scaling**
- Tier 1: 10,000 gold → +0.12/day
- Tier 2: 20,000 gold → +0.25/day
- Tier 3: 30,000 gold → +0.50/day
- Tier 4: 40,000 gold → +1.00/day

**Option B: Exponential Scaling**
- Tier 1: 10,000 gold → +0.12/day
- Tier 2: 25,000 gold → +0.25/day
- Tier 3: 62,500 gold → +0.50/day
- Tier 4: 156,250 gold → +1.00/day

**Option C: Per-Slot Pricing**
- Slot 1 cheaper (common slot)
- Slot 6 more expensive (premium slot)
- Example: Slot 1 Tier 1 = 5k, Slot 6 Tier 1 = 50k

**Decision:** To be determined based on economy balancing

---

## UI Requirements

### Slot Display Enhancements
Show boost status for each slot:

```
SLOT 1: Mek #1234
├─ Bumblebee (head) → 0.22/day ⭐ [TIER 1 BOOST]
├─ Lightning (body) → 0.1/day
└─ Moth (trait) → 0.1/day

[🔼 Upgrade Slot 1 - Tier 2 Available]
[⚙️ Respec Slot 1] ← Only if boosts exist
```

### Purchase Modal
- Show current Mek in slot
- List all 3 variations with radio buttons
- Show bonus amount clearly
- Show gold cost prominently
- Confirm button

### Respec Confirmation
```
┌─────────────────────────────────────────┐
│ Respec Slot 1                           │
│                                         │
│ This will remove ALL boosts from this   │
│ slot. You will NOT get a refund.        │
│                                         │
│ Current boosts:                         │
│  • Tier 1: Bumblebee +0.12/day          │
│                                         │
│ Gold spent: 10,000 (NOT refunded)       │
│                                         │
│ Are you sure?                           │
│                                         │
│ [Cancel] [Yes, Respec]                  │
└─────────────────────────────────────────┘
```

### Swap Warning
When player tries to swap a Mek that has boosts:

```
┌─────────────────────────────────────────┐
│ Warning: Boosts Will Be Lost            │
│                                         │
│ Swapping this Mek will destroy:         │
│  • Tier 1: Bumblebee +0.12/day          │
│  • Tier 2: Bumblebee +0.25/day          │
│                                         │
│ Total gold invested: 35,000             │
│                                         │
│ This cannot be undone.                  │
│                                         │
│ Proceed with swap?                      │
│                                         │
│ [Cancel] [Yes, Swap Anyway]             │
└─────────────────────────────────────────┘
```

---

## Strategic Implications

### Player Decisions
1. **Which variation to boost?**
   - Rarest essence (highest market value)?
   - Most common (to stack with duplicates)?
   - Essence needed for slot unlocks?

2. **Which slot to upgrade?**
   - Slot with best Mek (won't swap)?
   - Slot with highest-value variations?
   - Spread boosts across multiple slots?

3. **When to swap?**
   - Is new Mek worth losing boosts?
   - Can I afford to re-buy boosts?
   - Should I respec instead?

### Economy Impact
- **Gold sink:** Boosts provide recurring gold expenditure
- **Swap deterrent:** Boosts increase cost of swapping
- **Slot value:** Later slots feel more valuable with boosts
- **Long-term investment:** Players invest in their best Meks

---

## Open Questions

1. **Tier Pricing:** What should each tier cost? (Linear vs exponential?)
2. **Tier Bonuses:** What bonus should each tier provide? (+0.12, +0.25, +0.50, +1.0?)
3. **Max Tiers:** How many tiers per slot? (4? 5? 10?)
4. **Per-Slot Pricing:** Should different slots have different costs?
5. **Admin Configuration:** Should tier costs/bonuses be admin-editable?
6. **Boost Visibility:** Show boost indicators in main slot UI? Or only in details?
7. **Respec Cost:** Should respec have a gold cost, or is destroying the boosts enough?

---

## Relationship to Existing Systems

### ESSENCE_ACCUMULATION_SYSTEM.md
- **Account-wide variation upgrades** (from Mek level-ups) are SEPARATE
- Both systems stack together
- Account-wide = permanent, applies everywhere
- Slot boosts = temporary, tied to slot, lost on swap

### Swap Counter System
- Swap counter (from ESSENCE_ACCUMULATION_SYSTEM.md) still applies
- Swap costs gold based on counter
- Boosts add additional cost (lost investment)
- Total cost of swap = swap gold + lost boost value

### Slot Unlock System
- Unlocking slots (from ESSENCE_ACCUMULATION_SYSTEM.md) unchanged
- Once unlocked, can purchase boosts for that slot
- Boost purchases are separate from unlock costs

---

## Implementation Priority

**Phase 1: Core Functionality**
1. Database schema (`essenceSlotBoosts` table)
2. Backend functions (purchase, respec, remove on swap)
3. Calculation integration (add boosts to rate calculations)

**Phase 2: UI Implementation**
4. Upgrade button in slot interface
5. Purchase modal with variation selection
6. Respec button and confirmation
7. Boost indicators/badges on slot display

**Phase 3: Warnings & Safety**
8. Swap warning modal (show boosts that will be lost)
9. Cost preview before purchase
10. Confirmation dialogs for all destructive actions

**Phase 4: Polish & Balancing**
11. Determine tier pricing structure
12. Balance bonus amounts
13. Visual effects for boosted variations
14. Admin configuration panel (if needed)

---

## Notes
- Keep it simple initially: 1-2 tiers max to start
- Can add more tiers later based on player feedback
- Pricing can be adjusted post-launch via admin panel
- Monitor economy impact closely (gold sink effectiveness)

---

*Created: 2025-10-24*
*Last Updated: 2025-10-24*
