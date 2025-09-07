const fs = require('fs');
const path = require('path');

// Read all mek data from cnft folder
function loadAllMeks() {
  const meks = [];
  const cnftDir = path.join(__dirname, '..', 'cnft');
  
  // Read all mek_page files
  for (let i = 1; i <= 80; i++) {
    const fileName = `mek_page_${String(i).padStart(2, '0')}.json`;
    const filePath = path.join(cnftDir, fileName);
    
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (data.stats) {
        meks.push(...data.stats);
      }
    }
  }
  
  console.log(`Loaded ${meks.length} meks from files`);
  return meks;
}

// Transform mek data to match Convex schema
function transformMekForConvex(mek) {
  return {
    assetId: mek.assetID || mek.assetName,
    assetName: mek.name || mek.assetName,
    owner: mek.ownerStakeKey || "unclaimed",
    iconUrl: mek.iconurl ? `https://ipfs.io/ipfs/${mek.iconurl}` : null,
    verified: true,
    
    // Visual attributes
    headGroup: mek.headGroup,
    headVariation: mek.headVariation || "standard",
    bodyGroup: mek.bodyGroup,
    bodyVariation: mek.bodyVariation || "standard",
    itemGroup: mek.itemGroup,
    itemVariation: mek.itemVariation,
    
    // Rarity
    rarityRank: parseInt(mek.rarityRank) || 4000,
    rarityTier: getRarityTier(parseInt(mek.rarityRank)),
    
    // Calculate initial stats based on rarity
    level: 1,
    experience: 0,
    health: 100,
    maxHealth: 100,
    attack: calculateAttack(mek),
    defense: calculateDefense(mek),
    speed: calculateSpeed(mek),
    energy: 100,
    maxEnergy: 100,
    powerScore: calculatePowerScore(mek),
    scrapValue: calculateScrapValue(parseInt(mek.rarityRank)),
    
    // Battle stats
    wins: 0,
    losses: 0,
    draws: 0,
    winStreak: 0,
    
    // Status
    inBattle: false,
    isStaked: false,
    lastUpdated: Date.now()
  };
}

function getRarityTier(rank) {
  if (rank <= 50) return "Legendary";
  if (rank <= 200) return "Epic";
  if (rank <= 800) return "Rare";
  if (rank <= 2000) return "Uncommon";
  return "Common";
}

function calculateAttack(mek) {
  const baseAttack = 10;
  const headBonus = {
    "Projectionist": 15,
    "Laser": 12,
    "Turret": 10,
    "Drill": 8,
    "Security": 6,
    "Bullish": 5
  };
  return baseAttack + (headBonus[mek.headVariation] || 0);
}

function calculateDefense(mek) {
  const baseDefense = 10;
  const bodyBonus = {
    "Cousin Itt": 15,
    "X Ray Ultimate": 12,
    "Stone": 10,
    "Tiles": 8,
    "Moss": 6,
    "Candy": 4
  };
  return baseDefense + (bodyBonus[mek.bodyVariation] || 0);
}

function calculateSpeed(mek) {
  const rank = parseInt(mek.rarityRank) || 4000;
  if (rank <= 100) return 20;
  if (rank <= 500) return 15;
  if (rank <= 1500) return 12;
  if (rank <= 3000) return 10;
  return 8;
}

function calculatePowerScore(mek) {
  const rank = parseInt(mek.rarityRank) || 4000;
  const baseScore = 100;
  const rankBonus = Math.max(0, (4000 - rank) / 10);
  return Math.floor(baseScore + rankBonus);
}

function calculateScrapValue(rank) {
  if (rank <= 100) return 500;
  if (rank <= 500) return 250;
  if (rank <= 1500) return 150;
  if (rank <= 3000) return 100;
  return 50;
}

// Create the import data file
function createImportFile() {
  const allMeks = loadAllMeks();
  const transformedMeks = allMeks.map(transformMekForConvex);
  
  // Sort by rarity rank
  transformedMeks.sort((a, b) => a.rarityRank - b.rarityRank);
  
  // Take all 4000 meks
  const importBatch = transformedMeks;
  
  // Save to file
  const outputPath = path.join(__dirname, 'convex', 'meksImportData.json');
  fs.writeFileSync(outputPath, JSON.stringify(importBatch, null, 2));
  
  console.log(`Created import file with ${importBatch.length} meks`);
  console.log(`File saved to: ${outputPath}`);
  
  // Also create the full dataset for later
  const fullDataPath = path.join(__dirname, 'convex', 'allMeksData.json');
  fs.writeFileSync(fullDataPath, JSON.stringify(transformedMeks, null, 2));
  console.log(`Full dataset (${transformedMeks.length} meks) saved to: ${fullDataPath}`);
  
  return importBatch;
}

// Run the import
createImportFile();