'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MekRateLoggingRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to root page (clean URL)
    router.replace('/');
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        {/* Loading spinner */}
        <div className="w-16 h-16 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mx-auto" />
        <p className="text-yellow-500 font-['Orbitron'] uppercase tracking-wider text-sm">
          Redirecting...
        </p>
      </div>
    </div>
  );
}
