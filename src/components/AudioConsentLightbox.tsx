'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface AudioConsentLightboxProps {
  onProceed: (audioEnabled: boolean) => void;
  isVisible: boolean;
  toggleSize?: number; // Width in pixels, height will be half (default: 96)
  backdropDarkness?: number; // 0-100 percentage (default: 95)
  logoFadeDuration?: number; // milliseconds (default: 1000)
}

const STORAGE_KEY_AUDIO = 'mek-audio-consent';

export default function AudioConsentLightbox({
  onProceed,
  isVisible,
  toggleSize = 96,
  backdropDarkness = 95,
  logoFadeDuration = 1000
}: AudioConsentLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Calculate responsive dimensions
  const toggleWidth = toggleSize;
  const toggleHeight = toggleSize / 2;
  const thumbSize = toggleHeight * 0.8; // 80% of height for proper padding
  const thumbOffset = toggleHeight * 0.1; // 10% padding from edge
  const thumbTranslate = toggleWidth - thumbSize - (thumbOffset * 2); // Distance to travel

  // Ensure minimum touch target (44x44px WCAG requirement)
  const minTouchSize = 44;
  const effectiveWidth = Math.max(toggleWidth, minTouchSize);
  const effectiveHeight = Math.max(toggleHeight, minTouchSize);

  // Calculate text sizing based on toggle size (scale from base size of 96px)
  const textScale = toggleSize / 96;
  const labelTextSize = Math.max(24 * textScale, 16); // Min 16px, scales from 24px
  const buttonTextSize = Math.max(16 * textScale, 14); // Min 14px, scales from 16px

  useEffect(() => {
    setMounted(true);

    return () => {
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    if (isVisible && mounted) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isVisible, mounted]);

  const handleToggle = () => {
    const newState = !audioEnabled;
    console.log('[🎵LIGHTBOX] Audio toggle clicked, new state:', newState);
    setAudioEnabled(newState);
  };

  const handleProceed = () => {
    console.log('[🎵LIGHTBOX] Proceed clicked with audioEnabled:', audioEnabled);
    // Store audio preference with timestamp (matches landing page format)
    localStorage.setItem(STORAGE_KEY_AUDIO, JSON.stringify({
      audioEnabled,
      timestamp: Date.now()
    }));
    onProceed(audioEnabled);
  };

  if (!mounted || !isVisible) return null;

  const lightboxContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(0, 0, 0, ${backdropDarkness / 100})` }}
        onClick={(e) => e.stopPropagation()}
      />

      <div
        className="relative flex flex-col items-center gap-6 sm:gap-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Text - Responsive sizing based on toggle size */}
        <div
          className="relative overflow-hidden"
          style={{ height: `${labelTextSize * 1.5}px` }}
        >
          <div
            className={`absolute inset-0 flex items-center justify-center transition-transform duration-[400ms] ease-out will-change-transform ${
              audioEnabled ? '-translate-y-full' : 'translate-y-0'
            }`}
          >
            <span
              className="font-light text-gray-400 tracking-wide"
              style={{ fontSize: `${labelTextSize}px` }}
            >
              Sound Off
            </span>
          </div>
          <div
            className={`absolute inset-0 flex items-center justify-center transition-transform duration-[400ms] ease-out will-change-transform ${
              audioEnabled ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <span
              className="font-light text-yellow-500 tracking-wide"
              style={{ fontSize: `${labelTextSize}px` }}
            >
              Sound On
            </span>
          </div>
        </div>

        {/* Toggle Switch - Responsive sizing with minimum touch target */}
        <button
          onClick={handleToggle}
          className={`relative rounded-full transition-all duration-[400ms] ease-out cursor-pointer touch-manipulation ${
            audioEnabled
              ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
              : 'bg-gray-700'
          }`}
          style={{
            width: `${effectiveWidth}px`,
            height: `${effectiveHeight}px`,
            WebkitTapHighlightColor: 'transparent',
            boxShadow: audioEnabled
              ? `0 0 ${toggleSize * 0.2}px rgba(250, 182, 23, 0.4)`
              : `0 0 ${toggleSize * 0.1}px rgba(0, 0, 0, 0.3)`
          }}
          aria-label={audioEnabled ? 'Turn sound off' : 'Turn sound on'}
        >
          <div
            className="absolute bg-white rounded-full shadow-lg transition-all duration-[400ms] ease-out will-change-transform"
            style={{
              width: `${thumbSize}px`,
              height: `${thumbSize}px`,
              top: `${thumbOffset}px`,
              left: `${thumbOffset}px`,
              transform: audioEnabled ? `translateX(${thumbTranslate}px)` : 'translateX(0)'
            }}
          />
        </button>

        {/* Proceed Button - Optimized for mobile touch with responsive sizing */}
        <button
          onClick={handleProceed}
          className="mt-6 sm:mt-8 text-white font-light tracking-wider border border-white/20 rounded-full hover:border-white/40 hover:bg-white/5 active:bg-white/10 transition-all duration-300 touch-manipulation"
          style={{
            paddingLeft: `${toggleSize * 0.4}px`,
            paddingRight: `${toggleSize * 0.4}px`,
            paddingTop: `${toggleSize * 0.125}px`,
            paddingBottom: `${toggleSize * 0.125}px`,
            fontSize: `${buttonTextSize}px`,
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
          }}
        >
          PROCEED
        </button>
      </div>
    </div>
  );

  return createPortal(lightboxContent, document.body);
}
