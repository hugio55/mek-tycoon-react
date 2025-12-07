'use client';

import React from 'react';
import './CloseButton.css';

interface CloseButtonProps {
  onClick?: () => void;
  className?: string;
  hideLabel?: boolean;
}

export default function CloseButton({ onClick, className = '', hideLabel = false }: CloseButtonProps) {
  return (
    <div
      className={`close-container ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="Close"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="leftright"></div>
      <div className="rightleft"></div>
      {!hideLabel && <label className="close">close</label>}
    </div>
  );
}
