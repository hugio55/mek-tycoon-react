import { LandingState } from '../hooks/useLandingStateMachine';

interface StateDebugPanelProps {
  currentState: LandingState;
  onStateChange: (state: LandingState) => void;
}

export default function StateDebugPanel({ currentState, onStateChange }: StateDebugPanelProps) {
  const handleResetAudioConsent = () => {
    localStorage.removeItem('mek-audio-consent');
    onStateChange('SOUND_SELECTION');
    console.log('[🎵DEBUG] Cleared audio consent and reset to SOUND_SELECTION');
  };

  return (
    <div className="fixed top-2 left-2 z-[9999] flex items-center gap-2">
      <select
        value={currentState}
        onChange={(e) => onStateChange(e.target.value as LandingState)}
        className="text-xs bg-black/80 text-white border border-white/30 rounded px-2 py-1"
      >
        <option value="SOUND_SELECTION">Sound Selection</option>
        <option value="BACKGROUND_REVEAL">BG Reveal</option>
        <option value="STARS_AND_LOGO">Stars+Logo</option>
        <option value="BRIEF_PAUSE">Pause</option>
        <option value="FINAL_CONTENT">Final</option>
      </select>

      <button
        onClick={handleResetAudioConsent}
        className="text-xs bg-yellow-500/80 hover:bg-yellow-400/80 text-black font-semibold border border-yellow-400/50 rounded px-2 py-1 transition-colors"
        title="Clear audio consent from localStorage and reset to sound selection"
      >
        Reset Audio
      </button>
    </div>
  );
}
