# Typography System Migration Guide

## Quick Start

The new typography system provides 14 unique font families for different UI contexts, breaking away from the monotonous use of Orbitron everywhere.

### Import the System

```typescript
// For TypeScript/React components
import { fonts, typography, typographyClasses, getFontStyle } from '@/lib/typography';

// CSS classes are automatically available via globals.css
```

## Font Families by Purpose

### Display & Headers
- **Michroma** - Hero titles, main branding (naturally bold, futuristic)
- **Audiowide** - Page headers, section titles (wide, technical)
- **Russo One** - Military/tactical headers (condensed, strong)
- **Black Ops One** - Warnings, critical alerts (military stencil)

### UI & Interface
- **Exo 2** - Clean UI, shop/marketplace (variable weight, modern)
- **Saira** - Primary UI text, navigation (readable, versatile)
- **Space Grotesk** - Descriptions, body text (excellent readability)
- **Oxanium** - Labels, tags, small text (compact, clear)

### Data & Technical
- **JetBrains Mono** - Numbers, stats, data (monospace, precise)
- **Share Tech Mono** - Technical readouts, system info (retro terminal)
- **Teko** - Large numbers, timers (tall, condensed)
- **Bebas Neue** - Impact text, leaderboards (bold, attention-grabbing)

### Legacy Support
- **Orbitron** - Maintained for backward compatibility
- **Rajdhani** - Secondary font option

## Migration Examples

### Before (Everything Orbitron)
```tsx
<h1 style={{ fontFamily: "'Orbitron', sans-serif" }}>Page Title</h1>
<p style={{ fontFamily: "'Orbitron', sans-serif" }}>Description</p>
<span style={{ fontFamily: "'Orbitron', sans-serif" }}>1,234</span>
```

### After (Contextual Typography)
```tsx
// Using CSS classes (recommended)
<h1 className="typo-hero-title">Page Title</h1>
<p className="typo-description">Description</p>
<span className="typo-data-medium">1,234</span>

// Using style objects
<h1 style={getFontStyle('heroTitle')}>Page Title</h1>
<p style={typography.description}>Description</p>
<span style={typography.dataMedium}>1,234</span>

// Direct font application
<h1 className="font-michroma">Page Title</h1>
<p className="font-space">Description</p>
<span className="font-jetbrains">1,234</span>
```

## Page-Specific Recommendations

### HUB Page
- **Headers**: Michroma (hero) or Audiowide (sections)
- **UI Text**: Saira
- **Numbers**: JetBrains Mono
- **Labels**: Oxanium

### Combat/Missions
- **Headers**: Black Ops One or Russo One
- **Alerts**: Military fonts with red/orange colors
- **Stats**: Share Tech Mono
- **UI**: Russo One for buttons

### Shop/Marketplace
- **Headers**: Exo 2 (clean, commercial)
- **Product Names**: Space Grotesk
- **Prices**: JetBrains Mono
- **Labels**: Oxanium

### Crafting
- **Headers**: Audiowide
- **Component Names**: Oxanium
- **Progress**: Share Tech Mono
- **Descriptions**: Space Grotesk

### Leaderboard
- **Headers**: Bebas Neue (impact)
- **Rankings**: Teko (large numbers)
- **Player Names**: Saira
- **Stats**: JetBrains Mono

## Special Effects

### Glitch Effect
```tsx
<h1 className="typo-glitch" data-text="ERROR">ERROR</h1>
```

### Scan Line
```tsx
<h1 className="typo-scan">SCANNING...</h1>
```

### Variable Weight Animation
```tsx
<h1 className="typo-variable-weight">DYNAMIC TEXT</h1>
```

### Text Glow
```tsx
<h1 className="text-glow-yellow">GLOWING TEXT</h1>
// Available: yellow, blue, red, green, cyan, purple, orange
```

## CSS Class Reference

### Display Classes
- `typo-hero-title` - Largest hero text
- `typo-page-title` - Page headers
- `typo-section-header` - Section titles
- `typo-military` - Military style text
- `typo-alert` - Alert messages

### UI Classes
- `typo-card-title` - Card headers
- `typo-card-subtitle` - Card subtitles
- `typo-ui-primary` - Main UI text
- `typo-ui-secondary` - Secondary UI text
- `typo-description` - Description text

### Data Classes
- `typo-data-large` - Large numbers
- `typo-data-medium` - Medium numbers
- `typo-data-small` - Small numbers
- `typo-stat-value` - Stat displays
- `typo-stat-label` - Stat labels
- `typo-timer` - Timer displays
- `typo-countdown` - Countdown text

### Label Classes
- `typo-label` - Standard labels
- `typo-label-subtle` - Subtle labels
- `typo-badge` - Badge text

### Button Classes
- `typo-button-primary` - Primary buttons
- `typo-button-secondary` - Secondary buttons
- `typo-button-small` - Small buttons

### Utility Classes
- `font-michroma`, `font-audiowide`, `font-russo`, etc. - Direct font application
- `text-glow-[color]` - Glow effects
- `tracking-[size]` - Letter spacing adjustments

## Implementation Checklist

When updating a page:

1. **Identify Context** - What type of page is it? (hub, combat, shop, etc.)
2. **Choose Fonts** - Select appropriate fonts for headers, UI, and data
3. **Apply Classes** - Use predefined typography classes
4. **Add Effects** - Apply glows, animations where appropriate
5. **Test Readability** - Ensure text remains readable
6. **Maintain Hierarchy** - Keep clear visual hierarchy

## Performance Notes

- All fonts are loaded via Google Fonts with `display=swap`
- Font subsetting is automatic for better performance
- Variable fonts (Exo 2, Saira) provide weight flexibility
- Monospace fonts use `font-variant-numeric: tabular-nums` for stable number widths

## Backward Compatibility

The system maintains full backward compatibility:
- Orbitron remains available as `font-orbitron`
- Existing inline styles continue to work
- Gradual migration is supported

## View the Showcase

Visit `/typography-showcase` to see all fonts and effects in action.