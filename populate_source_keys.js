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

async function populateSourceKeys() {
  console.log(`Found ${mappings.length} source key mappings to process`);
  
  // Process in smaller batches to avoid timeouts and read limits
  const batchSize = 10; // Reduced from 50 to avoid read limits
  let processedCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < mappings.length; i += batchSize) {
    const batch = mappings.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(mappings.length / batchSize)}`);
    
    try {
      const result = await client.mutation("migrations:populateSourceKeys", { mappings: batch });
      console.log(`Batch result:`, result.message);
      processedCount += batch.length;
    } catch (error) {
      console.error(`Error processing batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      errorCount += batch.length;
    }
    
    // Increased delay between batches to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\nComplete! Processed ${processedCount} mappings, ${errorCount} errors`);
}

populateSourceKeys().catch(console.error);