/**
 * Blockfrost API Utilities
 *
 * Provides functions for interacting with Blockfrost API on Cardano
 *
 * References:
 * - Blockfrost Docs: https://docs.blockfrost.io/
 * - API Reference: https://docs.blockfrost.io/api/
 */

/**
 * Get Blockfrost configuration based on network
 */
export function getBlockfrostConfig() {
  const network = process.env.NEXT_PUBLIC_CARDANO_NETWORK || 'preprod';
  const isTestnet = network !== 'mainnet';

  return {
    network,
    isTestnet,
    projectId: isTestnet
      ? process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID_TESTNET
      : process.env.BLOCKFROST_PROJECT_ID,
    url: isTestnet
      ? process.env.NEXT_PUBLIC_BLOCKFROST_URL_TESTNET
      : process.env.BLOCKFROST_API_URL,
  };
}

/**
 * Test Blockfrost API connection
 *
 * References:
 * - Health endpoint: https://docs.blockfrost.io/#tag/Health
 */
export async function testBlockfrostConnection(): Promise<{success: boolean; message: string}> {
  const config = getBlockfrostConfig();

  if (!config.projectId || config.projectId.includes('YOUR_KEY_HERE')) {
    return {
      success: false,
      message: `❌ Blockfrost API key not configured. Please add ${config.isTestnet ? 'testnet' : 'mainnet'} key to .env.local`
    };
  }

  try {
    const response = await fetch(`${config.url}/health`, {
      headers: { 'project_id': config.projectId }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: `✅ Blockfrost connected (${config.network})${data.is_healthy ? ' - Healthy' : ''}`
      };
    } else {
      return {
        success: false,
        message: `❌ Blockfrost connection failed: ${response.status} ${response.statusText}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `❌ Blockfrost connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Get current blockchain slot number
 *
 * Used for time-locked minting policies
 *
 * References:
 * - Blocks endpoint: https://docs.blockfrost.io/#tag/Cardano-Blocks
 * - Time: https://docs.cardano.org/explore-cardano/time/
 */
export async function getCurrentSlot(): Promise<number> {
  const config = getBlockfrostConfig();

  const response = await fetch(`${config.url}/blocks/latest`, {
    headers: { 'project_id': config.projectId || '' }
  });

  if (!response.ok) {
    throw new Error(`Failed to get current slot: ${response.statusText}`);
  }

  const block = await response.json();
  return block.slot;
}

/**
 * Convert date to slot number
 *
 * Shelley era parameters:
 * - Slot length: 1 second
 * - Mainnet start: August 1, 2020 (Unix: 1596491091)
 * - Preprod start: June 1, 2022 (Unix: 1654041600) - approximate
 *
 * References:
 * - Time parameters: https://docs.cardano.org/explore-cardano/time/
 */
export function dateToSlot(date: Date, network: 'mainnet' | 'preprod' = 'preprod'): number {
  const shelleyStart = network === 'mainnet' ? 1596491091 : 1654041600;
  const slotLength = 1; // 1 second per slot

  const unixTimestamp = Math.floor(date.getTime() / 1000);
  const elapsedSeconds = unixTimestamp - shelleyStart;
  const slot = Math.floor(elapsedSeconds / slotLength);

  return Math.max(0, slot); // Ensure non-negative
}

/**
 * Convert slot to date
 */
export function slotToDate(slot: number, network: 'mainnet' | 'preprod' = 'preprod'): Date {
  const shelleyStart = network === 'mainnet' ? 1596491091 : 1654041600;
  const slotLength = 1;

  const unixTimestamp = shelleyStart + (slot * slotLength);
  return new Date(unixTimestamp * 1000);
}

/**
 * Get account info (balance, rewards, etc)
 *
 * References:
 * - Accounts endpoint: https://docs.blockfrost.io/#tag/Cardano-Accounts
 */
export async function getAccountInfo(stakeAddress: string) {
  const config = getBlockfrostConfig();

  const response = await fetch(`${config.url}/accounts/${stakeAddress}`, {
    headers: { 'project_id': config.projectId || '' }
  });

  if (!response.ok) {
    throw new Error(`Failed to get account info: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get transaction details
 *
 * References:
 * - Transactions endpoint: https://docs.blockfrost.io/#tag/Cardano-Transactions
 */
export async function getTransaction(txHash: string) {
  const config = getBlockfrostConfig();

  const response = await fetch(`${config.url}/txs/${txHash}`, {
    headers: { 'project_id': config.projectId || '' }
  });

  if (!response.ok) {
    throw new Error(`Failed to get transaction: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Submit a signed transaction to the blockchain
 *
 * References:
 * - Submit endpoint: https://docs.blockfrost.io/#tag/Cardano-Transactions/paths/~1tx~1submit/post
 */
export async function submitTransaction(signedTxCbor: string): Promise<string> {
  const config = getBlockfrostConfig();

  const response = await fetch(`${config.url}/tx/submit`, {
    method: 'POST',
    headers: {
      'project_id': config.projectId || '',
      'Content-Type': 'application/cbor'
    },
    body: signedTxCbor
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Transaction submission failed: ${error}`);
  }

  const result = await response.json();
  return result; // Returns transaction hash
}
