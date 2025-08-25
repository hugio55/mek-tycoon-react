// Script to fetch all sourceKeyBase values from Convex
import { ConvexHttpClient } from "convex/browser";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { api } from "../convex/_generated/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the Convex URL from environment or use the one from .env.local
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://rare-dinosaur-331.convex.cloud";

async function fetchSourceKeys() {
  console.log("Connecting to Convex at:", CONVEX_URL);
  
  const client = new ConvexHttpClient(CONVEX_URL);
  
  try {
    // Fetch all source keys
    console.log("Fetching all sourceKeyBase values...");
    const result = await client.query(api.getAllSourceKeys.getAllSourceKeys);
    
    console.log(`Found ${result.total} sourceKeyBase values`);
    
    // Save to JSON file
    const outputPath = path.join(__dirname, '..', 'convex_source_keys.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Saved to: ${outputPath}`);
    
    // Also fetch missing ones
    console.log("\nChecking for missing sourceKeyBase values...");
    const missing = await client.query(api.getAllSourceKeys.getMissingSourceKeys);
    
    console.log(`Total Meks: ${missing.totalMeks}`);
    console.log(`Missing sourceKeyBase: ${missing.missingSourceKeyBase}`);
    
    if (missing.missingSourceKeyBase > 0) {
      const missingPath = path.join(__dirname, '..', 'convex_missing_source_keys.json');
      fs.writeFileSync(missingPath, JSON.stringify(missing, null, 2));
      console.log(`Missing keys saved to: ${missingPath}`);
      
      // Show first few missing
      console.log("\nFirst few missing sourceKeyBase:");
      missing.missing.slice(0, 5).forEach(mek => {
        console.log(`  ${mek.assetId}: ${mek.assetName} (sourceKey: ${mek.sourceKey || 'none'})`);
      });
    }
    
    // Now compare with FINAL PNGS folder
    console.log("\n" + "=".repeat(60));
    console.log("Comparing with FINAL PNGS folder...");
    
    const finalPngsDir = "F:\\Dropbox\\Dropbox\\rgb\\c4d\\NFT\\MEKANISM\\MEK PFPS\\FINAL PNGS";
    
    // Get all PNG files from FINAL PNGS
    const pngFiles = fs.readdirSync(finalPngsDir)
      .filter(f => f.endsWith('.png'))
      .map(f => f.replace('.png', '').toLowerCase());
    
    const convexKeys = result.sourceKeys.map(k => k.toLowerCase());
    
    // Find differences
    const missingInFolder = convexKeys.filter(key => !pngFiles.includes(key));
    const extraInFolder = pngFiles.filter(key => !convexKeys.includes(key));
    
    console.log(`\nPNG files in FINAL PNGS: ${pngFiles.length}`);
    console.log(`Source keys in Convex: ${convexKeys.length}`);
    console.log(`Missing from FINAL PNGS folder: ${missingInFolder.length}`);
    console.log(`Extra in FINAL PNGS folder: ${extraInFolder.length}`);
    
    // Save comparison results
    const comparisonPath = path.join(__dirname, '..', 'folder_comparison.json');
    fs.writeFileSync(comparisonPath, JSON.stringify({
      totalPngs: pngFiles.length,
      totalConvex: convexKeys.length,
      missingFromFolder: missingInFolder,
      extraInFolder: extraInFolder
    }, null, 2));
    
    console.log(`\nComparison saved to: ${comparisonPath}`);
    
    if (missingInFolder.length > 0) {
      console.log("\nFirst 10 missing from FINAL PNGS:");
      missingInFolder.slice(0, 10).forEach(key => console.log(`  - ${key}`));
    }
    
    if (extraInFolder.length > 0) {
      console.log("\nFirst 10 extra in FINAL PNGS:");
      extraInFolder.slice(0, 10).forEach(key => console.log(`  - ${key}`));
    }
    
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

fetchSourceKeys();