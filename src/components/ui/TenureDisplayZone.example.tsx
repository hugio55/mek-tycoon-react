/**
 * TENURE DISPLAY ZONE - Usage Examples
 *
 * This file demonstrates how to use TenureDisplayZone in different contexts,
 * particularly for overlay editor display zones.
 */

import TenureDisplayZone from './TenureDisplayZone';

// ==========================================
// EXAMPLE 1: MINIMAL VARIANT (Small Overlay)
// ==========================================
// Use case: Compact display in tight spaces, overlaid on slot artwork
export function MinimalOverlayExample() {
  return (
    <TenureDisplayZone
      currentTenure={45.5}
      maxTenure={100}
      size="small"
      variant="minimal"
      onLevelUp={() => console.log('Level up!')}
      // Position via overlay editor - these would come from display zone config
      style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        transform: 'scale(0.9)' // Fine-tune scaling
      }}
    />
  );
}

// ==========================================
// EXAMPLE 2: STANDARD VARIANT (Medium Size)
// ==========================================
// Use case: Default display with all info, good for main slot displays
export function StandardOverlayExample() {
  return (
    <TenureDisplayZone
      currentTenure={75}
      maxTenure={100}
      size="medium"
      variant="standard"
      isTenureBuffed={true}
      buffMultiplier={1.5}
      onLevelUp={() => console.log('Level up!')}
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px'
      }}
    />
  );
}

// ==========================================
// EXAMPLE 3: DETAILED VARIANT (Full Industrial)
// ==========================================
// Use case: Featured display with maximum visual detail
export function DetailedOverlayExample() {
  return (
    <TenureDisplayZone
      currentTenure={100}
      maxTenure={100}
      size="large"
      variant="detailed"
      isTenureBuffed={true}
      buffMultiplier={2.0}
      tenureRatePerDay={1.5}
      onLevelUp={() => console.log('Ready to level up!')}
      showLevelUpButton={true}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)' // Center on slot
      }}
    />
  );
}

// ==========================================
// EXAMPLE 4: NOT SLOTTED STATE
// ==========================================
// Use case: Show greyed out when Mek is not in slot
export function NotSlottedExample() {
  return (
    <TenureDisplayZone
      currentTenure={30}
      maxTenure={100}
      size="medium"
      variant="standard"
      isSlotted={false} // Greyed out + no interactions
      style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px'
      }}
    />
  );
}

// ==========================================
// EXAMPLE 5: ACCUMULATING STATE
// ==========================================
// Use case: Progress bar filling as tenure accumulates
export function AccumulatingExample() {
  return (
    <TenureDisplayZone
      currentTenure={67.3}
      maxTenure={100}
      size="medium"
      variant="standard"
      tenureRatePerDay={1.2}
      onLevelUp={() => {}} // No level up yet
      showLevelUpButton={true} // Will show when ready
      style={{
        position: 'absolute',
        top: '15px',
        right: '15px'
      }}
    />
  );
}

// ==========================================
// EXAMPLE 6: READY TO LEVEL UP
// ==========================================
// Use case: Tenure at 100%, glowing Level Up button
export function ReadyToLevelUpExample() {
  return (
    <TenureDisplayZone
      currentTenure={100}
      maxTenure={100}
      size="medium"
      variant="standard"
      onLevelUp={() => {
        console.log('Leveling up Mek!');
        // Trigger level up mutation
        // Reset tenure to 0
        // Increment Mek level
      }}
      showLevelUpButton={true}
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)' // Centered horizontally
      }}
    />
  );
}

// ==========================================
// EXAMPLE 7: BUFFED TENURE RATE
// ==========================================
// Use case: Show visual indicator when tenure rate is boosted
export function BuffedTenureExample() {
  return (
    <TenureDisplayZone
      currentTenure={50}
      maxTenure={100}
      size="medium"
      variant="detailed"
      isTenureBuffed={true}
      buffMultiplier={1.8}
      tenureRatePerDay={2.5} // Base rate * buff
      onLevelUp={() => console.log('Level up!')}
      style={{
        position: 'absolute',
        top: '10%',
        right: '5%'
      }}
    />
  );
}

