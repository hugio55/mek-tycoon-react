'use client';

import { ReactNode, useEffect, useState } from 'react';
import { DemoWalletProvider } from '@/contexts/DemoWalletContext';

export function DemoModeWrapper({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    setIsDemoMode(params.get('demo') === 'true');
  }, []);

  // Always wrap in DemoWalletProvider to avoid context errors
  // Show demo mode banner only when mounted and isDemoMode is true
  return (
    <DemoWalletProvider>
      {mounted && isDemoMode && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-yellow-500/90 text-black text-center py-2 px-4 text-sm font-bold backdrop-blur-sm">
          🎭 DEMO MODE - Using mock data for UI testing
        </div>
      )}
      <div className={mounted && isDemoMode ? "pt-10" : ""}>
        {children}
      </div>
    </DemoWalletProvider>
  );
}
