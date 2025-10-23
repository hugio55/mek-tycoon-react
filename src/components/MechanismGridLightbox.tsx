'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MekCard } from './MekCard';
import { MekAsset, AnimatedMekValues } from './MekCard/types';
import { getVariationInfoFromFullKey } from '@/lib/variationNameLookup';
import { getMekDataByNumber } from '@/lib/mekNumberToVariation';

export interface MechanismGridLightboxProps {
  ownedMeks: MekAsset[];
  currentGold: number;
  walletAddress?: string | null;
  getMekImageUrl: (mekNumber: number, size?: '150px' | '500px' | '1000px') => string;
  animatedMekValues: Record<string, AnimatedMekValues>;
  upgradingMeks: Set<string>;
  onClose: () => void;
  onMekClick?: (mek: MekAsset) => void;
  onUpgrade?: (mek: MekAsset, upgradeCost: number, newLevel: number, newBonusRate: number, newTotalRate: number) => void;
  onGoldSpentAnimation?: (animationId: string, amount: number) => void;
}

type ViewMode = 'condensed' | 'expanded';
type SortType = 'rate' | 'level';

export default function MechanismGridLightbox({
  ownedMeks,
  currentGold,
  walletAddress,
  getMekImageUrl,
  animatedMekValues,
  upgradingMeks,
  onClose,
  onMekClick,
  onUpgrade,
  onGoldSpentAnimation
}: MechanismGridLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('condensed');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortType] = useState<SortType>('rate');

  // Mount portal and lock body scroll
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Filter and sort meks
  const filteredAndSortedMeks = useMemo(() => {
    console.log('[MechanismGridLightbox] ownedMeks:', ownedMeks);
    console.log('[MechanismGridLightbox] Sample mek:', ownedMeks[0]);
    console.log('[MechanismGridLightbox] All mekNumbers:', ownedMeks.map(m => ({ assetId: m.assetId, mekNumber: m.mekNumber, assetName: m.assetName })));
    console.log('[MechanismGridLightbox] Unique mekNumbers:', new Set(ownedMeks.map(m => m.mekNumber)).size, 'out of', ownedMeks.length, 'total');

    const filtered = [...ownedMeks]
      .filter(mek => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase().trim();

        // Parse mek number from assetName if mekNumber field is missing
        let mekNum = mek.mekNumber;
        if (!mekNum && mek.assetName) {
          const match = mek.assetName.match(/#?(\d+)/);
          if (match) {
            mekNum = parseInt(match[1], 10);
          }
        }

        console.log('[Search Debug] Searching for:', term, 'in mek:', {
          mekNumber: mekNum,
          assetName: mek.assetName,
          sourceKey: mek.sourceKey,
          headGroup: mek.headGroup,
          bodyGroup: mek.bodyGroup,
          itemGroup: mek.itemGroup
        });

        // Check Mek number (with or without padding)
        if (mekNum) {
          const mekNumStr = mekNum.toString();
          const mekNumPadded = mekNumStr.padStart(4, '0');
          if (mekNumStr.includes(term) || mekNumPadded.includes(term)) {
            console.log('[Search] MATCH on mekNumber:', mekNum);
            return true;
          }
        }

        // Check asset name
        if (mek.assetName && mek.assetName.toLowerCase().includes(term)) {
          console.log('[Search] MATCH on assetName:', mek.assetName);
          return true;
        }

        // Check variation names - try sourceKey first, then look up by mekNumber
        let sourceKeyToUse = mek.sourceKey;

        // If no sourceKey but we have mekNumber, look it up
        if (!sourceKeyToUse && mekNum) {
          const mekData = getMekDataByNumber(mekNum);
          if (mekData && mekData.sourceKey) {
            sourceKeyToUse = mekData.sourceKey;
            console.log('[Search] Looked up sourceKey from mekNumber:', mekNum, '→', sourceKeyToUse);
          }
        }

        if (sourceKeyToUse) {
          try {
            const variations = getVariationInfoFromFullKey(sourceKeyToUse);
            if (variations.head && variations.head.name && variations.head.name.toLowerCase().includes(term)) {
              console.log('[Search] MATCH on head variation:', variations.head.name);
              return true;
            }
            if (variations.body && variations.body.name && variations.body.name.toLowerCase().includes(term)) {
              console.log('[Search] MATCH on body variation:', variations.body.name);
              return true;
            }
            if (variations.trait && variations.trait.name && variations.trait.name.toLowerCase().includes(term)) {
              console.log('[Search] MATCH on trait variation:', variations.trait.name);
              return true;
            }
          } catch (error) {
            console.warn('[Search] Failed to parse sourceKey:', sourceKeyToUse, error);
          }
        }

        // Check head, body, item groups directly
        if (mek.headGroup && mek.headGroup.toLowerCase().includes(term)) {
          console.log('[Search] MATCH on headGroup:', mek.headGroup);
          return true;
        }
        if (mek.bodyGroup && mek.bodyGroup.toLowerCase().includes(term)) {
          console.log('[Search] MATCH on bodyGroup:', mek.bodyGroup);
          return true;
        }
        if (mek.itemGroup && mek.itemGroup.toLowerCase().includes(term)) {
          console.log('[Search] MATCH on itemGroup:', mek.itemGroup);
          return true;
        }

        console.log('[Search] NO MATCH for term:', term);
        return false;
      });

    console.log('[Search] Filtered results:', filtered.length, 'out of', ownedMeks.length);

    return filtered.sort((a, b) => {
        if (sortType === 'rate') {
          return b.goldPerHour - a.goldPerHour;  // Highest rate first
        } else {
          // Sort by current upgrade level (highest level first)
          const aLevel = a.currentLevel || 1;
          const bLevel = b.currentLevel || 1;

          if (bLevel !== aLevel) {
            return bLevel - aLevel;  // Highest level first
          }

          // Secondary sort: when levels are equal, sort by gold/hr (highest first)
          return b.goldPerHour - a.goldPerHour;
        }
      });
  }, [ownedMeks, searchTerm, sortType]);

  if (!mounted) return null;

  // Adapter function to match MekCard's expected signature
  const getMekImageUrlAdapter = (mekNumber: number, size: string): string => {
    return getMekImageUrl(mekNumber, size as '150px' | '500px' | '1000px');
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-auto p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal container */}
      <div
        className="relative w-[95vw] max-w-[1600px] h-[95vh] bg-black/95 border-4 border-yellow-500/50 rounded-lg overflow-hidden shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with grunge overlay */}
        <div className="relative bg-gradient-to-r from-black via-yellow-900/20 to-black border-b-2 border-yellow-500/50 p-6">
          {/* Hazard stripes background */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, #FAB617 35px, #FAB617 70px)`
            }}
          />

          {/* Metal scratches overlay */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(90deg, transparent 0%, rgba(250,182,23,0.1) 50%, transparent 100%)`
            }}
          />

          <div className="relative flex items-center justify-between">
            <h2 className="text-3xl font-black uppercase tracking-wider text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>
              MECHANISM UNIT GRID
            </h2>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold uppercase tracking-wider hover:from-yellow-500 hover:to-yellow-400 transition-all duration-300 border-2 border-yellow-400/50"
              style={{
                clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)'
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="relative bg-gradient-to-r from-black/90 via-gray-900/50 to-black/90 border-b border-yellow-500/30 p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Mek # or variation (e.g., bumblebee)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-black/60 border-2 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500/60 focus:outline-none transition-colors"
                  style={{
                    clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)'
                  }}
                />
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-black/60 border-2 border-yellow-500/30 p-1">
              <button
                onClick={() => setViewMode('condensed')}
                className={`px-4 py-2 font-bold uppercase tracking-wider transition-all duration-300 ${
                  viewMode === 'condensed'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-transparent text-gray-400 hover:text-white'
                }`}
              >
                Condensed
              </button>
              <button
                onClick={() => setViewMode('expanded')}
                className={`px-4 py-2 font-bold uppercase tracking-wider transition-all duration-300 ${
                  viewMode === 'expanded'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-transparent text-gray-400 hover:text-white'
                }`}
              >
                Expanded
              </button>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 bg-black/60 border-2 border-yellow-500/30 p-1">
              <button
                onClick={() => setSortType('rate')}
                className={`px-4 py-2 font-bold uppercase tracking-wider transition-all duration-300 ${
                  sortType === 'rate'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-transparent text-gray-400 hover:text-white'
                }`}
              >
                By Rate
              </button>
              <button
                onClick={() => setSortType('level')}
                className={`px-4 py-2 font-bold uppercase tracking-wider transition-all duration-300 ${
                  sortType === 'level'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-transparent text-gray-400 hover:text-white'
                }`}
              >
                By Level
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-gray-400">
            Showing {filteredAndSortedMeks.length} of {ownedMeks.length} mechanisms
          </div>
        </div>

        {/* Grid Content */}
        <div className="relative h-[calc(95vh-280px)] overflow-y-auto p-6">
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: `
                repeating-linear-gradient(0deg, transparent, transparent 9px, #FAB617 9px, #FAB617 10px),
                repeating-linear-gradient(90deg, transparent, transparent 9px, #FAB617 9px, #FAB617 10px)
              `
            }}
          />

          {viewMode === 'condensed' ? (
            // Condensed view - thumbnails only
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 relative z-10">
              {filteredAndSortedMeks.map((mek, index) => {
                const level = animatedMekValues[mek.assetId]?.level || mek.currentLevel || 1;

                // Generate image path - prefer sourceKey over mekNumber for accuracy
                let imagePath: string;
                if (mek.mekNumber) {
                  imagePath = getMekImageUrl(mek.mekNumber, '150px');
                } else if (mek.sourceKey) {
                  // Construct image path directly from sourceKey
                  const cleanKey = mek.sourceKey.replace(/-[A-Z]$/, '').toLowerCase();
                  imagePath = `/mek-images/150px/${cleanKey}.webp`;
                } else if (mek.imageUrl) {
                  // Fallback to imageUrl if available
                  imagePath = mek.imageUrl;
                } else {
                  // Last resort: placeholder
                  imagePath = '/mek-images/150px/000-000-000.webp';
                }

                // Log first few meks to debug image path generation
                if (index < 3) {
                  console.log(`[MechanismGridLightbox] Condensed Mek ${index}:`, {
                    assetId: mek.assetId,
                    mekNumber: mek.mekNumber,
                    sourceKey: mek.sourceKey,
                    imageUrl: mek.imageUrl,
                    imagePath
                  });
                }

                return (
                  <div
                    key={mek.assetId}
                    className="group relative cursor-pointer aspect-square bg-black/60 border-2 border-yellow-500/30 hover:border-yellow-500/60 transition-all duration-300 overflow-hidden"
                    onClick={() => onMekClick?.(mek)}
                  >
                    {/* Mek image */}
                    <img
                      src={imagePath}
                      alt={`Mek #${mek.mekNumber}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />

                    {/* Overlay info */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-2">
                      <div className="text-xs font-bold text-yellow-400 uppercase">
                        {mek.mekNumber ? `Mek #${mek.mekNumber.toString().padStart(4, '0')}` : mek.assetName || 'Mek'}
                      </div>
                      <div className="text-xs text-gray-400">Lvl {level}</div>
                    </div>

                    {/* Hover glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-yellow-500/10 pointer-events-none transition-opacity duration-300" />
                  </div>
                );
              })}
            </div>
          ) : (
            // Expanded view - full cards
            <div className={`grid gap-6 relative z-10 ${
              filteredAndSortedMeks.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
              filteredAndSortedMeks.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto' :
              filteredAndSortedMeks.length === 3 ? 'grid-cols-1 sm:grid-cols-3 max-w-5xl mx-auto' :
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto'
            }`}>
              {filteredAndSortedMeks.map(mek => (
                <MekCard
                  key={mek.assetId}
                  mek={mek}
                  getMekImageUrl={getMekImageUrlAdapter}
                  currentGold={currentGold}
                  walletAddress={walletAddress}
                  animatedValues={animatedMekValues[mek.assetId]}
                  upgradingMeks={upgradingMeks}
                  onClick={() => onMekClick?.(mek)}
                  onUpgrade={onUpgrade}
                  onGoldSpentAnimation={onGoldSpentAnimation}
                />
              ))}
            </div>
          )}

          {/* No results */}
          {filteredAndSortedMeks.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="text-2xl font-bold mb-2">No mechanisms found</div>
              <div className="text-sm">Try adjusting your search terms</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
