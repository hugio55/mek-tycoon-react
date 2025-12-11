/**
 * Quick script to query claim-related tables on Production (Sturgeon)
 * Run with: node query-claim-tables.mjs
 */

import { ConvexHttpClient } from "convex/browser";

// Production database URL
const STURGEON_URL = "https://fabulous-sturgeon-691.convex.cloud";

async function queryClaimTables() {
  const client = new ConvexHttpClient(STURGEON_URL);

  console.log("\n=== QUERYING PRODUCTION (STURGEON) DATABASE ===\n");

  // 1. Query commemorativeNFTClaims stats
  console.log("--- COMMEMORATIVE NFT CLAIMS TABLE ---");
  try {
    const claimStats = await client.query("commemorativeNFTClaims:getClaimStats", {});
    console.log("Total Claims:", claimStats.totalClaims);
    console.log("Unique Wallets:", claimStats.uniqueWallets);
    console.log("Claims by NFT:", JSON.stringify(claimStats.claimsByNFT, null, 2));
    if (claimStats.mostRecentClaim) {
      console.log("Most Recent Claim:", {
        wallet: claimStats.mostRecentClaim.walletAddress?.substring(0, 30) + "...",
        nft: claimStats.mostRecentClaim.nftName,
        date: new Date(claimStats.mostRecentClaim.claimedAt).toLocaleString(),
        txHash: claimStats.mostRecentClaim.transactionHash?.substring(0, 20) + "...",
      });
    }
  } catch (e) {
    console.log("Error querying claims:", e.message || e);
  }

  // 2. Query campaigns
  console.log("\n--- COMMEMORATIVE CAMPAIGNS ---");
  try {
    const campaigns = await client.query("commemorativeCampaigns:listAllCampaigns", {});
    console.log("Total Campaigns:", campaigns.length);

    for (const campaign of campaigns) {
      console.log(`\n  Campaign: "${campaign.name}"`);
      console.log(`    ID: ${campaign._id}`);
      console.log(`    Status: ${campaign.status}`);
      console.log(`    Total NFTs: ${campaign.totalNFTs || 'unknown'}`);
      console.log(`    Available: ${campaign.availableNFTs || 0}`);
      console.log(`    Reserved: ${campaign.reservedNFTs || 0}`);
      console.log(`    Sold: ${campaign.soldNFTs || 0}`);

      // Get inventory for this campaign
      try {
        const inventory = await client.query("commemorativeCampaigns:getCampaignInventory", {
          campaignId: campaign._id,
        });

        const soldItems = inventory.filter((item) => item.status === "sold");
        if (soldItems.length > 0) {
          console.log(`    === SOLD ITEMS (${soldItems.length}) ===`);
          for (const item of soldItems) {
            console.log(`      - ${item.name}`);
            console.log(`        soldTo: ${item.soldTo || 'unknown'}`);
            console.log(`        soldAt: ${item.soldAt ? new Date(item.soldAt).toLocaleString() : 'unknown'}`);
            console.log(`        txHash: ${item.transactionHash || 'none'}`);
            console.log(`        companyNameAtSale: ${item.companyNameAtSale || 'not recorded'}`);
          }
        } else {
          console.log(`    No sold items in this campaign`);
        }
      } catch (invErr) {
        console.log(`    Error getting inventory: ${invErr.message || invErr}`);
      }
    }
  } catch (e) {
    console.log("Error querying campaigns:", e.message || e);
  }

  // 3. Get recent claims for more detail
  console.log("\n--- RECENT CLAIMS (Last 10) ---");
  try {
    const recentClaims = await client.query("commemorativeNFTClaims:getRecentClaims", { limit: 10 });
    console.log(`Found ${recentClaims.length} recent claims:`);
    for (const claim of recentClaims) {
      console.log(`  - ${claim.nftName}`);
      console.log(`    wallet: ${claim.walletAddress}`);
      console.log(`    claimed: ${new Date(claim.claimedAt).toLocaleString()}`);
      console.log(`    txHash: ${claim.transactionHash}`);
      console.log(`    campaignId: ${claim.campaignId || 'not set'}`);
    }
  } catch (e) {
    console.log("Error querying recent claims:", e.message || e);
  }

  console.log("\n=== QUERY COMPLETE ===\n");
}

queryClaimTables().catch(console.error);
