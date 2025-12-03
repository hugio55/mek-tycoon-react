# Talent Builder Refactoring Plan

## Overview
Refactor the monolithic `page.tsx` (3,717 lines) into a modular, maintainable architecture while preserving all existing functionality.

---

## Phase 1: Consolidate Type Definitions

### Problem
Two duplicate type files exist with slight differences:
- `src/app/talent-builder/types.ts` (79 lines) - has `story` mode
- `src/components/talent-builder/types.ts` (97 lines) - has `CanvasMode` type

### Solution
1. **Merge into single canonical file**: `src/app/talent-builder/types.ts`
2. **Add missing types** from components version:
   - `CanvasMode = 'select' | 'add' | 'connect' | 'addLabel' | 'lasso'`
   - `SavedSpell` interface
   - `SavedCiruTree` interface
3. **Delete** `src/components/talent-builder/types.ts`
4. **Update all imports** in component files to use the app folder types

### Files Changed
- `src/app/talent-builder/types.ts` - Enhanced with all types
- `src/components/talent-builder/types.ts` - DELETED
- `src/components/talent-builder/Canvas.tsx` - Update import
- `src/components/talent-builder/PropertyPanel.tsx` - Update import
- `src/components/talent-builder/talentReducer.ts` - Update import
- `src/components/talent-builder/TemplateManager.tsx` - Update import

---

## Phase 2: Create TalentBuilderContext with useReducer

### Problem
The page has ~40 `useState` calls. An existing `talentReducer.ts` (256 lines) is already written but unused.

### Solution
Create a context that wraps `useReducer` + the existing reducer.

### New File: `src/app/talent-builder/TalentBuilderContext.tsx`
```
Structure:
- TalentBuilderContext (createContext)
- TalentBuilderProvider (component with useReducer)
- useTalentBuilder (custom hook)
- Additional computed values and action creators
```

### State to move from useState to reducer:
```typescript
// Core node state
nodes, connections, selectedNode, selectedNodes

// Canvas interaction
mode, connectFrom, dragState, isPanning, panStart, panOffset, zoom

// UI toggles
showGrid, snapToGrid, editingNode

// Search/picker state
variationSearch, showVariationPicker, showEssencePicker, essenceSearch

// Save state
saveStatus, hasUnsavedChanges, currentSaveName

// Builder mode
builderMode, selectedTemplateId, templateName, templateDescription

// Modal visibility
showTemplateManager, showCiruTreeLoader, showSaveDialog, showStoryLoader, showStorySaveDialog

// Story mode
storyChapter, storyNodeEditMode

// Highlight/debug
unconnectedNodes, deadEndNodes, highlightDisconnected

// Viewport
showViewportBox, viewportDimensions

// History
history, historyIndex
```

### Extend existing reducer with missing actions:
- Box selection state
- Lasso selection state
- Rotation handle state
- Story mode state
- Viewport state
- All modal toggles

---

## Phase 3: Extract Custom Hooks

### Problem
Complex logic mixed with component code.

### Solution
Extract focused hooks following project patterns (see `src/hooks/`).

### New Hooks:

#### `src/app/talent-builder/hooks/useCanvasInteraction.ts`
```
- Mouse down/up/move handlers
- Box selection logic
- Lasso selection logic
- Rotation handle logic
- Panning logic
- Zoom logic
- Snap to grid calculations
```

#### `src/app/talent-builder/hooks/useKeyboardShortcuts.ts`
```
- Mode hotkeys (1, 2, 3, L)
- Delete node (Delete key)
- Undo/Redo (Ctrl+Z, Ctrl+Y)
- Story mode hotkeys (Q, W, E, R, C)
```

#### `src/app/talent-builder/hooks/useAutosave.ts`
```
- Change counter tracking
- 2-minute timer autosave
- 10-minute Convex backup
- Skip tracking during load/undo
- Error handling
```

#### `src/app/talent-builder/hooks/useHistory.ts`
```
- History state management
- pushToHistory function
- undo/redo functions
- Max 100 history entries
```

