import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

// Lazy initialization to avoid build-time errors
let convex: ConvexHttpClient | null = null;
function getConvex() {
  if (!convex) {
    convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  }
  return convex;
}

export async function POST(req: NextRequest) {
  try {
    const { stakeAddress, walletName } = await req.json();

    if (!stakeAddress || !walletName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate nonce using Convex
    const result = await getConvex().mutation(api.walletAuthentication.generateNonce, {
      stakeAddress,
      walletName
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error generating nonce:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate nonce' },
      { status: 500 }
    );
  }
}