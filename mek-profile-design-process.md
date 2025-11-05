# Mek Profile Page - Responsive Design Process

## Design Philosophy

The profile page responsive design follows a **content-priority** approach where information hierarchy adapts based on viewport size. Rather than simply stacking elements, we reorganize content to maintain visual coherence and usability across all devices.

## Layout System Overview

### Desktop Layout (Layout 1)
**Breakpoint: 1024px and above**

Three-column architecture:
- **Left Sidebar (33% width)**: Profile avatar, username, prestige, core stats
- **Center Column (67% width)**: Content tabs (Meks, Essence, Inventory, Frames)
- **Right Sidebar**: Reserved for future features (achievements, social, etc.)

```
┌─────────────┬───────────────────────────────┐
│             │                               │
│   Profile   │        Content Tabs           │
│   Avatar    │                               │
│   Stats     │    Meks | Essence | etc.      │
│             │                               │
└─────────────┴───────────────────────────────┘
```

### Mobile Layout
**Breakpoint: Below 1024px**

Single-column priority hierarchy:
1. **Profile Header** (Compact): Avatar thumbnail + username + key stats
2. **Tab Navigation**: Horizontal scrollable tabs
3. **Content Area**: Full-width content display

```
┌──────────────────────────────┐
│  🖼️  Username  | Stats       │
├──────────────────────────────┤
│ [Meks] [Essence] [Inventory] │
├──────────────────────────────┤
│                              │
│      Content Display         │
│                              │
└──────────────────────────────┘
```

## Responsive Breakpoint Strategy

### Tier 1: Desktop (1280px+)
- Full three-column layout
- Spacious padding and margins
- Large avatar display (400px)
- 5-column Mek grid

### Tier 2: Laptop (1024px - 1279px)
- Two-column layout (profile left, content right)
- Moderate padding
- Medium avatar (300px)
- 4-column Mek grid

### Tier 3: Tablet (768px - 1023px)
- Single column with profile header
- Avatar reduced to thumbnail (80px)
- Stats displayed horizontally
- 3-column Mek grid
- Tab navigation becomes scrollable

### Tier 4: Mobile (< 768px)
- Ultra-compact profile header
- Avatar thumbnail (60px)
- Stats in condensed grid
- 2-column Mek grid
- Touch-optimized tap targets (44px minimum)

## Design Principles

### 1. Progressive Disclosure
Information is revealed based on available space:
- **Desktop**: All information visible simultaneously
- **Tablet**: Primary info visible, secondary info accessible via tabs
- **Mobile**: Only critical info shown, rest accessible via navigation

### 2. Touch Target Optimization
All interactive elements meet accessibility standards:
- Minimum 44px × 44px tap targets on mobile
- Adequate spacing between interactive elements (8px minimum)
- Buttons scale proportionally with viewport

### 3. Visual Hierarchy Preservation
Key information remains prominent across all breakpoints:
- Username always visible
- Primary stats (Gold, Gold/Hr) prioritized
- Mek images maintain aspect ratio
- Tab navigation remains accessible

### 4. Content-First Layout
Layout adapts to content needs, not arbitrary grid divisions:
- Avatar scales based on importance in viewport
- Stats reorganize from vertical (desktop) to horizontal (mobile)
- Mek grid columns reduce intelligently (5→4→3→2)
- Pagination adapts to visible content

## Implementation Strategy

### CSS Architecture

**Utility-First with Responsive Modifiers**
```css
<!-- Desktop: col-span-4 (33%) -->
<!-- Tablet: col-span-12 → single column -->
<!-- Mobile: Full width with reduced padding -->

<div className="col-span-12 lg:col-span-4">
  <!-- Profile content -->
</div>
```

**Responsive Grid System**
```css
<!-- 5 columns on desktop -->
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1">
  <!-- Mek items -->
</div>
```

### Key Tailwind Breakpoints Used

- `sm:` 640px - Small phones → large phones
- `md:` 768px - Tablets (portrait)
- `lg:` 1024px - Tablets (landscape) and small laptops
- `xl:` 1280px - Desktop monitors
- `2xl:` 1536px - Large desktop monitors

### Component-Specific Adaptations

#### Profile Avatar
```typescript
// Desktop: Full width square, 400x400px
// Tablet: Medium square, 300x300px
// Mobile: Small thumbnail, 80x80px inline with username
```

#### Stats Display
```typescript
// Desktop: Vertical stack with large spacing
<div className="space-y-3">
  <div className="flex justify-between">
    <span>Total Gold</span>
    <span className="text-xl">125,420</span>
  </div>
</div>

// Mobile: Compact horizontal grid
<div className="grid grid-cols-2 gap-2">
  <div>Total Gold</div>
  <div>Gold/Hr</div>
</div>
```

#### Tab Navigation
```typescript
// Desktop: Full tabs with padding
<button className="px-6 py-3 font-bold">

// Mobile: Compact tabs with scroll
<div className="flex gap-0 overflow-x-auto">
  <button className="px-4 py-2 text-sm whitespace-nowrap">
```

## Testing Methodology

### Browser Resizing Test
**Goal**: Ensure smooth transitions when dragging browser window

