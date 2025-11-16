'use client';

import { useState, useEffect } from 'react';
import StarField from '@/components/StarField';

export default function LandingV2() {
  const [deviceType, setDeviceType] = useState<'macos' | 'iphone' | 'other'>('other');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();

    if (/iphone|ipod/.test(userAgent)) {
      // iPhone/iPod
      setDeviceType('iphone');
    } else if (/macintosh|mac os x|ipad/.test(userAgent)) {
      // macOS desktop/laptop or iPad
      setDeviceType('macos');
    } else {
      // Windows/Android/everything else
      setDeviceType('other');
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black">
      <StarField />

      {/* Background Image - Planet */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/colored-bg-1.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center calc(50% + 200px)',
        }}
      />

      {/* Logo Video/GIF - Centered */}
      {mounted && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 10 }}
        >
          {deviceType === 'macos' ? (
            // macOS Desktop/Laptop + iPad
            <img
              src="/random-images/Everydays_4.gif"
              alt="Mek Tycoon Logo"
              className="max-w-[40vw] max-h-[40vh] object-contain"
            />
          ) : deviceType === 'iphone' ? (
            // iPhone
            <img
              src="/random-images/logo GIF.gif"
              alt="Mek Tycoon Logo"
              className="max-w-[80vw] max-h-[80vh] object-contain"
            />
          ) : (
            // Windows/Android
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
      )}
    </div>
  );
}
