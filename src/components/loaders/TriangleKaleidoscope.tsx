'use client';

/**
 * Triangle Kaleidoscope - Transformed from Pug/SCSS
 *
 * Original: Rotating triangular shapes with color-cycling animation
 * Creates a mesmerizing kaleidoscope effect with blend modes
 *
 * Transformation applied:
 * - Converted Pug → React JSX
 * - Converted SCSS/Compass → Tailwind + inline styles
 * - Preserved clip-path polygon calculations
 * - Maintained animation timing and easing
 */

export default function TriangleKaleidoscope() {
  const n = 6; // Number of triangle groups
  const m = 3; // Number of layers per group
  const radius = 3; // 3em radius
  const gap = 8; // 8px gap

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
    <div className="grid place-items-center w-full h-full bg-black">
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
                const hue = (j / m) * 360;
                const rotateEnd = offsetAngle + (direction * 360) / 3;

                return (
                  <div
                    key={j}
                    className="absolute kaleidoscope-layer"
                    style={{
                      padding: `${radius}em`,
                      rotate: `${offsetAngle}deg`,
                      clipPath: triangleClipPath,
                      mixBlendMode: 'screen',
                      background: `conic-gradient(from 150deg at 50% 0, hsl(${hue}, 100%, 50%) 0% 60deg, transparent 0)`,
                      color: `hsl(${hue}, 100%, 50%)`,
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
      </div>

      {/* Global styles for animations - injected via <head> */}
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
