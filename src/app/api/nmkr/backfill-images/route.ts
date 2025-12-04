/**
 * NMKR Backfill Images API Route
 *
 * Fetches NFT image URLs from NMKR and returns them for updating inventory.
 * Note: GetNfts endpoint doesn't return ipfslink, so we must call GetNftDetails for each NFT.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchAllProjectNFTs, fetchNFTDetails } from '@/lib/nmkr-api';

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

    console.log('[NMKR Backfill Images] Fetching NFT list from project:', projectUid);

    // Step 1: Get list of all NFTs (doesn't include ipfslink)
    const nmkrNFTs = await fetchAllProjectNFTs(projectUid, apiKey);
    console.log(`[NMKR Backfill Images] Retrieved ${nmkrNFTs.length} NFTs, fetching details for each...`);

    // Step 2: Fetch details for each NFT to get ipfslink
    // Process in batches to avoid overwhelming the API
    const batchSize = 5;
    const imageMap: Array<{ nftUid: string; name: string; imageUrl: string }> = [];
    let withImages = 0;
    let withoutImages = 0;

    for (let i = 0; i < nmkrNFTs.length; i += batchSize) {
      const batch = nmkrNFTs.slice(i, i + batchSize);

      const detailsPromises = batch.map(async (nft) => {
        try {
          const details = await fetchNFTDetails(nft.uid, apiKey);
          return {
            uid: nft.uid,
            name: nft.displayName || nft.name,
            ipfslink: details.ipfslink,
          };
        } catch (error) {
          console.warn(`[NMKR Backfill Images] Failed to fetch details for ${nft.uid}:`, error);
          return {
            uid: nft.uid,
            name: nft.displayName || nft.name,
            ipfslink: undefined,
          };
        }
      });

      const results = await Promise.all(detailsPromises);

      for (const result of results) {
        if (result.ipfslink) {
          imageMap.push({
            nftUid: result.uid,
            name: result.name,
            imageUrl: result.ipfslink,
          });
          withImages++;
        } else {
          withoutImages++;
        }
      }

      console.log(`[NMKR Backfill Images] Processed ${Math.min(i + batchSize, nmkrNFTs.length)}/${nmkrNFTs.length} NFTs`);
    }

    console.log(`[NMKR Backfill Images] Complete: ${withImages} NFTs have images, ${withoutImages} do not`);

    return NextResponse.json({
      success: true,
      projectUid,
      total: nmkrNFTs.length,
      withImages,
      withoutImages,
      images: imageMap,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[NMKR Backfill Images] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch images from NMKR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
