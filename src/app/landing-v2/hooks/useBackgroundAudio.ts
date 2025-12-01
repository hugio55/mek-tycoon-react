import { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY_AUDIO = 'mek-audio-consent';

export function useBackgroundAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Initialize audio element on mount
  useEffect(() => {
    const audioUrl = '/audio/giggliest-girl-1.mp3';
    console.log('[🎵AUDIO-V2] Initializing audio with URL:', audioUrl);

    audioRef.current = new Audio(audioUrl);
    audioRef.current.loop = true;
    audioRef.current.volume = 0;

    audioRef.current.addEventListener('error', (e) => {
      console.error('[🎵AUDIO-V2] Audio error:', e, 'src:', audioRef.current?.src);
    });
    audioRef.current.addEventListener('loadeddata', () => {
      console.log('[🎵AUDIO-V2] Audio loaded successfully');
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Check localStorage for user's audio preference
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_AUDIO);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const { audioEnabled: enabled } = parsed;
        setAudioEnabled(enabled);
      } catch (e) {
        console.error('[🎵AUDIO-V2] Error parsing stored preference:', e);
      }
    }
  }, []);

  // Handle playing/pausing with fade effects
  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    if (audioPlaying && audioEnabled) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0;

      audioRef.current.play().catch((e) => {
        console.error('[🎵AUDIO-V2] Play failed:', e);
      });

      // Fade in over 500ms
      let startTime = Date.now();
      const fadeIn = setInterval(() => {
        if (!audioRef.current) {
          clearInterval(fadeIn);
          return;
        }
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / 500, 1);
        audioRef.current.volume = progress;
        if (progress >= 1) {
          clearInterval(fadeIn);
        }
      }, 20);

      return () => clearInterval(fadeIn);
    } else if (!audioPlaying && audioRef.current.volume > 0) {
      // Fade out over 500ms
      let startTime = Date.now();
      const startVolume = audioRef.current.volume;
      const fadeOut = setInterval(() => {
        if (!audioRef.current) {
          clearInterval(fadeOut);
          return;
        }
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / 500, 1);
        audioRef.current.volume = startVolume * (1 - progress);
        if (progress >= 1) {
          audioRef.current.pause();
          clearInterval(fadeOut);
        }
      }, 20);

      return () => clearInterval(fadeOut);
    }
  }, [audioPlaying, audioEnabled]);

  const toggleAudio = useCallback(() => {
    const newPlayingState = !audioPlaying;
    console.log('[🎵AUDIO-V2] Toggling audio:', newPlayingState);
    setAudioPlaying(newPlayingState);

    // Update localStorage to persist preference
    localStorage.setItem(STORAGE_KEY_AUDIO, JSON.stringify({
      audioEnabled: newPlayingState,
      timestamp: Date.now()
    }));

    // Update audioEnabled state so it stays in sync
    setAudioEnabled(newPlayingState);
  }, [audioPlaying]);

  const startAudio = useCallback(() => {
    // Re-read from localStorage to get the LATEST preference (just written by toggle)
    const stored = localStorage.getItem(STORAGE_KEY_AUDIO);
    let shouldPlay = false;

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        shouldPlay = parsed.audioEnabled;
        // Update state to stay in sync
        setAudioEnabled(shouldPlay);
      } catch (e) {
        console.error('[🎵AUDIO-V2] Error parsing stored preference:', e);
      }
    }

    if (shouldPlay) {
      setAudioPlaying(true);
    }
  }, []);

  return {
    audioPlaying,
    audioEnabled,
    toggleAudio,
    startAudio,
  };
}
