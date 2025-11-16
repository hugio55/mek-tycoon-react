'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import StarField from '@/components/StarField';

import { useLandingStateMachine } from './hooks/useLandingStateMachine';
import { useBackgroundAudio } from './hooks/useBackgroundAudio';
import LandingContainer from './components/LandingContainer';
import SoundSelectionState from './components/states/SoundSelectionState';
import BackgroundRevealState from './components/states/BackgroundRevealState';
import StarsAndLogoState from './components/states/StarsAndLogoState';
import BriefPauseState from './components/states/BriefPauseState';
import FinalContentState from './components/states/FinalContentState';
import SpeakerButton from './components/SpeakerButton';
import StateDebugPanel from './debug/StateDebugPanel';

export default function LandingV2() {
  const [deviceType, setDeviceType] = useState<'macos' | 'iphone' | 'other'>('other');
  const [mounted, setMounted] = useState(false);

  const phaseCards = useQuery(api.phaseCards.getAllPhaseCards);
  const { currentState, next, transitionTo, isState, isStateOrAfter } = useLandingStateMachine();
  const { audioPlaying, audioEnabled, toggleAudio, startAudio } = useBackgroundAudio();

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

  // Audio is now started directly from user interaction in SoundSelectionState
  // No automatic start needed here to avoid browser autoplay blocking

  const backgroundOpacity = isState('SOUND_SELECTION') ? 0.3 : 1.0;
  const starsOpacity = isStateOrAfter('STARS_AND_LOGO') ? 1 : 0;
  const showFooter = !isState('SOUND_SELECTION');
  const showSpeaker = isStateOrAfter('BACKGROUND_REVEAL'); // Show speaker for everyone

  return (
    <LandingContainer backgroundOpacity={backgroundOpacity} showFooter={showFooter}>
      <SoundSelectionState
        isActive={isState('SOUND_SELECTION')}
        onComplete={next}
        onAudioStart={startAudio}
      />

      <BackgroundRevealState
        isActive={isState('BACKGROUND_REVEAL')}
      />

      {isStateOrAfter('BACKGROUND_REVEAL') && (
        <div
          className="transition-opacity duration-1500 ease-out"
          style={{ opacity: starsOpacity }}
        >
          <StarField />
        </div>
      )}

      {isStateOrAfter('STARS_AND_LOGO') && (
        <StarsAndLogoState
          isActive={isStateOrAfter('STARS_AND_LOGO')}
          deviceType={deviceType}
        />
      )}

      <BriefPauseState
        isActive={isState('BRIEF_PAUSE')}
      />

      <FinalContentState
        isActive={isState('FINAL_CONTENT')}
        phaseCards={phaseCards}
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
