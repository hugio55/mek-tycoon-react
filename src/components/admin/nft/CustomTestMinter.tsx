'use client';

import { useState, useEffect } from 'react';
import { BrowserWallet } from '@meshsdk/core';
import { testBlockfrostConnection } from '@/lib/cardano/blockfrost';
import { generateSimplePolicy, generateAssetName, extractPaymentKeyHash } from '@/lib/cardano/policyGenerator';
import { buildTestNFTMetadata } from '@/lib/cardano/metadata';
import { mintNFT, getExplorerUrl } from '@/lib/cardano/mintingTx';
import { uploadFileToPinata, testPinataConnection } from '@/lib/cardano/pinata';

/**
 * Custom Test Minter - Phase 1
 *
 * Simple testnet NFT minting interface for development and testing
 */
export default function CustomTestMinter() {
  // Network state
  const network = process.env.NEXT_PUBLIC_CARDANO_NETWORK || 'preprod';
  const isTestnet = network !== 'mainnet';

  // Wallet state
  const [wallet, setWallet] = useState<BrowserWallet | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  // Service status
  const [blockfrostStatus, setBlockfrostStatus] = useState<{success: boolean; message: string} | null>(null);
  const [pinataStatus, setPinataStatus] = useState<{success: boolean; message: string} | null>(null);

  // Form state
  const [nftName, setNftName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Minting state
  const [minting, setMinting] = useState(false);
  const [mintProgress, setMintProgress] = useState('');
  const [mintResult, setMintResult] = useState<{txHash: string; explorerUrl: string} | null>(null);
  const [mintError, setMintError] = useState('');

  // Test Blockfrost and Pinata connections on load
  useEffect(() => {
    const testConnections = async () => {
      const blockfrostResult = await testBlockfrostConnection();
      setBlockfrostStatus(blockfrostResult);

      const pinataResult = await testPinataConnection();
      setPinataStatus(pinataResult);
    };
    testConnections();
  }, []);

  // Auto-reconnect wallet on load
  useEffect(() => {
    const autoConnect = async () => {
      const savedWallet = localStorage.getItem('mek_test_minter_wallet');
      if (savedWallet) {
        try {
          await connectWallet(savedWallet as 'nami' | 'eternl' | 'flint' | 'lace');
        } catch (error) {
          console.error('Auto-reconnect failed:', error);
          localStorage.removeItem('mek_test_minter_wallet');
        }
      }
    };
    autoConnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Connect wallet and save preference
  const connectWallet = async (walletName: 'nami' | 'eternl' | 'flint' | 'lace') => {
    try {
      if (typeof window === 'undefined') return;

      let walletApi;
      if (walletName === 'nami' && window.cardano?.nami) {
        walletApi = await window.cardano.nami.enable();
      } else if (walletName === 'eternl' && window.cardano?.eternl) {
        walletApi = await window.cardano.eternl.enable();
      } else if (walletName === 'flint' && window.cardano?.flint) {
        walletApi = await window.cardano.flint.enable();
      } else if (walletName === 'lace' && window.cardano?.lace) {
        walletApi = await window.cardano.lace.enable();
      } else {
        alert(`${walletName} wallet not found. Please install it first.`);
        return;
      }

      const browserWallet = new BrowserWallet(walletApi);
      setWallet(browserWallet);

      // Get wallet address in bech32 format (not hex)
      const changeAddress = await browserWallet.getChangeAddress();
      console.log('Wallet address (bech32):', changeAddress);
      setWalletAddress(changeAddress);

      setWalletConnected(true);
      setMintError('');

      // Save wallet preference
      localStorage.setItem('mek_test_minter_wallet', walletName);
      console.log(`✅ ${walletName} wallet connected and saved`);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle image file upload to IPFS via Pinata
  const handleImageUpload = async (file: File) => {
    setImageFile(file);
    setUploadingImage(true);
    setMintError('');

    try {
      console.log('📤 Uploading to IPFS via Pinata:', file.name);

      // Upload to Pinata IPFS
      const result = await uploadFileToPinata(file, {
        name: file.name,
        keyvalues: {
          project: 'Mek Tycoon',
          type: 'test-nft',
          network: network
        }
      });

      console.log('✅ IPFS Upload successful!');
      console.log('   IPFS Hash:', result.ipfsHash);
      console.log('   IPFS URL:', result.ipfsUrl);
      console.log('   Gateway URL:', result.gatewayUrl);

      // Set the IPFS URL (ipfs://...)
      setImageUrl(result.ipfsUrl);
      setUploadingImage(false);
    } catch (error) {
      console.error('❌ IPFS upload failed:', error);
      setMintError(error instanceof Error ? error.message : 'Failed to upload to IPFS');
      setImageFile(null);
      setUploadingImage(false);
    }
  };

  const handleMint = async () => {
    if (!wallet || !walletAddress) {
      setMintError('Please connect wallet first');
      return;
    }

    if (!nftName || !imageUrl) {
      setMintError('Please fill in NFT name and image URL');
      return;
    }

    setMinting(true);
    setMintProgress('Starting...');
    setMintError('');
    setMintResult(null);

    try {
      // Step 1: Extract payment key hash from wallet address
      setMintProgress('Extracting wallet credentials...');
      const paymentKeyHash = extractPaymentKeyHash(walletAddress);
      console.log('Payment Key Hash:', paymentKeyHash);

      // Step 2: Generate policy
      setMintProgress('Generating minting policy...');
      const policy = await generateSimplePolicy(paymentKeyHash);
      console.log('Policy ID:', policy.policyId);

      // Step 3: Generate asset name
      const assetName = generateAssetName(nftName);
      console.log('Asset Name (hex):', assetName);

      // Step 4: Build metadata
      setMintProgress('Building metadata...');
      const metadata = buildTestNFTMetadata(
        policy.policyId,
        assetName,
        {
          name: nftName,
          description: description || 'Test NFT from Mek Tycoon custom minting system',
          imageUrl: imageUrl,
          walletAddress: walletAddress
        }
      );

      // Step 5: Mint NFT
      setMintProgress('Building transaction...');
      const result = await mintNFT({
        wallet,
        policyId: policy.policyId,
        policyScript: policy.policyScript,
        assetName,
        metadata,
        recipientAddress: walletAddress,
        onProgress: (step) => setMintProgress(step)
      });

      setMintResult(result);
      setMintProgress('Success!');

      // Clear form
      setNftName('');
      setDescription('');
      setImageUrl('');
    } catch (error) {
      console.error('Minting failed:', error);
      setMintError(error instanceof Error ? error.message : 'Minting failed');
      setMintProgress('');
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Network Warning */}
      {isTestnet && (
        <div className="bg-yellow-500/10 border-2 border-yellow-500 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚠️</span>
            <div>
              <div className="text-yellow-400 font-bold uppercase tracking-wider">
                TESTNET MODE
              </div>
              <div className="text-sm text-gray-400">
                Connected to {network}. Using test ADA. NFTs have no real value.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Status */}
      <div className="grid grid-cols-2 gap-3">
        {/* Blockfrost Status */}
        <div className={`border-2 rounded-lg p-4 ${
          blockfrostStatus?.success
            ? 'bg-green-500/10 border-green-500'
            : 'bg-red-500/10 border-red-500'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{blockfrostStatus?.success ? '✅' : '❌'}</span>
            <div>
              <div className="text-sm font-bold uppercase tracking-wider">
                Blockfrost
              </div>
              <div className="text-xs text-gray-400">
                {blockfrostStatus?.success ? 'Connected' : 'Error'}
              </div>
            </div>
          </div>
        </div>

        {/* Pinata IPFS Status */}
        <div className={`border-2 rounded-lg p-4 ${
          pinataStatus?.success
            ? 'bg-green-500/10 border-green-500'
            : 'bg-red-500/10 border-red-500'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{pinataStatus?.success ? '✅' : '❌'}</span>
            <div>
              <div className="text-sm font-bold uppercase tracking-wider">
                Pinata IPFS
              </div>
              <div className="text-xs text-gray-400">
                {pinataStatus?.success ? 'Connected' : 'Not configured'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Connection */}
      <div className="bg-black/50 border-2 border-yellow-500/30 rounded-lg p-6">
        <h3 className="text-xl font-bold text-yellow-400 mb-4 uppercase tracking-wider">
          1. Connect Wallet
        </h3>

        {!walletConnected ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-400 mb-4">
              Connect your testnet wallet to mint NFTs. Make sure your wallet is set to <span className="text-yellow-400 font-bold">{network}</span> network.
            </p>
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={() => connectWallet('nami')}
                className="py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold uppercase tracking-wider transition-all"
                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
              >
                Nami
              </button>
              <button
                onClick={() => connectWallet('eternl')}
                className="py-3 bg-purple-500 hover:bg-purple-400 text-white font-bold uppercase tracking-wider transition-all"
                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
              >
                Eternl
              </button>
              <button
                onClick={() => connectWallet('flint')}
                className="py-3 bg-orange-500 hover:bg-orange-400 text-white font-bold uppercase tracking-wider transition-all"
                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
              >
                Flint
              </button>
              <button
                onClick={() => connectWallet('lace')}
                className="py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-bold uppercase tracking-wider transition-all"
                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
              >
                Lace
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-green-500/10 border border-green-500/30 rounded p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-400 uppercase tracking-wider">Connected</div>
                <div className="text-sm text-green-400 font-mono truncate">{walletAddress}</div>
              </div>
              <button
                onClick={() => {
                  setWallet(null);
                  setWalletConnected(false);
                  setWalletAddress('');
                  localStorage.removeItem('mek_test_minter_wallet');
                  console.log('🔌 Wallet disconnected and preference cleared');
                }}
                className="px-4 py-2 bg-red-500/20 border border-red-500 text-red-400 text-sm font-bold uppercase tracking-wider hover:bg-red-500/30 transition-all"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Minting Form */}
      {walletConnected && (
        <div className="bg-black/50 border-2 border-yellow-500/30 rounded-lg p-6">
          <h3 className="text-xl font-bold text-yellow-400 mb-4 uppercase tracking-wider">
            2. Create Test NFT
          </h3>

          <div className="space-y-4">
            {/* NFT Name */}
            <div>
              <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wider font-bold">
                NFT Name *
              </label>
              <input
                type="text"
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
                placeholder="My Test NFT"
                disabled={minting}
                className="w-full bg-black/70 border border-yellow-500/30 rounded px-4 py-2 text-white focus:border-yellow-500 focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wider font-bold">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Test NFT for custom minting system development"
                rows={3}
                disabled={minting}
                className="w-full bg-black/70 border border-yellow-500/30 rounded px-4 py-2 text-white focus:border-yellow-500 focus:outline-none resize-none disabled:opacity-50"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wider font-bold">
                NFT Image *
              </label>

              {!imageFile && !imageUrl ? (
                <div className="space-y-2">
                  {/* File Upload Button */}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    disabled={minting || uploadingImage}
                    className="hidden"
                    id="nft-image-upload"
                  />
                  <label
                    htmlFor="nft-image-upload"
                    className={`block w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wider text-center transition-all cursor-pointer ${
                      uploadingImage ? 'opacity-50 cursor-wait' : ''
                    }`}
                    style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                  >
                    {uploadingImage ? '⏳ Uploading...' : '📁 Upload Image'}
                  </label>
                  <p className="text-xs text-gray-500 text-center">
                    Or enter URL manually below
                  </p>
                </div>
              ) : (
                imageFile && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">✅</span>
                      <div className="flex-1">
                        <div className="text-green-400 font-bold">Image Uploaded</div>
                        <div className="text-xs text-gray-400">{imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB)</div>
                      </div>
                      <button
                        onClick={() => {
                          setImageFile(null);
                          setImageUrl('');
                        }}
                        className="px-3 py-1 bg-red-500/20 border border-red-500 text-red-400 text-sm font-bold uppercase hover:bg-red-500/30"
                      >
                        Remove
                      </button>
                    </div>
                    {/* Show preview */}
                    {imageFile.type.startsWith('image/') && (
                      <img
                        src={URL.createObjectURL(imageFile)}
                        alt="Preview"
                        className="mt-3 max-w-xs rounded border border-yellow-500/30"
                      />
                    )}
                  </div>
                )
              )}
            </div>

            {/* Image URL (Manual Entry) */}
            {!imageFile && (
              <div>
                <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wider font-bold">
                  Or Enter Image URL Manually (IPFS or HTTPS)
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="ipfs://QmXxxx... or https://..."
                  disabled={minting || uploadingImage}
                  className="w-full bg-black/70 border border-yellow-500/30 rounded px-4 py-2 text-white focus:border-yellow-500 focus:outline-none font-mono text-sm disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  For testing: https://picsum.photos/1000/1000
                </p>
              </div>
            )}

            {/* Mint Progress */}
            {mintProgress && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded p-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin text-2xl">⏳</div>
                  <div className="text-blue-400">{mintProgress}</div>
                </div>
              </div>
            )}

            {/* Error */}
            {mintError && (
              <div className="bg-red-500/10 border border-red-500 rounded p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">❌</span>
                  <div className="text-red-400">{mintError}</div>
                </div>
              </div>
            )}

            {/* Success */}
            {mintResult && (
              <div className="bg-green-500/10 border border-green-500 rounded p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">✅</span>
                  <div className="text-green-400 font-bold">NFT Minted Successfully!</div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Transaction Hash</div>
                    <div className="text-sm text-white font-mono break-all">{mintResult.txHash}</div>
                  </div>
                  <a
                    href={mintResult.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wider transition-all text-sm"
                    style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                  >
                    View on Explorer →
                  </a>
                </div>
              </div>
            )}

            {/* Mint Button */}
            <button
              onClick={handleMint}
              disabled={!nftName || !imageUrl || minting}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            >
              {minting ? 'MINTING...' : 'MINT TEST NFT'}
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-black/30 border border-gray-700 rounded-lg p-4">
        <h4 className="text-sm text-gray-400 uppercase tracking-wider mb-3 font-bold">
          📋 Test Minting Instructions
        </h4>
        <ol className="text-sm text-gray-500 space-y-2 list-decimal list-inside">
          <li>Ensure wallet is on <span className="text-yellow-400 font-bold">{network}</span> network</li>
          <li>Get testnet ADA from faucet: <a href="https://docs.cardano.org/cardano-testnet/tools/faucet/" target="_blank" className="text-blue-400 hover:underline">Cardano Faucet</a></li>
          <li>Connect your wallet above (Nami/Eternl/Flint/Lace)</li>
          <li>Enter NFT details (name and image URL required)</li>
          <li>Click "Mint Test NFT"</li>
          <li>Approve transaction in your wallet (~2-3 tADA)</li>
          <li>Wait ~20 seconds for confirmation</li>
          <li>NFT will appear in your wallet!</li>
        </ol>
      </div>
    </div>
  );
}
