const { ConvexHttpClient } = require("convex/browser");
const fs = require("fs");
const path = require("path");

// Load the source key mappings
const mappingsPath = path.join(__dirname, "../source_key_mappings.json");
const mappings = JSON.parse(fs.readFileSync(mappingsPath, "utf-8"));

// Get Convex URL from environment
require("dotenv").config({ path: ".env.local" });
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.error("NEXT_PUBLIC_CONVEX_URL not found in .env.local");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);

async function testUpdateSingleMek() {
  console.log("Testing with a single Mek update...");
  
  // Test with just one mapping
  const testMapping = mappings[0];
  console.log(`Testing with: ${testMapping.assetName} -> ${testMapping.sourceKey}`);
  
  try {
    const result = await client.mutation("migrations:updateSingleMekSourceKey", {
      assetName: testMapping.assetName,
      sourceKey: testMapping.sourceKey
    });
    console.log("Success:", result.message);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testUpdateSingleMek().catch(console.error);