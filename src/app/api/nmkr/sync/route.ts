/**
 * NMKR Sync API Route
 *
 * Server-side endpoint that queries NMKR API and returns NFT statuses.
 * This is necessary because the NMKR API key should not be exposed to the client.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchAllProjectNFTs, NMKRNFTState } from '@/lib/nmkr-api';

export const dynamic = 'force-dynamic'; // Disable caching

interface SyncRequest {
  projectUid: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body with error handling
    let body: SyncRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { projectUid } = body;

    if (!projectUid) {
      return NextResponse.json(
        { error: 'Missing required field: projectUid' },
        { status: 400 }
      );
    }

    // Get NMKR API key from environment
    const apiKey = process.env.NMKR_API_KEY;
    if (!apiKey) {
      console.error('[NMKR Sync API] NMKR_API_KEY not configured in environment');
      return NextResponse.json(
        { error: 'NMKR API key not configured' },
        { status: 500 }
      );
    }

    console.log('[NMKR Sync API] Fetching NFTs from NMKR project:', projectUid);

    // Fetch all NFTs from NMKR
    const nmkrNFTs = await fetchAllProjectNFTs(projectUid, apiKey);

    console.log(`[NMKR Sync API] Retrieved ${nmkrNFTs.length} NFTs from NMKR`);

    // Map NMKR data to simplified format for Convex
    const statuses = nmkrNFTs.map((nft: NMKRNFTState) => ({
      nftUid: nft.uid,
      nmkrStatus: nft.state, // 'free', 'reserved', or 'sold'
      name: nft.displayName || nft.name,
      soldTo: undefined, // NMKR API doesn't directly provide buyer wallet address
    }));

    // Calculate summary stats
    const summary = {
      total: nmkrNFTs.length,
      free: nmkrNFTs.filter((n) => n.state === 'free').length,
      reserved: nmkrNFTs.filter((n) => n.state === 'reserved').length,
      sold: nmkrNFTs.filter((n) => n.state === 'sold').length,
    };

    return NextResponse.json({
      success: true,
      projectUid,
      summary,
      statuses,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('[NMKR Sync API] Error:', error);

    // Check if it's an NMKR API error
    if (error.message?.includes('NMKR API error')) {
      return NextResponse.json(
        {
          error: 'Failed to fetch data from NMKR',
          details: error.message,
        },
        { status: 502 } // Bad Gateway - upstream API error
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Also support GET for simple health checks
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/nmkr/sync',
    method: 'POST',
    description: 'Fetch NFT statuses from NMKR Studio API',
    requiredFields: ['projectUid'],
  });
}
