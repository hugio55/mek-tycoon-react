# Mek Tycoon Design Patterns - Complete Visual Component Catalog

**Purpose:** Exhaustive reference of every design pattern, component archetype, and visual element in Mek Tycoon. Study this document BEFORE creating new components to ensure perfect consistency with the industrial design system.

---

## Design Philosophy & Visual Language

### Core Aesthetic Principles

**1. Industrial/Military Theme**
- Sharp geometric frames with angled corners
- Yellow/gold (#fab617) hazard striping patterns
- Utilitarian, functional design language
- Worn/aged appearance through grunge overlays
- High-tech meets industrial decay

**2. Glass-morphism & Translucency**
- Frosted glass effects via `backdrop-blur`
- Semi-transparent backgrounds (rgba with 0.02-0.1 alpha)
- Layered depth through multiple translucent planes
- Inset shadows for recessed glass appearance
- Light plays through surfaces

**3. Color Psychology**
- **Yellow/Gold**: Action, attention, value, premium
- **Blue**: Information, secondary actions, calm
- **Red**: Danger, epic rarity, critical warnings
- **Green**: Success, completion, common rarity
- **Purple**: Legendary, mystical, rare events
- **Orange**: Rare rarity, moderate warnings
- **Cyan**: High-tech, neon accents, special effects

**4. Typography as Interface**
- Headers are architectural elements (Orbitron, Bebas)
- Numbers are data readouts (bold, prominent)
- Labels are technical specifications (uppercase, tracking-wider)
- Monospace for code/technical data

**5. Interaction Design**
- Subtle hover effects (2px lift, glow intensify)
- Clear active states (scale, border change)
- Loading states preserve layout (skeleton, not spinners)
- Animations enhance, never distract
- Feedback is immediate and visual

---

## Complete Color Reference System

### Primary Palette (Yellow/Gold)

```css
/* Main Brand Yellow */
#fab617  /* Primary yellow-gold - USE THIS MOST */
  → Custom: text-[#fab617] or bg-[#fab617]
  → Closest Tailwind: yellow-400 (#facc15)
  → Usage: Primary buttons, main borders, value highlights

#ffc843  /* Lighter gold (hover states) */
  → Brighter variant for hover/active states
  → ~15% lighter than primary

#eab308  /* Standard gold (Tailwind yellow-500) */
  → Fallback when custom color not needed
  → Slightly more orange than #fab617

#ca8a04  /* Darker gold (Tailwind yellow-600) */
  → Dark mode text, muted accents
  → User preference: "darker gold"

#fef3c7  /* Very pale yellow (yellow-100) */
  → Light backgrounds, subtle tints
  → Use sparingly with low opacity

/* Opacity Modifiers */
rgba(250, 182, 23, 0.1)  → bg-[#fab617]/10  /* Subtle tints */
rgba(250, 182, 23, 0.2)  → bg-[#fab617]/20  /* Light highlights */
rgba(250, 182, 23, 0.3)  → bg-[#fab617]/30  /* Glows, shadows */
rgba(250, 182, 23, 0.5)  → bg-[#fab617]/50  /* Standard borders */
rgba(250, 182, 23, 0.8)  → bg-[#fab617]/80  /* Solid with slight transparency */
```

### Background Palette (Blacks & Grays)

```css
/* Pure Blacks */
#000000  /* Pure black */
  → bg-black
  → Usage: Overlays (bg-black/80), deep shadows

#0a0a0a  /* Near black */
  → Slightly lifted from pure black
  → Main page backgrounds

/* Zinc Scale (Primary Gray System) */
#09090b  /* zinc-950 - Darkest gray */
  → bg-zinc-950
  → Usage: Deepest backgrounds, intense dark areas

#18181b  /* zinc-900 - Very dark gray */
  → bg-zinc-900
  → Usage: Main container backgrounds, card bases

#27272a  /* zinc-800 - Dark gray */
  → bg-zinc-800
  → Usage: Elevated cards, input backgrounds, secondary containers

#3f3f46  /* zinc-700 - Medium dark gray */
  → bg-zinc-700
  → Usage: Borders, dividers, disabled backgrounds

#52525b  /* zinc-600 - Medium gray */
  → bg-zinc-600
  → Usage: Muted text, inactive elements

#71717a  /* zinc-500 - Gray */
  → bg-zinc-500
  → Usage: Secondary text, labels

#a1a1aa  /* zinc-400 - Light gray */
  → bg-zinc-400 or text-zinc-400
  → Usage: Labels, secondary text, placeholder text
  → VERY COMMON for muted text

#d4d4d8  /* zinc-300 - Lighter gray */
  → text-zinc-300
  → Usage: Primary body text, readable content

#e4e4e7  /* zinc-200 - Very light gray */
  → text-zinc-200
  → Usage: Headers, emphasized text

#f4f4f5  /* zinc-100 - Nearly white */
  → text-zinc-100
  → Usage: Highest contrast text (rare)

#ffffff  /* Pure white */
  → text-white
  → Usage: Maximal contrast (headers, values)
```

**Pattern:** Backgrounds get darker (900→950), text gets lighter (300→white)

### Accent Colors (Functional)

```css
/* Blue (Secondary Actions, Info) */
#3b82f6  /* blue-500 */
  → text-blue-500 or bg-blue-500
  → Usage: Secondary values, info badges, links

#60a5fa  /* blue-400 */
  → text-blue-400
  → Usage: .mek-value-secondary class, lighter blue accents

#2563eb  /* blue-600 */
  → Darker blue for emphasis

#93c5fd  /* blue-300 */
  → Light blue for glows

/* Green (Success, Completion, Common Rarity) */
#4ade80  /* green-400 */
  → text-green-400
  → Usage: Success states, common rarity items, completion

#22c55e  /* green-500 */
  → Standard green

#16a34a  /* green-600 */
  → Darker green for contrast

#86efac  /* green-300 */
  → Light green glows

/* Red (Errors, Danger, Epic Rarity) */
#ef4444  /* red-500 */
  → text-red-500 or bg-red-500
  → Usage: Errors, delete buttons, warnings

#f87171  /* red-400 */
  → text-red-400
  → Usage: Epic rarity glow

#dc2626  /* red-600 */
  → Darker red

#fca5a5  /* red-300 */
  → Light red for glows

/* Purple (Legendary Rarity, Premium) */
#8b5cf6  /* violet-500 */
  → text-violet-500
  → Usage: Legendary items

#a855f7  /* purple-500 */
  → text-purple-500
  → Alternative purple

#d8b4fe  /* purple-300 */
  → Light purple glows

#c084fc  /* purple-400 */
  → text-purple-400
  → Usage: .mek-reward-legendary

/* Orange (Rare Rarity, Warnings) */
#fb923c  /* orange-400 */
  → text-orange-400
  → Usage: Rare items, moderate warnings

#f97316  /* orange-500 */
  → Standard orange

#ea580c  /* orange-600 */
  → Darker orange

/* Cyan (Neon, High-Tech, Special) */
#22d3ee  /* cyan-400 */
  → text-cyan-400
  → Usage: Neon borders (.mek-border-neon), tech accents

#06b6d4  /* cyan-500 */
  → Standard cyan

#0891b2  /* cyan-600 */
  → Darker cyan
```

### Rarity Color System (Standardized)

```css
/* Legendary (Purple) */
.mek-reward-legendary
  color: #a855f7 (purple-400)
  text-shadow: 0 0 8px rgba(168, 85, 247, 0.5)

/* Epic (Red) */
.mek-reward-epic
  color: #f87171 (red-400)
  text-shadow: 0 0 8px rgba(248, 113, 113, 0.5)

/* Rare (Orange) */
.mek-reward-rare
  color: #fb923c (orange-400)
  text-shadow: 0 0 8px rgba(251, 146, 60, 0.5)

/* Uncommon (Yellow) */
.mek-reward-uncommon
  color: #facc15 (yellow-400)
  text-shadow: 0 0 8px rgba(250, 182, 23, 0.5)

/* Common (Green) */
.mek-reward-common
  color: #4ade80 (green-400)
  text-shadow: 0 0 8px rgba(74, 222, 128, 0.5)

/* Guaranteed (Green + Animation) */
.mek-reward-guaranteed
  color: #4ade80
  animation: mek-pulse-green 1.5s infinite
```

---

## Complete Typography System

### Font Stack Architecture

```typescript
// Font families defined in tailwind.config.ts
const fonts = {
  // Industrial/Tech Headers
  orbitron: ['Orbitron', 'monospace'],      // PRIMARY HEADER FONT
  michroma: ['Michroma', 'sans-serif'],     // Hero/title font
  audiowide: ['Audiowide', 'sans-serif'],   // Bold headers
  russo: ['Russo One', 'sans-serif'],       // Impact headers
  electrolize: ['Electrolize', 'sans-serif'], // Digital headers
  quantico: ['Quantico', 'sans-serif'],     // Military/tactical

  // Display/Condensed
  bebas: ['Bebas Neue', 'sans-serif'],      // Tall condensed
  teko: ['Teko', 'sans-serif'],             // Condensed tech
  saira: ['Saira Condensed', 'sans-serif'], // Condensed UI

  // Body/UI
  rajdhani: ['Rajdhani', 'sans-serif'],     // Readable UI
  exo: ['Exo 2', 'sans-serif'],             // Modern futuristic
};

// Usage in components:
<h1 className="font-orbitron">Title</h1>
<h2 className="font-bebas">Subtitle</h2>
<p className="font-rajdhani">Body text</p>
```

### Typography Scale & Hierarchy

```css
/* LEVEL 1: Hero/Page Title */
font-michroma text-4xl md:text-5xl lg:text-6xl font-bold uppercase
  tracking-widest text-[#fab617]
/* Usage: Main page titles, splash screens */
/* Size: 36px → 48px → 60px (responsive) */

/* LEVEL 2: Section Headers */
font-audiowide text-2xl md:text-3xl font-bold uppercase
  tracking-wider text-yellow-300
/* Usage: Major section dividers */
/* Size: 24px → 30px */

/* LEVEL 3: Card/Component Headers */
font-orbitron text-xl font-bold uppercase tracking-wide text-yellow-400
/* Usage: Mission cards, achievement titles, module headers */
/* Size: 20px */
/* MOST COMMON HEADER */

/* LEVEL 4: Subheaders */
font-orbitron text-lg font-semibold uppercase tracking-wide text-zinc-200
/* Usage: Subsections within cards */
/* Size: 18px */

/* LEVEL 5: Value Display (Primary) */
text-2xl md:text-3xl font-bold text-yellow-400
/* Usage: Gold amounts, main statistics */
/* Size: 24px → 30px */
/* Use .mek-value-primary class */

/* LEVEL 6: Value Display (Secondary) */
text-lg md:text-xl font-semibold text-blue-400
/* Usage: Secondary stats, percentages */
/* Size: 18px → 20px */
/* Use .mek-value-secondary class */

/* LEVEL 7: Body Text (Large) */
text-base font-normal text-zinc-300 leading-relaxed
/* Usage: Descriptions, explanations */
/* Size: 16px, line-height: 1.625 */

/* LEVEL 8: Body Text (Standard) */
text-sm font-normal text-zinc-300 leading-normal
/* Usage: Most content text */
/* Size: 14px, line-height: 1.5 */

/* LEVEL 9: Labels/Small Text */
text-xs font-medium text-zinc-400 uppercase tracking-wider
/* Usage: Field labels, metadata, timestamps */
/* Size: 12px */
/* Use .mek-label-uppercase class */

/* LEVEL 10: Tiny Text */
text-xs font-normal text-zinc-500
/* Usage: Fine print, helper text */
/* Size: 12px, no uppercase */
```

### Pre-Built Typography Classes

```css
/* From global-design-system.css */

.mek-text-industrial
  /* Industrial header style */
  font-family: 'Orbitron', 'Bebas Neue', sans-serif;
  font-weight: 700; /* font-bold */
  text-transform: uppercase;
  letter-spacing: 0.05em; /* tracking-wider */

  /* Usage: Apply to any header for instant industrial look */
  <h2 className="mek-text-industrial text-2xl">Title</h2>

.mek-value-primary
  /* Primary value display (gold numbers) */
  font-size: 1.5rem; /* text-2xl */
  font-weight: 700; /* font-bold */
  color: #facc15; /* text-yellow-400 */

  /* Usage: Gold counts, main stats */
  <div className="mek-value-primary">15,234</div>

.mek-value-secondary
  /* Secondary value display (blue numbers) */
  font-size: 1.125rem; /* text-lg */
  font-weight: 600; /* font-semibold */
  color: #60a5fa; /* text-blue-400 */

  /* Usage: Secondary stats, percentages */
  <div className="mek-value-secondary">85%</div>

.mek-label-uppercase
  /* Small label style */
  font-size: 0.75rem; /* text-xs */
  color: #a1a1aa; /* text-zinc-400 */
  text-transform: uppercase;
  letter-spacing: 0.05em; /* tracking-wider */
  font-weight: 500; /* font-medium */

  /* Usage: Field labels, metadata */
  <span className="mek-label-uppercase">Success Rate</span>

.mek-text-shadow
  /* Yellow glow text effect */
  text-shadow:
    0 0 10px rgba(250, 182, 23, 0.5),
    0 0 20px rgba(250, 182, 23, 0.3);

  /* Usage: Emphasize important text */
  <h1 className="mek-text-shadow text-yellow-400">ALERT</h1>
```

### Text Effect Classes

```css
/* Glow Effects (via text-shadow) */

.text-glow-yellow
  text-shadow: 0 0 8px rgba(250, 182, 23, 0.5);
  /* Apply to yellow text for subtle glow */

.text-glow-blue
  text-shadow: 0 0 8px rgba(96, 165, 250, 0.5);
  /* Apply to blue text */

.text-glow-green
  text-shadow: 0 0 8px rgba(74, 222, 128, 0.5);
  /* Apply to green text */

.text-glow-red
  text-shadow: 0 0 8px rgba(248, 113, 113, 0.5);
  /* Apply to red text */

.text-glow-purple
  text-shadow: 0 0 8px rgba(168, 85, 247, 0.5);
  /* Apply to purple text */

/* Usage Pattern: */
<span className="text-yellow-400 text-glow-yellow">Highlighted</span>
```

### Responsive Typography Patterns

```jsx
{/* Scale down on mobile */}
<h1 className="text-3xl md:text-4xl lg:text-5xl">
  {/* 30px → 36px → 48px */}
</h1>

{/* Truncate long text on mobile */}
<p className="text-base truncate md:text-clip">
  {/* Ellipsis on mobile, full text on tablet+ */}
</p>

{/* Tighter tracking on mobile */}
<h2 className="tracking-wide md:tracking-wider lg:tracking-widest">
  {/* Progressive letter spacing */}
</h2>

{/* Reduce padding in text on mobile */}
<p className="leading-normal md:leading-relaxed">
  {/* line-height: 1.5 → 1.625 */}
</p>
```

---

## Card Component Patterns (Exhaustive)

### 1. Industrial Card (Primary Pattern)

**File Reference:** `src/styles/global-design-system.css` lines 49-56

```css
/* CSS Definition */
.mek-card-industrial {
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(12px);
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.02) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.02) 100%);
  box-shadow: inset 0 0 40px rgba(255, 255, 255, 0.03);
}
```

**React Usage:**
```jsx
<div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6">
  <h3 className="mek-text-industrial text-xl mb-4">Card Title</h3>
  <p className="text-zinc-300 text-sm">Card content goes here...</p>
</div>
```

**Visual Breakdown:**
- **Background:** Translucent white gradient (2% → 5% → 2% opacity)
- **Blur:** 12px backdrop blur for glass effect
- **Shadow:** Inset shadow creates recessed appearance
- **Overflow:** Hidden to contain pseudo-elements

**When to Use:**
- Mission cards
- Achievement displays
- Stat containers
- Info panels
- Any primary content container

**Common Enhancements:**
```jsx
{/* Add grunge texture */}
<div className="mek-card-industrial mek-overlay-scratches mek-border-sharp-gold rounded-lg p-6">

{/* Add hover effect */}
<div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6
                hover:border-yellow-400 hover:shadow-[0_0_30px_rgba(250,182,23,0.2)]
                transition-all duration-300">

{/* Add glow */}
<div className="mek-card-industrial mek-border-sharp-gold mek-glow-yellow rounded-lg p-6">
```

### 2. Industrial Card Global (Gold Variant)

**File Reference:** `src/styles/global-design-system.css` lines 58-65

```css
/* CSS Definition */
.mek-card-industrial-global {
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(12px);
  background: linear-gradient(135deg,
    rgba(250, 182, 23, 0.02) 0%,  /* Yellow tint instead of white */
    rgba(250, 182, 23, 0.05) 50%,
    rgba(250, 182, 23, 0.02) 100%);
  box-shadow: inset 0 0 40px rgba(250, 182, 23, 0.03);
}
```

**React Usage:**
```jsx
<div className="mek-card-industrial-global mek-border-sharp-gold rounded-xl p-6">
  <h3 className="text-yellow-400 font-bold text-xl mb-4">Premium Feature</h3>
  <p className="text-zinc-300 text-sm">Special content...</p>
</div>
```

**Difference from Standard:**
- Uses yellow (#fab617) instead of white for tint
- Warmer appearance, stands out more
- More prominent on dark backgrounds

**When to Use:**
- Premium features
- Highlighted content
- Special announcements
- VIP elements
- Anything needing extra emphasis

### 3. Mission Card Pattern (Complete Example)

**File Reference:** `src/app/contracts/single-missions/page.tsx`

```jsx
<div className="group relative overflow-hidden rounded-xl
                bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900
                border-2 border-zinc-700
                hover:border-yellow-500/50
                hover:shadow-[0_8px_30px_rgba(250,182,23,0.15)]
                transition-all duration-300">

  {/* Subtle diagonal stripe background */}
  <div className="absolute inset-0 opacity-[0.015] pointer-events-none
                  bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.02)_10px,rgba(255,255,255,0.02)_20px)]" />

  {/* Header with hazard stripes */}
  <div className="relative p-4 overflow-hidden
                  bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.9),rgba(0,0,0,0.9)_10px,rgba(250,182,23,0.075)_10px,rgba(250,182,23,0.075)_20px)]
                  border-b border-zinc-700/50">
    <h3 className="font-orbitron text-xl font-bold text-yellow-400 uppercase tracking-wider">
      {mission.name}
    </h3>
    <div className="flex items-center gap-2 mt-1">
      <span className="text-xs text-zinc-500 uppercase">Contract ID:</span>
      <span className="text-xs text-zinc-400 font-mono">{mission.id}</span>
    </div>
  </div>

  {/* Mission details section */}
  <div className="p-4 space-y-4">
    {/* Duration row */}
    <div className="flex items-center justify-between">
      <span className="mek-label-uppercase">Duration</span>
      <span className="text-zinc-200 font-semibold">{mission.duration}</span>
    </div>

    {/* Success rate with progress bar */}
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="mek-label-uppercase">Success Rate</span>
        <span className="text-yellow-400 font-bold">{mission.successRate}%</span>
      </div>
      <div className="mek-progress-container">
        <div
          className="mek-progress-fill"
          style={{ width: `${mission.successRate}%` }}
        />
      </div>
    </div>

    {/* Rewards grid */}
    <div className="pt-2 border-t border-zinc-700/50">
      <div className="mek-label-uppercase mb-2">Rewards</div>
      <div className="grid grid-cols-3 gap-2">
        {mission.rewards.map(reward => (
          <div key={reward.id} className="mek-reward-slot-filled">
            <div className="text-xs text-zinc-400">{reward.type}</div>
            <div className={`font-bold ${
              reward.rarity === 'legendary' ? 'mek-reward-legendary' :
              reward.rarity === 'epic' ? 'mek-reward-epic' :
              reward.rarity === 'rare' ? 'mek-reward-rare' :
              'mek-reward-uncommon'
            }`}>
              {reward.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* Deployment slots */}
  <div className="p-4 border-t-2 border-zinc-700/30 bg-black/20">
    <div className="mek-label-uppercase mb-3">Deploy Mekanisms</div>
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: mission.slots }).map((_, i) => (
        <div key={i} className="mek-slot-empty rounded-lg
                                flex items-center justify-center h-24
                                hover:border-yellow-500/70 hover:shadow-[0_0_15px_rgba(250,182,23,0.3)]
                                transition-all cursor-pointer">
          <span className="text-yellow-400/60 text-4xl slot-plus
                         group-hover:text-yellow-400/80 group-hover:scale-110
                         transition-all">
            +
          </span>
        </div>
      ))}
    </div>
  </div>

  {/* Deploy button */}
  <div className="p-4 bg-gradient-to-t from-black/40 to-transparent">
    <button className="holographic-matrix-button active w-full">
      <span>Deploy Mission</span>
    </button>
  </div>
</div>
```

**Key Pattern Elements:**
1. **Outer container:** Gradient background, border, hover effects
2. **Diagonal stripes:** Subtle texture overlay
3. **Hazard header:** Yellow/black striped pattern
4. **Content sections:** Spaced with `space-y-4` or dividers
5. **Deployment slots:** Grid with hover states
6. **Action button:** Holographic matrix style

### 4. Stat Card Pattern

```jsx
<div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-4 text-center
                hover:scale-105 transition-transform duration-200">
  {/* Label */}
  <div className="mek-label-uppercase mb-2">
    Gold Production
  </div>

  {/* Main value */}
  <div className="mek-value-primary text-3xl">
    {gold.toLocaleString()}
  </div>

  {/* Subtext */}
  <div className="text-zinc-500 text-xs mt-1">
    per hour
  </div>

  {/* Optional trend indicator */}
  <div className="flex items-center justify-center gap-1 mt-2 text-green-400 text-sm">
    <span>↑</span>
    <span>+15%</span>
  </div>
</div>
```

**Layout:**
- Centered text alignment
- Vertical stack (label → value → subtext)
- Optional hover scale effect
- Compact padding (p-4)

### 5. List Card with Header

```jsx
<div className="mek-card-industrial mek-border-sharp-gray rounded-lg overflow-hidden">
  {/* Header with hazard stripes */}
  <div className="mek-header-industrial">
    <div className="flex items-center justify-between">
      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase">
        Active Buffs
      </h3>
      <span className="text-xs text-zinc-500">
        {buffs.length} active
      </span>
    </div>
  </div>

  {/* Scrollable list */}
  <div className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-zinc-700">
    {buffs.map(buff => (
      <div key={buff.id} className="p-3 hover:bg-yellow-400/5 transition-colors cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{buff.icon}</span>
            <div>
              <div className="text-zinc-200 font-medium">{buff.name}</div>
              <div className="text-xs text-zinc-500">
                {buff.duration} remaining
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-yellow-400 font-bold">{buff.value}</div>
            <div className="text-xs text-zinc-500">{buff.type}</div>
          </div>
        </div>
      </div>
    ))}
  </div>

  {/* Footer */}
  <div className="p-3 bg-black/40 border-t border-zinc-700/50 text-center">
    <button className="mek-button-secondary text-sm">
      Manage Buffs
    </button>
  </div>
</div>
```

**Layout:**
- Fixed header (hazard stripes)
- Scrollable body with dividers
- Hover effects on rows
- Optional footer with actions

### Border Variations (Complete Reference)

```css
/* 1. Sharp Gold Border (MOST COMMON) */
.mek-border-sharp-gold {
  border-width: 2px;
  border-color: rgba(250, 182, 23, 0.5); /* 50% opacity yellow */
}
/* Usage: Primary cards, important containers */

/* 2. Sharp Gray Border (Secondary) */
.mek-border-sharp-gray {
  border-width: 1px;
  border-color: rgba(113, 113, 122, 0.5); /* 50% opacity zinc-500 */
}
/* Usage: Secondary cards, subtle divisions */

/* 3. Rounded Gold Border (Softer) */
.mek-border-rounded-gold {
  border-radius: 0.75rem; /* rounded-xl */
  border-width: 2px;
  border-color: rgba(250, 182, 23, 0.5);
}
/* Usage: Softer elements, images, gentler cards */

/* 4. Double Gold Border (Special) */
.mek-border-double-gold {
  border: 2px double rgba(250, 182, 23, 0.6);
}
/* Usage: Extra emphasis, special containers */

/* 5. Neon Cyan Border (High-Tech) */
.mek-border-neon {
  border-width: 2px;
  border-color: rgba(34, 211, 238, 0.5); /* cyan-400 */
  box-shadow: 0 0 15px rgba(34, 211, 238, 0.3);
}
/* Usage: High-tech features, special effects, neon accents */
```

**Combining Borders with Cards:**
```jsx
{/* Standard industrial card */}
<div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6">

{/* Softer variant */}
<div className="mek-card-industrial mek-border-rounded-gold p-6">

{/* High-tech variant */}
<div className="mek-card-industrial mek-border-neon rounded-lg p-6">

{/* Special emphasis */}
<div className="mek-card-industrial-global mek-border-double-gold rounded-lg p-6">

{/* Subtle variant */}
<div className="mek-card-industrial mek-border-sharp-gray rounded-lg p-4">
```

---

## Button Patterns (Complete)

### 1. Primary Button (Main Actions)

**File Reference:** `src/styles/global-design-system.css` lines 206-216

```css
/* CSS Definition */
.mek-button-primary {
  position: relative;
  padding: 12px 24px; /* px-6 py-3 */
  font-weight: 700; /* font-bold */
  color: #000; /* text-black */
  background-color: #facc15; /* bg-yellow-400 */
  text-transform: uppercase;
  letter-spacing: 0.05em; /* tracking-wider */
  transition: all 0.2s; /* transition-all duration-200 */
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 100%, 10px 100%);
}

.mek-button-primary:hover {
  background-color: #fef08a; /* bg-yellow-300 */
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(250, 182, 23, 0.3);
}
```

**React Usage:**
```jsx
<button className="mek-button-primary">
  Deploy Mek
</button>

{/* With icon */}
<button className="mek-button-primary flex items-center gap-2">
  <span>🚀</span>
  <span>Launch Mission</span>
</button>

{/* Full width */}
<button className="mek-button-primary w-full">
  Confirm Purchase
</button>

{/* Disabled state */}
<button className="mek-button-primary opacity-50 cursor-not-allowed pointer-events-none">
  Insufficient Funds
</button>
```

**Visual Characteristics:**
- **Angled corners** via `clip-path` (signature industrial look)
- **Yellow background** (#facc15) with black text
- **Hover lift** (-2px translateY)
- **Glow on hover** (yellow box-shadow)
- **High contrast** (black text on yellow)

**When to Use:**
- Deploy actions
- Confirm/Submit buttons
- Purchase/Buy buttons
- Primary CTAs
- High-priority actions

### 2. Secondary Button

**File Reference:** `src/styles/global-design-system.css` lines 218-226

```css
/* CSS Definition */
.mek-button-secondary {
  position: relative;
  padding: 8px 16px; /* px-4 py-2 */
  font-weight: 500; /* font-medium */
  color: #facc15; /* text-yellow-400 */
  background-color: rgba(0, 0, 0, 0.4); /* bg-black/40 */
  border: 1px solid rgba(250, 204, 21, 0.5); /* border border-yellow-400/50 */
  transition: all 0.2s;
}

.mek-button-secondary:hover {
  background-color: rgba(250, 204, 21, 0.1); /* bg-yellow-400/10 */
  border-color: #facc15; /* border-yellow-400 */
}
```

**React Usage:**
```jsx
<button className="mek-button-secondary">
  View Details
</button>

{/* With rounded corners */}
<button className="mek-button-secondary rounded">
  Cancel
</button>

{/* Full width */}
<button className="mek-button-secondary w-full">
  Back to Menu
</button>
```

**Visual Characteristics:**
- **Transparent background** (bg-black/40)
- **Yellow border and text**
- **Subtle hover fill** (yellow tint)
- **Less prominent** than primary

**When to Use:**
- Cancel buttons
- Back/Return buttons
- View details
- Secondary actions
- Less important CTAs

### 3. Holographic Matrix Button

**File Reference:** `src/styles/global-design-system.css` lines 502-606

```css
/* Base Structure */
.holographic-matrix-button {
  position: relative;
  width: 100%;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  border: 2px solid;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}

/* Inactive State (Gray) */
.holographic-matrix-button.inactive {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-color: #404040;
  color: #606060;
  cursor: not-allowed;
}

/* Active State (Yellow/Gold) */
.holographic-matrix-button.active {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-color: #fab617;
  color: #fab617;
  box-shadow:
    0 0 20px rgba(250, 182, 23, 0.3),
    inset 0 0 20px rgba(250, 182, 23, 0.1);
}

/* Matrix Sweep Effect */
.holographic-matrix-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(250, 182, 23, 0.4),
    transparent
  );
  transition: left 0.5s ease;
}

.holographic-matrix-button.active::before {
  animation: matrix-sweep 3s linear infinite;
}

@keyframes matrix-sweep {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* Holographic Shimmer */
.holographic-matrix-button::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(250, 182, 23, 0.1) 50%,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.holographic-matrix-button.active::after {
  opacity: 1;
  animation: holographic-shimmer 4s ease-in-out infinite;
}

@keyframes holographic-shimmer {
  0%, 100% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
}

/* Hover (Active Only) */
.holographic-matrix-button.active:hover {
  background: linear-gradient(135deg, #2d2d2d 0%, #3d3d3d 100%);
  border-color: #ffc843;
  color: #ffc843;
  box-shadow:
    0 0 30px rgba(250, 182, 23, 0.5),
    inset 0 0 30px rgba(250, 182, 23, 0.2);
  transform: translateY(-1px);
}
```

**React Usage:**
```jsx
<button className={`holographic-matrix-button ${canDeploy ? 'active' : 'inactive'}`}>
  <span>Deploy Mission</span>
</button>
```

**Visual Effects:**
1. **Inactive:** Gray, no animations, cursor-not-allowed
2. **Active:** Yellow border and text, double glow
3. **Sweep Animation:** Light bar sweeps across button
4. **Shimmer:** Holographic gradient shifts
5. **Hover:** Brighter glow, slight lift

**When to Use:**
- Mission deploy buttons
- Premium actions
- Special feature activations
- High-tech interactions

### 4. Danger/Delete Button

```jsx
<button className="px-4 py-2 bg-red-500 hover:bg-red-600
                   text-white font-bold uppercase tracking-wide
                   border-2 border-yellow-500/50
                   rounded transition-all duration-200
                   hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]">
  Delete
</button>

{/* With confirmation state */}
<button className={isConfirming
  ? 'px-4 py-2 bg-red-600 text-white font-bold uppercase animate-pulse'
  : 'px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold uppercase'
}>
  {isConfirming ? 'Click Again to Confirm' : 'Delete'}
</button>
```

**When to Use:**
- Delete actions
- Remove items
- Destructive operations
- Critical warnings

### 5. Icon Button

```jsx
<button className="w-10 h-10 flex items-center justify-center
                   bg-zinc-800 hover:bg-zinc-700
                   border border-zinc-600 hover:border-yellow-500/50
                   rounded transition-all
                   text-zinc-400 hover:text-yellow-400">
  ✏️
</button>

{/* Rounded variant */}
<button className="w-8 h-8 flex items-center justify-center
                   bg-zinc-900 hover:bg-yellow-400/10
                   border border-zinc-700 hover:border-yellow-400
                   rounded-full transition-all">
  <span className="text-sm">✕</span>
</button>

{/* With tooltip (via title) */}
<button title="Edit" className="w-10 h-10 flex items-center justify-center
                                bg-zinc-800 hover:bg-zinc-700
                                border border-zinc-600 hover:border-yellow-500/50
                                rounded transition-all">
  ✏️
</button>
```

**Sizes:**
- Small: `w-6 h-6`
- Medium: `w-8 h-8` or `w-10 h-10`
- Large: `w-12 h-12`

**When to Use:**
- Close buttons (✕)
- Edit buttons (✏️)
- Delete buttons (🗑️)
- Toolbar actions
- Compact interfaces

### Button States (Universal Patterns)

```jsx
{/* Disabled */}
<button className="... opacity-50 cursor-not-allowed pointer-events-none">
  Disabled
</button>

{/* Loading */}
<button className="... relative" disabled>
  <span className="opacity-0">Processing...</span>
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="w-5 h-5 border-2 border-zinc-700 border-t-yellow-400
                    rounded-full animate-spin" />
  </div>
</button>

{/* Success (temporary state) */}
<button className="... bg-green-500 border-green-400 text-white">
  ✓ Complete
</button>

{/* Error (temporary state) */}
<button className="... bg-red-500 border-red-400 text-white">
  ✕ Failed
</button>

{/* Active/Selected */}
<button className={isActive
  ? 'bg-yellow-400 text-black border-yellow-500 ring-2 ring-yellow-400/50'
  : 'bg-zinc-800 text-zinc-300 border-zinc-600'
}>
  Option
</button>
```

---

## Modal & Lightbox Patterns

**🚨 CRITICAL REQUIREMENTS FOR MODALS:**
1. Use `createPortal` from `react-dom` to render at document.body
2. Add `mounted` state with `useEffect` for client-side rendering
3. Lock body scroll when modal opens
4. Use `fixed inset-0 z-[9999]` for proper positioning
5. Stop propagation on modal content to prevent backdrop click-through

### Standard Modal Pattern (Complete)

**File Reference:** `src/components/MekLevelsViewer.tsx`, `src/components/ActivityLogViewer.tsx`

```tsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ExampleLightbox({ isOpen, onClose, title, children }) {
  const [mounted, setMounted] = useState(false);

  // Client-side mounting (prevents SSR errors)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center
                 bg-black/80 backdrop-blur-sm
                 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal content - MUST stopPropagation to prevent backdrop click */}
      <div
        className="relative w-full max-w-4xl max-h-[90vh] mx-4
                   mek-card-industrial mek-border-sharp-gold rounded-xl
                   overflow-hidden flex flex-col
                   shadow-[0_0_60px_rgba(250,182,23,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with hazard stripes */}
        <div className="mek-header-industrial flex items-center justify-between p-4">
          <h2 className="font-orbitron text-2xl font-bold text-yellow-400 uppercase tracking-wider">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center
                       bg-red-500/20 hover:bg-red-500/40
                       border border-red-500/50 hover:border-red-500
                       rounded transition-all text-red-400 hover:text-red-300"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {children}
        </div>

        {/* Optional footer */}
        <div className="p-4 bg-black/40 border-t border-zinc-700/50 flex justify-end gap-2">
          <button onClick={onClose} className="mek-button-secondary">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
```

**Usage:**
```tsx
const [showModal, setShowModal] = useState(false);

<button onClick={() => setShowModal(true)}>Open Modal</button>

<ExampleLightbox
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Modal Title"
>
  <p className="text-zinc-300">Modal content goes here...</p>
</ExampleLightbox>
```

### Modal Size Variants

```tsx
{/* Small modal (notifications, confirmations) */}
<div className="relative w-full max-w-md max-h-[90vh] mx-4 ...">

{/* Medium modal (forms, details) */}
<div className="relative w-full max-w-2xl max-h-[90vh] mx-4 ...">

{/* Large modal (data tables, complex UI) */}
<div className="relative w-full max-w-4xl max-h-[90vh] mx-4 ...">

{/* Extra large modal (full feature views) */}
<div className="relative w-full max-w-6xl max-h-[90vh] mx-4 ...">

{/* Full screen modal */}
<div className="relative w-full h-full max-w-none max-h-none ...">
```

### Modal Animation Variants

```css
/* Fade in (default) */
animate-in fade-in duration-200

/* Fade + Scale */
animate-in fade-in zoom-in-95 duration-300

/* Slide from bottom */
animate-in slide-in-from-bottom duration-300

/* Slide from top */
animate-in slide-in-from-top duration-300

/* Slide from right */
animate-in slide-in-from-right duration-300
```

### Confirmation Modal Pattern

```tsx
<div className="fixed inset-0 z-[9999] flex items-center justify-center
                bg-black/90 backdrop-blur-sm"
     onClick={onCancel}>
  <div className="relative w-full max-w-md mx-4
                  mek-card-industrial mek-border-sharp-gold rounded-xl p-6"
       onClick={(e) => e.stopPropagation()}>

    {/* Warning icon */}
    <div className="flex justify-center mb-4">
      <div className="w-16 h-16 bg-yellow-400/10 rounded-full
                      flex items-center justify-center">
        <span className="text-4xl">⚠️</span>
      </div>
    </div>

    {/* Message */}
    <h3 className="text-xl font-bold text-yellow-400 text-center mb-2">
      Confirm Action
    </h3>
    <p className="text-zinc-300 text-sm text-center mb-6">
      Are you sure you want to proceed? This action cannot be undone.
    </p>

    {/* Action buttons */}
    <div className="flex gap-3">
      <button onClick={onCancel} className="mek-button-secondary flex-1">
        Cancel
      </button>
      <button onClick={onConfirm} className="mek-button-primary flex-1">
        Confirm
      </button>
    </div>
  </div>
</div>
```

### Success/Error Modal Pattern

```tsx
{/* Success */}
<div className="text-center">
  <div className="w-20 h-20 bg-green-400/10 rounded-full mx-auto mb-4
                  flex items-center justify-center
                  animate-in zoom-in-95 duration-500">
    <span className="text-6xl">✓</span>
  </div>
  <h3 className="text-2xl font-bold text-green-400 mb-2">Success!</h3>
  <p className="text-zinc-300">Operation completed successfully.</p>
</div>

{/* Error */}
<div className="text-center">
  <div className="w-20 h-20 bg-red-400/10 rounded-full mx-auto mb-4
                  flex items-center justify-center
                  animate-in zoom-in-95 duration-500">
    <span className="text-6xl">✕</span>
  </div>
  <h3 className="text-2xl font-bold text-red-400 mb-2">Error</h3>
  <p className="text-zinc-300">Something went wrong. Please try again.</p>
</div>
```

---

## Form Elements (Complete)

### Text Input Pattern

```tsx
{/* Standard input */}
<div className="space-y-2">
  <label className="mek-label-uppercase" htmlFor="username">
    Username
  </label>
  <input
    type="text"
    id="username"
    className="w-full px-4 py-3
               bg-zinc-900 border-2 border-zinc-700
               focus:border-yellow-500/50 focus:outline-none
               text-zinc-200 placeholder:text-zinc-600
               rounded transition-colors"
    placeholder="Enter username..."
  />
</div>

{/* With icon */}
<div className="relative">
  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
    👤
  </div>
  <input
    type="text"
    className="w-full pl-10 pr-4 py-3
               bg-zinc-900 border-2 border-zinc-700
               focus:border-yellow-500/50 focus:outline-none
               text-zinc-200 rounded transition-colors"
    placeholder="Username..."
  />
</div>

{/* With validation error */}
<div className="space-y-2">
  <label className="mek-label-uppercase" htmlFor="email">
    Email
  </label>
  <input
    type="email"
    id="email"
    className="w-full px-4 py-3
               bg-zinc-900 border-2 border-red-500/50
               focus:border-red-500 focus:outline-none
               text-zinc-200 rounded transition-colors"
    placeholder="Enter email..."
  />
  <p className="text-red-400 text-xs flex items-center gap-1">
    <span>⚠️</span>
    <span>Invalid email format</span>
  </p>
</div>

{/* Success state */}
<input
  type="text"
  className="w-full px-4 py-3
             bg-zinc-900 border-2 border-green-500/50
             text-zinc-200 rounded"
  value="valid@email.com"
  readOnly
/>
```

### Number Input with Controls

```tsx
<div className="space-y-2">
  <label className="mek-label-uppercase">Quantity</label>
  <div className="flex items-center gap-2">
    <button
      onClick={() => setValue(Math.max(1, value - 1))}
      className="w-10 h-10 bg-zinc-800 hover:bg-zinc-700
                 border border-zinc-600 hover:border-yellow-500/50
                 rounded transition-all text-yellow-400"
    >
      −
    </button>
    <input
      type="number"
      value={value}
      onChange={(e) => setValue(parseInt(e.target.value) || 0)}
      className="flex-1 px-4 py-2 text-center
                 bg-zinc-900 border-2 border-zinc-700
                 focus:border-yellow-500/50 focus:outline-none
                 text-zinc-200 rounded font-bold text-lg"
    />
    <button
      onClick={() => setValue(value + 1)}
      className="w-10 h-10 bg-zinc-800 hover:bg-zinc-700
                 border border-zinc-600 hover:border-yellow-500/50
                 rounded transition-all text-yellow-400"
    >
      +
    </button>
  </div>
</div>
```

### Select/Dropdown Pattern

```tsx
{/* Standard select */}
<div className="space-y-2">
  <label className="mek-label-uppercase" htmlFor="rarity">
    Rarity Filter
  </label>
  <select
    id="rarity"
    className="w-full px-4 py-3
               bg-zinc-900 border-2 border-zinc-700
               focus:border-yellow-500/50 focus:outline-none
               text-zinc-200 rounded cursor-pointer
               appearance-none
               bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMUw2IDZMMTEgMSIgc3Ryb2tlPSIjYTFhMWFhIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')]
               bg-no-repeat bg-[center_right_1rem]"
  >
    <option value="">All Rarities</option>
    <option value="legendary">Legendary</option>
    <option value="epic">Epic</option>
    <option value="rare">Rare</option>
    <option value="uncommon">Uncommon</option>
    <option value="common">Common</option>
  </select>
</div>

{/* Custom styled dropdown (React state-based) */}
<div className="relative">
  <button
    onClick={() => setOpen(!open)}
    className="w-full px-4 py-3 text-left
               bg-zinc-900 border-2 border-zinc-700
               hover:border-yellow-500/50
               text-zinc-200 rounded transition-colors
               flex items-center justify-between"
  >
    <span>{selected || 'Select option...'}</span>
    <span className="text-zinc-500">{open ? '▲' : '▼'}</span>
  </button>

  {open && (
    <div className="absolute top-full left-0 right-0 mt-2 z-10
                    bg-zinc-900 border-2 border-zinc-700
                    rounded overflow-hidden shadow-lg">
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => {
            setSelected(option.label);
            setOpen(false);
          }}
          className="w-full px-4 py-3 text-left
                     hover:bg-yellow-400/10 hover:text-yellow-400
                     transition-colors text-zinc-300"
        >
          {option.label}
        </button>
      ))}
    </div>
  )}
</div>
```

### Checkbox Pattern

```tsx
{/* Standard checkbox */}
<label className="flex items-center gap-3 cursor-pointer group">
  <input
    type="checkbox"
    checked={checked}
    onChange={(e) => setChecked(e.target.checked)}
    className="w-5 h-5 bg-zinc-900 border-2 border-zinc-700
               checked:bg-yellow-400 checked:border-yellow-400
               focus:ring-2 focus:ring-yellow-400/50 focus:ring-offset-2
               focus:ring-offset-zinc-950
               rounded cursor-pointer transition-all"
  />
  <span className="text-zinc-300 group-hover:text-zinc-200 transition-colors">
    Accept terms and conditions
  </span>
</label>

{/* Custom styled checkbox */}
<label className="flex items-center gap-3 cursor-pointer group">
  <div className={`w-6 h-6 border-2 rounded transition-all
                   ${checked
                     ? 'bg-yellow-400 border-yellow-400'
                     : 'bg-zinc-900 border-zinc-700 group-hover:border-zinc-600'
                   }`}>
    {checked && (
      <svg className="w-full h-full p-1 text-black" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    )}
  </div>
  <input
    type="checkbox"
    checked={checked}
    onChange={(e) => setChecked(e.target.checked)}
    className="sr-only"
  />
  <span className="text-zinc-300 group-hover:text-zinc-200">
    Enable notifications
  </span>
</label>

{/* Checkbox list */}
<div className="space-y-3">
  <div className="mek-label-uppercase mb-2">Filters</div>
  {filters.map(filter => (
    <label key={filter.id} className="flex items-center gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={filter.checked}
        onChange={() => toggleFilter(filter.id)}
        className="w-5 h-5 bg-zinc-900 border-2 border-zinc-700
                   checked:bg-yellow-400 checked:border-yellow-400
                   rounded cursor-pointer"
      />
      <span className="text-zinc-300 group-hover:text-zinc-200">
        {filter.label}
      </span>
    </label>
  ))}
</div>
```

### Radio Button Pattern

```tsx
{/* Radio group */}
<div className="space-y-3">
  <div className="mek-label-uppercase mb-2">Select Rarity</div>
  {rarities.map(rarity => (
    <label key={rarity.value} className="flex items-center gap-3 cursor-pointer group">
      <input
        type="radio"
        name="rarity"
        value={rarity.value}
        checked={selected === rarity.value}
        onChange={(e) => setSelected(e.target.value)}
        className="w-5 h-5 bg-zinc-900 border-2 border-zinc-700
                   checked:bg-yellow-400 checked:border-yellow-400
                   focus:ring-2 focus:ring-yellow-400/50
                   cursor-pointer transition-all"
      />
      <span className={`transition-colors ${
        selected === rarity.value ? 'text-yellow-400 font-semibold' : 'text-zinc-300'
      }`}>
        {rarity.label}
      </span>
    </label>
  ))}
</div>

{/* Card-style radio buttons */}
<div className="grid grid-cols-2 gap-3">
  {options.map(option => (
    <label
      key={option.value}
      className={`p-4 border-2 rounded-lg cursor-pointer transition-all
                  ${selected === option.value
                    ? 'border-yellow-500 bg-yellow-400/10'
                    : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900'
                  }`}
    >
      <input
        type="radio"
        name="option"
        value={option.value}
        checked={selected === option.value}
        onChange={(e) => setSelected(e.target.value)}
        className="sr-only"
      />
      <div className="flex items-center gap-2">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${selected === option.value
                          ? 'border-yellow-500 bg-yellow-500'
                          : 'border-zinc-600'
                        }`}>
          {selected === option.value && (
            <div className="w-2 h-2 rounded-full bg-black" />
          )}
        </div>
        <span className={selected === option.value ? 'text-yellow-400 font-semibold' : 'text-zinc-300'}>
          {option.label}
        </span>
      </div>
    </label>
  ))}
