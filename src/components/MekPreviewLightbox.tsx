'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getMediaUrl } from '@/lib/media-url';
import { getVariationInfoFromFullKey } from '@/lib/variationNameLookup';

interface MekPreviewData {
  assetId: string;
  assetName?: string;
  sourceKey?: string;
  sourceKeyBase?: string;
  headVariation?: string;
  bodyVariation?: string;
  itemVariation?: string;
  customName?: string;
  rarityRank?: number;
  gameRank?: number;
}

interface MekPreviewLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  mek: MekPreviewData;
  onViewFullProfile: () => void;
}

interface VariationDisplay {
  name: string;
  count: number;
  type: 'HEAD' | 'BODY' | 'TRAIT';
}

export default function MekPreviewLightbox({
  isOpen,
  onClose,
  mek,
  onViewFullProfile,
}: MekPreviewLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [variations, setVariations] = useState<VariationDisplay[]>([]);

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Parse variation info from sourceKey
  useEffect(() => {
    if (!mek) return;

    const sourceKey = mek.sourceKeyBase || mek.sourceKey;
    if (sourceKey) {
      try {
        const variationInfo = getVariationInfoFromFullKey(sourceKey);
        const parsed: VariationDisplay[] = [];

        if (variationInfo.head) {
          parsed.push({
            name: variationInfo.head.name,
            count: variationInfo.head.count,
            type: 'HEAD',
          });
        }

        if (variationInfo.body) {
          parsed.push({
            name: variationInfo.body.name,
            count: variationInfo.body.count,
            type: 'BODY',
          });
        }

        if (variationInfo.trait) {
          parsed.push({
            name: variationInfo.trait.name,
            count: variationInfo.trait.count,
            type: 'TRAIT',
          });
        }

        setVariations(parsed);
      } catch (error) {
        console.error('[MekPreviewLightbox] Failed to parse variations:', error);
        // Fallback to stored variation names if parsing fails
        const fallback: VariationDisplay[] = [];
        if (mek.headVariation) {
          fallback.push({ name: mek.headVariation, count: 0, type: 'HEAD' });
        }
        if (mek.bodyVariation) {
          fallback.push({ name: mek.bodyVariation, count: 0, type: 'BODY' });
        }
        if (mek.itemVariation) {
          fallback.push({ name: mek.itemVariation, count: 0, type: 'TRAIT' });
        }
        setVariations(fallback);
      }
    }
  }, [mek]);

  // Get Mek image URL
  const getMekImageUrl = () => {
    const sourceKey = mek.sourceKeyBase || mek.sourceKey;
    if (sourceKey) {
      const cleanKey = sourceKey.replace(/-[A-Z]$/, '').toLowerCase();
      return getMediaUrl(`/mek-images/500px/${cleanKey}.webp`);
    }
    return getMediaUrl('/mek-images/500px/placeholder.webp');
  };

  // Get Mek number from assetName (zero-padded to 4 digits like metadata)
  const getMekNumber = () => {
    if (mek.assetName) {
      const match = mek.assetName.match(/\d+/);
      if (match) return match[0].padStart(4, '0');
    }
    // If assetId is numeric, pad it too
    const numericId = String(mek.assetId).match(/\d+/);
    return numericId ? numericId[0].padStart(4, '0') : mek.assetId;
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop with blur - Space Age style */}
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
        className="relative w-full max-w-md overflow-hidden rounded-3xl"
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
          className="absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <span className="text-white/70 text-xl font-light hover:text-white transition-colors">×</span>
        </button>

        {/* Mek Image */}
        <div className="p-6 pb-4">
          <div
            className="relative mx-auto rounded-2xl overflow-hidden"
            style={{
              width: '280px',
              height: '280px',
              background: 'rgba(0,0,0,0.3)',
              border: '2px solid rgba(255,255,255,0.1)',
              boxShadow: '0 0 40px rgba(0,0,0,0.5)'
            }}
          >
            <img
              src={getMekImageUrl()}
              alt={`Mek #${getMekNumber()}`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Mek Info */}
        <div className="px-6 pb-4 text-center">
          {/* Mek Number & Rank Row */}
          <div className="flex justify-center items-center gap-4 mb-4">
            <div>
              <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Mek</div>
              <div className="text-white font-bold text-xl" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                #{getMekNumber()}
              </div>
            </div>
            <div
              className="w-px h-10"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            />
            <div>
              <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Rank</div>
              <div className="text-yellow-400 font-bold text-xl" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {mek.gameRank || mek.rarityRank || '???'}
              </div>
            </div>
          </div>

          {/* Custom Name if exists */}
          {mek.customName && (
            <div
              className="inline-block px-4 py-1.5 rounded-full mb-4"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <span className="text-white/50 text-xs mr-2">ID</span>
              <span className="text-white font-medium">{mek.customName}</span>
            </div>
          )}
        </div>

        {/* Variations */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-3 gap-3">
            {variations.map((variation, index) => (
              <div
                key={index}
                className="text-center p-3 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div className="text-white font-medium text-sm mb-1">
                  {variation.name}
                </div>
                <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">
                  {variation.type}
                </div>
                {variation.count > 0 && (
                  <div className="text-cyan-400/70 text-xs">
                    {variation.count} exist
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Verified Badge */}
        <div className="px-6 pb-4 text-center">
          <div className="inline-flex items-center gap-2 text-yellow-400 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <span>Verified Mekanism</span>
          </div>
        </div>

        {/* View Full Profile Button */}
        <div className="px-6 pb-6">
          <button
            onClick={onViewFullProfile}
            className="w-full py-3 rounded-xl font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(34, 211, 238, 0.1) 100%)',
              border: '1px solid rgba(34, 211, 238, 0.4)',
              color: 'rgb(34, 211, 238)',
              fontFamily: 'Orbitron, sans-serif',
              boxShadow: '0 0 20px rgba(34, 211, 238, 0.2)'
            }}
          >
            View Full Profile
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
