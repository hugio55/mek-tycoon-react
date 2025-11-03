# TenureDisplayZone - Admin Overlay Editor Integration Guide

## Overview

The **TenureDisplayZone** component is an industrial-themed tenure progress bar designed specifically for overlay display zones in the admin overlay editor. It shows Mek tenure progress with configurable size, style, and positioning.

## Quick Start

```tsx
import TenureDisplayZone from '@/components/ui/TenureDisplayZone';

<TenureDisplayZone
  currentTenure={67.5}
  maxTenure={100}
  size="medium"
  variant="standard"
  onLevelUp={() => console.log('Level up!')}
/>
```

## Component Files

- **Component**: `src/components/ui/TenureDisplayZone.tsx`
- **Examples**: `src/components/ui/TenureDisplayZone.example.tsx`
- **Demo Page**: `src/app/tenure-display-demo/page.tsx`

## Props Reference

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `currentTenure` | `number` | Current tenure accumulated |
| `maxTenure` | `number` | Maximum tenure threshold for level up |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onLevelUp` | `() => void` | - | Callback when Level Up button clicked |
| `showLevelUpButton` | `boolean` | `true` | Show Level Up button when ready? |
| `isSlotted` | `boolean` | `true` | Is Mek currently slotted? (greyed out if false) |
| `tenureRatePerDay` | `number` | - | Tenure rate per day (for display) |
| `isTenureBuffed` | `boolean` | `false` | Is tenure rate buffed? |
| `buffMultiplier` | `number` | - | Buff multiplier to display (e.g., 1.5 for 1.5x) |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Display size |
| `variant` | `'minimal' \| 'standard' \| 'detailed'` | `'standard'` | Visual style |
| `className` | `string` | `''` | Additional CSS classes |
| `style` | `React.CSSProperties` | `{}` | Inline styles (for positioning) |

## Size Variants

### Small (160px width)
```tsx
<TenureDisplayZone
  currentTenure={45}
  maxTenure={100}
  size="small"
/>
```
**Use case**: Compact displays, tight overlay spaces

### Medium (224px width) - Default
```tsx
<TenureDisplayZone
  currentTenure={67}
  maxTenure={100}
  size="medium"
/>
```
**Use case**: Standard slot displays, balanced detail

### Large (288px width)
```tsx
<TenureDisplayZone
  currentTenure={90}
  maxTenure={100}
  size="large"
/>
```
**Use case**: Featured displays, main UI elements

## Style Variants

### Minimal - Most Compact
```tsx
<TenureDisplayZone
  currentTenure={50}
  maxTenure={100}
  variant="minimal"
/>
```
**Includes**: Progress bar + numeric display + Level Up button
**Best for**: Tight spaces, minimal visual footprint

### Standard - Balanced (Default)
```tsx
<TenureDisplayZone
  currentTenure={75}
  maxTenure={100}
  variant="standard"
  isTenureBuffed={true}
  buffMultiplier={1.5}
/>
```
**Includes**: Labels, stats, grid background, buff indicator
**Best for**: Most use cases, good detail balance

### Detailed - Full Industrial
```tsx
<TenureDisplayZone
  currentTenure={100}
  maxTenure={100}
  variant="detailed"
  tenureRatePerDay={1.5}
  isTenureBuffed={true}
  buffMultiplier={2.0}
  onLevelUp={() => console.log('Level up!')}
/>
```
**Includes**: Hazard stripes, metal textures, scan lines, particles
**Best for**: Featured displays, maximum visual impact

## Functional States

### 1. Accumulating (0-99%)
Progress bar filling, no button yet
```tsx
<TenureDisplayZone
  currentTenure={67.3}
  maxTenure={100}
  tenureRatePerDay={1.2}
/>
```

### 2. Ready (100%)
Bar complete, Level Up button active with glow + particle effects
```tsx
<TenureDisplayZone
  currentTenure={100}
  maxTenure={100}
  onLevelUp={() => {
    // Trigger Convex mutation to level up Mek
  }}
