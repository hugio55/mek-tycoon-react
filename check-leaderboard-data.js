// Quick script to test the leaderboard query directly
const { ConvexHttpClient } = require("convex/browser");

const client = new ConvexHttpClient("https://gorgeous-gerbil-809.convex.cloud");

async function testLeaderboard() {
  console.log('Testing leaderboard query...\n');

  try {
    const result = await client.query("goldLeaderboard:getTopGoldMiners", {});

    console.log('=== LEADERBOARD RESULTS ===\n');

    if (!result || result.length === 0) {
      console.log('No verified miners found in leaderboard');
      return;
    }

    result.forEach((miner, idx) => {
      console.log(`Rank #${idx + 1}:`);
      console.log(`  Company: ${miner.displayWallet}`);
      console.log(`  Wallet: ${miner.walletAddress}`);
      console.log(`  Current Gold: ${miner.currentGold}`);
      console.log(`  Hourly Rate: ${miner.hourlyRate}`);
      console.log(`  Mek Count: ${miner.mekCount}`);
      console.log('');
    });

    // Check specifically for "Low Mek co"
    const lowMekCo = result.find(m => m.displayWallet === 'Low Mek co');
    if (lowMekCo) {
      console.log('✓ Found "Low Mek co" in leaderboard!');
      console.log(`  Position: #${lowMekCo.rank}`);
      console.log(`  Gold Value: ${lowMekCo.currentGold}`);
    } else {
      console.log('✗ "Low Mek co" not found in top 5');
      console.log('  They may be ranked lower or not verified');
    }

  } catch (error) {
    console.error('Error querying leaderboard:', error);
  }
}

testLeaderboard();