# Event Data Pipeline Fix - Summary

## Problem
Event nodes in Story Climb (like `ch1_node_1757450991650_3g9r9g8fh` with label "E1") were not retrieving deployed event data (names and images) because of ID mismatches between the complex node IDs and the simple deployment keys.

## Root Cause
- Story Climb nodes use complex IDs: `ch1_node_1757450991650_3g9r9g8fh`
- But nodes have simple labels: "E1", "E2", etc.
- Deployed data was stored with numeric keys: "1", "2", etc.
- The lookup function wasn't properly extracting the event number from labels

## Fixes Implemented

### 1. Enhanced Event Data Lookup (`src/app/scrap-yard/story-climb/page.tsx`)
- **getEventDataForNode function**: Now properly extracts chapter and event number from node labels
- Calculates both local (1-20 per chapter) and global (1-200 overall) event numbers
- Tries multiple key formats to find deployed data:
  - Direct label match: "E1"
  - Local event number: "1"
  - Global event number: "21" (for chapter 2, event 1)
  - Prefixed format: "event_1"

### 2. Improved Data Storage Keys
- When loading deployed event data, now stores with multiple key formats:
  - `E${localEventNumber}` - e.g., "E1", "E20"
  - `${globalEventNumber}` - e.g., "1", "21", "41"
  - `event_${globalEventNumber}` - prefixed format
  - Chapter-specific: `E${chapter}_${localEventNumber}`
  - For chapter 1: Also stores simple numeric keys

### 3. Image Field Support
- **EventNodeEditor component**: Added image selection dropdown for each event
- Users can now select specific event images from 154 available options
- **Convex deployment function**: Properly handles the image field
  - Uses selected image if provided
  - Falls back to deterministic selection if not
  - Stores as both `image` and `imageReference` for compatibility

### 4. Data Flow
```
Admin Panel (EventNodeEditor)
    ↓ (user selects name, rewards, image)
    ↓ Deploy button
Convex Mutation (deployEventNodes)
    ↓ (enhances data, stores in DB)
Story Climb Page
    ↓ (loads deployment via query)
    ↓ (processes into Map with multiple keys)
getEventDataForNode
    ↓ (extracts event number from label)
    ↓ (tries multiple key formats)
Returns: { name, image, goldReward, xpReward, chipRewards }
```

## Testing
Run `test-event-data-pipeline.js` in browser console to verify:
1. Deployed data is loaded
2. Keys are properly mapped
3. Event E1 data can be retrieved
4. Images load successfully

## Key Files Modified
- `src/app/scrap-yard/story-climb/page.tsx` - Fixed lookup logic
- `src/components/EventNodeEditor.tsx` - Added image selection
- `convex/deployedNodeData.ts` - Enhanced image handling

## Result
Event nodes now properly display:
- Custom names (e.g., "Rust Protocol" instead of "EVENT NODE")
- Selected images (specific event images instead of random)
- Correct gold and XP rewards
- Calculated chip rewards based on position