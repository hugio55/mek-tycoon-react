"use client";

import { useRef, useEffect, useState } from "react";

type AnimationMode = "forward" | "asteroidBelt";

interface Star {
  x: number;
  y: number;
  z: number;
  prevX?: number;
  prevY?: number;
  depth?: number; // For asteroid belt mode - which layer (0-1, closer = 1)
}

interface StarfieldCanvasProps {
  mode?: AnimationMode;
  speed?: number;
  scale?: number;
  density?: number;
}

export default function StarfieldCanvas({
  mode = "forward",
  speed = 1.0,
  scale = 1.0,
  density = 1.0,
}: StarfieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationFrameRef = useRef<number>();

  // Initialize stars based on mode and density
  useEffect(() => {
    console.log('[⭐CANVAS] StarfieldCanvas mounted with props:', { mode, speed, scale, density });
    const starCount = Math.floor(800 * density);
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('[⭐CANVAS] Canvas ref not ready during star initialization');
      return;
    }
    console.log('[⭐CANVAS] Initializing', starCount, 'stars');

    const width = canvas.width;
    const height = canvas.height;

    starsRef.current = Array.from({ length: starCount }, () => {
      if (mode === "asteroidBelt") {
        // Asteroid Belt: Stars in horizontal layers below the camera
        const depth = Math.random(); // 0 = far, 1 = close
        return {
          x: Math.random() * width * 2 - width / 2, // Wider spread for wrapping
          y: height * 0.33 + Math.random() * height * 0.67, // Lower 2/3 of screen
          z: depth,
          depth,
        };
      } else {
        // Forward Motion: Stars spread in 3D space
        return {
          x: Math.random() * width - width / 2,
          y: Math.random() * height - height / 2,
          z: Math.random() * width,
        };
      }
    });
  }, [mode, density]);

  // Animation loop
  useEffect(() => {
    console.log('[⭐CANVAS] Animation loop starting');
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('[⭐CANVAS] Canvas ref not ready during animation setup');
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.log('[⭐CANVAS] Could not get 2D context');
      return;
    }
    console.log('[⭐CANVAS] Got 2D context, starting animation');

    // Set canvas size to match window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.log('[⭐CANVAS] Canvas resized to:', canvas.width, 'x', canvas.height);
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const animate = () => {
      // Clear canvas with fade trail for smooth motion blur
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, width, height);

      starsRef.current.forEach((star) => {
        if (mode === "asteroidBelt") {
          // Asteroid Belt Glide Mode
          const depth = star.depth || 0;
          const parallaxSpeed = speed * (0.5 + depth * 1.5); // Closer = faster

          // Move horizontally (left to right in this case)
          star.x += parallaxSpeed;

          // Wrap around when star leaves screen
          if (star.x > width + 50) {
            star.x = -50;
            star.y = height * 0.33 + Math.random() * height * 0.67;
          }

          // Perspective scaling based on depth
          const size = (0.5 + depth * 2.5) * scale;
          const brightness = 0.3 + depth * 0.7; // Closer = brighter

          // Draw star
          ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
          ctx.fill();

          // Optional: Add glow for larger asteroids/stars
          if (size > 1.5) {
            ctx.fillStyle = `rgba(250, 182, 23, ${brightness * 0.3})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, size * 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Forward Motion Mode (original)
          // Move towards camera
          star.z -= speed * 2;

          // Reset star when it passes the camera
          if (star.z <= 0) {
            star.x = Math.random() * width - width / 2;
            star.y = Math.random() * height - height / 2;
            star.z = width;
          }

          // Project 3D position to 2D screen
          const k = 128.0 * scale;
          const px = (star.x / star.z) * k + centerX;
          const py = (star.y / star.z) * k + centerY;

          // Calculate previous position for motion blur trail
          if (star.prevX !== undefined && star.prevY !== undefined) {
            const size = ((1 - star.z / width) * 2) * scale;

            // Draw trail line
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + size * 0.3})`;
            ctx.lineWidth = size;
            ctx.beginPath();
            ctx.moveTo(star.prevX, star.prevY);
            ctx.lineTo(px, py);
            ctx.stroke();
          }

          // Draw star point
          const size = ((1 - star.z / width) * 2) * scale;
          ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + size * 0.4})`;
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();

          // Store current position for next frame's trail
          star.prevX = px;
          star.prevY = py;
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mode, speed, scale]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1]"
    />
  );
}
