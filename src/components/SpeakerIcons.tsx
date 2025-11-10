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
          d="M30 18 Q36 24 30 30"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transition: 'stroke 0.8s ease-in-out, opacity 0.8s ease-in-out' }}
        />
        <path
          d="M33 14 Q42 24 33 34"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
          style={{ transition: 'stroke 0.8s ease-in-out, opacity 0.8s ease-in-out' }}
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
          d="M34 20 L38 24 L34 28"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'stroke 0.8s ease-in-out, opacity 0.8s ease-in-out' }}
        />
        <path
          d="M36 14 L42 24 L36 34"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
          style={{ transition: 'stroke 0.8s ease-in-out, opacity 0.8s ease-in-out' }}
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