#### `src/app/talent-builder/hooks/useSaveLoad.ts`
```
- saveToLocalStorage
- loadFromLocalStorage
- File system backup calls
- CiruTree saves management
- Story mode saves management
```

#### `src/app/talent-builder/hooks/useConnectionAnalysis.ts`
```
- testConnections function
- findDisconnectedAndDeadEndNodes function
- clearConnectionTest function
```

---

## Phase 4: Extract Modal Components

### Problem
All modals rendered inline in return statement (~800+ lines of JSX).

### Solution
Create separate modal components.

### New Components:

#### `src/app/talent-builder/components/SaveDialog.tsx`
```
Props:
- isOpen: boolean
- onClose: () => void
- onSave: (name: string, isOverwrite: boolean) => void
- currentSaveName: string | null
- savedCiruTrees: SavedCiruTree[]
```

#### `src/app/talent-builder/components/LoadTreeDialog.tsx`
```
Props:
- isOpen: boolean
- onClose: () => void
- onLoad: (nodes, connections, name) => void
- savedCiruTrees: SavedCiruTree[]
- backupFiles: BackupFile[]
```

#### `src/app/talent-builder/components/StorySaveDialog.tsx`
```
Props:
- isOpen: boolean
- onClose: () => void
- onSave: (name: string) => void
- chapter: number
```

#### `src/app/talent-builder/components/StoryLoaderDialog.tsx`
```
Props:
- isOpen: boolean
- onClose: () => void
- onLoad: (nodes, connections, chapter, name) => void
- savedStoryModes: SavedStoryMode[]
```

#### Update existing `src/components/talent-builder/TemplateManager.tsx`
- Already exists and is well-structured
- Just need to integrate it properly

---

## Phase 5: Extract Canvas and Toolbar Components

### Problem
Canvas rendering and toolbar are embedded in page.

### Solution
Use/update existing extracted components.

### Update `src/components/talent-builder/Canvas.tsx`
The existing Canvas component uses dispatch but is incomplete. Update to include:
- Box selection rendering
- Lasso selection rendering
- Rotation handle rendering
- Story mode node styling
- Viewport box preview
- Dead-end/unconnected highlighting

### New Component: `src/app/talent-builder/components/Toolbar.tsx`
```
Sections:
- Mode selector (Select, Add, Connect, Label, Lasso)
- Grid/Snap toggles
- Viewport controls
- Save/Load buttons (varies by builder mode)
- Story mode controls (chapter, node type)
```

### New Component: `src/app/talent-builder/components/StatusBar.tsx`
```
- Current mode display
- Save status
- Autosave indicator
- Convex backup indicator
- Error notifications
```

### Update `src/components/talent-builder/PropertyPanel.tsx`
- Already exists and uses dispatch
- Add story mode fields
- Add reward configuration fields

---

## Phase 6: Integrate Components into Page

### Refactored Page Structure
```tsx
// src/app/talent-builder/page.tsx (~200-300 lines target)

export default function TalentBuilderPage() {
  return (
    <ErrorBoundary>
      <TalentBuilderProvider>
        <div className="min-h-screen bg-gray-950 text-white overflow-hidden relative">
          {/* Back button */}
          <BackToSiteButton />

          {/* Top toolbar */}
          <Toolbar />

          {/* Main canvas */}
          <Canvas />

          {/* Property panel (shows when node selected) */}
          <PropertyPanel />

          {/* Modals */}
          <SaveDialog />
          <LoadTreeDialog />
          <TemplateManager />
          <StorySaveDialog />
          <StoryLoaderDialog />
        </div>
      </TalentBuilderProvider>
    </ErrorBoundary>
  );
}
```

---

## Phase 7: Clean Up Unused Files

### Files to DELETE after refactoring
- `src/app/talent-builder/page-old-layout.tsx` (1,364 lines) - backup file
- `src/app/talent-builder/page-new-layout.tsx` (869 lines) - backup file
- `src/app/talent-builder/node-panel-new.tsx` (268 lines) - unused snippet
- `src/components/talent-builder/types.ts` (deleted in Phase 1)

