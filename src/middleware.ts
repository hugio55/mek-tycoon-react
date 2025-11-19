import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Global Route Protection Middleware
 *
 * Controls access to all routes based on landing page toggle:
 * - Landing Page ON (true): Redirect all game routes to landing page (/)
 * - Landing Page OFF (false): Allow all routes to be accessed normally
 *
 * Always allows:
 * - Landing pages (/, /landing-v2)
 * - Admin routes (/admin*)
 * - API routes (/api*)
 * - Public files (images, videos, audio, etc.)
 * - Localhost (development environment)
 */

// HARDCODED FOR NOW - Will be replaced with database query in future
const LANDING_PAGE_ENABLED = true;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Always allow localhost/development to access everything (includes LAN IPs)
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1') || hostname.includes('192.168.') || hostname.includes('10.0.')) {
    console.log('[🗺️MIDDLEWARE] Localhost detected, allowing all routes:', pathname);
    return NextResponse.next();
  }

  // Define allowed paths that should always be accessible
  const isLandingPath = pathname === '/' || pathname.startsWith('/landing-v2');
  const isAdminRoute = pathname.startsWith('/admin');
  const isApiRoute = pathname.startsWith('/api');
  const isNextInternal = pathname.startsWith('/_next');
  const isPublicMedia = pathname.startsWith('/mek-images') ||
                        pathname.startsWith('/random-images') ||
                        pathname.startsWith('/audio') ||
                        pathname.startsWith('/sounds');

  // Always allow these paths regardless of landing page toggle
  if (isLandingPath || isAdminRoute || isApiRoute || isNextInternal || isPublicMedia) {
    console.log('[🗺️MIDDLEWARE] Allowed path:', pathname);
    return NextResponse.next();
  }

  // If landing page is enabled, redirect all other routes to landing
  if (LANDING_PAGE_ENABLED) {
    console.log('[🗺️MIDDLEWARE] Landing page enabled, redirecting to /:', pathname);
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If landing page is disabled, allow all routes (future state)
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
