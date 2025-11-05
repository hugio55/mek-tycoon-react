'use client';

import React from 'react';
import './GlassButton.css';

interface GlassButtonProps {
  onClick?: () => void;
  children?: React.ReactNode;
  disabled?: boolean;
}

export default function GlassButton({ onClick, children, disabled }: GlassButtonProps) {
  return (
    <div className="glass-button-wrap">
      <button
        className="glass-button"
        onClick={onClick}
        disabled={disabled}
      >
        <span>{children || 'Generate'}</span>
      </button>
      <div className="glass-button-shadow"></div>
    </div>
  );
}
