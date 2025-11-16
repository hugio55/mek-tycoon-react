import { useState } from 'react';
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

  const handleToggle = (index: number, isLocked: boolean) => {
    if (isLocked) return;
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
          />
        );
      })}
    </div>
  );
}
