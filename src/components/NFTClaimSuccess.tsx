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
  const network = process.env.NEXT_PUBLIC_NMKR_NETWORK || 'mainnet';
  const explorerUrl = network === 'mainnet'
    ? `https://cardanoscan.io/transaction/${claim.transactionHash}`
    : `https://preprod.cardanoscan.io/transaction/${claim.transactionHash}`;

  // Default metadata if not provided
  const metadata = claim.metadata || {
    collection: 'Mek Tycoon',
    artist: 'Mek Tycoon Team',
    website: 'https://mek.overexposed.io',
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

      {/* NFT Display Card - pool.pm style */}
      <div className="bg-black/60 border-2 border-cyan-500/30 rounded-lg overflow-hidden mb-6">
        {/* NFT Image */}
        {metadata.imageUrl ? (
          <div className="aspect-square bg-gradient-to-br from-cyan-500/10 to-purple-500/10 flex items-center justify-center">
            <img
              src={metadata.imageUrl}
              alt={claim.nftName}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-square bg-gradient-to-br from-cyan-500/10 to-purple-500/10 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🏅</div>
              <p className="text-gray-400">NFT Image</p>
            </div>
          </div>
        )}

        {/* NFT Name */}
        <div className="p-4 border-t-2 border-cyan-500/30">
          <h3 className="text-xl font-bold text-cyan-400 text-center">
            {claim.nftName}
          </h3>
        </div>

        {/* Metadata - pool.pm style */}
        <div className="p-4 space-y-2 border-t-2 border-cyan-500/30">
          <MetadataRow label="Collection" value={metadata.collection || 'Mek Tycoon'} />
          <MetadataRow label="Game" value="Mek Tycoon" />
          {metadata.artist && <MetadataRow label="Artist" value={metadata.artist} />}
          <MetadataRow label="Company" value="Mek Tycoon Labs" />
          <MetadataRow label="Phase" value="Early Access" />
          {metadata.website && (
            <MetadataRow
              label="Website"
              value={
                <a
                  href={metadata.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  {metadata.website}
                </a>
              }
            />
          )}
        </div>

        {/* Attributes (if any) */}
        {metadata.attributes && metadata.attributes.length > 0 && (
          <div className="p-4 border-t-2 border-cyan-500/30">
            <h4 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
              Attributes
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {metadata.attributes.map((attr, index) => (
                <div
                  key={index}
                  className="bg-black/40 border border-cyan-500/20 rounded p-2"
                >
                  <p className="text-xs text-gray-500 uppercase">{attr.trait_type}</p>
                  <p className="text-sm text-cyan-400 font-semibold">{attr.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction Link */}
        <div className="p-4 border-t-2 border-cyan-500/30">
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center text-sm text-gray-400 hover:text-cyan-400 transition-colors"
          >
            <span className="mr-2">View on CardanoScan</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onClose}
          className="flex-1 px-6 py-3 bg-green-500/20 border-2 border-green-500 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-bold"
        >
          Close
        </button>

        {/* Greyed out "Claimed" button */}
        <button
          disabled
          className="flex-1 px-6 py-3 bg-gray-700/50 border-2 border-gray-600 text-gray-500 rounded-lg cursor-not-allowed font-bold"
        >
          Claimed ✓
        </button>
      </div>

      {/* Info text */}
      <p className="text-center text-xs text-gray-500 mt-4">
        Your NFT has been sent to your wallet. It may take a few minutes to appear.
      </p>
    </div>
  );
}

// Helper component for metadata rows
function MetadataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-gray-300 font-semibold">
        {typeof value === 'string' ? value : value}
      </span>
    </div>
  );
}
