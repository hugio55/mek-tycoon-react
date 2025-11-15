"use client";

import { useRef, useEffect } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  prevX?: number;
  prevY?: number;
}

interface Starfield2LayerProps {
  // Layer 1 controls (regular stars)
  layer1Enabled?: boolean;
  layer1Speed?: number;
  layer1Density?: number;
  layer1Size?: number;

  // Layer 2 controls (fast streaks)
  layer2Enabled?: boolean;
  layer2Speed?: number;
  layer2Density?: number;
  layer2Size?: number;
  layer2LineLength?: number;
}

export default function Starfield2Layer({
  layer1Enabled = true,
  layer1Speed = 2.0,
  layer1Density = 200,
  layer1Size = 1.0,

  layer2Enabled = true,
  layer2Speed = 8.0,
  layer2Density = 100,
  layer2Size = 1.0,
  layer2LineLength = 2.0,
}: Starfield2LayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsLayer1Ref = useRef<Star[]>([]);
  const starsLayer2Ref = useRef<Star[]>([]);
  const animationFrameRef = useRef<number>();

  console.log('[⭐2LAYER] Component mounted with props:', {
    layer1Enabled, layer1Speed, layer1Density, layer1Size,
    layer2Enabled, layer2Speed, layer2Density, layer2Size, layer2LineLength
  });

  // Initialize stars when density changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;
    const maxZ = 1500;

    console.log('[⭐2LAYER] Initializing stars - Layer 1:', layer1Density, 'Layer 2:', layer2Density);

    // Initialize Layer 1 stars (regular dots)
    starsLayer1Ref.current = Array.from({ length: Math.floor(layer1Density) }, () => ({
      x: Math.random() * width - width / 2,
      y: Math.random() * height - height / 2,
      z: Math.random() * maxZ,
    }));

    // Initialize Layer 2 stars (fast streaks)
    starsLayer2Ref.current = Array.from({ length: Math.floor(layer2Density) }, () => ({
      x: Math.random() * width - width / 2,
      y: Math.random() * height - height / 2,
      z: Math.random() * maxZ,
    }));
  }, [layer1Density, layer2Density]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    console.log('[⭐2LAYER] Starting animation loop');

    // Set canvas size to match window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.log('[⭐2LAYER] Canvas resized to:', canvas.width, 'x', canvas.height);
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxZ = 1500;

    const animate = () => {
      // Stop animation entirely if both layers are disabled
      if (!layer1Enabled && !layer2Enabled) {
        ctx.clearRect(0, 0, width, height); // Clear once and stop
        return; // Don't schedule next frame
      }

      // Clear canvas completely (transparent, no trails)
      ctx.clearRect(0, 0, width, height);

      // Draw Layer 1 (regular stars)
      if (layer1Enabled) {
        starsLayer1Ref.current.forEach((star) => {
          star.z -= layer1Speed;

          if (star.z <= 0) {
            star.x = Math.random() * width - width / 2;
            star.y = Math.random() * height - height / 2;
            star.z = maxZ;
          }

          const scale = 1000 / star.z;
          const x = star.x * scale + centerX;
          const y = star.y * scale + centerY;
          const size = (1 - star.z / maxZ) * 2 * layer1Size;

          if (x >= 0 && x <= width && y >= 0 && y <= height) {
            const opacity = Math.min(1, (maxZ - star.z) / maxZ);
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // Draw Layer 2 (fast streaks/lines)
      if (layer2Enabled) {
        starsLayer2Ref.current.forEach((star) => {
          star.z -= layer2Speed;

          if (star.z <= 0) {
            star.x = Math.random() * width - width / 2;
            star.y = Math.random() * height - height / 2;
            star.z = maxZ;
          }

          const scale = 1000 / star.z;
          const x = star.x * scale + centerX;
          const y = star.y * scale + centerY;
          const size = (1 - star.z / maxZ) * 2 * layer2Size;

          if (x >= 0 && x <= width && y >= 0 && y <= height) {
            const opacity = Math.min(1, (maxZ - star.z) / maxZ);

            // Calculate previous position to create streak effect
            const prevZ = star.z + layer2Speed * layer2LineLength;
            const prevScale = 1000 / prevZ;
            const prevX = star.x * prevScale + centerX;
            const prevY = star.y * prevScale + centerY;

            // Draw star as a line (streak)
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.lineWidth = size * 0.5;
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(x, y);
            ctx.stroke();
          }
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [layer1Enabled, layer1Speed, layer1Size, layer2Enabled, layer2Speed, layer2Size, layer2LineLength]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
