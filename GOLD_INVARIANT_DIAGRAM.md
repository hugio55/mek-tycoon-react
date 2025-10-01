# Gold Invariant System - Visual Guide

## The Three Gold Values

```
┌─────────────────────────────────────────────────────────────┐
│                     GOLD TRACKING SYSTEM                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  totalCumulativeGold (All-time earnings)            │  │
│  │  - NEVER decreases                                   │  │
│  │  - Tracks every gold earned (no cap)                 │  │
│  │  - Used for leaderboards & statistics                │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ▲                                   │
│                         │                                   │
│                    Increases when                           │
│                    gold is earned                           │
│                         │                                   │
│  ┌──────────────────────┴───────────────────────────────┐  │
│  │  accumulatedGold (Spendable balance)                 │  │
│  │  - Can increase (earning) or decrease (spending)     │  │
│  │  - CAPPED at 50,000                                  │  │
│  │  - What players see as "current gold"                │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                   │
│                         │                                   │
│                    Decreases when                           │
│                    gold is spent                            │
│                         │                                   │
│                         ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  totalGoldSpentOnUpgrades (All-time spending)        │  │
│  │  - NEVER decreases                                   │  │
│  │  - Tracks all gold spent on Mek upgrades             │  │
│  │  - Used for statistics & validation                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## The Invariant Rule

```
┌─────────────────────────────────────────────────────────────┐
│                     INVARIANT RULE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  totalCumulativeGold  ≥  accumulatedGold + totalSpent      │
│                                                             │
│  ┌────────────────┐    ┌──────────────┐   ┌─────────────┐ │
│  │   All-time     │ ≥  │   Current    │ + │  All-time   │ │
│  │   earnings     │    │   balance    │   │  spending   │ │
│  └────────────────┘    └──────────────┘   └─────────────┘ │
│                                                             │
│  This MUST always be true, otherwise data is corrupted!    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Example Scenarios

### Scenario 1: New User (Earning Gold)

```
Time: T0 (User connects wallet, has 2 Meks)
┌─────────────────────────────────────────┐
│ totalCumulativeGold:     0              │ (Uninitialized)
│ accumulatedGold:         0              │
│ totalSpent:              0              │
│ Invariant: 0 ≥ 0 + 0 ✅                 │
└─────────────────────────────────────────┘

Time: T1 (After 10 hours, earned 1000 gold)
┌─────────────────────────────────────────┐
│ totalCumulativeGold:     1000           │ (+1000 earned)
│ accumulatedGold:         1000           │ (+1000 earned)
│ totalSpent:              0              │ (no change)
│ Invariant: 1000 ≥ 1000 + 0 ✅           │
└─────────────────────────────────────────┘

Time: T2 (User spends 200 gold on upgrade)
┌─────────────────────────────────────────┐
│ totalCumulativeGold:     1000           │ (no change)
│ accumulatedGold:         800            │ (-200 spent)
│ totalSpent:              200            │ (+200 spent)
│ Invariant: 1000 ≥ 800 + 200 ✅          │
└─────────────────────────────────────────┘

Time: T3 (Earned another 500 gold)
┌─────────────────────────────────────────┐
│ totalCumulativeGold:     1500           │ (+500 earned)
│ accumulatedGold:         1300           │ (+500 earned)
│ totalSpent:              200            │ (no change)
│ Invariant: 1500 ≥ 1300 + 200 ✅         │
└─────────────────────────────────────────┘
```

### Scenario 2: Gold Cap (50k limit)

```
Time: T0 (User at 48,000 gold)
┌─────────────────────────────────────────┐
│ totalCumulativeGold:     48000          │
│ accumulatedGold:         48000          │ (near cap!)
│ totalSpent:              0              │
│ Invariant: 48000 ≥ 48000 + 0 ✅         │
└─────────────────────────────────────────┘

Time: T1 (Earned 5,000 more gold)
┌─────────────────────────────────────────┐
│ totalCumulativeGold:     53000          │ (+5000, NO CAP!)
│ accumulatedGold:         50000          │ (+2000 capped)
│ totalSpent:              0              │
│ Invariant: 53000 ≥ 50000 + 0 ✅         │
│                                         │
│ Note: 3000 gold "lost" to cap, but      │
│       still tracked in cumulative!      │
└─────────────────────────────────────────┘
```

### Scenario 3: Admin Adding Gold (THE FIX)

