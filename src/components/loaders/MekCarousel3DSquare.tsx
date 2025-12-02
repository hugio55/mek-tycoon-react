'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';

interface MekCarousel3DSquareProps {
  images?: string[];
  color?: 'gold' | 'cyan' | 'silver';
  size?: 'sm' | 'md' | 'lg';
  speed?: 'slow' | 'normal' | 'fast';
  tilt?: number;
  className?: string;
}

// Default Mek images to display (square aspect ratio)
const DEFAULT_MEK_IMAGES = [
  '/mek-images/500px/aa1-aa4-gk1.webp',
  '/mek-images/500px/bc2-dm1-ap1.webp',
  '/mek-images/500px/dp2-bf4-il2.webp',
  '/mek-images/500px/hb1-gn1-hn1.webp',
  '/mek-images/500px/bc2-ee1-mo1.webp',
  '/mek-images/500px/dp2-bj2-eh2.webp',
  '/mek-images/500px/hb2-ak1-cd1.webp',
  '/mek-images/500px/aa1-bf3-fb2.webp',
];

/**
 * Mek Carousel 3D Square - Transformed from Uiverse.io by ilkhoeri
 *
 * Square aspect ratio variant for Mek NFT showcase
 * Features: GPU-accelerated 3D rotation, no frame drops, configurable speed/tilt
 */
export default function MekCarousel3DSquare({
  images = DEFAULT_MEK_IMAGES,
  color = 'gold',
  size = 'md',
  speed = 'normal',
  tilt = -15,
  className = ''
}: MekCarousel3DSquareProps) {
  const quantity = images.length;

  // Square aspect ratio sizes
  const sizeConfig = {
    sm: { width: 100, height: 100, translateZ: 220 },
    md: { width: 140, height: 140, translateZ: 300 },
    lg: { width: 180, height: 180, translateZ: 400 }
  };

  const speedConfig = {
    slow: '30s',
    normal: '20s',
    fast: '10s'
  };

  const colorConfig = {
    gold: {
      border: 'rgba(250, 182, 23, 0.8)',
      glow: 'rgba(250, 182, 23, 0.4)',
      glowInner: 'rgba(250, 182, 23, 0.15)'
    },
    cyan: {
      border: 'rgba(0, 212, 255, 0.8)',
      glow: 'rgba(0, 212, 255, 0.4)',
      glowInner: 'rgba(0, 212, 255, 0.15)'
    },
    silver: {
      border: 'rgba(200, 200, 200, 0.8)',
      glow: 'rgba(200, 200, 200, 0.4)',
      glowInner: 'rgba(200, 200, 200, 0.15)'
    }
  };

  const config = colorConfig[color];
  const sizeStyle = sizeConfig[size];
  const animationDuration = speedConfig[speed];

  // Generate unique keyframes ID
  const keyframesId = useMemo(() => `carousel-square-${Math.random().toString(36).substr(2, 9)}`, []);

  const keyframesCSS = `
    @keyframes ${keyframesId} {
      from {
        transform: perspective(1000px) rotateX(${tilt}deg) rotateY(0deg);
      }
      to {
        transform: perspective(1000px) rotateX(${tilt}deg) rotateY(360deg);
      }
    }
  `;

  // Container height for square cards
  const containerHeight = sizeStyle.height * 3.5;

  return (
    <>
      <style>{keyframesCSS}</style>
      <div
        className={`relative flex items-center justify-center overflow-hidden ${className}`}
        style={{
          width: '100%',
          height: `${containerHeight}px`
        }}
      >
        {/* Inner rotating container - GPU accelerated */}
        <div
          style={{
            position: 'absolute',
            width: `${sizeStyle.width}px`,
            height: `${sizeStyle.height}px`,
            top: '20%',
            left: `calc(50% - ${sizeStyle.width / 2}px)`,
            zIndex: 2,
            transformStyle: 'preserve-3d',
            animation: `${keyframesId} ${animationDuration} linear infinite`,
            willChange: 'transform',
            backfaceVisibility: 'hidden'
          }}
        >
          {/* Cards */}
          {images.map((src, index) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                inset: 0,
                border: `2px solid ${config.border}`,
                borderRadius: '12px',
                overflow: 'hidden',
                transform: `rotateY(${(360 / quantity) * index}deg) translateZ(${sizeStyle.translateZ}px)`,
                boxShadow: `0 0 20px ${config.glow}, inset 0 0 20px ${config.glowInner}`,
                backfaceVisibility: 'hidden',
                willChange: 'transform'
              }}
            >
              {/* Image - preserves original colors */}
              <Image
                src={src}
                alt={`Mek ${index + 1}`}
                fill
                style={{
                  objectFit: 'cover'
                }}
                sizes={`${sizeStyle.width}px`}
                priority={index < 4}
              />
            </div>
          ))}
        </div>

        {/* Reflection/glow effect at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '5%',
            left: '50%',
            transform: 'translateX(-50%) translateZ(0)',
            width: `${sizeStyle.translateZ * 1.5}px`,
            height: '40px',
            background: `radial-gradient(ellipse at center, ${config.glow} 0%, transparent 70%)`,
            filter: 'blur(10px)',
            opacity: 0.6,
            willChange: 'opacity'
          }}
        />
      </div>
    </>
  );
}
