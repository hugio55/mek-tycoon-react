interface BriefPauseStateProps {
  isActive: boolean;
}

export default function BriefPauseState({ isActive }: BriefPauseStateProps) {
  if (!isActive) return null;

  return null;
}
