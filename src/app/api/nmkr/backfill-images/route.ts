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
          // DEBUG: Log full response to see what fields are available
          console.log(`[NMKR Backfill Images] NFT ${nft.uid} details:`, JSON.stringify(details, null, 2));

          // NMKR API uses various field names for images - check all possibilities
          const det = details as any;
          return {
            uid: nft.uid,
            name: nft.displayName || nft.name,
            // Check multiple field names (NMKR uses camelCase in API responses)
            ipfslink: det.ipfslink || det.ipfsLink || det.ipfsGatewayAddress,
            gatewayLink: det.gatewayLink || det.gatewaylink,
            previewHash: det.previewimagenhash || det.previewImageNftHash || det.previewImageNfthash,
            // Also check metadata for CIP-25 standard image field
            metadataImage: det.metadata?.image,
          };
        } catch (error) {
          console.warn(`[NMKR Backfill Images] Failed to fetch details for ${nft.uid}:`, error);
          return {
            uid: nft.uid,
            name: nft.displayName || nft.name,
            ipfslink: undefined,
            gatewayLink: undefined,
            previewHash: undefined,
            metadataImage: undefined,
          };
        }
      });

      const results = await Promise.all(detailsPromises);

      for (const result of results) {
        // Try multiple sources for image URL (in order of preference)
        let imageUrl = result.ipfslink;

        // Fallback 1: gatewayLink (direct HTTP URL)
        if (!imageUrl && result.gatewayLink) {
          imageUrl = result.gatewayLink;
          console.log(`[NMKR Backfill Images] Using gatewayLink for ${result.name}: ${imageUrl}`);
        }

        // Fallback 2: metadata.image (CIP-25 standard)
        if (!imageUrl && result.metadataImage) {
          imageUrl = result.metadataImage;
          // Convert ipfs:// to https:// gateway URL if needed
          if (imageUrl.startsWith('ipfs://')) {
            imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
          }
          console.log(`[NMKR Backfill Images] Using metadata.image for ${result.name}: ${imageUrl}`);
        }

        // Fallback 3: previewHash (construct IPFS URL)
        if (!imageUrl && result.previewHash) {
          imageUrl = `https://ipfs.io/ipfs/${result.previewHash}`;
          console.log(`[NMKR Backfill Images] Using previewHash for ${result.name}: ${imageUrl}`);
        }

        if (imageUrl) {
          imageMap.push({
            nftUid: result.uid,
            name: result.name,
            imageUrl: imageUrl,
          });
          withImages++;
        } else {
          console.log(`[NMKR Backfill Images] No image found for ${result.name} (uid: ${result.uid})`);
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
