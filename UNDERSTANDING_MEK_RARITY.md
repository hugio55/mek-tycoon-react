# Understanding Mek Rarity: The Complete Picture

## The Core Problem

You were seeing "Ace of Spades" appear 29 times in Chapter 1 because your system was **randomly distributing variations** without understanding the actual rarity structure. Here's what's really happening:

## The Two-Layer System

### Layer 1: Groups (from mekGoldRates.json)
The 4,000 meks are categorized by **group names**, not individual variations:
- **Rolleiflex** (appears 1,128 times total)
- **Polaroid** (appears 692 times)
- **Wren** (appears ONLY ONCE at rank #1)

### Layer 2: Variations (from variations.ts)
Each group contains multiple variations:
- **Rolleiflex group** → contains 22 variations like "Hacker", "Boss", "Milk", etc.
- **Wren group** → maps to "Ace of Spades Ultimate" (the rarest!)

## The Real Distribution

### Chapter 1 (Ranks 3651-4000) - The Commons
```
Most frequent:
- Rolleiflex heads: 174 appearances
- Droid bodies: 131 appearances
- None/Nil/Null items: 250 appearances
```

### Chapter 10 (Ranks 1-100) - The Legendaries
```
Ultra-rare (1 appearance each):
- Wren (→ Ace of Spades Ultimate)
- Tux Ultimate
- Stolen
- Wings Ultimate
```

## Why Your Current System Is Wrong

1. **No Group Awareness**: You're picking from all 102 head variations equally, when you should be picking from specific groups based on rank
2. **No Frequency Respect**: "Ace of Spades Ultimate" is in the Wren group which appears ONCE, not 29 times
3. **Missing Mappings**: Many groups in mekGoldRates.json don't have variation mappings defined

## The Correct Flow

```
Rank → Chapter → Group Distribution → Variation Selection
```

Example for Rank 3700 (Chapter 1):
1. Determine chapter: Chapter 1
2. Pick groups based on weights: Likely Rolleiflex (50% chance), Polaroid (18%), Accordion (17%)
3. If Rolleiflex selected, pick one of its 22 variations randomly
4. Result: A common variation from a common group

Example for Rank 1 (Chapter 10):
1. Determine chapter: Chapter 10
2. Pick groups: Wren (only appears here!)
3. Map Wren → "Ace of Spades Ultimate"
4. Result: The single rarest variation in the game

## The Files Involved

1. **convex/mekGoldRates.json** - The authoritative source of 4,000 meks with their group assignments and ranks
2. **src/app/crafting/constants/variationTrees.ts** - Maps SOME groups to their variations (incomplete)
3. **src/app/scrap-yard/story-climb/mek-rarity-mapping.ts** - NEW file with proper distribution logic
4. **least-rare-mechanisms.ts** - Webp filenames for ranks 3601-4000

## Key Insights

- **"Ace of Spades Ultimate"** is the Wren head, appearing ONLY at rank #1
- **Rolleiflex and Polaroid** dominate the common ranks (3651-4000)
- **Ultimate variations** only appear in the top 100 ranks
- **Group rarity cascades to variations** - if a group is rare, ALL its variations are rare

## What Needs to Be Fixed

1. **Stop random variation selection** - Use group-based selection
2. **Implement proper weighting** - Common groups in Chapter 1, rare groups in Chapter 10
3. **Complete the mappings** - Many groups don't have variation assignments
4. **Respect the data** - The 4,000 meks in mekGoldRates.json are the truth

## The Bottom Line

Your story climb should show:
- **Chapter 1**: Mostly Rolleiflex, Polaroid, Accordion heads with Droid, Knight bodies
- **Chapter 10**: Ultimate variations, Wren, special one-offs
- **NEVER**: "Ace of Spades Ultimate" appearing multiple times (it's rank #1 only!)

The rarity isn't about the variations themselves, it's about the **groups** they belong to and how often those groups appear in the 4,000 mek dataset.