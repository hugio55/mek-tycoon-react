# NEON EDGE Design System

**The Ultimate Copy-Paste Design System for Consistent Futuristic UI**

---

## 🎯 Philosophy & Inspiration

**NEON EDGE** represents the pinnacle of cyberpunk-futuristic card design, combining:
- **Maximum visual impact** with glowing borders and intense text shadows
- **Minimal information density** - rank as hero element, supporting data compact
- **Atmospheric depth** through gradient overlays and blur effects
- **Professional restraint** - effects serve readability, not distraction

### Design Inspiration Sources
1. **ARWES Framework** (arwes.dev) - Glowing borders and sci-fi frame aesthetics
2. **NVIDIA RTX Pages** - Premium tech product presentation with neon accents
3. **Blade Runner 2049** - Atmospheric color grading with neon highlights
4. **Cyberpunk 2077 UI** - High-contrast data displays with glow effects
5. **Tron Legacy** - Minimalist forms with edge-lit lighting

---

## 🎨 Core Visual Identity

### Color Palette (Exact Values)

**Accent Colors (Dynamic)**
- Yellow Mode: `#fab617` (250, 182, 23) - Industrial/warning aesthetic
- Cyan Mode: `#00d4ff` (0, 212, 255) - Cyberpunk/tech aesthetic

**Text Colors**
```css
Primary Accent: text-yellow-400 / text-cyan-400
Dimmed Accent: text-yellow-400/60 / text-cyan-400/60
White Primary: text-white (for main values)
White Dimmed: text-white/40 (for labels)
```

**Border Colors**
```css
Primary Border: border-yellow-400/50 / border-cyan-400/50
Border Width: 2px
```

**Background Colors**
```css
Card Base: bg-black/40 with backdrop-blur-sm
Gradient Top Overlay: linear-gradient(180deg, accent 0%, transparent 100%)
  - Yellow: rgba(250, 182, 23, 0.4) → transparent
  - Cyan: rgba(0, 212, 255, 0.4) → transparent
```

### Glow Effects (Exact Values)

**Box Shadow (Border Glow)**
```css
box-shadow:
  0 0 30px rgba(250, 182, 23, 0.3),        /* Outer glow */
  inset 0 0 30px rgba(250, 182, 23, 0.1);  /* Inner glow */

/* With blur filter for softer edges */
filter: blur(0.5px);
```

**Text Shadow (Hero Rank)**
```css
text-shadow:
  0 0 20px rgba(250, 182, 23, 1),          /* Intense inner glow */
  0 0 40px rgba(250, 182, 23, 0.5);        /* Soft outer halo */
```

**Text Shadow (Divider Line)**
```css
/* Applied to gradient divider line */
filter: blur(1px);
```

### Typography Specifications

**Hero Rank Display**
- Font Family: `'Saira Condensed'` (Google Fonts - ultra-light condensed)
- Font Weight: `200` (ultra-thin for dramatic effect)
- Font Size: `text-6xl` (60px)
- Line Height: `leading-none`
- Letter Spacing: `0.1em` (wide tracking)
- Color: Accent color (yellow-400 or cyan-400)
- Text Shadow: Double-layer glow (see above)

**Labels (Small Uppercase)**
- Font Family: `'Inter'` (clean sans-serif)
- Font Weight: `400` (regular)
- Font Size: `text-[9px]` or `text-[10px]`
- Letter Spacing: `0.2em` to `0.3em` (very wide tracking)
- Text Transform: `uppercase`
- Color: `text-white/40` (subtle, non-distracting)

**Data Values (Supporting Info)**
- Font Family: `'Saira Condensed'` (matches rank aesthetic)
- Font Weight: `300` (light)
- Font Size: `text-sm` (14px) to `text-xs` (12px)
- Color: `text-white` (clean white for readability)

**Employee ID Badge**
- Font Family: `'Saira Condensed'`
- Font Weight: `300` (light)
- Font Size: `text-sm` (14px)
- Letter Spacing: `tracking-wider`
- Color: `text-white`

---

## 📐 Layout Structure & Spacing

### Container Specifications
```tsx
className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden"
```

**Breakdown:**
- `relative` - Enables absolute positioning for overlays
- `p-6` - 24px padding on all sides
- `bg-black/40` - 40% opacity black background
- `backdrop-blur-sm` - 4px backdrop blur for glass effect
- `overflow-hidden` - Contains absolutely positioned elements

### Border Container (Separate Layer)
```tsx
<div
  className="absolute inset-0 border-2 border-yellow-400/50 pointer-events-none"
  style={{
    boxShadow: `0 0 30px rgba(250, 182, 23, 0.3), inset 0 0 30px rgba(250, 182, 23, 0.1)`,
    filter: 'blur(0.5px)'
  }}
/>
```

