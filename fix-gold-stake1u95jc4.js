/**
 * Fix cumulative gold inflation for stake1u95jc4...ygeajf8r
 *
 * This script fixes the cumulative gold that was accidentally inflated
 * when manually adding gold to the account.
 *
 * To run this:
 * 1. Open Convex dashboard
 * 2. Go to Functions
 * 3. Find "adminGoldInvestigation:fixCumulativeGoldInflation"
 * 4. Run with args: { "walletAddress": "stake1u95jc4...ygea jf8r" } (replace with full address)
 *
 * OR use this Node.js script with Convex client
 */

const { ConvexHttpClient } = require("convex/browser");
const { api } = require("./convex/_generated/api");

// Get deployment URL from environment or config
const CONVEX_URL = process.env.CONVEX_URL || "https://your-deployment.convex.cloud";

async function fixGold() {
  const client = new ConvexHttpClient(CONVEX_URL);

  // The wallet address from the screenshot (you'll need to provide the full address)
  const walletAddress = "stake1u95jc4...ygeajf8r"; // REPLACE WITH FULL ADDRESS

  console.log(`Investigating gold for ${walletAddress}...`);

  // Step 1: Investigate to see the problem
  const investigation = await client.query(api.adminGoldInvestigation.investigateUserGold, {
    walletAddress
  });

  console.log("\n=== INVESTIGATION RESULTS ===");
  console.log(`Company: ${investigation.companyName}`);
  console.log(`Current Gold: ${investigation.accumulatedGold}`);
  console.log(`Total Cumulative: ${investigation.totalCumulativeGold}`);
  console.log(`Total Spent: ${investigation.totalGoldSpentOnUpgrades}`);
  console.log(`Invariant Deficit: ${investigation.invariantDeficit}`);
  console.log(`Recommendation: ${investigation.recommendation}`);

  // Step 2: Fix the cumulative gold inflation
  console.log("\n=== APPLYING FIX ===");
  const result = await client.mutation(api.adminGoldInvestigation.fixCumulativeGoldInflation, {
    walletAddress
  });

  console.log(result.message);
  console.log(`Old Cumulative: ${result.oldCumulative}`);
  console.log(`New Cumulative: ${result.newCumulative}`);
  console.log(`Inflation Corrected: ${result.inflation}`);

  console.log("\n✓ Fix complete!");
}

// Run if called directly
if (require.main === module) {
  fixGold().catch(console.error);
}

module.exports = { fixGold };
