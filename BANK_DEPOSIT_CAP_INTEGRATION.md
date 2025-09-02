# Bank Deposit Cap Integration

## Overview
The bank deposit cap system limits daily gold deposits to prevent economic imbalance while providing progression through buffs.

## Current Implementation

### Base System
- **Base Daily Cap**: 500 gold per day
- **Reset Time**: Midnight local time
- **Location**: `convex/bank.ts`

### Buff System
- **Buff Type**: `bank_deposit_cap`
- **Buff Name**: "Bank Deposit Daily Gold Cap Increase"
- **Value**: 10% increase per stack
- **Max Stacks**: 10 (up to 100% total increase)
- **Rarity**: Uncommon

### Mek Talent Tree Integration
The Gold Path Build template includes 5 bank deposit cap nodes:
1. **Bank Deposit Increase I** (Tier 1) - 10% increase, 50 XP
2. **Bank Deposit Increase II** (Tier 2) - 10% increase, 100 XP
3. **Bank Deposit Increase III** (Tier 3) - 10% increase, 150 XP
4. **Bank Deposit Increase IV** (Tier 3) - 10% increase, 150 XP
5. **Bank Deposit Master** (Tier 4) - 10% increase, 250 XP

Total possible increase from talent tree: 50% (750 gold daily cap)

## Future Integration Points

### 1. Scrapyard Rewards
The scrapyard can grant temporary or permanent bank deposit cap buffs as rewards:

```typescript
// Example scrapyard reward structure
const scrapyardRewards = {
  common: [
    { type: "buff", buffType: "bank_deposit_cap", value: 10, duration: 86400000 } // 24 hours
  ],
  rare: [
    { type: "buff", buffType: "bank_deposit_cap", value: 20, duration: 172800000 } // 48 hours
  ],
  legendary: [
    { type: "buff", buffType: "bank_deposit_cap", value: 10, permanent: true }
  ]
};
```

### 2. Circuitree Integration
The Circuitree (circuit/tech tree) can include bank deposit cap increases as rewards for completing circuits or reaching milestones:

```typescript
// Example circuitree node
{
  id: "banking-circuit-1",
  name: "Financial Systems I",
  reward: {
    type: "buff",
    buffType: "bank_deposit_cap",
    value: 15, // 15% increase
    source: "circuitree",
    permanent: true
  }
}
```

### 3. Achievement/Milestone Rewards
Consider adding bank deposit cap increases for:
- Total gold deposited milestones (10k, 100k, 1M)
- Bank account age (7 days, 30 days, 90 days)
- Interest earned milestones

### 4. Premium/VIP Features
- VIP tiers could include permanent bank deposit cap increases
- Special events could temporarily boost caps for all players

## Implementation Notes

### Buff Stacking
- Buffs from different sources stack additively
- Each source can be tracked separately via `source` and `sourceId` fields
- Temporary and permanent buffs work together

### Cap Calculation Formula
```
Daily Cap = Base Cap × (1 + Percentage Buffs / 100) + Flat Buffs
```

### Database Schema
The system uses existing tables:
- `bankAccounts`: Stores user bank data
- `bankTransactions`: Tracks all deposits/withdrawals
- `buffTypes`: Defines available buffs
- `activeBuffs`: Tracks user's active buffs
- `mekTalentTrees`: Stores talent tree progression

## Testing Checklist
- [ ] Base 500 gold cap enforced
- [ ] Daily reset at midnight works correctly
- [ ] Mek talent tree nodes grant buffs correctly
- [ ] Buffs stack properly from multiple sources
- [ ] Tree reset removes associated buffs
- [ ] Error messages display correct remaining capacity
- [ ] `getAccountStats` shows correct cap information

## Future Enhancements
1. **Dynamic Base Cap**: Adjust base cap based on player level
2. **Temporal Bonuses**: Weekend or holiday increased caps
3. **Guild Bonuses**: Guild perks that increase member caps
4. **Compound Interest**: Higher caps for maintaining high balances
5. **Withdrawal Penalties**: Reduced cap after large withdrawals