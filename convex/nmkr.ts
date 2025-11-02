import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * NMKR Studio API Integration
 *
 * Fetches NFT data from NMKR Studio API for sequential minting.
 * API Documentation: https://studio-api.nmkr.io/
 */

interface NMKRNft {
  uid: string;
  tokenname: string;
  displayname: string;
  state: "free" | "reserved" | "minted" | "sold";
  nftId?: string;
  ipfsLink?: string;
  price?: number;
}

interface NMKRListNftsResponse {
  nfts: NMKRNft[];
  totalCount: number;
}

// Get next available (unminted) NFT from NMKR project
export const getNextAvailableNFT = action({
  args: {
    projectId: v.string(),
  },
  handler: async (ctx, args): Promise<{
    uid: string | null;
    nftNumber: number | null;
    displayName: string | null;
    error?: string;
  }> => {
    const apiKey = process.env.NMKR_API_KEY;

    if (!apiKey) {
      console.error('[🔨NMKR] NMKR_API_KEY not found in environment variables');
      return {
        uid: null,
        nftNumber: null,
        displayName: null,
        error: 'NMKR API key not configured'
      };
    }

    const apiUrl = `https://studio-api.nmkr.io/v2/ListNfts/${args.projectId}`;

    console.log('[🔨NMKR] Fetching NFTs from NMKR Studio:', apiUrl);

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[🔨NMKR] API request failed:', response.status, errorText);
        return {
          uid: null,
          nftNumber: null,
          displayName: null,
          error: `NMKR API error: ${response.status}`
        };
      }

      const data: NMKRListNftsResponse = await response.json();

      console.log('[🔨NMKR] Fetched', data.nfts?.length || 0, 'NFTs from project');

      // Filter for unminted NFTs (state === "free")
      const availableNfts = data.nfts.filter(nft => nft.state === "free");

      if (availableNfts.length === 0) {
        console.log('[🔨NMKR] No available NFTs found (all claimed)');
        return {
          uid: null,
          nftNumber: null,
          displayName: null,
          error: 'All NFTs have been claimed'
        };
      }

      // Sort by NFT number (extract number from tokenname like "Lab Rat #1")
      const sortedNfts = availableNfts.sort((a, b) => {
        const aNum = extractNftNumber(a.tokenname || a.displayname);
        const bNum = extractNftNumber(b.tokenname || b.displayname);
        return aNum - bNum;
      });

      const nextNft = sortedNfts[0];
      const nftNumber = extractNftNumber(nextNft.tokenname || nextNft.displayname);

      console.log('[🔨NMKR] Next available NFT:', {
        uid: nextNft.uid,
        displayName: nextNft.displayname,
        tokenName: nextNft.tokenname,
        nftNumber,
        state: nextNft.state
      });

      return {
        uid: nextNft.uid,
        nftNumber,
        displayName: nextNft.displayname || nextNft.tokenname,
        error: undefined
      };

    } catch (error) {
      console.error('[🔨NMKR] Failed to fetch NFTs:', error);
      return {
        uid: null,
        nftNumber: null,
        displayName: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

// Helper function to extract NFT number from name
function extractNftNumber(name: string): number {
  // Try to extract number from formats like "Lab Rat #1", "NFT #42", etc.
  const match = name.match(/#(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }

  // Fallback: try to extract any number from the string
  const numMatch = name.match(/(\d+)/);
  if (numMatch) {
    return parseInt(numMatch[1], 10);
  }

  // Last resort: return a high number to push to end of sort
  return 999999;
}

// Verify NFT availability (check if specific NFT is still available)
export const verifyNftAvailability = action({
  args: {
    projectId: v.string(),
    nftUid: v.string(),
  },
  handler: async (ctx, args): Promise<{ available: boolean; error?: string }> => {
    const apiKey = process.env.NMKR_API_KEY;

    if (!apiKey) {
      return { available: false, error: 'NMKR API key not configured' };
    }

    const apiUrl = `https://studio-api.nmkr.io/v2/GetNft/${args.projectId}/${args.nftUid}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { available: false, error: `API error: ${response.status}` };
      }

      const nft: NMKRNft = await response.json();

      console.log('[🔨NMKR] NFT availability check:', {
        uid: nft.uid,
        state: nft.state,
        available: nft.state === "free"
      });

      return { available: nft.state === "free" };

    } catch (error) {
      console.error('[🔨NMKR] Failed to verify NFT:', error);
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

// Get project statistics (for admin dashboard)
export const getProjectStats = action({
  args: {
    projectId: v.string(),
  },
  handler: async (ctx, args): Promise<{
    totalNfts: number;
    available: number;
    minted: number;
    reserved: number;
    error?: string;
  }> => {
    const apiKey = process.env.NMKR_API_KEY;

    if (!apiKey) {
      return {
        totalNfts: 0,
        available: 0,
        minted: 0,
        reserved: 0,
        error: 'NMKR API key not configured'
      };
    }

    const apiUrl = `https://studio-api.nmkr.io/v2/ListNfts/${args.projectId}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          totalNfts: 0,
          available: 0,
          minted: 0,
          reserved: 0,
          error: `API error: ${response.status}`
        };
      }

      const data: NMKRListNftsResponse = await response.json();

      const stats = {
        totalNfts: data.nfts.length,
        available: data.nfts.filter(n => n.state === "free").length,
        minted: data.nfts.filter(n => n.state === "minted" || n.state === "sold").length,
        reserved: data.nfts.filter(n => n.state === "reserved").length,
      };

      console.log('[🔨NMKR] Project stats:', stats);

      return stats;

    } catch (error) {
      console.error('[🔨NMKR] Failed to get project stats:', error);
      return {
        totalNfts: 0,
        available: 0,
        minted: 0,
        reserved: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});
