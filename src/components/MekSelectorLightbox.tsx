'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getMediaUrl } from '@/lib/media-url';
import { getVariationInfoFromFullKey } from '@/lib/variationNameLookup';

// Mek data structure for selection
export interface SelectedMek {
  assetId: string;
  assetName: string;
  sourceKey: string;
  sourceKeyBase?: string;
  headVariation: string;
  bodyVariation: string;
  itemVariation?: string;
  customName?: string;
  rarityRank?: number;
  gameRank?: number;
}

interface MekSelectorLightboxProps {
  walletAddress: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mek: SelectedMek) => void;
  /** When true, shows ALL Meks instead of just owned Meks (for admin use) */
  showAllMeks?: boolean;
}

export default function MekSelectorLightbox({
  walletAddress,
  isOpen,
  onClose,
  onSelect,
  showAllMeks = false,
}: MekSelectorLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Query user's owned Meks OR all Meks (admin mode)
  const ownedMeks = useQuery(
    showAllMeks ? api.meks.getAllMeksForAdmin : api.meks.getMeksByOwner,
    showAllMeks
      ? {}
      : (walletAddress ? { stakeAddress: walletAddress } : 'skip')
  );

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

  // Reset search when opening
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      // Debug: Log first mek's fields to see what's available for search
      if (ownedMeks && ownedMeks.length > 0) {
        console.log('[🔍MEKSELECTOR] Sample Mek fields for search:', {
          assetId: ownedMeks[0].assetId,
          assetName: ownedMeks[0].assetName,
          customName: ownedMeks[0].customName,
          headVariation: ownedMeks[0].headVariation,
          bodyVariation: ownedMeks[0].bodyVariation,
          itemVariation: ownedMeks[0].itemVariation,
          traitVariation: ownedMeks[0].traitVariation,
          head: ownedMeks[0].head,
          body: ownedMeks[0].body,
          trait: ownedMeks[0].trait,
          sourceKey: ownedMeks[0].sourceKey,
        });
      }
    }
  }, [isOpen, ownedMeks]);

  // Filter Meks based on search query
  const filteredMeks = useMemo(() => {
    if (!ownedMeks) return [];
    if (!searchQuery.trim()) return ownedMeks;

    const query = searchQuery.toLowerCase().trim();

    return ownedMeks.filter((mek: any) => {
      // Search by asset ID / Mek number
      if (mek.assetId?.toLowerCase().includes(query)) return true;
      if (mek.assetName?.toLowerCase().includes(query)) return true;

      // Search by custom name
      if (mek.customName?.toLowerCase().includes(query)) return true;

      // Search by variation fields directly (may contain codes or names)
      if (mek.headVariation?.toLowerCase().includes(query)) return true;
      if (mek.bodyVariation?.toLowerCase().includes(query)) return true;
      if (mek.itemVariation?.toLowerCase().includes(query)) return true;
      if (mek.traitVariation?.toLowerCase().includes(query)) return true;

      // Search by derived variation NAMES from sourceKey (e.g., "Seafoam", "Bumblebee")
      // This is the main way to find Meks by variation name since names are derived from sourceKey
      const sourceKey = mek.sourceKeyBase || mek.sourceKey;
      if (sourceKey) {
        try {
          const variationInfo = getVariationInfoFromFullKey(sourceKey);
          if (variationInfo.head?.name?.toLowerCase().includes(query)) return true;
          if (variationInfo.body?.name?.toLowerCase().includes(query)) return true;
          if (variationInfo.trait?.name?.toLowerCase().includes(query)) return true;
        } catch (e) {
          // Ignore lookup errors
        }
      }

      return false;
    });
  }, [ownedMeks, searchQuery]);

  // Get Mek image URL from sourceKey
  const getMekImageUrl = (mek: any) => {
    const sourceKey = mek.sourceKeyBase || mek.sourceKey;
    if (sourceKey) {
      const cleanKey = sourceKey.replace(/-[A-Z]$/, '').toLowerCase();
      return getMediaUrl(`/mek-images/150px/${cleanKey}.webp`);
    }
    return getMediaUrl('/mek-images/150px/placeholder.webp');
  };

  // Handle Mek selection
  const handleSelect = (mek: any) => {
    onSelect({
      assetId: mek.assetId,
      assetName: mek.assetName,
      sourceKey: mek.sourceKey,
      sourceKeyBase: mek.sourceKeyBase,
      headVariation: mek.headVariation,
      bodyVariation: mek.bodyVariation,
      itemVariation: mek.itemVariation,
      customName: mek.customName,
      rarityRank: mek.rarityRank,
      gameRank: mek.gameRank,
    });
    onClose();
  };

  // Get Mek number from assetName (zero-padded to 4 digits like metadata)
  const getMekNumber = (mek: any) => {
    const match = mek.assetName?.match(/\d+/);
    if (match) {
      return match[0].padStart(4, '0');
    }
    // If assetId is a number, pad it too
    const numericId = String(mek.assetId).match(/\d+/);
    return numericId ? numericId[0].padStart(4, '0') : mek.assetId;
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-auto p-4"
      onClick={onClose}
    >
      {/* Backdrop - Space Age Style (from admin) */}
      <div
        className="fixed inset-0 bg-black/60"
        style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      />

      {/* Modal Container - Space Age Style (fixed height relative to viewport) */}
      <div
        className="relative w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden rounded-2xl border border-white/10"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1) inset',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Clean X (admin style) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white/80 transition-colors z-10"
          style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header - fixed, doesn't shrink */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-5">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-light text-white tracking-wide mb-1">
              Welcome to LegitaMek!
            </h2>
            <p className="text-sm text-white/60 mb-3 max-w-md mx-auto">
              Flex your Meks with confidence! Recipients get verified proof that you actually own what you're sharing.
            </p>
            <p className="text-xs text-white/40">
              {showAllMeks
                ? `${ownedMeks?.length || 0} total Meks (Admin Mode)`
                : `${ownedMeks?.length || 0} Meks in your collection`
              }
            </p>
          </div>
        </div>

        {/* Search Bar - Space Age Style (fixed, doesn't shrink) */}
        <div className="flex-shrink-0 px-6 sm:px-8 pb-4">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by number, name, or variation..."
              className="w-full pl-12 pr-12 py-3 sm:py-4 text-base bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:bg-white/10 transition-all border-white/10 focus:border-cyan-500/50"
              style={{ minHeight: '48px' }}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-white/40">
              Found {filteredMeks.length} Mek{filteredMeks.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </p>
          )}
        </div>

        {/* Meks Grid - fills remaining space and scrolls */}
        <div className="flex-1 px-6 sm:px-8 pb-6 overflow-y-auto min-h-0">
          {!ownedMeks ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-yellow-500/50 animate-spin" />
              <p className="text-white/40 mt-4 text-sm">Loading your Mekanisms...</p>
            </div>
          ) : filteredMeks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </div>
              <p className="text-white/50 text-sm">
                {searchQuery ? 'No Meks match your search' : "You don't own any Meks yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 pt-2">
              {filteredMeks.map((mek: any) => (
                <button
                  key={mek._id}
                  onClick={() => handleSelect(mek)}
                  className="group relative rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] bg-black/30 border border-white/10 hover:border-cyan-500/40"
                >
                  {/* Mek Image */}
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={getMekImageUrl(mek)}
                      alt={mek.customName || `Mek #${getMekNumber(mek)}`}
                      className="w-full h-full object-cover group-hover:scale-[1.03] group-hover:blur-[3px] transition-all duration-300"
                      loading="lazy"
                    />
                  </div>

                  {/* Mek Info */}
                  <div className="p-2 bg-black/60">
                    <p className="text-xs font-medium text-white truncate">
                      {mek.customName || `Mek #${getMekNumber(mek)}`}
                    </p>
                    {(mek.rarityRank || mek.gameRank) && (
                      <p className="text-[10px] text-white/50">
                        Rank {mek.gameRank || mek.rarityRank}
                      </p>
                    )}
                  </div>

                  {/* Hover Overlay - subtle cyan tint */}
                  <div className="absolute inset-0 flex items-center justify-center bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="px-3 py-1.5 bg-cyan-500/90 text-white text-xs font-semibold rounded-full">
                      Select
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
