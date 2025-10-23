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

import React from 'react';

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
};

// Extract color from sprite image path
function getSpriteColor(imagePath: string): string {
  const filename = imagePath.toLowerCase();

  // Map filename colors to CSS colors
  if (filename.includes('yellow') || filename.includes('gold')) {
    return '250, 182, 23'; // Yellow/gold
  }
  if (filename.includes('blue')) {
    return '59, 130, 246'; // Blue
  }
  if (filename.includes('purp') || filename.includes('purple') || filename.includes('violet')) {
    return '168, 85, 247'; // Purple
  }
  if (filename.includes('red') || filename.includes('crimson')) {
    return '239, 68, 68'; // Red
  }
  if (filename.includes('green') || filename.includes('emerald')) {
    return '34, 197, 94'; // Green
  }
  if (filename.includes('orange') || filename.includes('amber')) {
    return '251, 146, 60'; // Orange
  }
  if (filename.includes('pink') || filename.includes('rose')) {
    return '236, 72, 153'; // Pink
  }
  if (filename.includes('cyan') || filename.includes('teal')) {
    return '20, 184, 166'; // Cyan
  }
  if (filename.includes('white') || filename.includes('silver')) {
    return '226, 232, 240'; // White/silver
  }

  // Default to yellow if unknown
  return '250, 182, 23';
}

export function OverlayRenderer({
  overlayData,
  displayWidth,
  filterSprites,
  highlightFilter,
  highlightStyle,
  highlightAnimation = 'animate-pulse',
  useColorGlow = false,
}: OverlayRendererProps) {
  if (!overlayData) return null;

  const { imageWidth, imageHeight, zones } = overlayData;

  // Get only sprite zones
  let sprites = zones.filter(zone => zone.mode === 'sprite');

  // Apply filter if provided
  if (filterSprites) {
    sprites = sprites.filter(filterSprites);
  }

  return (
    <>
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

        return (
          <div
            key={sprite.id}
            className="absolute"
            style={{
              left: `${xPercent}%`,
              top: `${yPercent}%`,
              // CRITICAL: Position by top-left corner to match overlay editor
              // DO NOT add translate(-50%, -50%) here
              transition: 'all 0.3s ease',
            }}
            title={sprite.label || sprite.metadata?.variationName}
          >
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {sprite.overlayImage && (
                <>
                  <img
                    src={sprite.overlayImage}
                    alt={sprite.label || "sprite"}
                    className={isHighlighted ? highlightAnimation : ''}
                    style={{
                      animationDuration: isHighlighted ? '1s' : undefined,
                      maxWidth: '100%',
                      height: 'auto',
                      transform: `scale(${finalScale})`,
                      transformOrigin: 'top left',
                      display: 'block',
                    }}
                  />
                  {/* Centered glow overlay on top of sprite */}
                  {isHighlighted && (
                    <div
                      className={highlightAnimation}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: `radial-gradient(circle at center, rgba(${glowColor}, 0.9) 0%, rgba(${glowColor}, 0.6) 30%, transparent 60%)`,
                        mixBlendMode: 'screen',
                        pointerEvents: 'none',
                        filter: 'brightness(1.8) saturate(1.5)',
                        animationDuration: '1s',
                      }}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
