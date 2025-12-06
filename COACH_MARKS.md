# Coach Marks / Spotlight Tutorial System

## Overview
The Coach Marks system provides guided onboarding for new users by darkening the entire screen except for one highlighted element, displaying an arrow pointing to it, and showing instructional tooltips.

**Common Names**: Spotlight tour, coach marks, product tour, onboarding walkthrough, feature tour

---

## Core Concepts

### Spotlight
A "hole" cut out of the dark overlay, revealing and highlighting one UI element. Can be rectangular, circular, or pill-shaped.

### Step
A single tutorial moment: one spotlight + one arrow + one tooltip. Steps can be standalone or part of a sequence.

### Sequence
A linear chain of steps that guide users through a flow. Example: "Click Forge" → navigates to Forge page → "Select a Mek" → "Confirm Craft"

**Note**: Sequences are LINEAR only (no branching). User clicks element → proceeds to next step.

### Mandatory vs Optional
- **Mandatory**: User MUST click the highlighted element to proceed. Dark area clicks do nothing.
- **Optional**: User can click dark area or skip button to dismiss.

---

## Target Types

### 1. Element Targeting
Uses CSS selector or `data-tutorial` attribute to find element.
```html
<button data-tutorial="forge-button">Forge</button>
```
- **Pros**: Automatically tracks element position, works with layout changes
- **Cons**: Element must exist, selector must be unique

### 2. Manual Positioning
Admin specifies exact X%, Y% coordinates and spotlight dimensions.
- **Pros**: Works when element doesn't exist or is hard to target
- **Cons**: Doesn't adapt to layout changes, more maintenance

### 3. Hybrid
Finds element by selector, then applies manual offsets.
- **Pros**: Combines reliability of element targeting with fine-tuning
- **Cons**: More complex configuration

---

## Visual Style: Space Age / Liquid Glass

**Reference Component**: `EssenceDistributionLightboxSpaceAge.tsx`

### Key Styling Elements
```css
/* Liquid Glass Container */
background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
backdrop-filter: blur(30px);
border: 1px solid rgba(255,255,255,0.12);
border-radius: 20px;
box-shadow: 0 25px 80px rgba(0,0,0,0.6), 0 0 60px rgba(34,211,238,0.05);

/* Cyan Accent Color */
color: #22d3ee; /* cyan-400 */
text-shadow: 0 0 30px rgba(34, 211, 238, 0.5);

/* Dark Backdrop */
background: rgba(0,0,0,0.70);
backdrop-filter: blur(20px);
```

### Fonts
- **Headers**: `font-family: 'Orbitron', sans-serif`
- **Body/Labels**: `font-family: 'Play', sans-serif`
- **Buttons/Controls**: `font-family: 'Saira', sans-serif`

### Button Style
```css
background: linear-gradient(135deg, rgba(34,211,238,0.2), rgba(34,211,238,0.1));
border: 1px solid rgba(255,255,255,0.1);
color: #22d3ee;
```

---

## Database Schema

### coachMarkSteps
Stores all tutorial step definitions.

| Field | Type | Description |
|-------|------|-------------|
| stepKey | string | Unique identifier (e.g., "onboard-forge-button") |
| name | string | Human-readable name for admin |
| description | string | Admin notes about this step |
| pageRoute | string | Which page (e.g., "/home", "/forge") |
| sequenceId | string? | Which sequence this belongs to |
| sequenceOrder | number | Order within sequence |
| targetType | enum | "element" \| "manual" \| "hybrid" |
| elementSelector | string? | CSS selector or data-tutorial value |
| manualPosition | object? | { x, y, width, height } in percentages/pixels |
| positionOffset | object? | { top, left, right, bottom } fine-tuning |
| spotlightShape | enum | "rectangle" \| "circle" \| "pill" |
| spotlightPadding | number | Extra space around spotlight (default: 8) |
| arrowPosition | enum | "top" \| "bottom" \| "left" \| "right" \| "none" |
| arrowOffset | number? | Fine-tune arrow position |
| tooltipText | string | Main instruction |
| tooltipTitle | string? | Optional title above instruction |
| tooltipPosition | enum | "above" \| "below" \| "left" \| "right" \| "auto" |
| isMandatory | boolean | Must click element to proceed |
| allowBackdropClick | boolean | Can click dark area to skip |
| showSkipButton | boolean | Show skip option |
| showNextButton | boolean | Show next button for non-mandatory |
| triggerCondition | enum | "first-login" \| "first-visit-page" \| "manual" |
| isActive | boolean | Enable/disable step |
| createdAt | number | Timestamp |
| updatedAt | number | Timestamp |

### coachMarkProgress
Tracks each user's tutorial progress.

| Field | Type | Description |
|-------|------|-------------|
| corporationId | id | Reference to corporation |
| completedSteps | string[] | Array of completed stepKeys |
| skippedSteps | string[] | Array of skipped stepKeys |
| currentSequence | string? | Active sequence ID |
| currentStepIndex | number? | Current position in sequence |
| tutorialCompleted | boolean | Finished all mandatory onboarding |
| lastUpdated | number | Timestamp |

