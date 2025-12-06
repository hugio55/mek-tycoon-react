require('dotenv').config();
const { ConvexHttpClient } = require('convex/browser');

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://fabulous-sturgeon-691.convex.cloud';
const convex = new ConvexHttpClient(CONVEX_URL);

const DISCORD_USER_ID = '362994796186435585';
const GUILD_ID = process.env.DISCORD_GUILD_ID;

async function findAllConnections() {
  console.log('Finding all connections for user:', DISCORD_USER_ID);

  try {
    const allConnections = await convex.query('debugAllConnections:getAllConnectionsForUser', {
      discordUserId: DISCORD_USER_ID,
      guildId: GUILD_ID,
    });

    console.log('\n📋 Total connections found:', allConnections.length);
    console.log('');

    allConnections.forEach((conn, index) => {
      console.log(`Connection ${index + 1}:`);
      console.log('  ID:', conn.id);
      console.log('  Wallet:', conn.walletAddress);
      console.log('  Length:', conn.walletLength);
      console.log('  Active:', conn.active);
      console.log('  Username:', conn.discordUsername);
      console.log('  Linked:', new Date(conn.linkedAt).toISOString());
      console.log('');
    });

    // Also check for truncated addresses across all users
    console.log('\n🔍 Searching for truncated addresses in all connections...');
    const truncated = await convex.query('debugAllConnections:findTruncatedAddresses', {
      guildId: GUILD_ID,
    });

    if (truncated.length === 0) {
      console.log('✅ No truncated addresses found');
    } else {
      console.log(`⚠️ Found ${truncated.length} truncated addresses:`);
      truncated.forEach((conn, index) => {
        console.log(`\n${index + 1}. User: ${conn.discordUsername} (${conn.discordUserId})`);
        console.log('   Wallet:', conn.walletAddress);
        console.log('   Length:', conn.walletLength);
        console.log('   First chars:', conn.firstChars);
        console.log('   Active:', conn.active);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

findAllConnections();