### Files to KEEP
- `src/app/talent-builder/saveMigrations.ts` - Well designed, keep as-is
- `src/app/talent-builder/utils.ts` - Small utility, keep as-is
- `src/components/talent-builder/ErrorBoundary.tsx` - Ready to use

---

## Final File Structure

```
src/app/talent-builder/
├── page.tsx                    (~250 lines - main layout only)
├── types.ts                    (~150 lines - consolidated types)
├── utils.ts                    (~10 lines - existing)
├── saveMigrations.ts           (~162 lines - existing)
├── TalentBuilderContext.tsx    (~200 lines - state management)
├── components/
│   ├── Toolbar.tsx             (~300 lines)
│   ├── StatusBar.tsx           (~80 lines)
│   ├── SaveDialog.tsx          (~150 lines)
│   ├── LoadTreeDialog.tsx      (~200 lines)
│   ├── StorySaveDialog.tsx     (~100 lines)
│   └── StoryLoaderDialog.tsx   (~150 lines)
└── hooks/
    ├── useCanvasInteraction.ts (~250 lines)
    ├── useKeyboardShortcuts.ts (~100 lines)
    ├── useAutosave.ts          (~100 lines)
    ├── useHistory.ts           (~60 lines)
    ├── useSaveLoad.ts          (~200 lines)
    └── useConnectionAnalysis.ts (~80 lines)

src/components/talent-builder/
├── Canvas.tsx                  (~500 lines - enhanced)
├── PropertyPanel.tsx           (~400 lines - enhanced)
├── TemplateManager.tsx         (~190 lines - existing)
├── ErrorBoundary.tsx           (~80 lines - existing)
└── talentReducer.ts            (~350 lines - enhanced)
```

**Total estimated lines: ~3,100** (vs current 3,717 + duplicates)
**But spread across 17 focused files instead of 1 monolith**

---

## Implementation Order

### Stage 1: Foundation (Non-breaking)
1. Phase 1: Consolidate types
2. Phase 2: Create context (can coexist with useState initially)

### Stage 2: Extract Hooks (Non-breaking)
3. Phase 3: Extract hooks one at a time
   - Start with `useHistory` (self-contained)
   - Then `useAutosave`
   - Then `useKeyboardShortcuts`
   - Then `useSaveLoad`
   - Then `useConnectionAnalysis`
   - Finally `useCanvasInteraction` (most complex)

### Stage 3: Extract Components (Non-breaking)
4. Phase 4: Extract modals one at a time
5. Phase 5: Update Canvas and create Toolbar

### Stage 4: Integration (Breaking change)
6. Phase 6: Refactor page to use new components
7. Phase 7: Delete unused files

---

## Testing Strategy

After each phase:
1. **Manual testing**: Load page, verify all features work
2. **Check features**:
   - [ ] CiruTree mode: Add/edit/delete nodes
   - [ ] Mek Template mode: Load/save templates
   - [ ] Story mode: All node types, chapter switching
   - [ ] Canvas: Pan, zoom, grid, snap
   - [ ] Selection: Box select, lasso, multi-select
   - [ ] Connections: Create, delete, chain
   - [ ] Save/Load: LocalStorage, file backups, Convex
   - [ ] Undo/Redo: History works
   - [ ] Keyboard shortcuts: All hotkeys work
   - [ ] Autosave: Timer and change-based

---

## Risk Mitigation

1. **Keep original page.tsx as backup** until fully tested
2. **Implement incrementally** - each phase should leave app working
3. **Test after each extracted hook/component**
4. **Don't delete backup files until final verification**

---

## Benefits After Refactoring

| Metric | Before | After |
|--------|--------|-------|
| Main page lines | 3,717 | ~250 |
| Largest file | 3,717 | ~500 |
| useState calls | ~40 | 0 (uses context) |
| Duplicate types | 2 files | 1 file |
| Testable units | 1 | 17+ |
| Code reuse | Low | High |
| Bug isolation | Hard | Easy |
