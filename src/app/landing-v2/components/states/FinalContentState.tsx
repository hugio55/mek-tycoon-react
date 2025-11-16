import { useState, useEffect } from 'react';
import BetaSignupLightbox from '@/components/BetaSignupLightbox';
import { TIMINGS } from '../../hooks/useLandingStateMachine';
import SubtitleSection from './final-content/SubtitleSection';
import JoinBetaSection from './final-content/JoinBetaSection';
import PhaseCardsSection from './final-content/PhaseCardsSection';

interface PhaseCard {
  _id: string;
  title: string;
  description?: string;
  locked: boolean;
  order: number;
}

interface FinalContentStateProps {
  isActive: boolean;
  phaseCards: PhaseCard[] | undefined;
  startDelay?: number;
}

export default function FinalContentState({ isActive, phaseCards, startDelay = 0 }: FinalContentStateProps) {
  const [showDescription, setShowDescription] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showPhases, setShowPhases] = useState<number>(0);
  const [showBetaLightbox, setShowBetaLightbox] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobile = /iphone|ipod|android/.test(userAgent);
    setIsMobile(mobile);
  }, []);

  useEffect(() => {
    if (isActive) {
      const descTimer = setTimeout(() => setShowDescription(true), startDelay);
      const buttonTimer = setTimeout(() => setShowButton(true), startDelay + TIMINGS.descriptionFade + TIMINGS.buttonDelay);
      const phasesStartTimer = setTimeout(() => {
        setShowPhases(1);
        const phase2Timer = setTimeout(() => setShowPhases(2), TIMINGS.phaseStagger);
        const phase3Timer = setTimeout(() => setShowPhases(3), TIMINGS.phaseStagger * 2);
        const phase4Timer = setTimeout(() => setShowPhases(4), TIMINGS.phaseStagger * 3);
        return () => {
          clearTimeout(phase2Timer);
          clearTimeout(phase3Timer);
          clearTimeout(phase4Timer);
        };
      }, startDelay + TIMINGS.descriptionFade + TIMINGS.buttonDelay + TIMINGS.buttonFade + TIMINGS.phaseDelay);

      return () => {
        clearTimeout(descTimer);
        clearTimeout(buttonTimer);
        clearTimeout(phasesStartTimer);
      };
    }
  }, [isActive, startDelay]);

  if (!isActive) return null;

  return (
    <div
      className="flex flex-col w-full"
      style={{
        position: 'relative',
        pointerEvents: 'none',
      }}
    >
      <div className="flex flex-col items-center" style={{ paddingTop: '100px', pointerEvents: 'auto' }}>
        <SubtitleSection show={showDescription} isMobile={isMobile} />

        <JoinBetaSection show={showButton} onJoinBeta={() => setShowBetaLightbox(true)} />

        <PhaseCardsSection phaseCards={phaseCards} showPhases={showPhases} />
      </div>

      <BetaSignupLightbox
        isVisible={showBetaLightbox}
        onClose={() => setShowBetaLightbox(false)}
      />
    </div>
  );
}
