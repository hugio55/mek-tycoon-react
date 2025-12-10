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

      // Search by variations (check all possible field names)
      if (mek.headVariation?.toLowerCase().includes(query)) return true;
      if (mek.bodyVariation?.toLowerCase().includes(query)) return true;
      if (mek.itemVariation?.toLowerCase().includes(query)) return true;
      if (mek.traitVariation?.toLowerCase().includes(query)) return true;

      // Also search in variation display names if they exist
      if (mek.head?.toLowerCase().includes(query)) return true;
      if (mek.body?.toLowerCase().includes(query)) return true;
      if (mek.trait?.toLowerCase().includes(query)) return true;
      if (mek.item?.toLowerCase().includes(query)) return true;

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

  // Get Mek number from assetName
  const getMekNumber = (mek: any) => {
    const match = mek.assetName?.match(/\d+/);
    return match ? match[0] : mek.assetId;
  };

  // Get display name for Mek (with "Mek #" prefix)
  const getMekDisplayName = (mek: any) => {
    if (mek.customName) return mek.customName;
    return `Mek #${getMekNumber(mek)}`;
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
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
        className="relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-3xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.2) 100%)',
          backdropFilter: 'blur(40px) saturate(150%)',
          WebkitBackdropFilter: 'blur(40px) saturate(150%)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Space Age style */}
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

        {/* Header - Space Age style */}
        <div className="w-full py-6 px-8 text-center border-b border-white/10">
          <h1 className="text-3xl font-bold tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            <span className="text-cyan-400" style={{ textShadow: '0 0 30px rgba(34, 211, 238, 0.5)' }}>SELECT</span>{" "}
            <span className="text-white/80">A MEKANISM</span>
          </h1>
          <p className="text-white/50 text-sm mt-2" style={{ fontFamily: 'Play, sans-serif' }}>
            {ownedMeks?.length || 0} Meks in your collection
          </p>
        </div>

        {/* Search Bar - Space Age style */}
        <div className="px-8 py-5 border-b border-white/10">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400/60"
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
              placeholder="Search by number, name, or variation (e.g., Seafoam, Bumblebee)..."
              className="w-full pl-12 pr-12 py-4 rounded-xl text-white placeholder-white/30 focus:outline-none transition-all"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(34, 211, 238, 0.2)',
                fontFamily: 'Play, sans-serif'
              }}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:scale-110"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <span className="text-white/60 text-sm">×</span>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-3 text-sm text-cyan-400/70" style={{ fontFamily: 'Play, sans-serif' }}>
              Found {filteredMeks.length} Mek{filteredMeks.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </p>
          )}
        </div>

        {/* Meks Grid - Space Age style */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-220px)] custom-scrollbar">
          {!ownedMeks ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div
                className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'rgba(34, 211, 238, 0.5)', borderTopColor: 'transparent' }}
              />
              <p className="text-white/40 mt-4" style={{ fontFamily: 'Play, sans-serif' }}>
                Loading your Mekanisms...
              </p>
            </div>
          ) : filteredMeks.length === 0 ? (
            <div className="text-center py-16">
              <div
                className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                  <path d="M8 11h6" />
                </svg>
              </div>
              <p className="text-white/50" style={{ fontFamily: 'Play, sans-serif' }}>
                {searchQuery ? 'No Meks match your search' : 'You don\'t own any Meks yet'}
              </p>
              {searchQuery && (
                <p className="text-white/30 text-sm mt-2">
                  Try a different search term
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {filteredMeks.map((mek: any) => (
                <button
                  key={mek._id}
                  onClick={() => handleSelect(mek)}
                  className="group relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  {/* Mek Image */}
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={getMekImageUrl(mek)}
                      alt={getMekDisplayName(mek)}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>

                  {/* Mek Info */}
                  <div
                    className="p-2"
                    style={{
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)'
                    }}
                  >
                    <p className="text-xs font-medium text-white truncate" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      {mek.customName || `Mek #${getMekNumber(mek)}`}
                    </p>
                    {(mek.rarityRank || mek.gameRank) && (
                      <p className="text-[10px] text-cyan-400/70">
                        Rank {mek.gameRank || mek.rarityRank}
                      </p>
                    )}
                  </div>

                  {/* Hover Overlay */}
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                    style={{
                      background: 'rgba(34, 211, 238, 0.1)',
                      backdropFilter: 'blur(2px)'
                    }}
                  >
                    <div
                      className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transform scale-90 group-hover:scale-100 transition-transform"
                      style={{
                        background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.3) 0%, rgba(34, 211, 238, 0.2) 100%)',
                        border: '1px solid rgba(34, 211, 238, 0.5)',
                        color: 'rgb(34, 211, 238)',
                        fontFamily: 'Orbitron, sans-serif',
                        boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)'
                      }}
                    >
                      Select
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
