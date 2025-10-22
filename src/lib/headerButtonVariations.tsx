// Header button variations for essence market
import React from 'react';

export interface ButtonVariationProps {
  onCreateListing: () => void;
  onToggleMyListings: () => void;
  showOnlyMyListings: boolean;
  listingCount: number;
}

export function renderHeaderButtons(
  props: ButtonVariationProps
): React.ReactNode {
  const { onCreateListing, onToggleMyListings, showOnlyMyListings, listingCount } = props;
  const hasListings = listingCount > 0;

  // Locked to Style 3: Minimal Modern
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
    </div>
  );
}
