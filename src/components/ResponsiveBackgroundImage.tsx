"use client";

import { useState, useEffect } from "react";

interface ResponsiveBackgroundImageProps {
  verticalPosition: number; // 0-100 percentage
  onVerticalPositionChange?: (position: number) => void;
}

export default function ResponsiveBackgroundImage({
  verticalPosition,
  onVerticalPositionChange,
}: ResponsiveBackgroundImageProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    setIsMounted(true);

    // Track viewport height for responsive positioning
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);

    return () => window.removeEventListener('resize', updateViewportHeight);
  }, []);

  if (!isMounted) return null;

  // Convert vertical position percentage to CSS value
  // 0% = top, 50% = center, 100% = bottom
  const backgroundPositionY = `${verticalPosition}%`;

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        backgroundImage: 'url(/colored-bg-1.webp)',
        backgroundSize: 'cover', // Mobile: Full width coverage
        backgroundPosition: `center ${backgroundPositionY}`, // Adjustable vertical position
        backgroundRepeat: 'no-repeat',
        // Mobile-specific optimizations
        willChange: 'background-position', // Hardware acceleration hint
        backfaceVisibility: 'hidden', // Prevent flickering on mobile
        WebkitBackfaceVisibility: 'hidden', // iOS Safari
        transform: 'translateZ(0)', // Force GPU acceleration
        WebkitTransform: 'translateZ(0)', // iOS Safari
      }}
    >
      {/* Optional: Gradient overlay for better text readability on mobile */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"
        style={{
          // Stronger overlay on small screens for better contrast
          opacity: viewportHeight < 700 ? 0.7 : 0.5,
        }}
      />
    </div>
  );
}
