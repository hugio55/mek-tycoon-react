'use client';

import React, { useState } from 'react';
import './CloseButton.css';

interface CloseButtonProps {
  onClick?: () => void;
  className?: string;
  hideLabel?: boolean;
  variant?: 'default' | 'space-age';
}

const variantStyles = {
  default: {
    size: 37.5,
    barHeight: 3,
    color: '#F4A259',
    hoverColor: '#F25C66',
  },
  'space-age': {
    size: 24,
    barHeight: 2.5,
    color: 'rgba(255, 255, 255, 0.7)',
    hoverColor: '#22d3ee', // cyan-400
  },
};

export default function CloseButton({ onClick, className = '', hideLabel = false, variant = 'default' }: CloseButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const styles = variantStyles[variant];

  // For default variant, use CSS classes; for others, use inline styles
  if (variant === 'default') {
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

  // Custom variant with inline styles
  return (
    <div
      className={className}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="Close"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      style={{
        position: 'relative',
        width: styles.size,
        height: styles.size,
        cursor: 'pointer',
      }}
    >
      {/* Left-right bar */}
      <div
        style={{
          height: styles.barHeight,
          width: styles.size,
          position: 'absolute',
          top: '50%',
          marginTop: -styles.barHeight / 2,
          backgroundColor: isHovered ? styles.hoverColor : styles.color,
          borderRadius: 2,
          transform: isHovered ? 'rotate(-45deg)' : 'rotate(45deg)',
          transition: 'all 0.3s ease-in',
          boxShadow: isHovered ? `0 0 10px ${styles.hoverColor}` : 'none',
        }}
      />
      {/* Right-left bar */}
      <div
        style={{
          height: styles.barHeight,
          width: styles.size,
          position: 'absolute',
          top: '50%',
          marginTop: -styles.barHeight / 2,
          backgroundColor: isHovered ? styles.hoverColor : styles.color,
          borderRadius: 2,
          transform: isHovered ? 'rotate(45deg)' : 'rotate(-45deg)',
          transition: 'all 0.3s ease-in',
          boxShadow: isHovered ? `0 0 10px ${styles.hoverColor}` : 'none',
        }}
      />
    </div>
  );
}
