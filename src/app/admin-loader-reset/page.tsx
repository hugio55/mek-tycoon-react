'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';

export default function AdminLoaderReset() {
  const clearSettings = useMutation(api.loaderSettings.clearLoaderSettings);
  const [status, setStatus] = useState<string>('');

  const handleClear = async () => {
    try {
      setStatus('Clearing...');
      const result = await clearSettings();
      if (result.deleted) {
        setStatus('✅ Settings cleared! Loader will now use code defaults (fontSize: 15, spacing: 8, fontFamily: Saira, triangleSize: 0.75)');
      } else {
        setStatus('ℹ️ No settings found in database (already using defaults)');
      }
    } catch (error) {
      setStatus(`❌ Error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Loader Settings Reset</h1>

        <div className="bg-gray-900 border border-yellow-500/30 rounded-lg p-6 mb-4">
          <p className="mb-4">
            This will delete the database loader settings record, allowing the code defaults to take effect:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
            <li>fontSize: 15 (was 48)</li>
            <li>spacing: 8 (was 16)</li>
            <li>fontFamily: Saira (was Orbitron)</li>
            <li>triangleSize: 0.75 (was 1.0)</li>
            <li>horizontalOffset: 0</li>
            <li>chromaticOffset: 0</li>
          </ul>
        </div>

        <button
          onClick={handleClear}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Clear Database Settings
        </button>

        {status && (
          <div className="mt-4 p-4 bg-gray-800 border border-yellow-500/30 rounded">
            <pre className="whitespace-pre-wrap">{status}</pre>
          </div>
        )}

        <div className="mt-8 text-sm text-gray-400">
          <p>After clearing, refresh any page with the loader to see the new defaults.</p>
        </div>
      </div>
    </div>
  );
}
