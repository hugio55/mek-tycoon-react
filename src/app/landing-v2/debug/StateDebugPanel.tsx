import { LandingState } from '../hooks/useLandingStateMachine';

interface StateDebugPanelProps {
  currentState: LandingState;
  onStateChange: (state: LandingState) => void;
}

export default function StateDebugPanel({ currentState, onStateChange }: StateDebugPanelProps) {
  return (
    <select
      value={currentState}
      onChange={(e) => onStateChange(e.target.value as LandingState)}
      className="fixed top-2 left-2 z-[9999] text-xs bg-black/80 text-white border border-white/30 rounded px-2 py-1"
    >
      <option value="SOUND_SELECTION">Sound Selection</option>
      <option value="BACKGROUND_REVEAL">BG Reveal</option>
      <option value="STARS_AND_LOGO">Stars+Logo</option>
      <option value="BRIEF_PAUSE">Pause</option>
      <option value="FINAL_CONTENT">Final</option>
    </select>
  );
}
