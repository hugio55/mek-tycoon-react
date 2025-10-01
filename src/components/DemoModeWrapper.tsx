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

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  // Show demo mode banner
  if (isDemoMode) {
    return (
      <DemoWalletProvider>
        {/* Demo Mode Banner */}
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-yellow-500/90 text-black text-center py-2 px-4 text-sm font-bold backdrop-blur-sm">
          🎭 DEMO MODE - Using mock data for UI testing
        </div>
        <div className="pt-10">
          {children}
        </div>
      </DemoWalletProvider>
    );
  }

  return <>{children}</>;
}
