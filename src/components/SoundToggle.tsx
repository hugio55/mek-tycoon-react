"use client";

import React from 'react';
import { useSound } from '@/contexts/SoundContext';

/**
 * Mobile-optimized sound toggle with power switch design
 * - 48×48px minimum touch target (WCAG AAA compliant)
 * - Fixed top-right positioning, sticky during scroll
 * - Industrial power switch aesthetic
 * - Responsive sizing for small screens
 */
export default function SoundToggle() {
  const { soundEnabled, toggleSound } = useSound();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-row items-center gap-3 sm:gap-4 sm:top-6 sm:right-6">
      {/* Power Switch Toggle Button */}
      <button
        onClick={toggleSound}
        aria-label={soundEnabled ? "Mute sound" : "Enable sound"}
        className="relative group touch-manipulation"
        style={{
          // Minimum 48×48px touch target
          minWidth: '48px',
          minHeight: '48px',
        }}
      >
        {/* Switch Housing */}
        <div
          className={`
            relative w-12 h-12 sm:w-14 sm:h-14
            border-2 transition-all duration-300
            ${soundEnabled
              ? 'bg-yellow-500/20 border-yellow-500/60 shadow-[0_0_20px_rgba(250,182,23,0.3)]'
              : 'bg-black/40 border-gray-600/40'
            }
          `}
          style={{
            clipPath: 'polygon(15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%, 0% 15%)'
          }}
        >
          {/* Power Symbol */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors duration-300 ${
                soundEnabled ? 'text-yellow-500' : 'text-gray-500'
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              {/* Power button icon */}
              <path d="M12 2v10" />
              <path d="M18.4 6.6a9 9 0 1 1-12.8 0" />
            </svg>
          </div>

          {/* ON Indicator Light */}
          {soundEnabled && (
            <div className="absolute top-1 right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(250,182,23,0.8)]" />
          )}

          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-yellow-500/30" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-yellow-500/30" />
        </div>

        {/* Hover Glow Effect */}
        <div
          className={`
            absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none
            ${soundEnabled ? 'bg-yellow-500/10' : 'bg-gray-500/10'}
          `}
          style={{
            clipPath: 'polygon(15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%, 0% 15%)',
            filter: 'blur(4px)'
          }}
        />
      </button>

      {/* Animated Text Label - slides vertically */}
      <div
        className="overflow-hidden h-5 sm:h-6"
        style={{
          width: 'auto',
          minWidth: '80px',
        }}
      >
        <div
          className="transition-transform duration-300 ease-out"
          style={{
            transform: soundEnabled ? 'translateY(0)' : 'translateY(-100%)',
          }}
        >
          {/* Sound On - shows when enabled */}
          <div
            className="text-base sm:text-lg font-['Orbitron'] font-bold text-yellow-500 h-5 sm:h-6 flex items-center"
            style={{
              textShadow: '0 0 8px rgba(250,182,23,0.5)',
            }}
          >
            Sound On
          </div>

          {/* Sound Off - shows when disabled */}
          <div
            className="text-base sm:text-lg font-['Orbitron'] font-bold text-gray-400 h-5 sm:h-6 flex items-center"
          >
            Sound Off
          </div>
        </div>
      </div>
    </div>
  );
}
