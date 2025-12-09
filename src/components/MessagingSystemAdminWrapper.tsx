'use client';

import { useState, useMemo } from 'react';
import { ConvexReactClient, ConvexProvider } from 'convex/react';
import MessagingSystemAdminContent from './MessagingSystemAdminContent';

type DatabaseOption = 'trout' | 'sturgeon';

const DATABASE_OPTIONS = {
  trout: {
    label: 'Development (Trout)',
    url: process.env.NEXT_PUBLIC_CONVEX_URL!,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/50',
  },
  sturgeon: {
    label: 'Production (Sturgeon)',
    url: process.env.NEXT_PUBLIC_STURGEON_URL!,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/50',
  },
};

export default function MessagingSystemAdminWrapper() {
  const [selectedDb, setSelectedDb] = useState<DatabaseOption>('trout');

  // Create a ConvexReactClient for the selected database
  // useMemo ensures we only create a new client when the database changes
  const client = useMemo(() => {
    const url = DATABASE_OPTIONS[selectedDb].url;
    if (!url) {
      console.error(`Database URL not found for ${selectedDb}`);
      return null;
    }
    return new ConvexReactClient(url);
  }, [selectedDb]);

  const currentDb = DATABASE_OPTIONS[selectedDb];

  if (!client) {
    return (
      <div className="p-8 text-center text-red-400">
        Database URL not configured for {selectedDb}
      </div>
    );
  }

  return (
    <div>
      {/* Database Selector */}
      <div className="mb-6 p-4 bg-black/40 rounded-xl border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 uppercase tracking-wider">Database:</span>
            <div className="flex gap-2">
              {(Object.keys(DATABASE_OPTIONS) as DatabaseOption[]).map((db) => {
                const option = DATABASE_OPTIONS[db];
                const isSelected = selectedDb === db;
                return (
                  <button
                    key={db}
                    onClick={() => setSelectedDb(db)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      isSelected
                        ? `${option.bgColor} ${option.color} border ${option.borderColor}`
                        : 'bg-black/30 text-gray-400 border border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current database indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${currentDb.bgColor} border ${currentDb.borderColor}`}>
            <div className={`w-2 h-2 rounded-full ${selectedDb === 'sturgeon' ? 'bg-yellow-400' : 'bg-cyan-400'} animate-pulse`} />
            <span className={`text-sm font-medium ${currentDb.color}`}>
              {selectedDb === 'sturgeon' ? 'LIVE DATA' : 'DEV DATA'}
            </span>
          </div>
        </div>

        {selectedDb === 'sturgeon' && (
          <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-400 text-sm">
              <span>⚠️</span>
              <span>You are viewing production data. Changes will affect real users.</span>
            </div>
          </div>
        )}
      </div>

      {/* Messaging System Content with the selected database */}
      <ConvexProvider client={client}>
        <MessagingSystemAdminContent key={selectedDb} />
      </ConvexProvider>
    </div>
  );
}
