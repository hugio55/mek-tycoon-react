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
    <div className="relative">
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
    </div>
  );
};
