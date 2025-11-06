import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Campaign Sync System
 *
 * Comprehensive sync between NMKR API, local database, and Cardano blockchain.
 * Triggered on-demand by user clicking "Sync" button in Campaign Manager.
 *
 * Four main components:
 * 1. Manual Sync - Fetch current state from NMKR and update local database
 * 2. Webhook Activity Log - Display recent webhook events
 * 3. NMKR vs Database Comparison - Show discrepancies
 * 4. Blockchain Verification - Verify sold NFTs on-chain
 */

const NMKR_API_BASE = "https://studio-api.nmkr.io";

// ==========================================
// HELPER: FETCH NFTs FROM NMKR BY STATUS
// ==========================================

async function fetchNFTsFromNMKR(projectId: string, state: "free" | "reserved" | "sold") {
  // Access environment variable inside the function (Convex requirement)
  const NMKR_API_KEY = process.env.NMKR_API_KEY;

  if (!NMKR_API_KEY) {
    console.error("[SYNC] NMKR_API_KEY is undefined - environment variable not accessible");
    console.error("[SYNC] Available env vars:", Object.keys(process.env || {}));
    throw new Error("NMKR_API_KEY not configured - check Convex dashboard environment variables");
  }

  // NMKR API uses standard UUID format with hyphens
  console.log(`[SYNC] Fetching ${state} NFTs from NMKR project:`, projectId);
  console.log("[SYNC] API Key loaded successfully, length:", NMKR_API_KEY.length);

  try {
    // NMKR API expects path parameters: /v2/GetNfts/{projectId}/{state}/{count}/{page}
    // NOTE: Count must be between 1 and 50 per NMKR API validation
    // NOTE: Using Bearer token authentication (official NMKR API v2 standard)
    // NOTE: Project ID must be in standard UUID format with hyphens
    const count = 50; // Max allowed by NMKR API
    const page = 1; // First page
    const url = `${NMKR_API_BASE}/v2/GetNfts/${projectId}/${state}/${count}/${page}`;

    console.log(`[SYNC] Fetching ${state} NFTs from:`, url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NMKR_API_KEY}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SYNC] Failed to fetch ${state} NFTs:`, response.status, errorText);
      console.error("[SYNC] Request URL was:", url.replace(NMKR_API_KEY || '', '***KEY***'));
      console.error("[SYNC] Response headers:", Object.fromEntries(response.headers.entries()));

      throw new Error(`NMKR API error: ${response.status} - ${errorText}`);
    }

    const nfts = await response.json();
    console.log(`[SYNC] Found ${nfts.length} ${state} NFTs`);
    return nfts;
  } catch (error) {
    console.error(`[SYNC] Error fetching ${state} NFTs:`, error);
    throw error;
  }
}

// ==========================================
// HELPER: FETCH PROJECT STATS FROM NMKR
// ==========================================

async function fetchProjectStats(projectId: string) {
  // Access environment variable inside the function (Convex requirement)
  const NMKR_API_KEY = process.env.NMKR_API_KEY;

  if (!NMKR_API_KEY) {
    console.error("[SYNC] NMKR_API_KEY not found in environment");
    throw new Error("NMKR_API_KEY not configured");
  }

  // NMKR API uses standard UUID format with hyphens
  console.log("[SYNC] Fetching project stats from NMKR:", projectId);
  console.log("[SYNC] API Key present:", !!NMKR_API_KEY, "Length:", NMKR_API_KEY.length);

  try {
    // NOTE: Using Bearer token authentication (official NMKR API v2 standard)
    // NOTE: Project ID must be in standard UUID format with hyphens
    const url = `${NMKR_API_BASE}/v2/GetProject/${projectId}`;
    console.log("[SYNC] GET request to:", url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NMKR_API_KEY}`,
        'Accept': 'application/json',
      },
    });

    console.log("[SYNC] Response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[SYNC] Failed to fetch project stats:", errorText);
      console.error("[SYNC] Full URL was:", url.replace(NMKR_API_KEY || '', '***KEY***'));
      console.error("[SYNC] Response headers:", Object.fromEntries(response.headers.entries()));

      throw new Error(`NMKR API error: ${response.status} - ${errorText}`);
    }

    const project = await response.json();
    console.log("[SYNC] Project stats fetched successfully:", {
      name: project.projectName,
      nftCount: project.nftCount,
      soldCount: project.soldCount,
    });

    return project;
  } catch (error) {
    console.error("[SYNC] Error fetching project stats:", error);
    throw error;
  }
}

