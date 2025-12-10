import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

// Use Sturgeon (production) for Phase I veteran operations
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
 * POST /api/phase1-veteran/reserve-name
 *
 * Reserve or change a Phase I veteran's corporation name for Phase II
 *
 * Body:
 * {
 *   stakeAddress: string,
 *   newCorporationName: string
 * }
 *
 * SECURITY NOTE: This endpoint is called after wallet verification.
 * The frontend verifies wallet ownership via signature before calling this.
 * In production, we should store verification sessions and validate them here.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stakeAddress, newCorporationName } = body;

    if (!stakeAddress) {
      return NextResponse.json(
        { success: false, error: 'stakeAddress is required' },
        { status: 400 }
      );
    }

    if (!newCorporationName || typeof newCorporationName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'newCorporationName is required' },
        { status: 400 }
      );
    }

    const trimmedName = newCorporationName.trim();

    // Validate name length
    if (trimmedName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Corporation name must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (trimmedName.length > 30) {
      return NextResponse.json(
        { success: false, error: 'Corporation name cannot exceed 30 characters' },
        { status: 400 }
      );
    }

    console.log('[🎖️VETERAN-API] Reserving name for:', stakeAddress.substring(0, 20) + '...');
    console.log('[🎖️VETERAN-API] New corporation name:', trimmedName);

    // Call the Convex mutation to reserve the name
    const result = await getConvex().mutation(api.phase1Veterans.reserveCorporationName, {
      stakeAddress,
      newCorporationName: trimmedName,
    });

    if (!result.success) {
      console.log('[🎖️VETERAN-API] Name reservation failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    console.log('[🎖️VETERAN-API] Name reserved successfully:', trimmedName);

    return NextResponse.json({
      success: true,
      reservedName: result.reservedName,
      reservedAt: result.reservedAt,
      previousName: result.previousName,
    });
  } catch (error) {
    console.error('[🎖️VETERAN-API] Error reserving name:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reserve corporation name' },
      { status: 500 }
    );
  }
}
