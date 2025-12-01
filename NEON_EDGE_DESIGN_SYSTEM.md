# NEON EDGE Design System
**Version 1.0 - Complete Specification for Consistent Card Implementations**

## Table of Contents
1. [Philosophy & Inspiration](#philosophy--inspiration)
2. [Color System](#color-system)
3. [Typography Scale](#typography-scale)
4. [Spacing System](#spacing-system)
5. [Effect Specifications](#effect-specifications)
6. [Component Templates](#component-templates)
7. [CSS Utility Classes](#css-utility-classes)
8. [Implementation Checklist](#implementation-checklist)
9. [Variations Guide](#variations-guide)
10. [Anti-Patterns](#anti-patterns)

---

## Philosophy & Inspiration

### What is NEON EDGE?
NEON EDGE is a minimalist, high-tech aesthetic that balances **intense glow effects** with **clean, readable information hierarchy**. It draws inspiration from:
- **Cyberpunk HUD displays** - Vibrant neons against deep blacks
- **Holographic interfaces** - Translucent layers with depth
- **Military readouts** - Precision typography and data density
- **Sci-fi terminals** - Glowing borders and atmospheric lighting

### Core Design Principles
1. **Glow as Structure** - Borders and accents use glowing effects, not just solid colors
2. **Extreme Contrast** - Pure blacks (black/40) against vibrant neons (cyan-400, yellow-400)
3. **Minimal Geometry** - Simple rectangles, no fancy shapes, let the glow do the work
4. **Hierarchy Through Intensity** - More important elements glow brighter
5. **Atmospheric Depth** - Gradient overlays create dimensionality without complexity

### When to Use NEON EDGE
- ✅ Data displays that need to feel futuristic and important
- ✅ Status cards for critical information (ranks, stats, IDs)
- ✅ UI elements that should "pop" without cluttering
- ✅ Designs where readability must coexist with visual impact
- ❌ Dense tables (too much glow becomes overwhelming)
- ❌ Large blocks of body text (glow is for accents, not paragraphs)

---

## Color System

### Primary Colors (Exact RGB Values)

**CYAN (Default Accent)**
- **Primary**: `rgb(0, 212, 255)` / `#00d4ff` - Tailwind: `cyan-400`
- **Dimmed**: `rgba(0, 212, 255, 0.6)` - Tailwind: `cyan-400/60`
- **Border**: `rgba(0, 212, 255, 0.5)` - Tailwind: `border-cyan-400/50`
- **Glow Outer**: `rgba(0, 212, 255, 0.3)`
- **Glow Inner**: `rgba(0, 212, 255, 0.1)`
- **Gradient**: `rgba(0, 212, 255, 0.4)` to `transparent`

**YELLOW (Alternate Accent)**
- **Primary**: `rgb(250, 182, 23)` / `#fab617` - Tailwind: `yellow-400`
- **Dimmed**: `rgba(250, 182, 23, 0.6)` - Tailwind: `yellow-400/60`
- **Border**: `rgba(250, 182, 23, 0.5)` - Tailwind: `border-yellow-400/50`
- **Glow Outer**: `rgba(250, 182, 23, 0.3)`
- **Glow Inner**: `rgba(250, 182, 23, 0.1)`
- **Gradient**: `rgba(250, 182, 23, 0.4)` to `transparent`

**BACKGROUNDS**
- **Card Base**: `rgba(0, 0, 0, 0.4)` - Tailwind: `bg-black/40`
- **Badge/Element**: `rgba(0, 0, 0, 0.6)` - Tailwind: `bg-black/60`
- **Transparent Layer**: `rgba(0, 0, 0, 0.2)` - Tailwind: `bg-black/20`

**TEXT**
- **Primary**: `rgb(255, 255, 255)` / `#ffffff` - Tailwind: `text-white`
- **Dimmed Labels**: `rgba(255, 255, 255, 0.4)` - Tailwind: `text-white/40`

### Color Usage Rules
1. **One accent color per card** - Never mix cyan and yellow in same card
2. **Accent for focal elements** - Use on rank numbers, important data
3. **White for readable data** - Use for body text, secondary info
4. **Dimmed white for labels** - Use for field names, categories
5. **Black for depth** - Use for backgrounds, badge overlays

### CSS Variables (Add to global-design-system.css)
```css
:root {
  /* NEON EDGE - Cyan Theme */
  --neon-cyan: rgb(0, 212, 255);
  --neon-cyan-dim: rgba(0, 212, 255, 0.6);
  --neon-cyan-border: rgba(0, 212, 255, 0.5);
  --neon-cyan-glow-outer: rgba(0, 212, 255, 0.3);
  --neon-cyan-glow-inner: rgba(0, 212, 255, 0.1);
  --neon-cyan-gradient: rgba(0, 212, 255, 0.4);

  /* NEON EDGE - Yellow Theme */
  --neon-yellow: rgb(250, 182, 23);
  --neon-yellow-dim: rgba(250, 182, 23, 0.6);
  --neon-yellow-border: rgba(250, 182, 23, 0.5);
  --neon-yellow-glow-outer: rgba(250, 182, 23, 0.3);
  --neon-yellow-glow-inner: rgba(250, 182, 23, 0.1);
  --neon-yellow-gradient: rgba(250, 182, 23, 0.4);

  /* NEON EDGE - Backgrounds */
  --neon-bg-card: rgba(0, 0, 0, 0.4);
  --neon-bg-badge: rgba(0, 0, 0, 0.6);
  --neon-bg-element: rgba(0, 0, 0, 0.2);

  /* NEON EDGE - Text */
  --neon-text-white: rgb(255, 255, 255);
  --neon-text-dim: rgba(255, 255, 255, 0.4);
}
```

---

## Typography Scale

### Font Families
**Primary Display Font**: `Saira Condensed`
- Used for: Hero numbers (rank, stats), data values, IDs
- Characteristics: Tall, condensed, futuristic, excellent readability at large sizes
- Weights: 200 (ultra-light for big numbers), 300 (light for smaller data)

**Secondary UI Font**: `Inter`
- Used for: Labels, categories, small text
- Characteristics: Clean, geometric, excellent at tiny sizes
- Weight: 400 (regular) only

### Exact Typography Specifications

#### HERO/FOCAL ELEMENTS (Rank, Main Stats)
- **Font**: Saira Condensed
- **Size**: `text-6xl` (60px / 3.75rem)
- **Weight**: 200 (ultra-light)
- **Line Height**: `leading-none` (1)
- **Letter Spacing**: `0.1em` (tracking-wider equivalent)
- **Color**: Accent color (cyan-400 or yellow-400)
- **Text Shadow**:
  - Primary: `0 0 20px [accent-rgb-full-opacity]`
  - Secondary: `0 0 40px [accent-rgb-50%-opacity]`
- **Margin Bottom**: `mb-2` (8px / 0.5rem)

**CSS Class**: `.neon-hero-text`
```css
.neon-hero-text {
  font-family: 'Saira Condensed', sans-serif;
  font-size: 3.75rem; /* 60px */
  font-weight: 200;
  line-height: 1;
  letter-spacing: 0.1em;
}

/* Cyan variant */
.neon-hero-text.cyan {
  color: rgb(0, 212, 255);
  text-shadow: 0 0 20px rgba(0, 212, 255, 1), 0 0 40px rgba(0, 212, 255, 0.5);
}

/* Yellow variant */
.neon-hero-text.yellow {
  color: rgb(250, 182, 23);
  text-shadow: 0 0 20px rgba(250, 182, 23, 1), 0 0 40px rgba(250, 182, 23, 0.5);
}
```

#### LABELS (Category Names, Field Titles)
- **Font**: Inter
- **Size**: `text-[10px]` (10px) OR `text-[9px]` (9px) for ultra-compact
- **Weight**: 400 (regular)
- **Line Height**: Default
- **Letter Spacing**: `tracking-[0.3em]` (ultra-wide) for 10px, `tracking-[0.2em]` for 9px
- **Color**: `text-white/40` (40% opacity white)
- **Transform**: UPPERCASE
- **Margin Bottom**: `mb-1` (4px / 0.25rem) when above data value

**CSS Class**: `.neon-label`
```css
.neon-label {
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  color: rgba(255, 255, 255, 0.4);
}

.neon-label-xs {
  font-size: 9px;
  letter-spacing: 0.2em;
}
```

#### DATA VALUES (Numbers, Text Data)
**Small Data (Mek #, Corporation)**
- **Font**: Saira Condensed (for numbers) OR Inter (for text)
- **Size**: `text-sm` (14px / 0.875rem) OR `text-xs` (12px / 0.75rem)
- **Weight**: 300 (light) for Saira, 400 (regular) for Inter
- **Color**: `text-white` (pure white)
- **Letter Spacing**: Default OR `tracking-wide` (0.025em) for IDs

**CSS Classes**: `.neon-data-small`
```css
.neon-data-small {
  font-family: 'Saira Condensed', sans-serif;
  font-size: 0.875rem; /* 14px */
  font-weight: 300;
  color: rgb(255, 255, 255);
}

.neon-data-small-text {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem; /* 12px */
  font-weight: 400;
  color: rgb(255, 255, 255);
}
```

#### BADGE TEXT (ID Numbers, Inline Data)
- **Font**: Saira Condensed
- **Size**: `text-sm` (14px / 0.875rem)
- **Weight**: 300 (light)
- **Color**: `text-white`
- **Letter Spacing**: `tracking-wider` (0.05em)

**CSS Class**: `.neon-badge-value`
```css
.neon-badge-value {
  font-family: 'Saira Condensed', sans-serif;
  font-size: 0.875rem; /* 14px */
  font-weight: 300;
  letter-spacing: 0.05em;
  color: rgb(255, 255, 255);
}
```

---

## Spacing System

### Container Padding
**Card Padding**: `p-6` (24px / 1.5rem all sides)
- This is the STANDARD padding for all NEON EDGE cards
- Provides breathing room for glow effects
- Never use less than `p-5` (20px) or glow gets cut off

### Section Gaps (space-y)
**Primary Content Sections**: `space-y-4` (16px / 1rem vertical gap)
- Used between: Hero element → Divider → Data Grid → Badge
- Consistent rhythm throughout card

### Grid Spacing
**Data Grid**: `gap-4` (16px / 1rem)
- Used in `grid grid-cols-3 gap-4` for data fields
- Matches section spacing for visual consistency

### Margin Bottom on Labels
**Label → Value Gap**: `mb-1` (4px / 0.25rem)
- Small gap keeps label-value pairs visually grouped
- Used consistently on all category labels

### Badge Internal Spacing
**Badge Padding**: `px-4 py-2` (16px horizontal, 8px vertical)
- Provides comfortable touch target
- Balances with border width

**Badge Gap**: `gap-2` (8px / 0.5rem)
- Space between label and value inside badge

### CSS Variables for Spacing
```css
:root {
  /* NEON EDGE Spacing */
  --neon-card-padding: 1.5rem; /* 24px - p-6 */
  --neon-section-gap: 1rem; /* 16px - space-y-4, gap-4 */
  --neon-label-gap: 0.25rem; /* 4px - mb-1 */
  --neon-badge-padding-x: 1rem; /* 16px - px-4 */
  --neon-badge-padding-y: 0.5rem; /* 8px - py-2 */
  --neon-badge-gap: 0.5rem; /* 8px - gap-2 */
}
```

---

## Effect Specifications

### Glowing Border Effect
**Implementation**: Absolute positioned div with border + box-shadow + blur

**Structure**:
```tsx
<div className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
  style={{
    boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
    filter: 'blur(0.5px)'
  }}
/>
```

**Specifications**:
- **Border Width**: `border-2` (2px solid)
- **Border Color**: `border-cyan-400/50` or `border-yellow-400/50` (50% opacity)
- **Outer Glow**: `box-shadow: 0 0 30px rgba(accent, 0.3)`
  - No offset (0 0)
  - 30px blur radius
  - 30% opacity accent color
- **Inner Glow**: `inset 0 0 30px rgba(accent, 0.1)`
  - Inset shadow
  - 30px blur radius
  - 10% opacity accent color
- **Blur Filter**: `filter: blur(0.5px)` - Softens edge slightly
- **Pointer Events**: `pointer-events-none` - Allows click-through

**CSS Class**: `.neon-glow-border`
```css
.neon-glow-border {
  position: absolute;
  inset: 0;
  border: 2px solid;
  pointer-events: none;
  filter: blur(0.5px);
}

.neon-glow-border.cyan {
  border-color: rgba(0, 212, 255, 0.5);
  box-shadow:
    0 0 30px rgba(0, 212, 255, 0.3),
    inset 0 0 30px rgba(0, 212, 255, 0.1);
}

.neon-glow-border.yellow {
  border-color: rgba(250, 182, 23, 0.5);
  box-shadow:
    0 0 30px rgba(250, 182, 23, 0.3),
    inset 0 0 30px rgba(250, 182, 23, 0.1);
}
```

### Gradient Overlay Accent
**Purpose**: Adds atmospheric glow at top of card

**Structure**:
```tsx
<div className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
  style={{
    background: `linear-gradient(180deg, ${accentGradient} 0%, transparent 100%)`
  }}
/>
```

**Specifications**:
- **Position**: Absolute, top-anchored
- **Height**: `h-24` (96px / 6rem)
- **Opacity**: `opacity-20` (20%)
- **Gradient Direction**: Top to bottom (180deg)
- **Start Color**: `rgba(accent, 0.4)` at 0%
- **End Color**: `transparent` at 100%

**CSS Class**: `.neon-gradient-overlay`
```css
.neon-gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6rem; /* 96px */
  opacity: 0.2;
  pointer-events: none;
}

.neon-gradient-overlay.cyan {
  background: linear-gradient(180deg, rgba(0, 212, 255, 0.4) 0%, transparent 100%);
}

.neon-gradient-overlay.yellow {
  background: linear-gradient(180deg, rgba(250, 182, 23, 0.4) 0%, transparent 100%);
}
```

### Glowing Divider Line
**Purpose**: Separates sections with atmospheric effect

**Structure**:
```tsx
<div className="relative h-px">
  <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${viaColor} to-transparent`}
    style={{ filter: 'blur(1px)' }}
  />
</div>
```

**Specifications**:
- **Container Height**: `h-px` (1px)
- **Gradient Direction**: Left to right
- **Start/End**: `transparent`
- **Middle**: `via-cyan-400` or `via-yellow-400` (full opacity accent)
- **Blur**: `filter: blur(1px)` - Creates soft glow effect

**CSS Class**: `.neon-divider`
```css
.neon-divider {
  position: relative;
  height: 1px;
}

.neon-divider::after {
  content: '';
  position: absolute;
  inset: 0;
  filter: blur(1px);
}

.neon-divider.cyan::after {
  background: linear-gradient(90deg, transparent, rgb(0, 212, 255), transparent);
}

.neon-divider.yellow::after {
  background: linear-gradient(90deg, transparent, rgb(250, 182, 23), transparent);
}
```

### Backdrop Blur
**Card Background**: `backdrop-blur-sm` (4px blur)
- Blurs content behind card
- Creates depth separation
- Use with `bg-black/40` for proper translucency

---

## Component Templates

### Full NEON EDGE Card Template (Copy-Paste Ready)

```tsx
// NEON EDGE Card Component Template
// Replace variables with your actual data

// Color variables (set based on your theme)
const useYellowGlow = false; // Toggle between cyan and yellow
const accentColor = useYellowGlow ? 'text-yellow-400' : 'text-cyan-400';
const accentColorDim = useYellowGlow ? 'text-yellow-400/60' : 'text-cyan-400/60';
const borderColor = useYellowGlow ? 'border-yellow-400/50' : 'border-cyan-400/50';
const glowRgba = useYellowGlow ? 'rgba(250, 182, 23, 0.3)' : 'rgba(0, 212, 255, 0.3)';
const glowRgbaInset = useYellowGlow ? 'rgba(250, 182, 23, 0.1)' : 'rgba(0, 212, 255, 0.1)';
const gradientColor = useYellowGlow ? 'rgba(250, 182, 23, 0.4)' : 'rgba(0, 212, 255, 0.4)';
const viaColor = useYellowGlow ? 'via-yellow-400' : 'via-cyan-400';

return (
  <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
    {/* Glowing border effect */}
    <div
      className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
      style={{
        boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
        filter: 'blur(0.5px)'
      }}
    />

    {/* Gradient overlay accent */}
    <div
      className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
      style={{
        background: `linear-gradient(180deg, ${gradientColor} 0%, transparent 100%)`
      }}
    />

    <div className="relative z-10 space-y-4">
      {/* Hero/Focal Element - Massive and glowing */}
      <div className="text-center">
        <div
          className={`${accentColor} text-6xl leading-none mb-2`}
          style={{
            fontFamily: 'Saira Condensed',
            fontWeight: 200,
            textShadow: `0 0 20px ${useYellowGlow ? 'rgba(250, 182, 23, 1)' : 'rgba(0, 212, 255, 1)'}, 0 0 40px ${useYellowGlow ? 'rgba(250, 182, 23, 0.5)' : 'rgba(0, 212, 255, 0.5)'}`,
            letterSpacing: '0.1em'
          }}
        >
          {heroValue}
        </div>
        <div
          className={`text-[10px] ${accentColorDim} uppercase tracking-[0.3em]`}
          style={{ fontFamily: 'Inter', fontWeight: 400 }}
        >
          {heroLabel}
        </div>
      </div>

      {/* Horizontal divider with glow */}
      <div className="relative h-px">
        <div
          className={`absolute inset-0 bg-gradient-to-r from-transparent ${viaColor} to-transparent`}
          style={{ filter: 'blur(1px)' }}
        />
      </div>

      {/* Data fields in grid */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div
            className="text-[9px] text-white/40 uppercase mb-1"
            style={{ fontFamily: 'Inter', fontWeight: 400 }}
          >
            LABEL
          </div>
          <div
            className="text-white text-sm"
            style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
          >
            {dataValue1}
          </div>
        </div>
        <div className="col-span-2">
          <div
            className="text-[9px] text-white/40 uppercase mb-1"
            style={{ fontFamily: 'Inter', fontWeight: 400 }}
          >
            LABEL
          </div>
          <div
            className="text-white text-xs"
            style={{ fontFamily: 'Inter', fontWeight: 400 }}
          >
            {dataValue2}
          </div>
        </div>
      </div>

      {/* Badge element */}
      <div className="flex justify-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 bg-black/60 border ${borderColor} rounded-sm`}>
          <div
            className="text-[9px] text-white/40 uppercase"
            style={{ fontFamily: 'Inter', fontWeight: 400 }}
          >
            LABEL
          </div>
          <div
            className="text-white text-sm tracking-wider"
            style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
          >
            {badgeValue}
          </div>
        </div>
      </div>
    </div>
  </div>
);
```

### Simplified Template (Using CSS Classes)

```tsx
// Add these classes to global-design-system.css first (see CSS Utility Classes section)

return (
  <div className="neon-card">
    {/* Border and effects handled by CSS */}
    <div className={`neon-glow-border ${useYellowGlow ? 'yellow' : 'cyan'}`} />
    <div className={`neon-gradient-overlay ${useYellowGlow ? 'yellow' : 'cyan'}`} />

    <div className="relative z-10 space-y-4">
      {/* Hero Element */}
      <div className="text-center">
        <div className={`neon-hero-text ${useYellowGlow ? 'yellow' : 'cyan'}`}>
          {heroValue}
        </div>
        <div className="neon-label">{heroLabel}</div>
      </div>

      {/* Divider */}
      <div className={`neon-divider ${useYellowGlow ? 'yellow' : 'cyan'}`} />

      {/* Data Grid */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="neon-label-xs">LABEL</div>
          <div className="neon-data-small">{dataValue1}</div>
        </div>
        <div className="col-span-2">
          <div className="neon-label-xs">LABEL</div>
          <div className="neon-data-small-text">{dataValue2}</div>
        </div>
      </div>

      {/* Badge */}
      <div className="flex justify-center">
        <div className={`neon-badge ${useYellowGlow ? 'yellow' : 'cyan'}`}>
          <div className="neon-label-xs">LABEL</div>
          <div className="neon-badge-value">{badgeValue}</div>
        </div>
      </div>
    </div>
  </div>
);
```

---

## CSS Utility Classes

### Add to `/src/styles/global-design-system.css`

```css
/* ========================================
   NEON EDGE DESIGN SYSTEM
   Complete CSS Utilities
   ======================================== */

/* -------------------- Color Variables -------------------- */
:root {
  /* Cyan Theme */
  --neon-cyan: rgb(0, 212, 255);
  --neon-cyan-dim: rgba(0, 212, 255, 0.6);
  --neon-cyan-border: rgba(0, 212, 255, 0.5);
  --neon-cyan-glow-outer: rgba(0, 212, 255, 0.3);
  --neon-cyan-glow-inner: rgba(0, 212, 255, 0.1);
  --neon-cyan-gradient: rgba(0, 212, 255, 0.4);

  /* Yellow Theme */
  --neon-yellow: rgb(250, 182, 23);
  --neon-yellow-dim: rgba(250, 182, 23, 0.6);
  --neon-yellow-border: rgba(250, 182, 23, 0.5);
  --neon-yellow-glow-outer: rgba(250, 182, 23, 0.3);
  --neon-yellow-glow-inner: rgba(250, 182, 23, 0.1);
  --neon-yellow-gradient: rgba(250, 182, 23, 0.4);

  /* Backgrounds */
  --neon-bg-card: rgba(0, 0, 0, 0.4);
  --neon-bg-badge: rgba(0, 0, 0, 0.6);
  --neon-bg-element: rgba(0, 0, 0, 0.2);

  /* Text */
  --neon-text-white: rgb(255, 255, 255);
  --neon-text-dim: rgba(255, 255, 255, 0.4);

  /* Spacing */
  --neon-card-padding: 1.5rem; /* 24px */
  --neon-section-gap: 1rem; /* 16px */
  --neon-label-gap: 0.25rem; /* 4px */
  --neon-badge-padding-x: 1rem; /* 16px */
  --neon-badge-padding-y: 0.5rem; /* 8px */
  --neon-badge-gap: 0.5rem; /* 8px */
}

/* -------------------- Base Card -------------------- */
.neon-card {
  position: relative;
  padding: var(--neon-card-padding);
  background: var(--neon-bg-card);
  backdrop-filter: blur(4px);
  overflow: hidden;
}

/* -------------------- Typography -------------------- */
.neon-hero-text {
  font-family: 'Saira Condensed', sans-serif;
  font-size: 3.75rem; /* 60px */
  font-weight: 200;
  line-height: 1;
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
}

.neon-hero-text.cyan {
  color: var(--neon-cyan);
  text-shadow:
    0 0 20px var(--neon-cyan),
    0 0 40px var(--neon-cyan-glow-outer);
}

.neon-hero-text.yellow {
  color: var(--neon-yellow);
  text-shadow:
    0 0 20px var(--neon-yellow),
    0 0 40px var(--neon-yellow-glow-outer);
}

.neon-label {
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  color: var(--neon-text-dim);
  margin-bottom: var(--neon-label-gap);
}

.neon-label-xs {
  font-family: 'Inter', sans-serif;
  font-size: 9px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--neon-text-dim);
  margin-bottom: var(--neon-label-gap);
}

.neon-data-small {
  font-family: 'Saira Condensed', sans-serif;
  font-size: 0.875rem; /* 14px */
  font-weight: 300;
  color: var(--neon-text-white);
}

.neon-data-small-text {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem; /* 12px */
  font-weight: 400;
  color: var(--neon-text-white);
}

.neon-badge-value {
  font-family: 'Saira Condensed', sans-serif;
  font-size: 0.875rem; /* 14px */
  font-weight: 300;
  letter-spacing: 0.05em;
  color: var(--neon-text-white);
}

/* -------------------- Effects -------------------- */
.neon-glow-border {
  position: absolute;
  inset: 0;
  border: 2px solid;
  pointer-events: none;
  filter: blur(0.5px);
}

.neon-glow-border.cyan {
  border-color: var(--neon-cyan-border);
  box-shadow:
    0 0 30px var(--neon-cyan-glow-outer),
    inset 0 0 30px var(--neon-cyan-glow-inner);
}

.neon-glow-border.yellow {
  border-color: var(--neon-yellow-border);
  box-shadow:
    0 0 30px var(--neon-yellow-glow-outer),
    inset 0 0 30px var(--neon-yellow-glow-inner);
}

.neon-gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6rem; /* 96px */
  opacity: 0.2;
  pointer-events: none;
}

.neon-gradient-overlay.cyan {
  background: linear-gradient(180deg, var(--neon-cyan-gradient) 0%, transparent 100%);
}

.neon-gradient-overlay.yellow {
  background: linear-gradient(180deg, var(--neon-yellow-gradient) 0%, transparent 100%);
}

.neon-divider {
  position: relative;
  height: 1px;
}

.neon-divider::after {
  content: '';
  position: absolute;
  inset: 0;
  filter: blur(1px);
}

.neon-divider.cyan::after {
  background: linear-gradient(90deg, transparent, var(--neon-cyan), transparent);
}

.neon-divider.yellow::after {
  background: linear-gradient(90deg, transparent, var(--neon-yellow), transparent);
}

/* -------------------- Badge Component -------------------- */
.neon-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--neon-badge-gap);
  padding: var(--neon-badge-padding-y) var(--neon-badge-padding-x);
  background: var(--neon-bg-badge);
  border: 1px solid;
  border-radius: 2px;
}

.neon-badge.cyan {
  border-color: var(--neon-cyan-border);
}

.neon-badge.yellow {
  border-color: var(--neon-yellow-border);
}

/* -------------------- Layout Utilities -------------------- */
.neon-content-stack {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: var(--neon-section-gap);
}

.neon-data-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--neon-section-gap);
  text-align: center;
}
```

---

## Implementation Checklist

### For Designers/Developers Creating NEON EDGE Cards

**Before Starting**:
- [ ] Identify accent color (cyan or yellow)
- [ ] Determine hero/focal element (rank, stat, etc.)
- [ ] Plan data hierarchy (what's most important?)

**Container Setup**:
- [ ] Base container: `relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden`
- [ ] Padding is exactly `p-6` (24px)
- [ ] `overflow-hidden` prevents glow from bleeding outside

**Border Glow Effect**:
- [ ] Absolute positioned div with `inset-0`
- [ ] Border is exactly `border-2` (2px)
- [ ] Border color is `border-[accent]-400/50` (50% opacity)
- [ ] Box-shadow has BOTH outer and inner glow
  - Outer: `0 0 30px rgba(accent, 0.3)`
  - Inner: `inset 0 0 30px rgba(accent, 0.1)`
- [ ] Filter is `blur(0.5px)` (not 0, not 1px)
- [ ] Has `pointer-events-none`

**Gradient Overlay**:
- [ ] Absolute positioned at top: `top-0 left-0 right-0`
- [ ] Height is exactly `h-24` (96px)
- [ ] Opacity is exactly `opacity-20` (20%)
- [ ] Gradient uses `rgba(accent, 0.4)` to transparent
- [ ] Has `pointer-events-none`

**Content Container**:
- [ ] Wrapper has `relative z-10` to appear above effects
- [ ] Uses `space-y-4` for section gaps

**Hero Element**:
- [ ] Font: Saira Condensed, weight 200
- [ ] Size: `text-6xl` (60px)
- [ ] Color: Accent color (`text-[accent]-400`)
- [ ] Text shadow: Two layers (20px and 40px blur)
- [ ] Letter spacing: `0.1em`
- [ ] Margin bottom: `mb-2`

**Hero Label**:
- [ ] Font: Inter, weight 400
- [ ] Size: `text-[10px]` (10px)
- [ ] Color: Dimmed accent (`text-[accent]-400/60`)
- [ ] Uppercase with `tracking-[0.3em]`

**Divider**:
- [ ] Container: `relative h-px`
- [ ] Gradient: `absolute inset-0 bg-gradient-to-r from-transparent via-[accent]-400 to-transparent`
- [ ] Filter: `blur(1px)`

**Data Grid**:
- [ ] Grid: `grid-cols-3 gap-4 text-center`
- [ ] Labels: Font Inter, size 9px, color white/40, uppercase, tracking 0.2em
- [ ] Values: Font Saira Condensed (numbers) or Inter (text), size 12-14px, color white

**Badge**:
- [ ] Container: `inline-flex items-center gap-2 px-4 py-2`
- [ ] Background: `bg-black/60`
- [ ] Border: `border border-[accent]-400/50`
- [ ] Rounded: `rounded-sm` (small corner radius)
- [ ] Label and value follow same typography rules as data grid

**Final Verification**:
- [ ] All font sizes match specification exactly
- [ ] All spacing matches specification exactly
- [ ] Glow effects are visible but not overwhelming
- [ ] Text is readable against all backgrounds
- [ ] Card works on both dark and light environments
- [ ] No layout shift or overflow issues

---

## Variations Guide

### How to Adapt NEON EDGE for Different Card Types

#### Variation 1: Wide Card (Full Width Data)
**Use Case**: Dashboard stats, summary cards

**Modifications**:
- Keep all base styles
- Change grid: `grid-cols-4` or `grid-cols-5` instead of 3
- Increase card padding: `p-8` instead of `p-6` for desktop
- Hero element can be moved to left side with flex layout

**Example**:
```tsx
<div className="relative p-8 bg-black/40 backdrop-blur-sm overflow-hidden">
  {/* Same border/gradient effects */}
  <div className="relative z-10 flex items-center gap-8">
    <div className="neon-hero-text cyan">{heroValue}</div>
    <div className="neon-divider cyan flex-1" />
    <div className="neon-data-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
      {/* Data fields */}
    </div>
  </div>
</div>
```

#### Variation 2: Compact Card (Less Vertical Space)
**Use Case**: Lists, tables, dense layouts

**Modifications**:
- Reduce padding: `p-4` instead of `p-6`
- Reduce section gaps: `space-y-2` instead of `space-y-4`
- Smaller hero: `text-4xl` instead of `text-6xl`
- Reduce gradient overlay: `h-16` instead of `h-24`

**Keep Unchanged**:
- Border glow effect (same intensity)
- Label/value typography (readability critical)
- Color system (consistency)

#### Variation 3: Vertical Emphasis (Tall Card)
**Use Case**: Leaderboards, rankings, profiles

**Modifications**:
- Increase padding: `p-8` vertically
- Increase section gaps: `space-y-6`
- Larger hero: `text-7xl` or `text-8xl`
- Add multiple dividers between sections
- Stack data vertically instead of grid

**Example**:
```tsx
<div className="relative p-8 bg-black/40 backdrop-blur-sm overflow-hidden">
  {/* Same border/gradient effects */}
  <div className="relative z-10 space-y-6">
    <div className="neon-hero-text cyan">{rank}</div>
    <div className="neon-divider cyan" />
    <div className="text-center space-y-4">
      <div>
        <div className="neon-label-xs">LABEL 1</div>
        <div className="neon-data-small">{value1}</div>
      </div>
      <div>
        <div className="neon-label-xs">LABEL 2</div>
        <div className="neon-data-small">{value2}</div>
      </div>
    </div>
    <div className="neon-divider cyan" />
    <div className="neon-badge cyan">{/* Badge content */}</div>
  </div>
</div>
```

#### Variation 4: Multi-Badge Layout
**Use Case**: Multiple categories or tags

**Modifications**:
- Replace single badge with flex wrap container
- Multiple badges in row: `flex flex-wrap gap-2 justify-center`
- Each badge uses same styling as base badge

**Example**:
```tsx
<div className="flex flex-wrap gap-2 justify-center">
  <div className="neon-badge cyan">
    <span className="neon-label-xs">TYPE</span>
    <span className="neon-badge-value">{type}</span>
  </div>
  <div className="neon-badge cyan">
    <span className="neon-label-xs">LEVEL</span>
    <span className="neon-badge-value">{level}</span>
  </div>
  <div className="neon-badge cyan">
    <span className="neon-label-xs">TIER</span>
    <span className="neon-badge-value">{tier}</span>
  </div>
</div>
```

### Color Switching Guidelines

**Cyan vs Yellow Decision Tree**:
- **Use Cyan** for:
  - Tech/digital themes
  - Cool/calm information
  - Default choice when neutral
  - Stats, data, analytics

- **Use Yellow** for:
  - Energy/power themes
  - Warm/active information
  - Warnings or caution
  - Gold, currency, rewards

**Implementation**:
```typescript
// Centralize color logic with boolean flag
const useYellowGlow = category === 'rewards' || category === 'energy';

// Pass to all components
const themeClass = useYellowGlow ? 'yellow' : 'cyan';
```

---

## Anti-Patterns

### What NOT to Do

#### ❌ WRONG: Inconsistent Font Sizes
```tsx
// BAD - Random sizes
<div className="text-5xl">Rank</div>  // Should be text-6xl
<div className="text-[8px]">Label</div>  // Should be text-[9px] or text-[10px]
<div className="text-base">Data</div>  // Should be text-sm or text-xs
```

**Why It's Wrong**: Breaks visual consistency. Users notice size inconsistencies immediately.

**Fix**: Use exact sizes from Typography Scale section.

---

#### ❌ WRONG: Weak Glow Effects
```tsx
// BAD - Not enough glow
boxShadow: `0 0 10px ${glowRgba}`  // Should be 30px

// BAD - Wrong opacity
const glowRgba = 'rgba(0, 212, 255, 0.5)'  // Should be 0.3

// BAD - Missing inner glow
boxShadow: `0 0 30px ${glowRgba}`  // Should also have inset glow
```

**Why It's Wrong**: NEON EDGE aesthetic relies on strong, atmospheric glow. Weak glow looks timid.

**Fix**: Use exact box-shadow specifications (30px blur, 0.3 outer + 0.1 inner).

---

#### ❌ WRONG: Insufficient Padding
```tsx
// BAD - Too cramped
<div className="relative p-3 bg-black/40">  // Should be p-6

// BAD - Inconsistent
<div className="relative px-6 py-4 bg-black/40">  // Should be p-6 (equal all sides)
```

**Why It's Wrong**: Glow effects get cut off at edges. Content feels cramped. Inconsistent spacing breaks rhythm.

**Fix**: Always use `p-6` (24px) for standard cards. Use `p-4` or `p-8` for variations, but keep consistent within card.

---

#### ❌ WRONG: Mixing Accent Colors
```tsx
// BAD - Multiple accents in one card
<div className="text-cyan-400">{rank}</div>
<div className="text-yellow-400">{level}</div>  // Conflicting accent
<div className="border-purple-400">Badge</div>  // Third color!
```

**Why It's Wrong**: NEON EDGE uses ONE accent per card for focus. Multiple accents create visual chaos.

**Fix**: Pick cyan OR yellow for entire card. Use white/dimmed white for non-focal elements.

---

#### ❌ WRONG: No Backdrop Blur
```tsx
// BAD - Solid background
<div className="relative p-6 bg-black">  // Should be bg-black/40 backdrop-blur-sm

// BAD - Wrong opacity
<div className="relative p-6 bg-black/80 backdrop-blur-sm">  // Should be bg-black/40
```

**Why It's Wrong**: Loses translucent, holographic feel. Looks flat and heavy.

**Fix**: Always use `bg-black/40 backdrop-blur-sm` for base card. 40% opacity + 4px blur.

---

#### ❌ WRONG: Forgetting `pointer-events-none` on Effects
```tsx
// BAD - Effect layers block clicks
<div className="absolute inset-0 border-2">  // Missing pointer-events-none
```

**Why It's Wrong**: Effect layers cover content and block mouse interactions with buttons/links underneath.

**Fix**: Add `pointer-events-none` to ALL absolute positioned effect layers (borders, gradients, overlays).

---

#### ❌ WRONG: Weak Text Glow
```tsx
// BAD - Single shadow layer
textShadow: '0 0 10px rgba(0, 212, 255, 1)'  // Should have two layers

// BAD - Wrong blur size
textShadow: '0 0 5px rgba(0, 212, 255, 1), 0 0 10px rgba(0, 212, 255, 0.5)'  // Too small
```

**Why It's Wrong**: Hero text needs intense glow to match border glow. Single layer or small blur looks weak.

**Fix**: Use TWO shadow layers: `0 0 20px [full-opacity], 0 0 40px [half-opacity]`.

---

#### ❌ WRONG: Incorrect Border Blur
```tsx
// BAD - No blur
<div style={{ boxShadow: '...', filter: 'none' }} />  // Should have blur(0.5px)

// BAD - Too much blur
<div style={{ boxShadow: '...', filter: 'blur(2px)' }} />  // Should be blur(0.5px)
```

**Why It's Wrong**: Border glow needs subtle softening. No blur looks harsh, too much blur looks muddy.

**Fix**: Use exactly `filter: 'blur(0.5px)'` on border effect layer.

---

#### ❌ WRONG: Wrong Font Weights
```tsx
// BAD - Too heavy
<div style={{ fontFamily: 'Saira Condensed', fontWeight: 400 }}>Rank</div>  // Should be 200

// BAD - Too light for small text
<div style={{ fontFamily: 'Inter', fontWeight: 300 }}>Label</div>  // Should be 400
```

**Why It's Wrong**: Saira Condensed needs ultra-light (200) for large sizes to look futuristic. Inter needs regular (400) for readability at small sizes.

**Fix**: Saira Condensed = weight 200 (hero) or 300 (data). Inter = weight 400 always.

---

#### ❌ WRONG: Missing Letter Spacing
```tsx
// BAD - No tracking
<div className="text-[10px] uppercase">Label</div>  // Should have tracking-[0.3em]

// BAD - Wrong tracking
<div className="text-6xl tracking-tight">Rank</div>  // Should have tracking-wider
```

**Why It's Wrong**: Letter spacing is critical for futuristic feel. Labels need wide tracking, hero needs moderate tracking.

**Fix**: Labels = `tracking-[0.3em]` or `tracking-[0.2em]`. Hero = `letterSpacing: '0.1em'`.

---

#### ❌ WRONG: Forgetting Uppercase on Labels
```tsx
// BAD - Sentence case
<div className="neon-label">Category Name</div>  // Should be uppercase

// BAD - Using CSS
<div className="neon-label" style={{ textTransform: 'capitalize' }}>Label</div>  // Wrong transform
```

**Why It's Wrong**: Labels use uppercase for technical/military aesthetic. Other transforms break the style.

**Fix**: Always apply `text-transform: uppercase` OR manually type in UPPERCASE.

---

#### ❌ WRONG: Inconsistent Grid Gaps
```tsx
// BAD - Different gaps
<div className="grid grid-cols-3 gap-2">  // Should be gap-4
<div className="space-y-6">  // Should be space-y-4
```

**Why It's Wrong**: Visual rhythm breaks. User's eye expects consistent spacing.

**Fix**: Use `gap-4` and `space-y-4` (16px) throughout. Only change for specific variations.

---

#### ❌ WRONG: Overpowering Gradient Overlay
```tsx
// BAD - Too tall
<div className="h-48 opacity-20">  // Should be h-24

// BAD - Too opaque
<div className="h-24 opacity-50">  // Should be opacity-20

// BAD - Wrong gradient colors
background: 'linear-gradient(180deg, rgba(0, 212, 255, 1) 0%, transparent 100%)'  // Should be 0.4 opacity
```

**Why It's Wrong**: Gradient should be subtle atmospheric accent, not dominant feature. Too strong overpowers content.

**Fix**: Use `h-24 opacity-20` with gradient starting at `rgba(accent, 0.4)`.

---

### Quick Verification Test

**Before shipping, check these 5 things**:

1. **Hero text has double-glow**: Look at rank/stat in browser. Should see soft halo AND outer glow.

2. **Border glows evenly**: Look at all 4 edges. Glow should be consistent, not cut off.

3. **Labels are tiny and spaced out**: Category labels should be barely-readable uppercase with wide letter spacing.

4. **Gradient is subtle**: Top gradient should be barely visible. If it's obvious, it's too strong.

5. **Spacing is consistent**: Use ruler tool in DevTools. All gaps should be multiples of 4px (Tailwind's spacing scale).

If all 5 pass, your NEON EDGE card is spec-compliant.

---

## Quick Reference Summary

### THE 5 GOLDEN RULES OF NEON EDGE

1. **ONE ACCENT, FULL INTENSITY**: Pick cyan OR yellow. Use full strength glow (30px blur, 20px+40px text shadow).

2. **EXACT TYPOGRAPHY**: Hero = Saira 200 @ 60px. Labels = Inter 400 @ 9-10px. Data = Saira 300 @ 12-14px.

3. **CONSISTENT SPACING**: Card padding = 24px. Section gaps = 16px. Label gap = 4px. Badge padding = 16px/8px.

4. **DOUBLE GLOW EVERYTHING**: Borders = outer + inner. Text = primary + secondary. Dividers = blur filter.

5. **TRANSLUCENT DEPTH**: Background = black/40. Badge = black/60. Overlay = 20% opacity. Backdrop blur = 4px.

---

### Copy-Paste Variable Block

```typescript
// NEON EDGE Color Variables - Copy this to every NEON EDGE component
const useYellowGlow = false; // Toggle: false = cyan, true = yellow

const accentColor = useYellowGlow ? 'text-yellow-400' : 'text-cyan-400';
const accentColorDim = useYellowGlow ? 'text-yellow-400/60' : 'text-cyan-400/60';
const borderColor = useYellowGlow ? 'border-yellow-400/50' : 'border-cyan-400/50';
const glowRgba = useYellowGlow ? 'rgba(250, 182, 23, 0.3)' : 'rgba(0, 212, 255, 0.3)';
const glowRgbaInset = useYellowGlow ? 'rgba(250, 182, 23, 0.1)' : 'rgba(0, 212, 255, 0.1)';
const gradientColor = useYellowGlow ? 'rgba(250, 182, 23, 0.4)' : 'rgba(0, 212, 255, 0.4)';
const viaColor = useYellowGlow ? 'via-yellow-400' : 'via-cyan-400';
const textShadowColor = useYellowGlow
  ? '0 0 20px rgba(250, 182, 23, 1), 0 0 40px rgba(250, 182, 23, 0.5)'
  : '0 0 20px rgba(0, 212, 255, 1), 0 0 40px rgba(0, 212, 255, 0.5)';
```

---

## Version History

**Version 1.0** - Initial comprehensive specification
- Complete color system with exact RGB values
- Full typography scale with pixel-perfect measurements
- Spacing system with Tailwind mappings
- Effect specifications with code examples
- Copy-paste component templates
- CSS utility classes for rapid implementation
- Implementation checklist for verification
- Variations guide for adaptations
- Anti-patterns section with fixes

---

**Document Maintained By**: Design System Team
**Last Updated**: Session Date
**Reference Implementation**: `MekProfileLightbox.tsx` lines 680-760
**Related Documents**: `FUTURISTIC_UI_DESIGN_AGENT.md`, `global-design-system.css`

---

## Need Help?

**Common Questions**:

Q: *"Can I use a different font?"*
A: No. Saira Condensed + Inter are core to NEON EDGE aesthetic. Different fonts = different style.

Q: *"Can I make the glow weaker for readability?"*
A: Glow is already calibrated for readability. If content is hard to read, check background opacity (should be black/40, not black/80) and text color (should be pure white, not gray).

Q: *"What if my card needs more data fields?"*
A: Increase grid columns (`grid-cols-4` or `grid-cols-5`). Keep all other specs the same. See Variations Guide.

Q: *"Can I mix cyan and yellow for different importance levels?"*
A: NO. One accent per card. Use white for secondary elements, dimmed white for tertiary. Importance = size/glow intensity, not color changes.

Q: *"Do I need to follow this EXACTLY?"*
A: YES for consistency. These specs ensure all NEON EDGE cards look like a cohesive design system. Deviations create visual fragmentation.

---

**END OF SPECIFICATION**
