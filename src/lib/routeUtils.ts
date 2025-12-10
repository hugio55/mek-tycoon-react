/**
 * Route utilities for determining public vs game routes
 * Used to conditionally show/hide features based on whether user is on public or game site
 */

export function isPublicRoute(pathname: string): boolean {
  // Public routes: Only mek-rate-logging
  // Root (/) redirects to mek-rate-logging
  return pathname === '/mek-rate-logging';
}

export function isGameRoute(pathname: string): boolean {
  // Game routes: home, profile, crafting, admin, etc.
  const gameRoutes = [
    '/home',
    '/profile',
    '/crafting',
    '/admin-master-data',
    '/admin-save',
    '/contracts',
    '/talent-builder',
    '/cirutree',
    '/story-climb',
  ];

  return gameRoutes.some(route => pathname.startsWith(route));
}

export function shouldShowGameNavigation(pathname: string): boolean {
  // Show full game navigation for game routes
  return isGameRoute(pathname);
}

export function shouldShowPublicNavigation(pathname: string): boolean {
  // Show minimal public navigation for public routes
  return isPublicRoute(pathname);
}

/**
 * Get the appropriate redirect URL based on the hostname
 * This is used in middleware to enforce domain separation
 */
export function getRedirectForHostname(hostname: string, pathname: string): string | null {
  // If on public domain (meks.mektycoon.com), only allow /mek-rate-logging
  if (hostname.includes('meks.')) {
    if (pathname !== '/mek-rate-logging') {
      return '/mek-rate-logging'; // Redirect to public page
    }
  }

  // If on game domain (play.mektycoon.com or mektycoon.com), redirect / to /home
  if (hostname.includes('play.') || hostname.includes('mektycoon.com')) {
    if (pathname === '/' || pathname === '/mek-rate-logging') {
      return '/home';
    }
  }

  return null; // No redirect needed
}
