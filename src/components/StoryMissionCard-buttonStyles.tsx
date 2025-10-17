// This file contains the button style rendering logic for StoryMissionCard
// It will be imported into the main component
import React, { useState } from 'react';

// Format time for countdown display (truncated to 2 largest units, lowercase)
const formatCountdownTime = (remainingMs: number): string => {
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
};

// Render locked/completed difficulty buttons with different styles
const renderLockedDifficulty = (
  difficulty: 'easy' | 'medium' | 'hard',
  lockedStyle: number,
  isSelected: boolean,
  config: any
) => {
  // Style 1: Crossed Out with enhanced tooltip
  if (lockedStyle === 1) {
    return (
      <div
        key={difficulty}
        className="flex-1 px-3 py-1.5 relative cursor-not-allowed group"
      >
        <button
          disabled
          className="w-full text-xs font-black uppercase tracking-wider text-gray-600 opacity-50"
          style={{
            background: 'linear-gradient(135deg, #0a0a0a, #151515, #0a0a0a)',
            border: `2px solid #333`,
            borderRadius: '0',
            filter: 'brightness(0.5)'
          }}
        >
          <span className="relative">
            {difficulty}
            {/* Cross-out lines */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute w-full h-0.5 bg-red-500 transform rotate-45"></div>
              <div className="absolute w-full h-0.5 bg-red-500 transform -rotate-45"></div>
            </div>
          </span>
        </button>

        {/* Enhanced hover tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          <div className="bg-black/95 border-2 border-red-500/50 px-4 py-3 rounded-lg whitespace-nowrap">
            <div className="text-red-400 text-sm font-bold mb-1">⚠️ ALREADY COMPLETED</div>
            <div className="text-gray-300 text-xs">
              You have already completed this
              <br />
              contract on <span className="text-red-400 font-bold">{difficulty.toUpperCase()}</span> difficulty.
            </div>
            {/* Arrow pointing down */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
              <div className="border-8 border-transparent border-t-black/95"></div>
              <div className="border-[6px] border-transparent border-t-red-500/50 absolute -top-[7px] -left-[6px]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Style 2: Grayed & Locked Icon
  if (lockedStyle === 2) {
    return (
      <div
        key={difficulty}
        className="flex-1 px-3 py-1.5 relative cursor-not-allowed group"
        title="You have already completed this contract on this difficulty."
      >
        <button
          disabled
          className="w-full text-xs font-black uppercase tracking-wider text-gray-700"
          style={{
            background: 'linear-gradient(135deg, #0a0a0a, #0f0f0f, #0a0a0a)',
            border: `2px solid #222`,
            borderRadius: '0',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <span className="opacity-30">{difficulty}</span>
          {/* Lock icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
        </button>
      </div>
    );
  }

  // Style 3: Red Strike-through
  if (lockedStyle === 3) {
    return (
      <div
        key={difficulty}
        className="flex-1 px-3 py-1.5 relative cursor-not-allowed group"
        title="You have already completed this contract on this difficulty."
      >
        <button
          disabled
          className="w-full text-xs font-black uppercase tracking-wider text-red-900"
          style={{
            background: 'linear-gradient(135deg, #1a0505, #0f0202, #1a0505)',
            border: `2px solid #4a0000`,
            borderRadius: '0',
            textDecoration: 'line-through',
            textDecorationColor: '#ef4444',
            textDecorationThickness: '3px'
          }}
        >
          {difficulty}
        </button>
      </div>
    );
  }

  // Style 4: Checkmark Badge
  if (lockedStyle === 4) {
    return (
      <div
        key={difficulty}
        className="flex-1 px-3 py-1.5 relative cursor-not-allowed group"
        title="You have already completed this contract on this difficulty."
      >
        <button
          disabled
          className="w-full text-xs font-black uppercase tracking-wider text-green-900 relative"
          style={{
            background: 'linear-gradient(135deg, #051a05, #0a1f0a, #051a05)',
            border: `2px solid #0a4a0a`,
            borderRadius: '0',
            overflow: 'visible'
          }}
        >
          <span className="opacity-50">{difficulty}</span>
          {/* Checkmark badge in corner */}
          <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </button>
      </div>
    );
  }

  // Style 5: Glitch Effect
  if (lockedStyle === 5) {
    return (
      <div
        key={difficulty}
        className="flex-1 px-3 py-1.5 relative cursor-not-allowed group"
        title="You have already completed this contract on this difficulty."
      >
        <button
          disabled
          className="w-full text-xs font-black uppercase tracking-wider relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0a0a0a, #151515, #0a0a0a)',
            border: `2px solid #333`,
            borderRadius: '0'
          }}
        >
          {/* Glitched text layers */}
          <span className="relative block">
            <span className="text-gray-600 opacity-50">{difficulty}</span>
            <span className="absolute top-0 left-0 text-red-500 opacity-30 animate-pulse" style={{ transform: 'translate(1px, -1px)' }}>
              {difficulty}
            </span>
            <span className="absolute top-0 left-0 text-blue-500 opacity-30 animate-pulse" style={{ transform: 'translate(-1px, 1px)', animationDelay: '0.1s' }}>
              {difficulty}
            </span>
          </span>
          {/* Scan lines effect */}
          <div className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
              animation: 'scan 8s linear infinite'
            }}
          />
        </button>
      </div>
    );
  }

  // Default fallback
  return null;
};

export const renderDifficultyButton = (
  difficulty: 'easy' | 'medium' | 'hard',
  isSelected: boolean,
  buttonStyle: number,
  onClick: () => void,
  isCompleted: boolean = false,
  lockedStyle: number = 1,
  activeMissionEndTime?: number // End time of active mission (if this difficulty is deployed)
) => {
  const colors = {
    easy: {
      bg: 'bg-green-900/30',
      border: 'border-green-500/60',
      text: 'text-green-400',
      selectedBg: 'bg-green-900/60',
      glow: 'rgb(34 197 94 / 0.3)',
      hoverBorder: 'hover:border-green-400',
      shadow: 'rgb(34 197 94 / 0.5)',
      gradient: '#22c55e',
      pure: 'rgb(34, 197, 94)'
    },
    medium: {
      bg: 'bg-yellow-900/30',
      border: 'border-yellow-500/60',
      text: 'text-yellow-400',
      selectedBg: 'bg-yellow-900/60',
      glow: 'rgb(250 204 21 / 0.3)',
      hoverBorder: 'hover:border-yellow-400',
      shadow: 'rgb(250 204 21 / 0.5)',
      gradient: '#facc15',
      pure: 'rgb(250, 204, 21)'
    },
    hard: {
      bg: 'bg-red-900/30',
      border: 'border-red-500/60',
      text: 'text-red-400',
      selectedBg: 'bg-red-900/60',
      glow: 'rgb(239 68 68 / 0.3)',
      hoverBorder: 'hover:border-red-400',
      shadow: 'rgb(239 68 68 / 0.5)',
      gradient: '#ef4444',
      pure: 'rgb(239, 68, 68)'
    }
  };
  const config = colors[difficulty];

  // If there's an active mission on this difficulty, render active state (takes priority over completed)
  if (activeMissionEndTime !== undefined) {
    const now = Date.now();
    const remainingMs = Math.max(0, activeMissionEndTime - now);
    const timeString = formatCountdownTime(remainingMs);
    const isExpiringSoon = remainingMs < 60000; // Less than 1 minute

    return (
      <button
        key={difficulty}
        onClick={onClick}
        className="flex-1 px-3 py-1.5 text-xs font-black uppercase tracking-wider relative overflow-hidden group"
        style={{
          background: isExpiringSoon
            ? 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.4) 0%, rgba(239, 68, 68, 0.2) 40%, rgba(239, 68, 68, 0.1) 100%)'
            : 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.4) 0%, rgba(6, 182, 212, 0.2) 40%, rgba(6, 182, 212, 0.1) 100%)',
          border: isExpiringSoon
            ? '2px solid rgba(239, 68, 68, 1)'
            : '2px solid rgba(6, 182, 212, 1)',
          boxShadow: isExpiringSoon
            ? `
                0 0 8px rgba(239, 68, 68, 0.8),
                0 0 15px rgba(239, 68, 68, 0.4),
                inset 0 0 15px rgba(239, 68, 68, 0.2)
              `
            : `
                0 0 8px rgba(6, 182, 212, 0.8),
                0 0 15px rgba(6, 182, 212, 0.4),
                inset 0 0 15px rgba(6, 182, 212, 0.2)
              `,
          borderRadius: '0',
          filter: 'brightness(1.3) contrast(1.2)'
        }}
      >
        <span className={`relative z-10 text-sm font-bold ${isExpiringSoon ? 'text-red-300' : 'text-cyan-300'}`}>
          {timeString}
        </span>
        {/* Animated pulse effect */}
        <div className="absolute inset-0 animate-pulse"
          style={{
            background: isExpiringSoon
              ? 'radial-gradient(circle at center, rgba(239, 68, 68, 0.6) 0%, transparent 70%)'
              : 'radial-gradient(circle at center, rgba(6, 182, 212, 0.6) 0%, transparent 70%)',
            opacity: 0.3
          }}
        />
        {/* Animated shimmer effect */}
        <div className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background: isExpiringSoon
              ? `linear-gradient(105deg,
                  transparent 40%,
                  rgba(239, 68, 68, 0.3) 50%,
                  transparent 60%)`
              : `linear-gradient(105deg,
                  transparent 40%,
                  rgba(6, 182, 212, 0.3) 50%,
                  transparent 60%)`,
            animation: 'shimmer 2s infinite'
          }}
        />
      </button>
    );
  }

  // If the difficulty is completed, render the locked state
  if (isCompleted) {
    return renderLockedDifficulty(difficulty, lockedStyle, isSelected, config);
  }

  // Style 1: Holographic (Original) - NO LONGER USED
  if (buttonStyle === 1) {
    return (
      <button
        key={difficulty}
        onClick={onClick}
        className={`
          flex-1 px-3 py-1.5 transition-all duration-300 relative overflow-hidden
          ${isSelected ? config.text : 'text-gray-400 hover:text-gray-300'}
          text-xs font-black uppercase tracking-wider
          ${isSelected ? '' : 'hover:brightness-125'}
        `}
        style={{
          background: isSelected
            ? `linear-gradient(135deg,
                ${config.gradient}33,
                ${config.gradient}55,
                ${config.gradient}33)`
            : `linear-gradient(135deg,
                ${config.gradient}0A,
                ${config.gradient}15,
                ${config.gradient}0A)`,
          border: isSelected
            ? `2px solid ${config.shadow}`
            : `2px solid ${config.gradient}66`,
          boxShadow: isSelected
            ? `0 0 20px ${config.gradient}, 0 0 25px ${config.shadow}, 0 0 30px ${config.shadow}, inset 0 0 10px ${config.glow}`
            : `inset 0 0 8px ${config.gradient}22`,
          borderRadius: '0',  // Sharp corners
          mixBlendMode: isSelected ? 'add' as any : 'normal' as any
        }}
      >
        <span className="relative z-10">{difficulty}</span>
        {/* Holographic shimmer effect */}
        <div className="absolute inset-0 opacity-50 pointer-events-none"
          style={{
            background: `linear-gradient(105deg,
              transparent 40%,
              ${isSelected ? config.glow : 'rgba(255,255,255,0.1)'} 50%,
              transparent 60%)`,
            animation: isSelected ? 'shimmer 2s infinite' : 'none'
          }}
        />
        {/* Rainbow holographic overlay for selected */}
        {isSelected && (
          <div className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(45deg,
                rgba(255,0,0,0.3), rgba(255,255,0,0.3),
                rgba(0,255,0,0.3), rgba(0,255,255,0.3),
                rgba(0,0,255,0.3), rgba(255,0,255,0.3))`,
              backgroundSize: '200% 200%',
              animation: 'holographic 3s ease-in-out infinite'
            }}
          />
        )}
      </button>
    );
  }

  // Style 2: Intense Neon Bloom
  if (buttonStyle === 2) {
    // Define inactive text colors with slight tints
    const inactiveTextColors = {
      easy: 'text-green-900 hover:text-green-800',
      medium: 'text-yellow-900 hover:text-yellow-800',
      hard: 'text-red-900 hover:text-red-800'
    };

    return (
      <button
        key={difficulty}
        onClick={onClick}
        className={`
          flex-1 px-3 py-1.5 transition-all duration-300 relative overflow-hidden
          ${isSelected ? config.text : inactiveTextColors[difficulty]}
          text-xs font-black uppercase tracking-wider
        `}
        style={{
          background: isSelected
            ? `radial-gradient(ellipse at center, ${config.gradient}66 0%, ${config.gradient}33 40%, ${config.gradient}11 100%)`
            : `linear-gradient(135deg, #0a0a0a, #151515, #0a0a0a)`,
          border: isSelected
            ? `2px solid ${config.pure}`
            : `2px solid ${config.gradient}33`,
          boxShadow: isSelected
            ? `
                0 0 40px ${config.pure},
                0 0 80px ${config.shadow},
                0 0 120px ${config.glow},
                inset 0 0 30px ${config.glow}
              `
            : 'inset 0 0 5px rgba(0,0,0,0.8)',
          borderRadius: '0',
          filter: isSelected ? 'brightness(1.3) contrast(1.2)' : 'brightness(0.7)'
        }}
      >
        <span className="relative z-10">{difficulty}</span>
        {isSelected && (
          <>
            <div className="absolute inset-0 animate-pulse"
              style={{
                background: `radial-gradient(circle at center, ${config.pure} 0%, transparent 70%)`,
                opacity: 0.4
              }}
            />
            {/* Animated shimmer effect from holographic */}
            <div className="absolute inset-0 opacity-50 pointer-events-none"
              style={{
                background: `linear-gradient(105deg,
                  transparent 40%,
                  ${config.glow} 50%,
                  transparent 60%)`,
                animation: 'shimmer 2s infinite'
              }}
            />
          </>
        )}
      </button>
    );
  }

  // Style 3: Double Layer Glow
  if (buttonStyle === 3) {
    return (
      <button
        key={difficulty}
        onClick={onClick}
        className={`
          flex-1 px-3 py-1.5 transition-all duration-300 relative
          ${isSelected ? config.text : 'text-gray-600 hover:text-gray-400'}
          text-xs font-black uppercase tracking-wider
        `}
        style={{
          background: isSelected
            ? `linear-gradient(90deg, ${config.gradient}44 0%, ${config.gradient}66 50%, ${config.gradient}44 100%)`
            : 'rgba(10, 10, 10, 0.9)',
          border: isSelected
            ? `3px solid ${config.pure}`
            : `3px solid ${config.gradient}22`,
          boxShadow: isSelected
            ? `
                0 0 15px ${config.pure},
                0 0 30px ${config.pure},
                0 0 45px ${config.shadow},
                inset 0 0 15px ${config.glow},
                inset 0 0 30px ${config.gradient}33
              `
            : 'none',
          borderRadius: '0',
          outline: isSelected ? `2px solid ${config.glow}` : 'none',
          outlineOffset: isSelected ? '3px' : '0'
        }}
      >
        {difficulty}
      </button>
    );
  }

  // Style 4: Plasma Core
  if (buttonStyle === 4) {
    return (
      <button
        key={difficulty}
        onClick={onClick}
        className={`
          flex-1 px-3 py-1.5 transition-all duration-300 relative overflow-hidden
          ${isSelected ? config.text : 'text-gray-600 hover:text-gray-500'}
          text-xs font-black uppercase tracking-wider
        `}
        style={{
          background: isSelected
            ? `linear-gradient(135deg,
                ${config.pure} 0%,
                ${config.gradient}88 25%,
                ${config.gradient}44 50%,
                ${config.gradient}88 75%,
                ${config.pure} 100%)`
            : 'linear-gradient(135deg, #050505, #0a0a0a, #050505)',
          border: isSelected
            ? `2px solid white`
            : `2px solid ${config.gradient}20`,
          boxShadow: isSelected
            ? `
                0 0 25px white,
                0 0 50px ${config.pure},
                0 0 75px ${config.shadow},
                inset 0 0 20px white
              `
            : 'inset 0 0 10px rgba(0,0,0,0.9)',
          borderRadius: '0',
          textShadow: isSelected ? `0 0 10px ${config.pure}, 0 0 20px white` : 'none'
        }}
      >
        <span className="relative z-10">{difficulty}</span>
        {isSelected && (
          <>
            <div className="absolute inset-0"
              style={{
                background: `linear-gradient(45deg, transparent 30%, white 50%, transparent 70%)`,
                opacity: 0.3,
                animation: 'shimmer 1.5s infinite'
              }}
            />
            <div className="absolute inset-0 animate-pulse"
              style={{
                background: `radial-gradient(circle at center, white 0%, transparent 50%)`,
                opacity: 0.2
              }}
            />
          </>
        )}
      </button>
    );
  }

  // Style 5: Laser Edge
  if (buttonStyle === 5) {
    return (
      <button
        key={difficulty}
        onClick={onClick}
        className={`
          flex-1 px-3 py-1.5 transition-all duration-300 relative overflow-hidden
          ${isSelected ? config.text : 'text-gray-700 hover:text-gray-500'}
          text-xs font-black uppercase tracking-wider
        `}
        style={{
          background: isSelected
            ? `linear-gradient(to right,
                ${config.gradient}11,
                ${config.gradient}44,
                ${config.gradient}66,
                ${config.gradient}44,
                ${config.gradient}11)`
            : 'rgba(5, 5, 5, 0.95)',
          borderTop: isSelected ? `3px solid ${config.pure}` : `3px solid ${config.gradient}15`,
          borderBottom: isSelected ? `3px solid ${config.pure}` : `3px solid ${config.gradient}15`,
          borderLeft: isSelected ? `1px solid ${config.shadow}` : `1px solid transparent`,
          borderRight: isSelected ? `1px solid ${config.shadow}` : `1px solid transparent`,
          boxShadow: isSelected
            ? `
                0 -5px 20px ${config.pure},
                0 5px 20px ${config.pure},
                0 0 40px ${config.shadow},
                inset 0 0 20px ${config.glow}
              `
            : 'none',
          borderRadius: '0'
        }}
      >
        <span className="relative z-10">{difficulty}</span>
        {isSelected && (
          <>
            {/* Top laser beam */}
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{
                background: config.pure,
                boxShadow: `0 0 10px ${config.pure}, 0 0 20px ${config.pure}`,
                animation: 'pulse 1s infinite'
              }}
            />
            {/* Bottom laser beam */}
            <div className="absolute bottom-0 left-0 right-0 h-px"
              style={{
                background: config.pure,
                boxShadow: `0 0 10px ${config.pure}, 0 0 20px ${config.pure}`,
                animation: 'pulse 1s infinite'
              }}
            />
          </>
        )}
      </button>
    );
  }

  return null;
};