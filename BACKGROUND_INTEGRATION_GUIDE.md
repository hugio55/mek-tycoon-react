# Background Image Integration Guide

## Quick Start

The UI team has added the background image. Here's how to integrate it with mobile optimization.

---

## Option 1: Basic Integration (Simplest)

Replace `StarfieldWithControls` with basic responsive background:

### Step 1: Update page.tsx

```typescript
// Add state for background position
const [backgroundVerticalPosition, setBackgroundVerticalPosition] = useState(50);

// Replace this:
<StarfieldWithControls />

// With this:
<ResponsiveBackgroundImage
  verticalPosition={backgroundVerticalPosition}
  onVerticalPositionChange={setBackgroundVerticalPosition}
/>
```

### Step 2: Update debug panel props

```typescript
<CompactDebugPanel
  // ... existing props
  backgroundVerticalPosition={backgroundVerticalPosition}
  onBackgroundVerticalPositionChange={setBackgroundVerticalPosition}
/>
```

### Step 3: Add import

```typescript
import ResponsiveBackgroundImage from "@/components/ResponsiveBackgroundImage";
```

**Done!** Background will work on all screen sizes with hardware-accelerated positioning.

---

## Option 2: Advanced Integration (Best Performance)

Use advanced component with responsive image loading and preloading.

### Step 1: Update page.tsx

```typescript
// Add state
const [backgroundVerticalPosition, setBackgroundVerticalPosition] = useState(50);

// Replace StarfieldWithControls
<ResponsiveBackgroundImageAdvanced
  verticalPosition={backgroundVerticalPosition}
  onVerticalPositionChange={setBackgroundVerticalPosition}
  enableResponsiveLoading={true} // Loads different sizes per device
  overlayOpacity={0.5} // Adjustable overlay strength
/>
```

### Step 2: Add preload link in layout.tsx or page.tsx head

```typescript
// In <head> section or next/head component
<link
  rel="preload"
  href="/colored-bg-1.webp"
  as="image"
  fetchpriority="high"
/>
```

### Step 3: Generate optimized images (one-time setup)

```bash
# Install sharp if not already installed
npm install sharp

# Run optimization script
node scripts/optimize-background.js
```

This creates:
- `colored-bg-1-mobile.webp` (100KB) - For phones
- `colored-bg-1-tablet.webp` (200KB) - For tablets
- `colored-bg-1-desktop.webp` (305KB) - For desktop

**Performance gain:** Mobile users load 100KB instead of 305KB (67% savings)

---

## Logo Alignment Strategy

Choose one approach based on your design:

### Approach A: Logo Follows Background (Recommended)

Logo moves with background slider - they stay aligned.

```typescript
// In logo component
const logoStyle = {
  top: `${backgroundVerticalPosition}%`,
  transform: 'translateY(-50%)', // Center on focal point
};
```

**Pros:**
- Simple mental model
- Logo always aligned with background focal point
- One slider controls both

**Use when:** Logo is part of the background design

---

### Approach B: Logo Independent

Logo has separate position control.

```typescript
// Separate state
const [logoVerticalPosition, setLogoVerticalPosition] = useState(35);

// Logo component
const logoStyle = {
  top: `${logoVerticalPosition}%`,
};
```

**Pros:**
- Maximum flexibility
- Can fine-tune independently
- Different positions on different breakpoints

**Use when:** Logo needs to be positioned differently than background

---

### Approach C: Fixed Viewport Position

Logo stays at fixed viewport position (e.g., always 25vh from top).

```typescript
const logoStyle = {
  top: '25vh', // Fixed 25% of viewport height
};
```

**Pros:**
- Logo never moves during scrolling
- Predictable position across all devices
- No dependency on background

**Use when:** Logo is UI element, not part of background design

---

## Responsive Positioning Presets

Add these presets to debug panel for quick testing:

### Mobile Portrait (< 768px)
- **Upper Focus:** 35% - Logo and content at top
- **Centered:** 50% - Traditional centered layout
- **Lower Focus:** 65% - Content above fold, background below

### Tablet (768px - 1024px)
- **Upper Focus:** 40%
- **Centered:** 50%
- **Lower Focus:** 60%

### Desktop (> 1024px)
- **Centered:** 50% - Standard centered design

### Code Example: Responsive Auto-Adjust

```typescript
useEffect(() => {
  const updatePosition = () => {
    if (window.innerWidth < 768) {
      setBackgroundVerticalPosition(35); // Mobile: upper focus
    } else if (window.innerWidth < 1024) {
      setBackgroundVerticalPosition(45); // Tablet: slightly upper
    } else {
      setBackgroundVerticalPosition(50); // Desktop: centered
    }
  };

  updatePosition();
  window.addEventListener('resize', updatePosition);

  return () => window.removeEventListener('resize', updatePosition);
}, []);
```

---

## Testing Checklist

### Visual Tests
1. Open DevTools → Toggle device toolbar
2. Test these viewports:
   - iPhone SE (320×568)
   - iPhone 14 Pro (393×852)
   - iPad Mini (768×1024)
   - Desktop (1920×1080)
3. Verify:
   - [ ] Full-width coverage (no white edges)
   - [ ] Focal point visible at all sizes
   - [ ] Logo aligns with background
   - [ ] No horizontal scrolling
   - [ ] Overlay doesn't obscure content

