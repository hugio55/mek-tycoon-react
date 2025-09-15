# Story Climb Mechanics - Procedural Generation System

## Overview
The Story Climb consists of 10 chapters, each with 400 nodes. When a player connects their wallet, a unique tree is generated that will be different from any other player's tree. The distribution follows a rarity-based system where rarer mechanisms appear in later chapters.

## Chapter Structure
- **Total Chapters**: 10
- **Nodes per Chapter**: 420
- **Total Nodes in Game**: 4,200

### Node Type Breakdown (per chapter)
- **Normal Mek Nodes**: 350
- **Challenger Nodes**: 40 (harder difficulty, better rewards)
- **Event Nodes**: 20 (separate from Mek nodes)
- **Mini-Boss Nodes**: 9
- **Final Boss Node**: 1
- **Total Mek Nodes**: 400
- **Total Nodes (including events)**: 420

## Mechanism Distribution System

### 1. Final Bosses (10 total - 1 per chapter)
**Rarity Ranks**: Top 10 rarest mechanisms (Ranks 1-10)
**Source Keys**: 000-000-000 (rarest) to 999-999-999 (10th rarest)

| Chapter | Mek Rank | Description |
|---------|----------|-------------|
| 1 | 10 | 10th rarest mechanism |
| 2 | 9 | 9th rarest mechanism |
| 3 | 8 | 8th rarest mechanism |
| 4 | 7 | 7th rarest mechanism |
| 5 | 6 | 6th rarest mechanism |
| 6 | 5 | 5th rarest mechanism |
| 7 | 4 | 4th rarest mechanism |
| 8 | 3 | 3rd rarest mechanism |
| 9 | 2 | 2nd rarest mechanism |
| 10 | 1 | Rarest mechanism (000-000-000) |

### 2. Mini-Bosses (90 total - 9 per chapter)
**Rarity Ranks**: Ranks 11-100
**Distribution**: Divided into chunks of 9, with rarer chunks in later chapters
**Placement**: Random within each chapter

| Chapter | Mek Rank Range | Example Ranks |
|---------|----------------|---------------|
| 1 | 92-100 | [100, 99, 98, 97, 96, 95, 94, 93, 92] |
| 2 | 83-91 | [91, 90, 89, 88, 87, 86, 85, 84, 83] |
| 3 | 74-82 | [82, 81, 80, 79, 78, 77, 76, 75, 74] |
| 4 | 65-73 | [73, 72, 71, 70, 69, 68, 67, 66, 65] |
| 5 | 56-64 | [64, 63, 62, 61, 60, 59, 58, 57, 56] |
| 6 | 47-55 | [55, 54, 53, 52, 51, 50, 49, 48, 47] |
| 7 | 38-46 | [46, 45, 44, 43, 42, 41, 40, 39, 38] |
| 8 | 29-37 | [37, 36, 35, 34, 33, 32, 31, 30, 29] |
| 9 | 20-28 | [28, 27, 26, 25, 24, 23, 22, 21, 20] |
| 10 | 11-19 | [19, 18, 17, 16, 15, 14, 13, 12, 11] |

### 3. Event Nodes (200 total - 20 per chapter)
**Special Note**: Events are NOT mechanisms/Meks. They are handled separately.
**Reference**: See http://localhost:3100/event-node-rewards for event configuration
**Placement**: Random within each chapter

### 4. Challenger Nodes (400 total - 40 per chapter)
**Rarity Ranks**: Ranks 101-500
**Distribution**: Divided into chunks of 40, with rarer chunks in later chapters
**Placement**: Random within challenger node slots
**Difficulty**: Higher than normal nodes with better rewards

| Chapter | Mek Rank Range | Count |
|---------|----------------|-------|
| 1 | 461-500 | 40 |
| 2 | 421-460 | 40 |
| 3 | 381-420 | 40 |
| 4 | 341-380 | 40 |
| 5 | 301-340 | 40 |
| 6 | 261-300 | 40 |
| 7 | 221-260 | 40 |
| 8 | 181-220 | 40 |
| 9 | 141-180 | 40 |
| 10 | 101-140 | 40 |

### 5. Normal Mek Nodes (3,500 total - 350 per chapter)
**Rarity Ranks**: Ranks 501-4,000
**Distribution**: Divided into chunks of 350, with rarer chunks in later chapters
**Placement**: Random within normal node slots

| Chapter | Mek Rank Range | Count |
|---------|----------------|-------|
| 1 | 3651-4000 | 350 |
| 2 | 3301-3650 | 350 |
| 3 | 2951-3300 | 350 |
| 4 | 2601-2950 | 350 |
| 5 | 2251-2600 | 350 |
| 6 | 1901-2250 | 350 |
| 7 | 1551-1900 | 350 |
| 8 | 1201-1550 | 350 |
| 9 | 851-1200 | 350 |
| 10 | 501-850 | 350 |

## Procedural Generation Rules

### Key Principles:
1. **Rarity Progression**: Rarer mechanisms appear in later chapters
2. **Random Placement**: Within each chapter, mechanisms are randomly placed among their node type
3. **Unique Trees**: Each player gets a unique arrangement when they connect their wallet
4. **Consistent Groups**: The GROUP of mechanisms per chapter is consistent, only placement varies

### Generation Process:
1. When wallet connects, generate seed from wallet address
2. For each chapter (1-10):
   - Assign the predetermined final boss
   - Select the appropriate rank range for mini-bosses, shuffle positions
   - Select the appropriate rank range for challengers, shuffle positions
   - Select the appropriate rank range for normal meks, shuffle positions
   - Place 20 event nodes randomly
3. Store the generated tree for that player permanently

### Example Distribution (Chapter 5):
```
Final Boss: Rank 6 (1 node)
Mini-Bosses: Ranks 56-64 (9 nodes, randomly placed)
Challengers: Ranks 301-340 (40 nodes, randomly placed)
Normal Meks: Ranks 2251-2600 (350 nodes, randomly placed)
Events: 20 nodes (randomly placed, separate from Mek nodes)
Total Meks: 400 nodes
Total Nodes: 420 nodes
```

## Important Notes
- Total unique mechanisms needed: 4,000 (Ranks 1-4,000)
- Events are separate and don't use mechanism ranks
- The system ensures difficulty progression through chapters
- Each player's tree is deterministic after generation (same wallet = same tree)
- Position within chapter is random, but chapter assignment follows strict rarity rules
- Events add 20 nodes per chapter but don't consume Mek ranks

## Implementation Checklist
- [ ] Create mechanism rarity ranking system (1-3,800)
- [ ] Build wallet-based seed generator
- [ ] Implement chapter distribution algorithm
- [ ] Create node shuffling system per chapter
- [ ] Store generated trees per player
- [ ] Link to event-node-rewards system
- [ ] Add difficulty modifiers for challenger nodes
- [ ] Implement final boss special handling