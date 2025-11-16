import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ProModeToggle from '@/components/controls/ProModeToggle';
import { GeometricSpeakerIcon } from '@/components/SpeakerIcons';

interface SoundSelectionStateProps {
  isActive: boolean;
  onComplete: () => void;
  onAudioStart?: () => void;
  shouldShow?: boolean;
}

const STORAGE_KEY_AUDIO = 'mek-audio-consent';

export default function SoundSelectionState({ isActive, onComplete, onAudioStart, shouldShow = true }: SoundSelectionStateProps) {
  const [mounted, setMounted] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Preload toggle click sounds immediately for instant playback
    const guardSound = new Audio('/sounds/main_click.mp3');
    const switchSound = new Audio('/sounds/click reverb 2.mp3');
    guardSound.preload = 'auto';
    switchSound.preload = 'auto';
    // Force load by playing silently
    guardSound.volume = 0;
    switchSound.volume = 0;
    guardSound.play().then(() => guardSound.pause()).catch(() => {});
    switchSound.play().then(() => switchSound.pause()).catch(() => {});
  }, []);

  // Keep component mounted during fade-out even if isActive becomes false
  if (!mounted || (!isActive && !isFadingOut)) return null;

  const handleProceed = (withAudio: boolean) => {
    console.log('[🎵SOUND] User selected audio:', withAudio);
    console.log('[🎵SOUND] About to store to localStorage - audioEnabled:', withAudio);

    // Store preference immediately
    const dataToStore = {
      audioEnabled: withAudio,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY_AUDIO, JSON.stringify(dataToStore));
    console.log('[🎵SOUND] Stored to localStorage:', dataToStore);
    console.log('[🎵SOUND] Verify read back:', JSON.parse(localStorage.getItem(STORAGE_KEY_AUDIO) || '{}'));

    // Start audio immediately if enabled (must happen during user gesture)
    if (withAudio && onAudioStart) {
      console.log('[🎵SOUND] Starting audio during user gesture...');
      onAudioStart();
    }

    // Start fade animation after brief delay (400ms to show green light)
    setTimeout(() => {
      console.log('[🎵SOUND] Starting fade out and background reveal simultaneously...');
      setIsFadingOut(true);

      // Trigger background fade immediately (simultaneous with lightbox fade)
      onComplete();

      // Reset isFadingOut after fade completes to allow component to unmount
      setTimeout(() => {
        setIsFadingOut(false);
      }, 1500); // Match the fade duration
    }, 400);
  };

  const overlay = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 transition-opacity duration-[1000ms]"
      style={{
        opacity: isFadingOut ? 0 : (shouldShow ? 1 : 0)
      }}
    >
      <div
        className="relative flex flex-col items-center gap-6 sm:gap-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Two side-by-side ProModeToggles */}
        <div
          className="flex items-center justify-center"
          style={{
            gap: '48px',
            transform: 'translateY(0px)',
            scale: '1.0'
          }}
        >
          {/* Sound Toggle - Plays sounds */}
          <div className="flex flex-col items-center gap-3">
            <GeometricSpeakerIcon
              size={45}
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
              indicatorColor="green"
              guardColor="green"
            />
          </div>

          {/* No Sound Toggle - Silent (no sounds) */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <GeometricSpeakerIcon
                size={45}
                isPlaying={false}
                className="text-white/70"
              />
              {/* Large Red X Overlay */}
              <svg
                width={45}
                height={45}
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
              indicatorColor="red"
              guardColor="red"
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(overlay, document.body);
}
