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
    velocityRef.current = 0;
    lastDragTimeRef.current = Date.now();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
    velocityRef.current = 0;
    lastDragTimeRef.current = Date.now();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const now = Date.now();
    const timeDelta = now - lastDragTimeRef.current;
    const deltaX = e.clientX - dragStartRef.current.x;

    // Calculate velocity for momentum
    if (timeDelta > 0) {
      velocityRef.current = deltaX / timeDelta * 16; // Normalize to 60fps
    }

    targetRotationRef.current += deltaX * 0.5;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    lastDragTimeRef.current = now;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const now = Date.now();
    const timeDelta = now - lastDragTimeRef.current;
    const deltaX = e.touches[0].clientX - dragStartRef.current.x;

    // Calculate velocity for momentum
    if (timeDelta > 0) {
      velocityRef.current = deltaX / timeDelta * 16; // Normalize to 60fps
    }

    // More sensitive touch rotation on mobile
    const sensitivity = isMobile ? 0.7 : 0.5;
    targetRotationRef.current += deltaX * sensitivity;

    dragStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
    lastDragTimeRef.current = now;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleImageHover = (index: number, isHovering: boolean) => {
    // Disable hover effects on mobile (use touch instead)
    if (isMobile) return;

    const img = imagesRef.current[index];
    if (!img) return;

    gsap.to(img, {
      scale: isHovering ? 1.2 : 1,
      z: isHovering ? '+=100' : '-=100',
      duration: 0.3,
      ease: 'power2.out',
      force3D: true,
    });
  };

  const handleImageTap = (index: number) => {
    // Touch feedback for mobile
    if (!isMobile) return;

    const img = imagesRef.current[index];
    if (!img) return;

    // Quick scale animation for touch feedback
    gsap.timeline()
      .to(img, {
        scale: 1.15,
        z: '+=80',
        duration: 0.2,
        ease: 'power2.out',
        force3D: true,
      })
      .to(img, {
        scale: 1,
        z: '-=80',
        duration: 0.2,
        ease: 'power2.in',
        force3D: true,
      });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-black cursor-grab active:cursor-grabbing touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        perspective: isMobile ? '1500px' : '2000px',
        // Enable hardware acceleration
        transform: 'translateZ(0)',
        willChange: 'transform',
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
          filter: isMobile ? 'blur(8px)' : 'blur(10px)', // Slightly less blur on mobile for performance
          transform: 'translateZ(0)',
          willChange: 'transform',
        }}
      />

      {/* 3D Ring Container */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          transformStyle: 'preserve-3d',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <div
          ref={ringRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            transformStyle: 'preserve-3d',
            width: isMobile ? '200px' : '300px',
            height: isMobile ? '200px' : '300px',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {mekImages.map((imageName, index) => (
            <div
              key={index}
              ref={(el) => {
                if (el) imagesRef.current[index] = el;
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                transformStyle: 'preserve-3d',
                width: isMobile ? '180px' : '250px',
                height: isMobile ? '180px' : '250px',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                willChange: 'transform',
              }}
              onMouseEnter={() => handleImageHover(index, true)}
              onMouseLeave={() => handleImageHover(index, false)}
              onClick={() => handleImageTap(index)}
            >
              <div
                className="relative w-full h-full rounded-lg overflow-hidden border-2 border-yellow-500/50 shadow-2xl"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                <img
                  src={`/mek-images/500px/${imageName}`}
                  alt={`Mek ${index + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'translateZ(0)',
                  }}
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center px-4">
        <p className="text-yellow-500/70 font-['Orbitron'] uppercase tracking-wider text-xs sm:text-sm">
          {isMobile ? 'Drag to rotate • Tap to interact' : 'Drag to rotate • Hover to zoom'}
        </p>
      </div>
    </div>
  );
};

export default MekGalleryCarousel;
