'use client';

import { useState } from 'react';
import { useAction, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function SourceKeyMigrationAdmin() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const runMigration = useAction(api.migrateSourceKeys.runSourceKeyMigration);
  const unlockSlot1 = useAction(api.migrateUnlockSlot1.unlockSlot1ForAllUsers);
  const diagnosticData = useQuery(api.diagnosticSourceKeys.checkSourceKeyData, {});

  const handleRunMigration = async () => {
    if (!confirm('Run sourceKey migration? This will populate missing sourceKey fields for all Meks in the database.')) {
      return;
    }

    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      console.log('[Admin] Starting sourceKey migration...');
      const migrationResult = await runMigration({});
      console.log('[Admin] Migration complete:', migrationResult);
      setResult(migrationResult);
    } catch (err: any) {
      console.error('[Admin] Migration failed:', err);
      setError(err.message || 'Migration failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleUnlockSlot1 = async () => {
    if (!confirm('Unlock slot 1 for all users? This ensures everyone has slot 1 available.')) {
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      console.log('[Admin] Unlocking slot 1 for all users...');
      const unlockResult = await unlockSlot1({});
      console.log('[Admin] Unlock complete:', unlockResult);
      alert(`✅ Unlocked slot 1 for ${unlockResult.unlocked} users (${unlockResult.alreadyUnlocked} already unlocked)`);
    } catch (err: any) {
      console.error('[Admin] Unlock failed:', err);
      setError(err.message || 'Unlock failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="mek-card-industrial mek-border-sharp-gold p-6">
      <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
        <span>🔧</span>
        <span>SourceKey Migration</span>
      </h2>

      <div className="space-y-4">
        <div className="text-gray-300 text-sm space-y-2">
          <p>
            <strong>Purpose:</strong> Populate missing <code>sourceKey</code> and <code>sourceKeyBase</code> fields
            in goldMining records.
          </p>
          <p>
            <strong>Why needed:</strong> Old Mek records don't have sourceKeys, which breaks image loading
            in the Mek selector.
          </p>
          <p>
            <strong>What it does:</strong> Uses existing variation names (head/body/trait) to look up
            the sourceKey from master data and update all records.
          </p>
          <p className="text-yellow-400">
            ⚠️ Safe to run multiple times - will only update records missing sourceKeys.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleRunMigration}
            disabled={isRunning}
            className="mek-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running Migration...' : 'Run SourceKey Migration'}
          </button>

          <button
            onClick={handleUnlockSlot1}
            disabled={isRunning}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? 'Unlocking...' : 'Unlock Slot 1 for All Users'}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded p-4 text-red-200">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="bg-green-900/50 border border-green-500 rounded p-4 text-green-200 space-y-2">
            <div className="font-bold text-lg">✅ Migration Complete!</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Total Records:</div>
                <div className="text-xl font-bold">{result.totalRecords}</div>
              </div>
              <div>
                <div className="text-gray-400">Updated Records:</div>
                <div className="text-xl font-bold text-yellow-400">{result.updatedRecords}</div>
              </div>
              <div>
                <div className="text-gray-400">Meks Updated:</div>
                <div className="text-xl font-bold text-green-400">{result.updatedMeks}</div>
              </div>
              <div>
                <div className="text-gray-400">Status:</div>
                <div className="text-xl font-bold">{result.success ? '✅ Success' : '❌ Failed'}</div>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-4">
              Refresh the /home page to see Mek images load correctly.
            </div>
          </div>
        )}

        {/* Diagnostics Section */}
        <div className="mt-6 border-t border-gray-700 pt-4">
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="text-blue-400 hover:text-blue-300 text-sm mb-3 flex items-center gap-2"
          >
            <span>{showDiagnostics ? '▼' : '▶'}</span>
            <span>Show Database Diagnostics</span>
          </button>

          {showDiagnostics && diagnosticData && diagnosticData.found && (
            <div className="bg-gray-900/50 border border-gray-600 rounded p-4 text-xs space-y-3">
              <div className="text-yellow-400 font-bold">Database Status:</div>

              <div className="grid grid-cols-2 gap-2 text-gray-300">
                <div>Total Meks:</div>
                <div className="font-mono">{diagnosticData.stats.totalMeks}</div>

                <div>With sourceKey:</div>
                <div className="font-mono text-green-400">{diagnosticData.stats.meksWithSourceKey}</div>

                <div>With sourceKeyBase:</div>
                <div className="font-mono text-green-400">{diagnosticData.stats.meksWithSourceKeyBase}</div>

                <div>With headVariation:</div>
                <div className="font-mono text-blue-400">{diagnosticData.stats.meksWithHeadVariation}</div>

                <div>With bodyVariation:</div>
                <div className="font-mono text-blue-400">{diagnosticData.stats.meksWithBodyVariation}</div>

                <div>With itemVariation:</div>
                <div className="font-mono text-blue-400">{diagnosticData.stats.meksWithItemVariation}</div>
              </div>

              <div className="text-yellow-400 font-bold mt-4">First 5 Meks Sample:</div>
              <div className="space-y-3">
                {diagnosticData.samples.map((mek: any) => (
                  <div key={mek.index} className="bg-black/30 p-3 rounded space-y-1">
                    <div className="font-bold text-white">
                      {mek.index}. {mek.assetName}
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-gray-400">
                      <div>sourceKey:</div>
                      <div className={mek.hasSourceKey ? 'text-green-400' : 'text-red-400'}>
                        {mek.sourceKey || '❌ missing'}
                      </div>

                      <div>sourceKeyBase:</div>
                      <div className={mek.hasSourceKeyBase ? 'text-green-400' : 'text-red-400'}>
                        {mek.sourceKeyBase || '❌ missing'}
                      </div>

                      <div>headVariation:</div>
                      <div className={mek.hasHeadVariation ? 'text-blue-400' : 'text-red-400'}>
                        {mek.headVariation || '❌ missing'}
                      </div>

                      <div>bodyVariation:</div>
                      <div className={mek.hasBodyVariation ? 'text-blue-400' : 'text-red-400'}>
                        {mek.bodyVariation || '❌ missing'}
                      </div>

                      <div>itemVariation:</div>
                      <div className={mek.hasItemVariation ? 'text-blue-400' : 'text-red-400'}>
                        {mek.itemVariation || '❌ missing'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
