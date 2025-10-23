/**
 * OverlayRenderer - Universal sprite display component
 *
 * This component renders sprites positioned using the OverlayEditor.
 * It ensures perfect 1:1 coordinate matching between editor and display.
 *
 * CRITICAL: Sprite positioning uses top-left corner alignment to match OverlayEditor.
 * Do NOT add translate(-50%, -50%) or center alignment - it will break positioning.
 *
 * Usage:
 * ```tsx
 * <OverlayRenderer
 *   overlayData={triangleOverlayData}
 *   displayWidth={768}  // Actual rendered width of base image
 *   filterSprites={(sprite) => isOwned(sprite)}  // Optional filter
 *   highlightFilter={(sprite) => isOwned(sprite)}  // Optional highlight
 * />
 * ```
 */

import React, { useState } from 'react';

type Sprite = {
  id: string;
  mode: 'sprite' | 'zone';
  x: number;
  y: number;
  overlayImage?: string;
  label?: string;
  metadata?: {
    variationName?: string;
    variationType?: string;
    spriteScale?: number;
    imageWidth?: number;
    imageHeight?: number;
  };
};

type OverlayData = {
  imageWidth: number;
  imageHeight: number;
  zones: Sprite[];
};

type OverlayRendererProps = {
  /** Overlay data from Convex database */
  overlayData: OverlayData | null | undefined;

  /** Actual rendered width of the base image in pixels */
  displayWidth: number;

  /** Optional filter function to show only certain sprites */
  filterSprites?: (sprite: Sprite) => boolean;

  /** Optional function to determine if a sprite should be highlighted */
  highlightFilter?: (sprite: Sprite) => boolean;

  /** Custom highlight style (default: golden glow) */
  highlightStyle?: React.CSSProperties;

  /** Animation class for highlighted sprites */
  highlightAnimation?: string;

  /** Use color-based glow from sprite image filename */
  useColorGlow?: boolean;

  /** Function to get owned count for a variation */
  getOwnedCount?: (variationName: string, variationType: string) => number;

  /** Function to get total count for a variation in collection */
  getTotalCount?: (variationName: string, variationType: string) => number;
};

// Extract color from sprite image path - matches exact bulb colors
function getSpriteColor(imagePath: string): string {
  const filename = imagePath.toLowerCase();

  // Map filename colors to exact bulb center colors
  if (filename.includes('white') || filename.includes('silver')) {
    return '240, 245, 250'; // Bright white with slight blue tint
  }
  if (filename.includes('blue') || filename.includes('true-blue')) {
    return '100, 180, 255'; // Cyan-blue bulb color
  }
  if (filename.includes('yellow') || filename.includes('gold')) {
    return '255, 230, 100'; // Warm yellow bulb
  }
  if (filename.includes('purp') || filename.includes('purple') || filename.includes('violet')) {
    return '200, 120, 255'; // Purple/violet bulb
  }
  if (filename.includes('red') || filename.includes('crimson')) {
    return '255, 100, 100'; // Red
  }
  if (filename.includes('green') || filename.includes('emerald')) {
    return '120, 255, 150'; // Green
  }
  if (filename.includes('orange') || filename.includes('amber')) {
    return '255, 180, 100'; // Orange
  }
  if (filename.includes('pink') || filename.includes('rose')) {
    return '255, 150, 200'; // Pink
  }
  if (filename.includes('cyan') || filename.includes('teal')) {
    return '100, 230, 230'; // Cyan
  }

  // Default to warm yellow if unknown
  return '255, 230, 100';
}

