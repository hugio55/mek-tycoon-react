require('dotenv').config();
const { ConvexHttpClient } = require('convex/browser');

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://fabulous-sturgeon-691.convex.cloud';

// CUSTOMIZE YOUR 10 TIERS WITH CUSTOM EMOJIS
//
// HOW TO GET EMOJI IDs:
// 1. Upload your emoji images to Discord (Server Settings → Emoji)
// 2. In Discord, type \:your_emoji_name: to see the full emoji code
// 3. Copy the ID from <:name:1234567890123456789>
// 4. Paste the full emoji code below (including < and >)
//
// EXAMPLE:
// emoji: "<:gold_tier_1:1234567890123456789>"

const customTiers = [
  // TIER 1
  {
    tierName: "Beginner",
    minGold: 0,
    maxGold: 5000,
    emoji: "<:gold_tier_1_beginner:1421335342031573003>",
    order: 1
  },

  // TIER 2
  {
    tierName: "Apprentice",
    minGold: 5000,
    maxGold: 15000,
    emoji: "<:gold_tier_2_apprentice:1421335422750953554>",
    order: 2
  },

  // TIER 3
  {
    tierName: "Journeyman",
    minGold: 15000,
    maxGold: 35000,
    emoji: "<:gold_tier_3_journeyman:1421335337711702026>",
    order: 3
  },

  // TIER 4
  {
    tierName: "Expert",
    minGold: 35000,
    maxGold: 75000,
    emoji: "<:gold_tier_4_expert:1421335339179442176>",
    order: 4
  },

  // TIER 5
  {
    tierName: "Elite",
    minGold: 75000,
    maxGold: 150000,
    emoji: "<:gold_tier_5_elite:1421335336310800394>",
    order: 5
  },

  // TIER 6
  {
    tierName: "Master",
    minGold: 150000,
    maxGold: 300000,
    emoji: "<:gold_tier_6_master:1421335334091882496>",
    order: 6
  },

  // TIER 7
  {
    tierName: "Grandmaster",
    minGold: 300000,
    maxGold: 600000,
    emoji: "<:gold_tier_7_grandmaster:1421335335002181652>",
    order: 7
  },

  // TIER 8
  {
    tierName: "Legend",
    minGold: 600000,
    maxGold: 1000000,
    emoji: "<:gold_tier_8_legend:1421335332905025536>",
    order: 8
  },

  // TIER 9
  {
    tierName: "Mythic",
    minGold: 1000000,
    maxGold: 2500000,
    emoji: "<:gold_tier_9_mythic:1421335331604791408>",
    order: 9
  },

  // TIER 10
  {
    tierName: "Godlike",
    minGold: 2500000,
    maxGold: undefined, // undefined = unlimited (2.5M+)
    emoji: "<:gold_tier_10_godlike:1421335329994047518>",
    order: 10
  },
];

async function setupCustomEmojiTiers() {
  const convex = new ConvexHttpClient(CONVEX_URL);

  try {
    console.log('🎨 Setting up custom emoji tiers...\n');

    // Get all existing tiers
    const existingTiers = await convex.query('discordIntegration:getGoldTiers', {});

    // Deactivate all existing tiers
    console.log('🗑️  Clearing old tiers...');
    for (const tier of existingTiers) {
      await convex.mutation('discordIntegration:updateGoldTier', {
        tierId: tier._id,
        active: false
      });
    }
    console.log(`   Deactivated ${existingTiers.length} old tiers\n`);

    // Create new tiers with custom emojis
    console.log('✨ Creating 10 new tiers with your custom emojis...\n');

    for (const tier of customTiers) {
      await convex.mutation('discordIntegration:createGoldTier', tier);

      const maxGoldDisplay = tier.maxGold !== undefined
        ? tier.maxGold.toLocaleString()
        : '∞';

      const emojiDisplay = tier.emoji.startsWith('<:')
        ? `[Custom: ${tier.emoji.split(':')[1]}]`
        : tier.emoji;

      console.log(`   ${emojiDisplay.padEnd(25)} ${tier.tierName.padEnd(15)} ${tier.minGold.toLocaleString().padStart(10)} - ${maxGoldDisplay}`);
    }

    console.log('\n✅ Successfully created 10 custom emoji tiers!');
    console.log('\n📝 To use custom emojis:');
    console.log('   1. Upload emoji images to Discord (Server Settings → Emoji)');
    console.log('   2. Type \\:emoji_name: in Discord to get the emoji code');
    console.log('   3. Edit this file and replace emoji: "🪙" with emoji: "<:name:id>"');
    console.log('   4. Run: node setup-custom-emoji-tiers.js');

  } catch (error) {
    console.error('❌ Error setting up tiers:', error.message);
    process.exit(1);
  }
}

setupCustomEmojiTiers();