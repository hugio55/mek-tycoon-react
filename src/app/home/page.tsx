'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * TEMPORARY REDIRECT: Game interface not ready for public access
 *
 * This page redirects to the landing page until the triangle/game interface is complete.
 * The original game code has been removed but is preserved in git history.
 *
 * When ready to launch the game:
 * 1. Restore the original code from git history
 * 2. Remove this redirect logic
 * 3. Update RootPageController to re-enable the landing page toggle
 */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to root (which shows landing-v2)
    router.replace('/');
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mx-auto" />
        <p className="text-yellow-500 font-['Orbitron'] uppercase tracking-wider text-sm">
          Redirecting to landing page...
        </p>
      </div>
    </div>
  );
}
