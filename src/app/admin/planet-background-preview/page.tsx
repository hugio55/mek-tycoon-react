"use client";

import { useState, useEffect } from "react";
import StarField from "@/components/StarField";
import { getMediaUrl } from "@/lib/media-url";

// This is an isolated full-screen preview of the Planet Background
// It renders the exact same elements as the landing page (LandingContainer + StarField)
export default function PlanetBackgroundPreviewPage() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userAgent = navigator.userAgent.toLowerCase();
    const mobile = /iphone|ipod|android/.test(userAgent);
    setIsMobile(mobile);
  }, []);

  // Use consistent values until mounted to prevent hydration mismatch
  const effectiveIsMobile = mounted ? isMobile : false;

  return (
    <div className="fixed inset-0 overflow-hidden bg-black" style={{ zIndex: 0 }}>
      {/* Background image - exact same as LandingContainer */}
      <div
        className="fixed inset-0 pointer-events-none transition-opacity ease-out"
        style={{
          backgroundImage: `url(${getMediaUrl('/colored-bg-1.webp')})`,
          backgroundSize: effectiveIsMobile ? '180%' : 'cover',
          backgroundPosition: effectiveIsMobile ? 'center calc(50% + 80px)' : 'center',
          opacity: 0.77,
          zIndex: 0,
        }}
      />

      {/* StarField - exact same component from landing page */}
      {mounted && <StarField />}

      {/* Info overlay */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-black/80 border border-yellow-500/50 rounded-lg px-6 py-3 text-center backdrop-blur-sm">
          <div className="text-yellow-400 font-bold uppercase tracking-wider text-sm mb-1">
            Planet Background Preview
          </div>
          <div className="text-gray-400 text-xs">
            StarField (120 dots + 20 streaks) | Planet Image (77% opacity)
          </div>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={() => window.close()}
        className="fixed top-6 right-6 z-50 bg-black/80 border border-yellow-500/50 rounded-lg px-4 py-2 text-yellow-400 hover:bg-yellow-500/20 transition-colors uppercase tracking-wider text-sm font-bold"
      >
        Close Preview
      </button>
    </div>
  );
}
