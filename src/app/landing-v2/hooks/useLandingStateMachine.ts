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
  starsFade: 2000,          // Stars fade in simultaneously with background
  logoFade: 4500,           // Logo fade (slower, more gradual)
  descriptionFade: 2400,    // Description animation (moderate slowdown)
  buttonDelay: 50,          // Gap between description and button
  buttonFade: 2400,         // Button animation (moderate slowdown)
  phaseDelay: 50,           // Gap between button and phases
  phaseStagger: 350,        // Delay between each phase (moderate slowdown)
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
