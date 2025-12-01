# CSS to Tailwind v3 - Comprehensive Transformation Rules

**CRITICAL VERSION INFORMATION**
- This project uses **Tailwind CSS v3.x**, NOT v4
- NEVER use v4 syntax: `@import "tailwindcss"`, `@theme inline`, `@tailwindcss/postcss`
- ALWAYS use v3 syntax: `@tailwind base; @tailwind components; @tailwind utilities;` in globals.css
- Verify version: Check `package.json` for `"tailwindcss": "^3.x.x"`

---

## Table of Contents
1. [Display & Layout](#display--layout)
2. [Positioning](#positioning)
3. [Flexbox](#flexbox)
4. [CSS Grid](#css-grid)
5. [Spacing (Margin & Padding)](#spacing-margin--padding)
6. [Sizing (Width & Height)](#sizing-width--height)
7. [Typography](#typography)
8. [Colors & Backgrounds](#colors--backgrounds)
9. [Borders](#borders)
10. [Border Radius](#border-radius)
11. [Effects (Shadow, Opacity, Blur)](#effects-shadow-opacity-blur)
12. [Filters & Backdrop Filters](#filters--backdrop-filters)
13. [Transforms](#transforms)
14. [Transitions & Animations](#transitions--animations)
15. [Responsive Design](#responsive-design)
16. [Pseudo-Classes & States](#pseudo-classes--states)
17. [Pseudo-Elements](#pseudo-elements)
18. [Common Pattern Conversions](#common-pattern-conversions)
19. [Things You Cannot Do (Arbitrary Values)](#things-you-cannot-do-arbitrary-values)
20. [Mek Tycoon Specific Patterns](#mek-tycoon-specific-patterns)

---

## Display & Layout

### Display Properties
```css
/* CSS → Tailwind */
display: block → block
display: inline-block → inline-block
display: inline → inline
display: flex → flex
display: inline-flex → inline-flex
display: grid → grid
display: inline-grid → inline-grid
display: contents → contents
display: table → table
display: table-cell → table-cell
display: table-row → table-row
display: flow-root → flow-root
display: none → hidden

/* List Items */
display: list-item → list-item
```

### Visibility
```css
visibility: visible → visible
visibility: hidden → invisible
visibility: collapse → collapse
```

### Overflow
```css
overflow: auto → overflow-auto
overflow: hidden → overflow-hidden
overflow: visible → overflow-visible
overflow: scroll → overflow-scroll
overflow-x: auto → overflow-x-auto
overflow-x: hidden → overflow-x-hidden
overflow-x: scroll → overflow-x-scroll
overflow-y: auto → overflow-y-auto
overflow-y: hidden → overflow-y-hidden
overflow-y: scroll → overflow-y-scroll
```

### Scrolling
```css
overflow-y: scroll + scrollbar-width: thin → overflow-y-scroll scrollbar-thin
scroll-behavior: smooth → scroll-smooth
scroll-behavior: auto → scroll-auto
```

---

## Positioning

### Position Property
```css
position: static → static
position: relative → relative
position: absolute → absolute
position: fixed → fixed
position: sticky → sticky
```

### Inset (Top/Right/Bottom/Left)
```css
/* Shorthand */
top: 0; right: 0; bottom: 0; left: 0; → inset-0
top: 0; left: 0; → inset-y-0 (or top-0 left-0)
right: 0; bottom: 0; → inset-x-0 (or right-0 bottom-0)

/* Individual Directions */
top: 0 → top-0
top: 50% → top-1/2
top: 100% → top-full
top: 4px → top-1
top: 8px → top-2
top: 16px → top-4
top: auto → top-auto

/* Same pattern for right, bottom, left */
right: 0 → right-0
bottom: 0 → bottom-0
left: 0 → left-0

/* Negative values */
top: -4px → -top-1
left: -16px → -left-4
```

### Z-Index
```css
z-index: 0 → z-0
z-index: 10 → z-10
z-index: 20 → z-20
z-index: 30 → z-30
z-index: 40 → z-40
z-index: 50 → z-50
z-index: 9999 → z-[9999]
z-index: auto → z-auto
z-index: -1 → -z-10 (or [z-index:-1])
```

**Mek Tycoon Convention:** Modals/lightboxes use `z-[9999]`

---

## Flexbox

### Flex Direction
```css
flex-direction: row → flex-row
flex-direction: row-reverse → flex-row-reverse
flex-direction: column → flex-col
flex-direction: column-reverse → flex-col-reverse
```

### Flex Wrap
```css
flex-wrap: wrap → flex-wrap
flex-wrap: wrap-reverse → flex-wrap-reverse
flex-wrap: nowrap → flex-nowrap
```

### Flex (Grow/Shrink/Basis)
```css
flex: 1 → flex-1
flex: auto → flex-auto
flex: initial → flex-initial
flex: none → flex-none
flex-grow: 1 → grow
flex-grow: 0 → grow-0
flex-shrink: 1 → shrink
flex-shrink: 0 → shrink-0
flex-basis: 0% → basis-0
flex-basis: 100% → basis-full
flex-basis: auto → basis-auto
```

### Justify Content (Main Axis)
```css
justify-content: flex-start → justify-start
justify-content: flex-end → justify-end
justify-content: center → justify-center
justify-content: space-between → justify-between
justify-content: space-around → justify-around
justify-content: space-evenly → justify-evenly
```

### Align Items (Cross Axis)
```css
align-items: flex-start → items-start
align-items: flex-end → items-end
align-items: center → items-center
align-items: baseline → items-baseline
align-items: stretch → items-stretch
```

### Align Content (Multi-line)
```css
align-content: flex-start → content-start
align-content: flex-end → content-end
align-content: center → content-center
align-content: space-between → content-between
align-content: space-around → content-around
align-content: space-evenly → content-evenly
```

### Align Self (Individual Item)
```css
align-self: auto → self-auto
align-self: flex-start → self-start
align-self: flex-end → self-end
align-self: center → self-center
align-self: stretch → self-stretch
```

### Gap (Space Between Items)
```css
gap: 0 → gap-0
gap: 4px → gap-1
gap: 8px → gap-2
gap: 12px → gap-3
gap: 16px → gap-4
gap: 20px → gap-5
gap: 24px → gap-6
gap: 32px → gap-8
gap: 1rem → gap-4
gap: 1.5rem → gap-6
gap: 2rem → gap-8

/* Column/Row specific */
column-gap: 16px → gap-x-4
row-gap: 16px → gap-y-4
```

---

## CSS Grid

### Grid Template Columns
```css
grid-template-columns: repeat(3, 1fr) → grid-cols-3
grid-template-columns: repeat(4, 1fr) → grid-cols-4
grid-template-columns: repeat(12, 1fr) → grid-cols-12
grid-template-columns: none → grid-cols-none

/* Auto-fit pattern (common) */
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))
  → grid-cols-[repeat(auto-fit,minmax(300px,1fr))]
```

### Grid Template Rows
```css
grid-template-rows: repeat(3, 1fr) → grid-rows-3
grid-template-rows: repeat(4, 1fr) → grid-rows-4
grid-template-rows: none → grid-rows-none
```

### Grid Column Span
```css
grid-column: span 2 / span 2 → col-span-2
grid-column: span 3 / span 3 → col-span-3
grid-column: 1 / -1 → col-span-full
grid-column-start: 1 → col-start-1
grid-column-end: 3 → col-end-3
```

### Grid Row Span
```css
grid-row: span 2 / span 2 → row-span-2
grid-row: span 3 / span 3 → row-span-3
grid-row: 1 / -1 → row-span-full
grid-row-start: 1 → row-start-1
grid-row-end: 3 → row-end-3
```

### Grid Auto Flow
```css
grid-auto-flow: row → grid-flow-row
grid-auto-flow: column → grid-flow-col
grid-auto-flow: dense → grid-flow-dense
grid-auto-flow: row dense → grid-flow-row-dense
```

### Grid Auto Columns/Rows
```css
grid-auto-columns: auto → auto-cols-auto
grid-auto-columns: min-content → auto-cols-min
grid-auto-columns: max-content → auto-cols-max
grid-auto-columns: 1fr → auto-cols-fr

grid-auto-rows: auto → auto-rows-auto
grid-auto-rows: min-content → auto-rows-min
grid-auto-rows: max-content → auto-rows-max
grid-auto-rows: 1fr → auto-rows-fr
```

---

## Spacing (Margin & Padding)

**Tailwind Spacing Scale:**
- 0 = 0px
- 0.5 = 2px (0.125rem)
- 1 = 4px (0.25rem)
- 2 = 8px (0.5rem)
- 3 = 12px (0.75rem)
- 4 = 16px (1rem)
- 5 = 20px (1.25rem)
- 6 = 24px (1.5rem)
- 8 = 32px (2rem)
- 10 = 40px (2.5rem)
- 12 = 48px (3rem)
- 16 = 64px (4rem)
- 20 = 80px (5rem)
- 24 = 96px (6rem)
- 32 = 128px (8rem)
- 40 = 160px (10rem)
- 48 = 192px (12rem)
- 56 = 224px (14rem)
- 64 = 256px (16rem)
- px = 1px

### Margin
```css
/* All sides */
margin: 16px → m-4
margin: 0 → m-0
margin: auto → m-auto

/* Horizontal/Vertical */
margin-left: 16px; margin-right: 16px; → mx-4
margin-top: 16px; margin-bottom: 16px; → my-4

/* Individual sides */
margin-top: 16px → mt-4
margin-right: 16px → mr-4
margin-bottom: 16px → mb-4
margin-left: 16px → ml-4

/* Negative margins */
margin-top: -16px → -mt-4
margin-left: -8px → -ml-2

/* Auto margins (centering) */
margin-left: auto; margin-right: auto; → mx-auto
```

### Padding
```css
/* All sides */
padding: 16px → p-4
padding: 0 → p-0

/* Horizontal/Vertical */
padding-left: 16px; padding-right: 16px; → px-4
padding-top: 16px; padding-bottom: 16px; → py-4

/* Individual sides */
padding-top: 16px → pt-4
padding-right: 16px → pr-4
padding-bottom: 16px → pb-4
padding-left: 16px → pl-4
```

### Space Between (Gap Alternative)
```css
/* For flex/grid children with margin-top */
margin-top on all children except first → space-y-4
/* For flex/grid children with margin-left */
margin-left on all children except first → space-x-4

/* Reverse (RTL layouts) */
space-x-reverse
space-y-reverse
```

---

## Sizing (Width & Height)

### Width
```css
width: 100% → w-full
width: auto → w-auto
width: 50% → w-1/2
width: 33.333% → w-1/3
width: 66.667% → w-2/3
width: 25% → w-1/4
width: 75% → w-3/4
width: 20% → w-1/5

/* Fixed widths (spacing scale) */
width: 16px → w-4
width: 32px → w-8
width: 64px → w-16
width: 128px → w-32
width: 256px → w-64

/* Viewport width */
width: 100vw → w-screen
width: 50vw → w-[50vw]

/* min-content, max-content, fit-content */
width: min-content → w-min
width: max-content → w-max
width: fit-content → w-fit
```

### Max Width
```css
max-width: none → max-w-none
max-width: 100% → max-w-full
max-width: 320px → max-w-xs
max-width: 384px → max-w-sm
max-width: 448px → max-w-md
max-width: 512px → max-w-lg
max-width: 576px → max-w-xl
max-width: 672px → max-w-2xl
max-width: 768px → max-w-3xl
max-width: 896px → max-w-4xl
max-width: 1024px → max-w-5xl
max-width: 1152px → max-w-6xl
max-width: 1280px → max-w-7xl
max-width: 100vw → max-w-screen
```

**Mek Tycoon Convention:** Content containers typically use `max-w-7xl mx-auto`

### Min Width
```css
min-width: 0 → min-w-0
min-width: 100% → min-w-full
min-width: min-content → min-w-min
min-width: max-content → min-w-max
min-width: fit-content → min-w-fit
```

### Height
```css
height: 100% → h-full
height: auto → h-auto
height: 50% → h-1/2
height: 33.333% → h-1/3

/* Fixed heights */
height: 16px → h-4
height: 32px → h-8
height: 64px → h-16

/* Viewport height */
height: 100vh → h-screen
height: 50vh → h-[50vh]
height: calc(100vh - 80px) → h-[calc(100vh-80px)]
```

### Max/Min Height
```css
max-height: none → max-h-none
max-height: 100% → max-h-full
max-height: 100vh → max-h-screen

min-height: 0 → min-h-0
min-height: 100% → min-h-full
min-height: 100vh → min-h-screen
```

---

## Typography

### Font Family
```css
/* Mek Tycoon Custom Fonts (from tailwind.config.ts) */
font-family: 'Orbitron' → font-orbitron
font-family: 'Rajdhani' → font-rajdhani
font-family: 'Bebas Neue' → font-bebas
font-family: 'Saira Condensed' → font-saira
font-family: 'Teko' → font-teko
font-family: 'Michroma' → font-michroma
font-family: 'Audiowide' → font-audiowide
font-family: 'Quantico' → font-quantico
font-family: 'Electrolize' → font-electrolize
font-family: 'Russo One' → font-russo
font-family: 'Exo 2' → font-exo

/* Generic families */
font-family: sans-serif → font-sans
font-family: serif → font-serif
font-family: monospace → font-mono
```

**Mek Tycoon Convention:** Headers use `font-orbitron` or `font-bebas`

### Font Size
```css
font-size: 12px → text-xs
font-size: 14px → text-sm
font-size: 16px → text-base
font-size: 18px → text-lg
font-size: 20px → text-xl
font-size: 24px → text-2xl
font-size: 30px → text-3xl
font-size: 36px → text-4xl
font-size: 48px → text-5xl
font-size: 60px → text-6xl
font-size: 72px → text-7xl
font-size: 96px → text-8xl
font-size: 128px → text-9xl
```

### Font Weight
```css
font-weight: 100 → font-thin
font-weight: 200 → font-extralight
font-weight: 300 → font-light
font-weight: 400 → font-normal
font-weight: 500 → font-medium
font-weight: 600 → font-semibold
font-weight: 700 → font-bold
font-weight: 800 → font-extrabold
font-weight: 900 → font-black
```

### Letter Spacing
```css
letter-spacing: -0.05em → tracking-tighter
letter-spacing: -0.025em → tracking-tight
letter-spacing: 0 → tracking-normal
letter-spacing: 0.025em → tracking-wide
letter-spacing: 0.05em → tracking-wider
letter-spacing: 0.1em → tracking-widest
```

**Mek Tycoon Convention:** Uppercase headers use `tracking-wider` or `tracking-widest`

### Line Height
```css
line-height: 1 → leading-none
line-height: 1.25 → leading-tight
line-height: 1.375 → leading-snug
line-height: 1.5 → leading-normal
line-height: 1.625 → leading-relaxed
line-height: 2 → leading-loose
line-height: 16px → leading-4
line-height: 24px → leading-6
```

### Text Alignment
```css
text-align: left → text-left
text-align: center → text-center
text-align: right → text-right
text-align: justify → text-justify
text-align: start → text-start
text-align: end → text-end
```

### Text Transform
```css
text-transform: uppercase → uppercase
text-transform: lowercase → lowercase
text-transform: capitalize → capitalize
text-transform: none → normal-case
```

**Mek Tycoon Convention:** Labels and headers are typically `uppercase`

### Text Decoration
```css
text-decoration: underline → underline
text-decoration: line-through → line-through
text-decoration: none → no-underline
text-decoration-style: solid → decoration-solid
text-decoration-style: double → decoration-double
text-decoration-style: dotted → decoration-dotted
text-decoration-style: dashed → decoration-dashed
text-decoration-style: wavy → decoration-wavy
```

### Text Overflow
```css
/* Truncate pattern */
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis; → truncate

/* Other */
text-overflow: clip → text-clip
text-overflow: ellipsis → text-ellipsis
```

### White Space
```css
white-space: normal → whitespace-normal
white-space: nowrap → whitespace-nowrap
white-space: pre → whitespace-pre
white-space: pre-line → whitespace-pre-line
white-space: pre-wrap → whitespace-pre-wrap
```

### Word Break
```css
word-break: normal → break-normal
word-break: break-all → break-all
word-break: keep-all → break-keep
overflow-wrap: break-word → break-words
```

---

## Colors & Backgrounds

### Text Color
```css
color: #000 → text-black
color: #fff → text-white
color: #fab617 → text-[#fab617]

/* Tailwind Color Palette with Opacity */
color: rgb(59, 130, 246) → text-blue-500
color: rgba(59, 130, 246, 0.5) → text-blue-500/50
color: rgba(250, 182, 23, 0.8) → text-yellow-400/80
```

**Mek Tycoon Primary Colors:**
```css
color: #fab617 → text-[#fab617] (primary yellow/gold)
color: #ffc843 → text-[#ffc843] (lighter gold)
color: #ca8a04 → text-yellow-600 (darker gold)
```

### Background Color
```css
background-color: #000 → bg-black
background-color: #fff → bg-white
background-color: #fab617 → bg-[#fab617]
background-color: transparent → bg-transparent

/* With opacity */
background-color: rgba(0, 0, 0, 0.5) → bg-black/50
background-color: rgba(250, 182, 23, 0.1) → bg-[#fab617]/10
```

### Tailwind Default Color Palette
```css
/* Slate (Gray tones) */
bg-slate-50 → #f8fafc
bg-slate-100 → #f1f5f9
bg-slate-200 → #e2e8f0
bg-slate-300 → #cbd5e1
bg-slate-400 → #94a3b8
bg-slate-500 → #64748b
bg-slate-600 → #475569
bg-slate-700 → #334155
bg-slate-800 → #1e293b
bg-slate-900 → #0f172a
bg-slate-950 → #020617

/* Gray */
bg-gray-50 → #f9fafb
bg-gray-100 → #f3f4f6
bg-gray-200 → #e5e7eb
bg-gray-300 → #d1d5db
bg-gray-400 → #9ca3af
bg-gray-500 → #6b7280
bg-gray-600 → #4b5563
bg-gray-700 → #374151
bg-gray-800 → #1f2937
bg-gray-900 → #111827
bg-gray-950 → #030712

/* Zinc (Mek Tycoon uses this for dark backgrounds) */
bg-zinc-50 → #fafafa
bg-zinc-100 → #f4f4f5
bg-zinc-200 → #e4e4e7
bg-zinc-300 → #d4d4d8
bg-zinc-400 → #a1a1aa
bg-zinc-500 → #71717a
bg-zinc-600 → #52525b
bg-zinc-700 → #3f3f46
bg-zinc-800 → #27272a
bg-zinc-900 → #18181b
bg-zinc-950 → #09090b

/* Yellow (Primary brand color) */
bg-yellow-50 → #fefce8
bg-yellow-100 → #fef9c3
bg-yellow-200 → #fef08a
bg-yellow-300 → #fde047
bg-yellow-400 → #facc15
bg-yellow-500 → #eab308
bg-yellow-600 → #ca8a04
bg-yellow-700 → #a16207
bg-yellow-800 → #854d0e
bg-yellow-900 → #713f12
bg-yellow-950 → #422006

/* Other colors: red, orange, amber, lime, green, emerald, teal,
   cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose */
```

### Background Gradients
```css
/* Gradient directions */
background: linear-gradient(to right, ...) → bg-gradient-to-r
background: linear-gradient(to left, ...) → bg-gradient-to-l
background: linear-gradient(to top, ...) → bg-gradient-to-t
background: linear-gradient(to bottom, ...) → bg-gradient-to-b
background: linear-gradient(to top right, ...) → bg-gradient-to-tr
background: linear-gradient(to top left, ...) → bg-gradient-to-tl
background: linear-gradient(to bottom right, ...) → bg-gradient-to-br
background: linear-gradient(to bottom left, ...) → bg-gradient-to-bl

/* Gradient colors */
from-yellow-400 → gradient start color
via-orange-500 → gradient middle color (optional)
to-red-600 → gradient end color

/* Example */
background: linear-gradient(to right, #fab617, #ff0000)
  → bg-gradient-to-r from-[#fab617] to-red-500
```

### Background Size
```css
background-size: auto → bg-auto
background-size: cover → bg-cover
background-size: contain → bg-contain
```

### Background Position
```css
background-position: center → bg-center
background-position: top → bg-top
background-position: right → bg-right
background-position: bottom → bg-bottom
background-position: left → bg-left
background-position: top left → bg-left-top
/* etc. for all 9 positions */
```

### Background Repeat
```css
background-repeat: repeat → bg-repeat
background-repeat: no-repeat → bg-no-repeat
background-repeat: repeat-x → bg-repeat-x
background-repeat: repeat-y → bg-repeat-y
background-repeat: round → bg-repeat-round
background-repeat: space → bg-repeat-space
```

### Background Attachment
```css
background-attachment: fixed → bg-fixed
background-attachment: local → bg-local
background-attachment: scroll → bg-scroll
```

---

## Borders

### Border Width
```css
border: 1px solid → border
border: 2px solid → border-2
border: 4px solid → border-4
border: 8px solid → border-8
border: 0 → border-0

/* Individual sides */
border-top: 2px solid → border-t-2
border-right: 2px solid → border-r-2
border-bottom: 2px solid → border-b-2
border-left: 2px solid → border-l-2

/* Horizontal/Vertical */
border-top/bottom: 2px solid → border-y-2
border-left/right: 2px solid → border-x-2
```

**Mek Tycoon Convention:** Industrial borders use `border-2` (2px)

### Border Color
```css
border-color: #fab617 → border-[#fab617]
border-color: rgba(250, 182, 23, 0.5) → border-[#fab617]/50

/* Tailwind palette */
border-color: #facc15 → border-yellow-400
border-color: rgba(250, 204, 21, 0.5) → border-yellow-400/50

/* Individual sides */
border-top-color: #fab617 → border-t-[#fab617]
```

**Mek Tycoon Convention:** Primary borders use `border-yellow-500/50` (50% opacity)

### Border Style
```css
border-style: solid → border-solid
border-style: dashed → border-dashed
border-style: dotted → border-dotted
border-style: double → border-double
border-style: hidden → border-hidden
border-style: none → border-none
```

---

## Border Radius

```css
border-radius: 0 → rounded-none
border-radius: 2px → rounded-sm
border-radius: 4px → rounded
border-radius: 6px → rounded-md
border-radius: 8px → rounded-lg
border-radius: 12px → rounded-xl
border-radius: 16px → rounded-2xl
border-radius: 24px → rounded-3xl
border-radius: 9999px → rounded-full

/* Individual corners */
border-top-left-radius: 8px → rounded-tl-lg
border-top-right-radius: 8px → rounded-tr-lg
border-bottom-right-radius: 8px → rounded-br-lg
border-bottom-left-radius: 8px → rounded-bl-lg

/* Sides */
border-top-left/right-radius: 8px → rounded-t-lg
border-bottom-left/right-radius: 8px → rounded-b-lg
border-top-left/bottom-left-radius: 8px → rounded-l-lg
border-top-right/bottom-right-radius: 8px → rounded-r-lg
```

**Mek Tycoon Convention:** Sharp edges preferred, use `rounded` (4px) sparingly or `rounded-lg` (8px) for softer elements

---

## Effects (Shadow, Opacity, Blur)

### Box Shadow
```css
box-shadow: none → shadow-none
box-shadow: 0 1px 2px rgba(0,0,0,0.05) → shadow-sm
box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06) → shadow
box-shadow: 0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06) → shadow-md
box-shadow: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05) → shadow-lg
box-shadow: 0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04) → shadow-xl
box-shadow: 0 25px 50px rgba(0,0,0,0.25) → shadow-2xl
box-shadow: inset 0 2px 4px rgba(0,0,0,0.06) → shadow-inner

/* Custom shadows with arbitrary values */
box-shadow: 0 0 20px rgba(250, 182, 23, 0.3)
  → shadow-[0_0_20px_rgba(250,182,23,0.3)]
```

**Mek Tycoon Glow Effect:**
```css
box-shadow: 0 0 20px rgba(250, 182, 23, 0.3), inset 0 0 20px rgba(250, 182, 23, 0.1)
  → Use .mek-glow-yellow class instead
```

### Drop Shadow (Filter)
```css
filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1)) → drop-shadow-sm
filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1)) → drop-shadow
filter: drop-shadow(0 4px 3px rgba(0,0,0,0.07)) → drop-shadow-md
filter: drop-shadow(0 10px 8px rgba(0,0,0,0.04)) → drop-shadow-lg
filter: drop-shadow(0 20px 13px rgba(0,0,0,0.03)) → drop-shadow-xl
filter: drop-shadow(0 25px 25px rgba(0,0,0,0.15)) → drop-shadow-2xl
filter: none → drop-shadow-none
```

### Opacity
```css
opacity: 0 → opacity-0
opacity: 0.05 → opacity-5
opacity: 0.1 → opacity-10
opacity: 0.2 → opacity-20
opacity: 0.25 → opacity-25
opacity: 0.3 → opacity-30
opacity: 0.4 → opacity-40
opacity: 0.5 → opacity-50
opacity: 0.6 → opacity-60
opacity: 0.7 → opacity-70
opacity: 0.75 → opacity-75
opacity: 0.8 → opacity-80
opacity: 0.9 → opacity-90
opacity: 0.95 → opacity-95
opacity: 1 → opacity-100
```

### Mix Blend Mode
```css
mix-blend-mode: normal → mix-blend-normal
mix-blend-mode: multiply → mix-blend-multiply
mix-blend-mode: screen → mix-blend-screen
mix-blend-mode: overlay → mix-blend-overlay
mix-blend-mode: darken → mix-blend-darken
mix-blend-mode: lighten → mix-blend-lighten
mix-blend-mode: color-dodge → mix-blend-color-dodge
mix-blend-mode: color-burn → mix-blend-color-burn
mix-blend-mode: hard-light → mix-blend-hard-light
mix-blend-mode: soft-light → mix-blend-soft-light
mix-blend-mode: difference → mix-blend-difference
mix-blend-mode: exclusion → mix-blend-exclusion
mix-blend-mode: hue → mix-blend-hue
mix-blend-mode: saturation → mix-blend-saturation
mix-blend-mode: color → mix-blend-color
mix-blend-mode: luminosity → mix-blend-luminosity
```

---

## Filters & Backdrop Filters

### Blur
```css
filter: blur(0) → blur-none
filter: blur(4px) → blur-sm
filter: blur(8px) → blur
filter: blur(12px) → blur-md
filter: blur(16px) → blur-lg
filter: blur(24px) → blur-xl
filter: blur(40px) → blur-2xl
filter: blur(64px) → blur-3xl
```

### Backdrop Blur (Glassmorphism)
```css
backdrop-filter: blur(0) → backdrop-blur-none
backdrop-filter: blur(4px) → backdrop-blur-sm
backdrop-filter: blur(8px) → backdrop-blur
backdrop-filter: blur(12px) → backdrop-blur-md
backdrop-filter: blur(16px) → backdrop-blur-lg
backdrop-filter: blur(24px) → backdrop-blur-xl
backdrop-filter: blur(40px) → backdrop-blur-2xl
backdrop-filter: blur(64px) → backdrop-blur-3xl
```

**Mek Tycoon Convention:** Industrial cards use `backdrop-blur-md` or `backdrop-blur-lg`

### Brightness
```css
filter: brightness(0) → brightness-0
filter: brightness(0.5) → brightness-50
filter: brightness(0.75) → brightness-75
filter: brightness(0.9) → brightness-90
filter: brightness(0.95) → brightness-95
filter: brightness(1) → brightness-100
filter: brightness(1.05) → brightness-105
filter: brightness(1.1) → brightness-110
filter: brightness(1.25) → brightness-125
filter: brightness(1.5) → brightness-150
filter: brightness(2) → brightness-200
```

### Contrast, Grayscale, Hue-Rotate, Invert, Saturate, Sepia
```css
/* Similar pattern for all filter functions */
filter: contrast(0.5) → contrast-50
filter: grayscale(1) → grayscale
filter: hue-rotate(90deg) → hue-rotate-90
filter: invert(1) → invert
filter: saturate(1.5) → saturate-150
filter: sepia(1) → sepia
```

---

## Transforms

### Scale
```css
transform: scale(1) → scale-100
transform: scale(0) → scale-0
transform: scale(0.5) → scale-50
transform: scale(0.75) → scale-75
transform: scale(0.9) → scale-90
transform: scale(0.95) → scale-95
transform: scale(1.05) → scale-105
transform: scale(1.1) → scale-110
transform: scale(1.25) → scale-125
transform: scale(1.5) → scale-150

/* Axis-specific */
transform: scaleX(0.5) → scale-x-50
transform: scaleY(1.5) → scale-y-150
```

### Rotate
```css
transform: rotate(0deg) → rotate-0
transform: rotate(1deg) → rotate-1
transform: rotate(3deg) → rotate-3
transform: rotate(6deg) → rotate-6
transform: rotate(12deg) → rotate-12
transform: rotate(45deg) → rotate-45
transform: rotate(90deg) → rotate-90
transform: rotate(180deg) → rotate-180

/* Negative rotations */
transform: rotate(-45deg) → -rotate-45
```

### Translate
```css
transform: translateX(0) → translate-x-0
transform: translateX(4px) → translate-x-1
transform: translateX(16px) → translate-x-4
transform: translateX(50%) → translate-x-1/2
transform: translateX(100%) → translate-x-full

/* Y-axis */
transform: translateY(-2px) → -translate-y-0.5
transform: translateY(-8px) → -translate-y-2
transform: translateY(16px) → translate-y-4

/* Both axes */
transform: translate(4px, 8px) → translate-x-1 translate-y-2
```

**Mek Tycoon Hover Effect:** Buttons use `-translate-y-0.5` (moves up 2px on hover)

### Skew
```css
transform: skewX(3deg) → skew-x-3
transform: skewX(6deg) → skew-x-6
transform: skewX(12deg) → skew-x-12
transform: skewY(3deg) → skew-y-3
```

### Transform Origin
```css
transform-origin: center → origin-center
transform-origin: top → origin-top
transform-origin: top right → origin-top-right
transform-origin: right → origin-right
transform-origin: bottom right → origin-bottom-right
transform-origin: bottom → origin-bottom
transform-origin: bottom left → origin-bottom-left
transform-origin: left → origin-left
transform-origin: top left → origin-top-left
```

---

## Transitions & Animations

### Transition Property
```css
transition: all → transition-all
transition: none → transition-none
transition-property: color, background-color → transition-colors
transition-property: opacity → transition-opacity
transition-property: box-shadow → transition-shadow
transition-property: transform → transition-transform
```

### Transition Duration
```css
transition-duration: 75ms → duration-75
transition-duration: 100ms → duration-100
transition-duration: 150ms → duration-150
transition-duration: 200ms → duration-200
transition-duration: 300ms → duration-300
transition-duration: 500ms → duration-500
transition-duration: 700ms → duration-700
transition-duration: 1000ms → duration-1000
```

**Mek Tycoon Convention:** Most transitions use `duration-200` or `duration-300`

### Transition Timing Function
```css
transition-timing-function: linear → ease-linear
transition-timing-function: ease → ease
transition-timing-function: ease-in → ease-in
transition-timing-function: ease-out → ease-out
transition-timing-function: ease-in-out → ease-in-out
```

### Transition Delay
```css
transition-delay: 75ms → delay-75
transition-delay: 100ms → delay-100
transition-delay: 150ms → delay-150
transition-delay: 200ms → delay-200
transition-delay: 300ms → delay-300
transition-delay: 500ms → delay-500
transition-delay: 700ms → delay-700
transition-delay: 1000ms → delay-1000
```

### Animation
```css
/* From tailwind.config.ts */
animation: pulse-glow → animate-pulse-glow
animation: float → animate-float
animation: shimmer → animate-shimmer
animation: float-up → animate-float-up

/* Built-in Tailwind */
animation: none → animate-none
animation: spin → animate-spin
animation: ping → animate-ping
animation: pulse → animate-pulse
animation: bounce → animate-bounce
```

**Mek Tycoon Custom Animations:**
- `animate-pulse-glow` - Yellow glow pulsing effect
- `animate-float` - Subtle floating up/down
- `animate-shimmer` - Sliding shimmer effect
- `animate-float-up` - Rising particle effect

---

## Responsive Design

### Breakpoints (from tailwind.config.ts)
```css
/* Default Tailwind Breakpoints */
@media (min-width: 640px) → sm:
@media (min-width: 768px) → md:
@media (min-width: 1024px) → lg:
@media (min-width: 1280px) → xl:
@media (min-width: 1536px) → 2xl:

/* Mek Tycoon Custom Breakpoints */
@media (min-width: 875px) → breakpoint-3col:
@media (min-width: 1100px) → breakpoint-4col:
```

### Mobile-First Approach
```css
/* Base styles apply to mobile (< 640px) */
<div class="text-sm md:text-base lg:text-lg">

/* Translates to: */
/* Mobile (default): text-sm (14px) */
/* Tablet (768px+): text-base (16px) */
/* Desktop (1024px+): text-lg (18px) */
```

### Responsive Pattern Examples
```css
/* Grid columns by breakpoint */
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

/* Hiding/showing elements */
<div class="hidden md:block"> /* Show on tablet+ */
<div class="block md:hidden"> /* Show on mobile only */

/* Responsive spacing */
<div class="p-4 md:p-6 lg:p-8">

/* Responsive text size */
<h1 class="text-2xl md:text-3xl lg:text-4xl">
```

**Mek Tycoon Convention:** Design mobile-first, then add `md:` and `lg:` prefixes

---

## Pseudo-Classes & States

### Hover
```css
/* Apply on hover */
:hover → hover:

/* Examples */
background-color on hover → hover:bg-yellow-400
transform on hover → hover:scale-105
border-color on hover → hover:border-yellow-500
```

### Focus
```css
:focus → focus:
:focus-within → focus-within:
:focus-visible → focus-visible:

/* Common focus pattern */
outline on focus → focus:outline-none focus:ring-2 focus:ring-yellow-500
```

### Active
```css
:active → active:

/* Example: button press effect */
transform on active → active:scale-95
```

### Disabled
```css
:disabled → disabled:

/* Example */
opacity on disabled → disabled:opacity-50
cursor on disabled → disabled:cursor-not-allowed
```

### Other States
```css
:visited → visited:
:first-child → first:
:last-child → last:
:only-child → only:
:odd → odd:
:even → even:
:first-of-type → first-of-type:
:last-of-type → last-of-type:
:empty → empty:
:required → required:
:invalid → invalid:
:valid → valid:
:checked → checked:
:indeterminate → indeterminate:
:default → default:
:read-only → read-only:
:placeholder-shown → placeholder-shown:
:autofill → autofill:
:optional → optional:
:target → target:
```

### Group Hover (Parent-Child Relationship)
```css
/* Apply to parent */
<div class="group">

/* Apply to child when parent is hovered */
  <div class="opacity-0 group-hover:opacity-100">

/* Translates to: */
.group:hover .group-hover\:opacity-100 { opacity: 1; }
```

### Peer (Sibling Relationship)
```css
/* Apply to first sibling */
<input class="peer" type="checkbox">

/* Apply to second sibling when first is checked */
<div class="hidden peer-checked:block">

/* Translates to: */
.peer:checked ~ .peer-checked\:block { display: block; }
```

---

## Pseudo-Elements

### Before & After
```css
::before → before:
::after → after:

/* Content property (required) */
content: '' → before:content-['']
content: '★' → before:content-['★']

/* Examples */
.element::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
}

/* Tailwind equivalent */
<div class="relative before:content-[''] before:absolute before:inset-0 before:bg-black/50">
```

**Mek Tycoon Overlays:** Many `.mek-overlay-*` classes use `::before` and `::after` for textures

### Placeholder
```css
::placeholder → placeholder:

/* Example */
<input class="placeholder:text-gray-400 placeholder:italic">
```

### Selection
```css
::selection → selection:

/* Example */
<p class="selection:bg-yellow-400 selection:text-black">
```

### First Letter/Line
```css
::first-letter → first-letter:
::first-line → first-line:

/* Example */
<p class="first-letter:text-4xl first-letter:font-bold">
```

### Marker (List Items)
```css
::marker → marker:

/* Example */
<ul class="marker:text-yellow-400">
```

---

## Common Pattern Conversions

### Centering (Flexbox)
```css
/* Center horizontally and vertically */
display: flex;
justify-content: center;
align-items: center;

→ flex items-center justify-center
```

### Absolute Centering
```css
position: absolute;
top: 50%;
left: 50%;
transform: translate(-50%, -50%);

→ absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
```

### Full Coverage (Absolute)
```css
position: absolute;
top: 0;
right: 0;
bottom: 0;
left: 0;

→ absolute inset-0
```

### Truncate Text
```css
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;

→ truncate
```

### Aspect Ratio Container
```css
position: relative;
width: 100%;
padding-bottom: 56.25%; /* 16:9 */

→ aspect-video (16/9)
→ aspect-square (1/1)
→ aspect-[4/3]
```

### Sticky Footer
```css
min-height: 100vh;
display: flex;
flex-direction: column;

→ min-h-screen flex flex-col
```

### Card with Shadow & Hover
```css
background: white;
border-radius: 8px;
box-shadow: 0 4px 6px rgba(0,0,0,0.1);
transition: all 0.3s;

&:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px rgba(0,0,0,0.2);
}

→ bg-white rounded-lg shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg
```

### Glassmorphism Effect
```css
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.2);

→ bg-white/10 backdrop-blur-md border border-white/20
```

### Gradient Text
```css
background: linear-gradient(to right, #fab617, #ff0000);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;

→ bg-gradient-to-r from-[#fab617] to-red-500 bg-clip-text text-transparent
```

### Smooth Scroll
```css
html {
  scroll-behavior: smooth;
}

→ Add to root element: <html class="scroll-smooth">
```

---

## Things You Cannot Do (Arbitrary Values)

When Tailwind doesn't have a utility class for your CSS property, use **arbitrary values** with bracket notation:

### Syntax: `[property:value]`

### Custom Values
```css
/* Custom colors */
color: #fab617 → text-[#fab617]
background: #1a1a1a → bg-[#1a1a1a]

/* Custom spacing */
margin-top: 13px → mt-[13px]
padding: 18px → p-[18px]

/* Custom sizing */
width: 375px → w-[375px]
height: 42vh → h-[42vh]

/* Calc expressions */
height: calc(100vh - 80px) → h-[calc(100vh-80px)]
width: calc(100% - 32px) → w-[calc(100%-32px)]
```

### Complex Properties
```css
/* clip-path */
clip-path: polygon(0 0, 100% 0, 100% 100%, 10px 100%)
  → [clip-path:polygon(0_0,100%_0,100%_100%,10px_100%)]
  /* Note: Use underscores instead of spaces */

/* Complex gradients */
background: linear-gradient(135deg, rgba(250,182,23,0.02) 0%, rgba(250,182,23,0.05) 50%)
  → bg-[linear-gradient(135deg,rgba(250,182,23,0.02)_0%,rgba(250,182,23,0.05)_50%)]

/* Box shadow with multiple shadows */
box-shadow: 0 0 20px rgba(250,182,23,0.3), inset 0 0 20px rgba(250,182,23,0.1)
  → shadow-[0_0_20px_rgba(250,182,23,0.3),inset_0_0_20px_rgba(250,182,23,0.1)]

/* Grid template columns with minmax */
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))
  → grid-cols-[repeat(auto-fit,minmax(300px,1fr))]
```

### When to Use Arbitrary vs Custom CSS

**Use arbitrary values for:**
- One-off custom values
- Complex CSS properties not in Tailwind
- Project-specific measurements

**Use custom CSS classes for:**
- Repeated patterns across the site
- Complex effects requiring ::before/::after
- Keyframe animations
- Patterns that need pseudo-elements

**Mek Tycoon Approach:** Complex effects like `.mek-overlay-scratches` use custom CSS in `global-design-system.css`

---

## Mek Tycoon Specific Patterns

### Industrial Card
```css
/* CSS Pattern */
position: relative;
overflow: hidden;
backdrop-filter: blur(12px);
background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 50%);
box-shadow: inset 0 0 40px rgba(255,255,255,0.03);
border: 2px solid rgba(250,182,23,0.5);

/* Tailwind + Custom Classes */
→ mek-card-industrial mek-border-sharp-gold
```

### Industrial Header with Hazard Stripes
```css
/* Use custom class */
→ mek-header-industrial

/* Or build manually */
→ relative p-4 overflow-hidden bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.9)_0_10px,rgba(250,182,23,0.075)_10px_20px)]
```

### Primary Button (Angled)
```css
/* Use custom class */
→ mek-button-primary

/* Full Tailwind breakdown */
→ relative px-6 py-3 font-bold text-black bg-yellow-400
  uppercase tracking-wider transition-all duration-200
  [clip-path:polygon(0_0,calc(100%-10px)_0,100%_100%,10px_100%)]
  hover:bg-yellow-300 hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(250,182,23,0.3)]
```

### Value Display (Gold Number)
```css
→ mek-value-primary
/* Which applies: text-2xl font-bold text-yellow-400 */
```

### Label (Uppercase Gray)
```css
→ mek-label-uppercase
/* Which applies: text-xs text-gray-400 uppercase tracking-wider font-medium */
```

### Progress Bar
```css
/* Container */
→ mek-progress-container

/* Fill */
→ mek-progress-fill
/* Or manually: h-full bg-gradient-to-r from-yellow-400/80 to-yellow-400 transition-all duration-500 */
```

### Empty Slot (Dashed Border)
```css
→ mek-slot-empty

/* Manual */
→ relative bg-black/40 border-dashed border-2 border-gray-400
  bg-[repeating-linear-gradient(45deg,transparent_0_10px,rgba(255,255,255,0.02)_10px_20px)]
```

### Glow Effect
```css
→ mek-glow-yellow
/* Which applies: box-shadow: 0 0 20px rgba(250,182,23,0.3), inset 0 0 20px rgba(250,182,23,0.1) */

→ mek-glow-blue
/* Same but with blue color */
```

### Modal/Lightbox Pattern
```jsx
/* Always use React createPortal */
import { createPortal } from 'react-dom';

const modal = (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center
                  bg-black/80 backdrop-blur-sm"
       onClick={onClose}>
    <div className="mek-card-industrial mek-border-sharp-gold p-6 max-w-2xl"
         onClick={(e) => e.stopPropagation()}>
      {/* Content */}
    </div>
  </div>
);

return mounted ? createPortal(modal, document.body) : null;
```

### Responsive Grid (Auto-fit)
```css
/* Mek Tycoon pattern for mission cards */
→ grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]

/* Or use custom class */
→ mek-grid-industrial
```

---

## Quick Reference: Most Common Transformations

```css
/* Layout */
display: flex → flex
flex-direction: column → flex-col
justify-content: center → justify-center
align-items: center → items-center
gap: 16px → gap-4

/* Spacing */
padding: 16px → p-4
margin: 16px → m-4
margin-left: auto; margin-right: auto; → mx-auto

/* Sizing */
width: 100% → w-full
height: 100% → h-full
max-width: 1280px → max-w-7xl

/* Typography */
font-size: 16px → text-base
font-weight: 700 → font-bold
text-transform: uppercase → uppercase
letter-spacing: 0.05em → tracking-wider

/* Colors */
color: #fab617 → text-[#fab617]
background-color: #000 → bg-black
border-color: rgba(250,182,23,0.5) → border-[#fab617]/50

/* Effects */
backdrop-filter: blur(12px) → backdrop-blur-md
box-shadow: 0 4px 6px rgba(0,0,0,0.1) → shadow-md
opacity: 0.5 → opacity-50

/* Position */
position: absolute → absolute
top: 0; right: 0; bottom: 0; left: 0; → inset-0

/* Transforms */
transform: translateY(-2px) → -translate-y-0.5
transform: scale(1.05) → scale-105

/* Transitions */
transition: all 0.3s → transition-all duration-300

/* Responsive */
@media (min-width: 768px) → md:
@media (min-width: 1024px) → lg:

/* States */
:hover → hover:
:focus → focus:
:active → active:
```

---

## Final Notes

1. **Always check Tailwind v3** - Never use v4 syntax
2. **Prefer Tailwind utilities** over arbitrary values when possible
3. **Use custom classes** (`.mek-*`) for complex repeating patterns
4. **Mobile-first** - Base styles for mobile, add breakpoints for larger screens
5. **Combine utilities** - Multiple classes are better than one complex arbitrary value
6. **Check existing patterns** - Mek Tycoon has many reusable `.mek-*` classes
7. **Preserve visual fidelity** - Match the original design's appearance closely
8. **Document decisions** - If unsure, note why you chose a particular transformation

---

**Last Updated:** 2025-11-04
**Tailwind Version:** v3.4.x
**Project:** Mek Tycoon
