import React from 'react';
import { MekAsset, DEFAULT_LEVEL_COLORS } from './types';

interface MekIdentityLayerProps {
  mek: MekAsset;
  levelColors: string[]; // Receive colors from parent instead of querying
}

export const MekIdentityLayer = ({ mek, levelColors }: MekIdentityLayerProps) => {
  const level = mek.currentLevel || 1;

  const borderColor = `${levelColors[level - 1] || '#FFFFFF'}4D`;
  const textColor = levelColors[level - 1] || '#FFFFFF';

  return (
    <div className="relative group">
      <div
        className="relative bg-gradient-to-r from-black/60 via-gray-900/60 to-black/60 backdrop-blur-md border rounded-lg p-2 sm:p-2"
        style={{
          borderColor,
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(255, 255, 255, 0.015) 8px, rgba(255, 255, 255, 0.015) 9px),
            repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255, 255, 255, 0.015) 8px, rgba(255, 255, 255, 0.015) 9px)
          `,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[9px] sm:text-[10px] text-yellow-400 uppercase tracking-wider mb-0.5">
              Mechanism Unit
            </div>
            <div
              className="text-lg sm:text-xl font-medium leading-tight"
              style={{
                color: textColor,
                fontFamily: 'Orbitron, monospace',
                letterSpacing: '0.05em',
                opacity: 0.7,
              }}
            >
              MEK #{mek.mekNumber ? mek.mekNumber.toString().padStart(4, '0') : '????'}
            </div>
            {mek.rarityRank && (
              <div
                className="text-sm text-gray-300 uppercase tracking-wider mt-0.5"
                style={{
                  fontFamily: 'monospace',
                  opacity: 0.85,
                }}
              >
                Rank: {mek.rarityRank}
              </div>
            )}
          </div>
          <div className="flex flex-col items-center">
            <div className="text-[10px] text-yellow-400 uppercase tracking-wider mb-0.5">
              Level
            </div>
            <div className="text-2xl font-black leading-tight" style={{ color: textColor }}>
              {level}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