**Why separate?** Allows filter effects on border without affecting content.

### Gradient Overlay (Top Accent)
```tsx
<div
  className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
  style={{
    background: `linear-gradient(180deg, rgba(250, 182, 23, 0.4) 0%, transparent 100%)`
  }}
/>
```

**Purpose:** Creates atmospheric "light source" feel from top of card.

### Content Layout (Z-Index Hierarchy)
```tsx
<div className="relative z-10 space-y-4">
  {/* Content here sits above overlays */}
</div>
```

**Spacing:**
- `space-y-4` - 16px vertical gap between sections
- Hero rank → Divider → Data grid → Employee badge

---

## 🧩 Component Templates

### Complete NEON EDGE Card (Copy-Paste Ready)

```tsx
// Dynamic color system (pass useYellowGlow prop)
const accentColor = useYellowGlow ? 'text-yellow-400' : 'text-cyan-400';
const accentColorDim = useYellowGlow ? 'text-yellow-400/60' : 'text-cyan-400/60';
const borderColor = useYellowGlow ? 'border-yellow-400/50' : 'border-cyan-400/50';
const glowRgba = useYellowGlow ? 'rgba(250, 182, 23, 0.3)' : 'rgba(0, 212, 255, 0.3)';
const glowRgbaInset = useYellowGlow ? 'rgba(250, 182, 23, 0.1)' : 'rgba(0, 212, 255, 0.1)';

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
        background: `linear-gradient(180deg, ${useYellowGlow ? 'rgba(250, 182, 23, 0.4)' : 'rgba(0, 212, 255, 0.4)'} 0%, transparent 100%)`
      }}
    />

    <div className="relative z-10 space-y-4">
      {/* Rank - Massive and glowing */}
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
          2985
        </div>
        <div className={`text-[10px] ${accentColorDim} uppercase tracking-[0.3em]`} style={{ fontFamily: 'Inter', fontWeight: 400 }}>
          RANK
        </div>
      </div>

      {/* Horizontal divider with glow */}
      <div className="relative h-px">
        <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${useYellowGlow ? 'via-yellow-400' : 'via-cyan-400'} to-transparent`} style={{ filter: 'blur(1px)' }} />
      </div>

      {/* Data fields in grid */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-[9px] text-white/40 uppercase mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
            MEK
          </div>
          <div className="text-white text-sm" style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}>
            #1234
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-[9px] text-white/40 uppercase mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
            CORPORATION
          </div>
          <div className="text-white text-xs" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
            Apex Industries
          </div>
        </div>
      </div>

      {/* Employee ID badge */}
      <div className="flex justify-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 bg-black/60 border ${borderColor} rounded-sm`}>
          <div className="text-[9px] text-white/40 uppercase" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
            ID
          </div>
          <div className="text-white text-sm tracking-wider" style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}>
            Golden Striker
          </div>
        </div>
      </div>
    </div>
  </div>
);
```

---

## 🎛️ Utility Classes & CSS Additions

Add these to your `global-design-system.css`:

```css
/* NEON EDGE Card Base */
.neon-edge-card {
  @apply relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden;
}

/* NEON EDGE Border Layer */
.neon-edge-border {
  @apply absolute inset-0 border-2 pointer-events-none;
  filter: blur(0.5px);
}

.neon-edge-border-yellow {
  @apply border-yellow-400/50;
  box-shadow:
    0 0 30px rgba(250, 182, 23, 0.3),
    inset 0 0 30px rgba(250, 182, 23, 0.1);
}

.neon-edge-border-cyan {
  @apply border-cyan-400/50;
  box-shadow:
    0 0 30px rgba(0, 212, 255, 0.3),
    inset 0 0 30px rgba(0, 212, 255, 0.1);
}

/* NEON EDGE Gradient Overlay */
.neon-edge-gradient-yellow {
  @apply absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none;
  background: linear-gradient(180deg, rgba(250, 182, 23, 0.4) 0%, transparent 100%);
}

.neon-edge-gradient-cyan {
  @apply absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none;
  background: linear-gradient(180deg, rgba(0, 212, 255, 0.4) 0%, transparent 100%);
}

/* NEON EDGE Hero Rank Text */
.neon-edge-hero-rank-yellow {
  @apply text-yellow-400 text-6xl leading-none;
  font-family: 'Saira Condensed', sans-serif;
  font-weight: 200;
  letter-spacing: 0.1em;
  text-shadow:
    0 0 20px rgba(250, 182, 23, 1),
    0 0 40px rgba(250, 182, 23, 0.5);
}

