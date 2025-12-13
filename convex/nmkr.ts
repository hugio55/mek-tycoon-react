import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";

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

// Response from /v2/GetNfts endpoint
interface NMKRGetNftsResponse {
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

    console.log('[🔨NMKR] === NMKR API Call Starting ===');
    console.log('[🔨NMKR] Project ID:', args.projectId);
    console.log('[🔨NMKR] API Key exists:', !!apiKey);
    console.log('[🔨NMKR] API Key length:', apiKey?.length);

    if (!apiKey) {
      console.error('[🔨NMKR] ❌ NMKR_API_KEY not found in environment variables');
      return {
        uid: null,
        nftNumber: null,
        displayName: null,
        error: 'NMKR API key not configured'
      };
    }

    // NMKR API uses standard UUID format with hyphens
    console.log('[🔨NMKR] Using project ID:', args.projectId);

    // NMKR API endpoint: /v2/GetNfts/{projectId}/{state}/{count}/{page}
    // State: "free" to get only unminted/available NFTs
    // Count: 50 (max allowed by NMKR API)
    // Page: 1 (first page)
    // NOTE: Using Bearer token authentication (official NMKR API v2 standard)
    // NOTE: Project ID must be in standard UUID format with hyphens
    const apiUrl = `https://studio-api.nmkr.io/v2/GetNfts/${args.projectId}/free/50/1`;

    console.log('[🔨NMKR] 📡 Fetching NFTs from NMKR Studio:', apiUrl);

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
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

      const data: NMKRGetNftsResponse = await response.json();

      console.log('[🔨NMKR] ✅ API Response received');
      console.log('[🔨NMKR] Total NFTs in project:', data.nfts?.length || 0);
      console.log('[🔨NMKR] Total count:', data.totalCount);

      // Log state breakdown
      const stateBreakdown: Record<string, number> = {};
      data.nfts.forEach((nft: any) => {
        stateBreakdown[nft.state] = (stateBreakdown[nft.state] || 0) + 1;
      });
      console.log('[🔨NMKR] State breakdown:', stateBreakdown);

      // Filter for unminted NFTs (state === "free")
      const availableNfts = data.nfts.filter((nft: any) => nft.state === "free");

      console.log('[🔨NMKR] Available (free) NFTs:', availableNfts.length);

      if (availableNfts.length === 0) {
        console.log('[🔨NMKR] ❌ No available NFTs found (all claimed)');
        return {
          uid: null,
          nftNumber: null,
          displayName: null,
          error: 'All NFTs have been claimed'
        };
      }

      // Log first few available NFTs before sorting
      console.log('[🔨NMKR] First 3 available NFTs (unsorted):',
        availableNfts.slice(0, 3).map((n: any) => ({
          name: n.tokenname || n.displayname,
          state: n.state,
          uid: n.uid
        }))
      );

      // Sort by NFT number (extract number from tokenname like "Lab Rat #1")
      const sortedNfts = availableNfts.sort((a, b) => {
        const aNum = extractNftNumber(a.tokenname || a.displayname);
        const bNum = extractNftNumber(b.tokenname || b.displayname);
        return aNum - bNum;
      });

      // Log first few NFTs after sorting
      console.log('[🔨NMKR] First 3 NFTs (sorted):',
        sortedNfts.slice(0, 3).map((n: any) => ({
          name: n.tokenname || n.displayname,
          number: extractNftNumber(n.tokenname || n.displayname),
          state: n.state,
          uid: n.uid
        }))
      );

      const nextNft = sortedNfts[0];
      const nftNumber = extractNftNumber(nextNft.tokenname || nextNft.displayname);