### coachMarkSequences
Defines step groupings.

| Field | Type | Description |
|-------|------|-------------|
| sequenceId | string | Unique identifier |
| name | string | Display name |
| description | string | Admin notes |
| stepOrder | string[] | Ordered array of stepKeys |
| isOnboarding | boolean | Auto-trigger on first login |
| isActive | boolean | Enable/disable sequence |
| createdAt | number | Timestamp |

---

## Components

### CoachMarkOverlay
The main visual component. Uses React portal to render at document.body.
- Creates dark backdrop with SVG mask cutout
- Calculates spotlight position from target element or manual coords
- Handles resize/scroll to keep spotlight aligned
- Manages click events (backdrop vs spotlight area)
- Space Age liquid glass styling

### CoachMarkArrow
Animated arrow pointing to spotlight.
- Bouncing/pulsing animation
- Configurable direction (top/bottom/left/right)
- Cyan glow effect matching Space Age theme

### CoachMarkTooltip
Instruction popup near spotlight.
- Title (optional)
- Instruction text
- Skip button (if allowed)
- Next button (for non-mandatory)
- Step counter ("2 of 5")
- Space Age liquid glass styling

### CoachMarkProvider (Context)
Global state management.
- Current active step
- Step completion logic
- Convex sync
- Auto-trigger on route changes

---

## Admin Panel Features

### Step Management
- Create/edit/delete steps
- Visual element picker tool
- Manual position sliders (X%, Y%, width, height)
- Offset adjustments for fine-tuning
- Live preview mode
- Reorder steps in sequences

### Sequence Management
- Create/edit sequences
- Assign steps to sequences
- Set as onboarding sequence
- Drag-and-drop reordering

### Progress Viewer
- See which users completed which steps
- Reset progress for testing

---

## Implementation Phases

### Phase 1: Database Schema & Backend ← CURRENT
- Add tables to `convex/schema.ts`
- Create `convex/coachMarks.ts` (user queries/mutations)
- Create `convex/coachMarksAdmin.ts` (admin CRUD)

### Phase 2: Core Components
- `CoachMarkOverlay.tsx` - main visual overlay
- `CoachMarkArrow.tsx` - animated pointer
- `CoachMarkTooltip.tsx` - instruction bubble

### Phase 3: Context Provider
- `CoachMarkContext.tsx` - global state management
- Integration with Convex backend
- Route change detection

### Phase 4: Admin Panel
- `CoachMarksAdmin.tsx` - admin interface
- Step editor with all options
- Visual element picker
- Preview mode

### Phase 5: Integration
- Add provider to app layout
- First login detection
- Add `data-tutorial` attributes to key elements

### Phase 6: Testing & Polish
- Test new user flow
- Handle edge cases
- Mobile responsiveness

---

## Files to Create

```
convex/
  coachMarks.ts           # User queries/mutations
  coachMarksAdmin.ts      # Admin CRUD functions

src/components/
  CoachMarkOverlay.tsx
  CoachMarkArrow.tsx
  CoachMarkTooltip.tsx
  CoachMarksAdmin.tsx

src/contexts/
  CoachMarkContext.tsx

src/app/admin/
  (add CoachMarksAdmin to admin tabs)
```

---

## Trigger Conditions

### first-login
Runs when corporation has no progress record. Starts onboarding sequence automatically.

### first-visit-page
Triggers first time user visits specific page. Good for page-specific tutorials.

### manual
Only triggers via code. For admin testing or special circumstances.

---

## Usage Examples

### Adding Tutorial to New Element

1. Add `data-tutorial` attribute to element:
```tsx
<button data-tutorial="claim-gold" onClick={claimGold}>
  Claim Gold
</button>
```

2. Create step in admin panel:
- stepKey: "onboard-claim-gold"
- targetType: "element"
- elementSelector: "[data-tutorial='claim-gold']"
- tooltipText: "Click here to collect your gold!"
- isMandatory: true
- sequenceId: "onboarding-tour"

### Manual Positioning Example
For elements that are hard to target (like canvas areas or dynamic content):
- targetType: "manual"
- manualPosition: { x: 50, y: 30, width: 200, height: 100 }
- This puts spotlight at 50% from left, 30% from top

---

## Design Decisions

### Why SVG Mask?
CSS clip-path has limited browser support for complex shapes. SVG masks work everywhere and support smooth animations.

### Why Portal?
Ensures overlay is always on top, not affected by parent z-index stacking contexts.

### Why Convex for Progress?
- Syncs across devices automatically
- Real-time updates
- Admin can see/reset progress

### Why data-tutorial Attributes?
More reliable than CSS selectors. Won't break if class names change. Self-documenting.

### Why Linear Sequences Only?
Keeps system simple. Most onboarding flows are linear anyway. Can add branching later if needed.

---

## Admin Panel Location
`/admin` → Coach Marks tab (to be added)
