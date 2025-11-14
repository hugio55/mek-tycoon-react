'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ProModeToggle from './controls/ProModeToggle';
import { GeometricSpeakerIcon } from './SpeakerIcons';

interface AudioConsentLightboxProps {
  onProceed: (audioEnabled: boolean) => void;
  isVisible: boolean;
  backdropDarkness?: number; // 0-100 percentage (default: 95)
  logoFadeDuration?: number; // milliseconds (default: 1000)
  lockScroll?: boolean; // Control scroll lock independently from visibility
  audioConsentFadeDuration?: number; // Fade out duration in milliseconds (default: 500)
  // New controls for two-toggle design
  toggleSize?: number; // Scale multiplier for both toggle buttons (default: 1.0)
  toggleGap?: number; // Gap between two toggles in pixels (default: 48)
  toggleVerticalPosition?: number; // Vertical offset for entire toggle group (default: 0)
  toggleLabelFont?: string; // Font family for SOUND/NO SOUND labels
  toggleLabelSize?: number; // Font size for SOUND/NO SOUND labels
  toggleLabelColor?: string; // Color class for SOUND/NO SOUND labels
}

const STORAGE_KEY_AUDIO = 'mek-audio-consent';

export default function AudioConsentLightbox({
  onProceed,
  isVisible,
  backdropDarkness = 95,
  logoFadeDuration = 1000,
  lockScroll = true,
  audioConsentFadeDuration = 500,
  toggleSize = 1.0,
  toggleGap = 48,
  toggleVerticalPosition = 0,
  toggleLabelFont = 'Orbitron',
  toggleLabelSize = 18,
  toggleLabelColor = 'text-yellow-400'
}: AudioConsentLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [savedScrollY, setSavedScrollY] = useState(0);

  useEffect(() => {
    setMounted(true);

    return () => {
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    const preventTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    const preventScroll = (e: Event) => {
      e.preventDefault();
    };

    if (isVisible && mounted) {
      const scrollY = window.scrollY;
      setSavedScrollY(scrollY);

      // Lock both html and body to prevent scroll
      const htmlElement = document.documentElement;
      htmlElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.touchAction = 'none';

      // Prevent touchmove and wheel events
      document.addEventListener('touchmove', preventTouchMove, { passive: false });
      document.addEventListener('wheel', preventScroll, { passive: false });
    } else {
      const htmlElement = document.documentElement;
      htmlElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.touchAction = '';
      window.scrollTo(0, savedScrollY);

      // Remove event listeners
      document.removeEventListener('touchmove', preventTouchMove);
      document.removeEventListener('wheel', preventScroll);
    }

    return () => {
      const htmlElement = document.documentElement;
      htmlElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.touchAction = '';
      document.removeEventListener('touchmove', preventTouchMove);
      document.removeEventListener('wheel', preventScroll);
    };
  }, [isVisible, mounted, savedScrollY]);

  const handleToggle = () => {
    const newState = !audioEnabled;
    console.log('[🎵LIGHTBOX] Audio toggle clicked, new state:', newState);
    setAudioEnabled(newState);
  };

  const handleProceed = (withAudio: boolean) => {
    console.log('[🎵LIGHTBOX] Proceed clicked with audio:', withAudio);
    console.log('[🎵LIGHTBOX] Starting 1-second delay before fade...');

    // Start fade animation after 1 second delay
    setTimeout(() => {
      console.log('[🎵LIGHTBOX] Delay complete, starting fade out...');
      setIsFadingOut(true);

      // After fade completes, store preference and call onProceed
      setTimeout(() => {
        console.log('[🎵LIGHTBOX] Fade complete, proceeding...');
        localStorage.setItem(STORAGE_KEY_AUDIO, JSON.stringify({
          audioEnabled: withAudio,
          timestamp: Date.now()
        }));
        onProceed(withAudio);
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
        {/* OLD DESIGN - COMMENTED OUT FOR ROLLBACK */}
        {/* Header Text */}
        {/* <p
          className="text-white/70 text-base sm:text-lg font-light tracking-wide text-center"
          style={{ transform: `translateY(${descriptionVerticalPosition}px)` }}
        >
          {audioDescriptionText}
        </p> */}

        {/* Toggle Switch and Text Container - Horizontal Layout */}
        {/* <div
          className="flex items-center"
          style={{
            gap: `${toggleTextGap}px`,
            transform: `translateY(${toggleGroupVerticalPosition}px)`
          }}
        > */}
          {/* Toggle Switch - Responsive sizing with minimum touch target */}
          {/* <button
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
          </button> */}

          {/* Animated Text - Responsive sizing based on toggle size */}
          {/* <div
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
        </div> */}

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
        {/* <div
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
        </div> */}
        {/* END OLD DESIGN */}

        {/* NEW DESIGN - TWO SIDE-BY-SIDE PROMO TOGGLES */}
        <div
          className="flex items-center justify-center"
          style={{
            gap: `${toggleGap}px`,
            transform: `translateY(${toggleVerticalPosition}px)`,
            scale: `${toggleSize}`
          }}
        >
          {/* Sound Toggle - Plays sounds */}
          <div className="flex flex-col items-center gap-3">
            <GeometricSpeakerIcon
              size={toggleLabelSize * 2.5}
              isPlaying={true}
              className="text-white/70"
            />
            <ProModeToggle
              enabled={false}
              onChange={(enabled) => {
                if (enabled) {
                  handleProceed(true);
                }
              }}
              label=""
              enableSounds={true}
            />
          </div>

          {/* No Sound Toggle - Silent (no sounds) */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <GeometricSpeakerIcon
                size={toggleLabelSize * 2.5}
                isPlaying={false}
                className="text-white/70"
              />
              {/* Large Red X Overlay */}
              <svg
                width={toggleLabelSize * 2.5}
                height={toggleLabelSize * 2.5}
                viewBox="0 0 48 48"
                className="absolute inset-0"
                style={{ pointerEvents: 'none' }}
              >
                <line
                  x1="8" y1="8" x2="40" y2="40"
                  stroke="#ef4444"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1="40" y1="8" x2="8" y2="40"
                  stroke="#ef4444"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <ProModeToggle
              enabled={false}
              onChange={(enabled) => {
                if (enabled) {
                  handleProceed(false);
                }
              }}
              label=""
              enableSounds={false}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(lightboxContent, document.body);
}
