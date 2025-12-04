/**
 * NMKR Backfill Images API Route
 *
 * Fetches NFT image URLs from NMKR and returns them for updating inventory.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchAllProjectNFTs } from '@/lib/nmkr-api';

export const dynamic = 'force-dynamic';

interface BackfillRequest {
  projectUid: string;
}

export async function POST(request: NextRequest) {
  try {
    let body: BackfillRequest;
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

    const apiKey = process.env.NMKR_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'NMKR API key not configured' },
        { status: 500 }
      );
    }

    console.log('[NMKR Backfill Images] Fetching NFTs from project:', projectUid);

    const nmkrNFTs = await fetchAllProjectNFTs(projectUid, apiKey);

    console.log(`[NMKR Backfill Images] Retrieved ${nmkrNFTs.length} NFTs`);

    // Map NFT UIDs to their IPFS image URLs
    const imageMap = nmkrNFTs
      .filter(nft => nft.ipfslink) // Only include NFTs with images
      .map(nft => ({
        nftUid: nft.uid,
        name: nft.displayName || nft.name,
        imageUrl: nft.ipfslink,
      }));

    const withImages = imageMap.length;
    const withoutImages = nmkrNFTs.length - withImages;

    console.log(`[NMKR Backfill Images] ${withImages} NFTs have images, ${withoutImages} do not`);

    return NextResponse.json({
      success: true,
      projectUid,
      total: nmkrNFTs.length,
      withImages,
      withoutImages,
      images: imageMap,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('[NMKR Backfill Images] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch images from NMKR',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
