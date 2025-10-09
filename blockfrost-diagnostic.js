const fetch = require('node-fetch');

const STAKE_ADDRESS = 'stake1u9sjc4ug2n4t7h3te2sqpvk6vda98zn5248lx0kp3hzzrygeajf8r';
const POLICY_ID = 'ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3';
const API_KEY = 'mainnetVVJ62rD2aJxjvDQvsABxGSPy4jtaMAbW';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Attempt ${i+1} failed:`, error.message);
      if (i < retries - 1) {
        await sleep(1000 * (i + 1)); // Exponential backoff
      }
    }
  }
  throw new Error('Max retries exceeded');
}

async function main() {
  console.log('Blockfrost NFT Diagnostic Tool');
  console.log('===============================\n');
  console.log('Stake Address:', STAKE_ADDRESS);
  console.log('Policy ID:', POLICY_ID);
  console.log('\n');

  const headers = {
    'project_id': API_KEY,
    'Content-Type': 'application/json'
  };

  // Step 1: Get account info
  console.log('[1/5] Fetching account info...');
  const account = await fetchWithRetry(
    `https://cardano-mainnet.blockfrost.io/api/v0/accounts/${STAKE_ADDRESS}`,
    { headers }
  );

  if (!account) {
    console.error('ERROR: Stake address not found!');
    return;
  }

  console.log('  ✓ Account found');
  console.log('  - Controlled total:', account.controlled_amount, 'lovelace');
  console.log('  - Rewards:', account.rewards_sum, 'lovelace');

  // Step 2: Get all addresses
  console.log('\n[2/5] Fetching associated addresses...');
  await sleep(100);
  const addresses = await fetchWithRetry(
    `https://cardano-mainnet.blockfrost.io/api/v0/accounts/${STAKE_ADDRESS}/addresses`,
    { headers }
  );

  console.log(`  ✓ Found ${addresses.length} addresses`);
  addresses.forEach((addr, idx) => {
    console.log(`    ${idx+1}. ${addr.address}`);
  });

  // Step 3: Fetch UTXOs from all addresses
  console.log('\n[3/5] Fetching UTXOs from all addresses...');
  const allAssets = [];
  const mekAssets = [];

  for (const addressObj of addresses) {
    const address = addressObj.address;
    console.log(`\n  Scanning address: ${address.substring(0, 20)}...`);

    let page = 1;
    let hasMore = true;
    let addressMeks = 0;

    while (hasMore) {
      await sleep(100); // Rate limiting

      const utxos = await fetchWithRetry(
        `https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}/utxos?page=${page}&count=100`,
        { headers }
      );

      if (!utxos || utxos.length === 0) {
        hasMore = false;
        continue;
      }

      console.log(`    Page ${page}: ${utxos.length} UTXOs`);

      // Extract assets from UTXOs
      for (const utxo of utxos) {
        if (utxo.amount && Array.isArray(utxo.amount)) {
          for (const asset of utxo.amount) {
            if (asset.unit === 'lovelace') continue;

            allAssets.push(asset);

            // Check if it's a Mek
            if (asset.unit.startsWith(POLICY_ID)) {
              // Parse Mek number
              const assetNameHex = asset.unit.replace(POLICY_ID, '');
              let assetName = '';
              for (let i = 0; i < assetNameHex.length; i += 2) {
                const charCode = parseInt(assetNameHex.substr(i, 2), 16);
                if (charCode >= 32 && charCode <= 126) {
                  assetName += String.fromCharCode(charCode);
                }
              }

              const mekMatch = assetName.match(/Mekanism(\d+)/i);
              if (mekMatch) {
                const mekNumber = parseInt(mekMatch[1], 10);
                mekAssets.push({
                  assetId: asset.unit,
                  mekNumber: mekNumber,
                  name: `Mek #${mekNumber}`,
                  quantity: parseInt(asset.quantity || '1', 10)
                });
                addressMeks++;
              }
            }
          }
        }
      }

      hasMore = utxos.length === 100;
      page++;
    }

    console.log(`    ✓ Found ${addressMeks} Meks in this address`);
  }

  // Step 4: Analyze results
  console.log('\n[4/5] Analysis Results:');
  console.log('========================');
  console.log(`Total assets found: ${allAssets.length}`);
  console.log(`Mek NFTs found: ${mekAssets.length}`);
  console.log(`Expected from pool.pm: 246`);
  console.log(`Difference: ${246 - mekAssets.length}`);

  // Sort Meks by number
  mekAssets.sort((a, b) => a.mekNumber - b.mekNumber);

  // Check for duplicates
  const mekNumbers = mekAssets.map(m => m.mekNumber);
  const uniqueNumbers = [...new Set(mekNumbers)];
  if (mekNumbers.length !== uniqueNumbers.length) {
    console.log('\n⚠️  WARNING: Duplicate Meks found!');
    const dupes = mekNumbers.filter((num, idx) => mekNumbers.indexOf(num) !== idx);
    console.log('Duplicates:', [...new Set(dupes)]);
  }

  // Show first 10 and last 10 Meks
  console.log('\n[5/5] Sample Meks:');
  console.log('First 10:');
  mekAssets.slice(0, 10).forEach(m => {
    console.log(`  - ${m.name} (${m.assetId.substring(0, 80)}...)`);
  });

  console.log('\nLast 10:');
  mekAssets.slice(-10).forEach(m => {
    console.log(`  - ${m.name} (${m.assetId.substring(0, 80)}...)`);
  });

  // Export full list to file
  const fs = require('fs');
  fs.writeFileSync(
    './blockfrost-meks-found.json',
    JSON.stringify(mekAssets, null, 2)
  );
  console.log('\n✓ Full list saved to: blockfrost-meks-found.json');

  // Save just the Mek numbers for easy comparison
  fs.writeFileSync(
    './blockfrost-mek-numbers.txt',
    mekNumbers.sort((a, b) => a - b).join('\n')
  );
  console.log('✓ Mek numbers saved to: blockfrost-mek-numbers.txt');
}

main().catch(console.error);
