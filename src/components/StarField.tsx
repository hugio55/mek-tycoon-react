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

    const STAR_COUNT_LAYER1 = 150;
    const STAR_COUNT_LAYER2 = 20;
    const SPEED_LAYER1 = 1.5;
    const SPEED_LAYER2 = 20;
    const MAX_DEPTH = 1000;
    const MIN_DEPTH = 1;
    const PI2 = Math.PI * 2;

    let HALF_WIDTH = canvas.width / 2;
    let HALF_HEIGHT = canvas.height / 2;

    const starsLayer1: Star[] = [];
    for (let i = 0; i < STAR_COUNT_LAYER1; i++) {
      starsLayer1.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        z: Math.random() * MAX_DEPTH,
        age: 1000,
        size: 0.7 + Math.random() * 0.05
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
      while (accumulator >= FIXED_TIMESTEP) {
        updateStars();
        accumulator -= FIXED_TIMESTEP;
      }

      // Render every frame for smooth 60fps display
      ctx.clearRect(0, 0, canvas.width, canvas.height);
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
          star.size = 0.7 + Math.random() * 0.05;
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

        if (screenX < 0 || screenX > canvas.width ||
            screenY < 0 || screenY > canvas.height) {
          continue;
        }

        const fadeInDuration = 5000;
        const fadeInProgress = Math.min(star.age / fadeInDuration, 1);
        const opacity = fadeInProgress * 0.8;

        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
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

        if (screenX < -50 || screenX > canvas.width + 50 ||
            screenY < -50 || screenY > canvas.height + 50) {
          continue;
        }

        const fadeInDuration = 3000;
        const fadeInProgress = Math.min(star.age / fadeInDuration, 1);
        const opacity = fadeInProgress * 0.6;

        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.lineWidth = 2;
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
      style={{ zIndex: 1 }}
    />
  );
};

export default StarField;
