import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

// Use Sturgeon (production) for Phase I veteran checks
let convex: ConvexHttpClient | null = null;
function getConvex() {
  if (!convex) {
    const sturgeonUrl = process.env.NEXT_PUBLIC_STURGEON_URL;
    const convexUrl = sturgeonUrl || process.env.NEXT_PUBLIC_CONVEX_URL!;
    console.log('[🎖️VETERAN-API] Using database:', sturgeonUrl ? 'Sturgeon (Production)' : 'Default');
    convex = new ConvexHttpClient(convexUrl);
  }
  return convex;
}

/**
 * GET /api/phase1-veteran?stakeAddress=stake1...
 *
 * Check if a stake address belongs to a Phase I veteran
 * Returns veteran info if found, 404 if not a veteran
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const stakeAddress = url.searchParams.get('stakeAddress');

    if (!stakeAddress) {
      return NextResponse.json(
        { error: 'stakeAddress parameter required' },
        { status: 400 }
      );
    }

    console.log('[🎖️VETERAN-API] Checking veteran status for:', stakeAddress.substring(0, 20) + '...');

    const result = await getConvex().query(api.phase1Veterans.checkPhase1Veteran, {
      stakeAddress,
    });

    if (!result) {
      console.log('[🎖️VETERAN-API] Not a Phase I veteran');
      return NextResponse.json(
        { error: 'Not a Phase I veteran' },
        { status: 404 }
      );
    }

    console.log('[🎖️VETERAN-API] Phase I veteran found:', result.originalCorporationName);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[🎖️VETERAN-API] Error checking veteran status:', error);
    return NextResponse.json(
      { error: 'Failed to check veteran status' },
      { status: 500 }
    );
  }
}
