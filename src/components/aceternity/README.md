# Aceternity UI Components

Clean, standalone implementations of Aceternity UI components without the complexity of shadcn init.

## Why This Folder Exists

Aceternity UI (https://ui.aceternity.com) provides beautiful React components, but requires shadcn/ui setup which can cause dependency conflicts. This folder provides a simpler alternative:

- **No shadcn required** - Direct component implementations
- **No dependency conflicts** - Self-contained components
- **Easy to add** - Just copy, paste, and adapt
- **Project-styled** - Pre-configured for Mek Tycoon's industrial aesthetic

## Current Components

### Tooltip (`tooltip.tsx`)
Hover/touch-activated tooltip with smart positioning and industrial styling.

**Usage:**
```tsx
import { Tooltip } from "@/components/aceternity/tooltip";

<Tooltip content="Your tooltip text or JSX">
  <button>Hover me</button>
</Tooltip>
```

**Features:**
- Smart viewport-aware positioning (never goes off-screen)
- Mobile touch support with 2-second delay
- Smooth fade-in/out animations
- Yellow border with black/translucent background
- Orbitron font for consistency
- Fixed positioning at z-index 9999

## Adding New Aceternity Components

When you find a component on ui.aceternity.com that you want to use:

1. **Copy the component code** from the Aceternity website
2. **Create new file** in this folder (e.g., `card-hover.tsx`, `moving-border.tsx`)
3. **Adapt styling** to match Mek Tycoon's industrial theme:
   - Replace colors with yellow (#fab617) accents
   - Use Orbitron font for headers
   - Add backdrop-blur effects
   - Use black backgrounds with transparency
4. **Export the component** as a named export
5. **Import in your page** using `@/components/aceternity/[component-name]`

## Styling Guidelines

All Aceternity components in this folder should follow these styling conventions:

### Colors
- **Primary accent**: `border-yellow-500`, `text-yellow-500/80`
- **Background**: `bg-black/95` with `backdrop-blur-md`
- **Text**: `text-yellow-100` (off-white with yellow tint)
- **Shadows**: `shadow-yellow-500/30` for subtle glows

### Typography
- **Font**: Orbitron via `font-['Orbitron']`
- **Headers**: Uppercase with `tracking-wider`
- **Body**: Clean and readable

### Effects
- **Borders**: 2px with yellow and medium opacity
- **Blur**: Use `backdrop-blur-md` for glass-morphism
- **Animations**: Smooth with Framer Motion, 150ms duration
- **Z-index**: 9999 for overlays/tooltips

### Positioning
- **Modals/Tooltips**: Use `fixed` positioning
- **Smart positioning**: Check viewport bounds, adjust automatically
- **Mobile-friendly**: Touch support with appropriate delays

## Example: Adding a New Component

Let's say you want to add the "Moving Border" button from Aceternity:

1. Go to https://ui.aceternity.com/components/moving-border
2. Copy the component code
3. Create `src/components/aceternity/moving-border.tsx`
4. Adapt the code:
   - Change blue colors to yellow
   - Add Orbitron font
   - Adjust sizing if needed
5. Use in your page:
   ```tsx
   import { MovingBorder } from "@/components/aceternity/moving-border";

   <MovingBorder>Click me</MovingBorder>
   ```

## Benefits Over shadcn/ui

- **No init required** - No complex setup process
- **No CLI needed** - No shadcn CLI installation
- **No conflicts** - Won't interfere with existing dependencies
- **Full control** - Easy to customize and maintain
- **Predictable** - No magic, just React components

## When NOT to Use This Folder

Don't put general project components here. This folder is specifically for:
- Components from ui.aceternity.com
- Third-party UI library implementations
- Standalone animated/interactive UI primitives

Regular project components go in `/src/components/`.