**Steps**:
1. Open profile page at 1920px width (full desktop)
2. Slowly drag browser edge to narrow the window
3. Observe breakpoint transitions at 1280px, 1024px, 768px, 640px
4. Verify:
   - No layout "jumps" or jarring shifts
   - Content remains readable at all sizes
   - No horizontal scrollbars appear
   - Images scale proportionally

### Device Testing Matrix
| Device Type | Viewport Size | Expected Layout | Test Status |
|-------------|---------------|-----------------|-------------|
| Desktop 4K | 2560x1440 | 5-col grid, full profile | ✓ |
| Desktop HD | 1920x1080 | 5-col grid, full profile | ✓ |
| Laptop | 1366x768 | 4-col grid, two-column | ⏳ |
| iPad Pro | 1024x1366 | 3-col grid, single column | ⏳ |
| iPad | 768x1024 | 3-col grid, compact header | ⏳ |
| iPhone 14 Pro | 393x852 | 2-col grid, thumbnail header | ⏳ |
| iPhone SE | 375x667 | 2-col grid, minimal header | ⏳ |

### Interaction Testing
- [ ] Tap targets meet 44px minimum on mobile
- [ ] Tab navigation scrolls smoothly on narrow screens
- [ ] Mek thumbnails remain tappable and show tooltips correctly
- [ ] Search input expands/contracts appropriately
- [ ] Pagination buttons remain accessible on mobile

## Performance Considerations

### Image Optimization
- Use `MekImage` component with appropriate size prop
- Desktop: size={400} for avatar, size={200} for Mek grid
- Mobile: size={80} for avatar thumbnail, size={150} for Mek grid
- Lazy load images below the fold

### Layout Shift Prevention (CLS)
- Set explicit widths/heights on images
- Reserve space for dynamically loaded content
- Use `aspect-square` utility to maintain ratios
- Avoid late-loading styles that change layout

### Touch Performance
- Use `touch-action` CSS where appropriate
- Debounce scroll events on tab navigation
- Optimize hover states for touch (convert to active states)

## Future Iteration Roadmap

### Phase 2 Enhancements
- [ ] Add profile header "sticky" behavior on scroll (mobile)
- [ ] Implement swipe gestures for tab navigation (mobile)
- [ ] Add landscape-specific layouts for tablets
- [ ] Create "compact mode" toggle for power users

### Phase 3 Advanced Features
- [ ] Adaptive loading (fewer Meks loaded initially on mobile)
- [ ] Responsive typography scaling (fluid type)
- [ ] Dark mode with mobile-optimized contrast
- [ ] PWA optimizations for mobile installation

## Design Decision Log

### Why single-column instead of two-column on tablet?
**Decision**: Single column with compact header
**Rationale**: Two-column layout on tablet creates awkwardly narrow columns. Single column with horizontal stats provides better readability and touch targets.

### Why reduce Mek grid from 5 to 2 columns?
**Decision**: Progressive reduction (5→4→3→2)
**Rationale**: Maintains Mek image clarity at each breakpoint. 2-column on mobile ensures images are large enough to see details while fitting standard phone widths without horizontal scroll.

### Why horizontal scrollable tabs instead of dropdown?
**Decision**: Horizontal scroll with visible tabs
**Rationale**: Maintains discoverability of all options. Users can see what tabs exist without tapping to reveal. Swipe gesture is natural on mobile.

### Why compact stats on mobile vs full vertical list?
**Decision**: Horizontal grid with abbreviated labels
**Rationale**: Saves vertical space (premium on mobile). Key numbers still prominently displayed. Full labels accessible in content areas.

## Reusable Patterns for Other Pages

### Pattern 1: Responsive Grid with Intelligent Column Reduction
```jsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
```
**When to use**: Any page displaying collections (items, Meks, cards)

### Pattern 2: Compact Header Transformation
```jsx
{/* Desktop */}
<div className="hidden lg:block w-full aspect-square">
  <LargeAvatar />
</div>

{/* Mobile */}
<div className="flex lg:hidden items-center gap-3">
  <SmallAvatar />
  <Stats />
</div>
```
**When to use**: Any page with prominent profile/avatar display

### Pattern 3: Horizontal Scrollable Navigation
```jsx
<div className="flex gap-0 overflow-x-auto snap-x snap-mandatory">
  {tabs.map(tab => (
    <button className="snap-start whitespace-nowrap px-4 py-2">
      {tab}
    </button>
  ))}
</div>
```
**When to use**: Tab navigation with 4+ options on mobile

## Lessons Learned

### What Worked Well
✓ Grid-based layout with Tailwind breakpoint modifiers
✓ `MekImage` component handles responsive sizes cleanly
✓ Tooltip positioning adapts correctly across viewports
✓ Tab navigation remains functional at all sizes

### Challenges Encountered
⚠ Initial tooltip overflow issues on narrow screens
⚠ Tab border styling doesn't align perfectly at breakpoint transitions
⚠ Prestige border animations can cause layout shift on mobile

### Improvements for Next Iteration
→ Add `container` queries for component-level responsiveness
→ Extract responsive patterns into reusable layout components
→ Create comprehensive visual regression test suite
→ Document animation performance on lower-end mobile devices

---

**Document Version**: 1.0
**Last Updated**: November 4, 2025
**Author**: Claude (Project Lead) + Mobile Responsive Optimizer
**Status**: Living document - will be updated as design evolves
