import React, { useState } from 'react';

interface FillTextButtonProps {
  text?: string;
}

const FillTextButton = ({ text = 'uiverse' }: FillTextButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className="relative text-[2em] uppercase tracking-[3px] bg-transparent border-none cursor-pointer m-0 h-auto p-0"
      style={{
        fontFamily: 'Orbitron, sans-serif',
        color: 'rgba(255,255,255,0.6)', // Solid gray-white text for idle
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Base text (always visible, solid color) */}
      <span className="inline-block">&nbsp;{text}&nbsp;</span>

      {/* Hover overlay (sweeps from left to right with green glow) */}
      <span
        className="absolute inset-0 box-border overflow-hidden transition-all duration-500"
        style={{
          fontFamily: 'Orbitron, sans-serif',
          color: '#37FF8B',
          width: isHovered ? '100%' : '0%',
          borderRight: '6px solid #37FF8B',
          filter: isHovered ? 'drop-shadow(0 0 23px #37FF8B)' : 'none',
        }}
        aria-hidden="true"
      >
        &nbsp;{text}&nbsp;
      </span>
    </button>
  );
}

export default FillTextButton;
