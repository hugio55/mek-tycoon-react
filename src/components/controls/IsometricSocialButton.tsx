'use client';

import React from 'react';
import './IsometricSocialButton.css';
import Image from 'next/image';
import { getMediaUrl } from '@/lib/media-url';

interface IsometricSocialButtonProps {
  iconClass: string;
  label: string;
  onClick?: () => void;
  mekImage?: string;
}

export default function IsometricSocialButton({
  iconClass,
  label,
  onClick,
  mekImage
}: IsometricSocialButtonProps) {
  return (
    <div className="isometric-social">
      <a href="#" onClick={(e) => { e.preventDefault(); onClick?.(); }}>
        {mekImage && (
          <div className="mek-image-container">
            <Image
              src={mekImage.startsWith('/') ? getMediaUrl(mekImage) : mekImage}
              alt={`Mek for ${label}`}
              width={100}
              height={100}
              className="mek-image"
            />
          </div>
        )}
        <i className={iconClass}></i>
      </a>
    </div>
  );
}
