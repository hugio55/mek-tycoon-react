# SLOTS - Complete Job Slot System

**Purpose:** Master documentation for Mek job slots, income system, progression, and buffs.
**Status:** Design Complete
**Last Updated:** 2025-12-03

---

## System Overview

Meks are assigned to job slots where they earn gold and progress through levels. The system has three core layers:

1. **Daily Income** - Base gold + Attaboy bonus (RNG daily roll)
2. **Progression** - Tenure-based leveling with pit stop buff rewards
3. **Job Availability** - Determined by Mek variation + rank

---

## Part 1: Daily Income (Attaboy System)

### How Jobs Pay

Each job displays two income values:

```
ENGINEER
75 gold/day (guaranteed)
Attaboy: 10-50 (bonus range)
```

- **Base Gold**: Always received, fixed amount
- **Attaboy Range**: Daily bonus determined by RNG roll
- **Total Range**: Base + Attaboy (e.g., 85-125 gold/day)

### Attaboy Daily Roll

Every day, each employed Mek rolls within their job's Attaboy range.

**Distribution**: Bell curve (normal distribution)
- Most results cluster in the middle
- Rolling near ceiling = rare, exciting day
- Rolling near floor = unlucky, but still got something

**Job Personality via Ranges**:
- Narrow range (10-20): Stable, predictable
- Wide range (5-60): High variance, boom or bust

---

### Bias System

Two stats affect where you land in the Attaboy range:

| Stat | Where It Lives | Description |
|------|----------------|-------------|
| **Unit Bias** | Each Mek | Individual performance modifier |
| **Corp Bias** | Player profile | Average of all employed Meks' Unit Bias |

**Corp Bias = Average Unit Bias of all employed Meks**

### How Corp Bias Affects Rolls

| Corp Bias | Effect | On 10-50 Range |
|-----------|--------|----------------|
| Low (20) | Skewed toward floor | Expect ~15-25 |
| Medium (50) | Centered | Expect ~25-35 |
| High (80) | Skewed toward ceiling | Expect ~35-45 |

### Natural Collection Balance

The averaging system creates automatic balance:

**Large Collection (200 Meks)**:
- Hard to max Unit Bias on all
- Corp Bias gets diluted
- Wins on VOLUME (more jobs)
- Loses on QUALITY (lower Attaboy per job)

**Small Collection (2-3 Meks)**:
- Can push Unit Bias to ceiling
- Corp Bias stays high
- Fewer jobs running
- Excellent Attaboy performance

**No workforce bonuses needed** - averaging IS the balance mechanism.

---

## Part 2: Job Availability

### Hybrid System (Variation + Rank)

Each Mek gets 2-3 available jobs:

**2 Thematic Jobs** - Based on head variation category:
- Camera heads: Journalist, Photographer, Documentarian
- Industrial heads: Mechanic, Laborer, Technician
- Military heads: Guard, Strategist, Commander
- Musical heads: Performer, Composer, Entertainer

**1 Military Rank Job** - Based on overall Mek rank (1-4000):
- All 4000 Meks divided into 10 military tiers
- Lower rank number = higher military tier
- Rank 1-400 = Elite tier, Rank 3600-4000 = Recruit tier

### Job Tiers Within Categories

Within each job category, variations split into difficulty tiers:

| Tier | Variation Rarity | Pit Stops/Level | Pay Rate |
|------|------------------|-----------------|----------|
| Beginner | Common | 3-4 | Low |
| Intermediate | Uncommon | 5-6 | Medium |
| Advanced | Rare | 8-10 | High |

---

## Part 3: Synergy System

Mek variations can have synergy with certain jobs, granting bonuses.

### Synergy Bonus Types

**Option A: Range Boost**
- Shifts Attaboy range upward
- Example: Bumblebee head on Pollinator job
  - Base: 10-50 → With synergy: 20-60

**Option B: Flat Bonus**
- Adds flat gold/day
- Job pays 75 → pays 80 with synergy

