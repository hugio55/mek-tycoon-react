/**
 * Quick script to query claim-related tables on Production (Sturgeon)
 * Run with: npx ts-node query-claim-tables.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api";

// Production database URL
const STURGEON_URL = "https://fabulous-sturgeon-691.convex.cloud";

async function queryClaimTables() {
  const client = new ConvexHttpClient(STURGEON_URL);

  console.log("\n=== QUERYING PRODUCTION (STURGEON) DATABASE ===\n");

  // 1. Query commemorativeNFTClaims
  console.log("--- COMMEMORATIVE NFT CLAIMS ---");
  try {
    const claimStats = await client.query(api.commemorativeNFTClaims.getClaimStats, {});
    console.log("Total Claims:", claimStats.totalClaims);
    console.log("Unique Wallets:", claimStats.uniqueWallets);
    console.log("Claims by NFT:", claimStats.claimsByNFT);
    if (claimStats.mostRecentClaim) {
      console.log("Most Recent Claim:", {
        wallet: claimStats.mostRecentClaim.walletAddress?.substring(0, 20) + "...",
        nft: claimStats.mostRecentClaim.nftName,
        date: new Date(claimStats.mostRecentClaim.claimedAt).toLocaleString(),
      });
    }
  } catch (e) {
    console.log("Error querying claims:", e);
  }

  // 2. Query commemorativeNFTInventory (sold items)
  console.log("\n--- COMMEMORATIVE NFT INVENTORY (SOLD) ---");
  try {
    const campaigns = await client.query(api.commemorativeCampaigns.listAllCampaigns, {});
    console.log("Total Campaigns:", campaigns.length);

    for (const campaign of campaigns) {
      console.log(`\nCampaign: ${campaign.name}`);
      console.log(`  Status: ${campaign.status}`);
      console.log(`  Total NFTs: ${campaign.totalNFTs}`);
      console.log(`  Available: ${campaign.availableNFTs}`);
      console.log(`  Reserved: ${campaign.reservedNFTs}`);
      console.log(`  Sold: ${campaign.soldNFTs}`);

      // Get inventory for this campaign
      const inventory = await client.query(api.commemorativeCampaigns.getCampaignInventory, {
        campaignId: campaign._id,
      });

      const soldItems = inventory.filter((item: any) => item.status === "sold");
      if (soldItems.length > 0) {
        console.log(`  Sold Items:`);
        for (const item of soldItems) {
          console.log(`    - ${item.name}: sold to ${item.soldTo?.substring(0, 20)}... on ${item.soldAt ? new Date(item.soldAt).toLocaleString() : 'unknown'}`);
        }
      }
    }
  } catch (e) {
    console.log("Error querying inventory:", e);
  }

  // 3. Query commemorativeNFTReservations (completed)
  console.log("\n--- COMMEMORATIVE NFT RESERVATIONS (COMPLETED) ---");
  try {
    // We'll use a custom approach since there's no direct query for all completed
    // The admin page uses investigateAllData which we can call
    const allData = await client.query(api.commemorativeNFTReservationsCampaign.investigateAllData, {});

    const completedReservations = allData.reservations.filter((r: any) => r.status === "completed");
    console.log("Completed Reservations:", completedReservations.length);

    for (const res of completedReservations) {
      console.log(`  - NFT #${res.nftNumber}: ${res.reservedBy?.substring(0, 20)}... completed at ${res.completedAt ? new Date(res.completedAt).toLocaleString() : 'unknown'}`);
    }

    console.log("\n--- SUMMARY ---");
    console.log("Total Claims in Claims Table:", allData.summary.totalClaims);
    console.log("Total Inventory Items:", allData.summary.totalInventory);
    console.log("Total Reservations:", allData.summary.totalReservations);
    console.log("Total Campaigns:", allData.summary.totalCampaigns);
  } catch (e) {
    console.log("Error querying reservations:", e);
  }

  console.log("\n=== QUERY COMPLETE ===\n");
}

queryClaimTables().catch(console.error);
