'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LandingPage from "@/app/landing/page";

/**
 * Root Page Controller
 *
 * Checks site settings to determine whether to show:
 * - Landing page facade (when landingPageEnabled = true AND on production domain)
 * - Game interface (when landingPageEnabled = false OR on localhost) - redirects to /home
 *
 * IMPORTANT: Localhost always bypasses landing page for development convenience
 */
export default function RootPageController() {
  const router = useRouter();
  const siteSettings = useQuery(api.siteSettings.getSiteSettings);
  const [mounted, setMounted] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);

  // Handle client-side mounting and check if localhost
  useEffect(() => {
    setMounted(true);
    // Check if we're on localhost (development environment)
    const hostname = window.location.hostname;
    setIsLocalhost(hostname === 'localhost' || hostname === '127.0.0.1');
  }, []);

  // Redirect to /home if landing page is disabled OR if on localhost
  useEffect(() => {
    if (mounted && siteSettings !== undefined) {
      // Always bypass landing page on localhost for development
      if (isLocalhost || !siteSettings.landingPageEnabled) {
        router.push('/home');
      }
    }
  }, [mounted, siteSettings, isLocalhost, router]);

  // Show loading state while checking settings
  if (!mounted || siteSettings === undefined) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading...</div>
      </div>
    );
  }

  // Show landing page if enabled (but NOT on localhost)
  if (siteSettings.landingPageEnabled && !isLocalhost) {
    return <LandingPage />;
  }

  // Show loading while redirecting to /home
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-yellow-400 text-xl">Redirecting to game...</div>
    </div>
  );
}
