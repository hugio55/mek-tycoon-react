'use client';

import { useEffect, useState } from 'react';
import { LoaderProvider, usePageLoadProgress, useLoaderContext, LoadingOverlay } from '../index';

function TestContent() {
  const { registerQuery, markQueryLoaded, setWalletLoaded } = useLoaderContext();
  const progress = usePageLoadProgress();
  const [simulatedQueries, setSimulatedQueries] = useState<string[]>([]);
  const [showContent, setShowContent] = useState(false);

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
    <>
      {/* Loading Overlay */}
      {!showContent && progress.canShow && (
        <LoadingOverlay
          percentage={progress.percentage}
          stage={progress.stage}
          isComplete={progress.isComplete}
          onComplete={() => setShowContent(true)}
        />
      )}

      {/* Page Content */}
      <div
        className="min-h-screen bg-black text-white p-8 transition-opacity duration-800"
        style={{
          opacity: showContent || !progress.canShow ? 1 : 0,
        }}
      >
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-yellow-400">Page Loader Core Test</h1>

        <div className="bg-gray-900 border border-yellow-500/30 rounded-lg p-6 space-y-4">
          <div>
            <div className="text-sm text-gray-400">Progress</div>
            <div className="text-4xl font-bold text-yellow-400">{progress.percentage}%</div>
          </div>

          {/* Smooth Progress Bar */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Progress Bar (Smooth Transition)</div>
            <div className="relative h-8 bg-black/50 border border-yellow-500/30 rounded overflow-hidden">
              {/* Background Grid */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(250,182,23,0.1) 24px, rgba(250,182,23,0.1) 25px)'
              }} />

              {/* Filled Bar with Smooth Transition */}
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-400"
                style={{
                  width: `${progress.percentage}%`,
                  transition: 'width 0.8s ease-out',
                  boxShadow: '0 0 20px rgba(250, 182, 23, 0.5)'
                }}
              >
                {/* Shimmer Effect */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  style={{
                    animation: 'shimmer 2s infinite',
                    backgroundSize: '200% 100%'
                  }}
                />
              </div>

              {/* Percentage Text Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-white drop-shadow-lg">
                  {progress.percentage}%
                </span>
              </div>
            </div>
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

        <style jsx global>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>

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
    </>
  );
}

export default function TestLoaderCore() {
  return (
    <LoaderProvider>
      <TestContent />
    </LoaderProvider>
  );
}
