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
  const [displayNameBase, setDisplayNameBase] = useState('Bronze Token');
  const [tokenBaseName, setTokenBaseName] = useState('MekBetaBronzeToken');
  const [numberOfNFTs, setNumberOfNFTs] = useState(5);
  const [phase, setPhase] = useState(1);
  const [description, setDescription] = useState('Exclusive commemorative NFT.');
  const [imageIpfsHash, setImageIpfsHash] = useState('');
  const [policyId, setPolicyId] = useState('532d6ff5a573411477245efec146aa4fa2f69acc474a005f6105748b');

  // Custom metadata fields (dynamic)
  const [customFields, setCustomFields] = useState<Array<{name: string; value: string | number}>>([
    { name: 'Collection', value: 'Beta Commemorative' },
    { name: 'Game', value: 'Mek Tycoon' },
    { name: 'Artist', value: 'Wren Ellis' },
    { name: 'Company', value: 'Over Exposed' },
    { name: 'Phase', value: 1 }
  ]);

  // Add field modal state
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [previewMetadata, setPreviewMetadata] = useState<any>(null);
  const [previewTokenNumber, setPreviewTokenNumber] = useState(1);
  const [allMetadataFiles, setAllMetadataFiles] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Image duplication state
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Reserved CIP-25 field names that cannot be used as custom fields
  const RESERVED_FIELDS = ['name', 'description', 'image', 'mediaType', 'website'];

  // Handle custom field operations
  const handleAddField = () => {
    const trimmedName = newFieldName.trim();

    if (!trimmedName) {
      setMessage({ type: 'error', text: 'Field name cannot be empty' });
      return;
    }

    if (RESERVED_FIELDS.includes(trimmedName)) {
      setMessage({ type: 'error', text: `"${trimmedName}" is a reserved field name and cannot be used` });
      return;
    }

    if (customFields.some(f => f.name === trimmedName)) {
      setMessage({ type: 'error', text: 'Field name already exists' });
      return;
    }

    const value = !isNaN(Number(newFieldValue)) && newFieldValue.trim() !== ''
      ? Number(newFieldValue)
      : newFieldValue;

    setCustomFields([...customFields, { name: newFieldName, value }]);
    setNewFieldName('');
    setNewFieldValue('');
    setShowAddFieldModal(false);
    setMessage(null);
  };

  const handleRemoveField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleUpdateField = (index: number, newValue: string) => {
    const value = !isNaN(Number(newValue)) && newValue.trim() !== ''
      ? Number(newValue)
      : newValue;

    const updated = [...customFields];
    updated[index] = { ...updated[index], value };
    setCustomFields(updated);
  };

  // Generate preview
  const handleGeneratePreview = () => {
    const params: NMKRMetadataParams = {
      collectionName,
      displayNameBase,
      tokenBaseName,
      numberOfNFTs,
      phase,
      description,
      policyId,
      imageIpfsHash: imageIpfsHash || undefined,
      customFields
    };

    const validation = validateMetadataParams(params);
    if (!validation.valid) {
      setMessage({ type: 'error', text: validation.errors.join(', ') });
      return;
    }

    // Generate all metadata files
    const files = generateNMKRMetadataFiles(params);
    const parsedFiles = files.map(f => JSON.parse(f.content));

    // Store all files for navigation
    setAllMetadataFiles(parsedFiles);

    // Show first token
    setPreviewTokenNumber(1);
    setPreviewMetadata(parsedFiles[0]);
    setShowPreview(true);
    setMessage(null);
  };

  // Navigate between tokens in preview
  const handlePreviewNext = () => {
    if (previewTokenNumber < numberOfNFTs) {
      const nextNum = previewTokenNumber + 1;
      setPreviewTokenNumber(nextNum);
      setPreviewMetadata(allMetadataFiles[nextNum - 1]);
    }
  };

  const handlePreviewPrevious = () => {
    if (previewTokenNumber > 1) {
      const prevNum = previewTokenNumber - 1;
      setPreviewTokenNumber(prevNum);
      setPreviewMetadata(allMetadataFiles[prevNum - 1]);
    }
  };

  const handlePreviewJumpTo = (tokenNum: number) => {
    if (tokenNum >= 1 && tokenNum <= numberOfNFTs) {
      setPreviewTokenNumber(tokenNum);
      setPreviewMetadata(allMetadataFiles[tokenNum - 1]);
    }
  };

  // Handle image upload
  const handleImageUpload = (file: File) => {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Please upload a valid image file (PNG, JPG, GIF, or WebP)' });
      return;
    }

    setUploadedImage(file);
    setMessage({ type: 'success', text: `✅ Image uploaded: ${file.name}` });
  };

  // Handle drag-and-drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  // Generate and download duplicated images ZIP
  const handleDownloadImagesZip = async () => {
    if (!uploadedImage) {
      setMessage({ type: 'error', text: 'Please upload an image first' });
      return;
    }

    try {
      setMessage({ type: 'info', text: `Creating ${numberOfNFTs} image copies...` });

      const zip = new JSZip();

      // Get file extension from original file
      const extension = uploadedImage.name.split('.').pop() || 'png';

      // Read the image file as ArrayBuffer
      const imageBuffer = await uploadedImage.arrayBuffer();

      // Create N copies with display name - must match metadata filename pattern
      for (let i = 1; i <= numberOfNFTs; i++) {
        const filename = `${displayNameBase} #${i}.${extension}`;
        zip.file(filename, imageBuffer);
      }

      // Generate ZIP blob
      const blob = await zip.generateAsync({ type: 'blob' });

      // Download ZIP
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const zipFilename = `${displayNameBase.replace(/\s+/g, '')}_Images.zip`;
      a.download = zipFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setMessage({ type: 'success', text: `✅ Downloaded ${numberOfNFTs} images as ${zipFilename}` });
    } catch (error) {
      console.error('Image duplication error:', error);
      setMessage({ type: 'error', text: 'Failed to generate image ZIP file' });
    }
  };

  // Generate and download ZIP
  const handleDownloadZip = async () => {
    const params: NMKRMetadataParams = {
      collectionName,
      displayNameBase,
      tokenBaseName,
      numberOfNFTs,
      phase,
      description,
      policyId,
      imageIpfsHash: imageIpfsHash || undefined,
      customFields
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

          {/* Display Name Base */}
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-2">Display Name Base (Can Have Spaces)</label>
            <input
              type="text"
              value={displayNameBase}
              onChange={(e) => setDisplayNameBase(e.target.value)}
              className="w-full bg-black/50 border border-yellow-500/30 rounded px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
              placeholder="Bronze Token"
            />
            <p className="text-xs text-gray-500 mt-1">
              Display names: {displayNameBase} #1, {displayNameBase} #2, etc. (shown on pool.pm)
            </p>
          </div>

          {/* Token Base Name */}
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-2">Token Base Name (Asset Name - No Spaces)</label>
            <input
              type="text"
              value={tokenBaseName}
              onChange={(e) => {
                // Sanitize: only allow alphanumeric, underscores, hyphens (Cardano requirement)
                const sanitized = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
                setTokenBaseName(sanitized);
              }}
              className="w-full bg-black/50 border border-yellow-500/30 rounded px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
              placeholder="MekBetaBronzeToken"
            />
            <p className="text-xs text-gray-500 mt-1">
              On-chain asset names: {tokenBaseName}1, {tokenBaseName}2, etc. (no spaces/special chars)
            </p>
            <div className="mt-2 p-3 bg-blue-900/20 border border-blue-500/30 rounded">
              <p className="text-xs text-blue-300">
                <strong>Display Name vs Asset Name:</strong><br/>
                • <strong>Display Name</strong> (shown on pool.pm): "{displayNameBase} #1", "{displayNameBase} #2"<br/>
                • <strong>Asset Name</strong> (on-chain identifier): {tokenBaseName}1, {tokenBaseName}2
              </p>
            </div>
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

          {/* Policy ID */}
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-2">Cardano Policy ID</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={policyId}
                onChange={(e) => setPolicyId(e.target.value)}
                className="flex-1 bg-black/50 border border-yellow-500/30 rounded px-4 py-2 text-white focus:border-yellow-400 focus:outline-none font-mono text-xs"
                placeholder="532d6ff5a573411477245efec146aa4fa2f69acc474a005f6105748b"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(policyId);
                  setMessage({ type: 'success', text: 'Policy ID copied!' });
                  setTimeout(() => setMessage(null), 2000);
                }}
                className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-400 font-bold text-xs uppercase rounded transition-all"
                title="Copy Policy ID"
              >
                📋
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              56-character hex string from NMKR project (required for CIP-25 structure)
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-2">Description (63 char NMKR limit)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={63}
              rows={3}
              className="w-full bg-black/50 border border-yellow-500/30 rounded px-4 py-2 text-white focus:border-yellow-400 focus:outline-none resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              {description.length}/63 characters
              {description.length >= 60 && (
                <span className="text-red-400 ml-2 font-bold">Approaching limit!</span>
              )}
            </p>
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

          {/* Custom Metadata Fields */}
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-2">Custom Metadata Fields</label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {customFields.map((field, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-black/50 border border-yellow-500/20 rounded px-3 py-2 hover:border-yellow-500/40 transition-colors"
                >
                  <span className="text-xs text-gray-400 font-bold uppercase min-w-[80px]">{field.name}:</span>
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => handleUpdateField(index, e.target.value)}
                    className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none"
                  />
                  <button
                    onClick={() => handleRemoveField(index)}
                    className="text-red-500 hover:text-red-400 font-bold text-lg"
                    title="Remove field"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowAddFieldModal(true)}
              className="mt-2 w-full px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-400 font-bold text-sm uppercase tracking-wider rounded transition-all"
            >
              + Add Custom Field
            </button>
          </div>
        </div>
      </div>

      {/* Image Duplication Section */}
      <div className="bg-black/50 backdrop-blur border-2 border-yellow-500/30 rounded-lg p-6">
        <h3 className="text-2xl font-bold text-yellow-400 mb-2 uppercase tracking-wider">
          🖼️ Image Duplication Tool
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Upload your NFT artwork once, and automatically generate {numberOfNFTs} copies named for NMKR bulk upload.
          Files will be named: {displayNameBase} #1.png, {displayNameBase} #2.png, etc.
        </p>

        {/* Drag-and-Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-4 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-yellow-400 bg-yellow-500/10'
              : uploadedImage
              ? 'border-green-500/50 bg-green-900/10'
              : 'border-yellow-500/30 bg-black/30 hover:border-yellow-400/60 hover:bg-black/50'
          }`}
        >
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {uploadedImage ? (
            <div className="space-y-4">
              <div className="text-6xl">✅</div>
              <div>
                <p className="text-xl font-bold text-green-400 mb-1">{uploadedImage.name}</p>
                <p className="text-sm text-gray-400">
                  {(uploadedImage.size / 1024 / 1024).toFixed(2)} MB • {uploadedImage.type}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadedImage(null);
                  setMessage(null);
                }}
                className="inline-block px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm uppercase rounded transition-all"
              >
                Remove Image
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-6xl">📤</div>
              <div>
                <p className="text-xl font-bold text-yellow-400 mb-2">
                  {isDragging ? 'Drop image here!' : 'Drag & drop your NFT artwork here'}
                </p>
                <p className="text-sm text-gray-400">
                  or click to browse • PNG, JPG, GIF, WebP supported
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Download Images Button */}
        {uploadedImage && (
          <div className="mt-6">
            <button
              onClick={handleDownloadImagesZip}
              className="w-full px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wider rounded transition-all shadow-lg shadow-yellow-500/30"
            >
              📦 Download {numberOfNFTs} Image Copies (ZIP)
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              This will create {numberOfNFTs} copies of {uploadedImage.name} named as: {displayNameBase} #1.{uploadedImage.name.split('.').pop()}, {displayNameBase} #2.{uploadedImage.name.split('.').pop()}, etc.
            </p>
          </div>
        )}
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

      {/* Add Field Modal */}
      {showAddFieldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowAddFieldModal(false)}>
          <div className="bg-black border-2 border-yellow-500/50 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-xl font-bold text-yellow-400 mb-4 uppercase">Add Custom Metadata Field</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-gray-400 mb-2">Field Name</label>
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="e.g., Rarity, Edition, Series"
                  className="w-full bg-black/50 border border-yellow-500/30 rounded px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-gray-400 mb-2">Field Value</label>
                <input
                  type="text"
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  placeholder="e.g., Legendary, 1, Commemorative"
                  className="w-full bg-black/50 border border-yellow-500/30 rounded px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Can be text or number</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddFieldModal(false);
                    setNewFieldName('');
                    setNewFieldValue('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold uppercase tracking-wider rounded transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddField}
                  className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wider rounded transition-all"
                >
                  Add Field
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {showPreview && previewMetadata && (
        <div className="bg-black/50 backdrop-blur border-2 border-blue-500/50 rounded-lg p-6">
          {/* Navigation Header */}
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-bold text-blue-400 uppercase">
              Preview: Token {previewTokenNumber} of {numberOfNFTs}
            </h4>

            {/* Navigation Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePreviewPrevious}
                disabled={previewTokenNumber === 1}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded transition-all"
              >
                ← Previous
              </button>

              <select
                value={previewTokenNumber}
                onChange={(e) => handlePreviewJumpTo(parseInt(e.target.value))}
                className="px-4 py-2 bg-black border border-blue-500/50 text-white rounded focus:border-blue-400 focus:outline-none"
              >
                {Array.from({ length: numberOfNFTs }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>Token #{num}</option>
                ))}
              </select>

              <button
                onClick={handlePreviewNext}
                disabled={previewTokenNumber === numberOfNFTs}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded transition-all"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Extract metadata for visual display */}
          {(() => {
            if (!previewMetadata) return null;

            // Extract inner metadata from 721 structure
            const innerMetadata = previewMetadata?.["721"]?.["<policy_id>"]?.["<asset_name>"];
            if (!innerMetadata) return null;

            return (
              <>
                {/* Visual Preview - pool.pm Style (Simple & Centered) */}
                <div className="mb-6 bg-black text-center py-12 px-8 rounded-lg max-w-2xl mx-auto">
                  {/* Display Name - Prominent at Top (like pool.pm) */}
                  <div className="mb-12">
                    <h3 className="text-4xl font-bold text-blue-400 mb-2">{displayNameBase} #{previewTokenNumber}</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Display Name (from &lt;display_name&gt; placeholder)</p>
                  </div>

                  {/* Metadata Section - Order matches pool.pm display */}
                  <div className="border-t border-gray-800 pt-8">
                    <div className="space-y-6">
                      {/* Display custom fields in order (matches pool.pm) */}
                      {customFields.map((field) => (
                        <div key={field.name}>
                          <div className="text-gray-400 text-sm uppercase mb-1">{field.name}</div>
                          <div className="text-white text-base">{field.value}</div>
                        </div>
                      ))}

                      {/* Description */}
                      <div>
                        <div className="text-gray-400 text-sm uppercase mb-1">Description</div>
                        <div className="text-white text-base">{innerMetadata.description}</div>
                      </div>

                      {/* Website */}
                      <div>
                        <div className="text-gray-400 text-sm uppercase mb-1">Website</div>
                        <div className="text-white text-base">{innerMetadata.website}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* JSON Preview - NMKR Bulk Upload Format */}
                <div>
                  <h5 className="text-sm font-bold text-gray-400 mb-2 uppercase">NMKR Bulk Upload Format with Placeholders</h5>
                  <pre className="bg-black/70 border border-gray-700 rounded p-4 text-xs text-gray-300 overflow-x-auto max-h-96">
                    {JSON.stringify(previewMetadata, null, 2)}
                  </pre>
                </div>

                <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded">
                  <p className="text-sm text-green-400">
                    ✅ This is the correct NMKR format with CIP-25 structure. Placeholders like &lt;policy_id&gt;, &lt;asset_name&gt;, &lt;ipfs_link&gt;, &lt;mime_type&gt; are automatically replaced by NMKR during minting.
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-black/30 border border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-bold text-gray-300 mb-3 uppercase">📖 How to Use</h4>
        <ol className="space-y-2 text-sm text-gray-400 list-decimal list-inside">
          <li>Fill out the form above with your collection details</li>
          <li>Click "Preview Token #1" to verify metadata structure</li>
          <li>Click "Download Metadata Files" to get ZIP containing all .metadata files</li>
          <li><strong className="text-yellow-400">NEW:</strong> Upload your NFT artwork in the Image Duplication Tool</li>
          <li>Click "Download Image Copies" to get ZIP with properly named images ({displayNameBase} #1.png, {displayNameBase} #2.png, etc.)</li>
          <li>Extract both ZIP files to a folder on your computer</li>
          <li>In NMKR Studio (Bulk Upload):
            <ul className="ml-8 mt-1 space-y-1 list-disc list-inside">
              <li>Drag and drop ALL files from extracted folders (both images and .metadata files)</li>
              <li>NMKR matches filename pairs: {displayNameBase} #1.png + {displayNameBase} #1.metadata = Token #1</li>
              <li>NMKR uses the filename as the display name on pool.pm: "{displayNameBase} #1", "{displayNameBase} #2", etc.</li>
              <li>NMKR creates N NFTs with unique images and metadata</li>
            </ul>
          </li>
          <li>Configure pricing and whitelist in NMKR, then launch!</li>
        </ol>
      </div>
    </div>
  );
}
