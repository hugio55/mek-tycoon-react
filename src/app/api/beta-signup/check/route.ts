import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

// Use Sturgeon (production) for beta signup checks
let convex: ConvexHttpClient | null = null;
function getConvex() {
  if (!convex) {
    const sturgeonUrl = process.env.NEXT_PUBLIC_STURGEON_URL;
    const convexUrl = sturgeonUrl || process.env.NEXT_PUBLIC_CONVEX_URL!;
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

    const result = await getConvex().query(api.betaSignups.checkStakeAddressRegistered, {
      stakeAddress,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[🎮BETA-CHECK] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check registration status' },
      { status: 500 }
    );
  }
}
