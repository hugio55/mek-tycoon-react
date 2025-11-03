# Tenure Progress Bar Component

Industrial-themed tenure progress bar for Mek Tycoon, designed to match the game's military/industrial aesthetic with yellow/gold accents, sharp edges, and glass morphism effects.

## Component Location

**Component:** `src/components/ui/TenureProgressBar.tsx`
**Demo Page:** `http://localhost:3200/demo/tenure-progress`

## Features

### Visual Design
- **Industrial Aesthetic:** Sharp edges, metal frames, yellow/gold borders (#fab617)
- **Glass Morphism:** Backdrop blur effects and translucent backgrounds
- **Grunge Textures:** Metal scratches, hazard stripes (detailed style)
- **Orbitron Typography:** Uppercase, tracking-wider labels matching site theme

### Animations
- **Smooth Fill:** 700ms transitions as tenure accumulates
- **Shimmer Effects:** Moving highlights across progress bar
- **Particle Sweeps:** Animated particles when bar reaches 100%
- **Scan Lines:** Holographic scan effects (detailed style)
- **Pulsing Glow:** Animated Level Up button when complete

### Three Style Variants

#### 1. Default Style (`style="default"`)
Full-featured progress bar with percentage display, numeric values, and angled Level Up button.

**Best for:** Standard displays, profile pages, main UI elements

```tsx
<TenureProgressBar
  currentTenure={750}
  maxTenure={1000}
  onLevelUp={handleLevelUp}
  size="md"
  style="default"
/>
```

#### 2. Compact Style (`style="compact"`)
Minimal single-line design with inline button, perfect for slot displays.

**Best for:** Slot displays, tight spaces, embedded contexts

```tsx
<TenureProgressBar
  currentTenure={750}
  maxTenure={1000}
  onLevelUp={handleLevelUp}
  size="sm"
  style="compact"
/>
```

#### 3. Detailed Style (`style="detailed"`)
Premium industrial design with hazard stripes, metal scratches, scan lines, and particle effects.

**Best for:** Featured displays, hero elements, important UI sections

```tsx
<TenureProgressBar
  currentTenure={750}
  maxTenure={1000}
  onLevelUp={handleLevelUp}
  size="lg"
  style="detailed"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentTenure` | `number` | - | Current tenure value (required) |
| `maxTenure` | `number` | - | Maximum tenure for level up (required) |
| `onLevelUp` | `() => void` | `undefined` | Callback when Level Up button clicked |
| `showLevelUpButton` | `boolean` | `true` | Show/hide Level Up button when complete |
| `className` | `string` | `''` | Additional CSS classes |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant |
| `style` | `'default' \| 'compact' \| 'detailed'` | `'default'` | Visual style variant |

## Size Reference

### Small (`size="sm"`)
- **Container Height:** 8 (2rem)
- **Bar Height:** 5 (1.25rem)
- **Font Size:** text-xs
- **Best For:** Compact slots, list items, minimal displays

### Medium (`size="md"`)
- **Container Height:** 12 (3rem)
- **Bar Height:** 7 (1.75rem)
- **Font Size:** text-sm
- **Best For:** Standard UI elements, profile sections

### Large (`size="lg"`)
- **Container Height:** 16 (4rem)
- **Bar Height:** 9 (2.25rem)
- **Font Size:** text-base
- **Best For:** Featured displays, hero elements, emphasis

## Usage Examples

### Basic Usage
```tsx
import TenureProgressBar from '@/components/ui/TenureProgressBar';

function MekProfile() {
  const [tenure, setTenure] = useState(850);

  const handleLevelUp = () => {
    console.log('Mek leveled up!');
    setTenure(0); // Reset tenure
  };

  return (
    <TenureProgressBar
      currentTenure={tenure}
      maxTenure={1000}
      onLevelUp={handleLevelUp}
    />
  );
}
```

### In Slot Display Zone
```tsx
<div className="mek-slot-filled p-4">
  <TenureProgressBar
    currentTenure={mek.tenure}
    maxTenure={mek.nextLevelTenure}
    onLevelUp={() => levelUpMek(mek.id)}
    size="sm"
    style="compact"
  />
</div>
```

### Without Level Up Button
```tsx
<TenureProgressBar
  currentTenure={mek.tenure}
  maxTenure={mek.nextLevelTenure}
  showLevelUpButton={false}
  size="sm"
  style="default"
/>
```

### With Custom Classes
```tsx
<TenureProgressBar
  currentTenure={tenure}
  maxTenure={maxTenure}
  onLevelUp={handleLevelUp}
  className="mt-4 mb-6"
  size="md"
  style="detailed"
/>
```

## Integration with Admin Master Data Overlay

To integrate with the display zone editor:

### 1. Add Tenure Zone Type
```typescript
// In admin overlay types
type DisplayZoneType =
  | 'mek_image'
  | 'mek_name'
  | 'tenure_progress'  // NEW
  | ...;
```

### 2. Render in Display Zone
```tsx
// In display zone renderer
{zone.type === 'tenure_progress' && (
  <TenureProgressBar
    currentTenure={selectedMek?.tenure || 0}
    maxTenure={selectedMek?.nextLevelTenure || 1000}
    onLevelUp={() => handleLevelUp(selectedMek?.id)}
    size={zone.size || 'sm'}
    style={zone.style || 'compact'}
  />
)}
```

### 3. Zone Configuration
```typescript
{
  id: 'zone-tenure-1',
  type: 'tenure_progress',
  size: 'sm',           // Size variant
  style: 'compact',     // Style variant
  showButton: true,     // Show Level Up button
  x: 10,
  y: 200,
  width: 280,
  height: 40
}
```

## Design System Integration

This component uses the global design system from:
- **CSS:** `/src/styles/global-design-system.css`
- **Utils:** `/src/lib/design-system.ts`

### CSS Classes Used
- `.mek-card-industrial` - Industrial card background
- `.mek-border-sharp-gold` - Sharp gold borders
- `.mek-text-industrial` - Orbitron font, uppercase
- `.mek-button-primary` - Yellow angled buttons
- `.mek-overlay-scratches` - Metal scratch textures
- `.mek-success-bar-particles` - Particle animations

### Animations Used
- `mek-shimmer` - Shimmer sweep effect
- `mek-scan-line` - Vertical scan line
- `mek-pulse-yellow` - Pulsing glow effect

## Demo Page

Visit the demo page to see all variations in action:

**URL:** `http://localhost:3200/demo/tenure-progress`

**Features:**
- All three style variants (default, compact, detailed)
- All three size variants (sm, md, lg)
- Live auto-increment demonstration
- Manual control slider
- Quick-set buttons (0%, 75%, 100%)
- Slot integration examples
- Feature list and documentation

## Color Scheme

Matches the Mek Tycoon industrial theme:

| Element | Color | Usage |
|---------|-------|-------|
| Fill Gradient | #fab617 → #FFD700 | Progress bar fill |
| Border | rgba(250, 182, 23, 0.5) | Sharp industrial borders |
| Background | rgba(0, 0, 0, 0.6) | Bar container background |
| Text | #fab617 | Percentage and values |
| Button | #fab617 | Level Up button background |

## Performance

- **Hardware-accelerated animations:** Uses `transform` and `opacity` only
- **Smooth transitions:** 700ms cubic-bezier easing
- **Conditional effects:** Particle animations only when complete
- **Optimized renders:** React.memo potential for static props

## Accessibility

- Clear numeric values always visible
- Percentage display for visual progress indication
- High contrast yellow (#fab617) on dark backgrounds
- Readable text with drop shadows
- Keyboard-accessible Level Up button
- ARIA-compatible (add `aria-label` props as needed)

## Browser Compatibility

Tested on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Requires:
- CSS `backdrop-filter` support (95%+ browsers)
- CSS animations
- CSS clip-path (for angled buttons)

## Future Enhancements

Potential additions:
- Sound effects on level up
- Confetti/explosion particles on completion
- Tenure gain rate display
- Projected time to level up
- Animated level number transition
- Custom color themes per rarity
- Notification when 100% reached
