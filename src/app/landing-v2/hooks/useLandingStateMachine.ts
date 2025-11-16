import { useState, useCallback, useEffect } from 'react';

export type LandingState =
  | 'SOUND_SELECTION'
  | 'BACKGROUND_REVEAL'
  | 'STARS_AND_LOGO'
  | 'BRIEF_PAUSE'
  | 'FINAL_CONTENT';

const STATE_ORDER: LandingState[] = [
  'SOUND_SELECTION',
  'BACKGROUND_REVEAL',
  'STARS_AND_LOGO',
  'BRIEF_PAUSE',
  'FINAL_CONTENT'
];

export const TIMINGS = {
  backgroundReveal: 1500,
  starsAndLogo: 1200,
  briefPause: 500,
  finalContent: 1000
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

  useEffect(() => {
    if (currentState === 'SOUND_SELECTION') {
      return;
    }

    let timeout: NodeJS.Timeout;

    switch (currentState) {
      case 'BACKGROUND_REVEAL':
        timeout = setTimeout(() => next(), TIMINGS.backgroundReveal);
        break;
      case 'STARS_AND_LOGO':
        timeout = setTimeout(() => next(), TIMINGS.starsAndLogo);
        break;
      case 'BRIEF_PAUSE':
        timeout = setTimeout(() => next(), TIMINGS.briefPause);
        break;
    }

    return () => clearTimeout(timeout);
  }, [currentState, next]);

  return {
    currentState,
    transitionTo,
    next,
    isState,
    isStateOrAfter,
  };
}
