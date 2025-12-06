require('dotenv').config();
const { ConvexHttpClient } = require('convex/browser');

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://fabulous-sturgeon-691.convex.cloud';

// CUSTOMIZE YOUR 10 TIERS HERE
const customTiers = [
  { tierName: "Beginner", minGold: 0, maxGold: 5000, emoji: "🪙", order: 1 },
  { tierName: "Apprentice", minGold: 5000, maxGold: 15000, emoji: "🥉", order: 2 },
  { tierName: "Journeyman", minGold: 15000, maxGold: 35000, emoji: "🥈", order: 3 },
  { tierName: "Expert", minGold: 35000, maxGold: 75000, emoji: "🥇", order: 4 },
  { tierName: "Elite", minGold: 75000, maxGold: 150000, emoji: "💎", order: 5 },
  { tierName: "Master", minGold: 150000, maxGold: 300000, emoji: "💠", order: 6 },
  { tierName: "Grandmaster", minGold: 300000, maxGold: 600000, emoji: "👑", order: 7 },
  { tierName: "Legend", minGold: 600000, maxGold: 1000000, emoji: "⚡", order: 8 },
  { tierName: "Mythic", minGold: 1000000, maxGold: 2500000, emoji: "🔥", order: 9 },
  { tierName: "Godlike", minGold: 2500000, maxGold: undefined, emoji: "✨", order: 10 },
];

async function setupCustomTiers() {
  const convex = new ConvexHttpClient(CONVEX_URL);

  try {
    console.log('🗑️  Clearing existing gold tiers...');

    // Get all existing tiers
    const existingTiers = await convex.query('discordIntegration:getGoldTiers', {});

    // Deactivate all existing tiers
    for (const tier of existingTiers) {
      await convex.mutation('discordIntegration:updateGoldTier', {
        tierId: tier._id,
        active: false
      });
    }

    console.log(`   Deactivated ${existingTiers.length} old tiers\n`);

    console.log('✨ Creating 10 new custom tiers...\n');

    // Create new tiers
    for (const tier of customTiers) {
      await convex.mutation('discordIntegration:createGoldTier', tier);

      const maxGoldDisplay = tier.maxGold !== undefined
        ? tier.maxGold.toLocaleString()
        : '∞';

      console.log(`   ${tier.emoji} ${tier.tierName.padEnd(15)} ${tier.minGold.toLocaleString().padStart(10)} - ${maxGoldDisplay}`);
    }

    console.log('\n✅ Successfully created 10 custom gold tiers!');
    console.log('\nTo customize tiers, edit the "customTiers" array in setup-custom-tiers.js');

  } catch (error) {
    console.error('❌ Error setting up tiers:', error.message);
    process.exit(1);
  }
}

setupCustomTiers();