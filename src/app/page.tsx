'use client';

import RootPageController from "@/components/RootPageController";

/**
 * Root Page (/)
 *
 * This page checks the site settings to determine what to show:
 * - If landing page is enabled: Shows the landing page facade
 * - If landing page is disabled: Redirects to /home (game interface)
 *
 * The actual logic is in RootPageController component which uses Convex
 * to query the siteSettings table and conditionally render/redirect.
 */
export default function Page() {
  return <RootPageController />;
}
