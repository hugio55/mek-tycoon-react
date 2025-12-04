// DEPRECATED: This stub is no longer used.
// WalletConnectLightbox now calls the real Convex action directly:
//   api.goldMining.initializeWithBlockfrost
//
// The real implementation is in: convex/goldMining.ts (line ~718)
// and convex/blockfrostNftFetcher.ts for the NFT fetching logic.
//
// This file can be safely deleted.

export async function initializeWithBlockfrost(params: {
  walletAddress: string;
  stakeAddress: string;
  walletType: string;
  paymentAddresses: string[];
}) {
  console.warn('[blockfrostInit] DEPRECATED - This stub should not be called. Use api.goldMining.initializeWithBlockfrost instead.');
  return {
    success: false,
    error: 'This stub is deprecated. Use the Convex action instead.',
    mekCount: 0,
    meks: []
  };
}
