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
 * - Landing page facade (when landingPageEnabled = true)
 * - Game interface (when landingPageEnabled = false) - redirects to /home
 */
export default function RootPageController() {
  const router = useRouter();
  const siteSettings = useQuery(api.siteSettings.getSiteSettings);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to /home if landing page is disabled
  useEffect(() => {
    if (mounted && siteSettings !== undefined) {
      if (!siteSettings.landingPageEnabled) {
        router.push('/home');
      }
    }
  }, [mounted, siteSettings, router]);

  // Show loading state while checking settings
  if (!mounted || siteSettings === undefined) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading...</div>
      </div>
    );
  }

  // Show landing page if enabled
  if (siteSettings.landingPageEnabled) {
    return <LandingPage />;
  }

  // Show loading while redirecting to /home
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-yellow-400 text-xl">Redirecting to game...</div>
    </div>
  );
}
