import { useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY_AUDIO = 'mek-audio-consent';

export function useClickSound() {
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);

  // Preload the click sound on mount for instant playback
  useEffect(() => {
    const audio = new Audio('/audio/sci fi beep more calm mp3 1.mp3');
    audio.preload = 'auto';
    audio.load();

    // Force-load by playing silently then pausing
    audio.volume = 0;
    audio.play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 1;
        clickSoundRef.current = audio;
      })
      .catch(() => {
        // Autoplay blocked - still store ref for user-initiated playback
        audio.volume = 1;
        clickSoundRef.current = audio;
      });
  }, []);

  const playClickSound = useCallback(() => {
    // Check global audio preference from localStorage
    const stored = localStorage.getItem(STORAGE_KEY_AUDIO);
    let audioEnabled = false;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        audioEnabled = parsed.audioEnabled;
      } catch {
        // Invalid JSON, default to disabled
      }
    }

    if (audioEnabled && clickSoundRef.current) {
      clickSoundRef.current.currentTime = 0;
      clickSoundRef.current.play().catch(() => {});
    }
  }, []);

  return { playClickSound };
}
