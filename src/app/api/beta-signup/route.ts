import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

// Lazy initialization to avoid build-time errors
// IMPORTANT: Beta signups ALWAYS go to Sturgeon (production) regardless of environment
// This ensures all signups from localhost dev AND live site end up in production database
let convex: ConvexHttpClient | null = null;
function getConvex() {
  if (!convex) {
    // Use Sturgeon (production) for beta signups, fallback to default Convex URL
    const sturgeonUrl = process.env.NEXT_PUBLIC_STURGEON_URL;
    const convexUrl = sturgeonUrl || process.env.NEXT_PUBLIC_CONVEX_URL!;
    console.log('[🎮BETA-API] Using database:', sturgeonUrl ? 'Sturgeon (Production)' : 'Trout (Dev)');
    convex = new ConvexHttpClient(convexUrl);
  }
  return convex;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stakeAddress } = body;

    if (!stakeAddress || typeof stakeAddress !== 'string') {
      return NextResponse.json(
        { error: 'Stake address is required' },
        { status: 400 }
      );
    }

    // Extract IP address from request headers
    // Check various headers in order of preference
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') || // Cloudflare
      'unknown';

    console.log('[🎮BETA-API] Received signup from IP:', ipAddress);

    // Call Convex mutation with IP address
    const result = await getConvex().mutation(api.betaSignups.submitBetaSignup, {
      stakeAddress,
      ipAddress,
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[🎮BETA-API] Error:', error);
    console.log('[🎮BETA-API] Error type:', typeof error);
    console.log('[🎮BETA-API] Error message:', error?.message);
    console.log('[🎮BETA-API] Error data:', error?.data);

    // Extract error message from Convex error format
    // Convex errors can come in format: "[Request ID: xxx] Error message"
    let errorMessage = error instanceof Error ? error.message : 'Failed to submit signup';

    // Try to extract the actual message if it's in Convex format
    // Format: "[Request ID: xxx] Actual error message"
    const convexMatch = errorMessage.match(/\[Request ID: [^\]]+\]\s*(.+)/);
    if (convexMatch) {
      errorMessage = convexMatch[1];
    }

    // Also check error.data.message for Convex errors
    if (error?.data?.message) {
      errorMessage = error.data.message;
    }

    console.log('[🎮BETA-API] Final error message:', errorMessage);

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
