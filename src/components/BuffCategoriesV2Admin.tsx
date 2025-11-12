'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface BuffCategory {
  id: string;
  name: string;
  type: 'config' | 'buff';
  baseValue: string | null;
  children?: BuffCategory[];
}

interface EditTenureModalProps {
  currentValue: number;
  onClose: () => void;
  onSave: (value: number) => void;
}

function EditTenureModal({ currentValue, onClose, onSave }: EditTenureModalProps) {
  const [mounted, setMounted] = useState(false);
  const [inputValue, setInputValue] = useState(currentValue.toString());

  React.useEffect(() => {
    setMounted(true);
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleSave = () => {
    const parsedValue = parseFloat(inputValue);
    if (!isNaN(parsedValue) && parsedValue > 0) {
      onSave(parsedValue);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <div
        className="mek-card-industrial mek-border-sharp-gold w-full max-w-md mx-4 p-6 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with hazard stripes */}
        <div className="mek-header-industrial mb-6">
          <h2 className="mek-text-industrial text-xl text-yellow-400">
            Configure Tenure Base Rate
          </h2>
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="mek-label-uppercase text-gray-400 mb-2 block">
              Base Tenure Rate (per second)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-4 py-3 bg-black/60 border-2 border-yellow-500/30 text-yellow-400 text-lg font-bold focus:border-yellow-500 focus:outline-none transition-colors"
              autoFocus
            />
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            All Meks accumulate tenure at this rate while slotted. Can be buffed per-Mek or globally.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="mek-button-secondary flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="mek-button-primary flex-1"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

interface EditGoldModalProps {
  currentValue: number;
  onClose: () => void;
  onSave: (value: number) => void;
}

function EditGoldModal({ currentValue, onClose, onSave }: EditGoldModalProps) {
  const [mounted, setMounted] = useState(false);
  const [inputValue, setInputValue] = useState(currentValue.toString());

  React.useEffect(() => {
    setMounted(true);
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleSave = () => {
    const parsedValue = parseFloat(inputValue);
    if (!isNaN(parsedValue) && parsedValue > 0) {
      onSave(parsedValue);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <div
        className="mek-card-industrial mek-border-sharp-gold w-full max-w-md mx-4 p-6 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with hazard stripes */}
        <div className="mek-header-industrial mb-6">
          <h2 className="mek-text-industrial text-xl text-yellow-400">
            Configure Gold Base Rate
          </h2>
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="mek-label-uppercase text-gray-400 mb-2 block">
              Base Gold Rate (per hour)
            </label>
            <input
              type="number"
              step="1"
              min="1"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-4 py-3 bg-black/60 border-2 border-yellow-500/30 text-yellow-400 text-lg font-bold focus:border-yellow-500 focus:outline-none transition-colors"
              autoFocus
            />
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Base gold generation rate per hour. Can be modified by flat boosts and percentage buffs.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="mek-button-secondary flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="mek-button-primary flex-1"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

interface ExpandableRowProps {
  category: BuffCategory;
  level: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
}

function ExpandableRow({ category, level, isExpanded, onToggle, onEdit }: ExpandableRowProps) {
  const hasChildren = category.children && category.children.length > 0;

  return (
    <>
      <tr className="border-b border-gray-800/50 hover:bg-yellow-500/5 transition-colors">
        {/* Category Name with expand arrow */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
            {hasChildren && (
              <button
                onClick={onToggle}
                className="text-yellow-400 hover:text-yellow-300 transition-colors w-5 h-5 flex items-center justify-center"
              >
                {isExpanded ? '▼' : '►'}
              </button>
            )}
            {!hasChildren && <span className="text-gray-600 ml-5">└─</span>}
            <span className={`${level === 0 ? 'font-bold text-yellow-400' : 'text-gray-300'}`}>
              {category.name}
            </span>
          </div>
        </td>

        {/* Type Column */}
        <td className="px-4 py-3">
          <span
            className={`px-2 py-1 text-xs font-bold uppercase tracking-wider ${
              category.type === 'config'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
            }`}
          >
            {category.type}
          </span>
        </td>

        {/* Base Value Column */}
        <td className="px-4 py-3 text-gray-300">
          {category.baseValue || '---'}
        </td>

        {/* Actions Column */}
        <td className="px-4 py-3">
          <button
            onClick={onEdit}
            className="px-4 py-1.5 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-sm font-bold hover:bg-yellow-400/20 hover:border-yellow-400/50 transition-colors"
          >
            Edit
          </button>
        </td>
      </tr>

      {/* Render children if expanded */}
      {hasChildren && isExpanded && category.children!.map((child) => (
        <ExpandableRow
          key={child.id}
          category={child}
          level={level + 1}
          isExpanded={false}
          onToggle={() => {}}
          onEdit={() => console.log(`Edit ${child.name}`)}
        />
      ))}
    </>
  );
}

export default function BuffCategoriesV2Admin() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['tenure', 'gold']));
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditGoldModal, setShowEditGoldModal] = useState(false);

  // Query base rates from Convex
  const baseRateData = useQuery(api.tenureConfig.getBaseRate);
  const goldRateData = useQuery(api.goldConfig.getBaseGoldRate);

  // Mutations
  const setBaseRateMutation = useMutation(api.tenureConfig.setBaseRate);
  const setGoldRateMutation = useMutation(api.goldConfig.setBaseGoldRate);

  const tenureBaseRate = baseRateData?.baseRate || 1.0;
  const goldBaseRate = goldRateData?.baseGoldPerHour || 100;

  // Hierarchical buff category structure
  const buffCategories: BuffCategory[] = [
    {
      id: 'tenure',
      name: 'Tenure',
      type: 'config',
      baseValue: `${tenureBaseRate.toFixed(1)}/sec`,
      children: [
        {
          id: 'individual-tenure',
          name: 'Individual',
          type: 'buff',
          baseValue: null,
        },
        {
          id: 'global-tenure',
          name: 'Global',
          type: 'buff',
          baseValue: null,
        }
      ]
    },
    {
      id: 'gold',
      name: 'Gold',
      type: 'config',
      baseValue: `${goldBaseRate.toFixed(0)}/hr`,
      children: [
        {
          id: 'rate-gold-per-hour',
          name: 'Rate Gold Per Hour',
          type: 'buff',
          baseValue: null,
        },
        {
          id: 'boost-flat',
          name: 'Boost Flat',
          type: 'buff',
          baseValue: null,
        },
        {
          id: 'boost-percent',
          name: 'Boost %',
          type: 'buff',
          baseValue: null,
        }
      ]
    }
  ];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleSaveTenureRate = async (newValue: number) => {
    try {
      const result = await setBaseRateMutation({ baseRate: newValue });
      if (result.success) {
        console.log('[🔧CONFIG] Tenure base rate updated:', newValue);
        setShowEditModal(false);
      } else {
        console.error('[🔧CONFIG] Failed to update base rate:', result.message);
        alert('Failed to save: ' + result.message);
      }
    } catch (error) {
      console.error('[🔧CONFIG] Error saving tenure base rate:', error);
      alert('An error occurred while saving');
    }
  };

  const handleSaveGoldRate = async (newValue: number) => {
    try {
      const result = await setGoldRateMutation({ baseGoldPerHour: newValue });
      if (result.success) {
        console.log('[🔧CONFIG] Gold base rate updated:', newValue);
        setShowEditGoldModal(false);
      } else {
        console.error('[🔧CONFIG] Failed to update gold base rate:', result.message);
        alert('Failed to save: ' + result.message);
      }
    } catch (error) {
      console.error('[🔧CONFIG] Error saving gold base rate:', error);
      alert('An error occurred while saving');
    }
  };

  return (
    <div className="space-y-6">
      {/* Industrial Header */}
      <div className="mek-header-industrial">
        <h2 className="mek-text-industrial text-2xl text-yellow-400">
          Buff Categories V2
        </h2>
        <p className="text-gray-400 text-sm mt-2 normal-case tracking-normal">
          Hierarchical configuration for buff categories and their base values
        </p>
      </div>

      {/* Hierarchical Table */}
      <div className="mek-card-industrial mek-border-sharp-gold overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-black/60 border-b-2 border-yellow-500/30">
                <th className="px-4 py-3 text-left text-yellow-400 font-bold uppercase tracking-wider text-sm">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-yellow-400 font-bold uppercase tracking-wider text-sm">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-yellow-400 font-bold uppercase tracking-wider text-sm">
                  Base Value
                </th>
                <th className="px-4 py-3 text-left text-yellow-400 font-bold uppercase tracking-wider text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-black/40">
              {buffCategories.map((category) => (
                <ExpandableRow
                  key={category.id}
                  category={category}
                  level={0}
                  isExpanded={expandedCategories.has(category.id)}
                  onToggle={() => toggleCategory(category.id)}
                  onEdit={() => {
                    if (category.id === 'tenure') {
                      setShowEditModal(true);
                    } else if (category.id === 'gold') {
                      setShowEditGoldModal(true);
                    }
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card */}
      <div className="mek-card-industrial mek-border-sharp-gray p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <h3 className="text-yellow-400 font-bold mb-1">Hierarchy Explained</h3>
            <ul className="text-gray-400 text-sm space-y-1">
              <li><strong className="text-yellow-400">Config:</strong> Parent categories that define base values</li>
              <li><strong className="text-purple-400">Buff:</strong> Child categories that multiply or add to base values</li>
              <li><strong className="text-gray-300">Individual:</strong> Applies to specific Meks</li>
              <li><strong className="text-gray-300">Global:</strong> Applies to all Meks</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditTenureModal
          currentValue={tenureBaseRate}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveTenureRate}
        />
      )}
    </div>
  );
}
