/**
 * NMKR Studio API Client
 *
 * Documentation: https://studio-api.nmkr.io/v2/docs
 * Base URL: https://studio-api.nmkr.io/v2
 */

const NMKR_API_BASE = 'https://studio-api.nmkr.io/v2';

export interface NMKRNFTState {
  uid: string;
  name: string;
  displayName: string;
  tokenname: string;
  state: 'free' | 'reserved' | 'sold'; // NMKR status enum
  ipfslink?: string;
  detaildata?: string;
  price?: number;
  priceinlovelace?: number;
}

export interface NMKRNFTDetail extends NMKRNFTState {
  projectuid: string;
  tokenhex?: string;
  nftassetid?: string;
  previewimagenhash?: string;
}

export interface NMKRProjectStats {
  projectName: string;
  nftsSold: number;
  nftsReserved: number;
  nftsFree: number;
  nftsTotal: number;
}

export interface NMKRSyncDiscrepancy {
  nftUid: string;
  nftNumber: number;
  name: string;
  nmkrStatus: 'free' | 'reserved' | 'sold';
  convexStatus: 'available' | 'reserved' | 'sold';
  nmkrSoldTo?: string; // Transaction hash or wallet from NMKR
  convexSoldTo?: string; // Stake address from Convex
}

/**
 * Fetch NFTs from NMKR project by state
 * @param projectUid - NMKR project UID
 * @param state - Filter by state: 'all', 'free', 'reserved', 'sold'
 * @param count - Number of NFTs per page (max 50)
 * @param page - Page number (1-indexed)
 */
export async function fetchNMKRNFTs(
  projectUid: string,
  state: 'all' | 'free' | 'reserved' | 'sold' = 'all',
  count: number = 50,
  page: number = 1,
  apiKey: string
): Promise<NMKRNFTState[]> {
  const url = `${NMKR_API_BASE}/GetNfts/${projectUid}/${state}/${count}/${page}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NMKR API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Fetch all NFTs from a project (handles pagination automatically)
 * Includes safety limits to prevent infinite loops
 */
export async function fetchAllProjectNFTs(
  projectUid: string,
  apiKey: string
): Promise<NMKRNFTState[]> {
  const allNFTs: NMKRNFTState[] = [];
  let page = 1;
  const pageSize = 50; // Max allowed by NMKR API is 50
  const maxPages = 2000; // Safety limit: max 100,000 NFTs

  while (page <= maxPages) {
    const nfts = await fetchNMKRNFTs(projectUid, 'all', pageSize, page, apiKey);

    if (nfts.length === 0) {
      break; // No more NFTs
    }

    allNFTs.push(...nfts);

    if (nfts.length < pageSize) {
      break; // Last page (partial results)
    }

    page++;
  }

  if (page > maxPages) {
    console.warn(`[NMKR API] Hit max page limit (${maxPages}). Some NFTs may be missing.`);
  }

  return allNFTs;
}

/**
 * Fetch detailed information about a specific NFT
 */
export async function fetchNFTDetails(
  nftUid: string,
  apiKey: string
): Promise<NMKRNFTDetail> {
  const url = `${NMKR_API_BASE}/GetNftDetails/${nftUid}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NMKR API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Get project statistics from NMKR
 */
export async function getProjectStats(
  projectUid: string,
  apiKey: string
): Promise<NMKRProjectStats> {
  // Fetch counts by state
  const [free, reserved, sold] = await Promise.all([
    fetchNMKRNFTs(projectUid, 'free', 1, 1, apiKey),
    fetchNMKRNFTs(projectUid, 'reserved', 1, 1, apiKey),
    fetchNMKRNFTs(projectUid, 'sold', 1, 1, apiKey),
  ]);

  // NMKR API doesn't return total count directly, so we need to count all NFTs
  // For now, estimate from the states
  const total = free.length + reserved.length + sold.length;

  return {
    projectName: projectUid, // Could be enhanced with actual project name
    nftsSold: sold.length,
    nftsReserved: reserved.length,
    nftsFree: free.length,
    nftsTotal: total,
  };
}

/**
 * Convert NMKR state to Convex status
 */
export function nmkrStateToConvexStatus(
  nmkrState: 'free' | 'reserved' | 'sold'
): 'available' | 'reserved' | 'sold' {
  switch (nmkrState) {
    case 'free':
      return 'available';
    case 'reserved':
      return 'reserved';
    case 'sold':
      return 'sold';
    default:
      return 'available'; // Fallback
  }
}

/**
 * Convert Convex status to NMKR state
 */
export function convexStatusToNMKRState(
  convexStatus: 'available' | 'reserved' | 'sold'
): 'free' | 'reserved' | 'sold' {
  switch (convexStatus) {
    case 'available':
      return 'free';
    case 'reserved':
      return 'reserved';
    case 'sold':
      return 'sold';
    default:
      return 'free'; // Fallback
  }
}
