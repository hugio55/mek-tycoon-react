# Coach Marks / Spotlight Tutorial System - Implementation Plan

## Overview
A guided onboarding system that darkens the screen except for one highlighted element, with arrows and tooltips guiding users through features.

---

## Phase 1: Database Schema & Backend

### 1.1 Create Convex Schema Tables

**Table: `coachMarkSteps`** - Defines all tutorial steps
```
- id (auto)
- stepKey: string (unique identifier like "welcome-forge-button")
- name: string (human-readable name for admin)
- description: string (admin notes)
- pageRoute: string (which page this appears on, e.g., "/home")
- sequenceOrder: number (order within a sequence)
- sequenceId: optional string (groups steps into sequences like "onboarding-tour")

- targetType: "element" | "manual" | "hybrid"
- elementSelector: optional string (CSS selector or data-tutorial attribute)
- manualPosition: optional object {
    x: number (percentage from left 0-100)
    y: number (percentage from top 0-100)
    width: number (spotlight width in pixels)
    height: number (spotlight height in pixels)
  }
- positionOffset: optional object {
    top: number
    left: number
    right: number
    bottom: number
  }

- spotlightShape: "rectangle" | "circle" | "pill"
- spotlightPadding: number (extra space around element)

- arrowPosition: "top" | "bottom" | "left" | "right" | "none"
- arrowOffset: optional number

- tooltipText: string (main instruction text)
- tooltipPosition: "above" | "below" | "left" | "right" | "auto"
- tooltipTitle: optional string

- isMandatory: boolean (must click element to proceed)
- allowBackdropClick: boolean (can click dark area to skip)
- showSkipButton: boolean
- showNextButton: boolean (for non-mandatory steps)

- triggerCondition: "first-login" | "first-visit-page" | "manual" | "after-step"
- afterStepKey: optional string (triggers after another step completes)

- isActive: boolean (can disable steps)
- createdAt: number
- updatedAt: number
```

**Table: `coachMarkProgress`** - Tracks user progress
```
- id (auto)
- corporationId: id("corporations")
- completedSteps: array of strings (stepKeys)
- skippedSteps: array of strings (stepKeys)
- currentSequence: optional string (sequenceId in progress)
- currentStepIndex: optional number
- tutorialCompleted: boolean (finished all mandatory onboarding)
- lastUpdated: number
```

**Table: `coachMarkSequences`** - Defines step sequences
```
- id (auto)
- sequenceId: string (unique like "onboarding-tour")
- name: string
- description: string
- stepOrder: array of strings (stepKeys in order)
- isOnboarding: boolean (runs on first login)
- isActive: boolean
- createdAt: number
```

### 1.2 Create Convex Functions
- `coachMarks.getActiveStep` - Get current step for user on current page
- `coachMarks.markStepComplete` - Mark a step as done
- `coachMarks.skipStep` - Skip a step (if allowed)
- `coachMarks.skipSequence` - Skip entire sequence (if allowed)
- `coachMarks.getUserProgress` - Get user's tutorial progress
- `coachMarks.resetProgress` - Admin: reset user's progress for testing

Admin functions:
- `coachMarksAdmin.createStep` - Create new step
- `coachMarksAdmin.updateStep` - Update existing step
- `coachMarksAdmin.deleteStep` - Delete step
- `coachMarksAdmin.createSequence` - Create sequence
- `coachMarksAdmin.reorderSequence` - Change step order
- `coachMarksAdmin.getAllSteps` - List all steps
- `coachMarksAdmin.getAllSequences` - List all sequences

---

## Phase 2: Core Components

### 2.1 CoachMarkOverlay Component
**Location**: `src/components/CoachMarkOverlay.tsx`

**Features**:
- Dark overlay covering entire viewport (z-index: 9999)
- SVG mask to "punch out" spotlight area
- Calculates target element position in real-time
- Handles window resize/scroll
- Smooth transitions between steps

**Key Logic**:
```
1. Receive current step data
2. If targetType="element": find element, get bounding rect
3. If targetType="manual": use manual coordinates
4. If targetType="hybrid": find element, apply offsets
5. Create SVG mask with cutout at spotlight position
6. Position arrow pointing to spotlight
7. Position tooltip near spotlight
8. Handle click events (backdrop vs spotlight area)
```

