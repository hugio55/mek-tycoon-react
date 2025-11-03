'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { createPortal } from 'react-dom';

/**
 * BUFF CATEGORIES V2 - Hierarchical Admin Interface
 *
 * Structure:
 * - Parent: Tenure (with base rate configuration)
 *   - Child: Tenure Rate: Individual Mek
 *   - Child: Tenure Rate: Global
 */

export default function BuffCategoriesV2() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showEditBaseRate, setShowEditBaseRate] = useState(false);
  const [baseRateInput, setBaseRateInput] = useState('1');
  const [mounted, setMounted] = useState(false);

  // Query base rate
  const baseRateData = useQuery(api.tenureConfig.getBaseRate);

  // Mutations
  const setBaseRate = useMutation(api.tenureConfig.setBaseRate);

  useEffect(() => {
    setMounted(true);

    // Lock body scroll when modal is open
    if (showEditBaseRate) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [showEditBaseRate]);

  // Initialize base rate input when data loads
  useEffect(() => {
    if (baseRateData) {
      setBaseRateInput(baseRateData.baseRate.toString());
    }
  }, [baseRateData]);

  const toggleRow = (rowId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const handleSaveBaseRate = async () => {
    const rate = parseFloat(baseRateInput);
    if (isNaN(rate) || rate <= 0) {
      alert('Please enter a valid positive number');
      return;
    }

    try {
      const result = await setBaseRate({ baseRate: rate });
      if (result.success) {
        setShowEditBaseRate(false);
      } else {
        alert(result.message || 'Failed to update base rate');
      }
    } catch (error) {
      console.error('Error setting base rate:', error);
      alert('An error occurred while saving');
    }
  };

  const isTenureExpanded = expandedRows.has('tenure');

  // Edit Base Rate Modal
  const editBaseRateModal = showEditBaseRate && mounted && createPortal(
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={() => setShowEditBaseRate(false)}
    >
      <div
        className="mek-card-industrial mek-border-sharp-gold max-w-md w-full relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mek-header-industrial flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold uppercase tracking-wider text-yellow-400">
            Configure Tenure Base Rate
          </h2>
          <button
            onClick={() => setShowEditBaseRate(false)}
            className="text-gray-400 hover:text-yellow-400 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Description */}
        <div className="mb-6 p-4 bg-black/40 border-l-4 border-yellow-500/50">
          <p className="text-gray-300 text-sm leading-relaxed">
            The base rate determines how much tenure all Meks accumulate per second when slotted.
            This rate is multiplied by any active buffs (Individual Mek or Global).
          </p>
          <p className="text-yellow-400 text-xs mt-2">
            Current: {baseRateData?.baseRate || 1} tenure/second
          </p>
        </div>

        {/* Input */}
        <div className="mb-6">
          <label className="mek-label-uppercase block mb-2">
            Base Rate (tenure/second)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={baseRateInput}
            onChange={(e) => setBaseRateInput(e.target.value)}
            className="w-full bg-black/50 border-2 border-yellow-500/30 text-yellow-400 px-4 py-3 focus:border-yellow-500 focus:outline-none"
            placeholder="e.g., 1.0"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSaveBaseRate}
            className="mek-button-primary flex-1"
          >
            Save Changes
          </button>
          <button
            onClick={() => setShowEditBaseRate(false)}
            className="mek-button-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mek-card-industrial">
        <div className="mek-header-industrial mb-4">
          <h2 className="text-2xl font-bold uppercase tracking-wider text-yellow-400">
            ⚡ Buff Categories V2
          </h2>
        </div>
        <p className="text-gray-400 text-sm">
          Configure buff categories, base rates, and multipliers for the tenure system.
          Expand each category to view and manage specific buff types.
        </p>
      </div>

      {/* Hierarchical Table */}
      <div className="mek-card-industrial overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-yellow-500/30">
              <th className="text-left px-4 py-3 text-yellow-400 uppercase text-sm font-bold tracking-wider">
                Buff Category
              </th>
              <th className="text-left px-4 py-3 text-yellow-400 uppercase text-sm font-bold tracking-wider">
                Current Value
              </th>
              <th className="text-right px-4 py-3 text-yellow-400 uppercase text-sm font-bold tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Parent Row: Tenure */}
            <tr
              className="border-b border-yellow-500/20 hover:bg-yellow-500/5 cursor-pointer transition-colors"
              onClick={() => toggleRow('tenure')}
            >
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-yellow-400 text-lg">
                    {isTenureExpanded ? '▼' : '▶'}
                  </span>
                  <span className="text-white font-semibold uppercase tracking-wider">
                    Tenure
                  </span>
                </div>
              </td>
              <td className="px-4 py-4">
                <span className="mek-value-primary">
                  {baseRateData?.baseRate || 1} tenure/sec
                </span>
              </td>
              <td className="px-4 py-4 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditBaseRate(true);
                  }}
                  className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30 transition-colors uppercase text-xs font-bold tracking-wider"
                >
                  Edit
                </button>
              </td>
            </tr>

            {/* Child Rows (shown when parent is expanded) */}
            {isTenureExpanded && (
              <>
                {/* Child 1: Tenure Rate: Individual Mek */}
                <tr className="border-b border-yellow-500/10 hover:bg-yellow-500/5 transition-colors bg-black/20">
                  <td className="px-4 py-3 pl-12">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-sm">└─</span>
                      <span className="text-gray-300 text-sm uppercase tracking-wider">
                        Tenure Rate: Individual Mek
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-400 text-sm">
                      (Varies per Mek)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="px-4 py-2 bg-gray-500/20 border border-gray-500/50 text-gray-400 hover:bg-gray-500/30 transition-colors uppercase text-xs font-bold tracking-wider"
                      title="Edit functionality coming soon"
                    >
                      Edit
                    </button>
                  </td>
                </tr>

                {/* Child 2: Tenure Rate: Global */}
                <tr className="border-b border-yellow-500/10 hover:bg-yellow-500/5 transition-colors bg-black/20">
                  <td className="px-4 py-3 pl-12">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-sm">└─</span>
                      <span className="text-gray-300 text-sm uppercase tracking-wider">
                        Tenure Rate: Global
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-400 text-sm">
                      (Applies to all Meks)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="px-4 py-2 bg-gray-500/20 border border-gray-500/50 text-gray-400 hover:bg-gray-500/30 transition-colors uppercase text-xs font-bold tracking-wider"
                      title="Edit functionality coming soon"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Info Panel */}
      <div className="mek-card-industrial border-l-4 border-yellow-500/50">
        <h3 className="text-lg font-bold uppercase tracking-wider text-yellow-400 mb-3">
          How It Works
        </h3>
        <ul className="space-y-2 text-gray-400 text-sm">
          <li className="flex gap-3">
            <span className="text-yellow-400">•</span>
            <span>
              <strong className="text-white">Base Rate:</strong> The default tenure accumulation rate for all slotted Meks (e.g., 1 tenure/second).
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-yellow-400">•</span>
            <span>
              <strong className="text-white">Individual Mek Buffs:</strong> Multipliers that apply only to specific Meks (e.g., +50% for Mek #1234).
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-yellow-400">•</span>
            <span>
              <strong className="text-white">Global Buffs:</strong> Multipliers that affect all Meks in the player's account (e.g., +25% for all).
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-yellow-400">•</span>
            <span>
              <strong className="text-white">Formula:</strong> effectiveRate = baseRate × (1 + globalBuffs + perMekBuffs)
            </span>
          </li>
        </ul>
      </div>

      {/* Render modal */}
      {editBaseRateModal}
    </div>
  );
}
