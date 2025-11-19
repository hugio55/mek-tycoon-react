import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Global Route Protection Middleware
 *
 * PRIORITY ORDER:
 * 1. MAINTENANCE MODE (highest) - Redirects EVERYTHING to /wen
 * 2. Localhost Bypass - Allows localhost to bypass protection (if enabled)
 * 3. Landing Page Protection - Redirects game routes to landing
 *
 * Controls access based on database settings:
 * - Maintenance Mode: Emergency nuclear option - redirects ALL routes to /wen
 * - Landing Page: When enabled, redirects all game routes to landing page (/)
 * - Localhost Bypass: When enabled, localhost can access all routes (for dev/testing)
 */

// Cache settings for 10 seconds to reduce API calls
let cachedSettings: {
  landingPageEnabled: boolean;
  localhostBypass: boolean;
  maintenanceMode: boolean;
} | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 10000; // 10 seconds

async function getSiteSettings(request: NextRequest) {
  // Return cached settings if still valid
  const now = Date.now();
  if (cachedSettings && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    // Fetch from API route
    const baseUrl = request.nextUrl.origin;
    const response = await fetch(`${baseUrl}/api/site-config`, {
      next: { revalidate: 10 } // Cache for 10 seconds
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.status}`);
    }

    const data = await response.json();
    cachedSettings = data.settings;
    cacheTimestamp = now;

    return cachedSettings;
  } catch (error) {
    console.error('[🗺️MIDDLEWARE] Error fetching settings, using safe defaults:', error);

    // Safe defaults if API fails
    return {
      landingPageEnabled: true, // Safe: show landing page
      localhostBypass: true, // Safe: allow dev work
      maintenanceMode: false, // Safe: not in maintenance
    };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Check if this is localhost
  const isLocalhost = hostname.includes('localhost') ||
                     hostname.includes('127.0.0.1') ||
                     hostname.includes('192.168.') ||
                     hostname.includes('10.0.');

  // Define special paths that might need to bypass certain protections
  const isMaintenancePage = pathname === '/wen';
  const isAdminRoute = pathname.startsWith('/admin');
  const isApiRoute = pathname.startsWith('/api');
  const isNextInternal = pathname.startsWith('/_next');
  const isPublicMedia = pathname.startsWith('/mek-images') ||
                        pathname.startsWith('/random-images') ||
                        pathname.startsWith('/audio') ||
                        pathname.startsWith('/sounds');
  const isLandingPath = pathname === '/' || pathname.startsWith('/landing-v2');

  // Always allow API routes, Next.js internal files, and public media
  if (isApiRoute || isNextInternal || isPublicMedia) {
    return NextResponse.next();
  }

  // Fetch site settings from database
  const settings = await getSiteSettings(request);

  // 🚨 PRIORITY 1: MAINTENANCE MODE (NUCLEAR OPTION)
  if (settings.maintenanceMode) {
    // Allow only maintenance page and admin routes during maintenance
    if (isMaintenancePage || isAdminRoute) {
      console.log('[🗺️MIDDLEWARE] Maintenance mode - allowing:', pathname);
      return NextResponse.next();
    }

    console.log('[🗺️MIDDLEWARE] MAINTENANCE MODE - redirecting to /wen:', pathname);
    return NextResponse.redirect(new URL('/wen', request.url));
  }

  // ⚙️ PRIORITY 2: LOCALHOST BYPASS (if enabled)
  if (isLocalhost && settings.localhostBypass) {
    console.log('[🗺️MIDDLEWARE] Localhost bypass enabled, allowing:', pathname);
    return NextResponse.next();
  }

  // 🛡️ PRIORITY 3: LANDING PAGE PROTECTION
  // Always allow landing pages and admin routes
  if (isLandingPath || isAdminRoute) {
    console.log('[🗺️MIDDLEWARE] Allowed path:', pathname);
    return NextResponse.next();
  }

  // If landing page is enabled, redirect all game routes to landing
  if (settings.landingPageEnabled) {
    console.log('[🗺️MIDDLEWARE] Landing page enabled, redirecting to /:', pathname);
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Landing page disabled - allow all routes (future state when game launches)
  console.log('[🗺️MIDDLEWARE] Landing page disabled, allowing route:', pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, videos, audio, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webm|mp4|mp3|wav|ogg|m4a)$).*)',
  ],
};
