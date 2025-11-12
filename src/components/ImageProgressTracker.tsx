"use client";

import { useState, useMemo, useEffect } from 'react';
import { VARIATIONS_BY_TYPE } from '@/lib/completeVariationRarity';

interface VariationStatus {
  id: number;
  name: string;
  sourceKey: string;
  exists: boolean;
}

interface SectionData {
  path: string;
  variations: VariationStatus[];
}

export default function ImageProgressTracker() {
  const [headsFolderPath, setHeadsFolderPath] = useState('');
  const [bodiesFolderPath, setBodiesFolderPath] = useState('');
  const [traitsFolderPath, setTraitsFolderPath] = useState('');

  const [headsData, setHeadsData] = useState<SectionData>({ path: '', variations: [] });
  const [bodiesData, setBodiesData] = useState<SectionData>({ path: '', variations: [] });
  const [traitsData, setTraitsData] = useState<SectionData>({ path: '', variations: [] });

  const [activeSection, setActiveSection] = useState<'heads' | 'bodies' | 'traits'>('heads');
  const [sortByStatus, setSortByStatus] = useState<'all' | 'exists' | 'missing'>('all');

  // Load saved data from localStorage
  useEffect(() => {
    const savedHeads = localStorage.getItem('imageProgressTracker_headsPath');
    const savedBodies = localStorage.getItem('imageProgressTracker_bodiesPath');
    const savedTraits = localStorage.getItem('imageProgressTracker_traitsPath');

    const savedHeadsData = localStorage.getItem('imageProgressTracker_headsData');
    const savedBodiesData = localStorage.getItem('imageProgressTracker_bodiesData');
    const savedTraitsData = localStorage.getItem('imageProgressTracker_traitsData');

    if (savedHeads) setHeadsFolderPath(savedHeads);
    if (savedBodies) setBodiesFolderPath(savedBodies);
    if (savedTraits) setTraitsFolderPath(savedTraits);

    if (savedHeadsData) setHeadsData(JSON.parse(savedHeadsData));
    if (savedBodiesData) setBodiesData(JSON.parse(savedBodiesData));
    if (savedTraitsData) setTraitsData(JSON.parse(savedTraitsData));
  }, []);

  // Scan folder and update file existence
  const scanFolder = async (folderPath: string, type: 'heads' | 'bodies' | 'traits') => {
    const variationsList = VARIATIONS_BY_TYPE[type];
    const sourceKeys = variationsList.map(v => v.sourceKey);

    try {
      const response = await fetch('/api/scan-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath, sourceKeys })
      });

      if (!response.ok) {
        throw new Error('Failed to scan folder');
      }

      const { results } = await response.json();

      const variations = variationsList.map(v => ({
        id: v.id,
        name: v.name,
        sourceKey: v.sourceKey,
        exists: results[v.sourceKey] || false
      }));

      return { path: folderPath, variations };
    } catch (error) {
      console.error('Error scanning folder:', error);
      alert('Failed to scan folder. Make sure the path is correct and accessible.');
      return null;
    }
  };

  // Handle saving folder path for heads
  const handleSaveHeadsPath = async () => {
    localStorage.setItem('imageProgressTracker_headsPath', headsFolderPath);
    const scannedData = await scanFolder(headsFolderPath, 'heads');

    if (scannedData) {
      setHeadsData(scannedData);
      localStorage.setItem('imageProgressTracker_headsData', JSON.stringify(scannedData));
    }
  };

  // Handle saving folder path for bodies
  const handleSaveBodiesPath = async () => {
    localStorage.setItem('imageProgressTracker_bodiesPath', bodiesFolderPath);
    const scannedData = await scanFolder(bodiesFolderPath, 'bodies');

    if (scannedData) {
      setBodiesData(scannedData);
      localStorage.setItem('imageProgressTracker_bodiesData', JSON.stringify(scannedData));
    }
  };

  // Handle saving folder path for traits
  const handleSaveTraitsPath = async () => {
    localStorage.setItem('imageProgressTracker_traitsPath', traitsFolderPath);
    const scannedData = await scanFolder(traitsFolderPath, 'traits');

    if (scannedData) {
      setTraitsData(scannedData);
      localStorage.setItem('imageProgressTracker_traitsData', JSON.stringify(scannedData));
    }
  };

  // Toggle variation status
  const toggleVariationStatus = (variationId: number) => {
    if (activeSection === 'heads') {
      const updated = {
        ...headsData,
        variations: headsData.variations.map(v =>
          v.id === variationId ? { ...v, exists: !v.exists } : v
        )
      };
      setHeadsData(updated);
      localStorage.setItem('imageProgressTracker_headsData', JSON.stringify(updated));
    } else if (activeSection === 'bodies') {
      const updated = {
        ...bodiesData,
        variations: bodiesData.variations.map(v =>
          v.id === variationId ? { ...v, exists: !v.exists } : v
        )
      };
      setBodiesData(updated);
      localStorage.setItem('imageProgressTracker_bodiesData', JSON.stringify(updated));
    } else if (activeSection === 'traits') {
      const updated = {
        ...traitsData,
        variations: traitsData.variations.map(v =>
          v.id === variationId ? { ...v, exists: !v.exists } : v
        )
      };
      setTraitsData(updated);
      localStorage.setItem('imageProgressTracker_traitsData', JSON.stringify(updated));
    }
  };

  // Get current section data
  const currentData = useMemo(() => {
    switch (activeSection) {
      case 'heads': return headsData;
      case 'bodies': return bodiesData;
      case 'traits': return traitsData;
    }
  }, [activeSection, headsData, bodiesData, traitsData]);

  // Filter variations by status
  const filteredVariations = useMemo(() => {
    if (sortByStatus === 'all') return currentData.variations;
    if (sortByStatus === 'exists') return currentData.variations.filter(v => v.exists);
    if (sortByStatus === 'missing') return currentData.variations.filter(v => !v.exists);
    return currentData.variations;
  }, [currentData.variations, sortByStatus]);

  // Calculate progress stats
  const stats = useMemo(() => {
    const total = currentData.variations.length;
    const completed = currentData.variations.filter(v => v.exists).length;
    const missing = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, missing, percentage };
  }, [currentData.variations]);

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        <button
          onClick={() => setActiveSection('heads')}
          className={`px-4 py-2 rounded-t font-medium transition-all ${
            activeSection === 'heads'
              ? 'bg-cyan-500/20 text-cyan-400 border-t-2 border-cyan-500'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Heads ({VARIATIONS_BY_TYPE.heads.length})
        </button>
        <button
          onClick={() => setActiveSection('bodies')}
          className={`px-4 py-2 rounded-t font-medium transition-all ${
            activeSection === 'bodies'
              ? 'bg-purple-500/20 text-purple-400 border-t-2 border-purple-500'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Bodies ({VARIATIONS_BY_TYPE.bodies.length})
        </button>
        <button
          onClick={() => setActiveSection('traits')}
          className={`px-4 py-2 rounded-t font-medium transition-all ${
            activeSection === 'traits'
              ? 'bg-yellow-500/20 text-yellow-400 border-t-2 border-yellow-500'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Traits ({VARIATIONS_BY_TYPE.traits.length})
        </button>
      </div>

      {/* Folder Path Configuration */}
      <div className="bg-black/30 border border-gray-700 rounded p-4 space-y-3">
        <label className="text-sm text-gray-400 uppercase tracking-wider">
          Folder Path for {activeSection}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={
              activeSection === 'heads' ? headsFolderPath :
              activeSection === 'bodies' ? bodiesFolderPath :
              traitsFolderPath
            }
            onChange={(e) => {
              if (activeSection === 'heads') setHeadsFolderPath(e.target.value);
              else if (activeSection === 'bodies') setBodiesFolderPath(e.target.value);
              else setTraitsFolderPath(e.target.value);
            }}
            placeholder="C:\path\to\images\folder"
            className="flex-1 px-4 py-2 bg-black/50 border border-gray-600 rounded text-gray-200 placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
          />
          <button
            onClick={() => {
              if (activeSection === 'heads') handleSaveHeadsPath();
              else if (activeSection === 'bodies') handleSaveBodiesPath();
              else handleSaveTraitsPath();
            }}
            className="px-6 py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 transition-colors"
          >
            Save Path
          </button>
          <button
            onClick={() => {
              // Clear cached data for current section
              if (activeSection === 'heads') {
                localStorage.removeItem('imageProgressTracker_headsData');
                setHeadsData({ path: '', variations: [] });
              } else if (activeSection === 'bodies') {
                localStorage.removeItem('imageProgressTracker_bodiesData');
                setBodiesData({ path: '', variations: [] });
              } else {
                localStorage.removeItem('imageProgressTracker_traitsData');
                setTraitsData({ path: '', variations: [] });
              }
              alert(`Cleared cached data for ${activeSection}. Click "Save Path" to rescan with updated source keys.`);
            }}
            className="px-6 py-2 bg-red-500 text-white font-bold rounded hover:bg-red-400 transition-colors"
          >
            Clear Cache
          </button>
        </div>
        {currentData.path && (
          <div className="text-xs text-green-400">
            Saved: {currentData.path}
          </div>
        )}
      </div>

      {/* Progress Stats */}
      {currentData.variations.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-black/30 border border-gray-700 rounded p-4">
            <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Total</div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="bg-black/30 border border-green-500/30 rounded p-4">
            <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Completed</div>
            <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
          </div>
          <div className="bg-black/30 border border-red-500/30 rounded p-4">
            <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Missing</div>
            <div className="text-2xl font-bold text-red-400">{stats.missing}</div>
          </div>
          <div className="bg-black/30 border border-yellow-500/30 rounded p-4">
            <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Progress</div>
            <div className="text-2xl font-bold text-yellow-400">{stats.percentage}%</div>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setSortByStatus('all')}
          className={`px-4 py-2 rounded font-medium transition-all ${
            sortByStatus === 'all'
              ? 'bg-yellow-500 text-black'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setSortByStatus('exists')}
          className={`px-4 py-2 rounded font-medium transition-all ${
            sortByStatus === 'exists'
              ? 'bg-green-500 text-black'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Exists Only
        </button>
        <button
          onClick={() => setSortByStatus('missing')}
          className={`px-4 py-2 rounded font-medium transition-all ${
            sortByStatus === 'missing'
              ? 'bg-red-500 text-black'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Missing Only
        </button>
      </div>

      {/* Variations Table */}
      {currentData.variations.length > 0 && (
        <div className="border border-gray-700 rounded overflow-hidden">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-bold text-yellow-400 uppercase tracking-wider border-r border-gray-700">
                    Variation Name
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-bold text-yellow-400 uppercase tracking-wider border-r border-gray-700">
                    Source Key
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-bold text-yellow-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-black/20">
                {filteredVariations.map((variation, index) => (
                  <tr
                    key={`${variation.id}-${index}`}
                    className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-200 font-medium border-r border-gray-800">
                      {variation.name}
                    </td>
                    <td className="px-4 py-3 text-center border-r border-gray-800">
                      <span className="text-cyan-300 font-mono font-semibold">
                        {variation.sourceKey}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleVariationStatus(variation.id)}
                        className="text-2xl hover:scale-125 transition-transform cursor-pointer"
                      >
                        {variation.exists ? (
                          <span className="text-green-400">✓</span>
                        ) : (
                          <span className="text-red-400">✗</span>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {currentData.variations.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Enter a folder path above and click "Save Path" to load variation images for tracking.
        </div>
      )}
    </div>
  );
}
