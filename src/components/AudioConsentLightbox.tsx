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

export default function AudioConsentLightbox({ onProceed, isVisible }: AudioConsentLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

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
      <div className="absolute inset-0 bg-black/95" onClick={(e) => e.stopPropagation()} />

      <div
        className="relative flex flex-col items-center gap-6 sm:gap-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Text - Responsive sizing for mobile */}
        <div className="relative h-10 sm:h-12 overflow-hidden">
          <div
            className={`absolute inset-0 flex items-center justify-center transition-transform duration-[400ms] ease-out will-change-transform ${
              audioEnabled ? '-translate-y-full' : 'translate-y-0'
            }`}
          >
            <span className="text-2xl sm:text-3xl font-light text-gray-400 tracking-wide">
              Sound Off
            </span>
          </div>
          <div
            className={`absolute inset-0 flex items-center justify-center transition-transform duration-[400ms] ease-out will-change-transform ${
              audioEnabled ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <span className="text-2xl sm:text-3xl font-light text-yellow-500 tracking-wide">
              Sound On
            </span>
          </div>
        </div>

        {/* Toggle Switch - Enhanced for mobile touch (44x44px minimum) */}
        <button
          onClick={handleToggle}
          className={`relative w-20 h-10 sm:w-24 sm:h-12 rounded-full transition-all duration-[400ms] ease-out cursor-pointer touch-manipulation ${
            audioEnabled
              ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
              : 'bg-gray-700'
          }`}
          style={{
            WebkitTapHighlightColor: 'transparent',
            minWidth: '80px',
            minHeight: '44px',
            boxShadow: audioEnabled
              ? '0 0 20px rgba(250, 182, 23, 0.4)'
              : '0 0 10px rgba(0, 0, 0, 0.3)'
          }}
          aria-label={audioEnabled ? 'Turn sound off' : 'Turn sound on'}
        >
          <div
            className={`absolute top-1 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full shadow-lg transition-all duration-[400ms] ease-out will-change-transform ${
              audioEnabled ? 'translate-x-10 sm:translate-x-12' : 'translate-x-1'
            }`}
          />
        </button>

        {/* Proceed Button - Optimized for mobile touch */}
        <button
          onClick={handleProceed}
          className="mt-6 sm:mt-8 px-10 sm:px-12 py-3 sm:py-3.5 text-white text-base sm:text-lg font-light tracking-wider border border-white/20 rounded-full hover:border-white/40 hover:bg-white/5 active:bg-white/10 transition-all duration-300 touch-manipulation"
          style={{
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
