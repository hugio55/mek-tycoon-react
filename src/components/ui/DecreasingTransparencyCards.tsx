'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Style F - 25% Blue Opacity
 * Features high opacity blue background with strong backdrop blur
 */
export function StyleF({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`relative p-6 rounded-lg border border-blue-400/30 ${className}`}
      onClick={onClick}
      style={{
        background: 'rgba(30, 58, 138, 0.25)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * Style G - 15% Blue Opacity
 * Features medium opacity blue background with backdrop blur
 */
export function StyleG({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`relative p-6 rounded-lg border border-blue-400/20 ${className}`}
      onClick={onClick}
      style={{
        background: 'rgba(30, 58, 138, 0.15)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * Style H - 8% Blue Opacity
 * Features low opacity blue background with subtle backdrop blur
 */
export function StyleH({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`relative p-6 rounded-lg border border-blue-400/10 ${className}`}
      onClick={onClick}
      style={{
        background: 'rgba(30, 58, 138, 0.08)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * Style I - Almost Transparent
 * Features ultra-minimal opacity with barely visible border
 */
export function StyleI({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`relative p-6 rounded-lg border border-gray-400/10 ${className}`}
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Named exports for convenience
export const DecreasingTransparencyCards = {
  StyleF,
  StyleG,
  StyleH,
  StyleI,
};

// Default export all components
export default {
  StyleF,
  StyleG,
  StyleH,
  StyleI,
};
