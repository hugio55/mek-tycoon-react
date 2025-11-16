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
        className="flex-1 flex flex-col items-center justify-center pb-8 pt-[20vh] transition-opacity duration-1000"
        style={{
          marginTop: '130px',
          opacity: mounted ? 1 : 0,
        }}
      >
        <div className="flex items-center justify-center">
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
      </div>
    </>
  );
}
