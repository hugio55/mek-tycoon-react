// Stub implementation - NFT fetching disabled for now
export async function initializeWithBlockfrost(params: {
  walletAddress: string;
  stakeAddress: string;
  walletType: string;
  paymentAddresses: string[];
}) {
  console.log('[blockfrostInit] Stub - NFT fetching disabled');
  return {
    success: false,
    error: 'Blockfrost integration not implemented',
    mekCount: 0,
    meks: []
  };
}
