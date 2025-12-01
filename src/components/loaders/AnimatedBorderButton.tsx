'use client';

import React from 'react';

interface AnimatedBorderButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * Animated Border Button - Transformed from external HTML/CSS component
 *
 * Original: Four animated borders that sequentially travel around the button
 * Colors: Changed from blue (#1779ff) to Mek Tycoon gold (#fab617)
 * Features: Sequential border animations with staggered delays
 */
export default function AnimatedBorderButton({
  children = 'Button',
  onClick,
  className = ''
}: AnimatedBorderButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-[60px] py-[30px]
        text-[#fab617] uppercase tracking-[5px] text-[30px]
        no-underline overflow-hidden
        font-sans
        transition-colors duration-200
        hover:text-[#ffc843]
        ${className}
      `}
      style={{
        boxShadow: '0 20px 50px rgba(0,0,0,.5)'
      }}
    >
      {/* Pseudo-element effect: Light reflection */}
      <div
        className="absolute top-[2px] left-[2px] bottom-[2px] w-1/2 pointer-events-none"
        style={{
          background: 'rgba(255,255,255,0.05)'
        }}
      />

      {/* Top border - animates left to right */}
      <span
        className="absolute top-0 left-0 w-full h-[2px] animate-border-top"
        style={{
          background: 'linear-gradient(to right, #0c002b, #fab617)'
        }}
      />

      {/* Right border - animates top to bottom */}
      <span
        className="absolute top-0 right-0 w-[2px] h-full animate-border-right"
        style={{
          background: 'linear-gradient(to bottom, #0c002b, #fab617)'
        }}
      />

      {/* Bottom border - animates right to left */}
      <span
        className="absolute bottom-0 left-0 w-full h-[2px] animate-border-bottom"
        style={{
          background: 'linear-gradient(to left, #0c002b, #fab617)'
        }}
      />

      {/* Left border - animates bottom to top */}
      <span
        className="absolute bottom-0 left-0 w-[2px] h-full animate-border-left"
        style={{
          background: 'linear-gradient(to top, #0c002b, #fab617)'
        }}
      />

      {/* Button text content */}
      <span className="relative z-10">
        {children}
      </span>
    </button>
  );
}
