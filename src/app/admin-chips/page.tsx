'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useEffect, useState } from 'react';

type TabType = 'mek-chips' | 'universal-chips';

export default function AdminChips() {
  const [activeTab, setActiveTab] = useState<TabType>('mek-chips');
  
  // Database queries
  const chipDefinitions = useQuery(api.chips.getAllChipDefinitions);
  const buffCategories = useQuery(api.buffCategories.getAll);
  const initializeChips = useMutation(api.chips.initializeChips);

  // Auto-initialize chips if database is empty
  useEffect(() => {
    if (chipDefinitions && chipDefinitions.length === 0) {
      initializeChips();
    }
  }, [chipDefinitions, initializeChips]);

  // Filter universal chips from buff categories
  const universalChips = buffCategories?.filter(buff => buff.applicationType === 'universal') || [];
  const attachableChips = buffCategories?.filter(buff => buff.applicationType === 'attachable') || [];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-yellow-500 uppercase tracking-wider">Asset Database Portal</h1>
        
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b-2 border-yellow-500/30">
          <button
            onClick={() => setActiveTab('mek-chips')}
            className={`px-6 py-3 font-bold uppercase tracking-wider transition-all ${
              activeTab === 'mek-chips'
                ? 'bg-yellow-500/20 text-yellow-500 border-b-2 border-yellow-500 -mb-0.5'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Mek Chip Definitions
          </button>
          <button
            onClick={() => setActiveTab('universal-chips')}
            className={`px-6 py-3 font-bold uppercase tracking-wider transition-all ${
              activeTab === 'universal-chips'
                ? 'bg-yellow-500/20 text-yellow-500 border-b-2 border-yellow-500 -mb-0.5'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Universal Chips
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'mek-chips' && (
          <>
            <div className="mb-8 p-6 bg-gray-900 rounded-lg border border-yellow-500/30">
              <h2 className="text-2xl mb-4">Mek Chip Database</h2>
              <p className="text-gray-400">Total Chips: {chipDefinitions?.length || 0} / 307</p>
              <p className="text-xs text-gray-500 mt-2">Direct view of chipDefinitions table</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {chipDefinitions?.map((chip) => (
                <div
                  key={chip._id}
                  className="bg-gray-900 rounded-lg border border-gray-700 p-3 hover:border-yellow-500/50 transition-colors flex flex-col items-center"
                >
                  {chip.imageUrl && (
                    <img
                      src={chip.imageUrl}
                      alt={chip.name}
                      className="w-20 h-20 object-contain mb-2"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <h3 className="text-xs font-bold text-yellow-400 text-center">{chip.name}</h3>
                  <div className="mt-2 text-xs text-gray-500">
                    Ranks: D-XXX
                  </div>
                </div>
              ))}
            </div>

            {!chipDefinitions?.length && (
              <div className="text-center py-12 text-gray-500">
                Loading chip definitions...
              </div>
            )}
          </>
        )}

        {activeTab === 'universal-chips' && (
          <>
            <div className="mb-8 p-6 bg-gray-900 rounded-lg border border-yellow-500/30">
              <h2 className="text-2xl mb-4">Universal Chips Database</h2>
              <p className="text-gray-400">Total Universal Chips: {universalChips.length}</p>
              <p className="text-gray-400">Total Attachable Chips: {attachableChips.length}</p>
              <p className="text-xs text-gray-500 mt-2">Direct view of buffCategories table (applicationType: universal)</p>
            </div>

            <div className="space-y-6">
              {/* Universal Chips Section */}
              <div>
                <h3 className="text-xl text-yellow-500 mb-4 uppercase tracking-wider">Universal Chips</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {universalChips.map((chip) => (
                    <div
                      key={chip._id}
                      className="bg-gray-900 rounded-lg border border-yellow-500/30 p-4 hover:border-yellow-500/60 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-yellow-400 font-bold">{chip.name}</h4>
                        {chip.isActive !== false && (
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">Active</span>
                        )}
                      </div>
                      
                      {chip.description && (
                        <p className="text-sm text-gray-400 mb-3">{chip.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Category:</span>
                          <span className="ml-2 text-yellow-500">{chip.category || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Unit Type:</span>
                          <span className="ml-2 text-blue-400">{chip.unitType || 'N/A'}</span>
                        </div>
                        {chip.tierStart && chip.tierEnd && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Tiers:</span>
                            <span className="ml-2 text-green-400">{chip.tierStart} - {chip.tierEnd}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-600">
                        ID: {chip._id}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attachable Chips Section */}
              <div>
                <h3 className="text-xl text-blue-500 mb-4 uppercase tracking-wider">Attachable Chips</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {attachableChips.map((chip) => (
                    <div
                      key={chip._id}
                      className="bg-gray-900 rounded-lg border border-blue-500/30 p-4 hover:border-blue-500/60 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-blue-400 font-bold">{chip.name}</h4>
                        {chip.isActive !== false && (
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">Active</span>
                        )}
                      </div>
                      
                      {chip.description && (
                        <p className="text-sm text-gray-400 mb-3">{chip.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Category:</span>
                          <span className="ml-2 text-blue-500">{chip.category || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Unit Type:</span>
                          <span className="ml-2 text-green-400">{chip.unitType || 'N/A'}</span>
                        </div>
                        {chip.tierStart && chip.tierEnd && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Tiers:</span>
                            <span className="ml-2 text-green-400">{chip.tierStart} - {chip.tierEnd}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-600">
                        ID: {chip._id}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {!buffCategories && (
              <div className="text-center py-12 text-gray-500">
                Loading universal chips...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}