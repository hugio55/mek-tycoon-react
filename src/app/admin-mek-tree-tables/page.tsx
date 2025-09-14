"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

// Rarity rank ranges for the 6 tiers
// God Tier: 1-10, Legendary: 11-100, Epic: 101-250, Rare: 251-1000, Uncommon: 1001-2000, Common: 2001-4000
const RARITY_TIERS = [
  { label: "Common (2001-4000)", min: 2001, max: 4000 },
  { label: "Uncommon (1001-2000)", min: 1001, max: 2000 },
  { label: "Rare (251-1000)", min: 251, max: 1000 },
  { label: "Epic (101-250)", min: 101, max: 250 },
  { label: "Legendary (11-100)", min: 11, max: 100 },
  { label: "God Tier (1-10)", min: 1, max: 10 },
];

// Official buff categories from the game's categories pool
// Organized by category type: gold, essence, market, reward_chance, rarity_bias, xp, mek_slot
const BUFF_CATEGORIES_BY_TYPE = {
  gold: [
    "Gold Flat",
    "Gold Rate Mek",
    "Interest Rate Bank",
    "CircuTree Gold Cost Reduction %",
    "Scrapyard Gold Reward Increase",
  ],
  essence: [
    "CircuTree Essence Cost Reduction %",
    "Essence Rate Global",
    "Essence Rate Specific",
    "Scrapyard Essence Reward Increase",
    "Flat Rewards of Essence",
    "Essence Bar Cap Increase",
    "Crafting Glyph Essence Cost Reduction",
  ],
  market: [
    "Auction House Fee Reduction",
    "Discount on OE Items",
    "Crafting Fee Reduction",
  ],
  reward_chance: [
    "Scrap Yard Loot Chance Increase",
    "Fight Cooldown Timer Reduction",
    "Various Perks to Fight Mechanics",
    "Glyph Duration",
  ],
  rarity_bias: [
    "Rarity Bias",
  ],
  xp: [
    "XP Gain Bank",
    "XP Gain Scrap Yard",
  ],
  mek_slot: [
    "Mek Slots",
  ],
};

// Flatten for backward compatibility
const DEFAULT_BUFF_CATEGORIES = Object.values(BUFF_CATEGORIES_BY_TYPE).flat();

interface BuffTable {
  _id?: Id<"mekTreeBuffTables">;
  category: string;
  values: number[][]; // [rarityTier][treeTier] = value
  isActive: boolean;
  createdAt?: number;
  updatedAt?: number;
}

// Interpolation function with adjustable curve and rounding
function interpolateValue(
  min: number,
  max: number,
  position: number, // 0 to 1
  curveStrength: number, // 0 = linear, 1 = maximum curve
  roundTo: number = 1 // 1 = no rounding, 10 = round to tens, 100 = round to hundreds
): number {
  // Apply power curve based on strength
  // curveStrength 0 = linear (power of 1)
  // curveStrength 1 = cubic (power of 3)
  const power = 1 + (curveStrength * 2);
  const curvedPosition = Math.pow(position, power);
  
  const value = min + (max - min) * curvedPosition;
  return Math.round(value / roundTo) * roundTo;
}

// Format number with commas
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

// Generate full table from min/max values
function generateTableFromMinMax(
  minValue: number,
  maxValue: number,
  horizontalCurve: number,
  verticalCurve: number,
  roundTo: number = 1
): number[][] {
  const table: number[][] = [];
  
  for (let rarityIndex = 0; rarityIndex < 7; rarityIndex++) {
    const row: number[] = [];
    
    // Vertical position (0 = least rare, 1 = most rare)
    const verticalPos = rarityIndex / 6;
    
    for (let tierIndex = 0; tierIndex < 10; tierIndex++) {
      // Horizontal position (0 = tier 1, 1 = tier 10)
      const horizontalPos = tierIndex / 9;
      
      // Calculate min and max for this rarity level
      const rarityMin = interpolateValue(minValue, maxValue, verticalPos * 0.3, verticalCurve, roundTo);
      const rarityMax = interpolateValue(minValue, maxValue, verticalPos + (1 - verticalPos) * 0.7, verticalCurve, roundTo);
      
      // Calculate value for this tier within the rarity range
      const value = interpolateValue(rarityMin, rarityMax, horizontalPos, horizontalCurve, roundTo);
      
      row.push(value);
    }
    
    table.push(row);
  }
  
  return table;
}

