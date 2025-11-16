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
        const { audioEnabled: enabled } = JSON.parse(stored);
        console.log('[🎵AUDIO-V2] Found stored audio preference:', enabled);
        setAudioEnabled(enabled);
      } catch (e) {
        console.log('[🎵AUDIO-V2] Error parsing stored preference');
      }
    }
  }, []);

  // Handle playing/pausing with fade effects
  useEffect(() => {
    if (!audioRef.current) return;

    if (audioPlaying && audioEnabled) {
      console.log('[🎵AUDIO-V2] Starting playback with fade-in');
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
          console.log('[🎵AUDIO-V2] Fade-in complete');
        }
      }, 20);

      return () => clearInterval(fadeIn);
    } else if (!audioPlaying && audioRef.current.volume > 0) {
      console.log('[🎵AUDIO-V2] Stopping playback with fade-out');

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
          console.log('[🎵AUDIO-V2] Fade-out complete, paused');
        }
      }, 20);

      return () => clearInterval(fadeOut);
    }
  }, [audioPlaying, audioEnabled]);

  const toggleAudio = useCallback(() => {
    console.log('[🎵AUDIO-V2] Toggling audio:', !audioPlaying);
    setAudioPlaying(!audioPlaying);
  }, [audioPlaying]);

  const startAudio = useCallback(() => {
    if (audioEnabled) {
      console.log('[🎵AUDIO-V2] Starting audio (user enabled sound)');
      setAudioPlaying(true);
    } else {
      console.log('[🎵AUDIO-V2] Audio not started (user disabled sound)');
    }
  }, [audioEnabled]);

  return {
    audioPlaying,
    audioEnabled,
    toggleAudio,
    startAudio,
  };
}
