'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import StarField from '@/components/StarField';

import { useLandingStateMachine, TIMINGS } from './hooks/useLandingStateMachine';
import { useBackgroundAudio } from './hooks/useBackgroundAudio';
import LandingContainer from './components/LandingContainer';
import SoundSelectionState from './components/states/SoundSelectionState';
import FinalContentState from './components/states/FinalContentState';
import SpeakerButton from './components/SpeakerButton';
import StateDebugPanel from './debug/StateDebugPanel';
import { useLoaderContext } from '@/features/page-loader';

export default function LandingV2() {
  const { isLoading, registerCriticalAsset, markCriticalAssetLoaded } = useLoaderContext();
  const [deviceType, setDeviceType] = useState<'macos' | 'iphone' | 'other'>('other');
  const [mounted, setMounted] = useState(false);
  const [revealStarted, setRevealStarted] = useState(false);
  const [backgroundFadedIn, setBackgroundFadedIn] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [entranceStarted, setEntranceStarted] = useState(false);
  const [logoFadeComplete, setLogoFadeComplete] = useState(false);

  const phaseCards = useQuery(api.phaseCards.getAllPhaseCards);
  const { currentState, next, transitionTo, isState } = useLandingStateMachine();
  const { audioPlaying, toggleAudio, startAudio } = useBackgroundAudio();

  // Detect device type on mount
  useEffect(() => {
    setMounted(true);
    const userAgent = navigator.userAgent.toLowerCase();

    if (/iphone|ipod/.test(userAgent)) {
      setDeviceType('iphone');
    } else if (/macintosh|mac os x|ipad/.test(userAgent)) {
      setDeviceType('macos');
    } else {
      setDeviceType('other');
    }

    // Register logo as a critical asset that loader should wait for
    registerCriticalAsset('landing-logo');
  }, [registerCriticalAsset]);

  // Wait for Universal Loader to finish, THEN start entrance sequence
  useEffect(() => {
    if (mounted && !isLoading && !entranceStarted) {
      setEntranceStarted(true);

      // Initial entrance sequence
      // 1. Lightbox (darkening layer) fades in first
      setTimeout(() => setShowLightbox(true), 100);
      // 2. Background fades in 500ms later (after darkening layer is established)
      setTimeout(() => setBackgroundFadedIn(true), 600);
    }
  }, [mounted, isLoading, entranceStarted]);

  // Trigger reveal animations when entering REVEAL state
  useEffect(() => {
    if (isState('REVEAL') && !revealStarted) {
      console.log('[🎵PAGE] Entering REVEAL state, will call startAudio in 500ms');
      setRevealStarted(true);
      // Start audio after a brief delay (during the reveal)
      setTimeout(() => {
        console.log('[🎵PAGE] Calling startAudio from REVEAL state...');
        startAudio();
      }, 500);

      // Enable scrolling after logo fade completes
      // Logo starts at 0ms (no delay) and takes 4500ms to fade
      const totalLogoTime = TIMINGS.logoFade;
      setTimeout(() => {
        setLogoFadeComplete(true);
      }, totalLogoTime);
    }
  }, [currentState, revealStarted, startAudio, isState]);

  const isRevealing = isState('REVEAL');
  // Background opacity: 0 → 0.3 (initial fade) → 1.0 (reveal)
  // Ensure we start at 0 until loader finishes and entrance begins
  const backgroundOpacity = !mounted || !entranceStarted ? 0 : (
    isState('SOUND_SELECTION')
      ? (backgroundFadedIn ? 0.18 : 0)
      : 0.77
  );
  const showFooter = isRevealing; // Only show footer in REVEAL state
  const showSpeaker = isRevealing;

  // Logo fades simultaneously with stars (no delay)
  const logoDelay = 0;
  // Content wave starts 2 seconds after logo begins
  const contentDelay = 2000;

  // Show pure black until mounted
  if (!mounted) {
    return <div className="fixed inset-0 bg-black" />;
  }

  return (
    <LandingContainer
      backgroundOpacity={backgroundOpacity}
      showFooter={showFooter}
      transitionDuration={isState('SOUND_SELECTION') ? 1000 : 2000}
      allowScroll={true}
    >
      <SoundSelectionState
        isActive={isState('SOUND_SELECTION')}
        onComplete={next}
        onAudioStart={startAudio}
        shouldShow={entranceStarted && showLightbox}
      />

      {/* Preload assets */}
      {false && mounted && (
        <div style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}>
          {/* Preload background image immediately */}
          <img src="/colored-bg-1.webp" alt="Preload background" />

          {isState('SOUND_SELECTION') && (
            <>
              {/* Preload StarField */}
              <StarField />

              {/* Preload logo video/gif */}
              {deviceType === 'macos' || deviceType === 'iphone' ? (
                <img
                  src="/random-images/Everydays_4.gif"
                  alt="Preload logo"
                />
              ) : (
                <video autoPlay loop muted playsInline>
                  <source src="/random-images/Everydays_00000.webm" type="video/webm" />
                </video>
              )}
            </>
          )}
        </div>
      )}

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
      {isRevealing && (
        <div
          className="transition-opacity"
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: (deviceType === 'iphone' || (deviceType === 'other' && navigator.userAgent.toLowerCase().includes('android')))
              ? '160px'
              : 'calc(8vh + 220px)',
            opacity: revealStarted ? 1 : 0,
            zIndex: 20,
            transitionDuration: `${TIMINGS.logoFade}ms`,
            transitionDelay: `${logoDelay}ms`,
            transitionTimingFunction: 'ease-in-out',
          }}
        >
          {deviceType === 'macos' || deviceType === 'iphone' ? (
            <img
              src="/random-images/Everydays_4.gif"
              alt="Mek Tycoon Logo"
              className={deviceType === 'iphone' ? 'max-w-[80vw] max-h-[80vh] object-contain' : 'max-w-[40vw] max-h-[40vh] object-contain'}
              style={deviceType === 'iphone' ? { transform: 'scale(1.0125)' } : {}}
              onLoad={() => markCriticalAssetLoaded('landing-logo')}
            />
          ) : (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="max-w-[40vw] max-h-[40vh] object-contain"
              style={navigator.userAgent.toLowerCase().includes('android') ? { transform: 'scale(1.0125)' } : {}}
              onLoadedData={() => markCriticalAssetLoaded('landing-logo')}
            >
              <source src="/random-images/Everydays_00000.webm" type="video/webm" />
            </video>
          )}
        </div>
      )}

      {/* Final content - starts after logo completes + pause */}
      <FinalContentState
        isActive={isRevealing}
        phaseCards={phaseCards}
        startDelay={contentDelay}
      />

      <SpeakerButton
        isPlaying={audioPlaying}
        onClick={toggleAudio}
        isVisible={showSpeaker}
      />

      {process.env.NODE_ENV === 'development' && mounted && (
        <StateDebugPanel
          currentState={currentState}
          onStateChange={transitionTo}
        />
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes speakerFadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
        `
      }} />
    </LandingContainer>
  );
}
