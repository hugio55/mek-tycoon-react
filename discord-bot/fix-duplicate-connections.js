require('dotenv').config();
const { ConvexHttpClient } = require('convex/browser');

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://rare-dinosaur-331.convex.cloud';
const convex = new ConvexHttpClient(CONVEX_URL);

const GUILD_ID = process.env.DISCORD_GUILD_ID;

async function fixDuplicateConnections() {
  console.log('Finding and fixing duplicate connections...\n');

  try {
    // Find all truncated addresses
    const truncated = await convex.query('debugAllConnections:findTruncatedAddresses', {
      guildId: GUILD_ID,
    });

    if (truncated.length === 0) {
      console.log('✅ No truncated addresses found');
      return;
    }

    console.log(`Found ${truncated.length} truncated addresses to fix:\n`);

    for (const conn of truncated) {
      console.log(`Fixing: ${conn.discordUsername} (${conn.discordUserId})`);
      console.log(`  Truncated wallet: ${conn.walletAddress}`);
      console.log(`  Active: ${conn.active}`);

      if (conn.active) {
        // Deactivate this connection
        await convex.mutation('discordIntegration:deactivateConnectionById', {
          connectionId: conn.id,
        });
        console.log(`  ✅ Deactivated truncated connection\n`);
      } else {
        console.log(`  ⏭️ Already inactive, skipping\n`);
      }
    }

    console.log('All truncated connections have been deactivated');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixDuplicateConnections();
