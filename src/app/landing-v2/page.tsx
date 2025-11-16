'use client';

import { useState, useEffect } from 'react';
import StarField from '@/components/StarField';
import FillTextButton from '@/components/controls/FillTextButton';

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
          className="absolute inset-0 flex flex-col items-center justify-center gap-4"
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

          {/* Subtitle */}
          <p className="text-white/80 text-xs tracking-wide" style={{ fontFamily: 'Saira, sans-serif' }}>
            An epic idle strategy game where Mekanism NFTs build empires.
          </p>

          {/* Join Beta Button */}
          <div className="mt-6">
            <FillTextButton text="join beta" />
          </div>
        </div>
      )}

      {/* Liquid Glass Footer */}
      <footer
        className="absolute bottom-0 left-0 right-0 backdrop-blur-xl bg-white/10"
        style={{ zIndex: 20 }}
      >
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col items-center gap-4">
            {/* Logo */}
            <a
              href="https://www.overexposed.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-70"
            >
              <img
                src="/random-images/OE logo.png"
                alt="OE Logo"
                className="h-12 w-auto"
              />
            </a>

            {/* Social Icons */}
            <div className="flex items-center gap-6">
              {/* Discord */}
              <a
                href="https://discord.gg/KnqMF6Ayyc"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-all hover:scale-110"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>

              {/* Twitter/X */}
              <a
                href="https://x.com/Over___Exposed"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-all hover:scale-110"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* Website Globe */}
              <a
                href="https://www.overexposed.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-all hover:scale-110"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
