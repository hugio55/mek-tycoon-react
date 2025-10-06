import React from 'react';
import { MekAsset, LEVEL_COLORS } from './types';

interface MekIdentityLayerProps {
  mek: MekAsset;
}

export const MekIdentityLayer = React.memo(({ mek }: MekIdentityLayerProps) => {
  const level = mek.currentLevel || 1;
  const borderColor = `${LEVEL_COLORS[level - 1] || '#FFFFFF'}4D`;
  const textColor = LEVEL_COLORS[level - 1] || '#FFFFFF';

  return (
    <div className="relative group">
      <div
        className="relative bg-gradient-to-r from-black/60 via-gray-900/60 to-black/60 backdrop-blur-md border rounded-lg p-2 sm:p-2"
        style={{ borderColor }}
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
          <div className="text-right">
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
}, (prevProps, nextProps) => {
  return prevProps.mek.assetId === nextProps.mek.assetId &&
         prevProps.mek.currentLevel === nextProps.mek.currentLevel &&
         prevProps.mek.mekNumber === nextProps.mek.mekNumber &&
         prevProps.mek.rarityRank === nextProps.mek.rarityRank;
});

MekIdentityLayer.displayName = 'MekIdentityLayer';
