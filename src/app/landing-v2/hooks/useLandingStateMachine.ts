import { useState, useCallback, useEffect } from 'react';

export type LandingState =
  | 'SOUND_SELECTION'
  | 'REVEAL';

const STATE_ORDER: LandingState[] = [
  'SOUND_SELECTION',
  'REVEAL'
];

// Choreography timing (in ms)
export const TIMINGS = {
  lightboxFade: 1500,      // Lightbox fade out
  backgroundFade: 2000,     // Background fade in (simultaneous with stars)
  starsFade: 2000,          // Stars fade in (simultaneous with background)
  logoDelay: 2000,          // Wait for stars to complete
  logoFade: 4500,           // Logo fade (slower, more gradual)
  pauseAfterLogo: 0,        // No pause - description starts immediately
  descriptionFade: 1800,    // Description animation (extra second added)
  buttonDelay: 50,          // Shorter gap between description and button
  buttonFade: 1800,         // Button animation (extra second added)
  phaseDelay: 50,           // Shorter gap between button and phases
  phaseStagger: 200,        // Delay between each phase
};

export function useLandingStateMachine() {
  const [currentState, setCurrentState] = useState<LandingState>('SOUND_SELECTION');

  useEffect(() => {
    console.log('[🎭LANDING-STATE]', {
      state: currentState,
      timestamp: new Date().toISOString(),
    });
  }, [currentState]);

  const transitionTo = useCallback((state: LandingState) => {
    setCurrentState(state);
  }, []);

  const next = useCallback(() => {
    const currentIndex = STATE_ORDER.indexOf(currentState);
    if (currentIndex < STATE_ORDER.length - 1) {
      setCurrentState(STATE_ORDER[currentIndex + 1]);
    }
  }, [currentState]);

  const isState = useCallback((state: LandingState) => {
    return currentState === state;
  }, [currentState]);

  const isStateOrAfter = useCallback((state: LandingState) => {
    const currentIndex = STATE_ORDER.indexOf(currentState);
    const targetIndex = STATE_ORDER.indexOf(state);
    return currentIndex >= targetIndex;
  }, [currentState]);

  // No automatic transitions - all choreography handled by CSS delays

  return {
    currentState,
    transitionTo,
    next,
    isState,
    isStateOrAfter,
  };
}