```
BEFORE FIX:
Time: T0 (Corrupted state - totalCumulativeGold = 0)
┌─────────────────────────────────────────┐
│ totalCumulativeGold:     0              │ ❌ UNINITIALIZED!
│ accumulatedGold:         10000          │
│ totalSpent:              2000           │
│ Invariant: 0 ≥ 10000 + 2000 ❌ BROKEN!  │
└─────────────────────────────────────────┘

Admin tries to add 5000 gold → ERROR! ❌

AFTER FIX:
Step 1: Auto-initialize totalCumulativeGold
┌─────────────────────────────────────────┐
│ totalCumulativeGold:     12000          │ ✅ Auto-set!
│ accumulatedGold:         10000          │ (unchanged)
│ totalSpent:              2000           │ (unchanged)
│ Invariant: 12000 ≥ 10000 + 2000 ✅      │
└─────────────────────────────────────────┘

Step 2: Add 5000 gold
┌─────────────────────────────────────────┐
│ totalCumulativeGold:     17000          │ (+5000)
│ accumulatedGold:         15000          │ (+5000)
│ totalSpent:              2000           │ (unchanged)
│ Invariant: 17000 ≥ 15000 + 2000 ✅      │
└─────────────────────────────────────────┘

Success! ✅
```

## The Fix Flow Chart

```
┌─────────────────────────────────────────────────────────────┐
│         Admin Calls updateWalletGold(wallet, 15000)         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │ Read current wallet state     │
         └───────────┬───────────────────┘
                     │
                     ▼
         ┌───────────────────────────────┐
         │ Is totalCumulativeGold = 0?   │
         └───────────┬───────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
         YES                   NO
          │                     │
          ▼                     ▼
    ┌─────────────┐      ┌──────────────┐
    │ Initialize  │      │ Use existing │
    │ cumulative  │      │ value        │
    │ = acc+spent │      │              │
    └──────┬──────┘      └──────┬───────┘
           │                    │
           └────────┬───────────┘
                    │
                    ▼
         ┌───────────────────────────────┐
         │ Validate current invariant    │
         └───────────┬───────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
        VALID                INVALID
          │                     │
          │                     ▼
          │           ┌──────────────────┐
          │           │ Force-correct    │
          │           │ cumulative value │
          │           └────────┬─────────┘
          │                    │
          └────────┬───────────┘
                   │
                   ▼
         ┌───────────────────────────────┐
         │ Calculate gold difference     │
         │ newAmount - currentAmount     │
         └───────────┬───────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
      POSITIVE              NEGATIVE
       (ADD)                (REMOVE)
          │                     │
          ▼                     ▼
    ┌──────────────┐    ┌────────────────┐
    │ Use          │    │ Check if       │
    │ calculate    │    │ removal would  │
    │ GoldIncrease │    │ break invariant│
    └──────┬───────┘    └────────┬───────┘
           │                     │
           │              ┌──────┴──────┐
           │              │             │
           │            SAFE        UNSAFE
           │              │             │
           │              ▼             ▼
           │       ┌────────────┐  ┌─────────┐
           │       │ Allow      │  │ Reject  │
           │       │ removal    │  │ with    │
           │       │            │  │ error   │
           │       └──────┬─────┘  └─────────┘
           │              │
           └──────┬───────┘
                  │
                  ▼
         ┌───────────────────────────────┐
         │ Update database with new      │
         │ accumulatedGold and           │
         │ totalCumulativeGold values    │
         └───────────┬───────────────────┘
                     │
                     ▼
         ┌───────────────────────────────┐
         │ Return success message        │
         └───────────────────────────────┘
```

## Key Insights

1. **Cumulative tracks ALL earnings** - even gold lost to the 50k cap
2. **Invariant ensures data integrity** - prevents corruption
3. **The fix auto-repairs** - no manual intervention needed
4. **Safe operations** - rejects changes that would break the system
5. **Defensive logging** - helps diagnose issues if they occur

## Common Questions

**Q: Why does totalCumulativeGold keep growing past 50k?**
A: It tracks all-time earnings for leaderboards and statistics. Only accumulatedGold is capped at 50k.

**Q: What happens if I spend 1000 gold?**
A: accumulatedGold decreases by 1000, totalSpent increases by 1000, cumulative stays the same.

**Q: Can I manually set gold to any value?**
A: Yes, but the system will reject it if it would violate the invariant (e.g., setting gold below what's already been spent).

**Q: How do I fix broken records?**
A: Use the `fixAllBrokenInvariants` mutation with `dryRun: true` to preview, then `dryRun: false` to apply.
