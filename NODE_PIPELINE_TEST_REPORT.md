# Node Data Pipeline Test Report
## Executive Summary
**Critical Issue Found:** Complete disconnect between admin event deployment and Story Climb retrieval system due to ID mismatch.

## Test Date
2025-09-17

## Testing Scope
- Admin Interface → Convex Database → Story Climb Page data pipeline
- Focus: Event node data (names, images, rewards) for all 200 events
- System boundaries: Ensuring no interference with visual effects, interactions, or navigation

## CRITICAL FINDINGS

### 1. ROOT CAUSE: ID Mismatch
**Severity:** CRITICAL ❌
**Status:** BROKEN

#### The Problem
- **Admin stores events by:** Simple integers (`eventNumber: 1` through `eventNumber: 200`)
- **Story Climb identifies nodes by:** Complex generated IDs (e.g., `ch1_node_1757450991650_3g9r9g8fh`)
- **Result:** No connection between deployed data and displayed nodes

#### Evidence
From the debug panel on Story Climb page:
```
Selected Node ID: ch1_node_1757450991650_3g9r9g8fh
Type: event
❌ No mek found for this node
```

The deployed event data Map tries to match using:
- `event_${eventNumber}` (e.g., "event_1")
- `E${localEventNumber}` (e.g., "E1")
- `E${chapter}_${localEventNumber}` (e.g., "E1_1")
- Raw numbers (e.g., "1" or 1)

But nodes in the tree have IDs like `ch1_node_1757450991650_3g9r9g8fh` which never match any of these patterns.

### 2. Data Storage Analysis
**Status:** PARTIALLY FUNCTIONAL ⚠️

#### What Works:
- EventNodeEditor correctly saves event data with `eventNumber` 1-200
- Deployment system successfully stores data in Convex
- Data includes names, gold rewards, XP rewards
- Chip rewards are calculated dynamically

#### What's Missing:
- No mapping between `eventNumber` and actual tree node IDs
- No way to identify which tree node corresponds to which event number
- Event labels (E1, E2, etc.) exist but aren't reliably connected to event numbers

### 3. Retrieval Logic Issues
**Status:** BROKEN ❌

The `getEventDataForNode` function tries multiple approaches:
1. Direct ID match (fails - IDs don't match)
2. Label match (partially works if label is "E1", "E2", etc.)
3. ID replacement patterns (fails - wrong format)
4. Extract number from label (partially works)

However, the core issue is that event nodes in the tree don't have a reliable way to identify their global event number (1-200).

### 4. System Boundary Testing
**Status:** PASSED ✅

Good news: The system architecture properly isolates concerns:
- Visual effects remain untouched
- Hover animations work independently
- Click handlers are separate from data
- Tree navigation unaffected
- Preview mode properly isolated

### 5. Data Integrity
**Status:** CANNOT TEST ❌

Due to the ID mismatch, we cannot verify:
- If all 200 events would receive correct data
- If names and images would display properly
- If rewards would calculate correctly

## RECOMMENDATIONS

### Immediate Fix Required
The system needs a reliable way to map tree nodes to event numbers. Options:

1. **Add eventNumber to tree nodes**
   - Modify the story tree data structure to include `eventNumber` field
   - Most reliable solution

2. **Use label parsing consistently**
   - Ensure all event nodes have labels like "E1", "E2", etc.
   - Parse these to determine global event number
   - Calculate: `globalEventNumber = (chapter - 1) * 20 + localEventNumber`

3. **Create a mapping table**
   - Store a map of node IDs to event numbers
   - Update when trees are created/modified

### Current Workaround
The system partially works if:
- Event nodes have labels formatted as "E{number}"
- The label number corresponds to the local event number within the chapter

However, this is fragile and doesn't work for the node shown in the debug panel.

## Test Coverage

| Test Category | Status | Details |
|---|---|---|
| Data Storage | ⚠️ PARTIAL | Data saves but with wrong keys |
| Data Retrieval | ❌ FAILED | Cannot match node IDs |
| ID Mapping | ❌ FAILED | No connection between systems |
| Visual Isolation | ✅ PASSED | No interference detected |
| Interaction Isolation | ✅ PASSED | Click/hover handlers separate |
| Performance | ⚠️ UNTESTED | Cannot test without working pipeline |
| Edge Cases | ❌ BLOCKED | Cannot test without basic functionality |

## Conclusion

The node data pipeline is fundamentally broken due to an architectural mismatch between how events are identified in the admin system (simple numbers) versus the Story Climb page (complex generated IDs). This prevents any event data from being displayed.

**The system boundaries are properly respected** - the data pipeline does not interfere with visual effects or interactions. However, it also doesn't successfully deliver any data.

## Priority Actions

1. **CRITICAL:** Establish a reliable mapping between tree node IDs and event numbers
2. **HIGH:** Verify all event nodes have proper labels or add eventNumber field
3. **MEDIUM:** Add validation to ensure deployed data can be retrieved
4. **LOW:** Add logging to track successful/failed data lookups

## Files Analyzed

- `/convex/deployedNodeData.ts` - Deployment system
- `/src/app/scrap-yard/story-climb/page.tsx` - Story Climb display
- `/src/components/EventNodeEditor.tsx` - Admin configuration

## Testing Tools Used
- Manual code analysis
- Debug panel inspection
- Console log analysis
- Data flow tracing

---
*End of Report*