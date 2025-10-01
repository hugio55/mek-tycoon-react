'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { createPortal } from 'react-dom';
import { getMekImageUrl } from '@/lib/mekNumberToVariation';
import { getVariationInfoFromFullKey } from '@/lib/variationNameLookup';

interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  displayWallet: string;
  currentGold: number;
  hourlyRate: number;
  mekCount: number;
  isCurrentUser: boolean;
}

interface WalletMek {
  assetId: string;
  assetName: string;
  level: number;
  goldPerHour: number;
  baseGoldPerHour?: number;
  imageUrl: string | null;
  sourceKey?: string;
  mekNumber?: number;
  rarityRank?: number;
}

interface GoldLeaderboardProps {
  currentWallet?: string;
}

export default function GoldLeaderboard({ currentWallet }: GoldLeaderboardProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [selectedMek, setSelectedMek] = useState<WalletMek | null>(null);
  const [realtimeGold, setRealtimeGold] = useState<Map<string, number>>(new Map());
  const [isMounted, setIsMounted] = useState(false);

  // Get top miners data
  const topMiners = useQuery(api.goldLeaderboard.getTopGoldMiners, {
    currentWallet: currentWallet,
  });

  // Get selected wallet's Meks
  const walletMeks = useQuery(api.goldLeaderboard.getWalletMeksForDisplay,
    selectedWallet ? { walletAddress: selectedWallet } : 'skip'
  );

  // Subscribe to real-time updates
  const realtimeData = useQuery(api.goldLeaderboard.subscribeToTopMiners);

  // Set mounted state for portal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync real-time gold directly from database (no animation)
  useEffect(() => {
    if (!topMiners) return;

    console.log('[LEADERBOARD SYNC] Database values:', topMiners.map(m => ({
      wallet: m.displayWallet,
      cumulativeGold: m.currentGold,
      hourlyRate: m.hourlyRate
    })));

    // Set gold values directly from database
    const goldMap = new Map();
    topMiners.forEach(miner => {
      goldMap.set(miner.walletAddress, miner.currentGold);
    });
    setRealtimeGold(goldMap);
  }, [topMiners]);

  // Update when real-time data changes
  useEffect(() => {
    if (realtimeData) {
      console.log('[LEADERBOARD REALTIME] Real-time update:', realtimeData.map(m => ({
        wallet: m.walletAddress.slice(0, 8),
        cumulativeGold: m.currentGold,
        hourlyRate: m.hourlyRate
      })));

      const goldMap = new Map();
      realtimeData.forEach(miner => {
        goldMap.set(miner.walletAddress, miner.currentGold);
      });
      setRealtimeGold(goldMap);
    }
  }, [realtimeData]);

  // Always create 3 slots, fill with empty if needed
  const displayData = [...(topMiners || [])];
  while (displayData.length < 3) {
    displayData.push(null);
  }

  return (
    <>
      {/* Top Corporations styled like Mek cards */}
      <div className="w-[500px]">
        <div className="bg-black/10 border-2 border-yellow-500/50 backdrop-blur-xl relative overflow-hidden">
          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
                repeating-linear-gradient(0deg, transparent, transparent 9px, #FAB617 9px, #FAB617 10px),
                repeating-linear-gradient(90deg, transparent, transparent 9px, #FAB617 9px, #FAB617 10px)
              `
            }}
          />

          {/* Header */}
          <div className="relative bg-gradient-to-r from-black/60 via-gray-900/60 to-black/60 backdrop-blur-md border-b border-yellow-500/30 p-2">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-black text-white" style={{
                textShadow: '0 0 20px rgba(250, 182, 23, 0.5)',
                fontFamily: 'Orbitron, monospace'
              }}>
                TOP CORPORATIONS
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-yellow-400">Cumulative Gold</div>
                <div className="text-[10px] text-gray-500">Gold/hr</div>
              </div>
            </div>
          </div>

          {/* Company slots */}
          <div className="relative space-y-1 p-2 bg-black/80 backdrop-blur-sm">
            {displayData.map((miner, index) => {
              const rank = index + 1;
              // Display database value directly (no animation)
              const displayGold = miner ? miner.currentGold : 0;

              // Debug logging for rendered value
              if (miner && index === 0) {
                console.log(`[LEADERBOARD RENDER] Rank ${rank} (${miner.displayWallet}): ${Math.floor(displayGold)} gold`);
              }

              // Rank colors
              const rankColor = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : '#FFFFFF';
              const rankGlow = rank === 1 ? '0 0 20px rgba(255, 215, 0, 0.8)' :
                                rank === 2 ? '0 0 15px rgba(192, 192, 192, 0.6)' :
                                rank === 3 ? '0 0 10px rgba(205, 127, 50, 0.6)' : 'none';

              return (
                <div key={`slot-${rank}`} className="relative group">
                  <div className="relative bg-gradient-to-r from-black/60 via-gray-900/60 to-black/60 backdrop-blur-md border border-yellow-500/30 p-2">
                    {miner ? (
                      <>
                        {/* Active company */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Rank */}
                            <div className="text-3xl font-black" style={{
                              color: rankColor,
                              textShadow: rankGlow,
                              fontFamily: 'Orbitron, monospace',
                              minWidth: '40px'
                            }}>
                              {rank}
                            </div>

                            {/* Company info */}
                            <button
                              onClick={() => setSelectedWallet(miner.walletAddress)}
                              className="text-left hover:text-yellow-400 transition-colors"
                            >
                              <div className="text-sm font-bold text-white">
                                {miner.displayWallet}
                                {miner.isCurrentUser && (
                                  <span className="ml-2 text-[10px] text-yellow-400 bg-yellow-400/20 px-1.5 py-0.5 rounded">YOU</span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-500">{miner.mekCount} Meks</div>
                            </button>
                          </div>

                          {/* Gold stats */}
                          <div className="text-right">
                            <div className="text-lg font-bold text-yellow-400">
                              {Math.floor(displayGold).toLocaleString()}
                            </div>
                            <div className="text-[10px] text-gray-500">{miner.hourlyRate.toFixed(0)}/hr</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Empty slot */}
                        <div className="flex items-center justify-between opacity-30">
                          <div className="flex items-center gap-3">
                            {/* Rank */}
                            <div className="text-3xl font-black" style={{
                              color: rankColor,
                              textShadow: rankGlow,
                              fontFamily: 'Orbitron, monospace',
                              minWidth: '40px'
                            }}>
                              {rank}
                            </div>

                            {/* Empty placeholder */}
                            <div>
                              <div className="text-sm font-bold text-gray-600">---</div>
                              <div className="text-[10px] text-gray-600">No Company</div>
                            </div>
                          </div>

                          {/* Empty stats */}
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-600">0</div>
                            <div className="text-[10px] text-gray-600">0/hr</div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Meks Lightbox - Clean Detail View */}
      {isMounted && selectedWallet && walletMeks && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
          onClick={() => setSelectedWallet(null)}
        >
          <div
            className="relative w-full max-w-6xl bg-black/80 backdrop-blur-xl border border-yellow-500/40 p-8 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedWallet(null)}
              className="absolute top-4 right-4 text-yellow-500 hover:text-yellow-300 text-3xl font-bold z-10 transition-colors"
            >
              ×
            </button>

            {/* Header */}
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-black text-yellow-500 uppercase tracking-wider font-['Orbitron'] mb-2">
                {walletMeks.displayWallet}
              </h2>
              <p className="text-gray-400 font-mono text-lg">
                {walletMeks.totalMeks} Meks • {walletMeks.totalGoldPerHour?.toFixed(1)} Gold/hr
              </p>
            </div>

            {/* Meks Grid - Larger thumbnails */}
            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
              {walletMeks.meks.length === 0 ? (
                <p className="text-center text-gray-400 py-12">No Meks found</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {walletMeks.meks.map((mek) => (
                    <button
                      key={mek.assetId}
                      onClick={() => setSelectedMek(mek)}
                      className="mek-card-industrial mek-border-sharp-gold hover:mek-glow-yellow transition-all duration-300 group cursor-pointer text-left"
                    >
                      {/* Level Badge - Industrial Style */}
                      <div className="absolute top-2 right-2 z-10 mek-border-sharp-gold bg-black/95 backdrop-blur-sm px-3 py-1">
                        <span className="mek-text-industrial text-yellow-400 text-xs">
                          LV.{mek.level}
                        </span>
                      </div>

                      {/* Grunge Texture Overlay */}
                      <div className="mek-overlay-scratches"></div>

                      {/* Mek Image with Metal Texture Background */}
                      <div className="aspect-square bg-black overflow-hidden relative mek-overlay-metal-texture">
                        {mek.imageUrl ? (
                          <img
                            src={mek.imageUrl}
                            alt={mek.assetName}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 relative z-10"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm relative z-10">
                            <span className="mek-text-industrial text-xs">NO IMAGE</span>
                          </div>
                        )}
                      </div>

                      {/* Info Section - Industrial Header Style */}
                      <div className="relative overflow-hidden">
                        <div className="mek-overlay-diagonal-stripes absolute inset-0 opacity-40"></div>
                        <div className="p-3 relative z-10">
                          <p className="mek-label-uppercase text-gray-400 truncate mb-2">
                            {mek.assetName}
                          </p>
                          <div className="font-mono font-bold">
                            {(() => {
                              const baseRate = mek.baseGoldPerHour || mek.goldPerHour;
                              const bonus = mek.goldPerHour - baseRate;

                              if (bonus > 0) {
                                return (
                                  <>
                                    <span className="mek-value-primary text-base">{baseRate.toFixed(1)}</span>
                                    <span className="text-green-400 text-sm font-bold"> +{bonus.toFixed(1)}</span>
                                    <span className="text-gray-500 text-xs"> g/hr</span>
                                  </>
                                );
                              } else {
                                return (
                                  <span className="mek-value-primary text-base">{mek.goldPerHour.toFixed(1)} <span className="text-xs text-gray-500">g/hr</span></span>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Single Mek Detail View */}
      {isMounted && selectedMek && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg overflow-y-auto"
          onClick={() => setSelectedMek(null)}
        >
          <div
            className="relative w-full max-w-5xl bg-black/80 backdrop-blur-xl border border-yellow-500/40 p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Back button - Upper Left */}
            <button
              onClick={() => setSelectedMek(null)}
              className="absolute top-4 left-4 px-4 py-2 bg-black/60 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-500/50 transition-all font-bold text-sm uppercase tracking-wider z-10"
            >
              ← Back
            </button>

            {/* Close button - Upper Right */}
            <button
              onClick={() => {
                setSelectedMek(null);
                setSelectedWallet(null);
              }}
              className="absolute top-4 right-4 text-yellow-500 hover:text-yellow-300 text-3xl font-bold transition-colors z-10"
            >
              ×
            </button>

            <div className="flex flex-col items-center">
              {/* Large Mek Image */}
              <div className="relative w-full max-w-3xl mb-6">
                <div className="relative aspect-square bg-black overflow-hidden">
                  {(() => {
                    console.log('[MEK LIGHTBOX] Image loading:', {
                      mekNumber: selectedMek.mekNumber,
                      imageUrl: selectedMek.imageUrl,
                      sourceKey: selectedMek.sourceKey,
                      willUseHighRes: !!selectedMek.mekNumber
                    });

                    if (selectedMek.mekNumber) {
                      const highResUrl = getMekImageUrl(selectedMek.mekNumber, '1000px');
                      console.log('[MEK LIGHTBOX] Using high-res:', highResUrl);
                      return (
                        <img
                          src={highResUrl}
                          alt={selectedMek.assetName}
                          className="w-full h-full object-contain"
                        />
                      );
                    } else if (selectedMek.imageUrl) {
                      console.log('[MEK LIGHTBOX] Falling back to imageUrl:', selectedMek.imageUrl);
                      return (
                        <img
                          src={selectedMek.imageUrl}
                          alt={selectedMek.assetName}
                          className="w-full h-full object-contain"
                        />
                      );
                    } else {
                      return (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 font-mono">
                          NO IMAGE
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Mek Info Below */}
              <div className="w-full max-w-3xl space-y-4">
                {/* Mek Name and Rank */}
                <div className="text-center">
                  <h2 className="text-3xl font-black text-yellow-500 uppercase tracking-wider font-['Orbitron'] mb-2">
                    {selectedMek.assetName}
                  </h2>
                  <p className="text-gray-400 font-mono text-lg">
                    RANK {selectedMek.rarityRank || '???'}
                  </p>
                </div>

                {/* Variations Table */}
                {selectedMek.sourceKey && (
                  <div className="bg-black/50">
                    <table className="w-full">
                      <tbody>
                        {(() => {
                          const variations = getVariationInfoFromFullKey(selectedMek.sourceKey!);
                          return (
                            <>
                              <tr className="border-b border-gray-800">
                                <td className="py-3 pr-4 text-gray-500 font-mono uppercase text-xs tracking-wider">
                                  HEAD
                                </td>
                                <td className="py-3 text-right font-bold text-sm" style={{ color: variations.head.color }}>
                                  {variations.head.name}
                                </td>
                                <td className="py-3 pl-3 text-right font-mono text-lg font-bold w-16" style={{ color: variations.head.color }}>
                                  {variations.head.count > 0 ? `×${variations.head.count}` : ''}
                                </td>
                              </tr>
                              <tr className="border-b border-gray-800">
                                <td className="py-3 pr-4 text-gray-500 font-mono uppercase text-xs tracking-wider">
                                  BODY
                                </td>
                                <td className="py-3 text-right font-bold text-sm" style={{ color: variations.body.color }}>
                                  {variations.body.name}
                                </td>
                                <td className="py-3 pl-3 text-right font-mono text-lg font-bold" style={{ color: variations.body.color }}>
                                  {variations.body.count > 0 ? `×${variations.body.count}` : ''}
                                </td>
                              </tr>
                              <tr>
                                <td className="py-3 pr-4 text-gray-500 font-mono uppercase text-xs tracking-wider">
                                  TRAIT
                                </td>
                                <td className="py-3 text-right font-bold text-sm" style={{ color: variations.trait.color }}>
                                  {variations.trait.name}
                                </td>
                                <td className="py-3 pl-3 text-right font-mono text-lg font-bold" style={{ color: variations.trait.color }}>
                                  {variations.trait.count > 0 ? `×${variations.trait.count}` : ''}
                                </td>
                              </tr>
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(250, 204, 21, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(250, 204, 21, 0.5);
        }
      `}</style>
    </>
  );
}