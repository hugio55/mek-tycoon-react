'use client';

import { useEffect, useRef } from 'react';

// ============================================
// INTERPOLATION TOGGLE
// Set to false to revert to original behavior
// ============================================
const USE_INTERPOLATION = true;

interface Star {
  x: number;
  y: number;
  z: number;
  prevZ: number;
  age: number;
  size: number;
}

const StarField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', {
      alpha: true,
      willReadFrequently: false
    });
    if (!ctx) return;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();

    const STAR_COUNT_LAYER1 = 120;
    const STAR_COUNT_LAYER2 = 20;
    const SPEED_LAYER1 = 0.6;
    const SPEED_LAYER2 = 30;
    const MAX_DEPTH = 1000;
    const MIN_DEPTH = 1;
    const PI2 = Math.PI * 2;

    let HALF_WIDTH = canvas.width / 2;
    let HALF_HEIGHT = canvas.height / 2;
    let CANVAS_WIDTH = canvas.width;
    let CANVAS_HEIGHT = canvas.height;

    // Initialize Layer 1 stars
    const starsLayer1: Star[] = [];
    for (let i = 0; i < STAR_COUNT_LAYER1; i++) {
      const z = Math.random() * MAX_DEPTH;
      starsLayer1.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        z,
        prevZ: z,
        age: 1000,
        size: 1 + Math.random() * 0.3
      });
    }

    // Initialize Layer 2 stars
    const starsLayer2: Star[] = [];
    for (let i = 0; i < STAR_COUNT_LAYER2; i++) {
      const z = Math.random() * MAX_DEPTH;
      starsLayer2.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        z,
        prevZ: z,
        age: 1000,
        size: 2
      });
    }

    // Pre-allocate RGBA strings to avoid garbage collection
    const opacityCache = new Map<number, string>();
    const getRGBA = (opacity: number): string => {
      const key = Math.round(opacity * 100);
      let cached = opacityCache.get(key);
      if (!cached) {
        cached = `rgba(255, 255, 255, ${(key / 100).toFixed(2)})`;
        opacityCache.set(key, cached);
      }
      return cached;
    };

    let lastFrameTime = 0;
    let accumulator = 0;
    const FIXED_TIMESTEP = 16.67;

    const animate = (currentTime: number) => {
      if (lastFrameTime === 0) {
        lastFrameTime = currentTime;
        animationId = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = Math.min(currentTime - lastFrameTime, 50);
      lastFrameTime = currentTime;
      accumulator += deltaTime;

      let iterations = 0;
      while (accumulator >= FIXED_TIMESTEP && iterations < 3) {
        updateStars();
        accumulator -= FIXED_TIMESTEP;
        iterations++;
      }
      if (iterations >= 3) {
        accumulator = 0;
      }

      // Calculate interpolation factor (0.0 to 1.0)
      const alpha = USE_INTERPOLATION ? accumulator / FIXED_TIMESTEP : 1;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      renderStars(alpha);
      animationId = requestAnimationFrame(animate);
    };

    const updateStars = () => {
      // Layer 1: Slow dots
      for (let i = 0; i < STAR_COUNT_LAYER1; i++) {
        const star = starsLayer1[i];
        star.prevZ = star.z;
        star.z -= SPEED_LAYER1;
        star.age += FIXED_TIMESTEP;

        if (star.z <= MIN_DEPTH) {
          star.z = MAX_DEPTH;
          star.prevZ = star.z; // Prevent backward interpolation on respawn
          star.x = (Math.random() - 0.5) * 2000;
          star.y = (Math.random() - 0.5) * 2000;
          star.age = 0;
          star.size = 1 + Math.random() * 0.3;
        }
      }

      // Layer 2: Fast streaks
      for (let i = 0; i < STAR_COUNT_LAYER2; i++) {
        const star = starsLayer2[i];
        star.prevZ = star.z;
        star.z -= SPEED_LAYER2;
        star.age += FIXED_TIMESTEP;

        if (star.z <= MIN_DEPTH) {
          star.z = MAX_DEPTH;
          star.prevZ = star.z; // Prevent backward interpolation on respawn
          star.x = (Math.random() - 0.5) * 2000;
          star.y = (Math.random() - 0.5) * 2000;
          star.age = 0;
        }
      }
    };

    const renderStars = (alpha: number) => {
      // Layer 1: Slow dots
      for (let i = 0; i < STAR_COUNT_LAYER1; i++) {
        const star = starsLayer1[i];

        // Interpolate Z for smooth rendering
        const renderZ = USE_INTERPOLATION
          ? star.prevZ + (star.z - star.prevZ) * alpha
          : star.z;

        const scale = MAX_DEPTH / renderZ;
        const screenX = star.x * scale + HALF_WIDTH;
        const screenY = star.y * scale + HALF_HEIGHT;

        if (screenX < 0 || screenX > CANVAS_WIDTH ||
            screenY < 0 || screenY > CANVAS_HEIGHT) {
          continue;
        }

        const fadeInDuration = 5000;
        const fadeInProgress = Math.min(star.age / fadeInDuration, 1);
        const opacity = fadeInProgress * 0.8;

        ctx.fillStyle = getRGBA(opacity);
        ctx.beginPath();
        ctx.arc(screenX, screenY, star.size, 0, PI2);
        ctx.fill();
      }

      // Layer 2: Fast streaks
      for (let i = 0; i < STAR_COUNT_LAYER2; i++) {
        const star = starsLayer2[i];

        // Interpolate Z for smooth rendering
        const renderZ = USE_INTERPOLATION
          ? star.prevZ + (star.z - star.prevZ) * alpha
          : star.z;

        const scale = MAX_DEPTH / renderZ;
        const screenX = star.x * scale + HALF_WIDTH;
        const screenY = star.y * scale + HALF_HEIGHT;

        // Calculate trail position (one speed unit behind interpolated position)
        const trailZ = renderZ + SPEED_LAYER2;
        const trailScale = MAX_DEPTH / trailZ;
        const trailX = star.x * trailScale + HALF_WIDTH;
        const trailY = star.y * trailScale + HALF_HEIGHT;

        if (screenX < -50 || screenX > CANVAS_WIDTH + 50 ||
            screenY < -50 || screenY > CANVAS_HEIGHT + 50) {
          continue;
        }

        const fadeInDuration = 3000;
        const fadeInProgress = Math.min(star.age / fadeInDuration, 1);
        const opacity = fadeInProgress * 0.8;

        ctx.strokeStyle = getRGBA(opacity);
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(trailX, trailY);
        ctx.lineTo(screenX, screenY);
        ctx.stroke();
      }
    };

    let animationId = requestAnimationFrame(animate);

    const handleResize = () => {
      setCanvasSize();
      HALF_WIDTH = canvas.width / 2;
      HALF_HEIGHT = canvas.height / 2;
      CANVAS_WIDTH = canvas.width;
      CANVAS_HEIGHT = canvas.height;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 1,
        willChange: 'auto',
        transform: 'translateZ(0)'
      }}
    />
  );
};

export default StarField;
