'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Style J - Dirty glass with smudges
 * Features radial gradients and cross pattern overlay
 */
export function StyleJ({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`relative p-6 rounded-lg overflow-hidden ${className}`}
      onClick={onClick}
      style={{
        background: `
          linear-gradient(135deg,
            rgba(255, 255, 255, 0.02) 0%,
            rgba(255, 255, 255, 0.05) 50%,
            rgba(255, 255, 255, 0.02) 100%)`,
        backdropFilter: 'blur(6px)',
        boxShadow: 'inset 0 0 40px rgba(255, 255, 255, 0.03)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(250, 182, 23, 0.08) 0%, transparent 30%),
            radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.06) 0%, transparent 25%),
            radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 0%, transparent 40%)`,
          mixBlendMode: 'screen',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * Style K - Streaked glass texture
 * Features linear gradients, radial overlays with blur, and border
 */
export function StyleK({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`relative p-6 rounded-lg border border-gray-600/20 overflow-hidden ${className}`}
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(4px) contrast(1.1)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.01) 50%, transparent 70%),
            linear-gradient(-45deg, transparent 30%, rgba(255, 255, 255, 0.01) 50%, transparent 70%)`,
        }}
      />
      <div
        className="absolute -inset-1 opacity-20"
        style={{
          background: `
            radial-gradient(ellipse at top left, rgba(250, 182, 23, 0.15) 0%, transparent 40%),
            radial-gradient(ellipse at bottom right, rgba(147, 51, 234, 0.1) 0%, transparent 40%),
            radial-gradient(circle at 30% 60%, rgba(255, 255, 255, 0.05) 0%, transparent 20%),
            radial-gradient(circle at 70% 40%, rgba(255, 255, 255, 0.05) 0%, transparent 20%)`,
          filter: 'blur(8px)',
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * Style L - Crosshatch dirty glass
 * Features repeating linear gradients and multiple radial gradients
 */
export function StyleL({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`relative p-6 rounded-lg overflow-hidden ${className}`}
      onClick={onClick}
      style={{
        background: `
          linear-gradient(105deg,
            rgba(255, 255, 255, 0.01) 0%,
            rgba(255, 255, 255, 0.03) 40%,
            rgba(255, 255, 255, 0.01) 100%)`,
        backdropFilter: 'blur(3px) brightness(1.05)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            repeating-linear-gradient(45deg,
              transparent,
              transparent 35px,
              rgba(255, 255, 255, 0.01) 35px,
              rgba(255, 255, 255, 0.01) 70px),
            repeating-linear-gradient(-45deg,
              transparent,
              transparent 35px,
              rgba(255, 255, 255, 0.01) 35px,
              rgba(255, 255, 255, 0.01) 70px)`,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 25% 25%, rgba(250, 182, 23, 0.04) 0%, transparent 25%),
            radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.03) 0%, transparent 25%),
            radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.01) 0%, transparent 50%)`,
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * Style M - Ultra-thin dirty glass with hover effect
 * Features conic gradients, noise texture, and hover transition
 */
export function StyleM({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`relative p-6 rounded-lg overflow-hidden group hover:border-yellow-400/20 transition-all duration-300 ${className}`}
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.01)',
        backdropFilter: 'blur(2px)',
        border: '1px solid rgba(255, 255, 255, 0.03)',
        boxShadow: '0 0 30px rgba(0, 0, 0, 0.3) inset',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background: `
            conic-gradient(from 45deg at 30% 30%, transparent 0deg, rgba(250, 182, 23, 0.03) 90deg, transparent 180deg),
            conic-gradient(from 225deg at 70% 70%, transparent 0deg, rgba(147, 51, 234, 0.02) 90deg, transparent 180deg),
            radial-gradient(circle at 50% 50%, transparent 30%, rgba(255, 255, 255, 0.01) 70%, transparent 100%)`,
          filter: 'blur(4px)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Named exports for convenience
export const DirtyGlassCards = {
  StyleJ,
  StyleK,
  StyleL,
  StyleM,
};

// Default export all components
export default {
  StyleJ,
  StyleK,
  StyleL,
  StyleM,
};