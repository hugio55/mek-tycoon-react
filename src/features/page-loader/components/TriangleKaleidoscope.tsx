'use client';

import React from 'react';

interface TriangleKaleidoscopeProps {
  size?: number;
}

/**
 * Triangle Kaleidoscope - Mesmerizing geometric loader animation
 *
 * Creates a kaleidoscope effect with rotating triangular shapes
 * Featuring white triangles with RGB chromatic aberration on black background
 *
 * @param size - Optional size multiplier (default: 1)
 */
export function TriangleKaleidoscope({ size = 1 }: TriangleKaleidoscopeProps) {
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

              // RGB chromatic aberration effect: white base with RGB channel offsets
              const chromaticColors = [
                'rgba(255, 0, 0, 0.6)',     // Red channel
                'rgba(0, 255, 0, 0.6)',     // Green channel
                'rgba(0, 0, 255, 0.6)'      // Blue channel
              ];
              const color = chromaticColors[j % 3];

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
