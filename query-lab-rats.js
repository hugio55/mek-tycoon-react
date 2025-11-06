const { ConvexClient } = require("convex/browser");

const client = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function queryLabRats() {
  try {
    const results = await client.query("commemorativeNFTInventorySetup:debugLabRatRecords");
    console.log("\n========== LAB RAT NFT RECORDS ==========\n");
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("Error querying:", error.message);
    process.exit(1);
  }
}

queryLabRats();
