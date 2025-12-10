'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MekAsset } from '@/components/MekCard/types';
import { getMediaUrl } from '@/lib/media-url';
import { getVariationInfoFromFullKey } from '@/lib/variationNameLookup';
import { getMekDataByNumber } from '@/lib/mekNumberToVariation';

interface MekDetailsSpaceAgeProps {
  isOpen: boolean;
  onClose: () => void;
  mek: MekAsset;
  corporationName?: string;
}

interface VariationInfo {
  name: string;
  count?: number;
  percentage?: number;
  essencePerDay?: number;
  imageUrl?: string;
}

export default function MekDetailsSpaceAge({
  isOpen,
  onClose,
  mek,
  corporationName = 'Unknown Corp'
}: MekDetailsSpaceAgeProps) {
  const [mounted, setMounted] = useState(false);
  const [headVariation, setHeadVariation] = useState<VariationInfo | null>(null);
  const [bodyVariation, setBodyVariation] = useState<VariationInfo | null>(null);
  const [traitVariation, setTraitVariation] = useState<VariationInfo | null>(null);

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Parse variation info from sourceKey
  useEffect(() => {
    if (!mek) return;

    let sourceKey = mek.sourceKey;

    // If no sourceKey, try to look it up by mekNumber
    if (!sourceKey && mek.mekNumber) {
      const mekData = getMekDataByNumber(mek.mekNumber);
      sourceKey = mekData?.sourceKey;
    }

    if (sourceKey) {
      try {
        const variations = getVariationInfoFromFullKey(sourceKey);

        if (variations.head) {
          setHeadVariation({
            name: variations.head.name || 'Unknown',
            count: variations.head.count || 0,
            percentage: variations.head.percentage || 0,
            essencePerDay: 0.1, // Placeholder
          });
        }

        if (variations.body) {
          setBodyVariation({
            name: variations.body.name || 'Unknown',
            count: variations.body.count || 0,
            percentage: variations.body.percentage || 0,
            essencePerDay: 0.1,
          });
        }

        if (variations.trait) {
          setTraitVariation({
            name: variations.trait.name || 'Unknown',
            count: variations.trait.count || 0,
            percentage: variations.trait.percentage || 0,
            essencePerDay: 0.1,
          });
        }
      } catch (error) {
        console.error('[MekDetailsSpaceAge] Failed to parse variations:', error);
      }
    }
  }, [mek]);

  if (!isOpen || !mounted) return null;

  // Get Mek image URL
  const getMekImageUrl = () => {
    if (mek.mekNumber) {
      const mekData = getMekDataByNumber(mek.mekNumber);
      if (mekData?.sourceKey) {
        const cleanKey = mekData.sourceKey.replace(/-[A-Z]$/, '').toLowerCase();
        return getMediaUrl(`/mek-images/500px/${cleanKey}.webp`);
      }
    }
    if (mek.sourceKey) {
      const cleanKey = mek.sourceKey.replace(/-[A-Z]$/, '').toLowerCase();
      return getMediaUrl(`/mek-images/500px/${cleanKey}.webp`);
    }
    if (mek.imageUrl) {
      return mek.imageUrl;
    }
    return getMediaUrl('/mek-images/500px/placeholder.webp');
  };

  // Format numbers
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const mekLevel = mek.currentLevel || mek.mekLevel || 1;
  const mekNumber = mek.mekNumber?.toString().padStart(4, '0') || '????';
  const incomeRate = 21; // Placeholder - will come from job slots
  const cumulativeGold = mek.accumulatedGoldForCorp || 0;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0"
        style={{
          backgroundColor: 'rgba(0, 10, 20, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      />

      {/* Modal Container - Liquid Glass Effect */}
      <div
        className="relative w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-3xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.2) 100%)',
          backdropFilter: 'blur(40px) saturate(150%)',
          WebkitBackdropFilter: 'blur(40px) saturate(150%)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-50 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <span className="text-white/70 text-2xl font-light hover:text-white transition-colors">×</span>
        </button>

        {/* Header */}
        <div className="w-full py-6 px-8 text-center">
          <h1 className="text-4xl font-bold tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            <span className="text-cyan-400" style={{ textShadow: '0 0 30px rgba(34, 211, 238, 0.5)' }}>MEK</span>{" "}
            <span className="text-white/80">PROFILE</span>
          </h1>
          <p className="text-white/50 text-sm mt-2" style={{ fontFamily: 'Play, sans-serif' }}>
            Detailed information about your Mekanism unit including stats, variations, and abilities.
          </p>
        </div>

        {/* Main Content - Three Column Layout */}
        <div className="px-8 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column - Stats */}
            <div className="flex flex-col gap-4">
              {/* Rank Card */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(250,182,23,0.15) 0%, rgba(250,182,23,0.05) 100%)',
                  border: '1px solid rgba(250,182,23,0.3)',
                }}
              >
                <div className="text-6xl font-bold text-yellow-400 text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {mek.rarityRank || '???'}
                </div>
                <div className="text-yellow-500/80 text-sm uppercase tracking-wider text-center mt-1">
                  Rank
                </div>
              </div>

              {/* Mek ID Card */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/50 text-xs uppercase">Mek</span>
                  <span className="text-white/50 text-xs uppercase">Corporation</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold">#{mekNumber}</span>
                  <span className="text-white">{corporationName}</span>
                </div>

                {mek.customName && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div
                      className="inline-block px-3 py-1 rounded-lg text-sm"
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      <span className="text-white/50 text-xs mr-2">ID</span>
                      <span className="text-white font-medium">{mek.customName}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Income Card */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(250,182,23,0.1) 0%, rgba(250,182,23,0.02) 100%)',
                  border: '1px solid rgba(250,182,23,0.2)',
                }}
              >
                <div className="text-yellow-500/80 text-xs uppercase tracking-wider mb-3">Income</div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">Income Rate</span>
                    <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      {incomeRate}<span className="text-white/50 text-sm ml-1">g/hr</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">Cumulative</span>
                    <span className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      {formatNumber(cumulativeGold)}<span className="text-yellow-500/50 text-sm ml-1">g</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Column - Mek Image */}
            <div className="flex flex-col items-center justify-center">
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '2px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 0 40px rgba(0,0,0,0.5)'
                }}
              >
                <img
                  src={getMekImageUrl()}
                  alt={`Mek #${mekNumber}`}
                  className="w-64 h-64 lg:w-80 lg:h-80 object-cover"
                />

                {/* Level Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2">
                    {/* Level progress segments */}
                    <div className="flex-1 flex gap-1">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 h-3 rounded-sm"
                          style={{
                            background: i < mekLevel ? 'linear-gradient(to top, #fab617, #fcd34d)' : 'rgba(255,255,255,0.1)',
                            boxShadow: i < mekLevel ? '0 0 10px rgba(250,182,23,0.5)' : 'none'
                          }}
                        />
                      ))}
                    </div>
                    <div
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{
                        background: 'rgba(0,0,0,0.6)',
                        border: '1px solid rgba(255,255,255,0.2)'
                      }}
                    >
                      <span className="text-white/60">LVL</span>{' '}
                      <span className="text-white">{mekLevel}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deep Scan Button */}
              <button
                className="mt-6 px-8 py-3 rounded-xl font-bold uppercase tracking-wider transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(34, 211, 238, 0.1) 100%)',
                  border: '1px solid rgba(34, 211, 238, 0.4)',
                  color: 'rgb(34, 211, 238)',
                  fontFamily: 'Orbitron, sans-serif',
                  boxShadow: '0 0 20px rgba(34, 211, 238, 0.2)'
                }}
              >
                Deep Scan
              </button>
            </div>

            {/* Right Column - Abilities Tree Placeholder */}
            <div className="flex items-center justify-center">
              <div
                className="w-full h-64 lg:h-80 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">🌳</div>
                  <div className="text-white/40 text-sm">Abilities Tree</div>
                  <div className="text-white/20 text-xs mt-1">Coming Soon</div>
                </div>
              </div>
            </div>
          </div>

          {/* Variation Cards */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Head Variation */}
            <VariationCard
              type="HEAD VARIATION"
              variation={headVariation}
              mek={mek}
              variationType="head"
            />

            {/* Body Variation */}
            <VariationCard
              type="BODY VARIATION"
              variation={bodyVariation}
              mek={mek}
              variationType="body"
            />

            {/* Trait Variation */}
            <VariationCard
              type="TRAIT VARIATION"
              variation={traitVariation}
              mek={mek}
              variationType="trait"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// Variation Card Component
