'use client';

import React from 'react';

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
 * Features: 3D flip on hover, rotating gradient border, floating orbs, mek image display
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
      gradient: 'linear-gradient(90deg, transparent, #fab617, #fab617, #fab617, #fab617, transparent)',
      orb1: '#ffbb66',
      orb2: '#fab617',
      orb3: '#ff8800',
      text: '#fab617'
    },
    cyan: {
      gradient: 'linear-gradient(90deg, transparent, #00d4ff, #00d4ff, #00d4ff, #00d4ff, transparent)',
      orb1: '#66ddff',
      orb2: '#00d4ff',
      orb3: '#0088cc',
      text: '#00d4ff'
    },
    lime: {
      gradient: 'linear-gradient(90deg, transparent, #84cc16, #84cc16, #84cc16, #84cc16, transparent)',
      orb1: '#a3e635',
      orb2: '#84cc16',
      orb3: '#65a30d',
      text: '#84cc16'
    },
    purple: {
      gradient: 'linear-gradient(90deg, transparent, #a855f7, #a855f7, #a855f7, #a855f7, transparent)',
      orb1: '#c084fc',
      orb2: '#a855f7',
      orb3: '#7c3aed',
      text: '#a855f7'
    }
  };

  const config = colorConfig[color];

  return (
    <div className={`overflow-visible w-[190px] h-[254px] group ${className}`}>
      <div
        className="w-full h-full transition-transform duration-300 rounded-[5px] shadow-[0px_0px_10px_1px_#000000ee] group-hover:[transform:rotateY(180deg)]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Back Face - visible by default */}
        <div
          className="absolute w-full h-full rounded-[5px] overflow-hidden flex justify-center items-center bg-[#151515]"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Rotating gradient border */}
          <div
            className="absolute w-[160px] h-[160%] animate-spin"
            style={{
              background: config.gradient,
              animationDuration: '5000ms',
              animationTimingFunction: 'linear'
            }}
          />

          {/* Back content container */}
          <div className="absolute w-[99%] h-[99%] bg-[#151515] rounded-[5px] flex flex-col justify-center items-center gap-8 text-white z-10">
            {/* Floating orbs */}
            <div className="relative w-full h-full flex justify-center items-center">
              {/* Main orb */}
              <div
                className="absolute w-[90px] h-[90px] rounded-full blur-[15px] animate-bounce"
                style={{
                  backgroundColor: config.orb1,
                  animationDuration: '2600ms'
                }}
              />
              {/* Bottom orb */}
              <div
                className="absolute w-[150px] h-[150px] rounded-full blur-[15px] animate-bounce"
                style={{
                  backgroundColor: config.orb2,
                  left: '50px',
                  top: '0px',
                  animationDuration: '2600ms',
                  animationDelay: '-800ms'
                }}
              />
              {/* Right orb */}
              <div
                className="absolute w-[30px] h-[30px] rounded-full blur-[15px] animate-bounce"
                style={{
                  backgroundColor: config.orb3,
                  left: '160px',
                  top: '-80px',
                  animationDuration: '2600ms',
                  animationDelay: '-1800ms'
                }}
              />

              {/* Center text */}
              <div className="relative z-20 text-center">
                <div
                  className="text-2xl font-bold font-orbitron uppercase tracking-wider"
                  style={{ color: config.text }}
                >
                  HOVER
                </div>
                <div className="text-xs text-gray-400 mt-1">to reveal</div>
              </div>
            </div>
          </div>
        </div>

        {/* Front Face - revealed on hover */}
        <div
          className="absolute w-full h-full rounded-[5px] overflow-hidden bg-[#151515] text-white"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          {/* Background image */}
          <img
            src={imageSrc}
            alt={title}
            className="absolute w-full h-full object-cover object-center"
          />

          {/* Content overlay */}
          <div className="absolute w-full h-full p-2.5 flex flex-col justify-between">
            {/* Badge */}
            <div
              className="bg-black/30 px-2.5 py-0.5 rounded-[10px] backdrop-blur-sm w-fit text-xs font-medium"
              style={{ color: config.text }}
            >
              {badge}
            </div>

            {/* Description box */}
            <div className="w-full p-2.5 bg-black/60 backdrop-blur-md rounded-[5px] shadow-[0px_0px_10px_5px_#00000088]">
              <div className="flex justify-between text-[11px]">
                <p className="w-1/2 font-medium">{title}</p>
                <p className="w-1/2 text-right" style={{ color: config.text }}>
                  {subtitle}
                </p>
              </div>
              <p className="text-[10px] text-gray-300 mt-1">{description}</p>
              <div className="text-[8px] text-white/50 mt-1.5">{footer}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
