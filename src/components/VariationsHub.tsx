"use client";

import { useState } from 'react';
import VariationSearchTable from './VariationSearchTable';
import ImageProgressTracker from './ImageProgressTracker';

export default function VariationsHub() {
  const [activeTab, setActiveTab] = useState<'search' | 'progress'>('search');

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b-2 border-gray-700">
        <button
          onClick={() => setActiveTab('search')}
          className={`px-6 py-3 font-bold transition-all ${
            activeTab === 'search'
              ? 'bg-cyan-500/20 text-cyan-400 border-b-4 border-cyan-500 -mb-0.5'
              : 'text-gray-400 hover:bg-gray-800/30'
          }`}
        >
          🔍 Search & Browse
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`px-6 py-3 font-bold transition-all ${
            activeTab === 'progress'
              ? 'bg-yellow-500/20 text-yellow-400 border-b-4 border-yellow-500 -mb-0.5'
              : 'text-gray-400 hover:bg-gray-800/30'
          }`}
        >
          📊 Image Progress Tracker
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'search' && <VariationSearchTable />}
        {activeTab === 'progress' && <ImageProgressTracker />}
      </div>
    </div>
  );
}
