# Job Slots & Attaboy System

**Purpose:** Comprehensive documentation for the job slot income system, Attaboy daily bonus mechanic, and Corp/Unit Bias integration.

**Status:** Design Complete, Implementation Pending
**Created:** 2025-12-03
**Last Updated:** 2025-12-03

---

## System Overview

Meks are assigned to job slots where they earn gold. Each job has:
1. **Base gold/day** - Guaranteed daily income
2. **Attaboy range** - Daily bonus potential (RNG roll)

The player's **Corp Bias** (derived from their Meks) determines where they land in the Attaboy range each day.

---

## Core Concepts

### Job Listings

Each job displays two values:

```
ENGINEER
75 gold/day
Attaboy: 10-50
```

**What the player understands:**
- Guaranteed: 75 gold/day (always received)
- Bonus potential: 10-50 extra gold/day (based on daily roll)
- Total range: 85-125 gold/day

Jobs have personality through their Attaboy ranges:
- Narrow range (10-20): Stable, predictable
- Wide range (5-60): High variance, boom or bust

---

### Attaboy Daily Roll

Every day, each employed Mek rolls within their job's Attaboy range.

**Distribution:** Bell curve (normal distribution)
- Most results cluster in the middle
- Rolling near ceiling = rare, exciting day
- Rolling near floor = unlucky, but still got something

**Player experience:**
- Daily login shows Attaboy results
- Hitting high numbers feels rewarding
- Every day has something to check

---

### Bias System (Two Levels)

| Stat | Where It Lives | Name |
|------|----------------|------|
| Individual Mek stat | Each Mek | **Unit Bias** |
| Global player stat | Player profile | **Corp Bias** |

**Corp Bias = Average of all employed Meks' Unit Bias**

---

### How Corp Bias Affects Rolls

Corp Bias shifts WHERE you land on the Attaboy bell curve:

**Low Corp Bias (e.g., 20):**
- Distribution skewed toward floor
- Typically lands in lower third of range
- On a 10-50 range, expect ~15-25 most days

**Medium Corp Bias (e.g., 50):**
- Distribution centered
- Lands around middle of range
- On a 10-50 range, expect ~25-35 most days

**High Corp Bias (e.g., 80):**
- Distribution skewed toward ceiling
- Typically lands in upper third of range
- On a 10-50 range, expect ~35-45 most days

---

## Natural Balance (No Workforce Bonuses)

The averaging system creates automatic balance between large and small collections:

**Large Collection (200 Meks):**
- Resources spread thin across many Meks
- Hard to max out Unit Bias on all
- Corp Bias gets diluted (lower average)
- Wins on VOLUME (more jobs running)
- Loses on QUALITY (lower Attaboy performance per job)

**Small Collection (2-3 Meks):**
- All resources focused on few Meks
- Can push Unit Bias to ceiling on each
- Corp Bias stays high
- Fewer jobs running
- But excellent Attaboy performance on each

**Key insight:** This compression happens naturally through averaging. No artificial bonuses needed.

**Why no workforce bonuses:**
- Would widen wealth gap (rich get richer)
- Players with 2-3 Meks would get almost nothing
- The averaging penalty on large collections IS the balance mechanism

---

## Synergy System (Mek Variation + Job)

Certain Mek variations have synergy with certain jobs. When a Mek with a matching variation works a synergized job, they receive a bonus.

### Synergy Bonus Options

**Option A: Attaboy Range Boost**
- Matching variation shifts the Attaboy range upward
- Example: Bumblebee head on Pollinator job
  - Base range: 10-50
  - With synergy: 20-60 (+10 to floor and ceiling)
- Job listing could show: "Attaboy: 10-50 (20-60 with Bumblebee)"

**Option B: Flat Gold Bonus**
- Matching variation adds flat gold/day
- Example: +5 gold/day on top of base
- Simple, easy to understand
- Job pays 75 → pays 80 with synergy

**Option C: Double Roll (Take Best)**
- Matching Mek rolls Attaboy TWICE
- Keeps the higher result
- More exciting without breaking math
- Creates moments of "which roll was better?"

**Option D: Unit Bias Boost (Job-Specific)**
- Matching variation adds +20 to Unit Bias for THIS job only
- Doesn't affect Corp Bias calculation
- Just improves performance on the synergized job
- Example: Mek has 40 Unit Bias, but performs as 60 on this job

