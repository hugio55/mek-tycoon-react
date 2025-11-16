import { useEffect } from 'react';

export default function PhaseOneIndicator() {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes slideParticles {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }
      @keyframes dotPulse {
        0%, 100% {
          opacity: 0.2;
        }
        50% {
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <>
      {/* Particle slide animation */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
          animation: 'slideParticles 3s linear infinite',
          opacity: 0.6,
        }}
      />

      {/* Loading spinner (left side) */}
      <div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="4" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '0ms' }} />
          <circle cx="16.95" cy="7.05" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '125ms' }} />
          <circle cx="20" cy="12" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '250ms' }} />
          <circle cx="16.95" cy="16.95" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '375ms' }} />
          <circle cx="12" cy="20" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '500ms' }} />
          <circle cx="7.05" cy="16.95" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '625ms' }} />
          <circle cx="4" cy="12" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '750ms' }} />
          <circle cx="7.05" cy="7.05" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '875ms' }} />
        </svg>
      </div>
    </>
  );
}

export function LoadingSpinner() {
  return (
    <div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="4" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '0ms' }} />
        <circle cx="16.95" cy="7.05" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '125ms' }} />
        <circle cx="20" cy="12" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '250ms' }} />
        <circle cx="16.95" cy="16.95" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '375ms' }} />
        <circle cx="12" cy="20" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '500ms' }} />
        <circle cx="7.05" cy="16.95" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '625ms' }} />
        <circle cx="4" cy="12" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '750ms' }} />
        <circle cx="7.05" cy="7.05" r="1.5" fill="white" style={{ animation: 'dotPulse 1s ease-in-out infinite', animationDelay: '875ms' }} />
      </svg>
    </div>
  );
}
