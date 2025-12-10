/**
 * NMKR Fetch NFTs API Route
 *
 * Fetches NFTs from NMKR project and returns them formatted for inventory population.
 * Note: GetNfts endpoint doesn't return ipfslink, so we call GetNftDetails for each NFT.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchAllProjectNFTs, fetchNFTDetails } from '@/lib/nmkr-api';

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

    console.log('[NMKR Fetch NFTs] Fetching NFT list from project:', projectUid);

    // Step 1: Get list of all NFTs (doesn't include ipfslink)
    const nmkrNFTs = await fetchAllProjectNFTs(projectUid, apiKey);
    console.log(`[NMKR Fetch NFTs] Retrieved ${nmkrNFTs.length} NFTs, fetching details for each...`);

    // Step 2: Fetch details for each NFT to get ipfslink
    // Process in batches to avoid overwhelming the API
    const batchSize = 5;
    const nfts: Array<{
      nftUid: string;
      nftNumber: number;
      name: string;
      imageUrl?: string;
      state: string;
    }> = [];

    for (let i = 0; i < nmkrNFTs.length; i += batchSize) {
      const batch = nmkrNFTs.slice(i, i + batchSize);

      const detailsPromises = batch.map(async (nft, batchIndex) => {
        const name = nft.displayName || nft.name;

        // Try to extract number from name (e.g., "Lab Rat #1" -> 1)
        const numberMatch = name.match(/#(\d+)/);
        const nftNumber = numberMatch ? parseInt(numberMatch[1], 10) : i + batchIndex + 1;

        try {
          const details = await fetchNFTDetails(nft.uid, apiKey);
          const det = details as any;

          // Try multiple sources for image URL (NMKR uses various field names)
          let imageUrl = det.ipfslink || det.ipfsLink || det.ipfsGatewayAddress;

          // Fallback 1: gatewayLink
          if (!imageUrl && (det.gatewayLink || det.gatewaylink)) {
            imageUrl = det.gatewayLink || det.gatewaylink;
          }

          // Fallback 2: metadata.image (CIP-25 standard)
          if (!imageUrl && det.metadata?.image) {
            imageUrl = det.metadata.image;
            if (imageUrl.startsWith('ipfs://')) {
              imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }
          }

          // Fallback 3: previewHash
          if (!imageUrl) {
            const hash = det.previewimagenhash || det.previewImageNftHash;
            if (hash) {
              imageUrl = `https://ipfs.io/ipfs/${hash}`;
            }
          }

          return {
            nftUid: nft.uid,
            nftNumber,
            name,
            imageUrl: imageUrl || undefined,
            state: nft.state,
          };
        } catch (error) {
          console.warn(`[NMKR Fetch NFTs] Failed to fetch details for ${nft.uid}:`, error);
          return {
            nftUid: nft.uid,
            nftNumber,
            name,
            imageUrl: undefined,
            state: nft.state,
          };
        }
      });

      const results = await Promise.all(detailsPromises);
      nfts.push(...results);

      console.log(`[NMKR Fetch NFTs] Processed ${Math.min(i + batchSize, nmkrNFTs.length)}/${nmkrNFTs.length} NFTs`);
    }

    // Sort by nftNumber
    nfts.sort((a, b) => a.nftNumber - b.nftNumber);

    const withImages = nfts.filter(n => n.imageUrl).length;
    const withoutImages = nfts.length - withImages;

    console.log(`[NMKR Fetch NFTs] Complete: ${withImages} NFTs have images, ${withoutImages} do not`);

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
