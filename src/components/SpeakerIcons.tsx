interface SpeakerIconProps {
  size?: number;
  isPlaying: boolean;
  className?: string;
}

export const MinimalWaveIcon = ({ size = 48, isPlaying, className = '' }: SpeakerIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ transition: 'all 0.8s ease-in-out' }}
  >
    <style>
      {`
        @keyframes wavePulse1 {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes wavePulse2 {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.2; }
        }
        @keyframes wavePulse3 {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.15; }
        }
        .wave-1 { animation: wavePulse1 2.5s ease-in-out infinite; }
        .wave-2 { animation: wavePulse2 2.5s ease-in-out infinite 0.3s; }
        .wave-3 { animation: wavePulse3 2.5s ease-in-out infinite 0.6s; }
      `}
    </style>
    <circle
      cx="24" cy="24" r="20"
      stroke="currentColor"
      strokeWidth="2"
      opacity="0.3"
      style={{ transition: 'stroke 0.8s ease-in-out, opacity 0.8s ease-in-out' }}
    />
    {isPlaying ? (
      <>
        <path
          className="wave-1"
          d="M30 18 Q36 24 30 30"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transition: 'stroke 0.8s ease-in-out' }}
        />
        <path
          className="wave-2"
          d="M33 14 Q42 24 33 34"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transition: 'stroke 0.8s ease-in-out' }}
        />
        <path
          className="wave-3"
          d="M36 10 Q47 24 36 38"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transition: 'stroke 0.8s ease-in-out' }}
        />
      </>
    ) : (
      <line
        x1="30" y1="18" x2="36" y2="30"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ transition: 'stroke 0.8s ease-in-out, opacity 0.8s ease-in-out' }}
      />
    )}
    <path
      d="M12 20 L18 20 L26 14 L26 34 L18 28 L12 28 Z"
      fill="currentColor"
      style={{ transition: 'fill 0.8s ease-in-out' }}
    />
  </svg>
);

export const GeometricSpeakerIcon = ({ size = 48, isPlaying, className = '' }: SpeakerIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ transition: 'all 0.8s ease-in-out' }}
  >
    <style>
      {`
        @keyframes arrowPulse1 {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes arrowPulse2 {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 0.4; }
        }
        @keyframes arrowPulse3 {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.3; }
        }
        .arrow-1 { animation: arrowPulse1 2.5s ease-in-out infinite; }
        .arrow-2 { animation: arrowPulse2 2.5s ease-in-out infinite 0.3s; }
        .arrow-3 { animation: arrowPulse3 2.5s ease-in-out infinite 0.6s; }
      `}
    </style>
    <path
      d="M10 16 L18 16 L28 8 L28 40 L18 32 L10 32 Z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      style={{ transition: 'stroke 0.8s ease-in-out, opacity 0.8s ease-in-out' }}
    />
    {isPlaying ? (
      <>
        <path
          className="arrow-1"
          d="M32 20 L36 24 L32 28"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'stroke 0.8s ease-in-out' }}
        />
        <path
          className="arrow-2"
          d="M36 16 L42 24 L36 32"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'stroke 0.8s ease-in-out' }}
        />
        <path
          className="arrow-3"
          d="M40 12 L48 24 L40 36"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'stroke 0.8s ease-in-out' }}
        />
      </>
    ) : (
      <>
        <line
          x1="34" y1="20" x2="38" y2="28"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transition: 'stroke 0.8s ease-in-out, opacity 0.8s ease-in-out' }}
        />
        <line
          x1="38" y1="20" x2="34" y2="28"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transition: 'stroke 0.8s ease-in-out, opacity 0.8s ease-in-out' }}
        />
      </>
    )}
  </svg>
);

