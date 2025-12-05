'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { getMediaUrl } from '@/lib/media-url';

interface MekCarousel3DProps {
  images?: string[];
  color?: 'gold' | 'cyan' | 'silver';
  size?: 'sm' | 'md' | 'lg';
  speed?: 'slow' | 'normal' | 'fast';
  tilt?: number;
  className?: string;
}

// Default Mek images to display
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
 * Mek Carousel 3D - Transformed from Uiverse.io by ilkhoeri
 *
 * Original: 3D rotating card carousel with perspective
 * Transformed: Mek NFT showcase with Gold/Cyan/Silver variants
 * Features: 3D perspective rotation, configurable speed/tilt, responsive sizing
 */
export default function MekCarousel3D({
  images = DEFAULT_MEK_IMAGES,
  color = 'gold',
  size = 'md',
  speed = 'normal',
  tilt = -15,
  className = ''
}: MekCarousel3DProps) {
  const quantity = images.length;

  const sizeConfig = {
    sm: { width: 80, height: 120, translateZ: 200 },
    md: { width: 100, height: 150, translateZ: 280 },
    lg: { width: 140, height: 210, translateZ: 380 }
  };

  const speedConfig = {
    slow: '30s',
    normal: '20s',
    fast: '10s'
  };

  const colorConfig = {
    gold: {
      border: 'rgba(250, 182, 23, 0.8)',
      gradientInner: 'rgba(250, 182, 23, 0.2)',
      gradientMid: 'rgba(250, 182, 23, 0.5)',
      gradientOuter: 'rgba(250, 182, 23, 0.8)',
      glow: 'rgba(250, 182, 23, 0.4)'
    },
    cyan: {
      border: 'rgba(0, 212, 255, 0.8)',
      gradientInner: 'rgba(0, 212, 255, 0.2)',
      gradientMid: 'rgba(0, 212, 255, 0.5)',
      gradientOuter: 'rgba(0, 212, 255, 0.8)',
      glow: 'rgba(0, 212, 255, 0.4)'
    },
    silver: {
      border: 'rgba(200, 200, 200, 0.8)',
      gradientInner: 'rgba(200, 200, 200, 0.2)',
      gradientMid: 'rgba(200, 200, 200, 0.5)',
      gradientOuter: 'rgba(200, 200, 200, 0.8)',
      glow: 'rgba(200, 200, 200, 0.4)'
    }
  };

  const config = colorConfig[color];
  const sizeStyle = sizeConfig[size];
  const animationDuration = speedConfig[speed];

  // Generate keyframes for this specific instance
  const keyframesId = useMemo(() => `carousel-rotate-${Math.random().toString(36).substr(2, 9)}`, []);

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

  // Calculate container height based on card size and perspective
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
            willChange: 'transform'
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
                boxShadow: `0 0 20px ${config.glow}, inset 0 0 20px ${config.gradientInner}`,
                willChange: 'transform'
              }}
            >
              {/* Image - preserves original colors */}
              <Image
                src={src.startsWith('/') ? getMediaUrl(src) : src}
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
            bottom: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${sizeStyle.translateZ * 1.5}px`,
            height: '40px',
            background: `radial-gradient(ellipse at center, ${config.glow} 0%, transparent 70%)`,
            filter: 'blur(10px)',
            opacity: 0.6
          }}
        />
      </div>
    </>
  );
}
