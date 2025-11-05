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

I'll continue with Modal Patterns, Form Elements, Progress Indicators, and all remaining sections in the next part due to length. This document is being created with the same exhaustive detail as document 1.

Would you like me to continue with the remaining sections now?