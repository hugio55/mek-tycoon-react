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
    // Log everything about the error to understand its structure
    console.error('[🎮BETA-API] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.log('[🎮BETA-API] Error keys:', error ? Object.keys(error) : 'null');
    console.log('[🎮BETA-API] Error message:', error?.message);
    console.log('[🎮BETA-API] Error data:', error?.data);
    console.log('[🎮BETA-API] Error toString:', error?.toString?.());

    let errorMessage = 'Failed to submit signup';

    // Try multiple ways to extract the error message
    if (error?.data?.message) {
      // Convex often puts the actual message in data.message
      errorMessage = error.data.message;
    } else if (error?.message) {
      errorMessage = error.message;
      // Try to extract from "[Request ID: xxx] Actual message" format
      const convexMatch = errorMessage.match(/\[Request ID: [^\]]+\]\s*(.+)/);
      if (convexMatch && convexMatch[1] !== 'Server Error') {
        errorMessage = convexMatch[1];
      }
    }

    // If we still have generic "Server Error", try to get more info
    if (errorMessage === 'Server Error' || errorMessage.includes('Server Error')) {
      // Check if there's more detail in the error
      if (error?.data) {
        errorMessage = typeof error.data === 'string' ? error.data : JSON.stringify(error.data);
      }
    }

    console.log('[🎮BETA-API] Final error message:', errorMessage);

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
