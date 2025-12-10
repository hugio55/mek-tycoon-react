'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
// Phase II: Removed useAction - goldMining sync was deleted
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { getMekImageUrl } from '@/lib/mekNumberToVariation';
import { getVariationInfoFromFullKey } from '@/lib/variationNameLookup';
import Link from 'next/link';
import { OverlayRenderer } from '@/components/OverlayRenderer';

// Phase II: Removed goldPerHour, baseGoldPerHour - gold income comes from Job Slots
interface WalletMek {
  assetId: string;
  assetName: string;
  level: number;
  imageUrl: string | null;
  sourceKey?: string;
  mekNumber?: number;
  rarityRank?: number;
}

export default function CorporationPage() {
  const params = useParams();
  const identifier = params?.identifier as string;
  const [selectedMek, setSelectedMek] = useState<WalletMek | null>(null);
  // Phase II: Removed isSyncing, hasSynced - goldMining sync deleted

  // Decode the identifier (in case it has URL encoding)
  const decodedIdentifier = decodeURIComponent(identifier);

  // Get corporation data
  const corpData = useQuery(api.publicCorporation.getCorporationData, {
    identifier: decodedIdentifier,
  });

  // Get level colors
  const levelColors = useQuery(api.levelColors.getLevelColors);

  // Get custom slot overlay data
  const slotOverlayData = useQuery(api.overlays.getOverlay, {
    imageKey: "slot test 1"
  });

  // Phase II: Removed syncWallet action and auto-sync useEffect
  // The goldMining.syncWalletFromBlockchain action was deleted
  // MEK data is now managed through the meks table directly

  // Get top 3 Meks
  const topThreeMeks = corpData?.meks.slice(0, 3) || [];

  // Helper function to get color for a level
  const getLevelColor = (level: number): string => {
    if (!levelColors || levelColors.length === 0) return '#4ade80'; // Default green
    const index = Math.min(Math.max(level - 1, 0), 9); // Clamp to 0-9
    return levelColors[index];
  };

  if (corpData === undefined) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-500 text-2xl font-['Orbitron']">Loading...</div>
      </div>
    );
  }

  if (corpData === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center mek-card-industrial mek-border-sharp-gold p-12">
          <h1 className="text-3xl font-bold text-yellow-500 mb-4 font-['Orbitron']">
            Corporation Not Found
          </h1>
          <p className="text-gray-400 mb-6">
            No corporation found with identifier: {decodedIdentifier}
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30 transition-all font-bold uppercase tracking-wider"
          >
            Return to Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, #000000 0%, #0a0a14 50%, #000000 100%)',
      }}
    >
      {/* Starfield background - more stars, better spread */}
      <div className="absolute inset-0 opacity-40">
        {[...Array(200)].map((_, i) => {
          const size = Math.random();
          return (
            <div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                width: size < 0.7 ? '1px' : size < 0.9 ? '2px' : '3px',
                height: size < 0.7 ? '1px' : size < 0.9 ? '2px' : '3px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                opacity: 0.3 + Math.random() * 0.7,
                animation: `twinkle ${Math.random() * 4 + 4}s infinite ${Math.random() * 4}s`,
              }}
            />
          );
        })}
      </div>

      {/* Back to mek.overexposed.io button */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-6 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-black/60 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-500/50 transition-all font-bold text-base font-mono tracking-wide"
        >
          ← mek.overexposed.io
        </Link>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-8">
        {/* Corporation Header - Simple banner */}
        <div className="mb-6 text-center">
          <h2
            className="text-4xl sm:text-5xl text-yellow-500 mb-2 font-bold font-['Orbitron'] tracking-wide"
            style={{
              textTransform: 'none',
              textShadow: '0 0 20px rgba(250, 182, 23, 0.8), 0 0 40px rgba(250, 182, 23, 0.5), 0 0 60px rgba(250, 182, 23, 0.3)',
            }}
          >
            {corpData.companyName}
          </h2>
          <div className="text-gray-400 font-mono text-lg">
            {corpData.mekCount} Meks • {corpData.goldPerHour.toFixed(1)} Gold/hr
          </div>
          {isSyncing && (
            <div className="mt-3 text-yellow-400 text-sm font-mono animate-pulse">
              🔄 Syncing MEK data from blockchain...
            </div>
          )}
        </div>

        {/* Custom Slot Section */}
        {slotOverlayData && (
          <div className="mb-6 mek-card-industrial mek-border-sharp-gold overflow-hidden">
            <div className="relative">
              {/* Base slot image */}
              <img
                src={slotOverlayData.imagePath}
                alt="Custom Slot"
                className="w-full h-auto"
              />

              {/* Render Mek in the display zone if we have meks */}
              {corpData.meks.length > 0 && slotOverlayData.zones.map((zone: any) => {
                if (zone.type === 'display' && zone.label === 'Mek') {
                  const displayMek = corpData.meks[0]; // Show first Mek
                  const scale = slotOverlayData.imageWidth / 1838; // Scale factor for positioning

                  return (
                    <div
                      key={zone.id}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${(zone.x / slotOverlayData.imageWidth) * 100}%`,
                        top: `${(zone.y / slotOverlayData.imageHeight) * 100}%`,
                        width: `${(zone.width / slotOverlayData.imageWidth) * 100}%`,
                        height: `${(zone.height / slotOverlayData.imageHeight) * 100}%`,
                      }}
                    >
                      {displayMek.imageUrl && (
                        <img
                          src={displayMek.imageUrl}
                          alt={displayMek.assetName}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}

        {/* All Meks Grid */}
        <div className="mek-card-industrial mek-border-sharp-gold">
          <div className="relative bg-gradient-to-r from-black/60 via-gray-900/60 to-black/60 backdrop-blur-md border-b border-yellow-500/30 p-4">
            <div className="mek-overlay-hazard-stripes absolute inset-0 opacity-10"></div>
            <h3 className="mek-text-industrial text-2xl text-yellow-500 relative z-10">
              All Employees
            </h3>
          </div>

          <div className="p-6">
            {corpData.meks.length === 0 ? (
              <p className="text-center text-gray-400 py-12">No Meks found</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {corpData.meks.map((mek) => (
                  <button
                    key={mek.assetId}
                    onClick={() => setSelectedMek(mek)}
                    className="mek-card-industrial mek-border-sharp-gold hover:mek-glow-yellow transition-all duration-300 group cursor-pointer text-left"
                  >
                    {/* Grunge Texture */}
                    <div className="mek-overlay-scratches"></div>

                    {/* Mek Image */}
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

                    {/* Info Section */}
                    <div className="relative overflow-hidden">
                      <div className="mek-overlay-diagonal-stripes absolute inset-0 opacity-40"></div>
                      <div className="p-3 relative z-10">
                        <div className="flex items-center justify-between mb-2">
                          <p className="mek-label-uppercase text-gray-400 truncate flex-1 mr-2">
                            {mek.assetName}
                          </p>
                          <span
                            className="text-xl font-bold font-mono whitespace-nowrap"
                            style={{ color: getLevelColor(mek.level) }}
                          >
                            LV.{mek.level}
                          </span>
                        </div>
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
      </div>

      {/* Single Mek Detail Modal */}
      {selectedMek && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
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
              onClick={() => setSelectedMek(null)}
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
        </div>
      )}

      {/* Twinkle animation for stars */}
      <style jsx global>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
