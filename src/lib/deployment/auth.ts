import { NextRequest, NextResponse } from 'next/server';

/**
 * Deployment API Authentication
 *
 * Security: These APIs perform destructive operations (git reset, force push, etc.)
 * and must be protected from unauthorized access.
 *
 * Authentication modes:
 * 1. Development (localhost): Allowed without API key
 * 2. Production: Requires DEPLOYMENT_API_SECRET env var and matching header
 */

const ALLOWED_LOCALHOST = ['127.0.0.1', '::1', 'localhost', '::ffff:127.0.0.1'];

export function checkDeploymentAuth(request: NextRequest): NextResponse | null {
  // Get client IP from headers (Next.js sets these)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const host = request.headers.get('host') || '';

  // Parse first IP from forwarded-for (could be comma-separated)
  const clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || '';

  // Check if request is from localhost
  const isLocalhost = ALLOWED_LOCALHOST.includes(clientIp) ||
                      host.startsWith('localhost:') ||
                      host === 'localhost';

  // In development or localhost, allow access
  if (process.env.NODE_ENV === 'development' || isLocalhost) {
    return null; // null means authorized
  }

  // In production, require API key
  const apiKey = request.headers.get('x-deployment-api-key');
  const expectedKey = process.env.DEPLOYMENT_API_SECRET;

  if (!expectedKey) {
    // No secret configured - block all production access
    return NextResponse.json(
      { success: false, error: 'Deployment API not configured for production access' },
      { status: 403 }
    );
  }

  if (apiKey !== expectedKey) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Invalid or missing API key' },
      { status: 401 }
    );
  }

  return null; // Authorized
}
