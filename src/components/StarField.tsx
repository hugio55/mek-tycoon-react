'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
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

    const STAR_COUNT = 180;
    const SPEED = 3;
    const MAX_DEPTH = 1000;
    const MIN_DEPTH = 1;
    const HALF_WIDTH = canvas.width / 2;
    const HALF_HEIGHT = canvas.height / 2;
    const PI2 = Math.PI * 2;

    const stars: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        z: Math.random() * MAX_DEPTH
      });
    }

    let lastFrameTime = 0;
    const frameInterval = 1000 / 30;

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastFrameTime;

      if (deltaTime >= frameInterval) {
        lastFrameTime = currentTime - (deltaTime % frameInterval);

        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

        for (let i = 0; i < STAR_COUNT; i++) {
          const star = stars[i];

          star.z -= SPEED;

          if (star.z <= MIN_DEPTH) {
            star.z = MAX_DEPTH * 0.9 + Math.random() * MAX_DEPTH * 0.1;
            star.x = (Math.random() - 0.5) * 2000;
            star.y = (Math.random() - 0.5) * 2000;
          }

          const scale = MAX_DEPTH / star.z;
          const screenX = Math.floor(star.x * scale + HALF_WIDTH);
          const screenY = Math.floor(star.y * scale + HALF_HEIGHT);

          if (screenX < 0 || screenX > canvas.width ||
              screenY < 0 || screenY > canvas.height) {
            continue;
          }

          const size = Math.max(1, Math.floor((1 - star.z / MAX_DEPTH) * 2));

          ctx.beginPath();
          ctx.arc(screenX, screenY, size, 0, PI2);
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    let animationId = requestAnimationFrame(animate);

    const handleResize = () => {
      setCanvasSize();
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
