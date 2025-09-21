# Mek Data Overlap Analysis

## Summary
You're absolutely right - there are MULTIPLE overlapping sources of mek data and rarity information. Here's a comprehensive breakdown:

## JSON Files (4 major files with mek data)

### 1. **mekRarityMaster.json** (608 KB, 32K lines)
- Contains: All 4,000 meks with rank, assetId, sourceKey, head, body, trait
- Purpose: Clean, simple rarity reference
- Used by: importFullMekCollection.ts (what we just used)

### 2. **allMeksData.json** (3.4 MB, 132K lines)
- Contains: Extended mek data including owner, metadata, full NFT details
- Purpose: Complete NFT data import
- Much larger than needed for just rarity

### 3. **meksImportData.json** (3.4 MB, 132K lines)
- Contains: Appears to be duplicate of allMeksData.json
- Purpose: Possibly backup or alternative import source
- Exact same size as allMeksData.json

### 4. **mekGoldRates.json** (1.3 MB, 52K lines)
- Contains: Gold earning rates for each mek
- Purpose: Economic balancing data
- Different purpose but still duplicates basic mek info

## Database Tables (Multiple overlapping tables)

### Core Mek Tables:
1. **meks** (line 6) - Main Mek NFT collection
   - Full NFT data, game stats, battle data
   - Most comprehensive but focused on owned meks

2. **mekCollection** (line 1203) - NEW table we just created
   - All 4,000 meks with rank, assetId, sourceKey, head, body, trait
   - Purpose: Full collection reference

3. **variationsReference** (line 287)
   - Maps variations to unique IDs
   - Different purpose - for individual variations, not full meks

4. **mechanismTiers** (line 1074)
   - Divides 4,000 mechanisms into 10 tiers
   - Another way of organizing the same 4,000 meks

### Rarity/Attribute Tables:
1. **attributeRarity** (line 1182)
   - Singleton document with counts for all heads, bodies, traits
   - Calculated from mekCollection
   - Purpose: Essence drop calculations

2. **normalMekRewardConfigs** (line 928)
   - Reward configuration for meks
   - Another place storing mek-related data

## The Problem:
- **mekRarityMaster.json** has the clean data we need
- **allMeksData.json** and **meksImportData.json** are huge duplicates (3.4MB each!)
- Multiple database tables store overlapping information
- No clear single source of truth

## Recommendations:

### Keep These:
1. **mekRarityMaster.json** - Clean, minimal, perfect for imports
2. **mekCollection** table - Database version of full collection
3. **attributeRarity** table - Calculated rarity data
4. **meks** table - For actual owned/active meks

### Consider Removing/Consolidating:
1. **allMeksData.json** & **meksImportData.json** - 6.8MB of duplicate data!
2. **mekGoldRates.json** - Could be calculated or stored differently

### Why This Happened:
- Different features needed mek data in different formats
- Multiple developers/iterations created their own sources
- No centralized data architecture plan
- Import scripts created their own copies

## Current Working System:
The system we just built works well because:
- Uses the cleanest source (mekRarityMaster.json)
- Stores in dedicated table (mekCollection)
- Calculates rarity dynamically (attributeRarity)
- Clear separation of concerns

But yes, you're right - there's definitely too much duplication!