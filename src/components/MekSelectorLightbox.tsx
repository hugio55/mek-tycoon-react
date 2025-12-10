'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getMediaUrl } from '@/lib/media-url';

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
}

export default function MekSelectorLightbox({
  walletAddress,
  isOpen,
  onClose,
  onSelect,
}: MekSelectorLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Query user's owned Meks
  const ownedMeks = useQuery(
    api.meks.getMeksByOwner,
    walletAddress ? { stakeAddress: walletAddress } : 'skip'
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
    }
  }, [isOpen]);

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

      // Search by variations
      if (mek.headVariation?.toLowerCase().includes(query)) return true;
      if (mek.bodyVariation?.toLowerCase().includes(query)) return true;
      if (mek.itemVariation?.toLowerCase().includes(query)) return true;

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

  // Get display name for Mek
  const getMekDisplayName = (mek: any) => {
    if (mek.customName) return mek.customName;
    // Extract number from assetName (e.g., "Mekanism0123" -> "0123")
    const match = mek.assetName?.match(/\d+/);
    return match ? `#${match[0]}` : `#${mek.assetId}`;
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80"
        style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
      />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-4xl max-h-[80vh] bg-gray-900/95 border border-yellow-500/30 rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellow-500/20 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center border border-yellow-500/40">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                SELECT A MEKANISM
              </h2>
              <p className="text-xs text-gray-400">
                {ownedMeks?.length || 0} Meks owned
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-gray-700/50 bg-black/20">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
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
              placeholder="Search by number, name, or variation (e.g., Bumblebee)..."
              className="w-full pl-10 pr-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-400">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-xs text-gray-500">
              Found {filteredMeks.length} Mek{filteredMeks.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </p>
          )}
        </div>

        {/* Meks Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)] custom-scrollbar">
          {!ownedMeks ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredMeks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-600">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                  <path d="M8 11h6" />
                </svg>
              </div>
              <p className="text-gray-400">
                {searchQuery ? 'No Meks match your search' : 'You don\'t own any Meks yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {filteredMeks.map((mek: any) => (
                <button
                  key={mek._id}
                  onClick={() => handleSelect(mek)}
                  className="group relative bg-black/40 border border-gray-700 rounded-lg overflow-hidden hover:border-yellow-500/50 hover:bg-black/60 transition-all"
                >
                  {/* Mek Image */}
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={getMekImageUrl(mek)}
                      alt={getMekDisplayName(mek)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>

                  {/* Mek Info */}
                  <div className="p-2 bg-black/60">
                    <p className="text-xs font-medium text-white truncate">
                      {getMekDisplayName(mek)}
                    </p>
                    {mek.rarityRank && (
                      <p className="text-[10px] text-gray-500">
                        Rank #{mek.gameRank || mek.rarityRank}
                      </p>
                    )}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-yellow-500/0 group-hover:bg-yellow-500/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                      SELECT
                    </div>
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
