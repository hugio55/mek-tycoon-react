require('dotenv').config();
const { ConvexHttpClient } = require('convex/browser');

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://fabulous-sturgeon-691.convex.cloud';
const convex = new ConvexHttpClient(CONVEX_URL);

const DISCORD_USER_ID = '362994796186435585';
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const CORRECT_WALLET = 'stake1u8zevs34vf4wrsz6xs64zuztdk4agzvpg6c8zv4plesp9ughgq076';

async function fixTruncatedWallet() {
  console.log('Fixing truncated wallet for user:', DISCORD_USER_ID);
  console.log('Correct wallet address:', CORRECT_WALLET);
  console.log('Wallet length:', CORRECT_WALLET.length);

  try {
    const result = await convex.mutation('debugDiscordConnection:fixTruncatedWallet', {
      discordUserId: DISCORD_USER_ID,
      guildId: GUILD_ID,
      correctWalletAddress: CORRECT_WALLET,
    });

    if (!result.success) {
      console.log('❌ Failed:', result.message);
      return;
    }

    console.log('\n✅ Successfully updated wallet address');
    console.log('Old address:', result.oldAddress);
    console.log('New address:', result.newAddress);
    console.log('Users table also updated:', result.userTableUpdated);

    // Verify the fix
    console.log('\nVerifying fix...');
    const checkResult = await convex.query('debugDiscordConnection:debugGetConnection', {
      discordUserId: DISCORD_USER_ID,
      guildId: GUILD_ID,
    });

    if (checkResult.found) {
      console.log('✅ Verified - Wallet address is now:', checkResult.walletAddress);
      console.log('Length:', checkResult.walletLength);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

fixTruncatedWallet();
