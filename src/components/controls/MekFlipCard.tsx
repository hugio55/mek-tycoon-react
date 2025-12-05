'use client';

import React from 'react';
import { getMediaUrl } from '@/lib/media-url';

interface MekFlipCardProps {
  imageSrc?: string;
  badge?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  footer?: string;
  color?: 'gold' | 'cyan' | 'lime' | 'purple';
  className?: string;
}

/**
 * Mek Flip Card - Transformed from Uiverse.io by ElSombrero2
 *
 * Original: Orange gradient with 3D flip card effect
 * Transformed: Gold/cyan/lime/purple variants matching Mek Tycoon industrial design
 * Features: 3D flip on hover, mek image visible by default, flips to show text with blurred mek behind
 */
export default function MekFlipCard({
  imageSrc = '/mek-images/500px/bc2-dm1-ap1.webp',
  badge = 'LEGENDARY',
  title = 'Mek Unit',
  subtitle = '#0001',
  description = 'A powerful Mekanism ready for battle',
  footer = 'MEK TYCOON 2025',
  color = 'gold',
  className = ''
}: MekFlipCardProps) {
  const colorConfig = {
    gold: {
      border: '#fab617',
      text: '#fab617',
      glow: 'rgba(250, 182, 23, 0.5)'
    },
    cyan: {
      border: '#00d4ff',
      text: '#00d4ff',
      glow: 'rgba(0, 212, 255, 0.5)'
    },
    lime: {
      border: '#84cc16',
      text: '#84cc16',
      glow: 'rgba(132, 204, 22, 0.5)'
    },
    purple: {
      border: '#a855f7',
      text: '#a855f7',
      glow: 'rgba(168, 85, 247, 0.5)'
    }
  };

  const config = colorConfig[color];

  return (
    <div className={`overflow-visible w-[190px] h-[254px] group ${className}`}>
      <div
        className="w-full h-full transition-transform duration-300 rounded-[5px] shadow-[0px_0px_10px_1px_#000000ee] group-hover:[transform:rotateY(180deg)]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Face - Mek image visible by default */}
        <div
          className="absolute w-full h-full rounded-[5px] overflow-hidden bg-[#151515]"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Mek image - clear */}
          <img
            src={imageSrc.startsWith('/') ? getMediaUrl(imageSrc) : imageSrc}
            alt={title}
            className="absolute w-full h-full object-cover object-center"
          />

          {/* Subtle border glow */}
          <div
            className="absolute inset-0 rounded-[5px] pointer-events-none"
            style={{
              boxShadow: `inset 0 0 20px ${config.glow}, 0 0 10px ${config.glow}`
            }}
          />

          {/* Badge in corner */}
          <div className="absolute top-2 left-2">
            <div
              className="bg-black/50 px-2.5 py-0.5 rounded-[10px] backdrop-blur-sm text-xs font-medium"
              style={{ color: config.text }}
            >
              {badge}
            </div>
          </div>
        </div>

        {/* Back Face - Text with blurred Mek behind (shown on hover) */}
        <div
          className="absolute w-full h-full rounded-[5px] overflow-hidden bg-[#151515] text-white"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          {/* Same Mek image but BLURRED */}
          <img
            src={imageSrc.startsWith('/') ? getMediaUrl(imageSrc) : imageSrc}
            alt={title}
            className="absolute w-full h-full object-cover object-center blur-[8px] scale-110"
          />

          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Colored border glow */}
          <div
            className="absolute inset-0 rounded-[5px] pointer-events-none"
            style={{
              boxShadow: `inset 0 0 30px ${config.glow}`
            }}
          />

          {/* Content overlay */}
          <div className="absolute w-full h-full p-3 flex flex-col justify-between">
            {/* Top section - Badge */}
            <div
              className="bg-black/50 px-2.5 py-0.5 rounded-[10px] backdrop-blur-sm w-fit text-xs font-medium"
              style={{ color: config.text }}
            >
              {badge}
            </div>

            {/* Center content */}
            <div className="flex-1 flex flex-col justify-center items-center text-center px-2">
              <h3
                className="text-lg font-bold font-orbitron uppercase tracking-wider"
                style={{ color: config.text }}
              >
                {title}
              </h3>
              <p className="text-sm text-white/80 mt-1">{subtitle}</p>
            </div>

            {/* Bottom description box */}
            <div className="w-full p-2.5 bg-black/60 backdrop-blur-md rounded-[5px] shadow-[0px_0px_10px_5px_#00000088]">
              <p className="text-[10px] text-gray-200 leading-relaxed">{description}</p>
              <div className="text-[8px] text-white/50 mt-1.5 text-right">{footer}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
