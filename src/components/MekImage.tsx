"use client";

import { useState, useEffect } from "react";

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

  // Determine the image source
  let imageSrc = src;
  
  // Choose folder based on size - use 150px for smaller displays, 500px for larger
  const imageFolder = size > 250 ? '500px' : '150px';
  
  // First priority: If src is a sourceKeyBase (like "aa1-aa1-cd1"), use it directly
  if (src && !src.startsWith('http') && src.includes('-')) {
    imageSrc = `/mek-images/${imageFolder}/${src.toLowerCase()}.webp`;
  }
  // Second priority: Use the direct source URL if provided
  else if (src && src.startsWith('http')) {
    imageSrc = src;
  }
  // Third priority: Try to construct from head and body variations
  else if (headVariation && bodyVariation) {
    // The variations are individual parts (e.g., "aa1", "aa1", "cd1")
    // We need a source key to find the actual image
    // Without a proper mapping, use default
    imageSrc = `/mek-images/${imageFolder}/000-000-000.webp`;
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

  // Use effect to handle image preloading - MUST be before any conditional returns
  useEffect(() => {
    if (imageSrc) {
      const img = new window.Image();
      img.onload = () => {
        setLoading(false);
        setError(false);
      };
      img.onerror = () => {
        console.error(`Failed to load image: ${imageSrc}`);
        setError(true);
        setLoading(false);
      };
      img.src = imageSrc;
    }
  }, [imageSrc]);

  if (!imageSrc) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        🤖
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-700 animate-pulse z-10">
          <div className="text-4xl">⏳</div>
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={{ display: error ? 'none' : 'block' }}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-4xl">🤖</div>
        </div>
      )}
    </div>
  );
}