import FillTextButton from '@/components/controls/FillTextButton';

interface JoinBetaSectionProps {
  show: boolean;
  onJoinBeta: () => void;
}

export default function JoinBetaSection({ show, onJoinBeta }: JoinBetaSectionProps) {
  return (
    <div
      className="transition-all duration-500 ease-out"
      style={{
        marginTop: '31px',
        transform: `scale(0.8) translateY(${show ? 0 : 20}px)`,
        opacity: show ? 1 : 0,
      }}
    >
      <FillTextButton
        text="join beta"
        fontFamily="Play"
        onClick={onJoinBeta}
      />
    </div>
  );
}
