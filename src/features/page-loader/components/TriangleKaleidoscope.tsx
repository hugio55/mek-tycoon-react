'use client';

import React from 'react';

interface TriangleKaleidoscopeProps {
  size?: number;
  chromaticOffset?: number;
}

/**
 * Triangle Kaleidoscope - Mesmerizing geometric loader animation
 *
 * Creates a kaleidoscope effect with rotating triangular shapes
 * Featuring white triangles with RGB chromatic aberration on black background
 *
 * @param size - Optional size multiplier (default: 1)
 * @param chromaticOffset - Optional chromatic aberration offset in pixels (default: 0)
 */
export function TriangleKaleidoscope({ size = 1, chromaticOffset = 0 }: TriangleKaleidoscopeProps) {
  const n = 6; // Number of triangle groups
  const m = 3; // Number of layers per group
  const radius = 3 * size; // Scalable radius
  const gap = 8 * size; // Scalable gap

  // Generate polygon clip-path for triangle (3 sides)
  const triangleClipPath = (() => {
    const sides = 3;
    const baseAngle = 360 / sides;
    const points: string[] = [];

    for (let i = 0; i < sides; i++) {
      const currentAngle = i * baseAngle - 90; // Start from top
      const radians = (currentAngle * Math.PI) / 180;
      const x = 50 * (1 + Math.cos(radians));
      const y = 50 * (1 + Math.sin(radians));
      points.push(`${x}% ${y}%`);
    }

    return `polygon(${points.join(', ')})`;
  })();

  return (
    <div className="relative w-full h-full grid place-items-center">
      {Array.from({ length: n }).map((_, i) => {
        const k = +(i / n).toFixed(3);
        const isEven = i % 2 === 0;
        const direction = isEven ? 1 : -1;

        return (
          <div
            key={i}
            className="absolute grid place-items-center"
            style={{
              transform: `rotate(${k}turn) translateY(calc(${radius}em + ${gap}px))`,
              gridArea: '1 / 1'
            }}
          >
            {Array.from({ length: m }).map((_, j) => {
              const offset = j - 0.5 * (m - 1);
              const offsetAngle = offset * 5; // degrees
              const rotateEnd = offsetAngle + (direction * 360) / 3;

              // RGB chromatic aberration effect: brighter white base with RGB channel offsets
              const chromaticColors = [
                'rgba(255, 100, 100, 0.9)',     // Red channel (brighter)
                'rgba(100, 255, 100, 0.9)',     // Green channel (brighter)
                'rgba(100, 100, 255, 0.9)'      // Blue channel (brighter)
              ];
              const color = chromaticColors[j % 3];

              // Calculate chromatic aberration offset for each channel
              const chromaticOffsets = [
                { x: -chromaticOffset, y: 0 },      // Red: left
                { x: 0, y: 0 },                      // Green: center (no offset)
                { x: chromaticOffset, y: 0 }         // Blue: right
              ];
              const channelOffset = chromaticOffsets[j % 3];

              return (
                <div
                  key={j}
                  className="absolute kaleidoscope-layer"
                  style={{
                    padding: `${radius}em`,
                    rotate: `${offsetAngle}deg`,
                    clipPath: triangleClipPath,
                    mixBlendMode: 'screen',
                    background: `conic-gradient(from 150deg at 50% 0, ${color} 0% 60deg, transparent 0)`,
                    animationDelay: `${k * -2}s`,
                    gridArea: '1 / 1',
                    transform: `translate(${channelOffset.x}px, ${channelOffset.y}px)`,
                    // CSS variables for animations
                    ['--rotate-end' as string]: `${rotateEnd}deg`,
                    ['--easing-start' as string]: 0.75 + offset * 0.1,
                    ['--easing-end' as string]: 0.25 - offset * 0.1
                  } as React.CSSProperties}
                />
              );
            })}
          </div>
        );
      })}

      {/* Inline styles for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes triangleScale {
            to { scale: 0; }
          }

          @keyframes triangleRotate {
            to {
              rotate: var(--rotate-end);
            }
          }

          .kaleidoscope-layer {
            animation:
              triangleScale 1s ease-in infinite alternate,
              triangleRotate 2s infinite;
            animation-timing-function: ease-in, cubic-bezier(var(--easing-start, 0.75), 0, var(--easing-end, 0.25), 1);
          }
        `
      }} />
    </div>
  );
}