</div>
```

### Textarea Pattern

```tsx
{/* Standard textarea */}
<div className="space-y-2">
  <label className="mek-label-uppercase" htmlFor="description">
    Description
  </label>
  <textarea
    id="description"
    rows={5}
    className="w-full px-4 py-3
               bg-zinc-900 border-2 border-zinc-700
               focus:border-yellow-500/50 focus:outline-none
               text-zinc-200 placeholder:text-zinc-600
               rounded resize-none custom-scrollbar
               transition-colors"
    placeholder="Enter description..."
  />
</div>

{/* With character count */}
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <label className="mek-label-uppercase">Notes</label>
    <span className="text-xs text-zinc-500">
      {text.length} / 500
    </span>
  </div>
  <textarea
    value={text}
    onChange={(e) => setText(e.target.value.slice(0, 500))}
    rows={4}
    className="w-full px-4 py-3 bg-zinc-900 border-2 border-zinc-700
               focus:border-yellow-500/50 focus:outline-none
               text-zinc-200 rounded resize-none custom-scrollbar"
    placeholder="Add notes..."
  />
</div>
```

### Range Slider Pattern

```tsx
{/* Basic slider */}
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <label className="mek-label-uppercase">Volume</label>
    <span className="text-yellow-400 font-bold">{value}%</span>
  </div>
  <input
    type="range"
    min="0"
    max="100"
    value={value}
    onChange={(e) => setValue(parseInt(e.target.value))}
    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer
               [&::-webkit-slider-thumb]:appearance-none
               [&::-webkit-slider-thumb]:w-5
               [&::-webkit-slider-thumb]:h-5
               [&::-webkit-slider-thumb]:rounded-full
               [&::-webkit-slider-thumb]:bg-yellow-400
               [&::-webkit-slider-thumb]:cursor-pointer
               [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(250,182,23,0.5)]
               [&::-webkit-slider-thumb]:hover:shadow-[0_0_15px_rgba(250,182,23,0.8)]
               [&::-webkit-slider-thumb]:transition-all
               [&::-moz-range-thumb]:w-5
               [&::-moz-range-thumb]:h-5
               [&::-moz-range-thumb]:rounded-full
               [&::-moz-range-thumb]:bg-yellow-400
               [&::-moz-range-thumb]:border-0
               [&::-moz-range-thumb]:cursor-pointer"
  />
