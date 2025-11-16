'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import StarField from '@/components/StarField';

import { useLandingStateMachine } from './hooks/useLandingStateMachine';
import LandingContainer from './components/LandingContainer';
import SoundSelectionState from './components/states/SoundSelectionState';
import BackgroundRevealState from './components/states/BackgroundRevealState';
import StarsAndLogoState from './components/states/StarsAndLogoState';
import BriefPauseState from './components/states/BriefPauseState';
import FinalContentState from './components/states/FinalContentState';
import StateDebugPanel from './debug/StateDebugPanel';

export default function LandingV2() {
  const [deviceType, setDeviceType] = useState<'macos' | 'iphone' | 'other'>('other');
  const [mounted, setMounted] = useState(false);

  const phaseCards = useQuery(api.phaseCards.getAllPhaseCards);
  const { currentState, next, transitionTo, isState, isStateOrAfter } = useLandingStateMachine();

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

  const backgroundOpacity = isState('SOUND_SELECTION') ? 0.3 : 1.0;

  return (
    <LandingContainer backgroundOpacity={backgroundOpacity}>
      <SoundSelectionState
        isActive={isState('SOUND_SELECTION')}
        onComplete={next}
      />

      <BackgroundRevealState
        isActive={isState('BACKGROUND_REVEAL')}
      />

      {isStateOrAfter('STARS_AND_LOGO') && (
        <>
          <StarField />
          <StarsAndLogoState
            isActive={isStateOrAfter('STARS_AND_LOGO')}
            deviceType={deviceType}
          />
        </>
      )}

      <BriefPauseState
        isActive={isState('BRIEF_PAUSE')}
      />

      <FinalContentState
        isActive={isState('FINAL_CONTENT')}
        phaseCards={phaseCards}
      />

      {process.env.NODE_ENV === 'development' && mounted && (
        <StateDebugPanel
          currentState={currentState}
          onStateChange={transitionTo}
        />
      )}
    </LandingContainer>
  );
}