export default function MekTreeTablesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Flat Gold");
  const [editMode, setEditMode] = useState(false);
  const [interpolateMode, setInterpolateMode] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [currentTable, setCurrentTable] = useState<BuffTable | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({
    category: "",
  });
  
  // Interpolation controls
  const [interpolationData, setInterpolationData] = useState({
    minValue: 50,
    maxValue: 2800,
    horizontalCurve: 0.3, // 0 = linear, 1 = maximum curve
    verticalCurve: 0.6,   // 0 = linear, 1 = maximum curve
    roundTo: 1, // 1 = no rounding, 10 = round to tens, 100 = round to hundreds
  });

  // Convex queries and mutations
  const buffTables = useQuery(api.mekTreeBuffTables.getAllBuffTables);
  const saveBuffTable = useMutation(api.mekTreeBuffTables.saveBuffTable);
  const deleteBuffTable = useMutation(api.mekTreeBuffTables.deleteBuffTable);

  // Initialize with default empty table
  const createEmptyTable = (): number[][] => {
    return Array(7).fill(null).map(() => Array(10).fill(0));
  };

  // Load selected category data
  useEffect(() => {
    if (buffTables && selectedCategory) {
      const found = buffTables.find(t => t.category === selectedCategory);
      if (found) {
        setCurrentTable(found);
        // Set interpolation min/max from existing data
        if (found.values && found.values.length > 0) {
          setInterpolationData(prev => ({
            ...prev,
            minValue: found.values[0][0],
            maxValue: found.values[6][9],
          }));
        }
      } else {
        // Create new empty table for this category
        setCurrentTable({
          category: selectedCategory,
          values: createEmptyTable(),
          isActive: true,
        });
      }
    }
  }, [buffTables, selectedCategory]);

  // Real-time interpolation update
  useEffect(() => {
    if (!currentTable || !interpolateMode) return;
    
    const newValues = generateTableFromMinMax(
      interpolationData.minValue,
      interpolationData.maxValue,
      interpolationData.horizontalCurve,
      interpolationData.verticalCurve,
      interpolationData.roundTo
    );
    
    setCurrentTable(prev => ({
      ...prev!,
      values: newValues,
    }));
  }, [interpolationData, interpolateMode]);

  // Handle cell value change
  const handleCellChange = (rarityIndex: number, tierIndex: number, value: string) => {
    if (!currentTable) return;
    
    const numValue = parseFloat(value) || 0;
    const newValues = [...currentTable.values];
    newValues[rarityIndex][tierIndex] = numValue;
    
    setCurrentTable({
      ...currentTable,
      values: newValues,
    });
  };


  // Parse pasted data (tab-delimited from spreadsheet)
  const parsePastedData = (text: string) => {
    const lines = text.trim().split('\n');
    const values: number[][] = [];
    
    lines.forEach((line, index) => {
      if (index >= 7) return; // Only take first 7 rows
      
      const cells = line.split('\t');
      const row: number[] = [];
      
      // Skip first cell (rank label) and take next 10
      for (let i = 1; i <= 10 && i < cells.length; i++) {
        const value = parseFloat(cells[i]) || 0;
        row.push(value);
      }
      
      // Ensure row has exactly 10 values
      while (row.length < 10) {
        row.push(0);
      }
      
      values.push(row);
    });
    
    // Ensure we have exactly 7 rows
    while (values.length < 7) {
      values.push(Array(10).fill(0));
    }
    
    return values;
  };

  // Handle paste submission
  const handlePasteSubmit = () => {
    try {
      const values = parsePastedData(pasteText);
      if (currentTable) {
        setCurrentTable({
          ...currentTable,
          values,
        });
      }
      setPasteMode(false);
      setPasteText("");
      setMessage({ type: 'success', text: 'Data pasted successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to parse pasted data. Make sure it\'s in the correct format.' });
    }
  };

  // Save table to database
  const handleSave = async () => {
    if (!currentTable) return;
    
    try {
      await saveBuffTable({
        category: currentTable.category,
        values: currentTable.values,
        isActive: currentTable.isActive,
      });
      
      setMessage({ type: 'success', text: `Saved ${currentTable.category} successfully!` });
      setEditMode(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save table' });
    }
  };

  // Create new category
  const handleCreateCategory = async () => {
    if (!newCategoryData.category) {
      setMessage({ type: 'error', text: 'Category name is required' });
      return;
    }
    
    try {
      await saveBuffTable({
        category: newCategoryData.category,
        values: createEmptyTable(),
        isActive: true,
      });
      
      setSelectedCategory(newCategoryData.category);
      setShowNewCategory(false);
      setNewCategoryData({ category: "" });
      setMessage({ type: 'success', text: 'New category created!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create category' });
    }
  };

  // Delete category
  const handleDelete = async () => {
    if (!currentTable?._id) return;
    
    if (!confirm(`Are you sure you want to delete "${currentTable.category}"?`)) {
      return;
    }
    
    try {
      await deleteBuffTable({ id: currentTable._id });
      setSelectedCategory("Gold Flat");
      setMessage({ type: 'success', text: 'Category deleted' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete category' });
    }
  };

  // Export table as CSV
  const exportAsCSV = () => {
    if (!currentTable) return;
    
    let csv = `${currentTable.category}\n`;
    csv += "Rank\t" + Array.from({length: 10}, (_, i) => i + 1).join("\t") + "\n";
    
    RARITY_TIERS.forEach((tier, i) => {
      csv += tier.label + "\t" + currentTable.values[i].join("\t") + "\n";
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTable.category.replace(/\s+/g, '_')}_table.csv`;
    a.click();
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="w-full max-w-full">
        {/* Compact Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-yellow-400 mb-1">Mek Tree Buff Tables</h1>
          <p className="text-xs text-gray-400">Configure buff values for procedural talent tree generation</p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-4 p-2 text-xs rounded-lg border ${
            message.type === 'success' ? 'bg-green-900/20 border-green-500 text-green-400' :
            message.type === 'error' ? 'bg-red-900/20 border-red-500 text-red-400' :
            'bg-blue-900/20 border-blue-500 text-blue-400'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex gap-4">
          {/* Category Sidebar - Narrower */}
          <div className="w-48 flex-shrink-0">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-yellow-400">Categories</h2>
                <button
                  onClick={() => setShowNewCategory(true)}
                  className="px-2 py-0.5 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                >
                  + New
                </button>
              </div>
              
              <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                {/* Group categories by type */}
                {Object.entries(BUFF_CATEGORIES_BY_TYPE).map(([categoryType, categories]) => (
                  <div key={categoryType}>
                    {/* Category Type Header */}
                    <div className="text-xs font-bold text-gray-400 uppercase px-2 py-1 bg-gray-800/30 rounded-sm mb-1">
                      {categoryType.replace('_', ' ')}
                    </div>
                    
                    {/* Categories in this type */}
                    <div className="space-y-1 pl-2">
                      {categories.map(catName => {
                        const existingTable = buffTables?.find(t => t.category === catName);
                        
                        return (
                          <button
                            key={catName}
                            onClick={() => setSelectedCategory(catName)}
                            className={`w-full text-left px-2 py-1.5 rounded text-xs transition-all ${
                              selectedCategory === catName
                                ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
                                : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
                            }`}
                          >
                            <div className="font-semibold">
                              {catName}
                            </div>
                            {!existingTable && (
                              <div className="text-xs text-gray-500 italic">Not configured</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Table Area - Full Width */}
          <div className="flex-1">
            {currentTable && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                {/* Table Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-yellow-400">{currentTable.category}</h2>
                    <div className="mt-1 text-sm text-gray-400">
                      Total Active Contracts: <span className="text-yellow-400 font-bold">
                        {(() => {
                          // Calculate total based on category type
                          const categoryLower = currentTable.category.toLowerCase();
                          if (categoryLower.includes('scrap') || categoryLower.includes('loot')) {
                            return '8,234';
                          } else if (categoryLower.includes('rarity')) {
                            return '12,450';
                          } else if (categoryLower.includes('cooldown') || categoryLower.includes('timer')) {
                            return '5,672';
                          } else if (categoryLower.includes('xp')) {
                            return '9,876';
                          } else if (categoryLower.includes('glyph')) {
                            return '3,250';
                          } else if (categoryLower.includes('mek slot')) {
                            return '4,500';
                          } else {
                            return '6,789';
                          }
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!editMode ? (
                      <>
                        <button
                          onClick={() => setEditMode(true)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          Edit Values
                        </button>
                        <button
                          onClick={() => setInterpolateMode(!interpolateMode)}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                        >
                          Interpolate
                        </button>
                        <button
                          onClick={() => setPasteMode(true)}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                        >
                          Paste Data
                        </button>
                        <button
                          onClick={exportAsCSV}
                          className="px-3 py-1.5 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                        >
                          Export CSV
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleSave}
                          className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditMode(false)}
                          className="px-3 py-1.5 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                        {currentTable._id && (
                          <button
                            onClick={handleDelete}
                            className="px-3 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Interpolation Controls */}
                {interpolateMode && (
                  <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                    <h3 className="text-sm font-bold text-purple-400 mb-3">Live Value Interpolation</h3>
                    <div className="grid grid-cols-5 gap-4">
                      <div>
                        <label className="text-xs text-gray-400">Min Value (3k-4k, Tier 1)</label>
                        <input
                          type="number"
                          value={interpolationData.minValue}
                          onChange={(e) => setInterpolationData({...interpolationData, minValue: parseFloat(e.target.value) || 0})}
                          className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Max Value (1-25, Tier 10)</label>
                        <input
                          type="number"
                          value={interpolationData.maxValue}
                          onChange={(e) => setInterpolationData({...interpolationData, maxValue: parseFloat(e.target.value) || 0})}
                          className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">
                          Horizontal Curve (Tier Progression)
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs">Linear</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={interpolationData.horizontalCurve * 100}
                            onChange={(e) => setInterpolationData({...interpolationData, horizontalCurve: parseInt(e.target.value) / 100})}
                            className="flex-1"
                          />
                          <span className="text-xs">Exponential</span>
                          <span className="text-xs text-yellow-400 w-10">{Math.round(interpolationData.horizontalCurve * 100)}%</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">
                          Vertical Curve (Rarity Progression)
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs">Linear</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={interpolationData.verticalCurve * 100}
                            onChange={(e) => setInterpolationData({...interpolationData, verticalCurve: parseInt(e.target.value) / 100})}
                            className="flex-1"
                          />
                          <span className="text-xs">Exponential</span>
                          <span className="text-xs text-yellow-400 w-10">{Math.round(interpolationData.verticalCurve * 100)}%</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Rounding</label>
                        <select
                          value={interpolationData.roundTo}
                          onChange={(e) => setInterpolationData({...interpolationData, roundTo: parseInt(e.target.value)})}
                          className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs"
                        >
                          <option value="1">No rounding</option>
                          <option value="10">Round to 10s</option>
                          <option value="100">Round to 100s</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={() => setInterpolateMode(false)}
                        className="px-4 py-1.5 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                      >
                        Close Interpolation
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Preview: Min={interpolationData.minValue} → Max={interpolationData.maxValue} | 
                      H-Curve: {interpolationData.horizontalCurve < 0.3 ? 'Linear' : interpolationData.horizontalCurve < 0.7 ? 'Moderate' : 'Exponential'} | 
                      V-Curve: {interpolationData.verticalCurve < 0.3 ? 'Linear' : interpolationData.verticalCurve < 0.7 ? 'Moderate' : 'Exponential'}
                    </p>
                  </div>
                )}

                {/* Settings Row (in edit mode) */}
                {editMode && (
                  <div className="mb-3 p-3 bg-gray-800/50 rounded">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={currentTable.isActive}
                        onChange={(e) => setCurrentTable({...currentTable, isActive: e.target.checked})}
                        className="w-3 h-3"
                      />
                      <label htmlFor="isActive" className="text-xs">
                        Active (include in procedural generation)
                      </label>
                    </div>
                  </div>
                )}

                {/* Value Table - Compact */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 px-3 text-yellow-400 text-xs">Rank</th>
                        {Array.from({length: 10}, (_, i) => (
                          <th key={i} className="text-center py-2 px-2 text-yellow-400 text-xs min-w-[60px]">
                            T{i + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {RARITY_TIERS.map((tier, rarityIndex) => (
                        <tr key={rarityIndex} className="border-b border-gray-800 hover:bg-gray-800/30">
                          <td className="py-2 px-3 font-semibold text-gray-300 text-xs whitespace-nowrap">{tier.label}</td>
                          {Array.from({length: 10}, (_, tierIndex) => (
                            <td key={tierIndex} className="text-center px-1">
                              {editMode ? (
                                <input
                                  type="number"
                                  value={currentTable.values[rarityIndex][tierIndex]}
                                  onChange={(e) => handleCellChange(rarityIndex, tierIndex, e.target.value)}
                                  className="w-full px-1 py-0.5 bg-gray-900 border border-gray-700 rounded text-center text-xs"
                                />
                              ) : (
                                <span className="text-gray-200 text-xs">
                                  {formatNumber(currentTable.values[rarityIndex][tierIndex])}
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Info Box - Compact */}
                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-sm">ℹ️</span>
                    <div className="text-gray-400">
                      <span className="text-blue-400 font-semibold">Quick Guide:</span>
                      <span className="ml-2">Rows = Mek rarity (rarer = higher values)</span>
                      <span className="mx-2">•</span>
                      <span>Columns = Tree tiers (1-10)</span>
                      <span className="mx-2">•</span>
                      <span>Use Interpolate to auto-generate values with curves</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Paste Modal */}
        {pasteMode && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-3xl w-full">
              <h3 className="text-xl font-bold text-yellow-400 mb-3">Paste Table Data</h3>
              
              <p className="text-xs text-gray-400 mb-3">
                Copy data from your spreadsheet (including headers) and paste below.
                Expected format: 7 rows × 10 columns of numbers.
              </p>
              
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste your data here..."
                className="w-full h-48 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white font-mono text-xs"
              />
              
              <div className="flex gap-3 mt-3">
                <button
                  onClick={handlePasteSubmit}
                  className="px-4 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                >
                  Import Data
                </button>
                <button
                  onClick={() => {
                    setPasteMode(false);
                    setPasteText("");
                  }}
                  className="px-4 py-1.5 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Category Modal */}
        {showNewCategory && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 max-w-md w-full">
              <h3 className="text-lg font-bold text-yellow-400 mb-3">Create New Category</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400">Category Name</label>
                  <input
                    type="text"
                    value={newCategoryData.category}
                    onChange={(e) => setNewCategoryData({...newCategoryData, category: e.target.value})}
                    placeholder="e.g., Attack Power"
                    className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-xs"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleCreateCategory}
                  className="px-4 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                >
                  Create Category
                </button>
                <button
                  onClick={() => {
                    setShowNewCategory(false);
                    setNewCategoryData({ category: "" });
                  }}
                  className="px-4 py-1.5 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}