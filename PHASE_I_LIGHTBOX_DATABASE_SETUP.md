# Phase I Lightbox Database Setup - Complete

## Overview
The Phase I lightbox settings are now stored in Convex database and can be updated in real-time from the landing-debug page.

## Database Structure

### Storage Location
Settings are stored in the `landingDebugUnified` table under the `shared` section (applies to both desktop and mobile).

### Available Fields
```typescript
{
  phaseILightboxContent: string,      // Large text content for lightbox
  phaseIVideoScale: number,            // Video scale (default: 1.0)
  phaseIVideoPositionX: number,        // Video X position (default: 0)
  phaseIVideoPositionY: number,        // Video Y position (default: 0)
  phaseIBackdropBlur: number,          // Backdrop blur amount (default: 20)
  phaseITextFont: string,              // Typography font (e.g., 'Arial', 'Orbitron')
  phaseITextFontSize: number,          // Font size in pixels (default: 16)
  phaseITextColor: string,             // Tailwind text color class (e.g., 'text-white/70')
}
```

## Convex Functions

### Queries

**`getPhaseILightboxSettings`**
- Returns only Phase I lightbox settings
- Automatically returns defaults if no settings exist
- Example usage:
```typescript
const settings = useQuery(api.phaseILightbox.getPhaseILightboxSettings);
```

### Mutations

**`updatePhaseILightboxSettings`**
- Partial update - only updates provided fields
- Leaves other Phase I settings and all other landing settings untouched
- All arguments are optional
- Example usage:
```typescript
const updateSettings = useMutation(api.phaseILightbox.updatePhaseILightboxSettings);

// Update just the content
updateSettings({ phaseILightboxContent: "New content here" });

// Update multiple fields
updateSettings({
  phaseIVideoScale: 1.2,
  phaseIBackdropBlur: 15,
  phaseITextFontSize: 18
});
```

**`resetPhaseILightboxSettings`**
- Resets only Phase I lightbox settings to defaults
- Leaves all other landing settings untouched
- Example usage:
```typescript
const resetSettings = useMutation(api.phaseILightbox.resetPhaseILightboxSettings);
resetSettings();
```

## Real-Time Updates

The settings use Convex's real-time reactivity:
1. Update settings in landing-debug page
2. Phase I lightbox immediately reflects changes
3. No page refresh needed
4. Works across all open browser tabs/windows

## Testing

A test page has been created at `/test-phase-i-lightbox` that demonstrates:
- Reading settings from database
- Updating individual fields
- Real-time updates
- Reset functionality

## Integration with Landing Debug Page

The landing-debug page should add controls for Phase I lightbox settings:
1. Large textarea for `phaseILightboxContent`
2. Number inputs for video scale and position
3. Slider for backdrop blur
4. Typography controls (font, size, color)

These controls should use the `updatePhaseILightboxSettings` mutation for updates.

## Files Created/Modified

### New Files
- `convex/phaseILightbox.ts` - Convex queries and mutations
- `src/components/PhaseILightboxTest.tsx` - Test component
- `src/app/test-phase-i-lightbox/page.tsx` - Test page

### Modified Files
- `convex/landingDebugUnified.ts` - Added Phase I defaults to DEFAULT_CONFIG

### Schema
No schema changes needed - the existing `landingDebugUnified` table uses `v.any()` for flexible settings.

## Next Steps

1. Add Phase I lightbox controls to landing-debug page
2. Update Phase I lightbox component to read from database
3. Test real-time updates work properly
4. Remove test page once integration is complete
