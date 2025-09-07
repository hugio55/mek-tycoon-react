const { ConvexHttpClient } = require("convex/browser");

// Get Convex URL from environment
require("dotenv").config({ path: ".env.local" });
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.error("NEXT_PUBLIC_CONVEX_URL not found in .env.local");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);

async function testSourceKeyLookup() {
  console.log("Testing source key lookup...\n");
  
  // Test looking up a mek by sourceKeyBase (without -B)
  const testBase = "HH1-DH1-JI2";
  console.log(`Looking up meks with sourceKeyBase: ${testBase}`);
  
  try {
    // Get a few meks to see the data structure
    const meks = await client.query("meks:getAllMeks");
    
    // Find meks with source keys
    const meksWithSourceKeys = meks.filter(m => m.sourceKey && m.sourceKeyBase);
    
    console.log(`\nFound ${meksWithSourceKeys.length} meks with source keys`);
    
    if (meksWithSourceKeys.length > 0) {
      console.log("\nExample meks with source keys:");
      meksWithSourceKeys.slice(0, 3).forEach(mek => {
        console.log(`  ${mek.assetName}:`);
        console.log(`    sourceKey: ${mek.sourceKey} (full key from metadata)`);
        console.log(`    sourceKeyBase: ${mek.sourceKeyBase} (for image lookup)`);
      });
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testSourceKeyLookup().catch(console.error);