'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const MekGalleryRing = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  const rotationRef = useRef(0);
  const targetRotationRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastMouseXRef = useRef(0);

  useEffect(() => {
    if (!ringRef.current) return;

    // Animation loop for smooth rotation
    const animate = () => {
      // Smooth interpolation
      rotationRef.current += (targetRotationRef.current - rotationRef.current) * 0.05;

      if (ringRef.current) {
        gsap.set(ringRef.current, {
          rotationY: rotationRef.current,
        });
      }

      // Parallax background effect
      if (backgroundRef.current) {
        const bgX = (rotationRef.current % 360) * 2;
        gsap.set(backgroundRef.current, {
          backgroundPositionX: `${bgX}px`,
        });
      }

      requestAnimationFrame(animate);
    };

    animate();

    // Drag handlers
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastMouseXRef.current = e.clientX;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = e.clientX - lastMouseXRef.current;
      targetRotationRef.current += deltaX * 0.5;
      lastMouseXRef.current = e.clientX;
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      isDraggingRef.current = true;
      lastMouseXRef.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = e.touches[0].clientX - lastMouseXRef.current;
      targetRotationRef.current += deltaX * 0.5;
      lastMouseXRef.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };

    const stage = stageRef.current;
    if (stage) {
      stage.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      stage.addEventListener('touchstart', handleTouchStart);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (stage) {
        stage.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        stage.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, []);

  return (
    <div
      ref={stageRef}
      className="relative w-full h-screen overflow-hidden bg-black cursor-grab active:cursor-grabbing"
      style={{
        perspective: '2000px',
        perspectiveOrigin: '50% 50%',
      }}
    >
      {/* Parallax Background */}
      <div
        ref={backgroundRef}
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'url(/mek-images/1000px/ae1-cx1-az2.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(10px)',
          willChange: 'background-position',
        }}
      />

      {/* Container */}
      <div
        ref={containerRef}
        className="absolute top-1/2 left-1/2"
        style={{
          width: '300px',
          height: '400px',
          marginLeft: '-150px',
          marginTop: '-200px',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Ring */}
        <div
          ref={ringRef}
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {/* 10 Images positioned in 3D ring */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => {
            const angle = index * 36; // 360 / 10 = 36 degrees

            return (
              <div
                key={index}
                className="img absolute top-1/2 left-1/2"
                style={{
                  width: '200px',
                  height: '200px',
                  marginLeft: '-100px',
                  marginTop: '-100px',
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${angle}deg)`,
                  transformOrigin: '50% 50% -500px',
                }}
              >
                <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-yellow-500/50 shadow-2xl">
                  <img
                    src="/mek-images/1000px/ae1-cx1-az2.webp"
                    alt={`Mek ${index + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <p className="text-yellow-500/70 font-['Orbitron'] uppercase tracking-wider text-sm">
          Drag to rotate
        </p>
      </div>
    </div>
  );
};

export default MekGalleryRing;
