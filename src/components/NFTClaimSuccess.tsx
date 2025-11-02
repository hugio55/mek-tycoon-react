'use client';

interface NFTClaimSuccessProps {
  claim: {
    nftName: string;
    nftAssetId: string;
    transactionHash: string;
    claimedAt: number;
    metadata?: {
      imageUrl?: string;
      collection?: string;
      artist?: string;
      website?: string;
      attributes?: Array<{
        trait_type: string;
        value: string;
      }>;
    };
  };
  onClose: () => void;
}

export default function NFTClaimSuccess({ claim, onClose }: NFTClaimSuccessProps) {
  // Default metadata if not provided
  const metadata = claim.metadata || {
    imageUrl: '/commemorative-nft.png',
  };

  return (
    <div className="w-full">
      {/* Success Header */}
      <div className="text-center mb-6">
        <div className="h-16 w-16 bg-green-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-4xl">✓</span>
        </div>
        <h2 className="text-3xl font-bold text-green-400 mb-2">Claimed!</h2>
        <p className="text-gray-400">Your NFT has been successfully minted</p>
      </div>

      {/* NFT Display Card - Simplified */}
      <div className="bg-black/60 border-2 border-green-500/50 rounded-lg overflow-hidden mb-6">
        {/* NFT Image */}
        {metadata.imageUrl ? (
          <div className="aspect-square bg-gradient-to-br from-green-500/10 to-cyan-500/10 flex items-center justify-center">
            <img
              src={metadata.imageUrl}
              alt={claim.nftName}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-square bg-gradient-to-br from-green-500/10 to-cyan-500/10 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🏅</div>
              <p className="text-gray-400">NFT Image</p>
            </div>
          </div>
        )}

        {/* NFT Name */}
        <div className="p-4 border-t-2 border-green-500/30">
          <h3 className="text-xl font-bold text-green-400 text-center">
            {claim.nftName}
          </h3>
        </div>
      </div>

      {/* Single Close Button - Centered */}
      <button
        onClick={onClose}
        className="w-full px-6 py-3 bg-green-500/20 border-2 border-green-500 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-bold"
      >
        Close
      </button>

      {/* Info text */}
      <p className="text-center text-xs text-gray-500 mt-4">
        Your NFT has been sent to your wallet. It may take a few minutes to appear.
      </p>
    </div>
  );
}
