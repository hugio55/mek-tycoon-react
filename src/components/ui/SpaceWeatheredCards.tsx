'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Style N - Ancient Space Glass
 * Features micro cracks on edges with subtle color accents and noise texture
 */
export function StyleN({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`relative p-6 rounded-lg overflow-hidden group ${className}`}
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.005)',
        backdropFilter: 'blur(1px)',
        border: '1px solid rgba(255, 255, 255, 0.015)',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.2) inset',
      }}
    >
      {/* Micro cracks on edges */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,20 L8,15 L12,22 L18,18" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" fill="none"/>
        <path d="M0,80 L6,82 L10,78 L15,83" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" fill="none"/>
        <path d="M385,10 L380,12 L383,8 L378,6" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" fill="none" transform="translate(-280, 0)"/>
        <path d="M385,90 L382,85 L388,88 L384,92" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" fill="none" transform="translate(-280, 0)"/>
      </svg>
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: `
            radial-gradient(circle at 15% 20%, rgba(250, 182, 23, 0.02) 0%, transparent 20%),
            radial-gradient(circle at 85% 80%, rgba(147, 51, 234, 0.015) 0%, transparent 20%),
            radial-gradient(circle at 50% 50%, transparent 30%, rgba(255, 255, 255, 0.005) 70%, transparent 100%)`,
          filter: 'blur(3px)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence baseFrequency='1.5' numOctaves='3' seed='2' /%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noiseFilter)' opacity='0.01'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * Style O - Shattered Void Crystal
 * Features dense fractal crack patterns with color gradients
 */
export function StyleO({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`relative p-6 rounded-lg overflow-hidden ${className}`}
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.005)',
        backdropFilter: 'blur(1px)',
        border: '1px solid rgba(255, 255, 255, 0.015)',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.2) inset',
      }}
    >
      {/* Dense fractal crack patterns */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
        <path d="M5,15 L12,12 L15,18 L22,14 L25,20 L30,16 L35,22" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" fill="none"/>
        <path d="M0,50 L5,48 L8,52 L12,49 L16,53 L20,50" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" fill="none"/>
        <path d="M95,0 L92,5 L96,8 L93,12 L97,15" stroke="rgba(255,255,255,0.13)" strokeWidth="0.3" fill="none" transform="translate(0, 0)"/>
        <path d="M100,95 L98,92 L102,90 L99,88 L103,85 L100,82" stroke="rgba(255,255,255,0.11)" strokeWidth="0.3" fill="none" transform="translate(-5, 0)"/>
        <path d="M2,95 L4,92 L6,94 L8,91 L11,94 L14,91" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" fill="none"/>
        <path d="M40,30 L45,28 L48,32 L52,29 L55,33" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" fill="none"/>
        <path d="M60,60 L65,58 L68,62 L72,59" stroke="rgba(255,255,255,0.09)" strokeWidth="0.3" fill="none"/>
        <path d="M30,70 L35,68 L38,72 L42,69" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" fill="none"/>
      </svg>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(115deg, transparent 40%, rgba(255, 255, 255, 0.003) 50%, transparent 60%),
            radial-gradient(ellipse at 20% 30%, rgba(59, 130, 246, 0.01) 0%, transparent 30%),
            radial-gradient(ellipse at 80% 70%, rgba(250, 182, 23, 0.01) 0%, transparent 30%)`,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background: `
            repeating-linear-gradient(90deg,
              transparent,
              transparent 50px,
              rgba(255, 255, 255, 0.002) 50px,
              rgba(255, 255, 255, 0.002) 51px)`,
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * Style P - Heavy Meteor Damage
 * Features multiple impact crater cracks with conic gradients
 */
export function StyleP({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`relative p-6 rounded-lg overflow-hidden ${className}`}
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.005)',
        backdropFilter: 'blur(1px)',
        border: '1px solid rgba(255, 255, 255, 0.015)',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.2) inset',
      }}
    >
      {/* Multiple impact crater cracks */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-35" xmlns="http://www.w3.org/2000/svg">
        <circle cx="15" cy="15" r="8" stroke="rgba(255,255,255,0.08)" strokeWidth="0.4" fill="none"/>
        <path d="M15,15 L10,10 M15,15 L20,12 M15,15 L18,20 M15,15 L12,18 M15,15 L13,11 M15,15 L19,17" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3"/>
        <circle cx="90%" cy="85%" r="6" stroke="rgba(255,255,255,0.07)" strokeWidth="0.3" fill="none"/>
        <path d="M90,85 L87,82 M90,85 L93,83 M90,85 L91,88 M90,85 L88,81" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" transform="translate(210, 175)"/>
        <circle cx="60%" cy="40%" r="10" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" fill="none"/>
        <path d="M60,40 L55,35 M60,40 L65,37 M60,40 L62,45 M60,40 L57,42 M60,40 L58,36 M60,40 L64,43" stroke="rgba(255,255,255,0.09)" strokeWidth="0.3" transform="translate(80, 40)"/>
        <circle cx="30%" cy="70%" r="5" stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" fill="none"/>
        <path d="M30,70 L28,68 M30,70 L32,69 M30,70 L31,72" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" transform="translate(50, 140)"/>
      </svg>
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background: `
            conic-gradient(from 180deg at 25% 25%, transparent 0deg, rgba(250, 182, 23, 0.015) 45deg, transparent 90deg),
            conic-gradient(from 0deg at 75% 75%, transparent 0deg, rgba(139, 92, 246, 0.01) 45deg, transparent 90deg),
            radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.002) 0%, transparent 60%)`,
          filter: 'blur(2px)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage: `
            repeating-radial-gradient(circle at 30% 30%,
              transparent,
              transparent 20px,
              rgba(255, 255, 255, 0.003) 20px,
              rgba(255, 255, 255, 0.003) 21px)`,
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * Style Q - Extreme Fracture Network
 * Features complex stress fracture network with micro debris and hover effect
 */
export function StyleQ({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`relative p-6 rounded-lg overflow-hidden group hover:border-yellow-400/10 transition-all duration-500 ${className}`}
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.005)',
        backdropFilter: 'blur(1px)',
        border: '1px solid rgba(255, 255, 255, 0.015)',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.2) inset',
      }}
    >
      {/* Complex stress fracture network */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,30 L3,28 L5,31 L8,29 L11,32 L14,30 L17,33 L20,31" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" fill="none"/>
        <path d="M100,0 L98,3 L101,5 L99,8 L102,10 L100,13" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" fill="none" transform="translate(-8, 0)"/>
        <path d="M95,95 L93,93 L96,91 L94,89 L97,87 L95,85" stroke="rgba(255,255,255,0.11)" strokeWidth="0.3" fill="none" transform="translate(0, 0)"/>
        <path d="M0,70 L2,68 L4,71 L6,69 L8,72 L10,70 L12,73" stroke="rgba(255,255,255,0.09)" strokeWidth="0.3" fill="none"/>
        <path d="M20,45 L35,42 L40,48 L55,45 L60,50" stroke="rgba(255,255,255,0.08)" strokeWidth="0.2" fill="none"/>
        <path d="M45,20 L50,18 L53,22 L58,19 L62,23" stroke="rgba(255,255,255,0.07)" strokeWidth="0.2" fill="none"/>
        <path d="M10,60 L25,58 L30,62 L45,59 L50,63" stroke="rgba(255,255,255,0.06)" strokeWidth="0.2" fill="none"/>
        {/* Micro debris */}
        <circle cx="20%" cy="40%" r="0.5" fill="rgba(255,255,255,0.03)"/>
        <circle cx="70%" cy="60%" r="0.3" fill="rgba(255,255,255,0.02)"/>
        <circle cx="45%" cy="25%" r="0.4" fill="rgba(255,255,255,0.025)"/>
        <circle cx="85%" cy="45%" r="0.3" fill="rgba(255,255,255,0.02)"/>
        <circle cx="15%" cy="75%" r="0.4" fill="rgba(255,255,255,0.02)"/>
        <circle cx="55%" cy="85%" r="0.3" fill="rgba(255,255,255,0.015)"/>
      </svg>
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background: `
            radial-gradient(ellipse at 10% 10%, rgba(250, 182, 23, 0.008) 0%, transparent 25%),
            radial-gradient(ellipse at 90% 90%, rgba(59, 130, 246, 0.006) 0%, transparent 25%),
            radial-gradient(circle at 50% 50%, transparent 20%, rgba(255, 255, 255, 0.001) 50%, transparent 80%),
            linear-gradient(135deg, transparent 45%, rgba(255, 255, 255, 0.002) 50%, transparent 55%)`,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='300' height='300' viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='cosmicNoise'%3E%3CfeTurbulence baseFrequency='2' numOctaves='1' seed='5' /%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23cosmicNoise)' opacity='0.008'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Named exports for convenience
export const SpaceWeatheredCards = {
  StyleN,
  StyleO,
  StyleP,
  StyleQ,
};

// Default export all components
export default {
  StyleN,
  StyleO,
  StyleP,
  StyleQ,
};
