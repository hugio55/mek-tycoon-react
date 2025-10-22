'use client';

import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function SimpleNFTMinter() {
  const [step, setStep] = useState<'project' | 'mint'>('project');
  const [projectUid, setProjectUid] = useState('');
  const [nftName, setNftName] = useState('Test NFT');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [receiverAddress, setReceiverAddress] = useState('');
  const [apiKey, setApiKey] = useState('b51a09ab3dd14e2a83140a2a77b8bb80');
  const [payoutWallet, setPayoutWallet] = useState('addr1q8vannuzy5gfds8l7ysgv00vh8agfhzya63axm892njfg9k9jepr2cn2u8q95dp429cykmdt6sycz34swye2rlnqztcs2ztyq6');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const createProject = useAction(api.nmkrApi.createProject);
  const mintTestNFT = useAction(api.nmkrApi.mintTestNFT);
  const generateUploadUrl = useAction(api.files.generateUploadUrl);
  const listProjects = useAction(api.nmkrApi.listProjects);

  const handleLoadProjects = async () => {
    if (!apiKey) {
      alert('Please enter API key first');
      return;
    }

    setLoadingProjects(true);
    setError(null);

    try {
      const projectsList = await listProjects({ apiKey });
      setProjects(projectsList);
    } catch (err: any) {
      console.error('Error loading projects:', err);
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    setError(null);

    try {
      // Step 1: Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload file to Convex storage
      const uploadResult = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResult.ok) {
        throw new Error('Failed to upload image');
      }

      const { storageId } = await uploadResult.json();

      // Step 3: Get public URL
      // Convex storage URLs are: https://[deployment].convex.cloud/api/storage/[storageId]
      const convexUrl = `https://wry-trout-962.convex.cloud/api/storage/${storageId}`;

      setImageUrl(convexUrl);
      alert(`Image uploaded successfully!`);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateProject = async () => {
    if (!nftName) {
      alert('Please enter a project name');
      return;
    }

    if (!apiKey || !payoutWallet) {
      alert('Please enter API key and payout wallet');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const project = await createProject({
        projectName: nftName,
        description: 'Simple test project',
        policyExpires: true,
        apiKey,
        payoutWallet,
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

    if (!apiKey) {
      alert('Please enter API key');
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
        apiKey,
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
            Step 1: Create or Select NMKR Project
          </h3>

          {/* Option to use existing project */}
          <div className="bg-blue-900/20 border-2 border-blue-500/30 rounded-lg p-4 space-y-4">
            <label className="block text-xs uppercase tracking-wider text-blue-400 font-bold">
              📋 Use Existing Project (Optional)
            </label>

            {/* Manual Project UID Entry */}
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wider text-gray-400">
                Enter Project UID Manually:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={projectUid}
                  onChange={(e) => setProjectUid(e.target.value.trim())}
                  placeholder="37f3f44a1d004aceb88aa43fb400cedd"
                  className="flex-1 px-4 py-2 bg-black/70 border-2 border-gray-700 rounded text-white font-mono text-sm focus:border-blue-500 focus:outline-none transition-all"
                  disabled={loading}
                />
                {projectUid && (
                  <button
                    onClick={() => setStep('mint')}
                    className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold uppercase tracking-wider transition-all text-sm whitespace-nowrap"
                  >
                    Use This →
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Paste your NMKR project UID from Studio or .env file
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-700"></div>
              <span className="text-xs text-gray-500 uppercase">Or Load From API</span>
              <div className="flex-1 h-px bg-gray-700"></div>
            </div>

            {projects.length === 0 ? (
              <div className="space-y-3">
                <button
                  onClick={handleLoadProjects}
                  disabled={loadingProjects || !apiKey}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingProjects ? '⏳ Loading Projects...' : '📂 Load My Projects'}
                </button>
                <p className="text-xs text-gray-500">
                  Click to see your existing NMKR projects
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  value={projectUid}
                  onChange={(e) => setProjectUid(e.target.value)}
                  className="w-full px-4 py-3 bg-black/70 border-2 border-gray-700 rounded text-white focus:border-blue-500 focus:outline-none transition-all"
                  disabled={loading}
                >
                  <option value="">Select a project...</option>
                  {projects.map((project) => (
                    <option key={project.uid} value={project.uid}>
                      {project.projectname || project.name || 'Unnamed'} ({project.uid?.slice(0, 8)}...)
                    </option>
                  ))}
                </select>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setProjects([]);
                      setProjectUid('');
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold uppercase tracking-wider transition-all"
                  >
                    Clear
                  </button>
                  {projectUid && (
                    <button
                      onClick={() => setStep('mint')}
                      className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold uppercase tracking-wider transition-all"
                    >
                      Use This Project →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-700"></div>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Or Create New</span>
            <div className="flex-1 h-px bg-gray-700"></div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              NMKR API Key *
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your NMKR API key"
              className="w-full px-4 py-3 bg-black/70 border-2 border-gray-700 rounded text-white font-mono text-sm focus:border-yellow-500 focus:outline-none transition-all"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              From NMKR Studio API settings
            </p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              Payout Wallet Address *
            </label>
            <input
              type="text"
              value={payoutWallet}
              onChange={(e) => setPayoutWallet(e.target.value)}
              placeholder="addr1..."
              className="w-full px-4 py-3 bg-black/70 border-2 border-gray-700 rounded text-white font-mono text-sm focus:border-yellow-500 focus:outline-none transition-all"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Cardano wallet for receiving payments (required by NMKR)
            </p>
          </div>

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
            disabled={loading || !nftName || !apiKey || !payoutWallet}
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
              NFT Artwork *
            </label>

            {/* File Upload Button */}
            {!imageUrl && (
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      handleImageUpload(file);
                    }
                  }}
                  disabled={loading || uploadingImage}
                  className="hidden"
                  id="nft-image-upload"
                />
                <label
                  htmlFor="nft-image-upload"
                  className="block w-full px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider transition-all text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingImage ? '⏳ Uploading Image...' : '📁 Upload Artwork'}
                </label>
                <p className="text-xs text-gray-500">
                  Upload your NFT artwork (PNG, JPG, GIF, WebP)<br/>
                  <span className="text-blue-400">NMKR will automatically upload this to IPFS when minting</span>
                </p>
              </div>
            )}

            {/* Show uploaded image */}
            {imageUrl && (
              <div className="space-y-3">
                <div className="relative bg-black/70 border-2 border-green-500 rounded p-4">
                  <img
                    src={imageUrl}
                    alt="NFT Preview"
                    className="w-full max-w-xs mx-auto rounded"
                  />
                  <button
                    onClick={() => {
                      setImageUrl('');
                      setImageFile(null);
                    }}
                    className="absolute top-2 right-2 px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase rounded"
                  >
                    Remove
                  </button>
                </div>
                <div className="bg-green-900/20 border border-green-500/50 rounded p-2">
                  <p className="text-xs text-green-400 font-mono break-all">
                    ✓ Uploaded: {imageUrl}
                  </p>
                </div>
              </div>
            )}
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
                <strong>Step 2:</strong> Upload artwork → NMKR automatically uploads to IPFS → Mints NFT to your wallet
              </p>
              <p className="text-blue-400 mt-2">
                🌐 IPFS: NMKR automatically stores your image on IPFS (permanent, decentralized)
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
