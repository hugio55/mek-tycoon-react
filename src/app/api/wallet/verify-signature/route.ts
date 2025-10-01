import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
    const result = await convex.action(api.walletAuthentication.verifySignature, {
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