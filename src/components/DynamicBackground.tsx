'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import GlobalBackground from "./GlobalBackground";
import StarField from "./StarField";
import { useState, useEffect } from "react";

/**
 * DynamicBackground - Renders the appropriate global background based on site settings
 *
 * Supports two background types:
 * - "current": The existing GlobalBackground with stars, particles, and satellites
 * - "planet": The StarField canvas animation with planet image overlay
 */
export default function DynamicBackground() {
  const siteSettings = useQuery(api.siteSettings.getSiteSettings);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userAgent = navigator.userAgent.toLowerCase();
    const mobile = /iphone|ipod|android/.test(userAgent);
    setIsMobile(mobile);
  }, []);

  // Default to current background while loading
  const backgroundType = siteSettings?.backgroundType ?? "current";

  // Use consistent values until mounted to prevent hydration mismatch
  const effectiveIsMobile = mounted ? isMobile : false;

  // Render the appropriate background based on settings
  if (backgroundType === "planet") {
    return (
      <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        {/* Background image - same as LandingContainer */}
        <div
          className="fixed inset-0 pointer-events-none transition-opacity ease-out"
          style={{
            backgroundImage: 'url(/colored-bg-1.webp)',
            backgroundSize: effectiveIsMobile ? '180%' : 'cover',
            backgroundPosition: effectiveIsMobile ? 'center calc(50% + 80px)' : 'center',
            opacity: 0.77,
            zIndex: 0,
          }}
        />

        {/* StarField - canvas-based animated starfield */}
        {mounted && <StarField />}
      </div>
    );
  }

  // Default: render the current GlobalBackground
  return <GlobalBackground />;
}
