/**
 * NMKR Fetch NFTs API Route
 *
 * Fetches NFTs from NMKR project and returns them formatted for inventory population.
 * Includes image URLs from IPFS.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchAllProjectNFTs } from '@/lib/nmkr-api';

export const dynamic = 'force-dynamic';

interface FetchNFTsRequest {
  projectUid: string;
}

export async function POST(request: NextRequest) {
  try {
    let body: FetchNFTsRequest;
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

    console.log('[NMKR Fetch NFTs] Fetching NFTs from project:', projectUid);

    const nmkrNFTs = await fetchAllProjectNFTs(projectUid, apiKey);

    console.log(`[NMKR Fetch NFTs] Retrieved ${nmkrNFTs.length} NFTs`);

    // Map NFTs to the format needed for populateCampaignInventory
    // Extract number from name like "Lab Rat #1" -> 1
    const nfts = nmkrNFTs.map((nft, index) => {
      const name = nft.displayName || nft.name;

      // Try to extract number from name (e.g., "Lab Rat #1" -> 1)
      const numberMatch = name.match(/#(\d+)/);
      const nftNumber = numberMatch ? parseInt(numberMatch[1], 10) : index + 1;

      return {
        nftUid: nft.uid,
        nftNumber,
        name,
        imageUrl: nft.ipfslink || undefined,
        state: nft.state, // Include state for filtering if needed
      };
    });

    // Sort by nftNumber
    nfts.sort((a, b) => a.nftNumber - b.nftNumber);

    const withImages = nfts.filter(n => n.imageUrl).length;
    const withoutImages = nfts.length - withImages;

    console.log(`[NMKR Fetch NFTs] ${withImages} NFTs have images, ${withoutImages} do not`);

    return NextResponse.json({
      success: true,
      projectUid,
      total: nfts.length,
      withImages,
      withoutImages,
      nfts,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[NMKR Fetch NFTs] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch NFTs from NMKR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