function VariationCard({
  type,
  variation,
  mek,
  variationType
}: {
  type: string;
  variation: VariationInfo | null;
  mek: MekAsset;
  variationType: 'head' | 'body' | 'trait';
}) {
  // Get variation-specific image if available
  const getVariationImageUrl = () => {
    // For now, use placeholder. In future, can use essence bottle images
    return getMediaUrl(`/essence-bottles/${variationType}-placeholder.webp`);
  };

  return (
    <div
      className="rounded-xl p-4 text-center"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Variation Image Placeholder */}
      <div className="w-24 h-24 mx-auto mb-3 rounded-lg overflow-hidden bg-black/30 flex items-center justify-center">
        <div className="text-4xl">
          {variationType === 'head' ? '🤖' : variationType === 'body' ? '⚙️' : '✨'}
        </div>
      </div>

      {/* Variation Name */}
      <div className="text-white font-bold text-lg mb-1">
        {variation?.name || 'Unknown'}
      </div>

      {/* Type Label */}
      <div className="text-white/40 text-xs uppercase tracking-wider mb-3">
        {type}
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-4 text-xs mb-3">
        <div>
          <span className="text-white/40">Total Copies</span>
          <div className="text-white font-bold">{variation?.count || '?'}</div>
        </div>
        <div>
          <span className="text-white/40">Percentage</span>
          <div className="text-white font-bold">{variation?.percentage?.toFixed(3) || '?'}%</div>
        </div>
      </div>

      {/* Essence Per Day */}
      <div className="text-cyan-400 text-3xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        {variation?.essencePerDay?.toFixed(1) || '0.1'}
      </div>
      <div className="text-white/40 text-xs uppercase tracking-wider">
        Essence Per Day
      </div>
    </div>
  );
}
