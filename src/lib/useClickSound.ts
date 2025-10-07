"use client";

import { useCallback, useRef, useEffect } from 'react';

export const useClickSound = () => {
  const audioBufferRef = useRef<HTMLAudioElement[]>([]);
  const currentIndexRef = useRef(0);
  const loadedRef = useRef(false);
  const initializedRef = useRef(false);

  // Preload multiple audio instances for overlapping sounds
  useEffect(() => {
    if (typeof window !== 'undefined' && !loadedRef.current) {
      loadedRef.current = true;

      // Detect mobile device and iOS
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

      // Use smaller pool on mobile to reduce memory usage
      const poolSize = isMobile ? 3 : 5;

      console.log('[Audio] Device detection:', {
        isMobile,
        isIOS,
        userAgent: navigator.userAgent,
        poolSize
      });

      // Create a pool of audio instances
      for (let i = 0; i < poolSize; i++) {
        // Use MP3 for universal mobile compatibility (WAV causes encoding errors on mobile)
        const audio = new Audio('/sounds/main_click.mp3');
        audio.preload = 'auto';
        audio.volume = 0.3;

        // Log when audio loads successfully
        audio.addEventListener('canplaythrough', () => {
          console.log(`[Audio] Instance ${i} loaded and ready`);
        }, { once: true });

        // Log any loading errors
        audio.addEventListener('error', (e) => {
          console.error(`[Audio] Instance ${i} failed to load:`, {
            error: audio.error?.message,
            code: audio.error?.code,
            src: audio.src
          });
        }, { once: true });

        audioBufferRef.current.push(audio);
      }
      console.log(`[Audio] Created ${poolSize} click sound instances, loading main_click.mp3`);

      // Initialize audio context on first user interaction
      const initAudio = () => {
        if (!initializedRef.current) {
          initializedRef.current = true;
          console.log('[Audio] Audio system initialized by user interaction');
          console.log('[Audio] Pool size:', audioBufferRef.current.length);

          // iOS doesn't allow priming - skip zero-volume play attempt
          if (isIOS) {
            console.log('[Audio Init] iOS detected - skipping priming (requires direct user interaction)');
            return;
          }

          // Prime the audio by playing at zero volume (non-iOS only)
          audioBufferRef.current.forEach((audio, index) => {
            console.log(`[Audio Init] Element ${index}:`, {
              readyState: audio.readyState,
              readyStateText: ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'][audio.readyState],
              volume: audio.volume,
              src: audio.currentSrc,
              duration: audio.duration,
              paused: audio.paused,
              error: audio.error?.message
            });

            const originalVolume = audio.volume;
            audio.volume = 0;
            audio.play().then(() => {
              console.log(`[Audio Init] Element ${index} primed successfully`);
              audio.pause();
              audio.currentTime = 0;
              audio.volume = originalVolume;
              console.log(`[Audio Init] Element ${index} reset - volume: ${audio.volume}, ready: ${audio.readyState}`);
            }).catch((error) => {
              console.error(`[Audio Init] Element ${index} priming failed:`, error.name, error.message);
            });
          });
        }
      };

      // Listen for any user interaction to initialize audio
      document.addEventListener('click', initAudio, { once: true });
      document.addEventListener('keydown', initAudio, { once: true });
      document.addEventListener('touchstart', initAudio, { once: true });
    }
  }, []);

  const playSound = useCallback(() => {
    try {
      console.log('[Audio Play] Attempting to play sound');
      console.log('[Audio Play] Initialized:', initializedRef.current);
      console.log('[Audio Play] Pool size:', audioBufferRef.current.length);
      console.log('[Audio Play] Current index:', currentIndexRef.current);

      // Get next audio instance from the pool
      const audio = audioBufferRef.current[currentIndexRef.current];
      if (!audio) {
        console.warn('[Audio Play] No audio instance available');
        return;
      }

      console.log('[Audio Play] Before play:', {
        readyState: audio.readyState,
        readyStateText: ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'][audio.readyState],
        currentTime: audio.currentTime,
        duration: audio.duration,
        volume: audio.volume,
        muted: audio.muted,
        paused: audio.paused,
        ended: audio.ended,
        src: audio.currentSrc,
        error: audio.error?.message,
        networkState: audio.networkState
      });

      // Cycle to next instance
      currentIndexRef.current = (currentIndexRef.current + 1) % audioBufferRef.current.length;

      // Reset and play
      audio.currentTime = 0;
      audio.volume = 0.3;
      audio.playbackRate = 0.9 + Math.random() * 0.2;

      console.log('[Audio Play] After reset:', {
        currentTime: audio.currentTime,
        volume: audio.volume,
        playbackRate: audio.playbackRate
      });

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('[Audio Play] Play promise resolved successfully');
          console.log('[Audio Play] Playing state:', {
            paused: audio.paused,
            currentTime: audio.currentTime,
            duration: audio.duration,
            volume: audio.volume,
            muted: audio.muted
          });
        }).catch((error) => {
          // Only log if it's not an abort error (happens when clicking rapidly)
          if (error.name !== 'AbortError') {
            console.warn('[Audio Play] Click sound playback failed:', error.message, error.name);
          }
        });
      } else {
        console.warn('[Audio Play] play() returned undefined (old browser?)');
      }
    } catch (error) {
      console.error('[Audio Play] Error playing audio:', error);
    }
  }, []);

  return playSound;
};

export const useGlobalClickSound = () => {
  const playSound = useClickSound();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check if element is interactive
      const isInteractive =
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.classList.contains('clickable') ||
        target.closest('.clickable') ||
        target.classList.contains('cursor-pointer') ||
        target.closest('.cursor-pointer') ||
        target.onclick !== null ||
        target.hasAttribute('onclick') ||
        window.getComputedStyle(target).cursor === 'pointer';

      console.log('[Click Debug]', {
        tagName: target.tagName,
        classList: Array.from(target.classList),
        cursor: window.getComputedStyle(target).cursor,
        hasOnClick: target.onclick !== null,
        isInteractive
      });

      if (isInteractive) {
        console.log('[Click Debug] Playing sound');
        playSound();
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [playSound]);
};