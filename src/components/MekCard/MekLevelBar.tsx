import React from 'react';
import { MekAsset, DEFAULT_LEVEL_COLORS, AnimatedMekValues } from './types';

interface MekLevelBarProps {
  mek: MekAsset;
  animatedLevel?: number;
  levelColors: string[]; // Receive colors from parent instead of querying
}

export const MekLevelBar = ({ mek, animatedLevel, levelColors }: MekLevelBarProps) => {
  const currentLevel = animatedLevel || mek.currentLevel || 1;
  const currentLevelColor = levelColors[currentLevel - 1] || '#FFFFFF';

  return (
    <div className="relative flex flex-col gap-2">
      {/* Level Bars */}
      <div className="bg-black/60 backdrop-blur-md border border-gray-700/50 rounded-lg p-2">
        <div className="flex justify-between gap-1 sm:gap-1.5 h-10 sm:h-8">
          {Array.from({ length: 10 }, (_, i) => {
            const level = i + 1;
            const isActive = level <= currentLevel;

            return (
              <div
                key={level}
                className="flex-1 transition-all duration-500 relative overflow-hidden rounded-sm min-w-[6px] touch-manipulation"
                style={{
                  backgroundColor: isActive ? currentLevelColor : '#1a1a1a',
                  backgroundImage: isActive
                    ? 'none'
                    : 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(102, 102, 102, 0.1) 2px, rgba(102, 102, 102, 0.1) 4px)',
                  border: isActive
                    ? `1px solid ${currentLevelColor}`
                    : '1px solid #666',
                  boxShadow: isActive
                    ? `0 0 12px ${currentLevelColor}80, inset 0 -4px 8px rgba(0,0,0,0.4)`
                    : 'inset 0 2px 4px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(102, 102, 102, 0.2)',
                  opacity: isActive ? 1 : 0.5,
                }}
              >
                {isActive && (
                  <>
                    <div
                      className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                      style={{
                        height: '100%',
                        background: `linear-gradient(to top, ${currentLevelColor}, ${currentLevelColor}80 50%, transparent)`,
                        animation: 'pulse 2s ease-in-out infinite',
                      }}
                    />
                    <div
                      className="absolute top-0 left-0 right-0 h-1/4"
                      style={{
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
                      }}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Inset Panel Card - Below Bars */}
      <div className="flex justify-center">
        <div
          className="relative px-6 py-2 rounded-md"
          style={{
            background: `linear-gradient(135deg,
              rgba(0, 0, 0, 0.8) 0%,
              rgba(20, 20, 20, 0.9) 50%,
              rgba(0, 0, 0, 0.8) 100%)`,
            border: `1px solid ${currentLevelColor}60`,
            boxShadow: `
              inset 0 2px 8px rgba(0, 0, 0, 0.8),
              inset 0 -1px 4px rgba(255, 255, 255, 0.05),
              0 1px 2px ${currentLevelColor}40
            `,
          }}
        >
          <div className="text-center">
            <div
              className="text-3xl font-black leading-none"
              style={{
                color: currentLevelColor,
                textShadow: `0 0 10px ${currentLevelColor}80, 0 2px 4px rgba(0,0,0,0.8)`,
                fontFamily: "'Orbitron', monospace",
              }}
            >
              {currentLevel}
            </div>
            <div
              className="text-xs uppercase tracking-widest mt-0.5"
              style={{
                color: `${currentLevelColor}90`,
                letterSpacing: '0.15em',
                fontFamily: "'Orbitron', monospace",
              }}
            >
              LVL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
