"use client";

import { useState, useEffect } from "react";
import { getMediaUrl } from "@/lib/media-url";

interface ResponsiveBackgroundImageAdvancedProps {
  verticalPosition: number; // 0-100 percentage
  onVerticalPositionChange?: (position: number) => void;
  enableResponsiveLoading?: boolean; // Load different image sizes per viewport
  overlayOpacity?: number; // 0-1 for gradient overlay strength
}

export default function ResponsiveBackgroundImageAdvanced({
  verticalPosition,
  onVerticalPositionChange,
  enableResponsiveLoading = false,
  overlayOpacity = 0.5,
}: ResponsiveBackgroundImageAdvancedProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Track viewport dimensions for responsive behavior
    const updateViewport = () => {
      setViewportHeight(window.innerHeight);
      setViewportWidth(window.innerWidth);
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Select appropriate image size based on viewport width
  const getBackgroundImageUrl = () => {
    if (!enableResponsiveLoading) {
      return getMediaUrl('/colored-bg-1.webp');
    }

    // Responsive image selection
    if (viewportWidth < 768) {
      return getMediaUrl('/colored-bg-1-mobile.webp'); // 750w, ~100KB
    } else if (viewportWidth < 1280) {
      return getMediaUrl('/colored-bg-1-tablet.webp'); // 1536w, ~200KB
    } else {
      return getMediaUrl('/colored-bg-1-desktop.webp'); // 1920w, ~305KB
    }
  };

  // Preload background image
  useEffect(() => {
    if (!isMounted) return;

    const img = new Image();
    const imageUrl = getBackgroundImageUrl();

    img.onload = () => {
      setImageLoaded(true);
    };

    img.src = imageUrl;
  }, [isMounted, viewportWidth, enableResponsiveLoading]);

  if (!isMounted) return null;

  const backgroundImageUrl = getBackgroundImageUrl();
  const backgroundPositionY = `${verticalPosition}%`;

  // Calculate responsive overlay opacity
  // Stronger overlay on smaller screens for better text contrast
  const responsiveOverlayOpacity = viewportHeight < 700 ? overlayOpacity * 1.4 : overlayOpacity;

  return (
    <>
      {/* Loading placeholder (prevents CLS) */}
      {!imageLoaded && (
        <div
          className="fixed inset-0 z-0 bg-gradient-to-b from-black via-gray-900 to-black"
          style={{
            // Prevent layout shift by reserving space
            minHeight: '100vh',
            minWidth: '100vw',
          }}
        />
      )}

      {/* Background image */}
      <div
        className={`fixed inset-0 z-0 pointer-events-none transition-opacity duration-500 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundImage: `url(${backgroundImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: `center ${backgroundPositionY}`,
          backgroundRepeat: 'no-repeat',
          // Mobile performance optimizations
          willChange: 'background-position',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
          // Prevent overscroll bounce from revealing white space
          backgroundAttachment: viewportWidth < 768 ? 'scroll' : 'fixed',
        }}
      >
        {/* Gradient overlay for text readability */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"
          style={{
            opacity: responsiveOverlayOpacity,
            transition: 'opacity 0.3s ease',
          }}
        />

        {/* Mobile-specific: Extra overlay at bottom for navigation elements */}
        {viewportWidth < 768 && (
          <div
            className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"
          />
        )}
      </div>

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-[10000] bg-black/80 border border-yellow-500/30 p-2 text-[8px] text-yellow-400 font-mono">
          <div>BG: {backgroundImageUrl.split('/').pop()}</div>
          <div>Viewport: {viewportWidth}×{viewportHeight}</div>
          <div>Position: {verticalPosition}%</div>
          <div>Loaded: {imageLoaded ? 'Yes' : 'No'}</div>
        </div>
      )}
    </>
  );
}
