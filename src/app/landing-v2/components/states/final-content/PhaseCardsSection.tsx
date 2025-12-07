import { useState, useEffect, useRef } from 'react';
import PhaseCard from './PhaseCard';

interface PhaseCardData {
  _id: string;
  title: string;
  description?: string;
  locked: boolean;
  order: number;
}

interface PhaseCardsSectionProps {
  phaseCards: PhaseCardData[] | undefined;
  showPhases: number;
}

export default function PhaseCardsSection({ phaseCards, showPhases }: PhaseCardsSectionProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);

  // Preload the click sound on mount for instant playback
  useEffect(() => {
    const audio = new Audio('/audio/sci fi click.mp3');
    audio.preload = 'auto';
    audio.load();

    // Force-load by playing silently then pausing
    audio.volume = 0;
    audio.play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 1; // Reset volume for actual playback
        clickSoundRef.current = audio;
      })
      .catch(() => {
        // Autoplay blocked - still store ref for user-initiated playback
        audio.volume = 1;
        clickSoundRef.current = audio;
      });
  }, []);

  const playClickSound = () => {
    // Check global audio preference from localStorage
    const stored = localStorage.getItem('mek-audio-consent');
    let audioEnabled = false;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        audioEnabled = parsed.audioEnabled;
      } catch {
        // Invalid JSON, default to disabled
      }
    }

    if (audioEnabled && clickSoundRef.current) {
      clickSoundRef.current.currentTime = 0;
      clickSoundRef.current.play().catch(() => {});
    }
  };

  const handleToggle = (index: number, isLocked: boolean) => {
    if (isLocked) return;
    playClickSound();
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const displayPhases = phaseCards?.slice(0, 4) || [];

  return (
    <div className="w-full max-w-[680px] mx-auto flex flex-col gap-3 px-[20px]" style={{ marginTop: '50px', marginBottom: '30px' }}>
      {displayPhases.map((card: PhaseCardData, index: number) => {
        const isExpanded = expandedIndex === index;
        const shouldShow = index < showPhases;

        return (
          <PhaseCard
            key={card._id}
            card={card}
            index={index}
            isExpanded={isExpanded}
            shouldShow={shouldShow}
            onToggle={() => handleToggle(index, card.locked)}
            isPhaseOneExpanded={expandedIndex === 0}
          />
        );
      })}
    </div>
  );
}
