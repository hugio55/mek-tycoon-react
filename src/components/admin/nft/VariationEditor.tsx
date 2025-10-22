'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id } from '@/../convex/_generated/dataModel';

type Difficulty = 'easy' | 'medium' | 'hard';

interface VariationFormData {
  nftName: string;
  supplyTotal: number;
  priceAda: number;
  mainArtUrl?: string;
  thumbnailUrl?: string;
}

interface VariationEditorProps {
  eventId: Id<'nftEvents'>;
  eventName: string;
  onSave?: () => void;
  onCancel?: () => void;
}

export default function VariationEditor({ eventId, eventName, onSave, onCancel }: VariationEditorProps) {
  const existingVariations = useQuery(api.nftVariations.getVariationsByEvent, { eventId });
  const updateVariations = useMutation(api.nftVariations.updateEventVariations);

  const [formData, setFormData] = useState<Record<Difficulty, VariationFormData>>({
    easy: {
      nftName: `${eventName}`,
      supplyTotal: 100,
      priceAda: 10,
    },
    medium: {
      nftName: `${eventName} Intensifies`,
      supplyTotal: 50,
      priceAda: 25,
    },
    hard: {
      nftName: `${eventName} Blisteringly Amazing`,
      supplyTotal: 10,
      priceAda: 100,
    },
  });

  const [saving, setSaving] = useState(false);

  // Load existing variations into form
  useEffect(() => {
    if (existingVariations) {
      const newFormData = { ...formData };
      existingVariations.forEach((v) => {
        newFormData[v.difficulty] = {
          nftName: v.nftName,
          supplyTotal: v.supplyTotal,
          priceAda: v.priceAda || 0,
          mainArtUrl: v.mainArtUrl,
          thumbnailUrl: v.thumbnailUrl,
        };
      });
      setFormData(newFormData);
    }
  }, [existingVariations]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateVariations({
        eventId,
        variations: [
          { difficulty: 'easy', ...formData.easy },
          { difficulty: 'medium', ...formData.medium },
          { difficulty: 'hard', ...formData.hard },
        ],
      });
      onSave?.();
    } catch (error) {
      console.error('Error saving variations:', error);
      alert('Error saving variations. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (difficulty: Difficulty, field: keyof VariationFormData, value: any) => {
    setFormData({
      ...formData,
      [difficulty]: {
        ...formData[difficulty],
        [field]: value,
      },
    });
  };

  const getExistingVariation = (difficulty: Difficulty) => {
    return existingVariations?.find(v => v.difficulty === difficulty);
  };

  const difficultyConfig = {
    easy: { label: 'Easy', color: 'green', icon: '⭐' },
    medium: { label: 'Medium', color: 'yellow', icon: '⭐⭐' },
    hard: { label: 'Hard', color: 'red', icon: '⭐⭐⭐' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-black/50 border-2 border-yellow-500/30 rounded-lg p-6">
        <div>
          <h2 className="text-2xl font-bold text-yellow-400 uppercase tracking-wider font-['Orbitron']">
            Variation Editor
          </h2>
          <p className="text-gray-400 mt-2">
            Configure the 3 difficulty variations for: <span className="text-white font-bold">{eventName}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold uppercase tracking-wider transition-all"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wider transition-all shadow-lg shadow-yellow-500/30"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save All Variations'}
          </button>
        </div>
      </div>

      {/* Three-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(['easy', 'medium', 'hard'] as Difficulty[]).map((difficulty) => {
          const config = difficultyConfig[difficulty];
          const existing = getExistingVariation(difficulty);
          const data = formData[difficulty];

          return (
            <div
              key={difficulty}
              className={`bg-gradient-to-br from-black/80 to-gray-900/80 border-2 border-${config.color}-500/30 rounded-lg p-6 space-y-4`}
            >
              {/* Difficulty Header */}
              <div className={`bg-${config.color}-500/20 border-2 border-${config.color}-500 rounded-lg p-4 text-center`}>
                <div className="text-2xl mb-2">{config.icon}</div>
                <h3 className={`text-xl font-bold text-${config.color}-400 uppercase tracking-wider font-['Orbitron']`}>
                  {config.label}
                </h3>
              </div>

              {/* NFT Name */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
                  NFT Name *
                </label>
                <input
                  type="text"
                  value={data.nftName}
                  onChange={(e) => updateField(difficulty, 'nftName', e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border-2 border-gray-700 rounded text-white focus:border-yellow-500 focus:outline-none transition-all"
                  placeholder={`e.g., ${eventName}${difficulty === 'medium' ? ' Intensifies' : difficulty === 'hard' ? ' Blisteringly Amazing' : ''}`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {difficulty === 'easy' && 'Base name'}
                  {difficulty === 'medium' && 'Recommended: Add "Intensifies"'}
                  {difficulty === 'hard' && 'Recommended: Add "Blisteringly Amazing"'}
                </p>
              </div>

              {/* Supply Total */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
                  Total Supply *
                </label>
                <input
                  type="number"
                  min="1"
                  value={data.supplyTotal}
                  onChange={(e) => updateField(difficulty, 'supplyTotal', parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-black/50 border-2 border-gray-700 rounded text-white focus:border-yellow-500 focus:outline-none transition-all"
                />
                {existing && (
                  <div className="flex justify-between text-xs mt-2">
                    <span className="text-yellow-400">
                      Minted: {existing.supplyMinted}
                    </span>
                    <span className="text-blue-400">
                      Remaining: {existing.supplyRemaining}
                    </span>
                  </div>
                )}
              </div>

              {/* Price in ADA */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
                  Price (ADA) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={data.priceAda}
                    onChange={(e) => updateField(difficulty, 'priceAda', parseFloat(e.target.value))}
                    className="w-full px-4 py-3 pr-12 bg-black/50 border-2 border-gray-700 rounded text-white focus:border-yellow-500 focus:outline-none transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    ₳
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {(data.priceAda * 1_000_000).toLocaleString()} lovelace
                </p>
              </div>

              {/* Art Upload Placeholder */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
                  NFT Art
                </label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center bg-black/30">
                  {data.mainArtUrl ? (
                    <div className="space-y-2">
                      <img
                        src={data.mainArtUrl}
                        alt={data.nftName}
                        className="w-full h-32 object-cover rounded"
                      />
                      <button
                        onClick={() => updateField(difficulty, 'mainArtUrl', undefined)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-500 text-sm mb-2">No art uploaded</p>
                      <button
                        className="text-xs text-yellow-400 hover:text-yellow-300 uppercase tracking-wider"
                        onClick={() => {
                          // TODO: Integrate with ArtUploadManager
                          alert('Art upload manager coming in next step');
                        }}
                      >
                        Upload Art
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Card */}
              {existing && (
                <div className="bg-black/50 border border-gray-700 rounded-lg p-4 space-y-2">
                  <div className="text-xs uppercase tracking-wider text-gray-400">
                    Current Status
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-500">Minted</div>
                      <div className={`text-lg font-bold text-${config.color}-400`}>
                        {existing.supplyMinted}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Remaining</div>
                      <div className={`text-lg font-bold text-${config.color}-400`}>
                        {existing.supplyRemaining}
                      </div>
                    </div>
                  </div>
                  {existing.supplyTotal > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-1">Progress</div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className={`bg-${config.color}-500 h-2 rounded-full transition-all`}
                          style={{
                            width: `${(existing.supplyMinted / existing.supplyTotal) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Naming Convention Guide */}
      <div className="bg-blue-900/20 border-2 border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <h4 className="text-blue-400 font-bold uppercase tracking-wider mb-2">
              Naming Convention Guide
            </h4>
            <div className="text-sm text-gray-300 space-y-1">
              <p><strong className="text-white">Easy:</strong> Base name (e.g., "Dragon Quest")</p>
              <p><strong className="text-white">Medium:</strong> Base name + "Intensifies" (e.g., "Dragon Quest Intensifies")</p>
              <p><strong className="text-white">Hard:</strong> Base name + "Blisteringly Amazing" (e.g., "Dragon Quest Blisteringly Amazing")</p>
            </div>
          </div>
        </div>
      </div>

      {/* Supply Guide */}
      <div className="bg-yellow-900/20 border-2 border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📊</div>
          <div>
            <h4 className="text-yellow-400 font-bold uppercase tracking-wider mb-2">
              Recommended Supply Distribution
            </h4>
            <div className="text-sm text-gray-300 space-y-1">
              <p><strong className="text-green-400">Easy:</strong> 100+ (Most common, lowest price)</p>
              <p><strong className="text-yellow-400">Medium:</strong> 30-50 (Moderate rarity, medium price)</p>
              <p><strong className="text-red-400">Hard:</strong> 5-10 (Very rare, highest price)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
