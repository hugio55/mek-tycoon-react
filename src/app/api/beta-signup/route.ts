import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
      request.ip ||
      'unknown';

    console.log('[🎮BETA-API] Received signup from IP:', ipAddress);

    // Call Convex mutation with IP address
    const result = await convex.mutation(api.betaSignups.submitBetaSignup, {
      stakeAddress,
      ipAddress,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('[🎮BETA-API] Error:', error);

    // Pass through error messages from Convex
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit signup';

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
