// Script to import Mek data into Convex
// Run with: node scripts/importMeks.js

import fs from 'fs';
import path from 'path';
import { ConvexHttpClient } from "convex/browser";

// Update with your Convex deployment URL
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("Please set NEXT_PUBLIC_CONVEX_URL environment variable");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function importMeksFromFile() {
  try {
    // Read your existing mek data file
    // Update this path to your actual data file
    const dataPath = path.join(process.cwd(), '../complete_mek_data.json');
    
    if (!fs.existsSync(dataPath)) {
      console.log("Data file not found. Looking for alternative sources...");
      
      // Try alternative paths
      const altPaths = [
        '../mek_data.json',
        '../data/meks.json',
        '../HTML/json/mek_4001.json'
      ];
      
      for (const altPath of altPaths) {
        const fullPath = path.join(process.cwd(), altPath);
        if (fs.existsSync(fullPath)) {
          console.log(`Found data at: ${fullPath}`);
          const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          await processMekData(data);
          return;
        }
      }
      
      console.log("No mek data files found. Please update the path in the script.");
      return;
    }
    
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const mekData = JSON.parse(rawData);
    
    await processMekData(mekData);
    
  } catch (error) {
    console.error("Error importing meks:", error);
  }
}

async function processMekData(data) {
  // Transform data to match our schema
  const meksToImport = [];
  
  // Handle different data formats
  if (Array.isArray(data)) {
    // Direct array of meks
    for (const mek of data) {
      meksToImport.push(transformMek(mek));
    }
  } else if (data.meks) {
    // Object with meks property
    for (const mek of data.meks) {
      meksToImport.push(transformMek(mek));
    }
  } else {
    // Object where keys are mek IDs
    for (const [id, mek] of Object.entries(data)) {
      meksToImport.push(transformMek({ ...mek, id }));
    }
  }
  
  console.log(`Preparing to import ${meksToImport.length} meks...`);
  
  // Import in batches to avoid timeout
  const batchSize = 50;
  for (let i = 0; i < meksToImport.length; i += batchSize) {
    const batch = meksToImport.slice(i, i + batchSize);
    
    try {
      const result = await client.mutation("seedMeks:importMeksFromJSON", {
        meksData: batch
      });
      
      console.log(`Batch ${Math.floor(i/batchSize) + 1}: ${result.message}`);
    } catch (error) {
      console.error(`Error importing batch ${Math.floor(i/batchSize) + 1}:`, error);
    }
  }
  
  console.log("Import complete!");
}

function transformMek(mek) {
  // Transform your existing mek data to match the Convex schema
  return {
    assetId: mek.asset_id || mek.id || `mek_${mek.number || Math.random()}`,
    assetName: mek.asset_name || mek.name || "Unknown Mek",
    owner: mek.owner || "unclaimed",
    headGroup: mek.head_group || mek.headGroup,
    headVariation: mek.head_variation || mek.head || "standard",
    bodyGroup: mek.body_group || mek.bodyGroup,
    bodyVariation: mek.body_variation || mek.body || "standard",
    armsGroup: mek.arms_group || mek.armsGroup,
    armsVariation: mek.arms_variation || mek.arms,
    legsGroup: mek.legs_group || mek.legsGroup,
    legsVariation: mek.legs_variation || mek.legs,
    boosterGroup: mek.booster_group || mek.boosterGroup,
    boosterVariation: mek.booster_variation || mek.booster,
    rarityRank: mek.rarity_rank || mek.rank,
  };
}

// Run the import
importMeksFromFile();