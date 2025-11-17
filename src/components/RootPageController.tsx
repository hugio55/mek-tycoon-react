'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LandingPage from "@/app/landing-v2/page";

/**
 * Root Page Controller
 *
 * Checks site settings to determine whether to show:
 * - Landing page facade (when landingPageEnabled = true)
 * - Game interface (when landingPageEnabled = false OR on localhost with bypass enabled) - redirects to /home
 *
 * IMPORTANT: By default, localhost bypasses landing page for development convenience
 * However, "Ignore Localhost Rule" toggle can force localhost to act like production for testing
 */
export default function RootPageController() {
  const router = useRouter();
  const siteSettings = useQuery(api.siteSettings.getSiteSettings);
  const [mounted, setMounted] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);

  console.log('[🏠ROOT] RootPageController render:', {
    mounted,
    siteSettings: siteSettings !== undefined ? 'loaded' : 'undefined',
    isLocalhost,
    landingPageEnabled: siteSettings?.landingPageEnabled,
    ignoreLocalhostRule: siteSettings?.ignoreLocalhostRule,
  });

  // Handle client-side mounting and check if localhost
  useEffect(() => {
    setMounted(true);
    // Check if we're on localhost (development environment)
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    setIsLocalhost(isLocal);
    console.log('[🏠ROOT] Mounted, hostname:', hostname, 'isLocalhost:', isLocal);
  }, []);

  // Redirect to /home if landing page is disabled OR if on localhost (unless ignoreLocalhostRule is true)
  useEffect(() => {
    if (mounted && siteSettings !== undefined) {
      const shouldBypassOnLocalhost = isLocalhost && !siteSettings.ignoreLocalhostRule;

      console.log('[🏠ROOT] Redirect check:', {
        landingPageEnabled: siteSettings.landingPageEnabled,
        isLocalhost,
        ignoreLocalhostRule: siteSettings.ignoreLocalhostRule,
        shouldBypassOnLocalhost,
        willRedirect: !siteSettings.landingPageEnabled || shouldBypassOnLocalhost,
      });

      // Bypass landing page if:
      // 1. Landing page is disabled globally, OR
      // 2. We're on localhost AND ignoreLocalhostRule is false (default behavior)
      if (!siteSettings.landingPageEnabled || shouldBypassOnLocalhost) {
        console.log('[🏠ROOT] Redirecting to /home');
        router.push('/home');
      }
    }
  }, [mounted, siteSettings, isLocalhost, router]);

  // Show loading state while checking settings
  if (!mounted || siteSettings === undefined) {
    console.log('[🏠ROOT] Showing loading state');
    return (
      <div className="min-h-screen bg-black flex items-center justify-center z-50 relative">
        <div className="text-yellow-400 text-xl">Loading site settings...</div>
      </div>
    );
  }

  // Show landing page if enabled AND (not on localhost OR ignoreLocalhostRule is true)
  const shouldShowLanding = siteSettings.landingPageEnabled && (!isLocalhost || siteSettings.ignoreLocalhostRule);
  console.log('[🏠ROOT] Render decision:', {
    shouldShowLanding,
    willShowLanding: shouldShowLanding,
    willShowRedirectMessage: !shouldShowLanding,
  });

  if (shouldShowLanding) {
    console.log('[🏠ROOT] Rendering LandingPage component');
    return <LandingPage />;
  }

  // Show loading while redirecting to /home
  console.log('[🏠ROOT] Showing redirect message');
  return (
    <div className="min-h-screen bg-black flex items-center justify-center z-50 relative">
      <div className="text-yellow-400 text-xl">Redirecting to game...</div>
    </div>
  );
}
