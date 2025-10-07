'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface MekLevelUpgradeProps {
  assetId: string;
  mekNumber?: number;
  walletAddress: string;
  currentGold: number;
  baseGoldRate?: number; // Base gold rate for boost calculation
  onUpgradeSuccess?: () => void;
}

// Gold cost structure matching backend
const UPGRADE_COSTS = [
  0,      // Level 0 (doesn't exist)
  0,      // Level 1 (starting level, no cost)
  100,    // Level 1→2
  250,    // Level 2→3
  500,    // Level 3→4
  1000,   // Level 4→5
  2000,   // Level 5→6
  4000,   // Level 6→7
  8000,   // Level 7→8
  16000,  // Level 8→9
  32000,  // Level 9→10
];

function calculateUpgradeCost(currentLevel: number): number {
  if (currentLevel < 1 || currentLevel >= 10) {
    return 0;
  }
  return UPGRADE_COSTS[currentLevel + 1];
}

// Accelerating percentage boost calculation matching backend formula
function calculateLevelBoostPercent(level: number): number {
  const percentages = [
    0,      // Level 1
    25,     // Level 2
    60,     // Level 3
    110,    // Level 4
    180,    // Level 5
    270,    // Level 6
    400,    // Level 7
    600,    // Level 8
    900,    // Level 9
    1400,   // Level 10
  ];
  return percentages[level - 1] || 0;
}

