import React, { useState } from 'react';

interface FillTextButtonProps {
  text?: string;
}

const FillTextButton = ({ text = 'uiverse' }: FillTextButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className="relative text-[2em] font-['Arial'] uppercase tracking-[3px] bg-transparent border-none cursor-pointer m-0 h-auto p-0"
      style={{
        color: 'transparent',
        WebkitTextStroke: '1px rgba(255,255,255,0.6)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Actual text (always visible, stroked) */}
      <span className="inline-block">&nbsp;{text}&nbsp;</span>

      {/* Hover text (fills from left to right) */}
      <span
        className="absolute inset-0 box-border overflow-hidden transition-all duration-500"
        style={{
          color: '#37FF8B',
          width: isHovered ? '100%' : '0%',
          borderRight: isHovered ? '6px solid #37FF8B' : '6px solid #37FF8B',
          WebkitTextStroke: '1px #37FF8B',
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
