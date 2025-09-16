# Mek Rarity Distribution Analysis

## Critical Discovery: The Two-Tier System

The game has a **two-tier naming system** that explains why your distribution is wrong:

### Tier 1: Group Names (from mekGoldRates.json)
These are the **category names** used in the actual 4,000 mek database:
- **Head Groups**: Polaroid, Rolleiflex, Accordion, Security, Turret, 35mm, etc.
- **Body Groups**: Droid, Robot, Knight, Beast, She, Skeleton, etc.
- **Item Groups**: Wings, Cannon, Stolen, None, Mini Me, etc.

### Tier 2: Variation Names (from variations.ts)
These are the **specific style names** within each group:
- **Polaroid group** contains: Snapshot, Cream, Milk, 1960's, Classic, Ornament, Neon Flamingo, Acrylic, Plastik
- **Droid group** would contain specific droid variations
- **Wings group** contains: Wings, Wings Ultimate, Firebird, Phoenix, Peacock, etc.

## The Actual Rarity Distribution

### Ultra Rare (Ranks 1-10 - Chapter 10)
These appear ONLY ONCE in the entire game:
- **Heads**: Wren, Steam Turret Ultimate, Polaroid Ultimate, Rolliflex Ultimate, etc.
- **Bodies**: Tux Ultimate, Master Hand Ultimate, Beast Ultimate, She Ultimate, etc.
- **Items**: Stolen, Cannon Ultimate, Ultimate Weaponry, Wings Ultimate, etc.

### Most Common (Ranks 3651-4000 - Chapter 1)
These appear hundreds of times:
- **Heads**: Rolleiflex (1,128 total, 174 in Chapter 1), Polaroid (692 total, 64 in Chapter 1)
- **Bodies**: Droid (890 total, 131 in Chapter 1), Knight (528 total, 93 in Chapter 1)
- **Items**: None, Nil, Null (the "empty" items)

## The Problem with Current Implementation

Your current system is **randomly assigning variations** without respecting the actual rarity data. This means:
- "Ace of Spades Ultimate" could appear 29 times in Chapter 1 (WRONG!)
- Common variations like basic Rolleiflex styles appear rarely (WRONG!)
- No correlation between group rarity and variation assignment

## The Missing Piece

**variationTrees.ts only maps 11 head groups, 5 body groups, and 4 item groups** out of the 22/22/25 that exist in mekGoldRates.json!

### Mapped Head Groups:
- Accordion ✓
- Rolleiflex ✓
- Turret ✓
- Polaroid ✓
- Security ✓
- 35mm ✓
- Flashbulb ✓
- 8mm ✓
- Reels ✓
- Projector ✓

### Missing Head Groups:
- Wren
- Steam Turret Ultimate
- Polaroid Ultimate
- Rolliflex Ultimate
- Accordion Ultimate
- Hollow Accordion
- Laser
- Skull
- Skull Ultimate
- Turret Ultimate
- Security Ultimate
- Reels Ultimate

### Mapped Body Groups:
- Cartoon ✓
- Irons ✓
- Luxury ✓
- Stone ✓
- Bob Ross ✓

### Missing Body Groups (17!):
- Droid, Robot, Knight, Beast, She, Skeleton, Statue, Tux, Master Hand, Head, Hoodie, Whorse
- Plus all their Ultimate versions

## The Correct Implementation

To properly show rarity:

1. **Use the group names from mekGoldRates.json** to determine what appears at each rank
2. **Map those groups to variations** using variationTrees.ts (where available)
3. **For unmapped groups**, either:
   - Create the missing mappings
   - Use the group name directly as a single variation
   - Find the actual variation data from another source

4. **Respect the frequency distribution**:
   - Rank 1-100: Show only Ultimate/special groups
   - Rank 3651-4000: Show only common groups (Rolleiflex, Polaroid, Droid, Knight)

## Chapter Distribution

Based on the actual data:

### Chapter 1 (Ranks 3651-4000)
- **Dominated by**: Rolleiflex heads (174), Droid bodies (131), None/Nil/Null items
- **Should show**: Basic, common variations from these groups

### Chapter 10 (Ranks 1-100)
- **Contains**: Ultimate variations, Wren, special one-off items
- **Should show**: The rarest, most unique variations

## The Source Key Mystery

The `source_key` field (like "AA1-BI1-NM1-B") appears to be an encoded reference to the actual variations, but we need to decode this mapping to understand which specific variation each mek has.

## Conclusion

Your story climb is showing the wrong distribution because:
1. You're not using the actual group rarity data from mekGoldRates.json
2. You're randomly assigning variations instead of mapping them to groups
3. Many groups don't have variation mappings defined
4. The rarity should cascade from group → style → variation, not be randomly distributed