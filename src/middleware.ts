import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for domain-based routing
 * Blocks access to all pages except root (/) on production
 * Allows localhost to access all pages for development
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Allow localhost/development to access everything
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return NextResponse.next();
  }

  // Game domain (play.mektycoon.com) - redirect / to /hub
  if (hostname.includes('play.')) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/hub', request.url));
    }
    return NextResponse.next();
  }

  // For all other domains (including Vercel default and mek.overexposed.io)
  // Only allow root (/) and mek-rate-logging page
  if (pathname !== '/' && pathname !== '/mek-rate-logging' && !pathname.startsWith('/_next') && !pathname.startsWith('/api') && !pathname.startsWith('/mek-images')) {
    return NextResponse.redirect(new URL('/', request.url));
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
