require('dotenv').config();
const { ConvexHttpClient } = require('convex/browser');

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://fabulous-sturgeon-691.convex.cloud';
const convex = new ConvexHttpClient(CONVEX_URL);

const DISCORD_USER_ID = '362994796186435585';
const GUILD_ID = process.env.DISCORD_GUILD_ID;

async function checkWalletStorage() {
  console.log('Checking wallet storage for user:', DISCORD_USER_ID);
  console.log('Guild ID:', GUILD_ID);

  try {
    const result = await convex.query('debugDiscordConnection:debugGetConnection', {
      discordUserId: DISCORD_USER_ID,
      guildId: GUILD_ID,
    });

    if (!result.found) {
      console.log('❌ No connection found for this user');
      return;
    }

    console.log('\n✅ Connection found:');
    console.log('Wallet Address:', result.walletAddress);
    console.log('Wallet Length:', result.walletLength);
    console.log('Expected Length: 59 (for stake1 addresses)');
    console.log('Missing Characters:', 59 - result.walletLength);
    console.log('Discord Username:', result.discordUsername);
    console.log('Active:', result.active);
    console.log('Linked At:', new Date(result.linkedAt).toISOString());

    // Check if it's missing "stak" prefix
    if (!result.walletAddress.startsWith('stake1') && !result.walletAddress.startsWith('addr1')) {
      console.log('\n⚠️ WARNING: Wallet address does not start with "stake1" or "addr1"');
      console.log('First 10 characters:', result.walletAddress.substring(0, 10));

      // Try to reconstruct the correct address
      const possibleCorrectAddress = 'stak' + result.walletAddress;
      console.log('Possible correct address:', possibleCorrectAddress);
      console.log('Length after adding "stak":', possibleCorrectAddress.length);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkWalletStorage();
