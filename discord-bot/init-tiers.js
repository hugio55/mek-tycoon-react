const { ConvexHttpClient } = require('convex/browser');
require('dotenv').config();

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://fabulous-sturgeon-691.convex.cloud';

async function initializeTiers() {
  const convex = new ConvexHttpClient(CONVEX_URL);

  try {
    console.log('Initializing default gold tiers...');
    const result = await convex.mutation('discordIntegration:initializeDefaultGoldTiers', {});

    if (result.success) {
      console.log(`✅ Successfully created ${result.tiersCreated} gold tiers!`);
      console.log('\nDefault Tiers:');
      console.log('🥉 Bronze: 0 - 10,000 gold');
      console.log('🥈 Silver: 10,000 - 50,000 gold');
      console.log('🥇 Gold: 50,000 - 100,000 gold');
      console.log('💎 Platinum: 100,000 - 250,000 gold');
      console.log('💠 Diamond: 250,000 - 500,000 gold');
      console.log('👑 Master: 500,000 - 1,000,000 gold');
      console.log('⚡ Grandmaster: 1,000,000+ gold');
    } else {
      console.log('ℹ️ Gold tiers already exist:', result.message);
    }
  } catch (error) {
    console.error('Error initializing tiers:', error.message);
    process.exit(1);
  }
}

initializeTiers();