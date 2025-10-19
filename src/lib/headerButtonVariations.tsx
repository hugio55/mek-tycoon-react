// Header button variations for essence market
import React from 'react';

export interface ButtonVariationProps {
  onCreateListing: () => void;
  onToggleMyListings: () => void;
  onToggleOffersView: () => void;
  showOnlyMyListings: boolean;
  showOffersView: boolean;
  listingCount: number;
}

export function renderHeaderButtons(
  variation: number,
  props: ButtonVariationProps
): React.ReactNode {
  const { onCreateListing, onToggleMyListings, onToggleOffersView, showOnlyMyListings, showOffersView, listingCount } = props;
  const hasListings = listingCount > 0;

  switch (variation) {
    case 1: // Industrial Stack
      return (
        <div className="flex gap-2 items-center">
          <button
            onClick={onCreateListing}
            className="px-4 py-2 bg-gradient-to-br from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-black text-[11px] uppercase tracking-widest transition-all rounded-sm shadow-lg shadow-yellow-500/50 border-2 border-yellow-300"
            style={{
              background: 'repeating-linear-gradient(45deg, #fbbf24 0px, #fbbf24 4px, #f59e0b 4px, #f59e0b 8px)'
            }}
          >
            ⚡ LIST ITEM
          </button>

          <div className="h-8 w-px bg-gray-700/50" />

          <button
            onClick={onToggleMyListings}
            className={`px-3 py-1.5 font-bold text-[10px] uppercase tracking-wider transition-all rounded flex items-center gap-1.5 ${
              hasListings
                ? showOnlyMyListings
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/40 border border-emerald-300'
                  : 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-600/40'
                : 'bg-gray-700/30 border border-gray-600/50 text-gray-400 hover:bg-gray-700/40'
            }`}
          >
            {showOnlyMyListings ? '✓' : '◈'} MY LISTINGS
            {hasListings && (
              <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black bg-black/30 text-white">
                {listingCount}
              </span>
            )}
          </button>

          <button
            onClick={onToggleOffersView}
            className="px-3 py-1.5 bg-purple-600/80 hover:bg-purple-500 border border-purple-400/50 text-purple-100 font-bold text-[10px] uppercase tracking-wider transition-all rounded shadow-md shadow-purple-500/30"
          >
            ★ BOUNTIES
          </button>
        </div>
      );

    case 2: // Angled Casino Chips
      return (
        <div className="flex gap-3 items-center">
          <button
            onClick={onCreateListing}
            className="relative px-5 py-2.5 font-black text-[12px] uppercase tracking-widest transition-all"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)',
              boxShadow: '0 0 20px rgba(251, 191, 36, 0.6), inset 0 1px 0 rgba(255,255,255,0.4)',
            }}
          >
            <span className="text-black drop-shadow-lg">LIST ITEM</span>
          </button>

          <button
            onClick={onToggleMyListings}
            className={`relative px-4 py-2 font-bold text-[10px] uppercase tracking-wider transition-all rounded-md ${
              hasListings
                ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/40'
                : 'bg-gray-800/60 border-2 border-dashed border-gray-600 text-gray-500'
            }`}
          >
            MY LISTINGS
            {hasListings && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 text-black rounded-full flex items-center justify-center text-[9px] font-black shadow-lg">
                {listingCount}
              </span>
            )}
          </button>

          <button
            onClick={onToggleOffersView}
            className="relative px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] uppercase tracking-wider transition-all"
            style={{
              clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)',
            }}
          >
            BOUNTIES
          </button>
        </div>
      );

    case 3: // Minimal Modern
      return (
        <div className="flex gap-2 items-center">
          <button
            onClick={onCreateListing}
            className="px-6 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-[12px] uppercase tracking-widest transition-all rounded-lg shadow-xl shadow-yellow-400/40"
          >
            LIST ITEM
          </button>

          <div className="h-10 w-0.5 bg-gradient-to-b from-transparent via-gray-600 to-transparent" />

          <button
            onClick={onToggleMyListings}
            className={`px-4 py-2 font-bold text-[10px] uppercase tracking-wider transition-all rounded-lg ${
              hasListings
                ? showOnlyMyListings
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/40'
                  : 'bg-green-500/20 border-2 border-green-500 text-green-400 hover:bg-green-500/30'
                : 'border-2 border-gray-600 text-gray-500 hover:border-gray-500'
            }`}
          >
            MY LISTINGS {hasListings && `(${listingCount})`}
          </button>

          <button
            onClick={onToggleOffersView}
            className="px-4 py-2 bg-purple-500/20 border-2 border-purple-500 hover:bg-purple-500/30 text-purple-300 font-bold text-[10px] uppercase tracking-wider transition-all rounded-lg"
          >
            BOUNTIES
          </button>
        </div>
      );

    case 4: // Retro Arcade
      return (
        <div className="flex gap-2 items-center">
          <button
            onClick={onCreateListing}
            className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-[11px] uppercase tracking-widest transition-all border-4 border-yellow-600 rounded-none shadow-lg"
            style={{
              boxShadow: '4px 4px 0px rgba(0,0,0,0.5), 0 0 20px rgba(251, 191, 36, 0.5)',
              textShadow: '2px 2px 0px rgba(0,0,0,0.3)'
            }}
          >
            ▶ LIST ITEM
          </button>

          <button
            onClick={onToggleMyListings}
            className={`relative px-3 py-2 font-bold text-[10px] uppercase tracking-wider transition-all border-3 rounded-none ${
              hasListings
                ? 'bg-green-500/30 border-green-400 text-green-300 shadow-lg'
                : 'bg-gray-800/50 border-gray-600 text-gray-500'
            }`}
            style={{
              boxShadow: hasListings ? '3px 3px 0px rgba(0,0,0,0.5), 0 0 15px rgba(34, 197, 94, 0.5)' : '3px 3px 0px rgba(0,0,0,0.5)',
              textShadow: hasListings ? '0 0 10px rgba(34, 197, 94, 0.8)' : 'none'
            }}
          >
            <div className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(255,255,255,0.1) 1px, rgba(255,255,255,0.1) 2px)'
              }}
            />
            MY LISTINGS {hasListings && `[${listingCount}]`}
          </button>

          <button
            onClick={onToggleOffersView}
            className="px-3 py-2 bg-purple-600/40 border-3 border-purple-400 hover:bg-purple-600/60 text-purple-200 font-bold text-[10px] uppercase tracking-wider transition-all rounded-none"
            style={{
              boxShadow: '3px 3px 0px rgba(0,0,0,0.5), 0 0 15px rgba(168, 85, 247, 0.4)',
              textShadow: '0 0 8px rgba(168, 85, 247, 0.6)'
            }}
          >
            BOUNTIES
          </button>
        </div>
      );

    case 5: // Industrial Tags
      return (
        <div className="flex gap-2 items-center">
          <button
            onClick={onCreateListing}
            className="relative px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-yellow-500/50"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
              background: 'repeating-linear-gradient(135deg, #fbbf24 0px, #fbbf24 10px, #000 10px, #000 12px, #fbbf24 12px)',
            }}
          >
            <span className="relative z-10 drop-shadow-lg">⚠ LIST ITEM</span>
          </button>

          <div className="h-8 w-px bg-yellow-600/30" />

          <button
            onClick={onToggleMyListings}
            className={`relative px-4 py-2 font-bold text-[10px] uppercase tracking-wider transition-all ${
              hasListings
                ? 'bg-gradient-to-br from-emerald-700 to-emerald-600 text-emerald-100 shadow-lg shadow-emerald-600/40'
                : 'bg-gradient-to-br from-gray-800 to-gray-700 text-gray-500 shadow-md'
            }`}
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)',
            }}
          >
            <div className="absolute top-0 right-0 w-2 h-2 bg-black/30" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }} />
            MY LISTINGS
            {hasListings && (
              <span className="ml-2 px-1.5 py-0.5 bg-black/40 text-emerald-200 rounded text-[8px] font-black border border-emerald-400/30">
                {listingCount}
              </span>
            )}
          </button>

          <button
            onClick={onToggleOffersView}
            className="relative px-4 py-2 bg-gradient-to-br from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 text-purple-100 font-bold text-[10px] uppercase tracking-wider transition-all shadow-md shadow-purple-600/40"
            style={{
              clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
            }}
          >
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-black/30" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />
            <div className="absolute top-0 left-0 w-2 h-2 bg-white/20" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
            ◆ BOUNTIES
          </button>
        </div>
      );

    default:
      return null;
  }
}