      console.log('[🔨NMKR] 🎯 NEXT AVAILABLE NFT:', {
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

    // NMKR API endpoint: /v2/GetNftDetailsById/{nftuid}
    // Note: NFT UIDs don't need hyphen removal (they're already in correct format)
    const apiUrl = `https://studio-api.nmkr.io/v2/GetNftDetailsById/${args.nftUid}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
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

    // NMKR API uses standard UUID format with hyphens
    console.log('[🔨NMKR] Project stats - using project ID:', args.projectId);

    // NMKR API endpoint: /v2/GetNfts/{projectId}/{state}/{count}/{page}
    // State: "free" to get only available NFTs (for accurate stats)
    // Count: 50 (max allowed by NMKR API)
    // NOTE: Project ID must be in standard UUID format with hyphens
    const apiUrl = `https://studio-api.nmkr.io/v2/GetNfts/${args.projectId}/free/50/1`;

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
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

      const data: NMKRGetNftsResponse = await response.json();

      const stats = {
        totalNfts: data.nfts.length,
        available: data.nfts.filter((n: any) => n.state === "free").length,
        minted: data.nfts.filter((n: any) => n.state === "minted" || n.state === "sold").length,
        reserved: data.nfts.filter((n: any) => n.state === "reserved").length,
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

/**
 * NEW FUNCTIONS FOR INVENTORY SETUP
 * Added to support test page and CSV import
 */

const NMKR_API_BASE = "https://studio-api.nmkr.io";

interface NMKRProjectInfoResponse {
  projectUid: string;
  projectName: string;
  nftCount: number;
  soldCount: number;
  state: string;
}

// Fetch project information to verify project exists
export const getProjectInfo = action({
  args: {
    projectId: v.string(),
  },
  handler: async (ctx, args): Promise<NMKRProjectInfoResponse | null> => {
    const apiKey = process.env.NMKR_API_KEY;

    if (!apiKey) {
      console.error("[🔨NMKR] NMKR_API_KEY not found in environment");
      throw new Error("NMKR_API_KEY is required");
    }

    // NMKR API uses standard UUID format with hyphens
    console.log("[🔨NMKR] Fetching project info for:", args.projectId);

    try {
      const url = `${NMKR_API_BASE}/v2/GetProject/${args.projectId}`;
      console.log("[🔨NMKR] Request URL:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json",
        },
      });

      console.log("[🔨NMKR] Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[🔨NMKR] API Error:", errorText);
        return null;
      }

      const data = await response.json();
      console.log("[🔨NMKR] Project info:", data);
      return data;

    } catch (error) {
      console.error("[🔨NMKR] Failed to fetch project info:", error);
      return null;
    }
  },
});

// Fetch NFTs from NMKR project with correct authentication
export const fetchNFTsFromNMKR = action({
  args: {
    projectId: v.string(),
    state: v.optional(v.union(v.literal("free"), v.literal("sold"), v.literal("reserved"))),
    count: v.optional(v.number()),
    page: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.NMKR_API_KEY;

    if (!apiKey) {
      console.error("[🔨NMKR] NMKR_API_KEY not found in environment");
      throw new Error("NMKR_API_KEY is required");
    }

    const state = args.state || "free";
    const count = args.count || 50;
    const page = args.page || 1;

    // NMKR API uses standard UUID format with hyphens
    console.log("[🔨NMKR] Fetching NFTs:", { projectId: args.projectId, state, count, page });

    try {
      const url = `${NMKR_API_BASE}/v2/GetNfts/${args.projectId}/${state}/${count}/${page}`;
      console.log("[🔨NMKR] Request URL:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json",
        },
      });

      console.log("[🔨NMKR] Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[🔨NMKR] API Error:", errorText);
        throw new Error(`NMKR API request failed: ${response.status} ${errorText}`);
      }

      const nfts = await response.json();
      console.log("[🔨NMKR] Successfully fetched", nfts.length, "NFTs");

      return nfts;

    } catch (error) {
      console.error("[🔨NMKR] Failed to fetch NFTs:", error);
      throw error;
    }
  },
});

// Parse NMKR CSV export
interface CSVNFTRow {
  uid: string;
  name: string;
  nftNumber: string;
  state: string;
}