### 2.2 CoachMarkArrow Component
**Location**: `src/components/CoachMarkArrow.tsx`

- Animated arrow (pulse/bounce)
- Configurable direction (top/bottom/left/right)
- Offset adjustments
- Industrial/Mek styling (yellow/gold)

### 2.3 CoachMarkTooltip Component
**Location**: `src/components/CoachMarkTooltip.tsx`

- Title (optional)
- Instruction text
- Skip button (if allowed)
- Next button (for non-mandatory)
- Step counter ("Step 2 of 5")
- Industrial styling matching site theme

### 2.4 CoachMarkProvider Context
**Location**: `src/contexts/CoachMarkContext.tsx`

- Provides coach mark state to entire app
- Manages current active step
- Handles step completion/skipping
- Syncs with Convex backend
- Auto-triggers on page navigation

---

## Phase 3: Admin Panel

### 3.1 CoachMarksAdmin Component
**Location**: `src/components/CoachMarksAdmin.tsx`

**Tab in Admin page with:**
- List of all steps (sortable, filterable)
- Create new step form
- Edit step modal
- Preview mode (see what step looks like)
- Sequence management
- User progress viewer (see who completed what)
- Reset progress for testing

**Step Editor Features**:
- Target type selector (element/manual/hybrid)
- Element selector input with "Pick Element" tool
- Manual position sliders (X%, Y%, width, height)
- Offset adjustments (fine-tune)
- Spotlight shape picker
- Arrow position selector
- Tooltip text editor
- Mandatory toggle
- Page route selector (dropdown of all routes)
- Sequence assignment
- Live preview button

### 3.2 Visual Element Picker
**Location**: `src/components/admin/CoachMarkElementPicker.tsx`

- Overlay mode where admin can click any element
- Shows element's selector path
- Shows element's bounding box
- Generates data-tutorial attribute suggestion

---

## Phase 4: Integration

### 4.1 Add to App Layout
- Wrap app in `CoachMarkProvider`
- Add `CoachMarkOverlay` to root layout
- Overlay only renders when active step exists

### 4.2 First Login Detection
- Check if corporation is new (no progress record)
- Trigger "onboarding" sequence on first login
- Store flag that onboarding started

### 4.3 Add data-tutorial Attributes
- Add `data-tutorial="forge-button"` to key elements
- Makes targeting more reliable than CSS selectors
- Document which elements have tutorial attributes

---

## Phase 5: Testing & Refinement

### 5.1 Test Cases
- New user flow (first login triggers onboarding)
- Returning user (no tutorial shows)
- Page navigation during tutorial
- Browser resize during tutorial
- Skip functionality
- Mandatory steps (can't proceed without clicking)
- Chained steps across pages

### 5.2 Edge Cases
- Element not found (fall back to manual or skip)
- Element hidden/scrolled off screen (scroll into view)
- Multiple elements matching selector (use first? warn admin?)
- Mobile responsiveness

---

## Implementation Order

1. **Database first**: Schema tables and basic queries
2. **Core overlay**: Basic spotlight working with hardcoded data
3. **Context provider**: State management and Convex integration
4. **Admin panel**: CRUD for steps
5. **First login trigger**: Auto-start onboarding
6. **Polish**: Animations, mobile, edge cases

---

## Files to Create

```
convex/
  coachMarks.ts           # User-facing queries/mutations
  coachMarksAdmin.ts      # Admin CRUD functions

src/
  components/
    CoachMarkOverlay.tsx      # Main overlay component
    CoachMarkArrow.tsx        # Animated arrow
    CoachMarkTooltip.tsx      # Tooltip bubble
    CoachMarksAdmin.tsx       # Admin panel component
    admin/
      CoachMarkElementPicker.tsx  # Visual picker tool
      CoachMarkStepEditor.tsx     # Step edit form
      CoachMarkPreview.tsx        # Preview mode

  contexts/
    CoachMarkContext.tsx      # Provider and hooks
```

---

## Open Questions for User

1. Should sequences be able to branch? (If user clicks A, show step X; if they click B, show step Y)
2. Should there be a "tutorial" menu where users can replay tutorials?
3. Should tutorial progress sync across devices (it will via Convex)?
4. Any specific styling preferences for the tooltip/arrow?