**Option E: Job Tier Unlock**
- Matching variation unlocks a better version of the job
- Base: Engineer (75/day, Attaboy 10-50)
- With Synergy: Senior Engineer (90/day, Attaboy 15-60)
- Separate job tier with better stats

---

### Recommended Synergy Approaches

**For simplicity:** Option B (Flat Bonus) or Option C (Double Roll)
- Easy to understand
- Clear value proposition
- Doesn't complicate the core system

**For depth:** Option A (Range Boost) + Option C (Double Roll)
- Some synergies boost your range
- Some synergies give you double roll chance
- Different synergy types for different job categories

---

## Example Daily Flow

```
DAILY ATTABOY RESULTS
=====================

Mek #1234 → ENGINEER
  Base: 75 gold
  Attaboy Range: 10-50
  Your Corp Bias: 58 (upper-middle performance)
  Today's Roll: 41
  Daily Income: 75 + 41 = 116 gold

Mek #5678 → MINER (Synergy: Bumblebee Head!)
  Base: 50 gold
  Attaboy Range: 15-40 (boosted from 10-35)
  Today's Roll: 38 (Double Roll! Kept 38, discarded 22)
  Daily Income: 50 + 38 = 88 gold

Total Daily Income: 204 gold
```

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

### Synergy Indicator (on job assignment)
```
MINER - Synergy Match!
Bumblebee Head detected
Bonus: +10 to Attaboy range
```

---

## Unit Bias Progression

**How players improve Unit Bias on individual Meks:**
- TBD: Could be through leveling, pit stops, essence investment
- Higher Unit Bias = that Mek contributes more to Corp Bias average
- Creates incentive to invest in specific Meks

**Strategic decisions:**
- Invest heavily in few Meks (high Corp Bias, fewer jobs)
- Spread investment across many (lower Corp Bias, more jobs)
- Focus on Meks with job synergies

---

## Relationship to Other Systems

### Pit Stop Buffs (from JOB_SLOT_SYSTEM_ARCHITECTURE.md)
- Pit stops grant buffs at progression milestones
- Attaboy/Corp Bias is the daily income layer
- Pit stop buffs could include Unit Bias increases

### Tenure System (from CUSTOM_SLOTS_SYSTEM.md)
- Tenure tracks time spent in job (1/second accumulation)
- Attaboy is the daily gold outcome
- Tenure drives progression, Attaboy drives income

### Job Availability (from CUSTOM_SLOTS_SYSTEM.md)
- Meks have 2-3 available job types based on variation + rank
- Synergies add another layer: which job MATCHES your Mek?
- Could have available jobs AND synergy jobs be different

---

## Open Questions

1. **Unit Bias Scale:** What range? 1-100? 1-20?
2. **Starting Unit Bias:** What do new Meks start with? Random? Based on rarity?
3. **Improving Unit Bias:** How do players increase it? Leveling? Pit stops? Gold cost?
4. **Synergy Definition:** Which variations match which jobs? (Needs variation → job mapping)
5. **Synergy Rarity:** Are synergies common or rare special bonuses?
6. **Multiple Synergies:** Can a Mek have synergy on multiple jobs?

---

## Implementation Priority

**Phase 1: Core System**
1. Job listings with base gold + Attaboy range
2. Daily roll calculation with bell curve
3. Unit Bias field on Meks
4. Corp Bias calculation (average of employed Meks)
5. Corp Bias affects roll position in range

**Phase 2: Display & UX**
6. Daily Attaboy results display
7. Corp Bias on player profile
8. Unit Bias on Mek cards
9. Job assignment UI showing potential earnings

**Phase 3: Synergies**
10. Define variation → job synergy mapping
11. Implement synergy detection
12. Add synergy bonuses (start with flat bonus or double roll)
13. Synergy indicators in UI

**Phase 4: Progression**
14. Unit Bias improvement mechanics
15. Integration with pit stop system
16. Balance tuning based on player data

---

## Summary

| Component | Description |
|-----------|-------------|
| **Job Base Gold** | Guaranteed daily income per job |
| **Attaboy Range** | Daily bonus potential (RNG roll) |
| **Unit Bias** | Individual Mek stat affecting performance |
| **Corp Bias** | Player's average of all employed Meks' Unit Bias |
| **Synergy** | Bonus when Mek variation matches job type |

**Core loop:** Employ Meks → Earn base gold + Attaboy → Improve Unit Bias → Raise Corp Bias → Better Attaboy rolls → More gold

---

*This document consolidates all job slot income, Attaboy, and bias system design decisions.*
