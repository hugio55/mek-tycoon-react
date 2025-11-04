# Aceternity Component Examples

## Tooltip

### Basic Usage
```tsx
import { Tooltip } from "@/components/aceternity/tooltip";

<Tooltip content="This is a helpful tip">
  <button>Hover me</button>
</Tooltip>
```

### With Rich Content
```tsx
<Tooltip
  content={
    <div className="text-center">
      <p className="font-semibold mb-1">Time Remaining on Listing</p>
      <p className="text-xs">2 hours, 34 minutes remaining</p>
    </div>
  }
>
  <div className="cursor-help">
    <ClockIcon className="w-4 h-4" />
  </div>
</Tooltip>
```

### Features
- **Smart Positioning**: Automatically adjusts to stay within viewport
- **Mobile Support**: Touch events with 2-second visibility delay
- **Animations**: Smooth fade-in/out with Framer Motion
- **Industrial Styling**: Yellow border, black translucent background, Orbitron font

### Styling
The tooltip automatically includes:
- Yellow border (`border-yellow-500/80`)
- Black translucent background (`bg-black/95`)
- Backdrop blur effect (`backdrop-blur-md`)
- Yellow glow shadow (`shadow-yellow-500/30`)
- Orbitron font for text
- Fixed positioning at z-index 9999

### Props
- `content` (required): String or React node to display in tooltip
- `children` (required): Element that triggers the tooltip on hover
- `containerClassName` (optional): Additional classes for the trigger container

### Current Usage
See `/src/app/essence-market/page.tsx` around line 2663 for a real-world example of the tooltip in use.