// ==========================================
// EXAMPLE 8: OVERLAY EDITOR INTEGRATION
// ==========================================
// Use case: How this integrates with display zone config
export function OverlayEditorIntegration() {
  // Simulated display zone config from overlay editor
  const displayZoneConfig = {
    id: 'tenure-display-1',
    type: 'TENURE_PROGRESS',
    x: 10, // Position in pixels or percentage
    y: 10,
    width: 224, // Medium size (56 * 4 = 224px)
    height: 'auto',
    scale: 1.0,
    variant: 'standard' as const,
    size: 'medium' as const
  };

  // Real tenure data from Convex
  const mekData = {
    currentTenure: 85.7,
    maxTenure: 100,
    tenureRatePerDay: 1.2,
    isTenureBuffed: false,
    buffMultiplier: 1.0
  };

  return (
    <TenureDisplayZone
      currentTenure={mekData.currentTenure}
      maxTenure={mekData.maxTenure}
      size={displayZoneConfig.size}
      variant={displayZoneConfig.variant}
      isTenureBuffed={mekData.isTenureBuffed}
      buffMultiplier={mekData.buffMultiplier}
      tenureRatePerDay={mekData.tenureRatePerDay}
      onLevelUp={() => {
        // Trigger Convex mutation to level up Mek
        console.log('Level up Mek!');
      }}
      style={{
        position: 'absolute',
        left: `${displayZoneConfig.x}px`,
        top: `${displayZoneConfig.y}px`,
        transform: `scale(${displayZoneConfig.scale})`
      }}
    />
  );
}

// ==========================================
// EXAMPLE 9: RESPONSIVE SIZING
// ==========================================
// Use case: Different sizes for different slot display contexts
export function ResponsiveSizingExample() {
  return (
    <>
      {/* Small for compact slots */}
      <TenureDisplayZone
        currentTenure={40}
        maxTenure={100}
        size="small"
        variant="minimal"
        style={{ position: 'absolute', top: '5px', left: '5px' }}
      />

      {/* Medium for standard slots */}
      <TenureDisplayZone
        currentTenure={60}
        maxTenure={100}
        size="medium"
        variant="standard"
        style={{ position: 'absolute', top: '50px', left: '5px' }}
      />

      {/* Large for featured/main display */}
      <TenureDisplayZone
        currentTenure={80}
        maxTenure={100}
        size="large"
        variant="detailed"
        tenureRatePerDay={1.5}
        style={{ position: 'absolute', top: '120px', left: '5px' }}
      />
    </>
  );
}

// ==========================================
// EXAMPLE 10: ANIMATION STATES
// ==========================================
// Use case: Different visual states based on progress
export function AnimationStatesExample() {
  return (
    <>
      {/* Low progress - basic shimmer */}
      <TenureDisplayZone
        currentTenure={25}
        maxTenure={100}
        size="medium"
        variant="standard"
      />

      {/* High progress - more visual activity */}
      <TenureDisplayZone
        currentTenure={90}
        maxTenure={100}
        size="medium"
        variant="standard"
      />

      {/* 100% complete - full particle effects + glow */}
      <TenureDisplayZone
        currentTenure={100}
        maxTenure={100}
        size="medium"
        variant="detailed"
        onLevelUp={() => console.log('Level up!')}
      />
    </>
  );
}

// ==========================================
// KEY FEATURES SUMMARY
// ==========================================

/*
SIZE VARIANTS:
- small:  160px wide (w-40), compact for tight spaces
- medium: 224px wide (w-56), standard display
- large:  288px wide (w-72), featured/main display

STYLE VARIANTS:
- minimal:  Just progress bar + numbers + button (most compact)
- standard: Includes label, stats, grid background (balanced)
- detailed: Full industrial treatment with hazard stripes, metal textures (maximum detail)

FUNCTIONAL STATES:
1. Accumulating: Progress bar smoothly filling (0-99%)
2. Ready: Bar at 100%, Level Up button active with glow + particles
3. Not Slotted: Greyed out (opacity-40 + grayscale + no interactions)
4. Buffed: Green lightning bolt icon + buff multiplier displayed

VISUAL EFFECTS:
- Shimmer animation on progress fill
- Particle sweep effect when at 100%
- Scan line animation when ready
- Corner cuts for industrial aesthetic
- Metal scratches overlay (detailed variant)
- Hazard stripes background (detailed variant)
- Pulsing glow on Level Up button

INTEGRATION NOTES:
- Use with overlay editor display zones
- Position via 'style' prop (absolute positioning)
- Scale via CSS transform if needed
- Pass tenure data from Convex queries
- Handle level up via Convex mutation
- Component is fully self-contained (no external dependencies except design system CSS)
*/
