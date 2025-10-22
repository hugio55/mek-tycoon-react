# Essence Grid System

## Overview
The Essence Grid is a 288-button visualization system that provides a zoomed-out view of the Essence Market. Each button represents one of the 288 essence variations (102 heads + 112 bodies + 74 traits), illuminating based on market availability.

## Purpose
- **Market Overview**: See at a glance which essence types are available in the shop
- **Gap Identification**: Identify market voids where essence is lacking
- **Supply Planning**: Help players decide which essence types to generate/sell

## Visual Design

### Grid Layout
- **288 Individual Cells**: One per variation
- **Lightbulb Aesthetic**: Each cell looks like a small lightbulb
- **Organized by Type**: Grouped into sections (Heads, Bodies, Traits)
- **Lightbox Display**: Opens as a modal/lightbox overlay

### Illumination States
The brightness/color of each lightbulb indicates quantity available:

1. **OFF (Dark/Black)**: Zero essence available
2. **DIM GLOW (Gray)**: Small quantity (1-10 essence)
3. **WHITE**: Medium quantity (11-50 essence)
4. **YELLOW**: High quantity (51-100 essence)
5. **RED**: Very high quantity (101+ essence)

*Note: These thresholds may be adjusted based on market dynamics*

## Hover/Rollover Functionality

When hovering over any of the 288 cells, display a tooltip showing:

### When Essence IS Available (Quantity > 0)
- **Variation Name**: e.g., "Rust (Head)"
- **Quantity Available**: e.g., "15 essence"
- **Current Price**: e.g., "Price: 125G per essence"

### When Essence is NOT Available (Quantity = 0)
- **Variation Name**: e.g., "Burnt (Body)"
- **Quantity Available**: "0 essence"
- **Last Known Price**: Display most recent sale price
  - If never sold: "Last known price: No data"
  - If sold before: "Last known price: 150G per essence"

## User Interface

### Access Point
- **Location**: Top of Essence Market page
- **Button Position**: Near "LIST ITEM" and "MY LISTINGS" buttons
- **Button Label**: "ESSENCE GRID" or grid icon

### Grid Organization
Organize the 288 cells logically:
- **Section 1: Heads** (102 cells) - Top section
- **Section 2: Bodies** (112 cells) - Middle section
- **Section 3: Traits** (74 cells) - Bottom section

Consider visual separators between sections.

## Technical Implementation

### Data Requirements
1. **All Active Listings**: Grouped by variation
2. **Quantity Aggregation**: Sum of all essence per variation type
3. **Price Data**:
   - Current lowest price per variation
   - Historical price data for last known prices
4. **Variation Metadata**: From `completeVariationRarity.ts`

### Component Structure
```
EssenceGridButton (header button)
  └── EssenceGridLightbox (modal/lightbox)
      └── EssenceGridCell (288 instances)
          └── Tooltip (on hover)
```

### State Management
- Track which variations have listings
- Track quantities per variation
- Track price data (current + historical)
- Modal open/close state

### Performance Considerations
- 288 cells rendering simultaneously
- Efficient hover state management
- Lazy load tooltip data if needed
- Optimize re-renders on data updates

## Color Coding Logic

### Quantity Thresholds (Draft - To Be Refined)
```javascript
const getIlluminationColor = (quantity) => {
  if (quantity === 0) return 'off';        // Dark/transparent
  if (quantity <= 10) return 'dim';        // Gray glow
  if (quantity <= 50) return 'white';      // White glow
  if (quantity <= 100) return 'yellow';    // Yellow glow
  return 'red';                            // Red glow
};
```

Could also use relative thresholds based on:
- Percentage of total market supply
- Standard deviation from mean
- Rarity tier of the variation

## Future Enhancements
- **Click Functionality**: Click a cell to filter market view to that variation
- **Search Integration**: Highlight cells matching search terms
- **Animation**: Pulsing effect for newly listed essence
- **Sound**: Subtle audio cues for market changes
- **Filters**: Toggle to show only heads/bodies/traits
- **Sorting**: Reorganize grid by rarity, price, quantity
- **Comparison Mode**: Compare current state to historical snapshots

## Design System Integration
- Use industrial/sci-fi aesthetic consistent with Mek Tycoon
- Yellow/gold accents for active states
- Glass-morphism effects for lightbox background
- Metal texture overlays
- Industrial typography (Orbitron)

## Implementation Phases

### Phase 1: Core Grid (MVP)
- [ ] Create ESSENCE_GRID.md documentation
- [ ] Build EssenceGridLightbox component
- [ ] Build EssenceGridCell component (288 instances)
- [ ] Add button to Essence Market header
- [ ] Implement basic illumination states (off/dim/white/yellow/red)
- [ ] Query Convex for listing data aggregated by variation

### Phase 2: Data Integration
- [ ] Connect to live listing data
- [ ] Implement quantity aggregation per variation
- [ ] Calculate current prices per variation
- [ ] Track historical "last known price" data
- [ ] Update grid in real-time as market changes

### Phase 3: Polish & UX
- [ ] Build hover tooltip system
- [ ] Add smooth transitions between illumination states
- [ ] Optimize rendering performance
- [ ] Add loading states
- [ ] Implement visual grouping (heads/bodies/traits)
- [ ] Add section labels

### Phase 4: Advanced Features
- [ ] Click-to-filter functionality
- [ ] Search highlighting
- [ ] Animation effects
- [ ] Additional data visualizations

## Notes
- All 288 variations are defined in `/src/lib/completeVariationRarity.ts`
- This is a READ-ONLY view - no direct market actions from the grid
- Focus on performance - 288 dynamic elements need efficient rendering
- Consider debouncing hover events to reduce tooltip re-renders

## Questions to Resolve
- [ ] Exact quantity thresholds for color states (need market data analysis)
- [ ] Grid dimensions (e.g., 24x12, 18x16, etc.)
- [ ] Lightbulb visual style (pixel art, SVG, CSS-only?)
- [ ] How to handle "last known price" storage in Convex
- [ ] Should cells be clickable or hover-only?