/>
```

### 3. Not Slotted
Greyed out, no interactions
```tsx
<TenureDisplayZone
  currentTenure={30}
  maxTenure={100}
  isSlotted={false}
/>
```

### 4. Buffed
Green lightning icon + buff multiplier displayed
```tsx
<TenureDisplayZone
  currentTenure={80}
  maxTenure={100}
  isTenureBuffed={true}
  buffMultiplier={1.5}
  tenureRatePerDay={1.8}
/>
```

## Overlay Editor Integration

### Basic Overlay Positioning

```tsx
// Position in top-left corner of slot artwork
<TenureDisplayZone
  currentTenure={mekData.currentTenure}
  maxTenure={mekData.maxTenure}
  style={{
    position: 'absolute',
    top: '10px',
    left: '10px'
  }}
/>
```

### Advanced Positioning Examples

```tsx
// Top-right corner
style={{ position: 'absolute', top: '10px', right: '10px' }}

// Bottom-center (horizontal centering)
style={{
  position: 'absolute',
  bottom: '20px',
  left: '50%',
  transform: 'translateX(-50%)'
}}

// Center of slot (both axes)
style={{
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)'
}}

// Custom scale
style={{
  position: 'absolute',
  top: '10px',
  left: '10px',
  transform: 'scale(0.85)' // 85% size
}}
```

### Full Integration with Display Zone Config

```tsx
interface DisplayZoneConfig {
  id: string;
  type: 'TENURE_PROGRESS';
  x: number;          // Position X (pixels or %)
  y: number;          // Position Y (pixels or %)
  scale: number;      // Scale multiplier (0.5 - 2.0)
  size: 'small' | 'medium' | 'large';
  variant: 'minimal' | 'standard' | 'detailed';
}

// Example usage
function SlotOverlay({ displayZone, mekData }) {
  return (
    <TenureDisplayZone
      currentTenure={mekData.currentTenure}
      maxTenure={mekData.maxTenure}
      size={displayZone.size}
      variant={displayZone.variant}
      isTenureBuffed={mekData.isTenureBuffed}
      buffMultiplier={mekData.buffMultiplier}
      tenureRatePerDay={mekData.tenureRatePerDay}
      onLevelUp={() => {
        // Convex mutation to level up
        levelUpMek({ mekId: mekData._id });
      }}
      style={{
        position: 'absolute',
        left: `${displayZone.x}px`,
        top: `${displayZone.y}px`,
        transform: `scale(${displayZone.scale})`
      }}
    />
  );
}
```

## Convex Integration Example

```tsx
'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import TenureDisplayZone from '@/components/ui/TenureDisplayZone';

