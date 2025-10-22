'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';

interface ArtUploadManagerProps {
  onArtSelected?: (mainArtUrl: string, thumbnailUrl?: string) => void;
  onCancel?: () => void;
  currentArtUrl?: string;
}

type UploadMode = 'url' | 'file' | 'library';

export default function ArtUploadManager({ onArtSelected, onCancel, currentArtUrl }: ArtUploadManagerProps) {
  const [uploadMode, setUploadMode] = useState<UploadMode>('url');
  const [artUrl, setArtUrl] = useState(currentArtUrl || '');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentArtUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Art library query (from nftArtAssets table)
  const artLibrary = useQuery(api.nftArtAssets?.getArtLibrary);

  const handleFileSelect = (file: File) => {
    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'];

    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload an image (JPG, PNG, GIF, WebP) or video (MP4).');
      return;
    }

    if (file.size > maxSize) {
      alert('File too large. Maximum size is 10MB.');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUrlSubmit = () => {
    if (!artUrl) {
      alert('Please enter an art URL');
      return;
    }

    // Validate URL format
    try {
      new URL(artUrl);
    } catch {
      alert('Invalid URL format');
      return;
    }

    setPreviewUrl(artUrl);
  };

  const handleSave = () => {
    const finalArtUrl = uploadMode === 'url' ? artUrl : previewUrl;

    if (!finalArtUrl) {
      alert('Please select or upload art before saving');
      return;
    }

    onArtSelected?.(finalArtUrl, thumbnailUrl || undefined);
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      alert('No file selected');
      return;
    }

    // Simulate upload progress
    // TODO: Replace with actual Convex file upload when implemented
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // For now, just use the preview URL
    setTimeout(() => {
      alert('File upload will be implemented with Convex storage in future update.\nFor now, please use direct URLs from IPFS or CDN.');
      setUploadProgress(0);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-black/50 border-2 border-yellow-500/30 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-yellow-400 uppercase tracking-wider font-['Orbitron']">
          NFT Art Upload
        </h2>
        <p className="text-gray-400 mt-2">
          Upload or select artwork for your NFT variation
        </p>
      </div>

      {/* Upload Mode Selection */}
      <div className="flex gap-3">
        <button
          onClick={() => setUploadMode('url')}
          className={`flex-1 px-4 py-3 font-bold uppercase tracking-wider transition-all ${
            uploadMode === 'url'
              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
              : 'bg-black/50 text-gray-400 border border-yellow-500/30 hover:text-yellow-400'
          }`}
        >
          🔗 Direct URL
        </button>
        <button
          onClick={() => setUploadMode('file')}
          className={`flex-1 px-4 py-3 font-bold uppercase tracking-wider transition-all ${
            uploadMode === 'file'
              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
              : 'bg-black/50 text-gray-400 border border-yellow-500/30 hover:text-yellow-400'
          }`}
        >
          📁 File Upload
        </button>
        <button
          onClick={() => setUploadMode('library')}
          className={`flex-1 px-4 py-3 font-bold uppercase tracking-wider transition-all ${
            uploadMode === 'library'
              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
              : 'bg-black/50 text-gray-400 border border-yellow-500/30 hover:text-yellow-400'
          }`}
        >
          📚 Art Library
        </button>
      </div>

      {/* URL Input Mode */}
      {uploadMode === 'url' && (
        <div className="bg-black/50 border-2 border-gray-700 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              Main Art URL *
            </label>
            <div className="flex gap-3">
              <input
                type="url"
                value={artUrl}
                onChange={(e) => setArtUrl(e.target.value)}
                placeholder="https://ipfs.io/ipfs/..."
                className="flex-1 px-4 py-3 bg-black/50 border-2 border-gray-700 rounded text-white focus:border-yellow-500 focus:outline-none transition-all"
              />
              <button
                onClick={handleUrlSubmit}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider transition-all"
              >
                Preview
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter IPFS, Arweave, or CDN URL for your NFT artwork
            </p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              Thumbnail URL (optional)
            </label>
            <input
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://ipfs.io/ipfs/..."
              className="w-full px-4 py-3 bg-black/50 border-2 border-gray-700 rounded text-white focus:border-yellow-500 focus:outline-none transition-all"
            />
          </div>
        </div>
      )}

      {/* File Upload Mode */}
      {uploadMode === 'file' && (
        <div className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
              isDragging
                ? 'border-yellow-500 bg-yellow-500/10'
                : 'border-gray-700 bg-black/30'
            }`}
          >
            <div className="space-y-4">
              <div className="text-6xl">📤</div>
              <div>
                <p className="text-white font-bold mb-2">
                  Drag and drop your artwork here
                </p>
                <p className="text-gray-400 text-sm">
                  or click to browse files
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wider transition-all"
              >
                Browse Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <p className="text-xs text-gray-500">
                Supported formats: JPG, PNG, GIF, WebP, MP4 (max 10MB)
              </p>
            </div>
          </div>

          {selectedFile && (
            <div className="bg-black/50 border-2 border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">📄</div>
                  <div>
                    <p className="text-white font-bold">{selectedFile.name}</p>
                    <p className="text-gray-400 text-sm">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleUploadFile}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold uppercase text-sm"
                >
                  Upload
                </button>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Uploading...</span>
                    <span className="text-yellow-400">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Art Library Mode */}
      {uploadMode === 'library' && (
        <div className="bg-black/50 border-2 border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 mb-4">
            Select from previously uploaded artwork
          </p>
          <div className="grid grid-cols-3 gap-4">
            {artLibrary && artLibrary.length > 0 ? (
              artLibrary.map((art: any) => (
                <button
                  key={art._id}
                  onClick={() => {
                    setPreviewUrl(art.mainArtUrl);
                    setArtUrl(art.mainArtUrl);
                    if (art.thumbnailUrl) {
                      setThumbnailUrl(art.thumbnailUrl);
                    }
                  }}
                  className="border-2 border-gray-700 hover:border-yellow-500 rounded-lg overflow-hidden transition-all"
                >
                  <img
                    src={art.thumbnailUrl || art.mainArtUrl}
                    alt={art.assetName}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-2 bg-black/50">
                    <p className="text-xs text-white truncate">{art.assetName}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-gray-500">
                No artwork in library yet. Upload files to build your library.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      {previewUrl && (
        <div className="bg-black/50 border-2 border-green-500/30 rounded-lg p-6">
          <h3 className="text-lg font-bold text-green-400 uppercase tracking-wider mb-4">
            Preview
          </h3>
          <div className="flex justify-center">
            {previewUrl.endsWith('.mp4') ? (
              <video
                src={previewUrl}
                controls
                className="max-w-full max-h-96 rounded-lg border-2 border-gray-700"
              />
            ) : (
              <img
                src={previewUrl}
                alt="NFT Preview"
                className="max-w-full max-h-96 rounded-lg border-2 border-gray-700"
                onError={() => alert('Failed to load image. Please check the URL.')}
              />
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold uppercase tracking-wider transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!previewUrl}
          className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wider transition-all shadow-lg shadow-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Use This Artwork
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border-2 border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <h4 className="text-blue-400 font-bold uppercase tracking-wider mb-2">
              Recommended Specifications
            </h4>
            <div className="text-sm text-gray-300 space-y-1">
              <p><strong className="text-white">Main Art:</strong> 1000x1000px or larger, PNG/WebP preferred</p>
              <p><strong className="text-white">Thumbnail:</strong> 300x300px, optimized for fast loading</p>
              <p><strong className="text-white">File Size:</strong> Keep under 10MB for optimal performance</p>
              <p><strong className="text-white">Hosting:</strong> Use IPFS or Arweave for permanent storage</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
