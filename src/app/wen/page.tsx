'use client';

import { useState, useEffect } from 'react';
import GeneratingLoader from '@/components/loaders/GeneratingLoader';

const LIGHT_CYAN_SCHEME = {
  name: 'Light Cyan',
  primary: '#00d9ff',
  secondary: '#0284c7',
  tertiary: '#38bdf8',
  accent: '#7dd3fc'
};

export default function MaintenancePage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Desktop: scale(2) for everything
  // Mobile: circle 25% smaller (scale 1.5), text 5% smaller (needs 1.267x compensation)
  const containerScale = isMobile ? 1.5 : 2;
  const textScale = isMobile ? 1.267 : 1;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Content floating against background */}
      <div className="text-center space-y-8">
        {/* Generating Loader - responsive scale */}
        <div className="flex items-center justify-center" style={{ transform: `scale(${containerScale})` }}>
          <GeneratingLoader
            text="Mek Tycoon is being built."
            colorScheme={LIGHT_CYAN_SCHEME}
            textScale={textScale}
          />
        </div>
        {/* Discord link */}
        <a
          href="https://discord.com/channels/938648161810006119/1422726928934113340"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/40 text-sm hover:text-white/60 transition-colors duration-300"
        >
          Join the conversation
        </a>
      </div>
    </div>
  );
}
