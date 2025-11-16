import { useState, useEffect } from 'react';
import StarField from '@/components/StarField';

interface StarsAndLogoStateProps {
  isActive: boolean;
  deviceType: 'macos' | 'iphone' | 'other';
}

export default function StarsAndLogoState({ isActive, deviceType }: StarsAndLogoStateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isActive) {
      setMounted(true);
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <>
      <StarField />

      <div
        className="absolute transition-opacity duration-2000"
        style={{
          top: 'calc(40% - 100px)',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: mounted ? 1 : 0,
        }}
      >
        {deviceType === 'macos' || deviceType === 'iphone' ? (
          <img
            src="/random-images/Everydays_4.gif"
            alt="Mek Tycoon Logo"
            className={deviceType === 'iphone' ? 'max-w-[80vw] max-h-[80vh] object-contain' : 'max-w-[40vw] max-h-[40vh] object-contain'}
          />
        ) : (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="max-w-[40vw] max-h-[40vh] object-contain"
          >
            <source src="/random-images/Everydays_00000.webm" type="video/webm" />
          </video>
        )}
      </div>
    </>
  );
}
