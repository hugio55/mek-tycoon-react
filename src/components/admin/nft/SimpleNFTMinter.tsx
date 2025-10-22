'use client';

import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function SimpleNFTMinter() {
  const [step, setStep] = useState<'project' | 'mint'>('project');
  const [projectUid, setProjectUid] = useState('');
  const [nftName, setNftName] = useState('Test NFT');
  const [imageUrl, setImageUrl] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const createProject = useAction(api.nmkrApi.createProject);
  const mintTestNFT = useAction(api.nmkrApi.mintTestNFT);

  const handleCreateProject = async () => {
    if (!nftName) {
      alert('Please enter a project name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const project = await createProject({
        projectName: nftName,
        description: 'Simple test project',
        policyExpires: true,
      });

      setProjectUid(project.projectUid);
      setResult(project);
      setStep('mint');
      alert(`Project created! Project UID: ${project.projectUid}`);
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleMintNFT = async () => {
    if (!projectUid || !nftName || !imageUrl || !receiverAddress) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const mintResult = await mintTestNFT({
        projectUid,
        nftName,
        imageUrl,
        receiverAddress,
      });

      setResult(mintResult);
      alert(`Success! NFT minted. TX: ${mintResult.txHash}`);
    } catch (err: any) {
      console.error('Error minting NFT:', err);
      setError(err.message || 'Failed to mint NFT');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-yellow-400 uppercase tracking-wider font-['Orbitron']">
          Simple NFT Minter
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Test minting a single NFT on Cardano mainnet
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border-2 border-red-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">❌</div>
            <div>
              <h4 className="text-red-400 font-bold uppercase tracking-wider mb-2">
                Error
              </h4>
              <p className="text-sm text-gray-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="bg-green-900/20 border-2 border-green-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">✅</div>
            <div className="flex-1">
              <h4 className="text-green-400 font-bold uppercase tracking-wider mb-2">
                Success!
              </h4>
              <div className="text-sm text-gray-300 space-y-1 font-mono">
                {result.projectUid && <p>Project UID: {result.projectUid}</p>}
                {result.policyId && <p>Policy ID: {result.policyId}</p>}
                {result.txHash && (
                  <p>
                    TX Hash:{' '}
                    <a
                      href={`https://cardanoscan.io/transaction/${result.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {result.txHash}
                    </a>
                  </p>
                )}
                {result.assetId && <p>Asset ID: {result.assetId}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step Indicator */}
      <div className="flex items-center gap-4">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded ${
            step === 'project'
              ? 'bg-yellow-500/20 border-2 border-yellow-500'
              : 'bg-green-500/20 border-2 border-green-500'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              step === 'project' ? 'bg-yellow-500' : 'bg-green-500'
            } text-black font-bold`}
          >
            {step === 'project' ? '1' : '✓'}
          </div>
          <span className="text-white font-bold text-sm">Create Project</span>
        </div>

        <div className="flex-1 h-0.5 bg-gray-700" />

        <div
          className={`flex items-center gap-2 px-4 py-2 rounded ${
            step === 'mint'
              ? 'bg-yellow-500/20 border-2 border-yellow-500'
              : 'bg-gray-700 border-2 border-gray-600'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              step === 'mint' ? 'bg-yellow-500' : 'bg-gray-600'
            } text-black font-bold`}
          >
            2
          </div>
          <span
            className={`${
              step === 'mint' ? 'text-white' : 'text-gray-500'
            } font-bold text-sm`}
          >
            Mint NFT
          </span>
        </div>
      </div>

      {/* Step 1: Create Project */}
      {step === 'project' && (
        <div className="bg-black/50 border-2 border-yellow-500/30 rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-bold text-yellow-400 uppercase tracking-wider">
            Step 1: Create NMKR Project
          </h3>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              Project Name *
            </label>
            <input
              type="text"
              value={nftName}
              onChange={(e) => setNftName(e.target.value)}
              placeholder="My Test NFT Project"
              className="w-full px-4 py-3 bg-black/70 border-2 border-gray-700 rounded text-white focus:border-yellow-500 focus:outline-none transition-all"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              This creates a new project on NMKR where you'll mint your NFT
            </p>
          </div>

          <button
            onClick={handleCreateProject}
            disabled={loading || !nftName}
            className="w-full px-6 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wider transition-all shadow-lg shadow-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Project...' : '🚀 Create Project on NMKR'}
          </button>

          {projectUid && (
            <button
              onClick={() => setStep('mint')}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold uppercase tracking-wider transition-all"
            >
              Next: Mint NFT →
            </button>
          )}
        </div>
      )}

      {/* Step 2: Mint NFT */}
      {step === 'mint' && (
        <div className="bg-black/50 border-2 border-yellow-500/30 rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-bold text-yellow-400 uppercase tracking-wider">
            Step 2: Mint Your NFT
          </h3>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              Project UID (auto-filled)
            </label>
            <input
              type="text"
              value={projectUid}
              onChange={(e) => setProjectUid(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded text-gray-400 font-mono text-sm"
              readOnly
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              NFT Name *
            </label>
            <input
              type="text"
              value={nftName}
              onChange={(e) => setNftName(e.target.value)}
              placeholder="My Awesome NFT"
              className="w-full px-4 py-3 bg-black/70 border-2 border-gray-700 rounded text-white focus:border-yellow-500 focus:outline-none transition-all"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              Image URL (IPFS or HTTP) *
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://ipfs.io/ipfs/... or https://..."
              className="w-full px-4 py-3 bg-black/70 border-2 border-gray-700 rounded text-white focus:border-yellow-500 focus:outline-none transition-all"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Your NFT artwork (hosted on IPFS or any public URL)
            </p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              Receiver Wallet Address *
            </label>
            <input
              type="text"
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              placeholder="addr1..."
              className="w-full px-4 py-3 bg-black/70 border-2 border-gray-700 rounded text-white font-mono text-sm focus:border-yellow-500 focus:outline-none transition-all"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              The Cardano wallet that will receive the NFT
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('project')}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold uppercase tracking-wider transition-all"
              disabled={loading}
            >
              ← Back
            </button>
            <button
              onClick={handleMintNFT}
              disabled={loading || !projectUid || !nftName || !imageUrl || !receiverAddress}
              className="flex-1 px-6 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wider transition-all shadow-lg shadow-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Minting NFT...' : '✨ Mint NFT to Wallet'}
            </button>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-900/20 border-2 border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <h4 className="text-blue-400 font-bold uppercase tracking-wider mb-2">
              About This Tool
            </h4>
            <div className="text-sm text-gray-300 space-y-1">
              <p>
                <strong>Step 1:</strong> Creates a new project on NMKR (container for your
                NFTs)
              </p>
              <p>
                <strong>Step 2:</strong> Mints 1 NFT and sends it directly to your wallet
              </p>
              <p className="text-yellow-400 mt-2">
                ⚠️ This mints on MAINNET using real ADA for transaction fees
              </p>
              <p className="text-gray-400 text-xs mt-2">
                Perfect for testing before minting 50-100 commemorative tokens!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