### Performance Tests
1. Open DevTools → Network tab
2. Set throttling to "Slow 4G"
3. Hard refresh (Ctrl+Shift+R)
4. Check:
   - [ ] LCP < 2.5 seconds
   - [ ] Background doesn't block interactions
   - [ ] Slider responds at 60fps
   - [ ] No layout shift when background loads

### Mobile Device Tests (Real Devices)
1. Test on actual phone (iOS or Android)
2. Check:
   - [ ] Smooth scrolling
   - [ ] Touch slider works
   - [ ] No overscroll white flash
   - [ ] Text readable over background
   - [ ] Performance feels smooth

---

## Troubleshooting

### Background Not Showing
**Check:**
1. File exists at `/public/colored-bg-1.webp`
2. No typos in filename
3. Component is rendered (not hidden by z-index)
4. No CSP blocking image

**Debug:**
```typescript
// Add to component
useEffect(() => {
  console.log('Background URL:', getBackgroundImageUrl());
}, []);
```

---

### Background Cuts Off Important Area
**Problem:** Focal point not visible at 50% position

**Solution:**
1. Open debug panel
2. Adjust vertical slider (try 30%, 40%, 60%, 70%)
3. Find position where focal point is centered
4. Update default state to that value

---

### Poor Performance on Mobile
**Symptoms:** Laggy scrolling, slow slider

**Solutions:**
1. **Enable responsive loading:**
   ```typescript
   enableResponsiveLoading={true}
   ```
2. **Generate smaller images:** Run `node scripts/optimize-background.js`
3. **Reduce overlay effects:** Lower `overlayOpacity` to 0.3
4. **Remove animations:** Set `transition-opacity` to `duration-0`

---

### Logo Doesn't Align
**Problem:** Logo and background shift independently

**Solution:** Use Approach A (Logo Follows Background)
```typescript
// In logo component
style={{ top: `${backgroundVerticalPosition}%` }}
```

---

### Text Unreadable Over Background
**Problem:** Low contrast between text and background

**Solutions:**
1. **Increase overlay opacity:**
   ```typescript
   overlayOpacity={0.7}
   ```
2. **Add text shadows:**
   ```css
   text-shadow: 0 2px 8px rgba(0,0,0,0.8);
   ```
3. **Use semi-transparent panels:**
   ```css
   background: rgba(0, 0, 0, 0.6);
   backdrop-filter: blur(8px);
   ```

---

## Advanced: Parallax Effect (Desktop Only)

Add subtle depth with parallax scrolling (desktop only, disabled on mobile for performance).

```typescript
const [scrollY, setScrollY] = useState(0);

useEffect(() => {
  const handleScroll = () => {
    // Only on desktop
    if (window.innerWidth > 1024) {
      setScrollY(window.scrollY);
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

// Apply parallax transform
<div
  style={{
    transform: window.innerWidth > 1024
      ? `translateY(${scrollY * 0.3}px)` // 30% scroll speed
      : 'none',
  }}
>
```

**Warning:** Only enable on desktop. Mobile devices struggle with parallax performance.

---

## Production Checklist

Before deploying:

- [ ] Remove debug info panel (in ResponsiveBackgroundImageAdvanced)
- [ ] Set final `backgroundVerticalPosition` default value
- [ ] Add preload link for background image
- [ ] Generate and deploy optimized images (mobile/tablet/desktop)
- [ ] Test on real mobile devices (iOS + Android)
- [ ] Verify Core Web Vitals pass (LCP < 2.5s, CLS < 0.1)
- [ ] Check text contrast meets WCAG AA (4.5:1 ratio)
- [ ] Test with slow network (Slow 4G throttle)
- [ ] Verify no horizontal scroll on 320px viewport
- [ ] Test landscape orientation on phones

---

## File Locations

**Components:**
- `src/components/ResponsiveBackgroundImage.tsx` - Basic version
- `src/components/ResponsiveBackgroundImageAdvanced.tsx` - Performance-optimized version
- `src/components/CompactDebugPanel.tsx` - Updated with background controls

**Assets:**
- `public/colored-bg-1.webp` - Current background (305KB)
- `public/colored-bg-1-mobile.webp` - Mobile version (100KB) - Generate with script
- `public/colored-bg-1-tablet.webp` - Tablet version (200KB) - Generate with script
- `public/colored-bg-1-desktop.webp` - Desktop version (305KB) - Generate with script

**Scripts:**
- `scripts/optimize-background.js` - Image optimization tool

**Documentation:**
- `MOBILE_BACKGROUND_OPTIMIZATION.md` - Technical details
- `BACKGROUND_INTEGRATION_GUIDE.md` - This file

---

## Summary

**Simplest path:** Use Option 1 (Basic Integration)
- Replace StarfieldWithControls
- Add background state
- Update debug panel props
- Done in 5 minutes

**Best performance:** Use Option 2 (Advanced Integration)
- Use advanced component
- Generate optimized images
- Add preload link
- 67% faster on mobile

**Logo alignment:** Use Approach A (Logo Follows Background)
- Simplest mental model
- Logo and background move together
- One slider controls both
