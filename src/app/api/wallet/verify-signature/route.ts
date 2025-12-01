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
    const { stakeAddress, nonce, signature, walletName } = await req.json();

    if (!stakeAddress || !nonce || !signature || !walletName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify signature using Convex action
    const result = await getConvex().action(api.walletAuthentication.verifySignature, {
      stakeAddress,
      nonce,
      signature,
      walletName
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error verifying signature:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify signature' },
      { status: 500 }
    );
  }
}