import React from 'react';
import { MekAsset } from './types';

interface MekCardImageProps {
  mek: MekAsset;
  getMekImageUrl: (mekNumber: number, size: string) => string;
}

export const MekCardImage = React.memo(({ mek, getMekImageUrl }: MekCardImageProps) => {
  // Generate image path with fallback logic - prioritize existing imageUrl
  let imagePath: string;

  if (mek.imageUrl) {
    // Use existing imageUrl but upgrade to 1000px for high-res display
    imagePath = mek.imageUrl
      .replace('/150px/', '/1000px/')
      .replace('/500px/', '/1000px/');
  } else if (mek.sourceKey) {
    // Construct image path directly from sourceKey
    const cleanKey = mek.sourceKey.replace(/-[A-Z]$/, '').toLowerCase();
    imagePath = `/mek-images/1000px/${cleanKey}.webp`;
  } else if (mek.mekNumber) {
    imagePath = getMekImageUrl(mek.mekNumber, '1000px');
  } else {
    imagePath = '/mek-images/1000px/000-000-000.webp';
  }

  return (
    <div className="aspect-square bg-black/30 overflow-hidden relative border border-yellow-500/20">
      {(mek.mekNumber || mek.sourceKey || mek.imageUrl) ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-yellow-500/30 border-t-yellow-500/60 rounded-full animate-spin" />
          </div>
          <img
            src={imagePath}
            alt={mek.assetName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 relative z-10"
            loading="lazy"
            onLoad={(e) => {
              const parent = e.currentTarget.parentElement;
              const loader = parent?.querySelector('div');
              if (loader) loader.style.display = 'none';
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </>
      ) : mek.imageUrl ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-yellow-500/30 border-t-yellow-500/60 rounded-full animate-spin" />
          </div>
          <img
            src={mek.imageUrl}
            alt={mek.assetName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 relative z-10"
            loading="lazy"
            onLoad={(e) => {
              const parent = e.currentTarget.parentElement;
              const loader = parent?.querySelector('div');
              if (loader) loader.style.display = 'none';
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-600 font-mono text-xs">
          NO IMAGE
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.mek.assetId === nextProps.mek.assetId &&
         prevProps.mek.mekNumber === nextProps.mek.mekNumber &&
         prevProps.mek.imageUrl === nextProps.mek.imageUrl;
});

MekCardImage.displayName = 'MekCardImage';
