import { LandingState } from '../hooks/useLandingStateMachine';

interface StateDebugPanelProps {
  currentState: LandingState;
  onStateChange: (state: LandingState) => void;
}

const STATE_LABELS: Record<LandingState, string> = {
  SOUND_SELECTION: 'Sound',
  BACKGROUND_REVEAL: 'BG Reveal',
  STARS_AND_LOGO: 'Stars+Logo',
  BRIEF_PAUSE: 'Pause',
  FINAL_CONTENT: 'Final',
};

export default function StateDebugPanel({ currentState, onStateChange }: StateDebugPanelProps) {
  const states: LandingState[] = [
    'SOUND_SELECTION',
    'BACKGROUND_REVEAL',
    'STARS_AND_LOGO',
    'BRIEF_PAUSE',
    'FINAL_CONTENT'
  ];

  return (
    <div className="fixed bottom-4 right-4 z-[9999] mek-card-industrial p-4 max-w-xs">
      <div className="mek-label-uppercase mb-3 text-center">
        Debug: {STATE_LABELS[currentState]}
      </div>
      <div className="flex flex-wrap gap-2">
        {states.map(state => (
          <button
            key={state}
            onClick={() => onStateChange(state)}
            className={`
              px-3 py-2 text-xs rounded transition-all
              ${currentState === state
                ? 'mek-button-primary'
                : 'mek-button-secondary hover:scale-105'
              }
            `}
          >
            {STATE_LABELS[state]}
          </button>
        ))}
      </div>
    </div>
  );
}
