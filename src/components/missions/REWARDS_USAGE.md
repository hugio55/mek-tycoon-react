# Standardized Mission Rewards - Usage Guide

## Overview
The `StandardizedMissionRewards` component ensures all mission cards display exactly 6 reward slots for visual consistency, filling empty slots with industrial-styled placeholders.

## Features
- Always displays exactly 6 slots (filled + empty)
- Three display variants: grid, list, compact
- Industrial sci-fi aesthetic with yellow/amber accents
- Visual differentiation between filled and empty slots
- Automatic rarity color coding based on drop rates

## Basic Usage

```tsx
import StandardizedMissionRewards from '@/components/missions/StandardizedMissionRewards';

// Your mission rewards data (can be 1-6 items)
const missionRewards = [
  { id: 1, name: "Power Chip", amount: 2, dropChance: 75, icon: "💾" },
  { id: 2, name: "Essence", amount: 1, dropChance: 30, image: "/essence.png" },
  { id: 3, name: "Rare Item", amount: 1, dropChance: 5, icon: "💎" }
];

// Component will automatically add 3 empty slots to reach 6 total
<StandardizedMissionRewards 
  rewards={missionRewards}
  variant="grid"
  showDropRates={true}
/>
```

## Variants

### Grid Variant (2x3 layout)
```tsx
<StandardizedMissionRewards 
  rewards={rewards}
  variant="grid"
  className="mb-4"
/>
```
Best for: Mission detail cards, larger card layouts

### List Variant (vertical stack)
```tsx
<StandardizedMissionRewards 
  rewards={rewards}
  variant="list"
  className="mb-4"
/>
```
Best for: Sidebar displays, narrow columns

### Compact Variant (horizontal pills)
```tsx
<StandardizedMissionRewards 
  rewards={rewards}
  variant="compact"
  className="mb-2"
/>
```
Best for: Overview cards, space-constrained layouts

## Styling Guide

### Color Coding by Drop Rate
- **100%**: Green with "GUARANTEED" badge (pulsing animation)
- **75-99%**: Green with "COMMON" badge
- **50-74%**: Yellow with "UNCOMMON" badge  
- **25-49%**: Orange with "RARE" badge
- **10-24%**: Red with "EPIC" badge
- **<10%**: Purple with "LEGENDARY" badge

### Empty Slot Styling
Empty slots feature:
- Darker background (`bg-black/20`)
- Dashed border (`border-gray-800/50`)
- "EMPTY" text with slot number
- Subtle diagonal stripe pattern
- 40% opacity for clear differentiation

### Custom CSS Classes Available
```css
/* Use these in your custom styling */
.mek-reward-slot-filled    /* Filled slot container */
.mek-reward-slot-empty     /* Empty slot container */
.mek-reward-legendary      /* Purple text with glow */
.mek-reward-epic          /* Red text with glow */
.mek-reward-rare          /* Orange text with glow */
.mek-reward-uncommon      /* Yellow text with glow */
.mek-reward-common        /* Green text with glow */
.mek-reward-guaranteed    /* Green with pulse animation */
```

## Integration Examples

### In Single Mission Cards
```tsx
<div className="mek-card-industrial mek-border-sharp-gold p-4">
  <h3 className="mek-text-industrial text-xl mb-3">Mission Alpha</h3>
  
  {/* Always shows 6 slots */}
  <StandardizedMissionRewards 
    rewards={mission.rewards}
    variant="grid"
    showDropRates={true}
  />
  
  {/* Rest of mission card content */}
</div>
```

### In Mission Lists
```tsx
{missions.map(mission => (
  <div key={mission.id} className="mission-card">
    {/* Compact view for list display */}
    <StandardizedMissionRewards 
      rewards={mission.rewards}
      variant="compact"
      showDropRates={false}
    />
  </div>
))}
```

## Responsive Behavior
- Grid variant: Maintains 3 columns on all screen sizes
- List variant: Full width with consistent spacing
- Compact variant: Wraps naturally, maintains minimum sizes

## Performance Notes
- Empty slots are lightweight (no images/data)
- Hover effects use CSS transitions (GPU accelerated)
- Industrial overlays use CSS patterns (no images)

## Visual Consistency Benefits
1. **Uniform Card Heights**: All mission cards have same reward section height
2. **Clear Information Hierarchy**: Users can quickly scan drop rates
3. **Industrial Aesthetic**: Maintains sci-fi theme across all states
4. **Predictable Layout**: 6 slots always = no layout shift