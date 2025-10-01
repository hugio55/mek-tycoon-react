import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for domain-based routing
 * Redirects all routes to /mek-rate-logging (for Vercel deployment)
 * Allows localhost to access all pages for development
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Allow localhost/development to access everything
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return NextResponse.next();
  }

  // Game domain (play.mektycoon.com) - redirect / to /hub, block /mek-rate-logging
  if (hostname.includes('play.')) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/hub', request.url));
    }
    // Block /mek-rate-logging on game domain
    if (pathname === '/mek-rate-logging') {
      return NextResponse.redirect(new URL('/hub', request.url));
    }
    return NextResponse.next();
  }

  // For all other domains (including Vercel default and meks.mektycoon.com)
  // Only allow /mek-rate-logging
  if (pathname !== '/mek-rate-logging' && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/mek-rate-logging', request.url));
  }

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
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
