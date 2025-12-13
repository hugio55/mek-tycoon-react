'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import StarField from '@/components/StarField';
import { getMediaUrl } from '@/lib/media-url';

import { useLandingStateMachine, TIMINGS } from './hooks/useLandingStateMachine';
import { useBackgroundAudio } from './hooks/useBackgroundAudio';
import { useClickSound } from './hooks/useClickSound';
import { useIsMobileResume } from '@/hooks/useMobileResume';
import LandingContainer from './components/LandingContainer';
import SoundSelectionState from './components/states/SoundSelectionState';
import FinalContentState from './components/states/FinalContentState';
import SpeakerButton from './components/SpeakerButton';
import { useLoaderContext } from '@/features/page-loader';

export default function LandingV2() {
  // Logo positioning (adjust these values to move logo up/down on all devices)
  const logoPositionDesktop = '28vh'; // Desktop and Mac
  const logoPositionMobile = '20vh';  // iPhone and Android

  const { isLoading, registerCriticalAsset, markCriticalAssetLoaded } = useLoaderContext();
  const [deviceType, setDeviceType] = useState<'macos' | 'iphone' | 'android' | 'other'>('other');
  const [mounted, setMounted] = useState(false);
  const isMobileResume = useIsMobileResume();

  const [revealStarted, setRevealStarted] = useState(false);
  const [backgroundFadedIn, setBackgroundFadedIn] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [entranceStarted, setEntranceStarted] = useState(false);
  const [showFooter, setShowFooter] = useState(false);

  const phaseCards = useQuery(api.phaseCards.getAllPhaseCards);
  const { currentState, next, transitionTo, isState } = useLandingStateMachine();
  const { audioPlaying, toggleAudio, startAudio } = useBackgroundAudio();
  const { playClickSound } = useClickSound();

  // Handle mobile resume - skip intro and go directly to REVEAL
  useEffect(() => {
    if (isMobileResume) {
      console.log('[🔐RESUME] Mobile resume detected - skipping intro animations');
      transitionTo('REVEAL');
    }
  }, [isMobileResume, transitionTo]);

  // Detect device type on mount
  useEffect(() => {
    setMounted(true);
    const userAgent = navigator.userAgent.toLowerCase();

    // Detect device type and store in local variable for immediate use
    let detectedDeviceType: 'macos' | 'iphone' | 'android' | 'other';
    if (/iphone|ipod/.test(userAgent)) {
      detectedDeviceType = 'iphone';
      setDeviceType('iphone');
    } else if (/android/.test(userAgent)) {
      detectedDeviceType = 'android';
      setDeviceType('android');
    } else if (/macintosh|mac os x|ipad/.test(userAgent)) {
      detectedDeviceType = 'macos';
      setDeviceType('macos');
    } else {
      detectedDeviceType = 'other';
      setDeviceType('other');
    }

    // Preload logo video as critical asset DURING loader phase
    registerCriticalAsset('landing-logo');

    // Preload background image as critical asset
    registerCriticalAsset('landing-background');
    const backgroundImg = new Image();
    backgroundImg.src = getMediaUrl('/colored-bg-1.webp');
    backgroundImg.onload = () => {
      console.log('[🎯LOADER] Background image preloaded successfully');
      markCriticalAssetLoaded('landing-background');
    };
    backgroundImg.onerror = () => {
      console.error('[🎯LOADER] Background image preload failed');
      markCriticalAssetLoaded('landing-background'); // Mark as loaded anyway to prevent blocking
    };

    // Preload the logo video/gif based on detected device type (use local variable, not state)
    if (detectedDeviceType === 'macos' || detectedDeviceType === 'iphone') {
      // Preload GIF
      const logoImg = new Image();
      logoImg.src = getMediaUrl('/random-images/Everydays_4.gif');
      logoImg.onload = () => {
        console.log('[🎯LOADER] Logo GIF preloaded successfully');
        markCriticalAssetLoaded('landing-logo');
      };
      logoImg.onerror = () => {
        console.error('[🎯LOADER] Logo GIF preload failed');
        markCriticalAssetLoaded('landing-logo'); // Mark as loaded anyway to prevent blocking
      };
    } else {
      // Preload video
      const logoVideo = document.createElement('video');
      logoVideo.src = getMediaUrl('/random-images/Everydays_00000.webm');
      logoVideo.preload = 'auto';
      logoVideo.load();
      logoVideo.onloadeddata = () => {
        console.log('[🎯LOADER] Logo video preloaded successfully');
        markCriticalAssetLoaded('landing-logo');
      };
      logoVideo.onerror = () => {
        console.error('[🎯LOADER] Logo video preload failed');
        markCriticalAssetLoaded('landing-logo'); // Mark as loaded anyway to prevent blocking
      };
    }

    // Preload toggle click sounds immediately during page load (before loader finishes)
    const guardSound = new Audio(getMediaUrl('/sounds/main_click.mp3'));
    const switchSound = new Audio(getMediaUrl('/sounds/click reverb 2.mp3'));
    guardSound.preload = 'auto';
    switchSound.preload = 'auto';
    guardSound.load();
    switchSound.load();
    // Force-load by playing silently
    guardSound.volume = 0;
    switchSound.volume = 0;
    guardSound.play()
      .then(() => {
        guardSound.pause();
        guardSound.currentTime = 0;
      })
      .catch(() => {});
    switchSound.play()
      .then(() => {
        switchSound.pause();
        switchSound.currentTime = 0;
      })
      .catch(() => {});
  }, [registerCriticalAsset, markCriticalAssetLoaded]);

  // Wait for Universal Loader to finish, THEN start entrance sequence
  useEffect(() => {
    if (mounted && !isLoading && !entranceStarted) {
      setEntranceStarted(true);

      if (isMobileResume) {
        // MOBILE RESUME: Skip animations, show everything immediately
        console.log('[🔐RESUME] Skipping entrance animations for mobile resume');
        setShowLightbox(true);
        setBackgroundFadedIn(true);
        setRevealStarted(true);
        setShowFooter(true);
      } else {
        // Normal flow: Initial entrance sequence
        // 1. Lightbox (darkening layer) fades in first
        setTimeout(() => setShowLightbox(true), 100);
        // 2. Background fades in 500ms later (after darkening layer is established)
        setTimeout(() => setBackgroundFadedIn(true), 600);
      }
    }
  }, [mounted, isLoading, entranceStarted, isMobileResume]);

  // Logo fades simultaneously with stars (no delay)
  const logoDelay = 0;
  // Content wave starts 4 seconds after logo begins
  const contentDelay = 4000;

  // Trigger reveal animations when entering REVEAL state
  useEffect(() => {
    if (isState('REVEAL') && !revealStarted) {
      // Mobile resume already set revealStarted in entrance sequence
      if (isMobileResume) {
        console.log('[🔐RESUME] Mobile resume - animations already instant');
        // Don't start audio automatically for mobile resume (wallet browser context)
        return;
      }

      console.log('[🎵PAGE] Entering REVEAL state');

      // Small delay before starting reveal to ensure logo/stars render with opacity: 0 first
      // This prevents the transition from being skipped in production builds
      setTimeout(() => {
        setRevealStarted(true);
        console.log('[🎵PAGE] revealStarted set to true, transitions beginning');
      }, 50);

      // Start audio after a brief delay (during the reveal)
      setTimeout(() => {
        console.log('[🎵PAGE] Calling startAudio from REVEAL state...');
        startAudio();
      }, 500);

      // Footer fades in simultaneously with Phase 4
      // Content delay: 4000ms + last phase start: 1650ms = 5650ms
      const footerDelay = contentDelay + 1650;
      setTimeout(() => {
        setShowFooter(true);
      }, footerDelay);
    }
  }, [currentState, revealStarted, startAudio, isState, isMobileResume]);

  const isRevealing = isState('REVEAL');

  // Background opacity: 0 → 0.3 (initial fade) → 1.0 (reveal)
  // Ensure we start at 0 until loader finishes and entrance begins
  const backgroundOpacity = !mounted || !entranceStarted ? 0 : (
    isState('SOUND_SELECTION')
      ? (backgroundFadedIn ? 0.17 : 0)
      : 0.77
  );
  const showSpeaker = isRevealing && mounted;

  return (
    <LandingContainer
      backgroundOpacity={backgroundOpacity}
      showFooter={showFooter}
      transitionDuration={isState('SOUND_SELECTION') ? 1000 : 2000}
      allowScroll={true}
      isLoading={isLoading || !mounted}
    >
      <SoundSelectionState
        isActive={isState('SOUND_SELECTION')}
        onComplete={next}
        onAudioStart={startAudio}
        shouldShow={entranceStarted && showLightbox}
      />

      {/* Stars - fade in simultaneously with background */}
      {isRevealing && (
        <div
          className="transition-opacity ease-out"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: revealStarted ? 1 : 0,
            transitionDuration: `${TIMINGS.starsFade}ms`,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <StarField />
        </div>
      )}

      {/* Logo - fade in after stars complete */}
      {/* HYDRATION FIX: Only render device-specific content after mounted to prevent SSR mismatch */}
      {isRevealing && mounted && (
        <div
          className="transition-opacity"
          style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: (deviceType === 'iphone' || deviceType === 'android')
              ? logoPositionMobile
              : logoPositionDesktop,
            opacity: revealStarted ? 1 : 0,
            zIndex: 100,
            transitionDuration: `${TIMINGS.logoFade}ms`,
            transitionDelay: `${logoDelay}ms`,
            transitionTimingFunction: 'ease-in-out',
          }}
        >
          {deviceType === 'macos' || deviceType === 'iphone' ? (
            <img
              src={getMediaUrl('/random-images/Everydays_4.gif')}
              alt="Mek Tycoon Logo"
              className={deviceType === 'iphone' ? 'max-w-[80vw] max-h-[80vh] object-contain' : 'landing-logo max-w-[40vw] max-h-[40vh] object-contain'}
              style={deviceType === 'iphone' ? { transform: 'scale(1.0125)' } : {}}
              onLoad={() => {
                console.log('[⭐LANDING] Logo GIF loaded successfully');
              }}
              onError={() => {
                console.error('[⭐LANDING] Logo GIF failed to load!');
              }}
            />
          ) : (
            <video
              autoPlay
              loop
              muted
              playsInline
              disablePictureInPicture
              disableRemotePlayback
              controlsList="nodownload noplaybackrate nofullscreen"
              translate="no"
              data-edge-enhance="false"
              className={deviceType === 'android' ? 'max-w-[80vw] max-h-[80vh] object-contain' : 'landing-logo max-w-[40vw] max-h-[40vh] object-contain'}
              style={deviceType === 'android' ? {
                transform: 'scale(1.0125)',
                willChange: 'auto', // Don't hint GPU about changes, video already GPU-accelerated
              } : {
                willChange: 'auto',
              }}
              onLoadedData={() => {
                console.log('[⭐LANDING] Logo video loaded successfully');
              }}
              onError={() => {
                console.error('[⭐LANDING] Logo video failed to load!');
              }}
            >
              <source src={getMediaUrl('/random-images/Everydays_00000.webm')} type="video/webm" />
            </video>
          )}
        </div>
      )}

      {/* Final content - starts after logo completes + pause */}
      <FinalContentState
        isActive={isRevealing}
        phaseCards={phaseCards}
        startDelay={isMobileResume ? 0 : contentDelay}
        skipAnimations={isMobileResume}
        onPlayClickSound={playClickSound}
      />

      <SpeakerButton
        isPlaying={audioPlaying}
        onClick={() => {
          playClickSound();
          toggleAudio();
        }}
        isVisible={showSpeaker}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes speakerFadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }

          /* iPad Mini - 20% smaller logo */
          @media (width: 744px) and (height: 1133px),
                 (width: 1133px) and (height: 744px) {
            .landing-logo {
              max-width: 32vw !important;
              max-height: 32vh !important;
            }
          }
        `
      }} />
    </LandingContainer>
  );
}