export const parseNMKRCSV = action({
  args: {
    csvContent: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("[🔨NMKR] Parsing NMKR CSV export");

    const lines = args.csvContent.trim().split("\n");
    const headers = lines[0].split(",").map((h: any) => h.trim().toLowerCase());

    console.log("[🔨NMKR] CSV headers:", headers);

    const nfts: CSVNFTRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");

      // NMKR CSV has: Uid, Tokenname, Displayname, State
      const uid = values[headers.indexOf("uid")] || "";
      const name = values[headers.indexOf("tokenname")] || values[headers.indexOf("displayname")] || values[headers.indexOf("name")] || "";
      const state = values[headers.indexOf("state")] || "";

      // Extract number from name like "Lab Rat #1"
      let nftNumber = "";
      const match = name.match(/#(\d+)/);
      if (match) {
        nftNumber = match[1];
      } else {
        // Fallback: try any number
        const numMatch = name.match(/(\d+)/);
        if (numMatch) {
          nftNumber = numMatch[1];
        }
      }

      const nft: CSVNFTRow = {
        uid: uid,
        name: name,
        nftNumber: nftNumber,
        state: state,
      };

      if (nft.uid) {
        nfts.push(nft);
      }
    }

    console.log("[🔨NMKR] Parsed", nfts.length, "NFTs from CSV");
    return nfts;
  },
});

/**
 * DIRECT NMKR PAYMENT CHECK - Webhook Fallback
 *
 * This action directly queries NMKR API to check if an NFT was sold.
 * Use this when webhooks fail or as a backup payment detection method.
 *
 * Flow:
 * 1. Query NMKR API for NFT details by UID
 * 2. If status is "sold", sync our inventory
 * 3. Return payment status
 */