function MekSlotWithTenure({ mekId, displayZoneConfig }) {
  // Query Mek data
  const mek = useQuery(api.meks.getMekById, { mekId });

  // Level up mutation
  const levelUpMek = useMutation(api.meks.levelUpMek);

  if (!mek) return <div>Loading...</div>;

  return (
    <div className="relative">
      {/* Slot artwork */}
      <img src={`/mek-images/150px/${mek.sourceKey}.webp`} alt="Mek" />

      {/* Overlaid tenure display */}
      <TenureDisplayZone
        currentTenure={mek.currentTenure}
        maxTenure={mek.maxTenure}
        size={displayZoneConfig.size}
        variant={displayZoneConfig.variant}
        isSlotted={true}
        isTenureBuffed={mek.tenureBuffMultiplier > 1}
        buffMultiplier={mek.tenureBuffMultiplier}
        tenureRatePerDay={mek.tenureRatePerDay}
        onLevelUp={async () => {
          await levelUpMek({ mekId: mek._id });
        }}
        style={{
          position: 'absolute',
          left: `${displayZoneConfig.x}px`,
          top: `${displayZoneConfig.y}px`,
          transform: `scale(${displayZoneConfig.scale})`
        }}
      />
    </div>
  );
}
```

## Visual Effects Summary

### Shimmer Animation
- Always present on progress fill
- 2-3 second cycle
- Adds depth and "alive" feeling

### Particle Sweep (100% only)
- Animated light particles moving across bar
- Indicates ready state
- 2-3 second cycle with delays

### Scan Line (100% only)
- Thin horizontal line sweeping vertically
- Classic sci-fi effect
- 3 second cycle

### Pulsing Glow (Level Up button)
- Button glows and pulses when ready
- Yellow/gold glow effect
- Attracts attention to action

### Metal Scratches (Detailed variant)
- Diagonal scratch overlays
- Adds grunge/industrial feel
- Subtle, doesn't obscure info

### Hazard Stripes (Detailed variant)
- Black and yellow diagonal stripes
- Industrial warning aesthetic
- Background pattern only

## Accessibility Notes

### Color Contrast
- Yellow text on dark backgrounds meets WCAG AA
- Progress bar has sufficient contrast
- Button text (black on yellow) is highly readable

### Not Slotted State
- Uses opacity + grayscale for clear visual distinction
- Pointer events disabled (no accidental clicks)

### Button Accessibility
- Large click target
- Clear hover state
- High contrast
- Only appears when actionable

## Performance Considerations

### Animations
- Uses CSS animations (GPU accelerated)
- Transform and opacity only (no layout thrashing)
- Smooth 60fps on modern devices

### Rendering
- Component is lightweight
- No heavy dependencies
- Efficient re-renders

### Best Practices
- Use `variant="minimal"` for many simultaneous displays
- Use `variant="detailed"` for featured/hero displays only
- Scale via CSS transform, not size prop, for fine-tuning

## Responsive Sizing Strategy

```tsx
// Mobile: Use small size
<TenureDisplayZone size="small" variant="minimal" />

// Tablet: Use medium size
<TenureDisplayZone size="medium" variant="standard" />

// Desktop: Use large size for featured displays
<TenureDisplayZone size="large" variant="detailed" />

// Or use CSS transform for precise control
<TenureDisplayZone
  size="medium"
  style={{ transform: 'scale(0.75)' }} // 75% of medium
/>
```

## Common Patterns

### Pattern 1: Compact Slot Overlay
```tsx
<TenureDisplayZone
  currentTenure={mek.tenure}
  maxTenure={100}
  size="small"
  variant="minimal"
  style={{ position: 'absolute', top: '5px', left: '5px' }}
/>
```

### Pattern 2: Featured Display with All Info
```tsx
<TenureDisplayZone
  currentTenure={mek.tenure}
  maxTenure={mek.maxTenure}
  size="large"
  variant="detailed"
  tenureRatePerDay={mek.tenureRate}
  isTenureBuffed={mek.tenureBuffMultiplier > 1}
  buffMultiplier={mek.tenureBuffMultiplier}
  onLevelUp={() => levelUp(mek._id)}
  style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)' }}
/>
```

### Pattern 3: Multi-Slot Grid
```tsx
{slots.map(slot => (
  <div key={slot.id} className="relative">
    <SlotArtwork slot={slot} />
    <TenureDisplayZone
      currentTenure={slot.mek.tenure}
      maxTenure={slot.mek.maxTenure}
      size="small"
      variant="minimal"
      isSlotted={!!slot.mek}
      onLevelUp={() => levelUp(slot.mek._id)}
      style={{ position: 'absolute', bottom: '10px', right: '10px' }}
    />
  </div>
))}
```

## Testing & Demo

View the full interactive demo at:
```
http://localhost:3200/tenure-display-demo
```

Demo includes:
- Interactive controls (sliders, toggles)
- All size variants
- All style variants
- All functional states
- Overlay positioning simulation
- Technical specifications

## Support

For questions or issues with this component:
1. Check the demo page for visual examples
2. Review the example file for code patterns
3. Consult the design system CSS for styling details

---

**Component Version**: 1.0
**Last Updated**: 2025-11-02
**Design System**: Mek Tycoon Industrial Theme
