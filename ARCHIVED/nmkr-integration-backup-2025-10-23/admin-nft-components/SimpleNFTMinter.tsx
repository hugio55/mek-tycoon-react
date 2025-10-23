'use client';

import { useState } from 'react';
import { useAction, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface Subasset {
  id: string;
  file: File | null;
  url: string;
  name: string;
  description: string;
  uploading: boolean;
  mimetype?: string;
}

// Supported media types
const MEDIA_TYPES = [
  { value: 'image/png', label: 'PNG Image' },
  { value: 'image/jpeg', label: 'JPEG Image' },
  { value: 'image/gif', label: 'GIF Animation' },
  { value: 'image/webp', label: 'WebP Image' },
  { value: 'video/mp4', label: 'MP4 Video' },
  { value: 'video/quicktime', label: 'MOV Video' },
  { value: 'video/webm', label: 'WebM Video' },
];

interface MetadataField {
  id: string;
  key: string;
  value: string;
}

interface TemplateField {
  id: string;
  name: string; // field name (e.g., "artist", "game")
}

export default function SimpleNFTMinter() {
  const [step, setStep] = useState<'project' | 'mint'>('project');
  const [projectUid, setProjectUid] = useState('');
  const [nftName, setNftName] = useState('TestNFT'); // On-chain tokenname base
  const [displayName, setDisplayName] = useState('Test NFT'); // Display name for wallets
  const [description, setDescription] = useState(''); // NFT description
  const [imageUrl, setImageUrl] = useState('');
  const [imageStorageId, setImageStorageId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageMimetype, setImageMimetype] = useState<string>('image/png'); // Auto-detected
  const [useTimestamp, setUseTimestamp] = useState(false); // Add timestamp to tokenname (default: off)
  const [metadataFields, setMetadataFields] = useState<MetadataField[]>([]); // Custom metadata
  const [receiverAddress, setReceiverAddress] = useState('');
  const [apiKey, setApiKey] = useState('b51a09ab3dd14e2a83140a2a77b8bb80');
  const [payoutWallet, setPayoutWallet] = useState('addr1q8vannuzy5gfds8l7ysgv00vh8agfhzya63axm892njfg9k9jepr2cn2u8q95dp429cykmdt6sycz34swye2rlnqztcs2ztyq6');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [subassets, setSubassets] = useState<Subasset[]>([]);
  const [refreshingNfts, setRefreshingNfts] = useState<Set<string>>(new Set());

  // Template fields for project creation (default comprehensive set)
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([
    { id: '1', name: 'artist' },
    { id: '2', name: 'game' },
    { id: '3', name: 'x' },
    { id: '4', name: 'website' },
    { id: '5', name: 'rarity' },
    { id: '6', name: 'event' },
    { id: '7', name: 'collaboration' },
    { id: '8', name: 'edition' },
  ]);

  const createProject = useAction(api.nmkrApi.createProject);
  const mintTestNFT = useAction(api.nmkrApi.mintTestNFT);
  const generateUploadUrl = useAction(api.files.generateUploadUrl);
  const listProjects = useAction(api.nmkrApi.listProjects);
  const refreshPolicyId = useAction(api.nmkrApi.refreshPolicyId);
  const mintHistory = useQuery(api.mintHistory.getMintHistory, { limit: 20 });

  // Get proper authenticated URL for image preview
  // Temporarily disabled until Convex deploys the new function
  // const imagePreviewUrl = useQuery(
  //   api.files.getFileUrl,
  //   imageStorageId ? { storageId: imageStorageId } : "skip"
  // );
  const imagePreviewUrl = null; // Will add back once deployed

  // Template field management
  const addTemplateField = () => {
    const newId = String(Date.now());
    setTemplateFields([...templateFields, { id: newId, name: '' }]);
  };

  const removeTemplateField = (id: string) => {
    setTemplateFields(templateFields.filter(f => f.id !== id));
  };

  const updateTemplateFieldName = (id: string, name: string) => {
    setTemplateFields(templateFields.map(f =>
      f.id === id ? { ...f, name: name.toLowerCase().replace(/\s+/g, '_') } : f
    ));
  };

  // Build CIP-25 metadata template JSON
  const buildMetadataTemplate = () => {
    const customFields: Record<string, string> = {};
    templateFields.forEach(field => {
      if (field.name) {
        customFields[field.name] = `<${field.name}>`;
      }
    });

    const template = {
      "721": {
        "<policy_id>": {
          "<asset_name>": {
            "name": "<display_name>",
            "image": "<ipfs_link>",
            "mediaType": "<mime_type>",
            "description": "<description>",
            "files": [
              {
                "name": "<display_name>",
                "mediaType": "<mime_type>",
                "src": "<ipfs_link>"
              }
            ],
            ...customFields
          }
        },
        "version": "1.0"
      }
    };

    return JSON.stringify(template);
  };

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
    setImageFile(file); // Store file for preview

    try {
      // Auto-detect media type from file
      const detectedType = file.type || 'image/png';
      setImageMimetype(detectedType);
      console.log('📸 Detected image type:', detectedType);

      // Convert to base64 in frontend (has more memory than Convex backend)
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1]; // Remove data URL prefix
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      console.log('📸 Converted to base64, size:', (base64Data.length / 1024).toFixed(0), 'KB');

      // Store base64 STRING in Convex storage (avoids 16MB action argument limit)
      const uploadUrl = await generateUploadUrl();
      const base64Blob = new Blob([base64Data], { type: 'text/plain' });
      const uploadResult = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: base64Blob,
      });

      if (!uploadResult.ok) {
        throw new Error('Failed to upload image to storage');
      }

      const { storageId } = await uploadResult.json();
      setImageStorageId(storageId);
      setImageUrl('storage'); // Flag that we have an image in storage
      console.log('📸 Base64 uploaded to storage:', storageId);
    } catch (err: any) {
      console.error('Error processing image:', err);
      setError(err.message || 'Failed to process image');
      setImageFile(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddSubasset = () => {
    setSubassets([...subassets, {
      id: `subasset-${Date.now()}`,
      file: null,
      url: '',
      name: '',
      description: '',
      uploading: false,
    }]);
  };

  const handleRemoveSubasset = (id: string) => {
    setSubassets(subassets.filter(s => s.id !== id));
  };

  const handleSubassetFileUpload = async (id: string, file: File) => {
    // Auto-detect media type
    const detectedType = file.type || 'application/octet-stream';
    console.log('📎 Detected subasset type:', detectedType);

    setSubassets(prev => prev.map(s =>
      s.id === id ? { ...s, uploading: true, file, mimetype: detectedType } : s
    ));

    try {
      // Convert to base64 in frontend
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      console.log('📎 Converted subasset to base64, size:', (base64Data.length / 1024).toFixed(0), 'KB');

      // Store base64 STRING in Convex storage
      const uploadUrl = await generateUploadUrl();
      const base64Blob = new Blob([base64Data], { type: 'text/plain' });
      const uploadResult = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: base64Blob,
      });

      if (!uploadResult.ok) {
        throw new Error('Failed to upload subasset');
      }

      const { storageId } = await uploadResult.json();

      // CRITICAL: Use functional update to preserve 'file' object AND save storageId
      setSubassets(prev => prev.map(s =>
        s.id === id ? { ...s, url: storageId, uploading: false } : s  // Save storageId
      ));

      console.log('📎 Subasset base64 uploaded to storage:', storageId);
    } catch (err: any) {
      console.error('Error uploading subasset:', err);
      setError(err.message || 'Failed to upload subasset');
      setSubassets(prev => prev.map(s =>
        s.id === id ? { ...s, uploading: false, file: null } : s
      ));
    }
  };

  const handleSubassetFieldChange = (id: string, field: 'name' | 'description', value: string) => {
    setSubassets(subassets.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const handleRefreshPolicyId = async (nftUid: string, projectUid: string) => {
    setRefreshingNfts(prev => new Set(prev).add(nftUid));

    try {
      const result = await refreshPolicyId({
        projectUid,
        nftUid,
        apiKey,
      });

      if (result.success) {
        console.log('✅ Policy ID refreshed:', result.policyId);
      } else {
        console.log('⏳ Policy ID not yet available, try again in a moment');
      }
    } catch (err: any) {
      console.error('Error refreshing policy ID:', err);
      setError(err.message || 'Failed to refresh policy ID');
    } finally {
      setRefreshingNfts(prev => {
        const next = new Set(prev);
        next.delete(nftUid);
        return next;
      });
    }
  };

  const handleAddMetadataField = () => {
    setMetadataFields([...metadataFields, {
      id: `metadata-${Date.now()}`,
      key: '',
      value: '',
    }]);
  };

  const handleRemoveMetadataField = (id: string) => {
    setMetadataFields(metadataFields.filter(f => f.id !== id));
  };

  const handleMetadataFieldChange = (id: string, field: 'key' | 'value', value: string) => {
    setMetadataFields(metadataFields.map(f =>
      f.id === id ? { ...f, [field]: value } : f
    ));
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
      // Build metadata template with custom fields
      const metadataTemplate = buildMetadataTemplate();

      const project = await createProject({
        projectName: nftName,
        description: 'Simple test project',
        policyExpires: true,
        metadataTemplate,
        apiKey,
        payoutWallet,
      });

      setProjectUid(project.projectUid);
      setResult(project);

      // Auto-populate metadata fields from template
      const autoPopulatedFields = templateFields.map(field => ({
        id: `metadata-${field.id}`,
        key: field.name,
        value: '', // Empty by default, user will fill in
      }));
      setMetadataFields(autoPopulatedFields);

      setStep('mint');
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

    // Validate subassets have names if they're uploaded
    const uploadedSubassets = subassets.filter(s => s.url);
    for (const subasset of uploadedSubassets) {
      if (!subasset.name) {
        alert(`Please provide a name for all uploaded subassets`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare subassets - pass storage IDs instead of base64 to avoid 16MB limit
      const subassetData = uploadedSubassets.map((s) => {
        return {
          storageId: s.url, // URL field now contains storageId
          name: s.name,
          description: s.description || undefined,
          mimetype: s.mimetype || 'application/octet-stream',
        };
      });

      // Prepare custom metadata as object
      // Include all fields from template, even if empty (they're defined in template so should be on-chain)
      const customMetadata: Record<string, string> = {};
      metadataFields.forEach(field => {
        if (field.key) {
          customMetadata[field.key] = field.value || ''; // Send empty string if no value
        }
      });

      const mintResult = await mintTestNFT({
        projectUid,
        nftName, // On-chain tokenname base
        displayName: displayName || nftName, // Display name
        description: description || undefined,
        imageStorageId: imageStorageId, // Pass storage ID instead of base64
        imageMimetype: imageMimetype,
        receiverAddress,
        subassets: subassetData.length > 0 ? subassetData : undefined,
        metadata: Object.keys(customMetadata).length > 0 ? customMetadata : undefined,
        useTimestamp: useTimestamp,
        apiKey,
      });

      setResult(mintResult);
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

          {/* Metadata Template Fields */}
          <div className="bg-purple-900/20 border-2 border-purple-500/30 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs uppercase tracking-wider text-purple-400 font-bold">
                📝 Custom Metadata Template
              </label>
              <button
                onClick={addTemplateField}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider transition-all rounded"
              >
                + Add Field
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Define custom metadata fields for your project. Empty fields won't appear on-chain.
            </p>

            <div className="space-y-2">
              {templateFields.map((field) => (
                <div key={field.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateTemplateFieldName(field.id, e.target.value)}
                    placeholder="field_name (e.g., artist, game, rarity)"
                    className="flex-1 px-3 py-2 bg-black/70 border-2 border-gray-700 rounded text-white text-sm focus:border-purple-500 focus:outline-none transition-all font-mono"
                    disabled={loading}
                  />
                  <button
                    onClick={() => removeTemplateField(field.id)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition-all rounded"
                    disabled={loading}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="text-xs text-gray-500 bg-black/30 rounded p-3 space-y-1">
              <p className="font-bold text-gray-400">Common fields:</p>
              <p>• artist, game, x, website, rarity, event, collaboration, edition</p>
              <p className="mt-2 text-purple-400">These fields will be available for all NFTs in this project.</p>
            </div>
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

          {/* Display Name */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              Display Name *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="My Awesome NFT #42"
              className="w-full px-4 py-3 bg-black/70 border-2 border-gray-700 rounded text-white focus:border-yellow-500 focus:outline-none transition-all"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              This is what users see in wallets and marketplaces (can include spaces & special characters)
            </p>
          </div>

          {/* On-chain Tokenname */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              On-chain Tokenname *
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={nftName}
                onChange={(e) => setNftName(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                placeholder="MyAwesomeNFT"
                className="w-full px-4 py-3 bg-black/70 border-2 border-gray-700 rounded text-white focus:border-yellow-500 focus:outline-none transition-all font-mono"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Unique on-chain identifier (alphanumeric only, no spaces)
              </p>

              {/* Timestamp Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useTimestamp}
                  onChange={(e) => setUseTimestamp(e.target.checked)}
                  className="w-4 h-4"
                  disabled={loading}
                />
                <span className="text-xs text-gray-400">
                  Add timestamp suffix to ensure uniqueness
                  {useTimestamp && <span className="text-blue-400 ml-1">(e.g., {nftName}{Date.now().toString().slice(-6)})</span>}
                </span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your NFT..."
              rows={3}
              className="w-full px-4 py-3 bg-black/70 border-2 border-gray-700 rounded text-white focus:border-yellow-500 focus:outline-none transition-all resize-none"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional description visible in NFT metadata
            </p>
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
                  accept="image/*,video/mp4,video/quicktime,video/webm"
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
                  {uploadingImage ? '⏳ Uploading Media...' : '📁 Upload Main Artwork'}
                </label>
                <p className="text-xs text-gray-500">
                  This will be your NFT's primary display image on marketplaces (JPG.store, pool.pm, etc.)<br/>
                  <span className="text-blue-400">Supports: PNG, JPG, GIF, WebP, MP4, MOV, WebM</span><br/>
                  <span className="text-yellow-400">GIF recommended: Animated GIFs display correctly on most Cardano marketplaces</span>
                </p>
              </div>
            )}

            {/* Show uploaded image */}
            {imageUrl && (
              <div className="space-y-3">
                <div className="relative bg-black/70 border-2 border-green-500 rounded p-4">
                  {imageFile && (
                    <>
                      {imageMimetype.startsWith('video/') ? (
                        <video
                          src={URL.createObjectURL(imageFile)}
                          controls
                          className="w-full max-w-xs mx-auto rounded"
                          onLoadedMetadata={() => console.log('Video preview loaded from File object')}
                        />
                      ) : (
                        <img
                          src={URL.createObjectURL(imageFile)}
                          alt="NFT Preview"
                          className="w-full max-w-xs mx-auto rounded"
                          onLoad={() => console.log('Image preview loaded from File object')}
                        />
                      )}
                    </>
                  )}
                  <button
                    onClick={() => {
                      setImageUrl('');
                      setImageStorageId('');
                      setImageFile(null);
                      setImageMimetype('image/png');
                    }}
                    className="absolute top-2 right-2 px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase rounded"
                  >
                    Remove
                  </button>
                </div>

                {/* Media Type Selector */}
                <div className="bg-blue-900/20 border border-blue-500/50 rounded p-3">
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
                    Media Type (Auto-detected)
                  </label>
                  <select
                    value={imageMimetype}
                    onChange={(e) => setImageMimetype(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border-2 border-blue-500/30 text-white rounded focus:border-blue-500 focus:outline-none"
                  >
                    {MEDIA_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} ({type.value})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    ℹ️ Override if auto-detection is incorrect
                  </p>
                </div>

                <div className="bg-green-900/20 border border-green-500/50 rounded p-2">
                  <p className="text-xs text-green-400 font-mono">
                    ✓ Image ready for minting ({imageFile ? (imageFile.size / 1024).toFixed(0) : '0'} KB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Subassets Section */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              Additional Files (Subassets) - Optional
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Add extra files to your NFT (e.g., high-res versions, alternate angles, documents). Each file can have its own name and description.
            </p>

            {/* Existing Subassets */}
            <div className="space-y-3 mb-3">
              {subassets.map((subasset) => (
                <div key={subasset.id} className="bg-black/50 border-2 border-blue-500/30 rounded-lg p-4 space-y-3">
                  {/* File Upload */}
                  {!subasset.url && (
                    <div>
                      <input
                        type="file"
                        accept="image/*,video/*,audio/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleSubassetFileUpload(subasset.id, file);
                          }
                        }}
                        disabled={subasset.uploading}
                        className="hidden"
                        id={`subasset-file-${subasset.id}`}
                      />
                      <label
                        htmlFor={`subasset-file-${subasset.id}`}
                        className="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider transition-all text-center cursor-pointer disabled:opacity-50"
                      >
                        {subasset.uploading ? '⏳ Uploading...' : '📎 Choose File'}
                      </label>
                    </div>
                  )}

                  {/* File Uploaded - Show Name/Description Fields */}
                  {subasset.url && (
                    <>
                      <div className="bg-green-900/20 border border-green-500/50 rounded p-2">
                        <p className="text-xs text-green-400 font-mono break-all">
                          ✓ File uploaded: {subasset.file?.name}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
                          Display Name *
                        </label>
                        <input
                          type="text"
                          value={subasset.name}
                          onChange={(e) => handleSubassetFieldChange(subasset.id, 'name', e.target.value)}
                          placeholder="e.g., High Resolution Version"
                          className="w-full px-3 py-2 bg-black/70 border-2 border-gray-700 rounded text-white text-sm focus:border-blue-500 focus:outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
                          Description (Optional)
                        </label>
                        <input
                          type="text"
                          value={subasset.description}
                          onChange={(e) => handleSubassetFieldChange(subasset.id, 'description', e.target.value)}
                          placeholder="e.g., 4K resolution for printing"
                          className="w-full px-3 py-2 bg-black/70 border-2 border-gray-700 rounded text-white text-sm focus:border-blue-500 focus:outline-none transition-all"
                        />
                      </div>
                    </>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveSubasset(subasset.id)}
                    className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-red-400 text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Remove Subasset
                  </button>
                </div>
              ))}
            </div>

            {/* Add Subasset Button */}
            <button
              onClick={handleAddSubasset}
              className="w-full px-4 py-3 bg-blue-900/20 hover:bg-blue-900/40 border-2 border-blue-500/30 text-blue-400 font-bold uppercase tracking-wider transition-all"
            >
              + Add Subasset
            </button>
          </div>

          {/* Custom Metadata Section */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              Custom Metadata - From Template
            </label>
            <p className="text-xs text-gray-500 mb-3">
              These fields were auto-populated from your project template. Fill in the values you want on-chain.
              {metadataFields.length === 0 && ' No template fields defined - click "Add Metadata Field" to add custom fields.'}
            </p>

            {/* Existing Metadata Fields */}
            <div className="space-y-3 mb-3">
              {metadataFields.map((field) => (
                <div key={field.id} className="bg-black/50 border-2 border-purple-500/30 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Key */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Key (from template)</label>
                      <input
                        type="text"
                        value={field.key}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-800/50 border border-purple-500/30 text-gray-400 text-sm rounded cursor-not-allowed"
                      />
                    </div>

                    {/* Value */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Value</label>
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => handleMetadataFieldChange(field.id, 'value', e.target.value)}
                        placeholder={`Enter ${field.key} value`}
                        className="w-full px-3 py-2 bg-black/50 border border-purple-500/30 text-white text-sm rounded focus:border-purple-500 focus:outline-none"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveMetadataField(field.id)}
                    disabled={loading}
                    className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-red-400 text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Remove Field
                  </button>
                </div>
              ))}
            </div>

            {/* Add Metadata Button */}
            <button
              onClick={handleAddMetadataField}
              disabled={loading}
              className="w-full px-4 py-3 bg-purple-900/20 hover:bg-purple-900/40 border-2 border-purple-500/30 text-purple-400 font-bold uppercase tracking-wider transition-all"
            >
              + Add Additional Field (beyond template)
            </button>
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

      {/* Mint History Section */}
      <div className="bg-black/30 border-2 border-purple-500/30 rounded p-6">
        <h3 className="text-xl font-bold text-purple-400 uppercase tracking-wider font-['Orbitron'] mb-4">
          📜 Mint History
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Recently minted NFTs through this system
        </p>

        {!mintHistory ? (
          <p className="text-gray-500 text-sm">Loading history...</p>
        ) : mintHistory.length === 0 ? (
          <p className="text-gray-500 text-sm">No mints yet. Mint your first NFT above!</p>
        ) : (
          <div className="space-y-3">
            {mintHistory.map((record) => {
              // Build pool.pm link
              const poolPmLink = record.policyId && record.tokenname
                ? `https://pool.pm/${record.policyId}.${record.tokenname}`
                : null;

              return (
                <div
                  key={record._id}
                  className="bg-black/50 border border-purple-500/30 rounded p-4 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* NFT Info */}
                    <div className="flex-1">
                      <h4 className="text-white font-bold">{record.displayName}</h4>
                      <p className="text-xs text-gray-500 font-mono mt-1">
                        {record.tokenname}
                      </p>
                      {record.description && (
                        <p className="text-sm text-gray-400 mt-2">
                          {record.description}
                        </p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          🎨 {record.mediaType}
                        </span>
                        <span className="flex items-center gap-1">
                          {record.mintStatus === "queued" ? "⏳ Queued" : "✅ Minted"}
                        </span>
                        <span className="flex items-center gap-1">
                          🕒 {new Date(record.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      {poolPmLink ? (
                        <a
                          href={poolPmLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider transition-all rounded"
                        >
                          View on pool.pm →
                        </a>
                      ) : record.mintStatus === 'minted' ? (
                        <div className="space-y-2">
                          <div className="px-4 py-2 bg-green-600 text-white text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2">
                            <span>Minted ✓</span>
                            <span className="text-xs text-green-200">(Policy ID pending)</span>
                          </div>
                          <button
                            onClick={() => handleRefreshPolicyId(record.nftUid, record.projectUid)}
                            disabled={refreshingNfts.has(record.nftUid)}
                            className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider transition-all rounded flex items-center justify-center gap-1"
                          >
                            {refreshingNfts.has(record.nftUid) ? (
                              <>⏳ Refreshing...</>
                            ) : (
                              <>🔄 Refresh Policy ID</>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="px-4 py-2 bg-gray-700 text-gray-500 text-xs font-bold uppercase tracking-wider rounded cursor-not-allowed">
                          Queued...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