**Option C: Double Roll**
- Roll Attaboy TWICE, keep higher result
- More exciting without breaking math

**Option D: Unit Bias Boost**
- +20 to Unit Bias for this job only
- Doesn't affect Corp Bias calculation

**Recommended**: Start with Double Roll (simple, exciting) or Flat Bonus (easy to understand).

---

## Part 4: Tenure & Progression

### Tenure System

**Status**: Backend fully implemented and working

**Core Mechanic**:
- Meks accumulate "tenure" while slotted (1 tenure/second)
- When tenure reaches threshold, player clicks "Level Up"
- 10 levels per job
- Tenure persists when Mek is unslotted

**Critical Features** (all verified working):
- Offline accumulation (timestamp-based, like gold)
- Per-Mek tracking (independent progress)
- Persistence when unslotted (tenure freezes, doesn't reset)
- Resume on re-slot (continues from saved value)

### Calculation Formula

```
effectiveRate = baseRate x (1 + globalBuffs + perMekBuffs)
currentTenure = savedTenure + (elapsedSeconds x effectiveRate)
```

---

## Part 5: Job Switching Rules

### Tenure is Tied to: Mek + Job Type

Mek #42 as Janitor has separate progress from Mek #42 as Engineer.

### Mid-Level Switching (Has Penalty)

- Halfway through Level 2->3 with 500/1000 tenure
- Switch jobs -> **Tenure resets to 0** for new job
- Lost tenure is permanent
- **UX**: Large warning modal before confirming

### Post-Level Switching (No Penalty)

- Complete Level 1->2, click "Level Up"
- Now at Level 2, can choose new job
- Start new job at Level 2 from 0 tenure
- Previous job progress saved (can return later)

### Unslotting (No Penalty)

- Mek working Janitor Level 2->3 with 500/1000 tenure
- Player unslots Mek
- **Tenure freezes at 500** (not lost)
- **Job type remembered** (Janitor)
- When re-slotting -> Automatically slots as Janitor, resumes at 500

---

## Part 6: Pit Stop Buff System

### How Pit Stops Work

- Pit stops occur at tenure milestones (configurable per job tier)
- Example thresholds: 100, 250, 500, 1000, 2000 tenure
- When reached -> Button flashes above progress bar
- Player clicks -> Modal shows 3 random buff options
- Player picks 1 -> **Permanently applied to Mek** (tied to Mek, NOT job/slot)

### Buff Types

| Type | Effect | Permanent? |
|------|--------|------------|
| Gold/Hour | Increases gold mining rate | Yes |
| Essence/Day | Increases essence generation | Yes |
| Flat Gold | One-time gold bonus | No (consumed) |
| Flat Essence | One-time essence bonus | No (consumed) |

### Buff Quality Scaling

Buff values scale based on:
1. **Job Tier** (D -> S tier)
2. **Level Range** (1-3, 4-6, 7-10)

Higher tier jobs and higher levels = better buff ranges.

### RNG Distribution

Buff values follow bell curve within configured range:
- Min/Max define hard boundaries
- Mean defines center of distribution
- Standard deviation controls spread
- Most common = middle values, extremes are rare

---

## Part 7: Prestige System

### How Prestige Works

- Reach Level 10 in a job
- Can choose to "Prestige" -> Reset to Level 1
- **Lose all permanent buffs** from that job
- Gain prestige reward (TBD: tokens, unlocks, account buffs)
- Tenure resets to 0

### Buff History

- Mek profile has "View Buff History" button
- Shows grid of circles (chronological order)
- Each circle = one pit stop buff selection
- Click circle -> Shows buff details:
  - Buff value
  - Job type it was earned from
  - Level and pit stop number
  - Timestamp

---

## Part 8: Multi-Job Progression

One Mek can work multiple job types over time:

```
Mek #42 Career History:
- Janitor: Level 5, 300/1000 tenure
- Engineer: Level 2, 700/1000 tenure
- Artist: Level 1, 0/1000 tenure (just started)
```

**Only ONE job active at a time** (the one currently slotted).

---

## Display Formats

### Job Listing
```
ENGINEER
75 gold/day
Attaboy: 10-50
```

### Mek Card
```
TITAN-X
Unit Bias: 45
```

### Player Profile
```
CORP BIAS: 52
(Averaged from 18 employed Meks)

Highest: Titan-X (72 Unit Bias)
Lowest: Rusty (18 Unit Bias)
```

### Daily Results Example
```
DAILY ATTABOY RESULTS

Mek #1234 -> ENGINEER
  Base: 75 gold
  Attaboy Range: 10-50
  Your Corp Bias: 58
  Today's Roll: 41
  Daily Income: 116 gold

Mek #5678 -> MINER (Synergy!)
  Base: 50 gold
  Attaboy Range: 15-40 (boosted)
  Today's Roll: 38 (Double Roll!)
  Daily Income: 88 gold

Total: 204 gold
```

---

## Open Questions

1. **Unit Bias Scale**: What range? 1-100? 1-20?
2. **Starting Unit Bias**: Random? Based on rarity?
3. **Improving Unit Bias**: Leveling? Pit stops? Gold cost?
4. **Synergy Mapping**: Which variations match which jobs?
5. **Synergy Rarity**: Common or rare special bonuses?
6. **Prestige Rewards**: Tokens? Unlocks? Account buffs?
7. **Buff Stacking**: Unlimited? Diminishing returns?
8. **Slot Unlocking Cost**: Gold? Prestige requirement?

---

## Implementation Priority

### Phase 1: Core Income System
1. Job listings with base gold + Attaboy range
2. Daily roll calculation with bell curve
3. Unit Bias field on Meks
4. Corp Bias calculation
5. Display daily Attaboy results

### Phase 2: Job Availability
6. Define variation -> job category mapping
7. Implement military rank tiers
8. Job selection UI (2-3 options per Mek)

### Phase 3: Progression Integration
9. Connect tenure system to job slots
10. Pit stop milestone triggers
11. Buff selection modal (pick 1 of 3)
12. Buff history timeline

### Phase 4: Synergies & Polish
13. Implement synergy detection
14. Add synergy bonuses
15. Prestige system
16. Balance tuning

---

## Technical Notes

### Database Tables (Summary)

- `jobTypes` - Job definitions (tier, pit stop count, unlock requirements)
- `playerJobSlots` - Which jobs player has in which slots
- `mekJobProgression` - Per-Mek, per-job level/tenure progress
- `jobPitStops` - Pit stop positions per job type
- `buffTypes` - Buff definitions
- `buffRangeConfigs` - Buff value ranges per tier/level
- `pitStopBuffSelections` - Complete buff selection history
- `mekActiveBuffs` - Currently active buffs per Mek

### Key Backend Endpoints

- `getMekJobProgression(mekId, jobKey)` - Real-time tenure/level
- `getPitStopBuffChoices(mekId, jobKey, pitStop)` - Generate 3 buff options
- `selectPitStopBuff(mekId, jobKey, pitStop, buffIndex)` - Apply selected buff
- `getActiveMekBuffs(mekId)` - All active buffs for a Mek

---

## Summary Table

| Component | Description |
|-----------|-------------|
| Base Gold | Guaranteed daily income per job |
| Attaboy | Daily bonus (RNG roll within range) |
| Unit Bias | Individual Mek stat |
| Corp Bias | Player average of employed Meks' Unit Bias |
| Tenure | Time-based progression (1/second) |
| Pit Stop | Buff milestone during progression |
| Synergy | Bonus when Mek variation matches job |
| Prestige | Reset level, lose buffs, gain reward |

**Core Loop**: Employ Meks -> Earn base + Attaboy -> Level up via tenure -> Choose pit stop buffs -> Prestige for rewards -> Repeat

---

*This document consolidates all job slot system design decisions.*