// ==========================================
// MAIN SYNC ACTION
// ==========================================

/**
 * Comprehensive sync for a campaign
 * Returns all sync results including:
 * - Manual sync updates
 * - Webhook activity log
 * - NMKR vs database comparison
 * - Blockchain verification results
 */
export const syncCampaign = internalAction({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    const syncStartTime = Date.now();
    console.log("[SYNC] Starting comprehensive campaign sync:", args.campaignId);

    try {
      // ===== STEP 1: GET CAMPAIGN DATA =====
      const campaign = await ctx.runQuery(api.commemorativeCampaigns.getCampaignById, {
        campaignId: args.campaignId,
      });

      if (!campaign) {
        throw new Error("Campaign not found");
      }

      console.log("[SYNC] Campaign:", campaign.name, "Project:", campaign.nmkrProjectId);

      // ===== STEP 2: FETCH NMKR DATA =====
      console.log("[SYNC] Fetching current state from NMKR...");

      let nmkrStats = null;
      let projectStats = null;
      let freeNFTs: any[] = [];
      let reservedNFTs: any[] = [];
      let soldNFTs: any[] = [];
      const nmkrErrors: string[] = [];

      try {
        const results = await Promise.allSettled([
          fetchProjectStats(campaign.nmkrProjectId),
          fetchNFTsFromNMKR(campaign.nmkrProjectId, "free"),
          fetchNFTsFromNMKR(campaign.nmkrProjectId, "reserved"),
          fetchNFTsFromNMKR(campaign.nmkrProjectId, "sold"),
        ]);

        // Extract results or capture errors
        if (results[0].status === "fulfilled") {
          projectStats = results[0].value;
        } else {
          nmkrErrors.push(`Failed to fetch project stats: ${results[0].reason}`);
          console.error("[SYNC] Project stats error:", results[0].reason);
        }

        if (results[1].status === "fulfilled") {
          freeNFTs = results[1].value;
        } else {
          nmkrErrors.push(`Failed to fetch free NFTs: ${results[1].reason}`);
          console.error("[SYNC] Free NFTs error:", results[1].reason);
        }

        if (results[2].status === "fulfilled") {
          reservedNFTs = results[2].value;
        } else {
          nmkrErrors.push(`Failed to fetch reserved NFTs: ${results[2].reason}`);
          console.error("[SYNC] Reserved NFTs error:", results[2].reason);
        }

        if (results[3].status === "fulfilled") {
          soldNFTs = results[3].value;
        } else {
          nmkrErrors.push(`Failed to fetch sold NFTs: ${results[3].reason}`);
          console.error("[SYNC] Sold NFTs error:", results[3].reason);
        }

        nmkrStats = {
          total: freeNFTs.length + reservedNFTs.length + soldNFTs.length,
          available: freeNFTs.length,
          reserved: reservedNFTs.length,
          sold: soldNFTs.length,
        };

        console.log("[SYNC] NMKR stats:", nmkrStats);
        if (nmkrErrors.length > 0) {
          console.warn("[SYNC] NMKR had partial failures:", nmkrErrors);
        }
      } catch (error) {
        console.error("[SYNC] Failed to fetch NMKR data:", error);
        nmkrErrors.push("Complete NMKR API failure");
        nmkrStats = { error: "NMKR API unavailable", total: 0, available: 0, reserved: 0, sold: 0 };
      }

      // ===== STEP 3: GET DATABASE STATE =====
      const inventory = await ctx.runQuery(api.commemorativeCampaigns.getCampaignInventory, {
        campaignId: args.campaignId,
      });

      const dbStats = {
        total: inventory.length,
        available: inventory.filter((nft) => nft.status === "available").length,
        reserved: inventory.filter((nft) => nft.status === "reserved").length,
        sold: inventory.filter((nft) => nft.status === "sold").length,
      };

      console.log("[SYNC] Database stats:", dbStats);

      // ===== STEP 4: COMPARE AND UPDATE DISCREPANCIES =====
      console.log("[SYNC] Comparing NMKR vs database...");

      const discrepancies = [];
      const updateActions = [];

      // Build map of NMKR NFT states by UID
      const nmkrNFTMap = new Map<string, string>();
      freeNFTs.forEach((nft: any) => nmkrNFTMap.set(nft.uid, "available"));
      reservedNFTs.forEach((nft: any) => nmkrNFTMap.set(nft.uid, "reserved"));
      soldNFTs.forEach((nft: any) => nmkrNFTMap.set(nft.uid, "sold"));
      mintedNFTs.forEach((nft: any) => nmkrNFTMap.set(nft.uid, "sold")); // Minted = sold in our system

      // Check each inventory item
      for (const inventoryItem of inventory) {
        const nmkrStatus = nmkrNFTMap.get(inventoryItem.nftUid);

        if (!nmkrStatus) {
          discrepancies.push({
            nftUid: inventoryItem.nftUid,
            nftName: inventoryItem.name,
            issue: "Not found in NMKR",
            dbStatus: inventoryItem.status,
            nmkrStatus: "not_found",
          });
          continue;
        }

        // Status mismatch?
        if (nmkrStatus !== inventoryItem.status) {
          discrepancies.push({
            nftUid: inventoryItem.nftUid,
            nftName: inventoryItem.name,
            issue: "Status mismatch",
            dbStatus: inventoryItem.status,
            nmkrStatus: nmkrStatus,
          });

          // Queue update action
          updateActions.push({
            nftUid: inventoryItem.nftUid,
            nftName: inventoryItem.name,
            oldStatus: inventoryItem.status,
            newStatus: nmkrStatus,
          });
        }
      }

      console.log(`[SYNC] Found ${discrepancies.length} discrepancies`);
      console.log(`[SYNC] Queued ${updateActions.length} updates`);

      // ===== STEP 5: APPLY UPDATES =====
      console.log(`[SYNC] === STEP 5: APPLYING ${updateActions.length} UPDATES ===`);
      const updateResults = [];

      for (const action of updateActions) {
        try {
          console.log(`[SYNC] 🔧 Calling updateNFTStatus mutation for ${action.nftName}...`);
          console.log(`[SYNC]    UID: ${action.nftUid}`);
          console.log(`[SYNC]    Changing: ${action.oldStatus} → ${action.newStatus}`);

          await ctx.runMutation(api.commemorativeCampaigns.updateNFTStatus, {
            nftUid: action.nftUid,
            status: action.newStatus as "available" | "reserved" | "sold",
          });

          updateResults.push({
            success: true,
            nftName: action.nftName,
            oldStatus: action.oldStatus,
            newStatus: action.newStatus,
          });

          console.log(`[SYNC] ✅ Mutation completed for ${action.nftName}`);
        } catch (error) {
          updateResults.push({
            success: false,
            nftName: action.nftName,
            error: error instanceof Error ? error.message : "Unknown error",
          });

          console.error(`[SYNC] ❌ Failed to update ${action.nftName}:`, error);
        }
      }

      console.log(`[SYNC] === UPDATES COMPLETE: ${updateResults.filter(r => r.success).length} succeeded, ${updateResults.filter(r => !r.success).length} failed ===`);

      // ===== STEP 6: REFRESH CAMPAIGN COUNTERS =====
      await ctx.runMutation(api.commemorativeCampaigns.syncCampaignCounters, {
        campaignId: args.campaignId,
      });

      console.log("[SYNC] Campaign counters refreshed");

      // ===== STEP 7: GET WEBHOOK ACTIVITY =====
      const webhookLogs = await ctx.runQuery(api.nmkrSync.getRecentSyncLogs, {
        nmkrProjectId: campaign.nmkrProjectId,
        limit: 10,
      });

      console.log(`[SYNC] Found ${webhookLogs.length} recent webhook events`);

      // ===== STEP 8: BLOCKCHAIN VERIFICATION (BATCH) =====
      console.log("[SYNC] Starting blockchain verification for sold NFTs...");

      const soldInventory = inventory.filter((nft) => nft.status === "sold");
      let blockchainResults = [];
      let batchSummary = null;

      // Get policy ID from campaign configuration (user-provided)
      const policyId = campaign.policyId;

      if (!policyId) {
        console.warn("[SYNC] No policy ID configured for campaign, skipping blockchain verification");
        console.warn("[SYNC] Add policy ID to campaign settings to enable blockchain verification");
      } else if (soldInventory.length === 0) {
        console.log("[SYNC] No sold NFTs to verify");
      } else {
        console.log(`[SYNC] Preparing to verify ${soldInventory.length} sold NFTs`);

        // Build array of NFTs to verify with asset IDs
        const nftsToVerify = [];

        for (const nft of soldInventory) {
          // Extract tokenname from sold/minted NFTs data (check both arrays)
          const allSoldNFTs = [...soldNFTs, ...mintedNFTs];
          const soldNFT = allSoldNFTs.find((n: any) => n.uid === nft.nftUid);
          if (!soldNFT || !soldNFT.tokenname) {
            console.warn(`[SYNC] Skipping ${nft.name} - no tokenname found in sold/minted NFTs`);
            blockchainResults.push({
              nftName: nft.name,
              nftUid: nft.nftUid,
              status: "error",
              message: "Tokenname not found in NMKR data",
            });
            continue;
          }

          // Build asset ID
          try {
            const assetIdResult = await ctx.runAction(api.blockfrost.constructAssetId, {
              policyId: policyId,
              assetName: soldNFT.tokenname,
            });

            nftsToVerify.push({
              nftUid: nft.nftUid,
              assetId: assetIdResult.assetId,
              name: nft.name,
              transactionHash: soldNFT.txHash, // If available from NMKR
            });
          } catch (error) {
            console.error(`[SYNC] Failed to build asset ID for ${nft.name}:`, error);
            blockchainResults.push({
              nftName: nft.name,
              nftUid: nft.nftUid,
              status: "error",
              message: "Failed to construct asset ID",
            });
          }
        }

        if (nftsToVerify.length > 0) {
          console.log(`[SYNC] Verifying ${nftsToVerify.length} NFTs on blockchain...`);

          try {
            // Use batch verification with rate limiting
            const batchResult = await ctx.runAction(api.blockfrost.verifyNFTBatch, {
              nfts: nftsToVerify,
              nmkrWalletAddress: projectStats?.payinAddress, // NMKR escrow wallet (safely handle null)
            });

            batchSummary = batchResult.summary;

            // Transform batch results to match existing format
            blockchainResults = [
              ...blockchainResults, // Include any errors from asset ID construction
              ...batchResult.results.map((result: any) => ({
                nftName: result.name,
                nftUid: result.nftUid,
                assetId: nftsToVerify.find((n) => n.nftUid === result.nftUid)?.assetId,
                status: result.verified
                  ? result.delivered
                    ? "delivered"
                    : result.inNmkrWallet
                    ? "pending_delivery"
                    : "unknown"
                  : "error",
                message: result.error || (result.delivered ? "Delivered to buyer" : "Pending delivery"),
                currentOwner: result.currentOwner,
                transactionValid: result.transactionValid,
              })),
            ];

            console.log(`[SYNC] Blockchain verification complete:`, batchSummary);
          } catch (error) {
            console.error("[SYNC] Batch verification failed:", error);

            // Mark all pending NFTs as errors
            nftsToVerify.forEach((nft) => {
              blockchainResults.push({
                nftName: nft.name,
                nftUid: nft.nftUid,
                status: "error",
                message: error instanceof Error ? error.message : "Batch verification failed",
              });
            });
          }
        }
      }

      // ===== STEP 9: RECORD SYNC LOG =====
      // Combine update errors and NMKR errors
      const allErrors = [
        ...updateResults
          .filter((r) => !r.success)
          .map((r) => `${r.nftName}: ${(r as any).error}`),
        ...nmkrErrors,
      ];

      await ctx.runMutation(api.nmkrSync.recordSyncLog, {
        syncType: "manual_sync",
        nmkrProjectId: campaign.nmkrProjectId,
        status: allErrors.length === 0 ? "success" : "partial",
        recordsSynced: updateResults.filter((r) => r.success).length,
        errors: allErrors,
        syncedData: {
          nmkrStats,
          dbStats,
          discrepanciesFound: discrepancies.length,
          updatesApplied: updateResults.filter((r) => r.success).length,
        },
        syncStartedAt: syncStartTime,
        syncCompletedAt: Date.now(),
      });

      console.log("[SYNC] Sync completed successfully");

      // ===== RETURN COMPREHENSIVE RESULTS =====
      return {
        success: true,
        syncedAt: Date.now(),
        durationMs: Date.now() - syncStartTime,

        // NMKR Comparison
        nmkrStats,
        nmkrErrors: nmkrErrors.length > 0 ? nmkrErrors : undefined, // Include NMKR errors if any
        dbStats,
        discrepancies,

        // Sync Actions
        updateResults,
        updatedCount: updateResults.filter((r) => r.success).length,
        failedCount: updateResults.filter((r) => !r.success).length,

        // Webhook Activity
        recentWebhooks: webhookLogs.map((log) => ({
          timestamp: log.syncCompletedAt,
          status: log.status,
          recordsSynced: log.recordsSynced,
          errors: log.errors,
        })),

        // Blockchain Verification
        blockchainResults,
        blockchainSummary: batchSummary || {
          total: blockchainResults.length,
          verified: blockchainResults.filter((r) => r.status !== "error").length,
          delivered: blockchainResults.filter((r) => r.status === "delivered").length,
          inEscrow: blockchainResults.filter((r) => r.status === "pending_delivery").length,
          failed: blockchainResults.filter((r) => r.status === "error").length,
          verificationRate: blockchainResults.length > 0
            ? ((blockchainResults.filter((r) => r.status !== "error").length / blockchainResults.length) * 100).toFixed(1) + "%"
            : "0%",
        },
        verifiedCount: blockchainResults.filter((r) => r.status === "delivered").length,
        pendingCount: blockchainResults.filter((r) => r.status === "pending_delivery").length,
        errorCount: blockchainResults.filter((r) => r.status === "error").length,
      };
    } catch (error) {
      console.error("[SYNC] Sync failed:", error);

      // Record failed sync
      try {
        await ctx.runMutation(api.nmkrSync.recordSyncLog, {
          syncType: "manual_sync",
          nmkrProjectId: campaign.nmkrProjectId,
          status: "failed",
          recordsSynced: 0,
          errors: [error instanceof Error ? error.message : "Unknown error"],
          syncStartedAt: syncStartTime,
          syncCompletedAt: Date.now(),
        });
      } catch (logError) {
        console.error("[SYNC] Failed to record error log:", logError);
      }

      throw error;
    }
  },
});

/**
 * Public action that can be called from frontend
 * Wraps the internal sync action
 */
export const syncCampaignPublic = action({
  args: {
    campaignId: v.id("commemorativeCampaigns"),
  },
  handler: async (ctx, args) => {
    return await ctx.runAction(internal.campaignSync.syncCampaign, {
      campaignId: args.campaignId,
    });
  },
});
