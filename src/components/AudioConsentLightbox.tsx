'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ProModeToggle from './controls/ProModeToggle';

interface AudioConsentLightboxProps {
  onProceed: (audioEnabled: boolean) => void;
  isVisible: boolean;
  toggleSize?: number; // Width in pixels, height will be half (default: 96)
  backdropDarkness?: number; // 0-100 percentage (default: 95)
  logoFadeDuration?: number; // milliseconds (default: 1000)
  lockScroll?: boolean; // Control scroll lock independently from visibility
  toggleScale?: number; // Scale multiplier for toggle button (default: 1.0)
  toggleTextGap?: number; // Gap between toggle and text in pixels (default: 24)
  soundLabelFont?: string; // Font family for Sound On/Off text
  soundLabelSize?: number; // Font size for Sound On/Off text
  soundLabelColor?: string; // Color class for Sound On/Off text
  soundLabelVerticalOffset?: number; // Vertical offset for Sound On/Off text
  soundLabelHorizontalOffset?: number; // Horizontal offset for Sound On/Off text
  proceedButtonSize?: number; // Scale multiplier for proceed button (default: 1.0)
  descriptionVerticalPosition?: number; // Vertical position offset for description text
  toggleGroupVerticalPosition?: number; // Vertical position offset for toggle + text
  proceedButtonVerticalPosition?: number; // Vertical position offset for proceed button
  audioDescriptionText?: string; // Customizable description text (default: "For full immersion...")
  audioConsentFadeDuration?: number; // Fade out duration in milliseconds (default: 500)
}

const STORAGE_KEY_AUDIO = 'mek-audio-consent';