export function OverlayRenderer({
  overlayData,
  displayWidth,
  filterSprites,
  highlightFilter,
  highlightStyle,
  highlightAnimation = 'animate-pulse',
  useColorGlow = false,
  getOwnedCount,
  getTotalCount,
}: OverlayRendererProps) {
  const [hoveredSprite, setHoveredSprite] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!overlayData) return null;

  const { imageWidth, imageHeight, zones } = overlayData;

  // Get only sprite zones
  let sprites = zones.filter(zone => zone.mode === 'sprite');

  // Apply filter if provided
  if (filterSprites) {
    sprites = sprites.filter(filterSprites);
  }

  // Generate a pseudo-random delay based on sprite ID (0-5s to spread across full cycle)
  const getAnimationDelay = (spriteId: string): number => {
    let hash = 0;
    for (let i = 0; i < spriteId.length; i++) {
      hash = ((hash << 5) - hash) + spriteId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 5000) / 1000; // Returns 0-4.999s
  };

  return (
    <>
      <style>{`
        @keyframes bulb-flicker {
          /* Mostly off (0-15%) */
          0%, 15% { opacity: 0; }
          /* Quick fade up (15-18%) */
          18% { opacity: 1; }
          /* Bright period with flickers (18-40%) */
          20.0% { opacity: 1; }
          20.1% { opacity: 0.2; }
          20.3% { opacity: 0.2; }
          20.4% { opacity: 1; }
          25.0% { opacity: 1; }
          25.1% { opacity: 0.3; }
          25.3% { opacity: 0.3; }
          25.4% { opacity: 1; }
          25.6% { opacity: 0.25; }
          25.9% { opacity: 0.25; }
          26.0% { opacity: 1; }
          30.0% { opacity: 1; }
          30.1% { opacity: 0.35; }
          30.4% { opacity: 0.35; }
          30.5% { opacity: 1; }
          /* Slow fade down (40-50%) */
          40% { opacity: 1; }
          50% { opacity: 0; }
          /* Stay off until next cycle (50-100%) */
          100% { opacity: 0; }
        }
      `}</style>
      {sprites.map((sprite) => {
        const isHighlighted = highlightFilter ? highlightFilter(sprite) : false;

        // Convert from absolute pixels to percentages based on original image dimensions
        const xPercent = (sprite.x / imageWidth) * 100;
        const yPercent = (sprite.y / imageHeight) * 100;

        // Calculate scale factor based on actual display size
        const displayScale = displayWidth / imageWidth;
        const finalScale = displayScale * (sprite.metadata?.spriteScale || 1);

        // Determine glow color and intensity
        let glowColor = '250, 182, 23'; // Default yellow
        if (isHighlighted && useColorGlow && sprite.overlayImage) {
          glowColor = getSpriteColor(sprite.overlayImage);
        }

        // Get unique animation delay for this sprite
        const animationDelay = getAnimationDelay(sprite.id);

        const variationName = sprite.metadata?.variationName || sprite.label || 'Unknown';
        const variationType = sprite.metadata?.variationType || 'unknown';
        const ownedCount = getOwnedCount ? getOwnedCount(variationName, variationType) : 0;
        const totalCount = getTotalCount ? getTotalCount(variationName, variationType) : 0;

        // Calculate actual sprite dimensions using absolute metadata
        const spriteWidth = (sprite.metadata?.imageWidth || 100) * finalScale;
        const spriteHeight = (sprite.metadata?.imageHeight || 100) * finalScale;

        return (
          <div
            key={sprite.id}
            className="absolute"
            style={{
              left: `${xPercent}%`,
              top: `${yPercent}%`,
              // CRITICAL: Set explicit dimensions to match scaled sprite for accurate hit box
              width: `${spriteWidth}px`,
              height: `${spriteHeight}px`,
              // CRITICAL: Position by top-left corner to match overlay editor
              // DO NOT add translate(-50%, -50%) here
              overflow: 'visible', // Allow scaled image to render at full size
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              setHoveredSprite(sprite.id);
              // Calculate tooltip position from container rect (now correctly sized)
              const rect = e.currentTarget.getBoundingClientRect();
              // Position tooltip at horizontal center, above sprite
              setTooltipPos({
                x: rect.left + spriteWidth / 2,
                y: rect.top - 10
              });
            }}
            onMouseLeave={() => setHoveredSprite(null)}
          >
            {sprite.overlayImage && (
              <>
                {/* Sprite image - NO animation, stays at 100% opacity */}
                <img
                  src={sprite.overlayImage}
                  alt={sprite.label || "sprite"}
                  style={{
                    transform: `scale(${finalScale})`,
                    transformOrigin: 'top left',
                    display: 'block',
                  }}
                />
                {/* Circular glow overlay - positioned exactly like sprite */}
                {isHighlighted && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: `radial-gradient(circle at center, rgba(${glowColor}, 1) 0%, rgba(${glowColor}, 0.7) 15%, transparent 40%)`,
                      mixBlendMode: 'normal',
                      pointerEvents: 'none',
                      filter: 'brightness(1.5) saturate(2)',
                      animation: `bulb-flicker 5s ease-in-out infinite`,
                      animationDelay: `${animationDelay}s`,
                      transform: `scale(${finalScale})`,
                      transformOrigin: 'top left',
                    }}
                  />
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Custom Tooltip */}
      {hoveredSprite && (() => {
        const sprite = sprites.find(s => s.id === hoveredSprite);
        if (!sprite) return null;

        const variationName = sprite.metadata?.variationName || sprite.label || 'Unknown';
        const variationType = sprite.metadata?.variationType || 'unknown';
        const ownedCount = getOwnedCount ? getOwnedCount(variationName, variationType) : 0;
        const totalCount = getTotalCount ? getTotalCount(variationName, variationType) : 0;

        return (
          <div
            style={{
              position: 'fixed',
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: 'translate(-50%, -100%)',
              zIndex: 10000,
              pointerEvents: 'none',
            }}
          >
            <div className="bg-black/95 border-2 border-yellow-500/70 rounded-lg px-4 py-3 shadow-2xl">
              <div className="text-yellow-400 font-bold text-sm uppercase tracking-wide mb-1">
                {variationName}
              </div>
              <div className="text-gray-300 text-xs">
                <span className="text-yellow-400 font-bold">{ownedCount}</span> owned
              </div>
              <div className="text-gray-400 text-xs">
                {totalCount} in collection
              </div>
            </div>
            {/* Arrow pointing down */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                bottom: -6,
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid rgba(250, 182, 23, 0.7)',
              }}
            />
          </div>
        );
      })()}
    </>
  );
}