</div>

{/* With tick marks */}
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <label className="mek-label-uppercase">Success Rate</label>
    <span className="text-yellow-400 font-bold">{successRate}%</span>
  </div>
  <input
    type="range"
    min="0"
    max="100"
    step="25"
    value={successRate}
    onChange={(e) => setSuccessRate(parseInt(e.target.value))}
    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer..."
  />
  <div className="flex justify-between text-xs text-zinc-500">
    <span>0%</span>
    <span>25%</span>
    <span>50%</span>
    <span>75%</span>
    <span>100%</span>
  </div>
</div>
```

---

## Progress Indicators (Complete)

### Progress Bar Pattern

**File Reference:** `src/styles/global-design-system.css` lines 228-247

```css
/* Base container */
.mek-progress-container {
  width: 100%;
  height: 8px;
  background: linear-gradient(90deg, #18181b 0%, #27272a 100%);
  border: 1px solid rgba(113, 113, 122, 0.5);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

/* Fill bar */
.mek-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #fab617 0%, #ffc843 100%);
  box-shadow:
    0 0 10px rgba(250, 182, 23, 0.4),
    inset 0 1px 2px rgba(255, 255, 255, 0.3);
  transition: width 0.5s ease;
}
```

**React Usage:**
```tsx
{/* Standard progress bar */}
<div className="space-y-2">
  <div className="flex justify-between">
    <span className="mek-label-uppercase">Loading</span>
    <span className="text-zinc-400 text-sm">{progress}%</span>
  </div>
  <div className="mek-progress-container">
    <div
      className="mek-progress-fill"
      style={{ width: `${progress}%` }}
    />
  </div>
</div>

{/* With animation */}
<div className="mek-progress-container">
  <div
    className="mek-progress-fill transition-all duration-500 ease-out"
    style={{ width: `${progress}%` }}
  />
</div>

{/* Color variants */}
<div className="mek-progress-container">
  <div
    className="h-full bg-gradient-to-r from-green-500 to-green-400
               shadow-[0_0_10px_rgba(74,222,128,0.4)]
               transition-all duration-500"
    style={{ width: `${health}%` }}
  />
</div>

<div className="mek-progress-container">
  <div
    className="h-full bg-gradient-to-r from-blue-500 to-blue-400
               shadow-[0_0_10px_rgba(59,130,246,0.4)]
               transition-all duration-500"
    style={{ width: `${mana}%` }}
  />
</div>

<div className="mek-progress-container">
  <div
    className="h-full bg-gradient-to-r from-red-500 to-red-400
               shadow-[0_0_10px_rgba(239,68,68,0.4)]
               transition-all duration-500"
    style={{ width: `${danger}%` }}
  />
</div>
```

### Success Meter Pattern

**File Reference:** `src/styles/global-design-system.css` lines 249-289

```css
/* Container */
.mek-success-meter {
  width: 100%;
  height: 12px;
  background: #0a0a0a;
  border: 2px solid rgba(250, 182, 23, 0.3);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

/* Animated fill */
.mek-success-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    #4ade80 0%,
    #facc15 50%,
    #f87171 100%
  );
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Pulse animation */
@keyframes mek-pulse-success {
  0%, 100% {
    box-shadow: 0 0 15px rgba(74, 222, 128, 0.4);
  }
  50% {
    box-shadow: 0 0 25px rgba(74, 222, 128, 0.7);
  }
}

.mek-success-fill.high-success {
  animation: mek-pulse-success 2s infinite;
}
```

**React Usage:**
```tsx
<div className="space-y-2">
  <div className="flex justify-between">
    <span className="mek-label-uppercase">Success Rate</span>
    <span className={`font-bold ${
      successRate >= 80 ? 'text-green-400' :
      successRate >= 50 ? 'text-yellow-400' :
      'text-red-400'
    }`}>
      {successRate}%
    </span>
  </div>
  <div className="mek-success-meter">
    <div
      className={`mek-success-fill ${successRate >= 80 ? 'high-success' : ''}`}
      style={{ width: `${successRate}%` }}
    />
  </div>
</div>
```

### Circular Progress Pattern

```tsx
{/* SVG-based circular progress */}
const CircularProgress = ({ value, size = 80, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#27272a"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#fab617"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out
                     drop-shadow-[0_0_8px_rgba(250,182,23,0.5)]"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-yellow-400 font-bold text-xl">
          {value}%
        </span>
      </div>
    </div>
  );
};

{/* Usage */}
<CircularProgress value={75} />
<CircularProgress value={50} size={120} strokeWidth={10} />
```

### Loading Spinner Pattern

```tsx
{/* Standard spinner */}
<div className="flex items-center justify-center">
  <div className="w-8 h-8 border-4 border-zinc-700 border-t-yellow-400
                  rounded-full animate-spin" />
</div>

{/* With text */}
<div className="flex flex-col items-center gap-3">
  <div className="w-12 h-12 border-4 border-zinc-700 border-t-yellow-400
                  rounded-full animate-spin" />
  <span className="text-zinc-400 text-sm">Loading...</span>
</div>

{/* Pulsing dots */}
<div className="flex items-center gap-2">
  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse [animation-delay:0.2s]" />
  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse [animation-delay:0.4s]" />
</div>

{/* Loading bar (indeterminate) */}
<div className="w-full h-1 bg-zinc-800 overflow-hidden rounded-full">
  <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-yellow-400 to-transparent
                  animate-[shimmer_1.5s_infinite]" />
</div>

{/* Skeleton loader */}
<div className="space-y-3">
  <div className="h-4 bg-zinc-800 rounded animate-pulse" />
  <div className="h-4 bg-zinc-800 rounded animate-pulse w-3/4" />
  <div className="h-4 bg-zinc-800 rounded animate-pulse w-1/2" />
</div>
```

### Loading State Overlay

```tsx
{/* Full-screen loader */}
<div className="fixed inset-0 z-[9999] flex items-center justify-center
                bg-black/80 backdrop-blur-sm">
  <div className="flex flex-col items-center gap-4">
    <div className="w-16 h-16 border-4 border-zinc-700 border-t-yellow-400
                    rounded-full animate-spin" />
    <div className="text-yellow-400 font-orbitron text-xl uppercase tracking-wider">
      Loading...
    </div>
  </div>
</div>

{/* Card-level loader */}
<div className="relative">
  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6">
    {/* Card content */}
  </div>
  {isLoading && (
    <div className="absolute inset-0 flex items-center justify-center
                    bg-black/80 backdrop-blur-sm rounded-lg">
      <div className="w-12 h-12 border-4 border-zinc-700 border-t-yellow-400
                      rounded-full animate-spin" />
    </div>
  )}
</div>
```

---

## Table Patterns

### Scrollable Table with Fixed Header

```tsx
<div className="mek-card-industrial mek-border-sharp-gold rounded-lg overflow-hidden">
  {/* Header */}
  <div className="mek-header-industrial">
    <h3 className="font-orbitron text-xl font-bold text-yellow-400 uppercase">
      Data Table
    </h3>
  </div>

  {/* Table wrapper */}
  <div className="overflow-x-auto">
    <table className="w-full">
      {/* Fixed header */}
      <thead className="bg-black/60 border-b-2 border-zinc-700 sticky top-0 z-10">
        <tr>
          <th className="px-4 py-3 text-left mek-label-uppercase">Name</th>
          <th className="px-4 py-3 text-left mek-label-uppercase">Status</th>
          <th className="px-4 py-3 text-right mek-label-uppercase">Value</th>
          <th className="px-4 py-3 text-center mek-label-uppercase">Actions</th>
        </tr>
      </thead>

      {/* Scrollable body */}
      <tbody className="divide-y divide-zinc-700">
        {data.map((row, i) => (
          <tr
            key={row.id}
            className="hover:bg-yellow-400/5 transition-colors"
          >
            <td className="px-4 py-3 text-zinc-200">{row.name}</td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                row.status === 'active' ? 'bg-green-400/20 text-green-400' :
                row.status === 'pending' ? 'bg-yellow-400/20 text-yellow-400' :
                'bg-red-400/20 text-red-400'
              }`}>
                {row.status}
              </span>
            </td>
            <td className="px-4 py-3 text-right text-yellow-400 font-bold">
              {row.value.toLocaleString()}
            </td>
            <td className="px-4 py-3 text-center">
              <button className="text-zinc-400 hover:text-yellow-400 transition-colors">
                ✏️
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* Footer */}
  <div className="p-3 bg-black/40 border-t border-zinc-700/50 text-center text-sm text-zinc-500">
    Showing {data.length} items
  </div>
</div>
```

### Alternating Row Colors

```tsx
<tbody className="divide-y divide-zinc-700">
  {data.map((row, i) => (
    <tr
      key={row.id}
      className={`hover:bg-yellow-400/5 transition-colors ${
        i % 2 === 0 ? 'bg-zinc-900/50' : 'bg-black/20'
      }`}
    >
      {/* cells */}
    </tr>
  ))}
</tbody>
```

### Sortable Table Headers

```tsx
<th
  onClick={() => handleSort('name')}
  className="px-4 py-3 text-left mek-label-uppercase cursor-pointer
             hover:text-yellow-400 transition-colors select-none"
>
  <div className="flex items-center gap-2">
    <span>Name</span>
    {sortBy === 'name' && (
      <span className="text-yellow-400">
        {sortOrder === 'asc' ? '▲' : '▼'}
      </span>
    )}
  </div>
</th>
```

---

## Layout Patterns

### Auto-Fit Grid (Responsive Cards)

```tsx
{/* Cards automatically adjust from 1 to 4+ columns */}
<div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
  {items.map(item => (
    <div key={item.id} className="mek-card-industrial mek-border-sharp-gold rounded-lg p-4">
      {/* Card content */}
    </div>
  ))}
</div>

{/* With max columns constraint */}
<div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))]
                max-w-7xl mx-auto gap-4">
```

### Responsive Column Grid

```tsx
{/* 1 col mobile → 2 col tablet → 3 col desktop → 4 col wide */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

{/* 1 col → 2 col → 3 col (custom breakpoints) */}
<div className="grid grid-cols-1 breakpoint-3col:grid-cols-2 breakpoint-4col:grid-cols-3 gap-4">

{/* Uneven columns (sidebar + main) */}
<div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
  <aside className="...">Sidebar</aside>
  <main className="...">Main content</main>
</div>
```

### Flex Stack Patterns

```tsx
{/* Vertical stack with spacing */}
<div className="flex flex-col gap-4">
  {/* OR */}
<div className="space-y-4">

{/* Horizontal stack */}
<div className="flex items-center gap-3">

{/* Space between */}
<div className="flex items-center justify-between">
  <span>Label</span>
  <span>Value</span>
</div>

{/* Centered */}
<div className="flex items-center justify-center min-h-screen">
  <div>Centered content</div>
</div>

{/* Wrap on overflow */}
<div className="flex flex-wrap gap-2">
  {tags.map(tag => <span key={tag}>#{tag}</span>)}
</div>
```

### Container Patterns

```tsx
{/* Max width container (centered) */}
<div className="max-w-7xl mx-auto px-4">
  {/* Content */}
</div>

{/* Full width with padding */}
<div className="w-full px-4 md:px-6 lg:px-8">

{/* Constrained width */}
<div className="max-w-4xl mx-auto">

{/* Two-column layout */}
<div className="max-w-7xl mx-auto px-4">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <div>Left column</div>
    <div>Right column</div>
  </div>
</div>
```

---

## Icon & Image Patterns

### Mek Image Display

**CRITICAL: Always clean sourceKey before using**

```tsx
{/* Single Mek image */}
const cleanKey = selectedMek.sourceKey
  .replace(/-[A-Z]$/, '')  // Remove suffix (e.g., "-B")
  .toLowerCase();           // Convert to lowercase

<img
  src={`/mek-images/150px/${cleanKey}.webp`}
  alt={selectedMek.name}
  className="w-32 h-32 object-contain"
/>

{/* With fallback */}
<img
  src={`/mek-images/150px/${cleanKey}.webp`}
  alt={selectedMek.name}
  onError={(e) => {
    e.currentTarget.src = '/mek-images/placeholder.webp';
  }}
  className="w-32 h-32 object-contain"
/>

{/* Different sizes */}
<img src={`/mek-images/150px/${cleanKey}.webp`} className="w-24 h-24" />
<img src={`/mek-images/500px/${cleanKey}.webp`} className="w-64 h-64" />
<img src={`/mek-images/1000px/${cleanKey}.webp`} className="w-full" />

{/* With border/glow */}
<div className="relative w-32 h-32 rounded-lg overflow-hidden
                border-2 border-yellow-500/50
                shadow-[0_0_20px_rgba(250,182,23,0.3)]">
  <img
    src={`/mek-images/150px/${cleanKey}.webp`}
    alt={selectedMek.name}
    className="w-full h-full object-contain"
  />
</div>
```

### Variation Bottle Images

```tsx
{/* Essence bottle image */}
<img
  src={`/essence-bottles/${variation.sourceKey.toLowerCase()}.webp`}
  alt={`${variation.name} Essence`}
  className="w-16 h-16 object-contain"
/>

{/* With rarity glow */}
<div className={`relative w-20 h-20 rounded-lg
                 ${variation.tier === 'legendary' ? 'shadow-[0_0_15px_rgba(168,85,247,0.5)]' :
                   variation.tier === 'epic' ? 'shadow-[0_0_15px_rgba(248,113,113,0.5)]' :
                   variation.tier === 'rare' ? 'shadow-[0_0_15px_rgba(251,146,60,0.5)]' :
                   'shadow-none'
                 }`}>
  <img
    src={`/essence-bottles/${variation.sourceKey.toLowerCase()}.webp`}
    alt={variation.name}
    className="w-full h-full object-contain"
  />
</div>
```

### Emoji/Icon Display

```tsx
{/* Large emoji icons */}
<span className="text-4xl">🚀</span>
<span className="text-6xl">✓</span>

{/* In buttons */}
<button className="mek-button-primary flex items-center gap-2">
  <span className="text-xl">⚙️</span>
  <span>Settings</span>
</button>

{/* As status indicators */}
<div className="flex items-center gap-2">
  <span className="text-2xl">{status === 'success' ? '✓' : '✕'}</span>
  <span className="text-zinc-300">{message}</span>
</div>

{/* With animation */}
<span className="text-5xl animate-bounce">🎉</span>
```

---

## Overlay & Texture Patterns

**File Reference:** `src/styles/global-design-system.css` lines 67-154

### Hazard Stripes Overlay

```css
/* CSS Definition */
.mek-overlay-hazard-stripes {
  position: relative;
}

.mek-overlay-hazard-stripes::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    45deg,
    rgba(0, 0, 0, 0.9),
    rgba(0, 0, 0, 0.9) 10px,
    rgba(250, 182, 23, 0.075) 10px,
    rgba(250, 182, 23, 0.075) 20px
  );
  pointer-events: none;
  z-index: 1;
}
```

**Usage:**
```tsx
{/* Header with hazard stripes */}
<div className="mek-overlay-hazard-stripes p-4 bg-black">
  <h3 className="relative z-10 font-orbitron text-xl text-yellow-400 uppercase">
    Warning Zone
  </h3>
</div>

{/* Card header */}
<div className="mek-card-industrial mek-border-sharp-gold rounded-xl overflow-hidden">
  <div className="mek-overlay-hazard-stripes p-4">
    <h3 className="relative z-10 text-yellow-400 font-bold">Title</h3>
  </div>
  <div className="p-4">
    Content...
  </div>
</div>
```

### Scratches Overlay

```css
/* CSS Definition */
.mek-overlay-scratches {
  position: relative;
}

.mek-overlay-scratches::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(90deg, transparent 98%, rgba(255, 255, 255, 0.03) 100%),
    linear-gradient(180deg, transparent 95%, rgba(255, 255, 255, 0.02) 100%),
    repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0, 0, 0, 0.1) 2px, rgba(0, 0, 0, 0.1) 3px);
  opacity: 0.4;
  pointer-events: none;
}
```

**Usage:**
```tsx
<div className="mek-card-industrial mek-overlay-scratches mek-border-sharp-gold rounded-lg p-6">
  {/* Worn/aged appearance */}
</div>
```

### Rust Overlay

```css
/* CSS Definition */
.mek-overlay-rust {
  position: relative;
}

.mek-overlay-rust::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 20% 30%, rgba(180, 83, 9, 0.1) 0%, transparent 40%),
                    radial-gradient(circle at 80% 70%, rgba(180, 83, 9, 0.08) 0%, transparent 40%);
  pointer-events: none;
}
```

**Usage:**
```tsx
<div className="mek-card-industrial mek-overlay-rust mek-border-sharp-gold rounded-lg p-6">
  {/* Rusted metal effect */}
</div>
```

### Metal Texture Overlay

```css
/* CSS Definition */
.mek-overlay-metal-texture {
  position: relative;
}

.mek-overlay-metal-texture::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: linear-gradient(90deg, rgba(255, 255, 255, 0.02) 50%, transparent 50%),
                    linear-gradient(0deg, rgba(255, 255, 255, 0.02) 50%, transparent 50%);
  background-size: 2px 2px;
  opacity: 0.5;
  pointer-events: none;
}
```

### Glass Overlay

```css
/* CSS Definition */
.mek-overlay-glass {
  position: relative;
  overflow: hidden;
}

.mek-overlay-glass::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
  pointer-events: none;
}
```

### Combining Multiple Overlays

```tsx
{/* Scratched metal with rust */}
<div className="mek-card-industrial mek-overlay-scratches mek-overlay-rust
                mek-border-sharp-gold rounded-lg p-6">

{/* Glass with metal texture */}
<div className="mek-card-industrial mek-overlay-glass mek-overlay-metal-texture
                mek-border-sharp-gold rounded-lg p-6">

{/* Header with hazard + scratches */}
<div className="mek-overlay-hazard-stripes mek-overlay-scratches p-4">
```

---

## Animation Patterns

**File Reference:** `tailwind.config.ts` lines 33-57, `global-design-system.css` animations

### Built-In Tailwind Animations

```tsx
{/* Pulse (opacity) */}
<div className="animate-pulse">Pulsing element</div>

{/* Spin (loading) */}
<div className="animate-spin">↻</div>

{/* Bounce */}
<div className="animate-bounce">⬇</div>

{/* Ping (notification dot) */}
<div className="relative">
  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping" />
  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full" />
</div>
```

### Custom Mek Animations

```css
/* Pulse Glow (buttons, important elements) */
.animate-pulse-glow
  animation: pulse-glow 2s ease-in-out infinite;

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.5); }
  50% { box-shadow: 0 0 30px rgba(251, 191, 36, 0.8); }
}

/* Float (hovering effect) */
.animate-float
  animation: float 3s ease-in-out infinite;

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* Shimmer (loading, premium elements) */
.animate-shimmer
  animation: shimmer 2s linear infinite;

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

/* Float Up (reward notifications) */
.animate-float-up
  animation: float-up 3s ease-out infinite;

@keyframes float-up {
  0% { transform: translateY(0) translateX(0); opacity: 1; }
  50% { transform: translateY(-30px) translateX(10px); opacity: 0.8; }
  100% { transform: translateY(-60px) translateX(-5px); opacity: 0; }
}
```

**Usage:**
```tsx
{/* Pulsing glow button */}
<button className="mek-button-primary animate-pulse-glow">
  Special Offer
</button>

{/* Floating icon */}
<span className="text-4xl animate-float">✨</span>

{/* Shimmer effect */}
<div className="relative overflow-hidden">
  <div className="mek-card-industrial ...">
    Card content
  </div>
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                  animate-shimmer pointer-events-none" />
</div>

{/* Reward notification */}
<div className="fixed bottom-4 right-4 text-2xl animate-float-up">
  +100 Gold
</div>
```

### Scan Effect

**File Reference:** `src/styles/global-design-system.css` lines 325-343

```css
/* CSS Definition */
.mek-scan-effect {
  position: relative;
  overflow: hidden;
}

.mek-scan-effect::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(250, 182, 23, 0.05) 45%,
    rgba(250, 182, 23, 0.2) 50%,
    rgba(250, 182, 23, 0.05) 55%,
    transparent 100%
  );
  animation: scan-sweep 4s linear infinite;
  pointer-events: none;
}

@keyframes scan-sweep {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}
```

**Usage:**
```tsx
<div className="mek-card-industrial mek-scan-effect mek-border-sharp-gold rounded-lg p-6">
  {/* Scanning effect over card */}
</div>
```

### Transition Patterns

```tsx
{/* Smooth all properties */}
<div className="transition-all duration-300">

{/* Specific properties */}
<div className="transition-colors duration-200">
<div className="transition-transform duration-300">
<div className="transition-opacity duration-150">

{/* Hover lift */}
<div className="hover:-translate-y-1 transition-transform duration-200">

{/* Hover scale */}
<div className="hover:scale-105 transition-transform duration-200">

{/* Hover glow */}
<div className="hover:shadow-[0_0_30px_rgba(250,182,23,0.3)] transition-shadow duration-300">

{/* Complex hover */}
<div className="hover:border-yellow-500 hover:shadow-[0_0_20px_rgba(250,182,23,0.2)]
                hover:-translate-y-1 transition-all duration-300">
```

---

## State Visualization

### Empty State Pattern

```tsx
<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
  {/* Icon */}
  <div className="w-24 h-24 bg-zinc-800 rounded-full
                  flex items-center justify-center mb-4">
    <span className="text-5xl opacity-50">📭</span>
  </div>

  {/* Message */}
  <h3 className="text-xl font-bold text-zinc-400 mb-2">
    No Items Found
  </h3>
  <p className="text-zinc-500 text-sm max-w-md mb-6">
    You don't have any items yet. Start by creating your first one.
  </p>

  {/* Action */}
  <button className="mek-button-primary">
    Create Item
  </button>
</div>
```

### Filled State Pattern

```tsx
{/* Grid of items */}
<div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
  {items.map(item => (
    <div key={item.id} className="mek-card-industrial mek-border-sharp-gold rounded-lg p-4
                                   hover:border-yellow-400 transition-all cursor-pointer">
      {/* Item content */}
    </div>
  ))}
</div>

{/* List of items */}
<div className="divide-y divide-zinc-700">
  {items.map(item => (
    <div key={item.id} className="p-4 hover:bg-yellow-400/5 transition-colors">
      {/* Item content */}
    </div>
  ))}
</div>
```

### Hover States

```tsx
{/* Card hover */}
<div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6
                hover:border-yellow-400 hover:shadow-[0_0_30px_rgba(250,182,23,0.2)]
                hover:-translate-y-1 transition-all duration-300 cursor-pointer">

{/* Button hover */}
<button className="mek-button-primary
                   hover:bg-yellow-300 hover:-translate-y-1
                   hover:shadow-[0_5px_15px_rgba(250,182,23,0.3)]">

{/* Row hover */}
<tr className="hover:bg-yellow-400/5 transition-colors cursor-pointer">

{/* Icon hover */}
<button className="text-zinc-400 hover:text-yellow-400 hover:scale-110
                   transition-all duration-200">
  ✏️
</button>
```

### Active/Selected States

```tsx
{/* Active card */}
<div className={`mek-card-industrial rounded-lg p-6 border-2 transition-all ${
  isSelected
    ? 'border-yellow-500 bg-yellow-400/10 shadow-[0_0_20px_rgba(250,182,23,0.3)]'
    : 'border-zinc-700 hover:border-zinc-600'
}`}>

{/* Active button */}
<button className={isActive
  ? 'bg-yellow-400 text-black border-yellow-500 ring-2 ring-yellow-400/50'
  : 'bg-zinc-800 text-zinc-300 border-zinc-600 hover:border-zinc-500'
}>

{/* Active tab */}
<button className={isActive
  ? 'border-b-2 border-yellow-500 text-yellow-400'
  : 'border-b-2 border-transparent text-zinc-500 hover:text-zinc-300'
}>
```

### Disabled States

```tsx
{/* Disabled button */}
<button className="mek-button-primary opacity-50 cursor-not-allowed pointer-events-none">
  Unavailable
</button>

{/* Disabled input */}
<input
  disabled
  className="w-full px-4 py-3 bg-zinc-900/50 border-2 border-zinc-800
             text-zinc-600 cursor-not-allowed"
/>

{/* Disabled card */}
<div className="mek-card-industrial mek-border-sharp-gray rounded-lg p-6
                opacity-50 grayscale cursor-not-allowed">
  Locked Feature
</div>
```

### Loading States

```tsx
{/* Loading card (skeleton) */}
<div className="mek-card-industrial mek-border-sharp-gray rounded-lg p-6 space-y-4">
  <div className="h-6 bg-zinc-800 rounded animate-pulse w-3/4" />
  <div className="h-4 bg-zinc-800 rounded animate-pulse" />
  <div className="h-4 bg-zinc-800 rounded animate-pulse w-5/6" />
</div>

{/* Loading overlay on card */}
<div className="relative">
  <div className="mek-card-industrial ...">
    {/* Content */}
  </div>
  {isLoading && (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm
                    flex items-center justify-center rounded-lg">
      <div className="w-12 h-12 border-4 border-zinc-700 border-t-yellow-400
                      rounded-full animate-spin" />
    </div>
  )}
</div>
```

---

## Responsive Patterns

### Mobile-First Breakpoints

```tsx
{/* Mobile first: start with mobile styles, add larger breakpoints */}
<div className="text-sm md:text-base lg:text-lg xl:text-xl">

{/* Grid responsive */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

{/* Padding responsive */}
<div className="px-4 md:px-6 lg:px-8">

{/* Hide on mobile */}
<div className="hidden md:block">Desktop only</div>

{/* Show only on mobile */}
<div className="block md:hidden">Mobile only</div>

{/* Stack on mobile, row on desktop */}
<div className="flex flex-col md:flex-row gap-4">
```

### Touch Targets (Mobile)

```tsx
{/* Minimum 44px touch target */}
<button className="min-w-[44px] min-h-[44px] flex items-center justify-center
                   text-lg md:text-base">
  ✕
</button>

{/* Larger padding on mobile */}
<button className="px-6 py-4 md:px-4 md:py-2 mek-button-primary">
  Tap Me
</button>

{/* Spacing for easier tapping */}
<div className="flex gap-4 md:gap-2">
  {/* Buttons with more space on mobile */}
</div>
```

### Responsive Modals

```tsx
{/* Full screen on mobile, centered on desktop */}
<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
  <div className="relative w-full h-full md:w-auto md:h-auto md:max-w-2xl md:max-h-[90vh]
                  mek-card-industrial md:mek-border-sharp-gold md:rounded-xl
                  overflow-hidden flex flex-col">
    {/* Modal content */}
  </div>
</div>
```

---

## Convex Integration Patterns

### Query Pattern

```tsx
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function MekList() {
  const meks = useQuery(api.meks.getUserMeks);

  // Loading state
  if (meks === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-zinc-700 border-t-yellow-400
                        rounded-full animate-spin" />
      </div>
    );
  }

  // Empty state
  if (meks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">No Meks found</p>
      </div>
    );
  }

  // Data display
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
      {meks.map(mek => (
        <MekCard key={mek._id} mek={mek} />
      ))}
    </div>
  );
}
```

### Mutation Pattern

```tsx
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useState } from 'react';

export default function CreateMekButton() {
  const createMek = useMutation(api.meks.create);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await createMek({ name: 'New Mek', level: 1 });
      // Success feedback
    } catch (error) {
      console.error('Failed to create Mek:', error);
      // Error feedback
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <button
      onClick={handleCreate}
      disabled={isCreating}
      className="mek-button-primary relative"
    >
      {isCreating ? (
        <>
          <span className="opacity-0">Creating...</span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-black border-t-transparent
                            rounded-full animate-spin" />
          </div>
        </>
      ) : (
        'Create Mek'
      )}
    </button>
  );
}
```

### Conditional Rendering Based on Query

```tsx
const user = useQuery(api.users.getCurrent);
const hasWallet = user?.walletAddress !== undefined;

return (
  <>
    {hasWallet ? (
      <div className="mek-card-industrial ...">
        {/* Wallet connected UI */}
      </div>
    ) : (
      <div className="mek-card-industrial ...">
        <p className="text-zinc-400">Please connect your wallet</p>
        <button className="mek-button-primary">Connect Wallet</button>
      </div>
    )}
  </>
);
```

---

## Common Gotchas & Solutions

### 1. Modal Positioning Issues

**Problem:** Modal appears in center of container instead of browser viewport

**Solution:** Use createPortal and fixed positioning

```tsx
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

export default function Modal({ isOpen, onClose, children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] ...">
      {children}
    </div>,
    document.body
  );
}
```

**Reference:** See Modal & Lightbox Patterns section above

### 2. Image Loading Issues

**Problem:** Mek images don't load due to sourceKey formatting

**Solution:** Always clean sourceKey (remove suffix, lowercase)

```tsx
const cleanKey = mek.sourceKey
  .replace(/-[A-Z]$/, '')  // Remove suffix like "-B"
  .toLowerCase();           // Convert to lowercase

<img src={`/mek-images/150px/${cleanKey}.webp`} />
```

### 3. Z-Index Stacking Issues

**Problem:** Elements overlap incorrectly

**Solution:** Use defined z-index scale

```css
/* Defined z-index layers */
z-0      /* Base layer */
z-10     /* Slightly elevated (dropdowns) */
z-20     /* Sticky headers */
z-30     /* Overlays */
z-40     /* Tooltips */
z-50     /* Modals */
z-[9999] /* Absolutely top (lightboxes) */
```

**Always use:** `z-[9999]` for modals/lightboxes to ensure they're above everything

### 4. Hydration Errors

**Problem:** "Text content did not match" or "Hydration failed"

**Solution:** Use client-side rendering for dynamic content

```tsx
'use client';

import { useState, useEffect } from 'react';

export default function ClientOnly({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <>{children}</>;
}
```

### 5. Scroll Lock Issues

**Problem:** Body scrolls when modal is open

**Solution:** Lock body scroll in useEffect

```tsx
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'unset';
  }
  return () => {
    document.body.style.overflow = 'unset';
  };
}, [isOpen]);
```

### 6. Backdrop Click Not Closing Modal

**Problem:** Clicking modal content closes modal

**Solution:** Stop propagation on content div

```tsx
<div className="fixed inset-0 ..." onClick={onClose}>
  <div onClick={(e) => e.stopPropagation()}>
    {/* Modal content - won't trigger onClose */}
  </div>
</div>
```

### 7. Custom Scrollbar Not Showing

**Problem:** Custom scrollbar styles don't apply

**Solution:** Ensure `.custom-scrollbar` class is defined in global CSS

```css
/* In global-design-system.css */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #27272a;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #52525b;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #71717a;
}
```

### 8. Tailwind v3 vs v4 Confusion

**Problem:** Using v4 syntax in v3 project

**CRITICAL:** This project uses Tailwind v3, NOT v4

**Never use:**
- `@import "tailwindcss"` (v4 syntax)
- `@theme inline` (v4 directive)
- `@tailwindcss/postcss` package

**Always use:**
- `@tailwind base; @tailwind components; @tailwind utilities;` (v3)
- `tailwindcss@^3` in package.json
- Standard `postcss.config.mjs` with `{tailwindcss: {}, autoprefixer: {}}`

### 9. Animation Not Running

**Problem:** Custom animation defined but not running

**Solution:** Check animation is defined in both tailwind.config.ts AND used correctly

```typescript
// tailwind.config.ts
animation: {
  'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
},
keyframes: {
  'pulse-glow': {
    '0%, 100%': { boxShadow: '0 0 20px rgba(251, 191, 36, 0.5)' },
    '50%': { boxShadow: '0 0 30px rgba(251, 191, 36, 0.8)' },
  },
}

// Component
<div className="animate-pulse-glow">...</div>
```

### 10. Variation Names Not Displaying

**Problem:** Variation names show as undefined or wrong

**Solution:** Use completeVariationRarity.ts as single source of truth

```tsx
import { COMPLETE_VARIATION_RARITY } from '@/lib/completeVariationRarity';

// Find variation by ID
const variation = COMPLETE_VARIATION_RARITY.find(v => v.id === variationId);

// Use variation data
<div>{variation.name}</div>
<img src={`/essence-bottles/${variation.sourceKey.toLowerCase()}.webp`} />
```

**CRITICAL:** Never filter out "Nil", "Null", "None", "Nothing" - these are legitimate ghostly/haunting variations!

---

## Document Completion

This document now contains exhaustive coverage of ALL Mek Tycoon design patterns:

✅ Design Philosophy & Visual Language
✅ Complete Color Reference System
✅ Complete Typography System
✅ Card Component Patterns
✅ Button Patterns
✅ Modal & Lightbox Patterns
✅ Form Elements
✅ Progress Indicators
✅ Table Patterns
✅ Layout Patterns
✅ Icon & Image Patterns
✅ Overlay & Texture Patterns
✅ Animation Patterns
✅ State Visualization
✅ Responsive Patterns
✅ Convex Integration Patterns
✅ Common Gotchas & Solutions

**Total Sections:** 17
**Total Lines:** 2600+
**Exhaustiveness Level:** Maximum (matching Document 1)

**How to Use This Document:**

1. **Before creating ANY new component:** Read the relevant section here
2. **When transforming external code:** Reference both TRANSFORM_MAPPING_RULES.md and this document
3. **When stuck on styling:** Search this document for the pattern type you need
4. **When debugging visual issues:** Check "Common Gotchas" section first
5. **For consistency:** Always use pre-built `.mek-*` classes when available

This document + TRANSFORM_MAPPING_RULES.md = Complete transformation expertise.