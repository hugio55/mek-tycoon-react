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
  skipAnimations?: boolean;
  onPlayClickSound?: () => void;
}

export default function FinalContentState({ isActive, phaseCards, startDelay = 0, skipAnimations = false, onPlayClickSound }: FinalContentStateProps) {
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
      if (skipAnimations) {
        // MOBILE RESUME: Show everything immediately
        console.log('[🔐RESUME] Skipping FinalContentState animations');
        setShowDescription(true);
        setShowButton(true);
        setShowPhases(4); // Show all phases immediately
        return;
      }

      // Normal flow: Description starts first
      const descTimer = setTimeout(() => setShowDescription(true), startDelay);

      // Button starts after description (400ms gap - moderate slowdown)
      const buttonTimer = setTimeout(() => setShowButton(true), startDelay + 400);

      // Phases cascade with more breathing room (350ms apart each - moderate slowdown)
      const phase1Timer = setTimeout(() => setShowPhases(1), startDelay + 600);
      const phase2Timer = setTimeout(() => setShowPhases(2), startDelay + 950);
      const phase3Timer = setTimeout(() => setShowPhases(3), startDelay + 1300);
      const phase4Timer = setTimeout(() => setShowPhases(4), startDelay + 1650);

      return () => {
        clearTimeout(descTimer);
        clearTimeout(buttonTimer);
        clearTimeout(phase1Timer);
        clearTimeout(phase2Timer);
        clearTimeout(phase3Timer);
        clearTimeout(phase4Timer);
      };
    }
  }, [isActive, startDelay, skipAnimations]);

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

        <JoinBetaSection show={showButton} onJoinBeta={() => {
          onPlayClickSound?.();
          if (isMobile) {
            setTimeout(() => setShowBetaLightbox(true), 300);
          } else {
            setShowBetaLightbox(true);
          }
        }} />

        <PhaseCardsSection phaseCards={phaseCards} showPhases={showPhases} onPlayClickSound={onPlayClickSound} />
      </div>

      <BetaSignupLightbox
        isVisible={showBetaLightbox}
        onClose={() => setShowBetaLightbox(false)}
      />
    </div>
  );
}
