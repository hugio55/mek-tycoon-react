"use client";

import { useState } from "react";

interface MekImageProps {
  src?: string | null;
  headVariation?: string;
  bodyVariation?: string;
  assetId?: string;
  size?: number;
  alt?: string;
  className?: string;
}

export default function MekImage({ 
  src, 
  headVariation, 
  bodyVariation, 
  assetId,
  size = 100,
  alt = "Mek NFT", 
  className = "" 
}: MekImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageAttempt, setImageAttempt] = useState(0);

  // Determine the image source
  let imageSrc = src;
  
  // Choose folder based on size - use 150px for smaller displays
  const imageFolder = '150px';
  
  // First priority: If src is a sourceKeyBase (like "aa1-aa1-cd1"), use it directly
  if (src && !src.startsWith('http') && src.includes('-')) {
    imageSrc = `/mek-images/${imageFolder}/${src.toLowerCase()}.webp`;
  }
  // Second priority: Use the direct source URL if provided
  else if (src && src.startsWith('http')) {
    imageSrc = src;
  }
  // Third priority: Check if we have headVariation or bodyVariation with the source key format
  else if ((headVariation && headVariation.includes('-')) || (bodyVariation && bodyVariation.includes('-'))) {
    // Use the head variation as the filename (it's the actual source key)
    // The images are stored as webp
    const fileName = headVariation?.toLowerCase() || bodyVariation?.toLowerCase();
    imageSrc = `/mek-images/${imageFolder}/${fileName}.webp`;
  }
  // Fourth priority: Try to use assetId to construct image path
  else if (assetId) {
    // For numbered Meks (0001-4000), we need to map to their source keys
    // For now, use a placeholder - in production you'd have a mapping
    const paddedId = assetId.padStart(4, '0');
    
    // Try to load from the numbered images (if they exist)
    // Otherwise fall back to a default
    imageSrc = `/mek-images/${imageFolder}/000-000-000.webp`;
  }
  // Fallback: Use a default image
  else {
    imageSrc = `/mek-images/${imageFolder}/000-000-000.webp`;
  }

  const handleError = () => {
    // Try different image formats/paths before giving up
    if ((headVariation || bodyVariation) && imageAttempt < 3) {
      const fileName = headVariation?.toLowerCase() || bodyVariation?.toLowerCase() || '000-000-000';
      const folder = size > 100 ? '500px' : '150px';
      const altFolder = size > 100 ? '150px' : '500px';
      const attempts = [
        `/mek-images/${folder}/${fileName}.webp`,
        `/mek-images/${altFolder}/${fileName}.webp`,
        `/mek-images/${folder}/000-000-000.webp`,
        `/mek-images/150px/000-000-000.webp` // Final fallback
      ];
      
      if (imageAttempt < attempts.length - 1) {
        setImageAttempt(imageAttempt + 1);
        // Force re-render with new source
        const img = document.querySelector(`img[alt="${alt}"]`) as HTMLImageElement;
        if (img) {
          img.src = attempts[imageAttempt + 1];
        }
        return;
      }
    }
    
    console.error(`Failed to load image after all attempts: ${imageSrc}`);
    setError(true);
    setLoading(false);
  };

  const handleLoad = () => {
    setLoading(false);
  };

  if (!imageSrc || error) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        🤖
      </div>
    );
  }

  // Debug log

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-700 animate-pulse">
          <div className="text-4xl">⏳</div>
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover ${loading ? 'opacity-0' : 'opacity-100'}`}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}