"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface RatePoint {
  rank: number;
  value: number;
}

interface ApplicationLog {
  timestamp: Date;
  curveType: string;
  minValue: number;
  maxValue: number;
  steepness: number;
  midPoint?: number;
  configType: 'success' | 'gold';
}

export default function MekBaseConfig() {
  // Total meks in the game
  const TOTAL_MEKS = 4000;

  // State for active tab
  const [activeTab, setActiveTab] = useState<'success' | 'gold'>('success');

  // SUCCESS RATE CONFIGURATION STATE
  const [successCurveType, setSuccessCurveType] = useState<'linear' | 'exponential' | 'logarithmic' | 'sigmoid'>('exponential');
  const [minSuccess, setMinSuccess] = useState(5);
  const [maxSuccess, setMaxSuccess] = useState(95);
  const [successMidPoint, setSuccessMidPoint] = useState(2000);
  const [successSteepness, setSuccessSteepness] = useState(1.5);
  const [successRounding, setSuccessRounding] = useState<'whole' | '1decimal' | '2decimal' | 'none'>('whole');

  // Success save/load state
  const [successSaveName, setSuccessSaveName] = useState('');
  const [currentSuccessConfigId, setCurrentSuccessConfigId] = useState<Id<"mekSuccessRateSaves"> | null>(null);
  const [currentSuccessConfigName, setCurrentSuccessConfigName] = useState<string | null>(null);
  const [selectedSuccessSaveId, setSelectedSuccessSaveId] = useState<Id<"mekSuccessRateSaves"> | null>(null);
  const [showSuccessSaveDialog, setShowSuccessSaveDialog] = useState(false);
  const [showSuccessLoadDialog, setShowSuccessLoadDialog] = useState(false);

  // GOLD RATE CONFIGURATION STATE
  const [goldCurveType, setGoldCurveType] = useState<'linear' | 'exponential' | 'logarithmic' | 'sigmoid'>('exponential');
  const [minGold, setMinGold] = useState(1.0);
  const [maxGold, setMaxGold] = useState(100.0);
  const [goldMidPoint, setGoldMidPoint] = useState(2000);
  const [goldSteepness, setGoldSteepness] = useState(1.5);
  const [goldRounding, setGoldRounding] = useState<'whole' | '1decimal' | '2decimal' | 'none'>('2decimal');

  // Gold save/load state
  const [goldSaveName, setGoldSaveName] = useState('');
  const [currentGoldConfigId, setCurrentGoldConfigId] = useState<Id<"mekGoldRateSaves"> | null>(null);
  const [currentGoldConfigName, setCurrentGoldConfigName] = useState<string | null>(null);
  const [selectedGoldSaveId, setSelectedGoldSaveId] = useState<Id<"mekGoldRateSaves"> | null>(null);
  const [showGoldSaveDialog, setShowGoldSaveDialog] = useState(false);
  const [showGoldLoadDialog, setShowGoldLoadDialog] = useState(false);

  // Common state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [applicationLogs, setApplicationLogs] = useState<ApplicationLog[]>([]);

  // SUCCESS RATE CONVEX QUERIES AND MUTATIONS
  const savedSuccessConfigs = useQuery(api.mekSuccessRates.getAllSaves);
  const currentSuccessSave = useQuery(api.mekSuccessRates.getCurrentSave);
  const createSuccessSave = useMutation(api.mekSuccessRates.createSave);
  const updateSuccessSave = useMutation(api.mekSuccessRates.updateSave);
  const loadSuccessSave = useMutation(api.mekSuccessRates.loadSave);
  const deleteSuccessSave = useMutation(api.mekSuccessRates.deleteSave);

  // GOLD RATE CONVEX QUERIES AND MUTATIONS
  const savedGoldConfigs = useQuery(api.mekGoldRates.getAllSaves);
  const currentGoldSave = useQuery(api.mekGoldRates.getCurrentSave);
  const createGoldSave = useMutation(api.mekGoldRates.createSave);
  const updateGoldSave = useMutation(api.mekGoldRates.updateSave);
  const loadGoldSave = useMutation(api.mekGoldRates.loadSave);
  const deleteGoldSave = useMutation(api.mekGoldRates.deleteSave);

  // Load application logs from localStorage on mount
  useEffect(() => {
    const savedLogs = localStorage.getItem('mekBaseConfigLogs');
    if (savedLogs) {
      try {
        const parsed = JSON.parse(savedLogs);
        setApplicationLogs(parsed.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        })));
      } catch (e) {
        console.error('Failed to load application logs:', e);
      }
    }
  }, []);

  // Auto-load the current active SUCCESS configuration
  useEffect(() => {
    if (currentSuccessSave) {
      setSuccessCurveType(currentSuccessSave.curveType);
      setMinSuccess(currentSuccessSave.minSuccess);
      setMaxSuccess(currentSuccessSave.maxSuccess);
      setSuccessSteepness(currentSuccessSave.steepness);
      setSuccessMidPoint(currentSuccessSave.midPoint);
      setSuccessRounding(currentSuccessSave.rounding || 'whole');
      setCurrentSuccessConfigId(currentSuccessSave._id);
      setCurrentSuccessConfigName(currentSuccessSave.saveName);
    }
  }, [currentSuccessSave]);

  // Auto-load the current active GOLD configuration
  useEffect(() => {
    if (currentGoldSave) {
      setGoldCurveType(currentGoldSave.curveType);
      setMinGold(currentGoldSave.minGold);
      setMaxGold(currentGoldSave.maxGold);
      setGoldSteepness(currentGoldSave.steepness);
      setGoldMidPoint(currentGoldSave.midPoint);
      setGoldRounding(currentGoldSave.rounding || '2decimal');
      setCurrentGoldConfigId(currentGoldSave._id);
      setCurrentGoldConfigName(currentGoldSave.saveName);
    }
  }, [currentGoldSave]);

  // Helper function to apply rounding
  const applyRounding = (value: number, rounding: 'whole' | '1decimal' | '2decimal' | 'none'): number => {
    switch (rounding) {
      case 'whole':
        return Math.round(value);
      case '1decimal':
        return Math.round(value * 10) / 10;
      case '2decimal':
        return Math.round(value * 100) / 100;
      case 'none':
        return value;
      default:
        return Math.round(value);
    }
  };

  // Calculate success rate for a given rank
  const calculateSuccessRate = useCallback((rank: number): number => {
    const normalizedRank = rank / TOTAL_MEKS;
    let normalizedValue: number;

    switch (successCurveType) {
      case 'linear':
        normalizedValue = 1 - normalizedRank;
        break;
      case 'exponential':
        normalizedValue = Math.pow(1 - normalizedRank, successSteepness);
        break;
      case 'logarithmic':
        normalizedValue = normalizedRank === 0 ? 1 : Math.max(0, 1 + Math.log10(1 - normalizedRank + 0.1));
        break;
      case 'sigmoid':
        const x = (rank - successMidPoint) / (TOTAL_MEKS / 4);
        normalizedValue = 1 / (1 + Math.exp(successSteepness * x));
        break;
      default:
        normalizedValue = 1 - normalizedRank;
    }

    const percentage = minSuccess + (normalizedValue * (maxSuccess - minSuccess));
    return applyRounding(percentage, successRounding);
  }, [successCurveType, minSuccess, maxSuccess, successMidPoint, successSteepness, successRounding]);

  // Calculate gold rate for a given rank
  const calculateGoldRate = useCallback((rank: number): number => {
    const normalizedRank = rank / TOTAL_MEKS;
    let normalizedValue: number;

    switch (goldCurveType) {
      case 'linear':
        normalizedValue = 1 - normalizedRank;
        break;
      case 'exponential':
        normalizedValue = Math.pow(1 - normalizedRank, goldSteepness);
        break;
      case 'logarithmic':
        normalizedValue = normalizedRank === 0 ? 1 : Math.max(0, 1 + Math.log10(1 - normalizedRank + 0.1));
        break;
      case 'sigmoid':
        const x = (rank - goldMidPoint) / (TOTAL_MEKS / 4);
        normalizedValue = 1 / (1 + Math.exp(goldSteepness * x));
        break;
      default:
        normalizedValue = 1 - normalizedRank;
    }

    const goldRate = minGold + (normalizedValue * (maxGold - minGold));
    return applyRounding(goldRate, goldRounding);
  }, [goldCurveType, minGold, maxGold, goldMidPoint, goldSteepness, goldRounding]);

  // SUCCESS RATE HANDLERS
  const handleSuccessSaveNew = async () => {
    if (!successSaveName.trim()) {
      alert('Please enter a name for the save');
      return;
    }

    try {
      const saveId = await createSuccessSave({
        saveName: successSaveName.trim(),
        curveType: successCurveType,
        minSuccess,
        maxSuccess,
        steepness: successSteepness,
        midPoint: successMidPoint,
        totalMeks: TOTAL_MEKS,
        rounding: successRounding,
      });

      setCurrentSuccessConfigId(saveId);
      setCurrentSuccessConfigName(successSaveName.trim());
      setShowSuccessSaveDialog(false);
      setSuccessSaveName('');
      alert(`Success configuration saved as "${successSaveName.trim()}"`);
    } catch (error: any) {
      alert(error.message || 'Failed to save success configuration');
    }
  };

  const handleSuccessUpdate = async () => {
    if (!currentSuccessConfigId) {
      alert('No success configuration is currently loaded. Please save as a new configuration first.');
      return;
    }

    try {
      await updateSuccessSave({
        saveId: currentSuccessConfigId,
        curveType: successCurveType,
        minSuccess,
        maxSuccess,
        steepness: successSteepness,
        midPoint: successMidPoint,
        totalMeks: TOTAL_MEKS,
        rounding: successRounding,
      });
      alert(`Updated success configuration: "${currentSuccessConfigName}"`);
    } catch (error) {
      alert('Failed to update success configuration');
    }
  };

  const handleSuccessLoad = async () => {
    if (!selectedSuccessSaveId) {
      alert('Please select a save to load');
      return;
    }

    try {
      const result = await loadSuccessSave({ saveId: selectedSuccessSaveId });
      if (result) {
        setSuccessCurveType(result.curveType);
        setMinSuccess(result.minSuccess);
        setMaxSuccess(result.maxSuccess);
        setSuccessSteepness(result.steepness);
        setSuccessMidPoint(result.midPoint);
        setSuccessRounding(result.rounding || 'whole');
        setCurrentSuccessConfigId(result._id);
        setCurrentSuccessConfigName(result.saveName);
        setShowSuccessLoadDialog(false);
        setSelectedSuccessSaveId(null);
        alert(`Loaded success configuration: "${result.saveName}"`);
      }
    } catch (error) {
      alert('Failed to load success configuration');
    }
  };

  // GOLD RATE HANDLERS
  const handleGoldSaveNew = async () => {
    if (!goldSaveName.trim()) {
      alert('Please enter a name for the save');
      return;
    }

    try {
      const saveId = await createGoldSave({
        saveName: goldSaveName.trim(),
        curveType: goldCurveType,
        minGold,
        maxGold,
        steepness: goldSteepness,
        midPoint: goldMidPoint,
        totalMeks: TOTAL_MEKS,
        rounding: goldRounding,
      });

      setCurrentGoldConfigId(saveId);
      setCurrentGoldConfigName(goldSaveName.trim());
      setShowGoldSaveDialog(false);
      setGoldSaveName('');
      alert(`Gold rate configuration saved as "${goldSaveName.trim()}"`);
    } catch (error: any) {
      alert(error.message || 'Failed to save gold rate configuration');
    }
  };

  const handleGoldUpdate = async () => {
    if (!currentGoldConfigId) {
      alert('No gold rate configuration is currently loaded. Please save as a new configuration first.');
      return;
    }

    try {
      await updateGoldSave({
        saveId: currentGoldConfigId,
        curveType: goldCurveType,
        minGold,
        maxGold,
        steepness: goldSteepness,
        midPoint: goldMidPoint,
        totalMeks: TOTAL_MEKS,
        rounding: goldRounding,
      });
      alert(`Updated gold rate configuration: "${currentGoldConfigName}"`);
    } catch (error) {
      alert('Failed to update gold rate configuration');
    }
  };

  const handleGoldLoad = async () => {
    if (!selectedGoldSaveId) {
      alert('Please select a save to load');
      return;
    }

    try {
      const result = await loadGoldSave({ saveId: selectedGoldSaveId });
      if (result) {
        setGoldCurveType(result.curveType);
        setMinGold(result.minGold);
        setMaxGold(result.maxGold);
        setGoldSteepness(result.steepness);
        setGoldMidPoint(result.midPoint);
        setGoldRounding(result.rounding || '2decimal');
        setCurrentGoldConfigId(result._id);
        setCurrentGoldConfigName(result.saveName);
        setShowGoldLoadDialog(false);
        setSelectedGoldSaveId(null);
        alert(`Loaded gold rate configuration: "${result.saveName}"`);
      }
    } catch (error) {
      alert('Failed to load gold rate configuration');
    }
  };

  const handleApplyCurve = () => {
    const newLog: ApplicationLog = {
      timestamp: new Date(),
      curveType: activeTab === 'success' ? successCurveType : goldCurveType,
      minValue: activeTab === 'success' ? minSuccess : minGold,
      maxValue: activeTab === 'success' ? maxSuccess : maxGold,
      steepness: activeTab === 'success' ? successSteepness : goldSteepness,
      midPoint: activeTab === 'success' ? successMidPoint : goldMidPoint,
      configType: activeTab,
    };

    const updatedLogs = [...applicationLogs, newLog];
    setApplicationLogs(updatedLogs);
    localStorage.setItem('mekBaseConfigLogs', JSON.stringify(updatedLogs));

    // Auto-update current config if loaded
    if (activeTab === 'success' && currentSuccessConfigId) {
      handleSuccessUpdate();
    } else if (activeTab === 'gold' && currentGoldConfigId) {
      handleGoldUpdate();
    }

    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
  };

  const presetCurves = [
    { name: 'Gentle Linear', type: 'linear' as const, min: activeTab === 'success' ? 30 : 20, max: activeTab === 'success' ? 70 : 80, steep: 1 },
    { name: 'Standard', type: 'exponential' as const, min: activeTab === 'success' ? 10 : 5, max: activeTab === 'success' ? 90 : 95, steep: 1.5 },
    { name: 'Harsh', type: 'exponential' as const, min: activeTab === 'success' ? 5 : 1, max: activeTab === 'success' ? 95 : 100, steep: 2 },
    { name: 'Balanced', type: 'sigmoid' as const, min: activeTab === 'success' ? 15 : 10, max: activeTab === 'success' ? 85 : 90, steep: 1.5 },
    { name: 'Top Heavy', type: 'logarithmic' as const, min: activeTab === 'success' ? 20 : 15, max: activeTab === 'success' ? 95 : 100, steep: 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Confirmation Message */}
      {showConfirmation && (
        <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 text-green-400 text-sm font-semibold">
          ✓ {activeTab === 'success' ? 'Success' : 'Gold rate'} curve applied to all {TOTAL_MEKS} Meks successfully!
        </div>
      )}

      {/* Header */}
      <div>
        <h4 className="text-lg font-bold text-yellow-400 mb-2">Mek Base Configuration</h4>
        <p className="text-sm text-gray-400">
          Configure base success percentage and gold per hour for each Mek based on their rarity rank (1 = most common, {TOTAL_MEKS} = rarest).
        </p>
      </div>

      {/* Tab Selection */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('success')}
          className={`px-4 py-2 rounded font-bold text-sm transition-colors ${
            activeTab === 'success'
              ? 'bg-yellow-500 text-black'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Success Stats
        </button>
        <button
          onClick={() => setActiveTab('gold')}
          className={`px-4 py-2 rounded font-bold text-sm transition-colors ${
            activeTab === 'gold'
              ? 'bg-yellow-500 text-black'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Gold Per Hour
        </button>
      </div>

      {/* SUCCESS TAB */}
      {activeTab === 'success' && (
        <>
          {currentSuccessConfigName && (
            <p className="text-xs text-green-400">
              Currently loaded: <span className="font-bold">{currentSuccessConfigName}</span>
            </p>
          )}

          {/* Save/Load/Update Controls */}
          <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowSuccessSaveDialog(true)}
                className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-blue-400 transition-colors"
              >
                Save As New
              </button>
              {currentSuccessConfigId && (
                <button
                  onClick={handleSuccessUpdate}
                  className="bg-green-500 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-green-400 transition-colors"
                >
                  Update Current
                </button>
              )}
              <button
                onClick={() => setShowSuccessLoadDialog(true)}
                className="bg-purple-500 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-purple-400 transition-colors"
              >
                Load Configuration
              </button>
            </div>
          </div>

          {/* Success Rate Configuration */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Curve Type</label>
                <select
                  value={successCurveType}
                  onChange={(e) => setSuccessCurveType(e.target.value as typeof successCurveType)}
                  className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1.5 text-white text-sm"
                >
                  <option value="linear">Linear</option>
                  <option value="exponential">Exponential</option>
                  <option value="logarithmic">Logarithmic</option>
                  <option value="sigmoid">Sigmoid (S-Curve)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Min Success %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={minSuccess}
                  onChange={(e) => setMinSuccess(Number(e.target.value))}
                  className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1.5 text-white text-sm"
                />
                <span className="text-xs text-gray-500">Rarest</span>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Max Success %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={maxSuccess}
                  onChange={(e) => setMaxSuccess(Number(e.target.value))}
                  className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1.5 text-white text-sm"
                />
                <span className="text-xs text-gray-500">Common</span>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Rounding</label>
                <select
                  value={successRounding}
                  onChange={(e) => setSuccessRounding(e.target.value as typeof successRounding)}
                  className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1.5 text-white text-sm"
                >
                  <option value="whole">Whole Numbers</option>
                  <option value="1decimal">1 Decimal</option>
                  <option value="2decimal">2 Decimals</option>
                  <option value="none">No Rounding</option>
                </select>
              </div>
            </div>

            {/* Additional parameters */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                {successCurveType === 'sigmoid' && (
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Mid Point (Rank)</label>
                    <input
                      type="number"
                      min="1"
                      max={TOTAL_MEKS}
                      value={successMidPoint}
                      onChange={(e) => setSuccessMidPoint(Number(e.target.value))}
                      className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1.5 text-white text-sm"
                    />
                  </div>
                )}

                {(successCurveType === 'exponential' || successCurveType === 'sigmoid') && (
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Steepness: {successSteepness}</label>
                    <input
                      type="range"
                      min="0.5"
                      max="8"
                      step="0.1"
                      value={successSteepness}
                      onChange={(e) => setSuccessSteepness(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Preset Curves</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {presetCurves.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setSuccessCurveType(preset.type);
                        setMinSuccess(preset.min);
                        setMaxSuccess(preset.max);
                        setSuccessSteepness(preset.steep);
                      }}
                      className="bg-gray-800/50 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 hover:bg-gray-700/50 hover:border-yellow-500/50 transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sample Values */}
            <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-4">
              <h5 className="text-sm font-bold text-yellow-400 mb-3">Sample Success Rates</h5>
              <div className="space-y-1 text-xs max-w-xs">
                {[1, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000, 3200, 3400, 3600, 3800, 4000].map(rank => (
                  <div key={rank} className="bg-gray-800/50 rounded px-2 py-1">
                    <span className="text-gray-400">Rank {rank}: </span>
                    <span className="text-green-400 font-bold">{calculateSuccessRate(rank)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Save/Load Dialogs for Success */}
            {showSuccessSaveDialog && (
              <div className="bg-gray-900/95 border-2 border-yellow-500 rounded-lg p-4">
                <h5 className="text-sm font-bold text-yellow-400 mb-3">Save Success Configuration</h5>
                <input
                  type="text"
                  value={successSaveName}
                  onChange={(e) => setSuccessSaveName(e.target.value)}
                  placeholder="Enter configuration name"
                  className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1.5 text-white text-sm mb-3"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSuccessSaveNew()}
                />
                <div className="flex gap-2">
                  <button onClick={handleSuccessSaveNew} className="bg-green-500 text-white px-3 py-1 rounded text-sm font-bold">Save</button>
                  <button onClick={() => { setShowSuccessSaveDialog(false); setSuccessSaveName(''); }} className="bg-gray-600 text-white px-3 py-1 rounded text-sm font-bold">Cancel</button>
                </div>
              </div>
            )}

            {showSuccessLoadDialog && (
              <div className="bg-gray-900/95 border-2 border-yellow-500 rounded-lg p-4">
                <h5 className="text-sm font-bold text-yellow-400 mb-3">Load Success Configuration</h5>
                <div className="space-y-2 max-h-60 overflow-y-auto mb-3">
                  {savedSuccessConfigs?.map((save) => (
                    <div
                      key={save._id}
                      onClick={() => setSelectedSuccessSaveId(save._id)}
                      className={`bg-black/50 rounded p-2 cursor-pointer transition-colors ${
                        selectedSuccessSaveId === save._id ? 'border-2 border-yellow-500' : 'border border-gray-700'
                      }`}
                    >
                      <div className="text-sm font-bold">{save.saveName}</div>
                      <div className="text-xs text-gray-400">
                        {save.curveType} | Min: {save.minSuccess}% | Max: {save.maxSuccess}%
                      </div>
                      {save.isCurrentConfig && <span className="text-xs text-green-400">ACTIVE</span>}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSuccessLoad} className="bg-green-500 text-white px-3 py-1 rounded text-sm font-bold">Load</button>
                  {selectedSuccessSaveId && (
                    <button onClick={() => deleteSuccessSave({ saveId: selectedSuccessSaveId })} className="bg-red-500 text-white px-3 py-1 rounded text-sm font-bold">Delete</button>
                  )}
                  <button onClick={() => { setShowSuccessLoadDialog(false); setSelectedSuccessSaveId(null); }} className="bg-gray-600 text-white px-3 py-1 rounded text-sm font-bold">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* GOLD TAB */}
      {activeTab === 'gold' && (
        <>
          {currentGoldConfigName && (
            <p className="text-xs text-green-400">
              Currently loaded: <span className="font-bold">{currentGoldConfigName}</span>
            </p>
          )}

          {/* Save/Load/Update Controls */}
          <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowGoldSaveDialog(true)}
                className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-blue-400 transition-colors"
              >
                Save As New
              </button>
              {currentGoldConfigId && (
                <button
                  onClick={handleGoldUpdate}
                  className="bg-green-500 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-green-400 transition-colors"
                >
                  Update Current
                </button>
              )}
              <button
                onClick={() => setShowGoldLoadDialog(true)}
                className="bg-purple-500 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-purple-400 transition-colors"
              >
                Load Configuration
              </button>
            </div>
          </div>

          {/* Gold Rate Configuration */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Curve Type</label>
                <select
                  value={goldCurveType}
                  onChange={(e) => setGoldCurveType(e.target.value as typeof goldCurveType)}
                  className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1.5 text-white text-sm"
                >
                  <option value="linear">Linear</option>
                  <option value="exponential">Exponential</option>
                  <option value="logarithmic">Logarithmic</option>
                  <option value="sigmoid">Sigmoid (S-Curve)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Min Gold/Hour</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={minGold}
                  onChange={(e) => setMinGold(Number(e.target.value))}
                  className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1.5 text-white text-sm"
                />
                <span className="text-xs text-gray-500">Rarest</span>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Max Gold/Hour</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={maxGold}
                  onChange={(e) => setMaxGold(Number(e.target.value))}
                  className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1.5 text-white text-sm"
                />
                <span className="text-xs text-gray-500">Common</span>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Rounding</label>
                <select
                  value={goldRounding}
                  onChange={(e) => setGoldRounding(e.target.value as typeof goldRounding)}
                  className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1.5 text-white text-sm"
                >
                  <option value="whole">Whole Numbers</option>
                  <option value="1decimal">1 Decimal</option>
                  <option value="2decimal">2 Decimals</option>
                  <option value="none">No Rounding</option>
                </select>
              </div>
            </div>

            {/* Additional parameters */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                {goldCurveType === 'sigmoid' && (
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Mid Point (Rank)</label>
                    <input
                      type="number"
                      min="1"
                      max={TOTAL_MEKS}
                      value={goldMidPoint}
                      onChange={(e) => setGoldMidPoint(Number(e.target.value))}
                      className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1.5 text-white text-sm"
                    />
                  </div>
                )}

                {(goldCurveType === 'exponential' || goldCurveType === 'sigmoid') && (
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Steepness: {goldSteepness}</label>
                    <input
                      type="range"
                      min="0.5"
                      max="8"
                      step="0.1"
                      value={goldSteepness}
                      onChange={(e) => setGoldSteepness(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Preset Curves</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {presetCurves.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setGoldCurveType(preset.type);
                        setMinGold(preset.min);
                        setMaxGold(preset.max);
                        setGoldSteepness(preset.steep);
                      }}
                      className="bg-gray-800/50 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 hover:bg-gray-700/50 hover:border-yellow-500/50 transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sample Values */}
            <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-4">
              <h5 className="text-sm font-bold text-yellow-400 mb-3">Sample Gold Rates</h5>
              <div className="space-y-1 text-xs max-w-xs">
                {[1, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000, 3200, 3400, 3600, 3800, 4000].map(rank => (
                  <div key={rank} className="bg-gray-800/50 rounded px-2 py-1">
                    <span className="text-gray-400">Rank {rank}: </span>
                    <span className="text-yellow-400 font-bold">{calculateGoldRate(rank)} gold/hr</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Save/Load Dialogs for Gold */}
            {showGoldSaveDialog && (
              <div className="bg-gray-900/95 border-2 border-yellow-500 rounded-lg p-4">
                <h5 className="text-sm font-bold text-yellow-400 mb-3">Save Gold Rate Configuration</h5>
                <input
                  type="text"
                  value={goldSaveName}
                  onChange={(e) => setGoldSaveName(e.target.value)}
                  placeholder="Enter configuration name"
                  className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1.5 text-white text-sm mb-3"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleGoldSaveNew()}
                />
                <div className="flex gap-2">
                  <button onClick={handleGoldSaveNew} className="bg-green-500 text-white px-3 py-1 rounded text-sm font-bold">Save</button>
                  <button onClick={() => { setShowGoldSaveDialog(false); setGoldSaveName(''); }} className="bg-gray-600 text-white px-3 py-1 rounded text-sm font-bold">Cancel</button>
                </div>
              </div>
            )}

            {showGoldLoadDialog && (
              <div className="bg-gray-900/95 border-2 border-yellow-500 rounded-lg p-4">
                <h5 className="text-sm font-bold text-yellow-400 mb-3">Load Gold Rate Configuration</h5>
                <div className="space-y-2 max-h-60 overflow-y-auto mb-3">
                  {savedGoldConfigs?.map((save) => (
                    <div
                      key={save._id}
                      onClick={() => setSelectedGoldSaveId(save._id)}
                      className={`bg-black/50 rounded p-2 cursor-pointer transition-colors ${
                        selectedGoldSaveId === save._id ? 'border-2 border-yellow-500' : 'border border-gray-700'
                      }`}
                    >
                      <div className="text-sm font-bold">{save.saveName}</div>
                      <div className="text-xs text-gray-400">
                        {save.curveType} | Min: {save.minGold} | Max: {save.maxGold} gold/hr
                      </div>
                      {save.isCurrentConfig && <span className="text-xs text-green-400">ACTIVE</span>}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleGoldLoad} className="bg-green-500 text-white px-3 py-1 rounded text-sm font-bold">Load</button>
                  {selectedGoldSaveId && (
                    <button onClick={() => deleteGoldSave({ saveId: selectedGoldSaveId })} className="bg-red-500 text-white px-3 py-1 rounded text-sm font-bold">Delete</button>
                  )}
                  <button onClick={() => { setShowGoldLoadDialog(false); setSelectedGoldSaveId(null); }} className="bg-gray-600 text-white px-3 py-1 rounded text-sm font-bold">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Apply Button */}
      <button
        onClick={handleApplyCurve}
        className="w-full bg-yellow-500 text-black font-bold px-3 py-1.5 rounded hover:bg-yellow-400 transition-colors text-sm"
      >
        Apply {activeTab === 'success' ? 'Success' : 'Gold Rate'} Curve
      </button>

      {/* Application History */}
      {applicationLogs.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
          <h5 className="text-sm font-bold text-gray-400 mb-3">Application History</h5>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {applicationLogs.slice().reverse().map((log, index) => (
              <div key={index} className="bg-black/30 rounded px-3 py-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    {log.timestamp.toLocaleDateString()} at {log.timestamp.toLocaleTimeString()}
                  </span>
                  <span className={`font-bold ${log.configType === 'success' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {log.configType === 'success' ? 'Success' : 'Gold'} | {log.curveType}
                  </span>
                </div>
                <div className="mt-1 text-gray-400">
                  Min: {log.minValue}{log.configType === 'success' ? '%' : ' gold/hr'} |
                  Max: {log.maxValue}{log.configType === 'success' ? '%' : ' gold/hr'} |
                  Steepness: {log.steepness}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}