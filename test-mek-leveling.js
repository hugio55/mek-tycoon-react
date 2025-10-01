const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Capture console messages
  const logs = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });

  try {
    console.log('Navigating to Mek rate logging page...');
    await page.goto('http://localhost:3100/mek-rate-logging', { waitUntil: 'networkidle' });

    // Wait for page to fully load
    await page.waitForTimeout(3000);

    // Take initial screenshot (before wallet connection)
    await page.screenshot({
      path: 'mek-leveling-no-wallet.png',
      fullPage: true
    });
    console.log('Initial screenshot (no wallet) saved as mek-leveling-no-wallet.png');

    console.log('Injecting mock wallet and Cardano API...');

    // Inject mock Cardano wallet API to simulate wallet connection
    await page.evaluate(() => {
      // Mock Cardano wallet API
      window.cardano = {
        nami: {
          isEnabled: () => Promise.resolve(true),
          enable: () => Promise.resolve({
            getNetworkId: () => Promise.resolve(1),
            getUtxos: () => Promise.resolve([]),
            getBalance: () => Promise.resolve('0'),
            getUsedAddresses: () => Promise.resolve(['addr1test123']),
            getUnusedAddresses: () => Promise.resolve(['addr1test456']),
            getRewardAddresses: () => Promise.resolve(['stake1test789']),
            getCollateral: () => Promise.resolve([]),
            signData: () => Promise.resolve({
              signature: 'mock_signature',
              key: 'mock_key'
            }),
            submitTx: () => Promise.resolve('mock_tx_hash'),
            signTx: () => Promise.resolve('mock_signed_tx')
          }),
          name: 'Nami',
          icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMjIgMTJMMTIgMjJMMiAxMkwxMiAyWiIgZmlsbD0iIzAwN0FGRiIvPgo8L3N2Zz4K',
          apiVersion: '0.1.0'
        }
      };

      // Set up mock localStorage data for automatic wallet connection
      const mockWalletData = {
        walletName: 'Nami',
        stakeAddress: 'stake1u_test_address_for_development_testing_purposes_only',
        paymentAddress: 'addr1_test_payment_address_for_development_testing',
        timestamp: Date.now(),
        cachedMeks: [
          {
            asset_name: '4d656b30303031',
            quantity: '1',
            policy_id: 'ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3',
            asset: 'ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3.4d656b30303031'
          },
          {
            asset_name: '4d656b30303032',
            quantity: '1',
            policy_id: 'ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3',
            asset: 'ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3.4d656b30303032'
          }
        ]
      };

      localStorage.setItem('mek_wallet_session', JSON.stringify(mockWalletData));

      console.log('Mock Cardano wallet API injected and localStorage set');
    });

    // Refresh the page to trigger wallet reconnection
    console.log('Refreshing page to trigger wallet reconnection...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // Give more time for wallet connection simulation

    // Take screenshot after mock wallet connection
    await page.screenshot({
      path: 'mek-leveling-with-wallet.png',
      fullPage: true
    });
    console.log('Screenshot with mock wallet connection saved as mek-leveling-with-wallet.png');

    // Look for Mek cards more specifically
    const mekCards = await page.locator('[class*="bg-black"], [class*="border"], .card, [class*="mek"]').count();
    console.log(`Found ${mekCards} potential card elements`);

    // Look for level upgrade components more specifically
    const levelTexts = await page.locator('text=/Level \\d+/').count();
    const upgradeButtons = await page.locator('text=/Upgrade to Level/').count();
    const goldCosts = await page.locator('text=/\\d+ Gold/').count();

    console.log(`Found ${levelTexts} level displays`);
    console.log(`Found ${upgradeButtons} upgrade buttons`);
    console.log(`Found ${goldCosts} gold cost displays`);

    // Look for the specific MekLevelUpgrade component content
    const levelUpgradeComponents = await page.locator('text="Upgrade Cost", text="MAX LEVEL"').count();
    console.log(`Found ${levelUpgradeComponents} level upgrade component elements`);

    // Check if any specific level upgrade UI elements are visible
    const upgradeElements = await page.locator('.text-yellow-400, .bg-yellow-500, [class*="upgrade"]').count();
    console.log(`Found ${upgradeElements} potential upgrade UI elements`);

    // Take a focused screenshot of the main content area
    const mainContent = page.locator('main, [class*="container"], [class*="grid"]').first();
    if (await mainContent.count() > 0) {
      await mainContent.screenshot({
        path: 'mek-main-content.png'
      });
      console.log('Main content area screenshot saved as mek-main-content.png');
    }

    // Print console messages
    console.log('\n--- Console Messages ---');
    logs.forEach(log => console.log(log));

    // Check if wallet connection indicators are present
    const walletConnected = await page.locator('text="Connected", text="Nami", text="Wallet"').count();
    console.log(`Found ${walletConnected} wallet connection indicators`);

    // Look for any error messages
    const errorMessages = await page.locator('.text-red-400, .text-red-500, [class*="error"]').count();
    console.log(`Found ${errorMessages} error message elements`);

  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  }

  // Keep browser open for manual inspection
  console.log('\nBrowser will stay open for manual inspection. Press Ctrl+C to close.');
  await new Promise(() => {}); // Keep running
})();