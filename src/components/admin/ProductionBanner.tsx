'use client';

/**
 * Production Banner
 *
 * Visual indicator that the user is viewing/editing PRODUCTION data.
 * Displays current read-only/mutation status and provides toggle control.
 */

import { useState } from 'react';
import { useProductionDatabase } from '@/contexts/ProductionDatabaseContext';

interface ProductionBannerProps {
  /** Custom title (default: "Production Data") */
  title?: string;
  /** Show the mutations toggle (default: true) */
  showMutationsToggle?: boolean;
  /** Compact mode - smaller banner (default: false) */
  compact?: boolean;
}

export default function ProductionBanner({
  title = "Production Data",
  showMutationsToggle = true,
  compact = false,
}: ProductionBannerProps) {
  const { mutationsEnabled, enableMutations, disableMutations, isReady } = useProductionDatabase();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleToggleMutations = () => {
    if (mutationsEnabled) {
      // Turning off - no confirmation needed
      disableMutations();
    } else {
      // Turning on - show confirmation
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmEnable = () => {
    enableMutations();
    setShowConfirmDialog(false);
  };

  if (!isReady) {
    return (
      <div className={`bg-gray-900/50 border border-gray-700 rounded-lg ${compact ? 'p-2' : 'p-4'} mb-4`}>
        <div className="flex items-center gap-2 text-gray-400">
          <div className="w-3 h-3 rounded-full bg-gray-500 animate-pulse" />
          <span className={compact ? 'text-xs' : 'text-sm'}>Connecting to production database...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`
          rounded-lg mb-4 transition-all
          ${compact ? 'p-2' : 'p-4'}
          ${mutationsEnabled
            ? 'bg-red-900/30 border-2 border-red-500/50'
            : 'bg-emerald-900/20 border border-emerald-500/30'
          }
        `}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Status indicator */}
          <div className="flex items-center gap-3">
            {/* Pulsing dot */}
            <div className="relative">
              <div
                className={`
                  w-3 h-3 rounded-full
                  ${mutationsEnabled ? 'bg-red-500' : 'bg-emerald-500'}
                `}
              />
              <div
                className={`
                  absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-75
                  ${mutationsEnabled ? 'bg-red-500' : 'bg-emerald-500'}
                `}
              />
            </div>

            {/* Title and status */}
            <div>
              <div className={`font-bold ${compact ? 'text-sm' : 'text-base'} ${mutationsEnabled ? 'text-red-400' : 'text-emerald-400'}`}>
                {title}
              </div>
              <div className={`${compact ? 'text-xs' : 'text-sm'} text-gray-400`}>
                {mutationsEnabled
                  ? 'Editing LIVE data - Changes affect real users'
                  : 'Read-only mode - Viewing live production data'
                }
              </div>
            </div>
          </div>

          {/* Mutations toggle */}
          {showMutationsToggle && (
            <button
              onClick={handleToggleMutations}
              className={`
                px-4 py-2 rounded font-semibold text-sm transition-all
                ${mutationsEnabled
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/30'
                }
              `}
            >
              {mutationsEnabled ? 'Disable Editing' : 'Enable Editing'}
            </button>
          )}
        </div>

        {/* Warning when mutations enabled */}
        {mutationsEnabled && !compact && (
          <div className="mt-3 pt-3 border-t border-red-500/30">
            <div className="flex items-start gap-2 text-sm text-red-300">
              <span className="text-lg">Warning:</span>
              <span>
                You are editing <strong>PRODUCTION</strong> data. All changes immediately affect the live site
                and real users. Double-check before saving any changes.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border-2 border-yellow-500/50 rounded-lg p-6 max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">Warning</div>
              <div>
                <h3 className="text-xl font-bold text-yellow-400">Enable Production Editing?</h3>
                <p className="text-sm text-gray-400">This will allow changes to live data</p>
              </div>
            </div>

            <div className="bg-red-900/30 border border-red-500/50 rounded p-4 mb-6">
              <p className="text-sm text-red-300">
                <strong>You are about to enable editing on PRODUCTION data.</strong>
              </p>
              <ul className="mt-2 text-sm text-gray-300 list-disc list-inside space-y-1">
                <li>Changes will immediately affect the live website</li>
                <li>Real users will see your modifications</li>
                <li>This cannot be easily undone</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEnable}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded font-bold transition-colors"
              >
                Yes, Enable Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