export default function AudioConsentLightbox({
  onProceed,
  isVisible,
  toggleSize = 96,
  backdropDarkness = 95,
  logoFadeDuration = 1000,
  lockScroll = true,
  toggleScale = 1.0,
  toggleTextGap = 24,
  soundLabelFont = 'Orbitron',
  soundLabelSize = 16,
  soundLabelColor = 'text-yellow-400/90',
  soundLabelVerticalOffset = 0,
  soundLabelHorizontalOffset = 0,
  proceedButtonSize = 1.0,
  descriptionVerticalPosition = 0,
  toggleGroupVerticalPosition = 0,
  proceedButtonVerticalPosition = 0,
  audioDescriptionText = "For full immersion...",
  audioConsentFadeDuration = 500
}: AudioConsentLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

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

  const [savedScrollY, setSavedScrollY] = useState(0);

  useEffect(() => {
    setMounted(true);

    return () => {
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    if (isVisible && mounted) {
      const scrollY = window.scrollY;
      setSavedScrollY(scrollY);
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.touchAction = '';
      window.scrollTo(0, savedScrollY);
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.touchAction = '';
    };
  }, [isVisible, mounted, savedScrollY]);

  const handleToggle = () => {
    const newState = !audioEnabled;
    console.log('[🎵LIGHTBOX] Audio toggle clicked, new state:', newState);
    setAudioEnabled(newState);
  };

  const handleProceed = () => {
    console.log('[🎵LIGHTBOX] Proceed clicked with audioEnabled:', audioEnabled);
    console.log('[🎵LIGHTBOX] Starting 1-second delay before fade...');

    // Start fade animation after 1 second delay
    setTimeout(() => {
      console.log('[🎵LIGHTBOX] Delay complete, starting fade out...');
      setIsFadingOut(true);

      // After fade completes, store preference and call onProceed
      setTimeout(() => {
        console.log('[🎵LIGHTBOX] Fade complete, proceeding...');
        localStorage.setItem(STORAGE_KEY_AUDIO, JSON.stringify({
          audioEnabled,
          timestamp: Date.now()
        }));
        onProceed(audioEnabled);
      }, audioConsentFadeDuration);
    }, 1000);
  };

  if (!mounted || !isVisible) return null;

  const lightboxContent = (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center px-4 transition-opacity duration-${audioConsentFadeDuration}`}
      style={{
        opacity: isFadingOut ? 0 : 1,
        transitionDuration: `${audioConsentFadeDuration}ms`
      }}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(0, 0, 0, ${backdropDarkness / 100})` }}
        onClick={(e) => e.stopPropagation()}
      />

      <div
        className="relative flex flex-col items-center gap-6 sm:gap-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Text */}
        <p
          className="text-white/70 text-base sm:text-lg font-light tracking-wide text-center"
          style={{ transform: `translateY(${descriptionVerticalPosition}px)` }}
        >
          {audioDescriptionText}
        </p>

        {/* Toggle Switch and Text Container - Horizontal Layout */}
        <div
          className="flex items-center"
          style={{
            gap: `${toggleTextGap}px`,
            transform: `translateY(${toggleGroupVerticalPosition}px)`
          }}
        >
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
              transform: `scale(${toggleScale})`,
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

          {/* Animated Text - Responsive sizing based on toggle size */}
          <div
            className="relative overflow-hidden"
            style={{
              height: `${soundLabelSize * 2}px`,
              minWidth: `${soundLabelSize * 6}px`,
              transform: `translate(${soundLabelHorizontalOffset}px, ${soundLabelVerticalOffset}px)`
            }}
          >
            <div
              className={`absolute inset-0 flex items-center justify-start transition-transform duration-[400ms] ease-out will-change-transform ${
                audioEnabled ? '-translate-y-full' : 'translate-y-0'
              }`}
            >
              <span
                className={`font-light tracking-wide text-gray-400`}
                style={{
                  fontSize: `${soundLabelSize}px`,
                  lineHeight: `${soundLabelSize * 2}px`,
                  fontFamily: `${soundLabelFont}, sans-serif`
                }}
              >
                Sound Off
              </span>
            </div>
            <div
              className={`absolute inset-0 flex items-center justify-start transition-transform duration-[400ms] ease-out will-change-transform ${
                audioEnabled ? 'translate-y-0' : 'translate-y-full'
              }`}
            >
              <span
                className={`font-light tracking-wide ${soundLabelColor}`}
                style={{
                  fontSize: `${soundLabelSize}px`,
                  lineHeight: `${soundLabelSize * 2}px`,
                  fontFamily: `${soundLabelFont}, sans-serif`
                }}
              >
                Sound On
              </span>
            </div>
          </div>
        </div>

        {/* Proceed Button - ORIGINAL (Commented out, replaced with ProModeToggle) */}
        {/* <button
          onClick={handleProceed}
          className="mt-6 sm:mt-8 text-white font-light tracking-wider border border-white/20 rounded-full hover:border-white/40 hover:bg-white/5 active:bg-white/10 transition-all duration-300 touch-manipulation"
          style={{
            paddingLeft: `${toggleSize * 0.4 * proceedButtonSize}px`,
            paddingRight: `${toggleSize * 0.4 * proceedButtonSize}px`,
            paddingTop: `${toggleSize * 0.125 * proceedButtonSize}px`,
            paddingBottom: `${toggleSize * 0.125 * proceedButtonSize}px`,
            fontSize: `${buttonTextSize * proceedButtonSize}px`,
            WebkitTapHighlightColor: 'transparent',
            minHeight: `${44 * proceedButtonSize}px`,
            transform: `scale(${proceedButtonSize}) translateY(${proceedButtonVerticalPosition}px)`
          }}
        >
          PROCEED
        </button> */}

        {/* ProModeToggle replacing PROCEED button */}
        <div
          className="mt-6 sm:mt-8"
          style={{
            transform: `scale(${proceedButtonSize}) translateY(${proceedButtonVerticalPosition}px)`
          }}
        >
          <ProModeToggle
            enabled={false}
            onChange={(enabled) => {
              if (enabled) {
                handleProceed();
              }
            }}
            label="PROCEED"
          />
        </div>
      </div>
    </div>
  );

  return createPortal(lightboxContent, document.body);
}
