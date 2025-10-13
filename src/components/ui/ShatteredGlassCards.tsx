'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Style S - Tempered Glass Dicing
 * Features small cubic fragments pattern characteristic of tempered glass breakage
 */
export function StyleS({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`relative p-6 rounded-lg overflow-hidden ${className}`}
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.004)',
        backdropFilter: 'blur(0.5px)',
        border: '1px solid rgba(255, 255, 255, 0.02)',
        boxShadow: '0 0 30px rgba(0, 0, 0, 0.4) inset',
      }}
    >
      {/* Tempered glass dicing pattern - small cubic fragments */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
        {/* Irregular cubic fragmentation pattern */}
        <path d="M15,0 L18,25 L14,50 L17,75 L15,100" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" fill="none"/>
        <path d="M30,0 L32,20 L28,45 L31,70 L30,100" stroke="rgba(255,255,255,0.14)" strokeWidth="0.4" fill="none"/>
        <path d="M45,0 L43,30 L47,55 L44,80 L45,100" stroke="rgba(255,255,255,0.16)" strokeWidth="0.4" fill="none"/>
        <path d="M60,0 L62,25 L58,50 L61,75 L60,100" stroke="rgba(255,255,255,0.13)" strokeWidth="0.4" fill="none"/>
        <path d="M75,0 L73,35 L77,60 L74,85 L75,100" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" fill="none"/>
        <path d="M85,0 L87,20 L83,45 L86,70 L85,100" stroke="rgba(255,255,255,0.14)" strokeWidth="0.4" fill="none"/>

        {/* Horizontal fractures creating cubic pattern */}
        <path d="M0,15 L25,18 L50,14 L75,17 L100,15" stroke="rgba(255,255,255,0.14)" strokeWidth="0.4" fill="none"/>
        <path d="M0,35 L20,32 L45,36 L70,33 L100,35" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" fill="none"/>
        <path d="M0,55 L30,58 L55,54 L80,57 L100,55" stroke="rgba(255,255,255,0.13)" strokeWidth="0.4" fill="none"/>
        <path d="M0,75 L25,72 L50,76 L75,73 L100,75" stroke="rgba(255,255,255,0.14)" strokeWidth="0.4" fill="none"/>
        <path d="M0,85 L35,87 L65,83 L90,86 L100,85" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" fill="none"/>

        {/* Slight angular variations to make it realistic */}
        <path d="M22,25 L38,28" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" fill="none"/>
        <path d="M52,42 L68,45" stroke="rgba(255,255,255,0.09)" strokeWidth="0.3" fill="none"/>
        <path d="M12,62 L28,65" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" fill="none"/>
        <path d="M42,78 L58,81" stroke="rgba(255,255,255,0.09)" strokeWidth="0.3" fill="none"/>

        {/* Edge fracture on left side */}
        <path d="M0,40 L-2,42 L0,44" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" fill="none"/>
        <path d="M0,41 L-1,43" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" fill="none"/>
      </svg>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * Style T - Annealed Glass Shards
 * Features long sharp radial cracks from impact point with mirror-mist-hackle texture
 */
export function StyleT({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`relative p-6 rounded-lg overflow-hidden ${className}`}
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.003)',
        backdropFilter: 'blur(0.3px)',
        border: '1px solid rgba(255, 255, 255, 0.018)',
        boxShadow: '0 0 35px rgba(0, 0, 0, 0.5) inset',
      }}
    >
      {/* Annealed glass - long sharp shards from impact */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-45" xmlns="http://www.w3.org/2000/svg">
        {/* Primary radial cracks - long, straight lines */}
        <path d="M35,40 L0,0" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" fill="none"/>
        <path d="M35,40 L0,85" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" fill="none"/>
        <path d="M35,40 L70,0" stroke="rgba(255,255,255,0.19)" strokeWidth="0.5" fill="none"/>
        <path d="M35,40 L100,15" stroke="rgba(255,255,255,0.17)" strokeWidth="0.4" fill="none"/>
        <path d="M35,40 L100,70" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" fill="none"/>
        <path d="M35,40 L65,100" stroke="rgba(255,255,255,0.16)" strokeWidth="0.4" fill="none"/>
        <path d="M35,40 L10,100" stroke="rgba(255,255,255,0.17)" strokeWidth="0.4" fill="none"/>

        {/* Secondary branching cracks */}
        <path d="M20,20 L28,35" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" fill="none"/>
        <path d="M50,15 L45,30" stroke="rgba(255,255,255,0.11)" strokeWidth="0.3" fill="none"/>
        <path d="M60,55 L52,45" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" fill="none"/>
        <path d="M25,65 L30,50" stroke="rgba(255,255,255,0.11)" strokeWidth="0.3" fill="none"/>

        {/* Mirror-mist-hackle texture near impact */}
        <ellipse cx="35" cy="40" rx="8" ry="6" stroke="rgba(255,255,255,0.08)" strokeWidth="0.2" fill="none" opacity="0.3"/>
        <ellipse cx="35" cy="40" rx="4" ry="3" stroke="rgba(255,255,255,0.1)" strokeWidth="0.2" fill="none" opacity="0.4"/>

        {/* Edge damage on top */}
        <path d="M50,0 L48,-2 L52,0" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" fill="none"/>
        <path d="M51,0 L50,-1" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" fill="none"/>

        {/* Edge chip on right */}
        <path d="M100,55 L102,57 L100,59" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" fill="none"/>
      </svg>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * Style U - Thermal Stress Pattern
 * Features characteristic wavy thermal stress cracks with perpendicular branches
 */
export function StyleU({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`relative p-6 rounded-lg overflow-hidden ${className}`}
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.002)',
        backdropFilter: 'blur(0.2px)',
        border: '1px solid rgba(255, 255, 255, 0.015)',
        boxShadow: '0 0 40px rgba(0, 0, 0, 0.6) inset',
      }}
    >
      {/* Thermal stress breakage - characteristic wavy pattern */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50" xmlns="http://www.w3.org/2000/svg">
        {/* Main thermal stress crack - wavy, meandering line */}
        <path d="M0,30 Q20,25 35,35 T65,40 Q80,45 100,35" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6" fill="none"/>
        <path d="M15,0 Q25,20 20,40 T25,70 Q20,85 30,100" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" fill="none"/>
        <path d="M70,0 Q75,15 80,35 T75,65 Q80,80 85,100" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" fill="none"/>

        {/* Secondary perpendicular cracks at 90 degrees */}
        <path d="M35,35 L45,15" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" fill="none"/>
        <path d="M35,35 L25,50" stroke="rgba(255,255,255,0.14)" strokeWidth="0.4" fill="none"/>
        <path d="M65,40 L75,25" stroke="rgba(255,255,255,0.13)" strokeWidth="0.4" fill="none"/>
        <path d="M65,40 L55,55" stroke="rgba(255,255,255,0.14)" strokeWidth="0.4" fill="none"/>

        {/* Branching pattern */}
        <path d="M20,40 Q30,50 40,48" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" fill="none"/>
        <path d="M75,65 Q85,70 90,75" stroke="rgba(255,255,255,0.09)" strokeWidth="0.3" fill="none"/>

        {/* Edge fracture on bottom */}
        <path d="M35,100 L33,102 L37,100" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" fill="none"/>
        <path d="M36,100 L35,101" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" fill="none"/>

        {/* Small edge chip on left */}
        <path d="M0,65 L-2,67 L0,69" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" fill="none"/>
      </svg>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * Style V - Heat-Strengthened Branching
 * Features complex branching pattern with multiple trunk cracks and secondary branches
 */
export function StyleV({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`relative p-6 rounded-lg overflow-hidden ${className}`}
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.001)',
        backdropFilter: 'blur(0.1px)',
        border: '1px solid rgba(255, 255, 255, 0.012)',
        boxShadow: '0 0 45px rgba(0, 0, 0, 0.7) inset',
      }}
    >
      {/* Heat-strengthened glass - branching pattern */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-55" xmlns="http://www.w3.org/2000/svg">
        {/* Main trunk cracks */}
        <path d="M10,50 L30,45 L50,48 L70,44 L90,46" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" fill="none"/>
        <path d="M40,10 L42,30 L38,50 L41,70 L39,90" stroke="rgba(255,255,255,0.23)" strokeWidth="0.6" fill="none"/>
        <path d="M60,5 L62,25 L58,45 L61,65 L59,85 L60,100" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" fill="none"/>

        {/* Branching cracks */}
        <path d="M30,45 L25,30" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" fill="none"/>
        <path d="M30,45 L35,60" stroke="rgba(255,255,255,0.17)" strokeWidth="0.4" fill="none"/>
        <path d="M50,48 L45,35" stroke="rgba(255,255,255,0.16)" strokeWidth="0.4" fill="none"/>
        <path d="M50,48 L55,65" stroke="rgba(255,255,255,0.17)" strokeWidth="0.4" fill="none"/>
        <path d="M70,44 L65,25" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" fill="none"/>
        <path d="M70,44 L75,60" stroke="rgba(255,255,255,0.16)" strokeWidth="0.4" fill="none"/>

        {/* Secondary branches */}
        <path d="M25,30 L20,20" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" fill="none"/>
        <path d="M25,30 L15,35" stroke="rgba(255,255,255,0.11)" strokeWidth="0.3" fill="none"/>
        <path d="M35,60 L30,70" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" fill="none"/>
        <path d="M35,60 L45,65" stroke="rgba(255,255,255,0.11)" strokeWidth="0.3" fill="none"/>
        <path d="M45,35 L40,25" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" fill="none"/>
        <path d="M55,65 L50,75" stroke="rgba(255,255,255,0.09)" strokeWidth="0.3" fill="none"/>
        <path d="M55,65 L65,70" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" fill="none"/>
        <path d="M65,25 L60,15" stroke="rgba(255,255,255,0.09)" strokeWidth="0.3" fill="none"/>
        <path d="M75,60 L80,70" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" fill="none"/>
        <path d="M75,60 L85,55" stroke="rgba(255,255,255,0.09)" strokeWidth="0.3" fill="none"/>

        {/* Multiple edge fractures */}
        <path d="M0,25 L-2,27 L0,29" stroke="rgba(255,255,255,0.2)" strokeWidth="0.4" fill="none"/>
        <path d="M100,40 L102,42 L100,44" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" fill="none"/>
        <path d="M70,0 L68,-2 L72,0" stroke="rgba(255,255,255,0.19)" strokeWidth="0.4" fill="none"/>
        <path d="M20,100 L18,102 L22,100" stroke="rgba(255,255,255,0.17)" strokeWidth="0.4" fill="none"/>
        <path d="M100,75 L102,77 L100,79" stroke="rgba(255,255,255,0.16)" strokeWidth="0.3" fill="none"/>
      </svg>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Named exports for convenience
export const ShatteredGlassCards = {
  StyleS,
  StyleT,
  StyleU,
  StyleV,
};

// Default export all components
export default {
  StyleS,
  StyleT,
  StyleU,
  StyleV,
};