export const SoundBarsIcon = ({ size = 48, isPlaying, className = '' }: SpeakerIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ transition: 'all 0.8s ease-in-out' }}
  >
    <rect
      x="8" y="18" width="4" height="12"
      fill="currentColor"
      style={{ transition: 'fill 0.8s ease-in-out' }}
    />
    <rect
      x="14" y="14" width="4" height="20"
      fill="currentColor"
      style={{ transition: 'fill 0.8s ease-in-out' }}
    />
    <rect
      x="20" y="10" width="4" height="28"
      fill="currentColor"
      style={{ transition: 'fill 0.8s ease-in-out' }}
    />
    {isPlaying ? (
      <>
        <rect
          x="30" y="16" width="3" height="16"
          fill="currentColor"
          style={{ transition: 'fill 0.8s ease-in-out, opacity 0.8s ease-in-out' }}
        />
        <rect
          x="35" y="12" width="3" height="24"
          fill="currentColor"
          opacity="0.7"
          style={{ transition: 'fill 0.8s ease-in-out, opacity 0.8s ease-in-out' }}
        />
        <rect
          x="40" y="18" width="3" height="12"
          fill="currentColor"
          opacity="0.4"
          style={{ transition: 'fill 0.8s ease-in-out, opacity 0.8s ease-in-out' }}
        />
      </>
    ) : (
      <>
        <line
          x1="30" y1="18" x2="42" y2="30"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transition: 'stroke 0.8s ease-in-out' }}
        />
        <line
          x1="42" y1="18" x2="30" y2="30"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transition: 'stroke 0.8s ease-in-out' }}
        />
      </>
    )}
  </svg>
);

export const FuturisticHologramIcon = ({ size = 48, isPlaying, className = '' }: SpeakerIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ transition: 'all 0.8s ease-in-out' }}
  >
    <path
      d="M24 6 L38 14 L38 34 L24 42 L10 34 L10 14 Z"
      stroke="currentColor"
      strokeWidth="1.5"
      opacity="0.3"
      style={{ transition: 'stroke 0.8s ease-in-out, opacity 0.8s ease-in-out' }}
    />
    <path
      d="M12 18 L18 18 L26 12 L26 36 L18 30 L12 30 Z"
      fill="currentColor"
      style={{ transition: 'fill 0.8s ease-in-out' }}
    />
    {isPlaying ? (
      <>
        <path
          d="M30 20 L34 24 L30 28"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ transition: 'stroke 0.8s ease-in-out, opacity 0.8s ease-in-out' }}
        />
        <path
          d="M32 16 L38 24 L32 32"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
          style={{ transition: 'stroke 0.8s ease-in-out, opacity 0.8s ease-in-out' }}
        />
      </>
    ) : (
      <path
        d="M30 20 L34 28 M34 20 L30 28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ transition: 'stroke 0.8s ease-in-out, opacity 0.8s ease-in-out' }}
      />
    )}
  </svg>
);

export const PulseRingIcon = ({ size = 48, isPlaying, className = '' }: SpeakerIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ transition: 'all 0.8s ease-in-out' }}
  >
    {isPlaying && (
      <>
        <circle
          cx="24" cy="24" r="22"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.2"
          style={{ transition: 'stroke 0.8s ease-in-out, opacity 0.8s ease-in-out' }}
        />
        <circle
          cx="24" cy="24" r="18"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.3"
          style={{ transition: 'stroke 0.8s ease-in-out, opacity 0.8s ease-in-out' }}
        />
      </>
    )}
    <circle
      cx="24" cy="24" r="14"
      stroke="currentColor"
      strokeWidth="2"
      opacity="0.5"
      style={{ transition: 'stroke 0.8s ease-in-out, opacity 0.8s ease-in-out' }}
    />
    <path
      d="M14 20 L18 20 L24 16 L24 32 L18 28 L14 28 Z"
      fill="currentColor"
      style={{ transition: 'fill 0.8s ease-in-out' }}
    />
    {isPlaying ? (
      <path
        d="M28 20 Q32 24 28 28"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ transition: 'stroke 0.8s ease-in-out, opacity 0.8s ease-in-out' }}
      />
    ) : (
      <line
        x1="28" y1="20" x2="32" y2="28"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ transition: 'stroke 0.8s ease-in-out' }}
      />
    )}
  </svg>
);

export const SPEAKER_ICON_STYLES = [
  { id: 'minimal', name: 'Minimal Wave', component: MinimalWaveIcon },
  { id: 'geometric', name: 'Geometric', component: GeometricSpeakerIcon },
  { id: 'bars', name: 'Sound Bars', component: SoundBarsIcon },
  { id: 'hologram', name: 'Futuristic', component: FuturisticHologramIcon },
  { id: 'pulse', name: 'Pulse Ring', component: PulseRingIcon },
] as const;

export type SpeakerIconStyle = typeof SPEAKER_ICON_STYLES[number]['id'];
