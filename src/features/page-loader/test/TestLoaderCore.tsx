'use client';

import { useEffect, useState } from 'react';
import { LoaderProvider, usePageLoadProgress, useLoaderContext } from '../index';

function TestContent() {
  const { registerQuery, markQueryLoaded, setWalletLoaded } = useLoaderContext();
  const progress = usePageLoadProgress();
  const [simulatedQueries, setSimulatedQueries] = useState<string[]>([]);

  useEffect(() => {
    console.log('[TEST] Simulating wallet load in 1 second...');
    setTimeout(() => {
      setWalletLoaded(true);
      console.log('[TEST] Wallet loaded');
    }, 1000);

    console.log('[TEST] Simulating 3 queries...');
    const queryIds = ['query1', 'query2', 'query3'];
    queryIds.forEach((id) => {
      registerQuery(id);
    });
    setSimulatedQueries(queryIds);

    setTimeout(() => {
      console.log('[TEST] Loading query1...');
      markQueryLoaded('query1');
    }, 1500);

    setTimeout(() => {
      console.log('[TEST] Loading query2...');
      markQueryLoaded('query2');
    }, 2500);

    setTimeout(() => {
      console.log('[TEST] Loading query3...');
      markQueryLoaded('query3');
    }, 3500);
  }, [registerQuery, markQueryLoaded, setWalletLoaded]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-yellow-400">Page Loader Core Test</h1>

        <div className="bg-gray-900 border border-yellow-500/30 rounded-lg p-6 space-y-4">
          <div>
            <div className="text-sm text-gray-400">Progress</div>
            <div className="text-4xl font-bold text-yellow-400">{progress.percentage}%</div>
          </div>

          <div>
            <div className="text-sm text-gray-400">Stage</div>
            <div className="text-lg">{progress.stage}</div>
          </div>

          <div>
            <div className="text-sm text-gray-400">Status</div>
            <div className={`text-lg ${progress.isComplete ? 'text-green-400' : 'text-yellow-400'}`}>
              {progress.isComplete ? 'COMPLETE' : 'LOADING...'}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-400">Can Show Loader</div>
            <div className={`text-lg ${progress.canShow ? 'text-green-400' : 'text-red-400'}`}>
              {progress.canShow ? 'YES' : 'NO'}
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-yellow-500/30 rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-3">Simulated Queries</div>
          <ul className="space-y-2">
            {simulatedQueries.map((id) => (
              <li key={id} className="text-sm font-mono text-gray-300">
                {id}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gray-900 border border-blue-500/30 rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-3">Timeline</div>
          <ul className="space-y-1 text-sm text-gray-300">
            <li>0s: Start</li>
            <li>1s: Wallet loads (25%)</li>
            <li>1.5s: Query 1 loads</li>
            <li>2.5s: Query 2 loads</li>
            <li>3.5s: Query 3 loads (100%)</li>
          </ul>
        </div>

        <div className="text-xs text-gray-500">
          Check browser console for detailed [PAGE LOADER] logs
        </div>
      </div>
    </div>
  );
}

export default function TestLoaderCore() {
  return (
    <LoaderProvider>
      <TestContent />
    </LoaderProvider>
  );
}
