import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GeometricSpeakerIcon } from '@/components/SpeakerIcons';

interface SpeakerButtonProps {
  isPlaying: boolean;
  onClick: () => void;
  isVisible: boolean;
}

export default function SpeakerButton({ isPlaying, onClick, isVisible }: SpeakerButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isVisible || !mounted) return null;

  const button = (
    <button
      onClick={onClick}
      className={`
        fixed top-3 right-3
        transition-all ease-out
        active:scale-95
        cursor-pointer
        z-[99999]
        ${isPlaying ? 'text-white/60' : 'text-gray-700'}
      `}
      aria-label={isPlaying ? 'Mute audio' : 'Play audio'}
      style={{
        filter: isPlaying
          ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.8))'
          : 'drop-shadow(0 0 0px rgba(251, 191, 36, 0))',
        opacity: 0,
        animation: 'speakerFadeIn 4s ease-out 2s forwards',
        transition: 'filter 0.8s ease-in-out, transform 0.3s ease-out, color 0.8s ease-in-out',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.filter = isPlaying
          ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.8)) brightness(1.2)'
          : 'drop-shadow(0 0 0px rgba(251, 191, 36, 0)) brightness(1.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1.0)';
        e.currentTarget.style.filter = isPlaying
          ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.8))'
          : 'drop-shadow(0 0 0px rgba(251, 191, 36, 0))';
      }}
    >
      <GeometricSpeakerIcon size={37} isPlaying={isPlaying} />
    </button>
  );

  return createPortal(button, document.body);
}
