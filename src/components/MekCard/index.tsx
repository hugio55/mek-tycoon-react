import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { MekAsset, AnimatedMekValues, DEFAULT_LEVEL_COLORS, UPGRADE_COSTS } from './types';
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
  // Load level colors from Convex database (only once per component tree)
  const levelColorsFromDb = useQuery(api.levelColors.getLevelColors);
  const levelColors = levelColorsFromDb || DEFAULT_LEVEL_COLORS;

  const level = animatedValues?.level || mek.currentLevel || 1;
  const levelColor = levelColors[level - 1] || '#FFFFFF';
  const borderColor = `${levelColor}80`;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<any[]>([]);
  const isMaxLevel = (mek.currentLevel || 1) === 10;

  // Particle class for MAX LVL holographic effects
  class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;

    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 0.375;
      this.vy = -Math.random() * 0.75;
      this.life = 0;
      this.maxLife = 60 + Math.random() * 60;
      this.size = 1 + Math.random() * 2;
      this.color = `hsl(48, 100%, 50%)`;
    }

    update() {
      this.life++;
      this.x += this.vx;
      this.y += this.vy;
    }

    draw(ctx: CanvasRenderingContext2D) {
      const alpha = 1 - (this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = 5;
      ctx.shadowColor = this.color;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      const radius = Math.max(0.1, this.size * alpha);
      ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    isDead() {
      return this.life >= this.maxLife;
    }
  }

  // Canvas animation for MAX LVL particles
  useEffect(() => {
    if (!isMaxLevel || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particleSpeed = 0.1125;

      if (Math.random() < particleSpeed) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particlesRef.current.push(new Particle(x, y));
      }

      particlesRef.current = particlesRef.current.filter(particle => {
        particle.update();
        particle.draw(ctx);
        return !particle.isDead();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [isMaxLevel]);

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

    // Accelerating percentage system
    const percentages = [0, 25, 60, 110, 180, 270, 400, 600, 900, 1400];
    const newBonusPercent = percentages[newLevel - 1] || 0;

    const newBonusRate = baseRate * (newBonusPercent / 100);
    const newTotalRate = baseRate + newBonusRate;

    onUpgrade(mek, upgradeCost, newLevel, newBonusRate, newTotalRate);
  };

  const calculateNextLevelBonus = () => {
    const currentLevel = animatedValues?.level || mek.currentLevel || 1;
    const nextLevel = currentLevel + 1;

    // Accelerating percentage system
    const percentages = [0, 25, 60, 110, 180, 270, 400, 600, 900, 1400];
    return percentages[nextLevel - 1] || 0;
  };

  const upgradeCost = (mek.currentLevel || 1) < 10 ? UPGRADE_COSTS[(mek.currentLevel || 1) + 1] : 0;
  const canAfford = currentGold >= upgradeCost;

  return (
    <div
      className="@container group relative cursor-pointer touch-manipulation"
      onClick={onClick}
    >
      <div
        className="bg-black/10 border @sm:border-2 backdrop-blur-md transition-all relative overflow-hidden group-hover:bg-black/20"
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
            <MekIdentityLayer mek={mek} levelColors={levelColors} />

            <MekLevelBar mek={mek} animatedLevel={animatedValues?.level} levelColors={levelColors} />

            <div className="relative group">
              <div className="relative bg-gradient-to-r from-black/60 via-yellow-950/30 to-black/60 border border-yellow-500/30 rounded-lg p-2 @sm:p-3">
                <div className="text-[9px] @sm:text-[10px] text-yellow-400 uppercase tracking-wider mb-2">Income Rate</div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 @sm:gap-3">
                    <div className="flex items-baseline gap-1.5 @sm:gap-2">
                      <span className="text-[10px] @sm:text-[11px] text-gray-500">BASE:</span>
                      <span className="text-lg @sm:text-xl font-bold text-yellow-400">
                        {(mek.baseGoldPerHour || mek.goldPerHour).toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400">gold/hr</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 @sm:gap-3">
                    <div className="flex items-baseline gap-1.5 @sm:gap-2">
                      <span className="text-[10px] @sm:text-[11px] text-gray-500">BONUS:</span>
                      {(animatedValues?.bonusRate || mek.levelBoostAmount) && (animatedValues?.bonusRate || mek.levelBoostAmount) > 0 ? (
                        <>
                          <span className={`text-lg @sm:text-xl font-bold text-green-400 transition-all duration-700 ${upgradingMeks.has(mek.assetId) ? 'scale-110' : ''}`}>
                            +<AnimatedNumber value={animatedValues?.bonusRate || mek.levelBoostAmount || 0} decimals={1} />
                          </span>
                          <span className="text-xs text-gray-400">gold/hr</span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg @sm:text-xl font-bold text-gray-600">+0.0</span>
                          <span className="text-xs text-gray-400">gold/hr</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent my-1" />

                  <div className="flex items-baseline gap-1.5 @sm:gap-2">
                    <span className="text-[10px] @sm:text-[11px] text-gray-500">TOTAL:</span>
                    <span className="text-xl @sm:text-2xl font-black text-white" style={{
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

                <div className="relative bg-gradient-to-r from-black/60 via-gray-900/60 to-black/60 border border-green-500/30 rounded-lg p-2 @sm:p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[9px] @sm:text-[10px] text-green-400 uppercase tracking-wider">Upgrade Cost</div>
                      <div className={`text-base @xs:text-lg @sm:text-xl font-bold ${canAfford ? 'text-yellow-400' : 'text-red-500'}`}>
                        {upgradeCost.toLocaleString()} gold
                      </div>
                      <div className="text-[10px] @xs:text-xs @sm:text-xs text-green-400 mt-1 transition-all duration-500">
                        Bonus: +{calculateNextLevelBonus()}% boost
                      </div>
                    </div>
                    <button
                      onClick={handleUpgradeClick}
                      disabled={!canAfford || (mek.currentLevel || 1) >= 10}
                      className={`px-2.5 @xs:px-3 @sm:px-4 py-1.5 @xs:py-2 @sm:py-3 rounded font-bold text-[10px] @xs:text-xs @sm:text-sm transition-all duration-300 min-w-[60px] @xs:min-w-[70px] @sm:min-w-[90px] touch-manipulation ${
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

            {walletAddress && (mek.currentLevel || 1) === 10 && (
              <div className="relative">
                <div className="relative bg-gradient-to-r from-black/60 via-yellow-900/40 to-black/60 border-2 border-yellow-500/50 rounded-lg p-2 @sm:p-3 overflow-hidden"
                  style={{
                    boxShadow: '0 0 40px rgba(250,182,23,0.5)'
                  }}>

                  {/* Holographic grid background */}
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(250,182,23,0.05) 25%, rgba(250,182,23,0.05) 26%, transparent 27%, transparent 74%, rgba(250,182,23,0.05) 75%, rgba(250,182,23,0.05) 76%, transparent 77%, transparent),
                        linear-gradient(90deg, transparent 24%, rgba(250,182,23,0.05) 25%, rgba(250,182,23,0.05) 26%, transparent 27%, transparent 74%, rgba(250,182,23,0.05) 75%, rgba(250,182,23,0.05) 76%, transparent 77%, transparent)`,
                      backgroundSize: '20px 20px',
                      animation: 'holo-grid 10s linear infinite'
                    }}
                  />

                  {/* Data stream effect */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 w-px h-full opacity-50 bg-gradient-to-b from-transparent via-yellow-400 to-transparent"
                        style={{
                          left: `${20 * (i + 1)}%`,
                          animation: `data-stream ${2 + i * 0.5}s linear infinite ${i * 0.2}s`
                        }}
                      />
                    ))}
                  </div>

                  {/* Holographic shimmer */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-70"
                    style={{
                      background: `linear-gradient(105deg,
                        transparent 30%,
                        rgba(250,182,23,0.2) 40%,
                        rgba(250,182,23,0.2) 50%,
                        rgba(250,182,23,0.2) 60%,
                        transparent 70%)`,
                      animation: 'holo-shimmer 3s ease-in-out infinite'
                    }}
                  />

                  {/* Particle canvas */}
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 pointer-events-none"
                    style={{ width: '100%', height: '100%' }}
                  />

                  {/* Match the exact height of the upgrade section by using the same flex structure */}
                  <div className="flex items-center justify-center relative z-10 min-h-[55px] @sm:min-h-[63px]">
                    <div className="text-xl @sm:text-2xl font-black text-yellow-400 uppercase tracking-widest whitespace-nowrap" style={{
                      fontFamily: 'Orbitron, monospace',
                      letterSpacing: '0.2em',
                      textShadow: '0 0 20px rgba(250,182,23,0.8), 0 0 40px rgba(250,182,23,0.4)',
                      filter: 'drop-shadow(0 0 20px rgba(250,182,23,0.8))'
                    }}>
                      MAX LVL
                    </div>
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
