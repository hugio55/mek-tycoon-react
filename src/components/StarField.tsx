'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
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

    const STAR_COUNT_LAYER1 = 120; // Reduced from 220 for better performance
    const STAR_COUNT_LAYER2 = 20;  // Reduced from 40 for better performance
    const SPEED_LAYER1 = 1.5;
    const SPEED_LAYER2 = 30;
    const MAX_DEPTH = 1000;
    const MIN_DEPTH = 1;
    const PI2 = Math.PI * 2;

    let HALF_WIDTH = canvas.width / 2;
    let HALF_HEIGHT = canvas.height / 2;
    let CANVAS_WIDTH = canvas.width;
    let CANVAS_HEIGHT = canvas.height;

    const starsLayer1: Star[] = [];
    for (let i = 0; i < STAR_COUNT_LAYER1; i++) {
      starsLayer1.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        z: Math.random() * MAX_DEPTH,
        age: 1000,
        size: 1 + Math.random() * 0.3
      });
    }

    const starsLayer2: Star[] = [];
    for (let i = 0; i < STAR_COUNT_LAYER2; i++) {
      starsLayer2.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        z: Math.random() * MAX_DEPTH,
        age: 1000,
        size: 2
      });
    }

    // Pre-allocate RGBA strings to avoid garbage collection during animation
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
    const FIXED_TIMESTEP = 16.67; // Fixed 60fps timestep for consistent physics

    const animate = (currentTime: number) => {
      // Skip first frame to avoid huge deltaTime on initial render
      if (lastFrameTime === 0) {
        lastFrameTime = currentTime;
        animationId = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = Math.min(currentTime - lastFrameTime, 50); // Cap at 50ms to prevent spiral of death
      lastFrameTime = currentTime;
      accumulator += deltaTime;

      // Fixed timestep updates - stars move EXACTLY the same distance each update
      // Limit to max 3 iterations to prevent performance spiral
      let iterations = 0;
      while (accumulator >= FIXED_TIMESTEP && iterations < 3) {
        updateStars();
        accumulator -= FIXED_TIMESTEP;
        iterations++;
      }
      // If we hit limit, discard excess accumulator to prevent spiral
      if (iterations >= 3) {
        accumulator = 0;
      }

      // Render every frame for smooth 60fps display
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      renderStars();
      animationId = requestAnimationFrame(animate);
    };

    // Fixed timestep physics update - consistent movement every time
    const updateStars = () => {

      // Layer 1: Slow dots - FIXED distance movement
      for (let i = 0; i < STAR_COUNT_LAYER1; i++) {
        const star = starsLayer1[i];
        star.z -= SPEED_LAYER1; // No multiplier - moves exact same distance every update
        star.age += FIXED_TIMESTEP;

        if (star.z <= MIN_DEPTH) {
          star.z = MAX_DEPTH;
          star.x = (Math.random() - 0.5) * 2000;
          star.y = (Math.random() - 0.5) * 2000;
          star.age = 0;
          star.size = 1 + Math.random() * 0.3;
        }
      }

      // Layer 2: Fast streaks - FIXED distance movement
      for (let i = 0; i < STAR_COUNT_LAYER2; i++) {
        const star = starsLayer2[i];
        star.z -= SPEED_LAYER2; // No multiplier - moves exact same distance every update
        star.age += FIXED_TIMESTEP;

        if (star.z <= MIN_DEPTH) {
          star.z = MAX_DEPTH;
          star.x = (Math.random() - 0.5) * 2000;
          star.y = (Math.random() - 0.5) * 2000;
          star.age = 0;
        }
      }
    };

    // Rendering function - draws current state every frame
    const renderStars = () => {
      // Layer 1: Slow dots
      for (let i = 0; i < STAR_COUNT_LAYER1; i++) {
        const star = starsLayer1[i];
        const scale = MAX_DEPTH / star.z;
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

        // Calculate current position
        const scale = MAX_DEPTH / star.z;
        const screenX = star.x * scale + HALF_WIDTH;
        const screenY = star.y * scale + HALF_HEIGHT;

        // Calculate previous position for streak trail
        const oldZ = star.z + SPEED_LAYER2;
        const oldScale = MAX_DEPTH / oldZ;
        const oldScreenX = star.x * oldScale + HALF_WIDTH;
        const oldScreenY = star.y * oldScale + HALF_HEIGHT;

        if (screenX < -50 || screenX > CANVAS_WIDTH + 50 ||
            screenY < -50 || screenY > CANVAS_HEIGHT + 50) {
          continue;
        }

        const fadeInDuration = 3000;
        const fadeInProgress = Math.min(star.age / fadeInDuration, 1);
        const opacity = fadeInProgress * 0.6;

        ctx.strokeStyle = getRGBA(opacity);
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(oldScreenX, oldScreenY);
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
        willChange: 'auto', // Canvas is already GPU-accelerated, don't force layer
        transform: 'translateZ(0)'  // Force GPU compositor layer
      }}
    />
  );
};

export default StarField;
