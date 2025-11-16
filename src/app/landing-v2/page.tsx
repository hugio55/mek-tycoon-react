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

export default function LandingV2() {
  const [deviceType, setDeviceType] = useState<'macos' | 'iphone' | 'other'>('other');
  const [mounted, setMounted] = useState(false);
  const [revealStarted, setRevealStarted] = useState(false);

  const phaseCards = useQuery(api.phaseCards.getAllPhaseCards);
  const { currentState, next, transitionTo, isState } = useLandingStateMachine();
  const { audioPlaying, toggleAudio, startAudio } = useBackgroundAudio();

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
  }, []);

  // Trigger reveal animations when entering REVEAL state
  useEffect(() => {
    if (isState('REVEAL') && !revealStarted) {
      setRevealStarted(true);
      // Start audio after a brief delay (during the reveal)
      setTimeout(() => {
        startAudio();
      }, 500);
    }
  }, [currentState, revealStarted, startAudio, isState]);

  const isRevealing = isState('REVEAL');
  const backgroundOpacity = isState('SOUND_SELECTION') ? 0.3 : 1.0;
  const showFooter = !isState('SOUND_SELECTION');
  const showSpeaker = isRevealing;

  // Calculate when logo should appear (after stars fade completes)
  const logoDelay = TIMINGS.starsFade;
  const contentDelay = logoDelay + TIMINGS.logoFade + TIMINGS.pauseAfterLogo;

  return (
    <LandingContainer backgroundOpacity={backgroundOpacity} showFooter={showFooter}>
      <SoundSelectionState
        isActive={isState('SOUND_SELECTION')}
        onComplete={next}
        onAudioStart={startAudio}
      />

      {/* Preload assets during sound selection */}
      {isState('SOUND_SELECTION') && (
        <>
          {/* Preload StarField (hidden) */}
          <div style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}>
            <StarField />
          </div>

          {/* Preload logo video/gif (hidden) */}
          <div style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}>
            {deviceType === 'macos' || deviceType === 'iphone' ? (
              <img
                src="/random-images/Everydays_4.gif"
                alt="Preload"
              />
            ) : (
              <video autoPlay loop muted playsInline>
                <source src="/random-images/Everydays_00000.webm" type="video/webm" />
              </video>
            )}
          </div>
        </>
      )}

      {/* Stars - fade in simultaneously with background */}
      {isRevealing && (
        <div
          className="transition-opacity ease-out"
          style={{
            opacity: revealStarted ? 1 : 0,
            transitionDuration: `${TIMINGS.starsFade}ms`,
          }}
        >
          <StarField />
        </div>
      )}

      {/* Logo - fade in after stars complete */}
      {isRevealing && (
        <div
          className="absolute transition-opacity ease-out"
          style={{
            top: '50vh',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: revealStarted ? 1 : 0,
            zIndex: 20,
            transitionDuration: `${TIMINGS.logoFade}ms`,
            transitionDelay: `${logoDelay}ms`,
          }}
        >
          {deviceType === 'macos' || deviceType === 'iphone' ? (
            <img
              src="/random-images/Everydays_4.gif"
              alt="Mek Tycoon Logo"
              className={deviceType === 'iphone' ? 'max-w-[80vw] max-h-[80vh] object-contain' : 'max-w-[40vw] max-h-[40vh] object-contain'}
            />
          ) : (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="max-w-[40vw] max-h-[40vh] object-contain"
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
