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
  showMoreButton?: boolean;
}

export default function GoldLeaderboard({ currentWallet, showMoreButton = false }: GoldLeaderboardProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [selectedMek, setSelectedMek] = useState<WalletMek | null>(null);
  const [realtimeGold, setRealtimeGold] = useState<Map<string, number>>(new Map());
  const [isMounted, setIsMounted] = useState(false);
  const [showAllCorporations, setShowAllCorporations] = useState(false);

  // Get top miners data
  const topMiners = useQuery(api.goldLeaderboard.getTopGoldMiners, {
    guildId: "938648161810006119",
  });

  // Get all corporations data (for modal)
  const allCorporations = useQuery(api.goldLeaderboard.getAllCorporations, {
    guildId: "938648161810006119",
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
      <div className="w-full sm:max-w-[600px] mb-0">
        <div className="bg-black/90 backdrop-blur-xl relative">
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
          <div className="relative bg-gradient-to-r from-black/60 via-gray-900/60 to-black/60 backdrop-blur-md border-b border-yellow-500/30">
            {/* Hazmat diagonal stripes */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, #FAB617 20px, #FAB617 40px)',
              }}
            />
            <div className="flex items-center justify-between gap-2 sm:gap-4 p-2 sm:p-3 relative">
              <div className="font-black text-white whitespace-nowrap" style={{
                textShadow: '0 0 20px rgba(250, 182, 23, 0.5)',
                fontFamily: 'Orbitron, monospace',
                fontSize: 'clamp(0.875rem, 4vw, 1.5rem)'
              }}>
                TOP CORPORATIONS
              </div>
              <div className="text-right flex-shrink-0 whitespace-nowrap">
                <div className="font-bold text-yellow-400" style={{
                  fontSize: 'clamp(0.625rem, 2.5vw, 0.875rem)'
                }}>
                  Cumulative Gold
                </div>
                <div className="text-gray-500" style={{
                  fontSize: 'clamp(0.5rem, 2vw, 0.625rem)'
                }}>Gold/hr</div>
              </div>
            </div>
          </div>

          {/* Company slots */}
          <div className={`relative px-2 pt-2 bg-black/80 backdrop-blur-sm ${showMoreButton ? 'pb-[0px]' : 'pb-[10px]'}`}>
            {displayData.map((miner, index) => {
              const rank = index + 1;
              // Display database value directly (no animation)
              const displayGold = miner ? miner.currentGold : 0;

              // Rank colors
              const rankColor = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : '#FFFFFF';
              const rankGlow = rank === 1 ? '0 0 20px rgba(255, 215, 0, 0.8)' :
                                rank === 2 ? '0 0 15px rgba(192, 192, 192, 0.6)' :
                                rank === 3 ? '0 0 10px rgba(205, 127, 50, 0.6)' : 'none';

              return (
                <div key={`slot-${rank}`} className={`relative group ${index < displayData.length - 1 ? 'mb-1' : 'mb-0'}`}>
                  <div className="relative bg-gradient-to-r from-black/60 via-gray-900/60 to-black/60 backdrop-blur-md border border-yellow-500/30">
                    {miner ? (
                      <>
                        {/* Active company */}
                        <div className="flex items-center justify-between p-3 sm:p-2">
                          <div className="flex items-center gap-3 sm:gap-3">
                            {/* Rank */}
                            <div className="text-2xl sm:text-3xl font-black" style={{
                              color: rankColor,
                              textShadow: rankGlow,
                              fontFamily: 'Orbitron, monospace',
                              minWidth: '32px sm:40px'
                            }}>
                              {rank}
                            </div>

                            {/* Company info */}
                            <button
                              onClick={() => setSelectedWallet(miner.walletAddress)}
                              className="text-left hover:text-yellow-400 transition-colors touch-manipulation min-h-[44px] sm:min-h-0 flex flex-col justify-center"
                            >
                              <div className="text-base sm:text-sm font-bold text-white">
                                {miner.displayWallet}
                                {miner.isCurrentUser && (
                                  <span className="ml-2 text-[10px] text-yellow-400 bg-yellow-400/20 px-1.5 py-0.5 rounded">YOU</span>
                                )}
                              </div>
                              <div className="text-xs sm:text-[10px] text-gray-500">{miner.mekCount} Meks</div>
                            </button>
                          </div>

                          {/* Gold stats */}
                          <div className="text-right">
                            <div className="text-base sm:text-lg font-bold text-yellow-400">
                              {Math.floor(displayGold).toLocaleString()}
                            </div>
                            <div className="text-xs sm:text-[10px] text-gray-500">{miner.hourlyRate.toFixed(0)}/hr</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Empty slot */}
                        <div className="flex items-center justify-between opacity-30 p-3 sm:p-2">
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

            {/* Show more text link - only on main page */}
            {showMoreButton && (
              <div className="text-center bg-black/80 backdrop-blur-sm pt-1.5 pb-1" style={{ marginTop: '7px' }}>
                <button
                  onClick={() => setShowAllCorporations(true)}
                  className="text-yellow-400/70 hover:text-yellow-400 transition-colors text-base font-mono"
                >
                  Show more
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Corporations Modal */}
      {isMounted && showAllCorporations && allCorporations && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
          onClick={() => setShowAllCorporations(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-black/80 backdrop-blur-xl border border-yellow-500/40 p-4 sm:p-8 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowAllCorporations(false)}
              className="absolute top-2 sm:top-4 right-2 sm:right-4 text-yellow-500 hover:text-yellow-300 text-4xl sm:text-3xl font-bold z-10 transition-colors w-12 h-12 flex items-center justify-center touch-manipulation"
            >
              ×
            </button>

            {/* Header */}
            <div className="mb-6 sm:mb-8 text-center pr-12">
              <h2 className="text-2xl sm:text-3xl font-black text-yellow-500 uppercase tracking-wider font-['Orbitron'] mb-2">
                All Corporations
              </h2>
              <p className="text-gray-400 font-mono text-base sm:text-lg">
                {allCorporations.length} Total
              </p>
            </div>

            {/* Corporations List */}
            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
              {allCorporations.length === 0 ? (
                <p className="text-center text-gray-400 py-12">No corporations found</p>
              ) : (
                <div className="space-y-2">
                  {allCorporations.map((corp) => {
                    const rankColor = corp.rank === 1 ? '#FFD700' : corp.rank === 2 ? '#C0C0C0' : corp.rank === 3 ? '#CD7F32' : '#6B7280';
                    const rankGlow = corp.rank === 1 ? '0 0 20px rgba(255, 215, 0, 0.8)' :
                                      corp.rank === 2 ? '0 0 15px rgba(192, 192, 192, 0.6)' :
                                      corp.rank === 3 ? '0 0 10px rgba(205, 127, 50, 0.6)' : 'none';

                    return (
                      <div key={corp.walletAddress} className="relative bg-gradient-to-r from-black/60 via-gray-900/60 to-black/60 backdrop-blur-md border border-yellow-500/30">
                        <button
                          onClick={() => {
                            setShowAllCorporations(false);
                            setSelectedWallet(corp.walletAddress);
                          }}
                          className="w-full flex items-center justify-between p-3 sm:p-2 hover:bg-yellow-500/10 transition-colors text-left touch-manipulation"
                        >
                          <div className="flex items-center gap-3 sm:gap-3">
                            {/* Rank */}
                            <div className="text-2xl sm:text-xl font-black min-w-[60px]" style={{
                              color: rankColor,
                              textShadow: rankGlow,
                              fontFamily: 'Orbitron, monospace',
                            }}>
                              #{corp.rank}
                            </div>

                            {/* Company info */}
                            <div>
                              <div className="text-base sm:text-sm font-bold text-white">
                                {corp.displayWallet}
                                {corp.isCurrentUser && (
                                  <span className="ml-2 text-[10px] text-yellow-400 bg-yellow-400/20 px-1.5 py-0.5 rounded">YOU</span>
                                )}
                              </div>
                              <div className="text-xs sm:text-[10px] text-gray-500">{corp.mekCount} Meks</div>
                            </div>
                          </div>

                          {/* Gold stats */}
                          <div className="text-right">
                            <div className="text-base sm:text-lg font-bold text-yellow-400">
                              {corp.currentGold.toLocaleString()}
                            </div>
                            <div className="text-xs sm:text-[10px] text-gray-500">{corp.hourlyRate.toFixed(0)}/hr</div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Meks Lightbox - Clean Detail View */}
      {isMounted && selectedWallet && walletMeks && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
          onClick={() => setSelectedWallet(null)}
        >
          <div
            className="relative w-full max-w-6xl bg-black/80 backdrop-blur-xl border border-yellow-500/40 p-4 sm:p-8 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedWallet(null)}
              className="absolute top-2 sm:top-4 right-2 sm:right-4 text-yellow-500 hover:text-yellow-300 text-4xl sm:text-3xl font-bold z-10 transition-colors w-12 h-12 flex items-center justify-center touch-manipulation"
            >
              ×
            </button>

            {/* Header */}
            <div className="mb-6 sm:mb-8 text-center pr-12">
              <h2 className="text-2xl sm:text-3xl font-black text-yellow-500 tracking-wide font-['Orbitron'] mb-2" style={{ letterSpacing: '0.05em' }}>
                {walletMeks.displayWallet}
              </h2>
              <p className="text-gray-400 font-mono text-base sm:text-lg">
                {walletMeks.totalMeks} Meks • {walletMeks.totalGoldPerHour?.toFixed(1)} Gold/hr
              </p>
            </div>

            {/* Meks Grid - Larger thumbnails */}
            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar pr-3">
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
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          style={{ willChange: 'backdrop-filter' }}
          onClick={() => setSelectedMek(null)}
        >
          <div
            className="relative w-full max-w-3xl bg-black/80 backdrop-blur-md border border-yellow-500/40 p-6 sm:p-8 flex flex-col max-h-[95vh]"
            style={{ transform: 'translate3d(0,0,0)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setSelectedMek(null);
                setSelectedWallet(null);
              }}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-yellow-500 hover:text-yellow-300 text-3xl font-bold z-10 transition-colors"
            >
              ×
            </button>

            <div className="flex flex-col items-center flex-1 min-h-0">
              {/* Large Mek Image - Scales to fit */}
              <div className="relative w-full flex items-center justify-center mb-4 flex-shrink">
                {selectedMek.mekNumber ? (
                  <img
                    src={getMekImageUrl(selectedMek.mekNumber, '1000px')}
                    alt={selectedMek.assetName}
                    className="max-w-full max-h-[50vh] w-auto h-auto object-contain"
                  />
                ) : selectedMek.imageUrl ? (
                  <img
                    src={selectedMek.imageUrl}
                    alt={selectedMek.assetName}
                    className="max-w-full max-h-[50vh] w-auto h-auto object-contain"
                  />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center text-gray-600 font-mono">
                    NO IMAGE
                  </div>
                )}
              </div>

              {/* Mek Info Below - Flexible shrink */}
              <div className="w-full space-y-2 sm:space-y-4 flex-shrink-0">
                {/* Mek Name and Rank */}
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl font-black text-yellow-500 uppercase tracking-wider font-['Orbitron'] mb-1 sm:mb-2">
                    {selectedMek.assetName}
                  </h2>
                  <p className="text-gray-400 font-mono text-base sm:text-lg">
                    RANK {selectedMek.rarityRank || '???'}
                  </p>
                </div>

                {/* Variations Table */}
                <div className="bg-black/50">
                  <table className="w-4/5 mx-auto">
                    <tbody>
                      {(() => {
                        if (!selectedMek.sourceKey) return null;
                        const variations = getVariationInfoFromFullKey(selectedMek.sourceKey);

                        return (
                          <>
                            <tr className="border-b border-gray-800">
                              <td className="py-3 pr-4 text-gray-500 font-mono uppercase text-xs tracking-wider">
                                HEAD
                              </td>
                              <td className="py-3 text-right font-bold text-sm" style={{ color: variations.head.color }}>
                                {variations.head.name}
                              </td>
                              <td className="py-3 pl-3 text-right font-mono text-lg font-normal w-16" style={{ color: variations.head.color }}>
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
                              <td className="py-3 pl-3 text-right font-mono text-lg font-normal" style={{ color: variations.body.color }}>
                                {variations.body.count > 0 ? `×${variations.body.count}` : ''}
                              </td>
                            </tr>
                            {/* Trait Variation */}
                            <tr>
                              <td className="py-3 pr-4 text-gray-500 font-mono uppercase text-xs tracking-wider">
                                TRAIT
                              </td>
                              <td className="py-3 text-right font-bold text-sm" style={{ color: variations.trait.color }}>
                                {variations.trait.name}
                              </td>
                              <td className="py-3 pl-3 text-right font-mono text-lg font-normal" style={{ color: variations.trait.color }}>
                                {variations.trait.count > 0 ? `×${variations.trait.count}` : ''}
                              </td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
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