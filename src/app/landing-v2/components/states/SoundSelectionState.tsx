import { useState } from 'react';
import { createPortal } from 'react-dom';

interface SoundSelectionStateProps {
  isActive: boolean;
  onComplete: () => void;
}

export default function SoundSelectionState({ isActive, onComplete }: SoundSelectionStateProps) {
  const [mounted, setMounted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean | null>(null);

  useState(() => {
    setMounted(true);
  });

  if (!isActive || !mounted) return null;

  const handleSoundChoice = (enabled: boolean) => {
    setSoundEnabled(enabled);
  };

  const handleProceed = () => {
    if (soundEnabled !== null) {
      onComplete();
    }
  };

  const overlay = (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div
        className="mek-card-industrial p-8 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mek-text-industrial text-2xl mb-6 text-center">
          Audio Settings
        </h2>

        <p className="text-white/70 text-center mb-8" style={{ fontFamily: 'Play, sans-serif' }}>
          Would you like to enable sound for this experience?
        </p>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => handleSoundChoice(true)}
            className={`
              flex-1 py-3 px-6 rounded-lg transition-all
              ${soundEnabled === true
                ? 'mek-button-primary'
                : 'bg-white/10 hover:bg-white/20 text-white border border-yellow-500/30'
              }
            `}
          >
            Sound On
          </button>
          <button
            onClick={() => handleSoundChoice(false)}
            className={`
              flex-1 py-3 px-6 rounded-lg transition-all
              ${soundEnabled === false
                ? 'mek-button-primary'
                : 'bg-white/10 hover:bg-white/20 text-white border border-yellow-500/30'
              }
            `}
          >
            Sound Off
          </button>
        </div>

        <button
          onClick={handleProceed}
          disabled={soundEnabled === null}
          className={`
            w-full py-3 px-6 rounded-lg transition-all
            ${soundEnabled !== null
              ? 'mek-button-secondary hover:scale-105'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
            }
          `}
        >
          Proceed
        </button>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