export default function MekLevelUpgrade({
  assetId,
  mekNumber,
  walletAddress,
  currentGold,
  baseGoldRate = 0,
  onUpgradeSuccess,
}: MekLevelUpgradeProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [optimisticLevel, setOptimisticLevel] = useState<number | null>(null); // Optimistic level
  const [optimisticGold, setOptimisticGold] = useState<number | null>(null); // Optimistic gold

  // Query the current level
  const mekLevel = useQuery(api.mekLeveling.getMekLevel, {
    walletAddress,
    assetId,
  });

  // Upgrade mutation
  const upgradeMek = useMutation(api.mekLeveling.upgradeMekLevel);

  const currentLevel = optimisticLevel ?? (mekLevel?.currentLevel || 1);
  const isMaxLevel = currentLevel >= 10;
  const upgradeCost = calculateUpgradeCost(currentLevel);
  const displayGold = optimisticGold ?? currentGold;
  const canAfford = displayGold >= upgradeCost;

  // Calculate current and next level boosts using progressive formula
  const baseRate = mekLevel?.baseGoldPerHour || baseGoldRate;
  const currentBoostPercent = calculateLevelBoostPercent(currentLevel);
  const currentBoostAmount = (baseRate * currentBoostPercent) / 100;
  const nextBoostPercent = calculateLevelBoostPercent(currentLevel + 1);
  const nextBoostAmount = (baseRate * nextBoostPercent) / 100;
  const boostIncrease = nextBoostAmount - currentBoostAmount;

  const handleUpgrade = async () => {
    if (!canAfford || isMaxLevel || isUpgrading) return;

    setIsUpgrading(true);
    setUpgradeError(null);

    // OPTIMISTIC UPDATE: Update UI immediately
    const originalLevel = mekLevel?.currentLevel || 1;
    const originalGold = currentGold;
    const expectedNewLevel = originalLevel + 1;
    const expectedNewGold = originalGold - upgradeCost;

    setOptimisticLevel(expectedNewLevel);
    setOptimisticGold(expectedNewGold);

    try {
      const result = await upgradeMek({
        walletAddress,
        assetId,
        mekNumber,
      });

      if (result.success) {
        // SUCCESS: Clear optimistic state (real data will sync)
        setOptimisticLevel(null);
        setOptimisticGold(null);

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);

        // Call the success callback to refresh gold display
        if (onUpgradeSuccess) {
          onUpgradeSuccess();
        }
      }
    } catch (error: any) {
      console.error('Upgrade failed:', error);

      // ROLLBACK: Restore original state
      setOptimisticLevel(null);
      setOptimisticGold(null);

      setUpgradeError(error.message || 'Upgrade failed');
    } finally {
      setIsUpgrading(false);
    }
  };

  // Clear error after 5 seconds
  useEffect(() => {
    if (upgradeError) {
      const timer = setTimeout(() => setUpgradeError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [upgradeError]);

  // Sync optimistic state with real data
  useEffect(() => {
    if (mekLevel && optimisticLevel !== null) {
      // Real data has updated, clear optimistic state
      if (mekLevel.currentLevel === optimisticLevel) {
        setOptimisticLevel(null);
      }
    }
  }, [mekLevel, optimisticLevel]);

  // Sync gold with real data
  useEffect(() => {
    if (optimisticGold !== null && currentGold !== optimisticGold) {
      // Real gold has updated, clear optimistic gold
      setOptimisticGold(null);
    }
  }, [currentGold, optimisticGold]);

  return (
    <div className="w-full">
      {/* Level Display */}
      <div className={`mb-2 text-center ${isMaxLevel ? 'animate-pulse' : ''}`}>
        <div className="flex items-center justify-center gap-2">
          <span className="text-gray-500 text-xs font-mono uppercase">Level</span>
          <div className={`
            text-2xl font-black
            ${isMaxLevel
              ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,182,23,0.8)]'
              : 'text-white'
            }
          `}>
            {currentLevel}
          </div>
          <span className="text-gray-500 text-xs font-mono">/10</span>
        </div>

        {/* Level Progress Bar */}
        <div className="mt-1 w-full h-2 bg-black/50 border border-yellow-500/20 relative overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isMaxLevel
                ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 animate-shimmer'
                : 'bg-yellow-500/60'
            }`}
            style={{ width: `${(currentLevel / 10) * 100}%` }}
          />
          {isMaxLevel && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
        </div>
      </div>

      {/* Upgrade Section */}
      {!isMaxLevel ? (
        <div className="space-y-2">
          {/* Gold Cost Display */}
          <div className="bg-black/40 border border-yellow-500/30 p-2 rounded-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs font-mono uppercase">Upgrade Cost</span>
              <div className={`font-bold ${canAfford ? 'text-yellow-400' : 'text-red-400'}`}>
                {upgradeCost.toLocaleString()} Gold
              </div>
            </div>
            <div className="mt-1 text-center">
              <span className="text-green-400 text-sm font-bold">
                +{nextBoostPercent}% Boost
              </span>
            </div>
          </div>

          {/* Rate Increase Preview */}
          {baseRate > 0 && !isMaxLevel && (
            <div className="bg-green-900/20 border border-green-500/30 p-2 rounded-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-mono uppercase">Rate Boost</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-green-400 font-bold">
                    +{boostIncrease.toFixed(1)} g/hr
                  </span>
                  <span className="text-gray-500 text-[10px]">
                    ({nextBoostPercent}% total)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Upgrade Button */}
          <button
            onClick={handleUpgrade}
            disabled={!canAfford || isUpgrading}
            className={`
              w-full py-2.5 px-4 rounded-sm font-bold uppercase tracking-wider
              transition-all duration-200 relative overflow-hidden
              ${canAfford && !isUpgrading
                ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg hover:shadow-yellow-500/50 active:scale-95'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isUpgrading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Upgrading...
              </span>
            ) : (
              <span className="flex flex-col items-center justify-center gap-1">
                <span>Upgrade to Level {currentLevel + 1}</span>
                {baseRate > 0 && (
                  <span className="text-[10px] opacity-90">
                    {baseRate.toFixed(1)} → {(baseRate + nextBoostAmount).toFixed(1)} g/hr
                  </span>
                )}
                {!canAfford && (
                  <span className="text-xs opacity-70">(Insufficient Gold)</span>
                )}
              </span>
            )}

            {/* Success Animation Overlay */}
            {showSuccess && (
              <div className="absolute inset-0 bg-green-400 animate-pulse flex items-center justify-center">
                <span className="text-black font-black">SUCCESS!</span>
              </div>
            )}
          </button>

          {/* Error Message */}
          {upgradeError && (
            <div className="bg-red-900/20 border border-red-500/50 p-2 rounded-sm">
              <p className="text-red-400 text-xs text-center">{upgradeError}</p>
            </div>
          )}
        </div>
      ) : (
        /* Max Level Display */
        <div className="relative">
          <div className="
            bg-gradient-to-r from-yellow-900/20 via-yellow-500/30 to-yellow-900/20
            border-2 border-yellow-400
            p-3 rounded-sm text-center
            shadow-[0_0_20px_rgba(250,182,23,0.5)]
            animate-pulse
          ">
            <div className="text-yellow-400 font-black text-lg uppercase tracking-widest">
              MAX LEVEL
            </div>
            <div className="text-yellow-400/80 text-xs mt-1 space-y-1">
              <div>Total Invested: {(mekLevel?.totalGoldSpent || 0).toLocaleString()} Gold</div>
              {baseRate > 0 && (
                <div className="text-green-400">
                  Rate: {baseRate.toFixed(1)} + {currentBoostAmount.toFixed(1)} = {(baseRate + currentBoostAmount).toFixed(1)} g/hr
                </div>
              )}
            </div>
          </div>

          {/* Decorative corners */}
          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-yellow-400" />
          <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-yellow-400" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-yellow-400" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-yellow-400" />
        </div>
      )}

    </div>
  );
}