.neon-edge-hero-rank-cyan {
  @apply text-cyan-400 text-6xl leading-none;
  font-family: 'Saira Condensed', sans-serif;
  font-weight: 200;
  letter-spacing: 0.1em;
  text-shadow:
    0 0 20px rgba(0, 212, 255, 1),
    0 0 40px rgba(0, 212, 255, 0.5);
}

/* NEON EDGE Label Text */
.neon-edge-label {
  @apply text-white/40 uppercase;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  letter-spacing: 0.2em;
}

.neon-edge-label-xs {
  @apply text-[9px];
  letter-spacing: 0.3em;
}

.neon-edge-label-sm {
  @apply text-[10px];
  letter-spacing: 0.2em;
}

/* NEON EDGE Data Text */
.neon-edge-data {
  @apply text-white;
  font-family: 'Saira Condensed', sans-serif;
  font-weight: 300;
}

/* NEON EDGE Divider Line */
.neon-edge-divider-yellow {
  @apply absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400 to-transparent;
  filter: blur(1px);
}

.neon-edge-divider-cyan {
  @apply absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent;
  filter: blur(1px);
}

/* NEON EDGE Badge/Pill Container */
.neon-edge-badge {
  @apply inline-flex items-center gap-2 px-4 py-2 bg-black/60 rounded-sm;
}

.neon-edge-badge-yellow {
  @apply border border-yellow-400/50;
}

.neon-edge-badge-cyan {
  @apply border border-cyan-400/50;
}
```

---

## 📋 Quick Reference: When to Use Each Element

### Hero Rank Display
- **Use for:** Primary metric, main status indicator, level/tier display
- **Size:** `text-6xl` (60px) - dominates visual hierarchy
- **Placement:** Top center of card
- **Effect:** Double-layer text shadow for maximum glow

### Divider Line
- **Use for:** Separating hero element from supporting data
- **Style:** Gradient from transparent → accent → transparent
- **Effect:** 1px blur for soft glow
- **Placement:** Horizontal, full-width, between sections

### Data Grid (3-column)
- **Use for:** Supporting information (ID, category, secondary stats)
- **Layout:** `grid grid-cols-3 gap-4 text-center`
- **Column Span:** Use `col-span-2` for longer text like corporation names

### Badge/Pill Container
- **Use for:** Emphasized single data point (employee ID, username, status)
- **Style:** Inline-flex with border matching card border
- **Placement:** Bottom center, horizontally centered

---

## 🚫 Anti-Patterns (What NOT to Do)

### DON'T Over-Glow
```tsx
{/* ❌ BAD - Too much glow, unreadable */}
<div style={{
  textShadow: '0 0 50px rgba(250, 182, 23, 1), 0 0 100px rgba(250, 182, 23, 1)',
  boxShadow: '0 0 50px rgba(250, 182, 23, 1), inset 0 0 50px rgba(250, 182, 23, 1)'
}}>
  Completely washed out text
</div>

{/* ✅ GOOD - Balanced glow, legible */}
<div style={{
  textShadow: '0 0 20px rgba(250, 182, 23, 1), 0 0 40px rgba(250, 182, 23, 0.5)'
}}>
  Clear text with atmospheric glow
</div>
```

### DON'T Crowd the Hero
```tsx
{/* ❌ BAD - Multiple competing elements */}
<div className="text-center">
  <div className="text-6xl">2985</div>
  <div className="text-5xl">Level 50</div>
  <div className="text-4xl">Elite Tier</div>
</div>

{/* ✅ GOOD - One hero, supporting label */}
<div className="text-center">
  <div className="text-6xl">2985</div>
  <div className="text-[10px] text-white/40 uppercase">RANK</div>
</div>
```

### DON'T Mix Font Weights Incorrectly
```tsx
{/* ❌ BAD - Heavy font for hero (loses elegance) */}
<div style={{ fontFamily: 'Saira Condensed', fontWeight: 700 }}>
  2985
</div>

{/* ✅ GOOD - Ultra-light creates drama */}
<div style={{ fontFamily: 'Saira Condensed', fontWeight: 200 }}>
  2985
</div>
```

### DON'T Skip Backdrop Blur
```tsx
{/* ❌ BAD - Flat background, no depth */}
<div className="bg-black/40 p-6">
  Content
</div>

{/* ✅ GOOD - Glass morphism adds depth */}
<div className="bg-black/40 backdrop-blur-sm p-6">
  Content
