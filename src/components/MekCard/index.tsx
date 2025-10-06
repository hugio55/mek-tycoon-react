import React, { useState, useEffect } from 'react';
import { MekAsset, AnimatedMekValues, LEVEL_COLORS, UPGRADE_COSTS } from './types';
import { MekCardImage } from './MekCardImage';
import { MekIdentityLayer } from './MekIdentityLayer';
import { MekLevelBar } from './MekLevelBar';
import { AnimatedNumber } from './AnimatedNumber';

export interface MekCardProps {
  mek: MekAsset;
  getMekImageUrl: (mekNumber: number, size: string) => string;
  currentGold: number;
  walletAddress?: string | null;
  animatedValues?: AnimatedMekValues;
  upgradingMeks?: Set<string>;
  onUpgrade?: (mek: MekAsset, upgradeCost: number, newLevel: number, newBonusRate: number, newTotalRate: number) => void;
  onGoldSpentAnimation?: (animationId: string, amount: number) => void;
  onClick?: () => void;
}

export const MekCard = React.memo(({
  mek,
  getMekImageUrl,
  currentGold,
  walletAddress,
  animatedValues,
  upgradingMeks = new Set(),
  onUpgrade,
  onGoldSpentAnimation,
  onClick
}: MekCardProps) => {
  const level = animatedValues?.level || mek.currentLevel || 1;
  const levelColor = LEVEL_COLORS[level - 1] || '#FFFFFF';
  const borderColor = `${levelColor}80`;

  const handleUpgradeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const currentLevel = mek.currentLevel || 1;
    const upgradeCost = currentLevel < 10 ? UPGRADE_COSTS[currentLevel + 1] : 0;
    const canAfford = currentGold >= upgradeCost;

    if (!canAfford || currentLevel >= 10 || !onUpgrade) return;

    const animationId = `${mek.assetId}-${Date.now()}`;
    if (onGoldSpentAnimation) {
      onGoldSpentAnimation(animationId, upgradeCost);
    }

    const newLevel = currentLevel + 1;
    const baseRate = mek.baseGoldPerHour || mek.goldPerHour;

    let newBonusPercent = 0;
    for (let i = 2; i <= newLevel; i++) {
      newBonusPercent += 5 + (i - 1) * 5;
    }

    const newBonusRate = baseRate * (newBonusPercent / 100);
    const newTotalRate = baseRate + newBonusRate;

    onUpgrade(mek, upgradeCost, newLevel, newBonusRate, newTotalRate);
  };

  const calculateNextLevelBonus = () => {
    const currentLevel = animatedValues?.level || mek.currentLevel || 1;
    const nextLevel = currentLevel + 1;
    const baseRate = mek.baseGoldPerHour || mek.goldPerHour;

    let nextLevelPercent = 0;
    for (let i = 2; i <= nextLevel; i++) {
      nextLevelPercent += 5 + (i - 1) * 5;
    }

    return baseRate * (nextLevelPercent / 100);
  };

  const upgradeCost = (mek.currentLevel || 1) < 10 ? UPGRADE_COSTS[(mek.currentLevel || 1) + 1] : 0;
  const canAfford = currentGold >= upgradeCost;

  return (
    <div
      className="group relative cursor-pointer touch-manipulation"
      onClick={onClick}
    >
      <div
        className="bg-black/10 border sm:border-2 backdrop-blur-md transition-all relative overflow-hidden group-hover:bg-black/20"
        style={{
          willChange: 'background-color, border-color',
          transform: 'translate3d(0,0,0)',
          borderColor: borderColor
        }}
      >
        <div
          className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 9px, #FAB617 9px, #FAB617 10px),
              repeating-linear-gradient(90deg, transparent, transparent 9px, #FAB617 9px, #FAB617 10px)
            `
          }}
        />

        <MekCardImage mek={mek} getMekImageUrl={getMekImageUrl} />

        <div className="w-full relative">
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 via-purple-500/5 to-yellow-500/5 blur-xl" />

          <div className="relative space-y-2 p-2 sm:p-3 bg-black/80">
            <MekIdentityLayer mek={mek} />

            <MekLevelBar mek={mek} animatedLevel={animatedValues?.level} />

            <div className="relative group">
              <div className="relative bg-gradient-to-r from-black/60 via-yellow-950/30 to-black/60 border border-yellow-500/30 rounded-lg p-2 sm:p-3">
                <div className="text-[9px] sm:text-[10px] text-yellow-400 uppercase tracking-wider mb-2">Income Rate</div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-baseline gap-1.5 sm:gap-2">
                      <span className="text-[10px] sm:text-[11px] text-gray-500">BASE:</span>
                      <span className="text-lg sm:text-xl font-bold text-yellow-400">
                        {(mek.baseGoldPerHour || mek.goldPerHour).toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400">gold/hr</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-baseline gap-1.5 sm:gap-2">
                      <span className="text-[10px] sm:text-[11px] text-gray-500">BONUS:</span>
                      {(animatedValues?.bonusRate || mek.levelBoostAmount) && (animatedValues?.bonusRate || mek.levelBoostAmount) > 0 ? (
                        <>
                          <span className={`text-lg sm:text-xl font-bold text-green-400 transition-all duration-700 ${upgradingMeks.has(mek.assetId) ? 'scale-110' : ''}`}>
                            +<AnimatedNumber value={animatedValues?.bonusRate || mek.levelBoostAmount || 0} decimals={1} />
                          </span>
                          <span className="text-xs text-gray-400">gold/hr</span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg sm:text-xl font-bold text-gray-600">+0.0</span>
                          <span className="text-xs text-gray-400">gold/hr</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent my-1" />

                  <div className="flex items-baseline gap-1.5 sm:gap-2">
                    <span className="text-[10px] sm:text-[11px] text-gray-500">TOTAL:</span>
                    <span className="text-xl sm:text-2xl font-black text-white" style={{
                      textShadow: '0 0 15px rgba(250, 182, 23, 0.8)'
                    }}>
                      <AnimatedNumber
                        value={animatedValues?.goldRate || ((mek.baseGoldPerHour || mek.goldPerHour) + (mek.levelBoostAmount || 0))}
                        decimals={1}
                      />
                    </span>
                    <span className="text-sm text-yellow-400 font-bold">gold/hr</span>
                  </div>
                </div>
              </div>
            </div>

            {walletAddress && (mek.currentLevel || 1) < 10 && (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />

                <div className="relative bg-gradient-to-r from-black/60 via-gray-900/60 to-black/60 border border-green-500/30 rounded-lg p-2 sm:p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[9px] sm:text-[10px] text-green-400 uppercase tracking-wider">Upgrade Cost</div>
                      <div className={`text-lg sm:text-xl font-bold ${canAfford ? 'text-yellow-400' : 'text-red-500'}`}>
                        {upgradeCost.toLocaleString()} gold
                      </div>
                      <div className="text-xs text-green-400 mt-1 transition-all duration-500">
                        Bonus: +{calculateNextLevelBonus().toFixed(1)} g/hr
                      </div>
                    </div>
                    <button
                      onClick={handleUpgradeClick}
                      disabled={!canAfford || (mek.currentLevel || 1) >= 10}
                      className={`px-3 sm:px-4 py-2 sm:py-3 rounded font-bold text-xs sm:text-sm transition-all duration-300 min-w-[70px] sm:min-w-[90px] touch-manipulation ${
                        canAfford && (mek.currentLevel || 1) < 10
                          ? 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-500 hover:to-green-400 active:scale-95 shadow-lg shadow-green-500/50'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                      style={{
                        transform: canAfford ? 'translateZ(0)' : 'none'
                      }}
                    >
                      {(mek.currentLevel || 1) >= 10 ? 'MAX' : 'UPGRADE'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.mek.assetId === nextProps.mek.assetId &&
    prevProps.mek.currentLevel === nextProps.mek.currentLevel &&
    prevProps.mek.goldPerHour === nextProps.mek.goldPerHour &&
    prevProps.mek.levelBoostAmount === nextProps.mek.levelBoostAmount &&
    prevProps.currentGold === nextProps.currentGold &&
    prevProps.walletAddress === nextProps.walletAddress &&
    prevProps.animatedValues?.level === nextProps.animatedValues?.level &&
    prevProps.animatedValues?.goldRate === nextProps.animatedValues?.goldRate &&
    prevProps.animatedValues?.bonusRate === nextProps.animatedValues?.bonusRate &&
    prevProps.upgradingMeks === nextProps.upgradingMeks
  );
});

MekCard.displayName = 'MekCard';
