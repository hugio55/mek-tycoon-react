'use client';

import { useState, useEffect } from 'react';
import StarField from '@/components/StarField';

export default function LandingV2() {
  const [isAppleDevice, setIsAppleDevice] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Detect Apple devices (macOS, iOS, iPadOS)
    const userAgent = navigator.userAgent.toLowerCase();
    const isApple = /macintosh|mac os x|iphone|ipad|ipod/.test(userAgent);
    setIsAppleDevice(isApple);
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black"
      style={{
        margin: 0,
        padding: 0,
        width: '100vw',
        height: '100vh',
      }}
    >
      <StarField />

      {/* Background Image - Planet */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/colored-bg-1.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          zIndex: 0,
        }}
      />

      {/* Logo Video/GIF - Centered */}
      {mounted && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 10 }}
        >
          {isAppleDevice ? (
            <img
              src="/random-images/logo GIF.gif"
              alt="Mek Tycoon Logo"
              className="max-w-[80vw] max-h-[80vh] object-contain"
            />
          ) : (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="max-w-[80vw] max-h-[80vh] object-contain"
            >
              <source src="/random-images/Everydays_00000.webm" type="video/webm" />
            </video>
          )}
        </div>
      )}
    </div>
  );
}