</div>
```

---

## 🎓 Agent Instructions for Design Consistency

### When Creating NEON EDGE Components:

1. **Always use utility classes first** - Check `.neon-edge-*` classes before writing inline styles
2. **Maintain the 3-layer structure:**
   - Base container (`relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden`)
   - Border layer (absolute, `inset-0`, with glow effects)
   - Gradient overlay (absolute, top-aligned, `h-24 opacity-20`)
   - Content layer (relative, `z-10`)

3. **Respect the visual hierarchy:**
   - Hero element (rank/level/status) = `text-6xl`, ultra-light weight, intense glow
   - Labels = `text-[9px]` to `text-[10px]`, `text-white/40`, uppercase, wide tracking
   - Data values = `text-sm` to `text-xs`, `text-white`, light weight

4. **Use consistent spacing:**
   - Card padding: `p-6` (24px)
   - Vertical gaps: `space-y-4` (16px between sections)
   - Grid gaps: `gap-4` (16px between grid items)
   - Badge padding: `px-4 py-2` (16px horizontal, 8px vertical)

5. **Apply effects judiciously:**
   - Text shadow: Only on hero element
   - Box shadow: Only on border layer and badges
   - Blur: `blur(0.5px)` on borders, `blur(1px)` on divider lines
   - Opacity: `20%` for gradient overlays, `40%` for labels

6. **Color switching:**
   - Always provide `useYellowGlow` prop or equivalent boolean
   - Define color variables at component top (see template above)
   - Use ternary operators for dynamic color classes
   - Keep rgba values consistent with hex color definitions

7. **Font fallbacks:**
   - Primary: `'Saira Condensed', sans-serif`
   - Labels: `'Inter', sans-serif`
   - Never rely on single font without fallback

---

## 🔧 Implementation Checklist

Before marking a NEON EDGE component as complete:

- [ ] 3-layer structure implemented (container, border, gradient, content)
- [ ] Border layer has separate `div` with `absolute inset-0`
- [ ] Box shadow includes both outer glow and inset glow
- [ ] Border layer has `filter: blur(0.5px)`
- [ ] Gradient overlay is `h-24 opacity-20`
- [ ] Hero element uses `text-6xl` with font-weight `200`
- [ ] Hero text shadow has two layers (20px + 40px)
- [ ] Labels are `text-[9px]` or `text-[10px]` with wide letter-spacing
- [ ] All labels are uppercase
- [ ] Data values use `'Saira Condensed'` at weight `300`
- [ ] Color switching works (yellow ↔ cyan)
- [ ] Badge at bottom uses same border color as card border
- [ ] Spacing follows `p-6`, `space-y-4`, `gap-4` pattern
- [ ] No competing visual elements (only one hero per card)
- [ ] Backdrop blur applied to base container
- [ ] Z-index hierarchy correct (overlays behind content)

---

## 💡 Adaptation Guide

### For Different Data Types:

**Profile Cards** → Use full template as-is

**Status Displays** → Keep hero + divider, remove bottom badge

**Compact Widgets** → Use `text-4xl` hero, `p-4` container, single data row

**List Items** → Remove gradient overlay, use `text-3xl` hero, horizontal layout

### For Different Contexts:

**Dark Backgrounds** → Increase card `bg-black` opacity to 60% (`bg-black/60`)

**Light Backgrounds** → Add outer glow to card container for separation

**Small Screens** → Reduce hero to `text-5xl`, grid to 2 columns, `p-4` padding

**Large Screens** → Can increase hero to `text-7xl`, wider grid columns

---

## 📚 Related Design Systems

This document complements:
- `FUTURISTIC_UI_DESIGN_AGENT.md` - Broader futuristic design principles
- `global-design-system.css` - Industrial/yellow design system
- `MekProfileLightbox.tsx` - Reference implementation with 8 style variations

**When NEON EDGE doesn't fit:**
- Heavy data density → Use "Data Terminal" or "Matrix Grid" styles
- Industrial theme needed → Use yellow industrial card system
- Technical precision → Use "Corner Brackets" or "Tech Frame" styles

---

## 🎬 Final Notes

**NEON EDGE is about restraint and impact.** The design works because:
1. **One hero element dominates** - no competition for attention
2. **Effects enhance, don't obscure** - every glow serves readability
3. **Typography creates drama** - ultra-light weights with generous spacing
4. **Color is consistent** - yellow OR cyan, never mixed within one card
5. **Depth through layers** - glass morphism, overlays, shadows create 3D feel

**Use this system when:**
- You want maximum visual impact
- One metric/value is the primary focus
- Futuristic/cyberpunk aesthetic is desired
- Supporting data is secondary

**Consider alternatives when:**
- Multiple metrics need equal emphasis
- Dense information must be displayed
- Industrial/military aesthetic is preferred
- Accessibility requires higher contrast

---

**Remember:** Good design is consistent design. Copy-paste the templates, use the utility classes, follow the checklist. The user chose NEON EDGE because it's the BEST—now make sure every implementation is EXACTLY the same.