export const checkNFTPaymentDirect = action({
  args: {
    inventoryId: v.id("commemorativeNFTInventory"),
  },
  handler: async (ctx, args): Promise<{
    isPaid: boolean;
    nmkrStatus: string | null;
    synced: boolean;
    error?: string;
    nftName?: string;
  }> => {
    const apiKey = process.env.NMKR_API_KEY;

    console.log("[🔨NMKR-DIRECT] Checking payment status for inventory:", args.inventoryId);

    if (!apiKey) {
      console.error("[🔨NMKR-DIRECT] NMKR_API_KEY not configured");
      return {
        isPaid: false,
        nmkrStatus: null,
        synced: false,
        error: "NMKR API key not configured",
      };
    }

    // Get inventory item to find NFT UID
    const inventory = await ctx.runQuery(
      api.commemorativeNFTInventorySetup.getInventoryById,
      { inventoryId: args.inventoryId }
    );

    if (!inventory) {
      console.error("[🔨NMKR-DIRECT] Inventory item not found:", args.inventoryId);
      return {
        isPaid: false,
        nmkrStatus: null,
        synced: false,
        error: "Inventory item not found",
      };
    }

    // If already sold in our database, no need to check NMKR
    if (inventory.status === "sold") {
      console.log("[🔨NMKR-DIRECT] Already marked as sold in database");
      return {
        isPaid: true,
        nmkrStatus: "sold",
        synced: true,
        nftName: inventory.name,
      };
    }

    const nftUid = inventory.nftUid;
    console.log("[🔨NMKR-DIRECT] Checking NMKR for NFT UID:", nftUid);

    try {
      // Query NMKR API for NFT details
      const url = `${NMKR_API_BASE}/v2/GetNftDetailsById/${nftUid}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[🔨NMKR-DIRECT] API Error:", response.status, errorText);
        return {
          isPaid: false,
          nmkrStatus: null,
          synced: false,
          error: `NMKR API error: ${response.status}`,
        };
      }

      const nftDetails = await response.json();
      console.log("[🔨NMKR-DIRECT] NMKR NFT status:", nftDetails.state);

      // Log full response to see what fields NMKR provides (helps debug buyer address issues)
      console.log("[🔨NMKR-DIRECT] Full NMKR response:", JSON.stringify({
        state: nftDetails.state,
        soldAddress: nftDetails.soldAddress,
        receiverAddress: nftDetails.receiverAddress,
        receiverStakeAddress: nftDetails.receiverStakeAddress,
        txHash: nftDetails.txHash,
        transactionHash: nftDetails.transactionHash,
        mintingTxHash: nftDetails.mintingTxHash,
      }));

      // If NMKR says sold, sync our inventory
      if (nftDetails.state === "sold") {
        console.log("[🔨NMKR-DIRECT] ✅ NMKR confirms SOLD! Syncing inventory...");

        // Determine the best source for buyer address (with blockchain verification)
        let verifiedBuyerAddress = inventory.reservedBy || "unknown";
        let transactionHash = "nmkr-direct-sync";

        // Extract any available data from NMKR response
        const nmkrTxHash = nftDetails.txHash || nftDetails.transactionHash || nftDetails.mintingTxHash;
        const nmkrBuyerAddress = nftDetails.receiverStakeAddress || nftDetails.soldAddress || nftDetails.receiverAddress;

        if (nmkrBuyerAddress) {
          // NMKR provided buyer address directly - use it!
          console.log("[🔨NMKR-DIRECT] ✅ NMKR provided buyer address:", nmkrBuyerAddress);
          verifiedBuyerAddress = nmkrBuyerAddress;
        }

        if (nmkrTxHash) {
          transactionHash = nmkrTxHash;
          console.log("[🔨NMKR-DIRECT] ✅ NMKR provided transaction hash:", nmkrTxHash);

          // BLOCKCHAIN VERIFICATION: Ultimate source of truth
          // If we have a transaction hash, verify the buyer on the blockchain
          try {
            console.log("[🔨NMKR-DIRECT] 🔍 Verifying buyer on blockchain...");
            const blockchainResult = await ctx.runAction(
              api.blockfrostService.verifyTransactionBuyer,
              { transactionHash: nmkrTxHash }
            );

            if (blockchainResult.success && blockchainResult.buyerStakeAddress) {
              console.log("[🔨NMKR-DIRECT] ✅✅ BLOCKCHAIN VERIFIED buyer:", blockchainResult.buyerStakeAddress);
              verifiedBuyerAddress = blockchainResult.buyerStakeAddress;
            } else {
              console.log("[🔨NMKR-DIRECT] ⚠️ Blockchain verification failed, using NMKR/reservation data");
            }
          } catch (verifyError) {
            console.error("[🔨NMKR-DIRECT] ⚠️ Blockchain verification error (using fallback):", verifyError);
            // Continue with NMKR or reservation data
          }
        }

        // Update our inventory to match NMKR with verified buyer
        try {
          await ctx.runMutation(
            api.commemorativeCampaigns.markInventoryAsSoldByUid,
            {
              nftUid: nftUid,
              transactionHash: transactionHash,
              soldTo: verifiedBuyerAddress,
            }
          );
          console.log("[🔨NMKR-DIRECT] ✅ Inventory synced successfully with buyer:", verifiedBuyerAddress);

          return {
            isPaid: true,
            nmkrStatus: "sold",
            synced: true,
            nftName: inventory.name,
          };
        } catch (syncError) {
          console.error("[🔨NMKR-DIRECT] Failed to sync inventory:", syncError);
          // Still return isPaid=true since NMKR confirmed sale
          return {
            isPaid: true,
            nmkrStatus: "sold",
            synced: false,
            error: "NMKR confirms sold but failed to sync inventory",
            nftName: inventory.name,
          };
        }
      }

      // NFT not sold on NMKR
      return {
        isPaid: false,
        nmkrStatus: nftDetails.state,
        synced: false,
        nftName: inventory.name,
      };

    } catch (error) {
      console.error("[🔨NMKR-DIRECT] Failed to check NMKR:", error);
      return {
        isPaid: false,
        nmkrStatus: null,
        synced: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
