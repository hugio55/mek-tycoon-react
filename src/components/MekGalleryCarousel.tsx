'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const MekGalleryCarousel = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLDivElement[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const currentRotationRef = useRef(0);
  const targetRotationRef = useRef(0);
  const velocityRef = useRef(0);
  const lastDragTimeRef = useRef(0);

  // Sample Mek images for the carousel
  const mekImages = [
    'aa1-aa4-gh1.webp',
    'ab1-ab1-ap1.webp',
    'ac1-ac1-az1.webp',
    'ad1-ad1-ba1.webp',
    'ae1-cx1-az2.webp',
    'af1-af1-bb1.webp',
    'ag1-ag1-bc1.webp',
    'ah1-ah1-bd1.webp',
    'ai1-ai1-be1.webp',
    'aj1-aj1-bf1.webp',
  ];

  // Detect mobile viewport on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!ringRef.current || imagesRef.current.length === 0) return;

    // Position images in 3D ring - adjust radius for mobile
    const angleIncrement = 360 / mekImages.length;
    const radius = isMobile ? 250 : 400; // Smaller radius on mobile

    imagesRef.current.forEach((img, index) => {
      if (!img) return;

      const angle = angleIncrement * index;
      const theta = (angle * Math.PI) / 180;

      const x = Math.sin(theta) * radius;
      const z = Math.cos(theta) * radius;

      gsap.set(img, {
        x: x,
        z: z,
        rotationY: -angle,
        transformOrigin: 'center center',
        // Hardware acceleration and backface culling
        force3D: true,
        backfaceVisibility: 'hidden',
        perspective: 1000,
      });
    });

    // Animation loop with momentum decay for smooth rotation
    const animate = () => {
      // Apply momentum decay
      if (!isDragging && Math.abs(velocityRef.current) > 0.01) {
        targetRotationRef.current += velocityRef.current;
        velocityRef.current *= 0.95; // Momentum decay
      }

      // Smooth interpolation with hardware-accelerated transforms
      currentRotationRef.current += (targetRotationRef.current - currentRotationRef.current) * 0.1;

      if (ringRef.current) {
        gsap.set(ringRef.current, {
          rotationY: currentRotationRef.current,
          force3D: true,
          transformStyle: 'preserve-3d',
        });
      }

      // Parallax background effect - reduced on mobile for performance
      if (backgroundRef.current) {
        const parallaxAmount = isMobile ? 0.25 : 0.5;
        gsap.set(backgroundRef.current, {
          x: currentRotationRef.current * parallaxAmount,
          force3D: true,
        });
      }

      requestAnimationFrame(animate);
    };

    animate();
  }, [mekImages.length, isMobile, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    targetRotationRef.current += deltaX * 0.5;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const deltaX = e.touches[0].clientX - dragStartRef.current.x;
    targetRotationRef.current += deltaX * 0.5;
    dragStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleImageHover = (index: number, isHovering: boolean) => {
    const img = imagesRef.current[index];
    if (!img) return;

    gsap.to(img, {
      scale: isHovering ? 1.2 : 1,
      z: isHovering ? '+=100' : '-=100',
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-black cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
      style={{ perspective: '2000px' }}
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
        }}
      />

      {/* 3D Ring Container */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          transformStyle: 'preserve-3d',
          width: '100%',
          height: '100%',
        }}
      >
        <div
          ref={ringRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            transformStyle: 'preserve-3d',
            width: '300px',
            height: '300px',
          }}
        >
          {mekImages.map((imageName, index) => (
            <div
              key={index}
              ref={(el) => {
                if (el) imagesRef.current[index] = el;
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform"
              style={{
                transformStyle: 'preserve-3d',
                width: '250px',
                height: '250px',
              }}
              onMouseEnter={() => handleImageHover(index, true)}
              onMouseLeave={() => handleImageHover(index, false)}
            >
              <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-yellow-500/50 shadow-2xl">
                <img
                  src={`/mek-images/500px/${imageName}`}
                  alt={`Mek ${index + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <p className="text-yellow-500/70 font-['Orbitron'] uppercase tracking-wider text-sm">
          Drag to rotate • Hover to zoom
        </p>
      </div>
    </div>
  );
};

export default MekGalleryCarousel;
