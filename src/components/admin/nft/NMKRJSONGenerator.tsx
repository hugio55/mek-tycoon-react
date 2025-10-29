'use client';

import { useState } from 'react';
import JSZip from 'jszip';
import {
  generateNMKRMetadataFiles,
  validateMetadataParams,
  getDefaultDescription,
  getDownloadFilename,
  type NMKRMetadataParams
} from '@/lib/nmkr/metadataGenerator';

export default function NMKRJSONGenerator() {
  // Form state
  const [collectionName, setCollectionName] = useState('Beta Commemorative');
  const [tokenBaseName, setTokenBaseName] = useState('Bronze Token');
  const [numberOfNFTs, setNumberOfNFTs] = useState(5);
  const [phase, setPhase] = useState(1);
  const [description, setDescription] = useState(
    'Exclusive commemorative NFT awarded to Phase 1 beta testers of Mek Tycoon. Beta Commemorative collection.'
  );
  const [imageIpfsHash, setImageIpfsHash] = useState('');
  const [artist, setArtist] = useState('Wren Ellis');
  const [company, setCompany] = useState('Over Exposed');
  const [game, setGame] = useState('Mek Tycoon');

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [previewMetadata, setPreviewMetadata] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Generate preview
  const handleGeneratePreview = () => {
    const params: NMKRMetadataParams = {
      collectionName,
      tokenBaseName,
      numberOfNFTs,
      phase,
      description,
      imageIpfsHash: imageIpfsHash || undefined,
      artist,
      company,
      game
    };

    const validation = validateMetadataParams(params);
    if (!validation.valid) {
      setMessage({ type: 'error', text: validation.errors.join(', ') });
      return;
    }

    const files = generateNMKRMetadataFiles(params);
    const firstFile = JSON.parse(files[0].content);
    setPreviewMetadata(firstFile);
    setShowPreview(true);
    setMessage(null);
  };

  // Generate and download ZIP
  const handleDownloadZip = async () => {
    const params: NMKRMetadataParams = {
      collectionName,
      tokenBaseName,
      numberOfNFTs,
      phase,
      description,
      imageIpfsHash: imageIpfsHash || undefined,
      artist,
      company,
      game
    };

    const validation = validateMetadataParams(params);
    if (!validation.valid) {
      setMessage({ type: 'error', text: validation.errors.join(', ') });
      return;
    }

    try {
      setMessage({ type: 'info', text: `Generating ${numberOfNFTs} metadata files...` });

      const files = generateNMKRMetadataFiles(params);
      const zip = new JSZip();

      // Add each metadata file to ZIP
      files.forEach(file => {
        zip.file(file.filename, file.content);
      });

      // Generate ZIP blob
      const blob = await zip.generateAsync({ type: 'blob' });

      // Download ZIP
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = getDownloadFilename(tokenBaseName, phase);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setMessage({ type: 'success', text: `✅ Downloaded ${numberOfNFTs} metadata files as ${getDownloadFilename(tokenBaseName, phase)}` });
    } catch (error) {
      console.error('ZIP generation error:', error);
      setMessage({ type: 'error', text: 'Failed to generate ZIP file' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur border-2 border-yellow-500/30 rounded-lg p-6">
        <h3 className="text-2xl font-bold text-yellow-400 mb-2 uppercase tracking-wider">
          📦 NMKR Metadata Generator
        </h3>
        <p className="text-gray-400 text-sm">
          Generate bulk .metadata JSON files for NMKR Studio drag-and-drop upload.
          Upload 1 image + N metadata files = N NFTs with same artwork.
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-lg border-2 ${
          message.type === 'success' ? 'bg-green-900/20 border-green-500/50 text-green-400' :
          message.type === 'error' ? 'bg-red-900/20 border-red-500/50 text-red-400' :
          'bg-blue-900/20 border-blue-500/50 text-blue-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Basic Config */}
        <div className="space-y-4 bg-black/30 border border-yellow-500/20 rounded-lg p-6">
          <h4 className="text-lg font-bold text-yellow-400 mb-4 uppercase">Basic Configuration</h4>

          {/* Collection Name */}
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-2">Collection Name</label>
            <input
              type="text"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              className="w-full bg-black/50 border border-yellow-500/30 rounded px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
              placeholder="Beta Commemorative"
            />
          </div>

          {/* Token Base Name */}
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-2">Token Base Name</label>
            <input
              type="text"
              value={tokenBaseName}
              onChange={(e) => setTokenBaseName(e.target.value)}
              className="w-full bg-black/50 border border-yellow-500/30 rounded px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
              placeholder="Bronze Token"
            />
            <p className="text-xs text-gray-500 mt-1">
              Files will be named: "{tokenBaseName} #1.metadata", "#2.metadata", etc.
            </p>
          </div>

          {/* Number of NFTs */}
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-2">Number of NFTs</label>
            <input
              type="number"
              min="1"
              max="1000"
              value={numberOfNFTs}
              onChange={(e) => setNumberOfNFTs(parseInt(e.target.value) || 1)}
              className="w-full bg-black/50 border border-yellow-500/30 rounded px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Test with 5, production: 35, 100, 150, etc.
            </p>
          </div>

          {/* Phase */}
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-2">Phase Number</label>
            <input
              type="number"
              min="1"
              value={phase}
              onChange={(e) => setPhase(parseInt(e.target.value) || 1)}
              className="w-full bg-black/50 border border-yellow-500/30 rounded px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Right Column: Advanced Config */}
        <div className="space-y-4 bg-black/30 border border-yellow-500/20 rounded-lg p-6">
          <h4 className="text-lg font-bold text-yellow-400 mb-4 uppercase">Advanced Configuration</h4>

          {/* Description */}
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-2">Description Template</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-black/50 border border-yellow-500/30 rounded px-4 py-2 text-white focus:border-yellow-400 focus:outline-none resize-none"
            />
          </div>

          {/* IPFS Hash (Optional) */}
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-2">Image IPFS Hash (Optional)</label>
            <input
              type="text"
              value={imageIpfsHash}
              onChange={(e) => setImageIpfsHash(e.target.value)}
              className="w-full bg-black/50 border border-yellow-500/30 rounded px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
              placeholder="QmXxxx... or leave empty"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty - NMKR will populate after you upload artwork
            </p>
          </div>

          {/* Artist */}
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-2">Artist</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full bg-black/50 border border-yellow-500/30 rounded px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-2">Company</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full bg-black/50 border border-yellow-500/30 rounded px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
            />
          </div>

          {/* Game */}
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-2">Game</label>
            <input
              type="text"
              value={game}
              onChange={(e) => setGame(e.target.value)}
              className="w-full bg-black/50 border border-yellow-500/30 rounded px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleGeneratePreview}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider rounded transition-all shadow-lg shadow-blue-600/30"
        >
          👁️ Preview Token #1
        </button>
        <button
          onClick={handleDownloadZip}
          className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wider rounded transition-all shadow-lg shadow-yellow-500/30"
        >
          💾 Download {numberOfNFTs} Metadata Files (ZIP)
        </button>
      </div>

      {/* Preview Section */}
      {showPreview && previewMetadata && (
        <div className="bg-black/50 backdrop-blur border-2 border-blue-500/50 rounded-lg p-6">
          <h4 className="text-xl font-bold text-blue-400 mb-4 uppercase">
            Preview: {tokenBaseName} #1
          </h4>

          {/* Visual Preview (Wallet Card Style) */}
          <div className="mb-6 bg-gradient-to-br from-gray-900 to-black border border-yellow-500/30 rounded-lg p-6 max-w-md">
            <div className="aspect-square bg-gray-800 rounded-lg mb-4 flex items-center justify-center border border-gray-600">
              {imageIpfsHash ? (
                <span className="text-xs text-gray-500">Image: ipfs://{imageIpfsHash}</span>
              ) : (
                <span className="text-xs text-gray-500">[Artwork Preview]<br/>Upload to NMKR</span>
              )}
            </div>
            <h5 className="text-xl font-bold text-yellow-400 mb-2">{previewMetadata.name}</h5>
            <p className="text-sm text-gray-400 mb-3">{previewMetadata.description}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-black/50 rounded p-2">
                <span className="text-gray-500 uppercase">Phase:</span>
                <span className="text-yellow-400 font-bold ml-2">{previewMetadata.Phase}</span>
              </div>
              <div className="bg-black/50 rounded p-2">
                <span className="text-gray-500 uppercase">Collection:</span>
                <span className="text-yellow-400 font-bold ml-2 truncate">{previewMetadata.Collection}</span>
              </div>
              <div className="bg-black/50 rounded p-2">
                <span className="text-gray-500 uppercase">Artist:</span>
                <span className="text-yellow-400 font-bold ml-2 truncate">{previewMetadata.Artist}</span>
              </div>
              <div className="bg-black/50 rounded p-2">
                <span className="text-gray-500 uppercase">Company:</span>
                <span className="text-yellow-400 font-bold ml-2 truncate">{previewMetadata.Company}</span>
              </div>
              <div className="bg-black/50 rounded p-2 col-span-2">
                <span className="text-gray-500 uppercase">Game:</span>
                <span className="text-yellow-400 font-bold ml-2">{previewMetadata.Game}</span>
              </div>
            </div>
          </div>

          {/* JSON Preview */}
          <div>
            <h5 className="text-sm font-bold text-gray-400 mb-2 uppercase">Metadata JSON Structure</h5>
            <pre className="bg-black/70 border border-gray-700 rounded p-4 text-xs text-gray-300 overflow-x-auto">
              {JSON.stringify(previewMetadata, null, 2)}
            </pre>
          </div>

          <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded">
            <p className="text-sm text-green-400">
              ✅ This metadata structure is CIP-25 compliant and ready for NMKR Studio.
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-black/30 border border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-bold text-gray-300 mb-3 uppercase">📖 How to Use</h4>
        <ol className="space-y-2 text-sm text-gray-400 list-decimal list-inside">
          <li>Fill out the form above with your collection details</li>
          <li>Click "Preview Token #1" to verify metadata structure</li>
          <li>Click "Download Metadata Files" to get ZIP containing all .metadata files</li>
          <li>Extract ZIP contents to a folder on your computer</li>
          <li>In NMKR Studio:
            <ul className="ml-8 mt-1 space-y-1 list-disc list-inside">
              <li>Upload your artwork image (bronze.png, silver.png, etc.)</li>
              <li>Drag and drop all .metadata files from extracted folder</li>
              <li>NMKR creates N NFTs all pointing to same image with unique metadata</li>
            </ul>
          </li>
          <li>Configure pricing and whitelist in NMKR, then launch!</li>
        </ol>
      </div>
    </div>
  );
}
