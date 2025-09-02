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

  // Determine which size folder to use based on requested size
  const sizeFolder = size >= 400 ? '500px' : '150px';

  // Determine the image source
  let imageSrc = src;
  
  // If src is provided and looks like it has a sourceKey format
  if (imageSrc) {
    // Extract the sourceKey part if it's in the old format (e.g., "/meks/aa1-jg1-bc3.jpg")
    const match = imageSrc.match(/([a-z0-9]{2,3}-[a-z0-9]{2,3}-[a-z0-9]{2,3})/i);
    if (match) {
      // Use the extracted key with the correct path and format
      imageSrc = `/mek-images/${sizeFolder}/${match[1].toLowerCase()}.webp`;
    } else if (imageSrc.startsWith("http")) {
      // Leave external URLs as-is
      imageSrc = src;
    } else if (!imageSrc.includes("mek-images")) {
      // If it's a relative path but not to mek-images, update it
      const filename = imageSrc.split('/').pop()?.replace('.jpg', '.webp').replace('.png', '.webp');
      if (filename) {
        imageSrc = `/mek-images/${sizeFolder}/${filename.toLowerCase()}`;
      }
    }
  }
  
  // If we have head and body variations that look like codes (e.g., "333-333-333")
  if (!imageSrc && headVariation && bodyVariation) {
    // Check if variations are in the code format
    if (headVariation.includes('-') && bodyVariation.includes('-')) {
      // Use the variations directly as the image name (WebP format)
      imageSrc = `/mek-images/${sizeFolder}/${headVariation.toLowerCase()}.webp`;
    } else if (assetId) {
      // If we have an asset ID but variations are names, use a placeholder
      // In production, you'd map variation names to codes or use the iconUrl
      imageSrc = `/mek-images/${sizeFolder}/000-000-000.webp`; // Default image
    }
  }
  
  // If still no source, try using assetId
  if (!imageSrc && assetId) {
    // This would need a mapping of assetId to image file
    imageSrc = `/mek-images/${sizeFolder}/000-000-000.webp`; // Default for now
  }

  const handleError = () => {
    console.error(`Failed to load image: ${imageSrc}`);
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
  console.log(`Loading image: ${imageSrc}`);

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