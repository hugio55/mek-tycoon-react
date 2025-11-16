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
      // Description starts first
      const descTimer = setTimeout(() => setShowDescription(true), startDelay);

      // Button starts shortly after description (200ms gap)
      const buttonTimer = setTimeout(() => setShowButton(true), startDelay + 200);

      // Phases cascade in quick succession (200ms apart each)
      const phase1Timer = setTimeout(() => setShowPhases(1), startDelay + 400);
      const phase2Timer = setTimeout(() => setShowPhases(2), startDelay + 600);
      const phase3Timer = setTimeout(() => setShowPhases(3), startDelay + 800);
      const phase4Timer = setTimeout(() => setShowPhases(4), startDelay + 1000);

      return () => {
        clearTimeout(descTimer);
        clearTimeout(buttonTimer);
        clearTimeout(phase1Timer);
        clearTimeout(phase2Timer);
        clearTimeout(phase3Timer);
        clearTimeout(phase4Timer);
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
        minHeight: 0,
        flex: '0 1 auto',
        zIndex: 10,
      }}
    >
      <div className="flex flex-col items-center" style={{ paddingTop: '1vh', paddingBottom: '0', pointerEvents: 'auto' }}>
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
