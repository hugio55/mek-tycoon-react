const { ConvexHttpClient } = require("convex/browser");

// Get Convex URL from environment
require("dotenv").config({ path: ".env.local" });
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.error("NEXT_PUBLIC_CONVEX_URL not found in .env.local");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);

async function verifySourceKeys() {
  console.log("Verifying source key formatting...\n");
  
  try {
    // Get all meks
    const meks = await client.query("meks:getAllMeks");
    
    // Find meks with source keys containing -B
    const meksWithB = meks.filter(m => m.sourceKey && m.sourceKey.includes('-B'));
    const meksWithoutB = meks.filter(m => m.sourceKey && !m.sourceKey.includes('-B'));
    
    console.log(`Total meks: ${meks.length}`);
    console.log(`Meks with source keys: ${meks.filter(m => m.sourceKey).length}`);
    console.log(`Meks with -B suffix: ${meksWithB.length}`);
    console.log(`Meks without -B suffix: ${meksWithoutB.length}`);
    
    if (meksWithB.length > 0) {
      console.log("\nExamples with -B suffix:");
      meksWithB.slice(0, 3).forEach(mek => {
        console.log(`  ${mek.assetName}: ${mek.sourceKey} -> ${mek.sourceKeyBase}`);
      });
    }
    
    if (meksWithoutB.length > 0) {
      console.log("\nExamples without -B suffix:");
      meksWithoutB.slice(0, 3).forEach(mek => {
        console.log(`  ${mek.assetName}: ${mek.sourceKey} -> ${mek.sourceKeyBase}`);
      });
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

verifySourceKeys().catch(console.error);