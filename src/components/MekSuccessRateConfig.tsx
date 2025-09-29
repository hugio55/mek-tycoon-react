"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface SuccessRatePoint {
  rank: number;
  percentage: number;
}

interface ApplicationLog {
  timestamp: Date;
  curveType: string;
  minSuccess: number;
  maxSuccess: number;
  steepness: number;
  midPoint?: number;
}

export default function MekSuccessRateConfig() {
  // Total meks in the game
  const TOTAL_MEKS = 4000;

  // State for the curve configuration
  const [curvePoints, setCurvePoints] = useState<SuccessRatePoint[]>([]);
  const [curveType, setCurveType] = useState<'linear' | 'exponential' | 'logarithmic' | 'sigmoid'>('exponential');
  const [minSuccess, setMinSuccess] = useState(5);
  const [maxSuccess, setMaxSuccess] = useState(95);
  const [midPoint, setMidPoint] = useState(2000);
  const [steepness, setSteepness] = useState(1.5);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [applicationLogs, setApplicationLogs] = useState<ApplicationLog[]>([]);

  // Save/Load state
  const [saveName, setSaveName] = useState('');
  const [currentConfigId, setCurrentConfigId] = useState<Id<"mekSuccessRateSaves"> | null>(null);
  const [currentConfigName, setCurrentConfigName] = useState<string | null>(null);
  const [selectedSaveId, setSelectedSaveId] = useState<Id<"mekSuccessRateSaves"> | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);

  // Convex queries and mutations
  const savedConfigs = useQuery(api.mekSuccessRates.getAllSaves);
  const currentSave = useQuery(api.mekSuccessRates.getCurrentSave);
  const createSave = useMutation(api.mekSuccessRates.createSave);
  const updateSave = useMutation(api.mekSuccessRates.updateSave);
  const loadSave = useMutation(api.mekSuccessRates.loadSave);
  const deleteSave = useMutation(api.mekSuccessRates.deleteSave);

  // Load application logs from localStorage on mount
  useEffect(() => {
    const savedLogs = localStorage.getItem('mekSuccessRateLogs');
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

  // Auto-load the current active configuration when component mounts or when it changes
  useEffect(() => {
    if (currentSave) {
      setCurveType(currentSave.curveType);
      setMinSuccess(currentSave.minSuccess);
      setMaxSuccess(currentSave.maxSuccess);
      setSteepness(currentSave.steepness);
      setMidPoint(currentSave.midPoint);
      setCurrentConfigId(currentSave._id);
      setCurrentConfigName(currentSave.saveName);
    }
  }, [currentSave]);

  // Calculate success rate for a given rank based on curve type
  const calculateSuccessRate = useCallback((rank: number): number => {
    const normalizedRank = rank / TOTAL_MEKS; // 0 to 1
    let normalizedValue: number;

    switch (curveType) {
      case 'linear':
        normalizedValue = 1 - normalizedRank;
        break;
      case 'exponential':
        normalizedValue = Math.pow(1 - normalizedRank, steepness);
        break;
      case 'logarithmic':
        normalizedValue = normalizedRank === 0 ? 1 : Math.max(0, 1 + Math.log10(1 - normalizedRank + 0.1));
        break;
      case 'sigmoid':
        const x = (rank - midPoint) / (TOTAL_MEKS / 4);
        normalizedValue = 1 / (1 + Math.exp(steepness * x));
        break;
      default:
        normalizedValue = 1 - normalizedRank;
    }

    // Scale to min-max range and round to whole number
    const percentage = minSuccess + (normalizedValue * (maxSuccess - minSuccess));
    return Math.round(percentage); // Round to whole number
  }, [curveType, minSuccess, maxSuccess, midPoint, steepness]);

  // Generate preview points for the curve
  const generatePreviewPoints = (): SuccessRatePoint[] => {
    const points: SuccessRatePoint[] = [];
    const step = Math.floor(TOTAL_MEKS / 20); // 20 points for preview

    for (let i = 1; i <= TOTAL_MEKS; i += step) {
      points.push({
        rank: i,
        percentage: calculateSuccessRate(i)
      });
    }
    // Ensure we have the last point
    if (points[points.length - 1].rank !== TOTAL_MEKS) {
      points.push({
        rank: TOTAL_MEKS,
        percentage: calculateSuccessRate(TOTAL_MEKS)
      });
    }
    return points;
  };

  // Update curve points when parameters change
  useEffect(() => {
    setCurvePoints(generatePreviewPoints());
  }, [curveType, minSuccess, maxSuccess, midPoint, steepness]);

  const handleApplyCurve = () => {
    // Create a log entry
    const newLog: ApplicationLog = {
      timestamp: new Date(),
      curveType,
      minSuccess,
      maxSuccess,
      steepness,
      ...(curveType === 'sigmoid' && { midPoint })
    };

    // Add to logs
    const updatedLogs = [...applicationLogs, newLog];
    setApplicationLogs(updatedLogs);

    // Save to localStorage
    localStorage.setItem('mekSuccessRateLogs', JSON.stringify(updatedLogs));

    // If we have a current config, auto-update it
    if (currentConfigId) {
      handleUpdate();
    }

    console.log(`Applying success rate curve to all ${TOTAL_MEKS} Meks:`, {
      curveType,
      minSuccess,
      maxSuccess,
      steepness,
      ...(curveType === 'sigmoid' && { midPoint })
    });

    // Show confirmation
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
  };

  const handleSaveNew = async () => {
    if (!saveName.trim()) {
      alert('Please enter a name for the save');
      return;
    }

    try {
      const saveId = await createSave({
        saveName: saveName.trim(),
        curveType,
        minSuccess,
        maxSuccess,
        steepness,
        midPoint,
        totalMeks: TOTAL_MEKS,
      });

      setCurrentConfigId(saveId);
      setCurrentConfigName(saveName.trim());
      setShowSaveDialog(false);
      setSaveName('');
      alert(`Configuration saved as "${saveName.trim()}"`);
    } catch (error: any) {
      alert(error.message || 'Failed to save configuration');
    }
  };

  const handleUpdate = async () => {
    if (!currentConfigId) {
      alert('No configuration is currently loaded. Please save as a new configuration first.');
      return;
    }

    try {
      await updateSave({
        saveId: currentConfigId,
        curveType,
        minSuccess,
        maxSuccess,
        steepness,
        midPoint,
        totalMeks: TOTAL_MEKS,
      });
      alert(`Updated configuration: "${currentConfigName}"`);
    } catch (error) {
      alert('Failed to update configuration');
    }
  };

  const handleLoad = async () => {
    if (!selectedSaveId) {
      alert('Please select a save to load');
      return;
    }

    try {
      const result = await loadSave({ saveId: selectedSaveId });
      if (result) {
        setCurveType(result.curveType);
        setMinSuccess(result.minSuccess);
        setMaxSuccess(result.maxSuccess);
        setSteepness(result.steepness);
        setMidPoint(result.midPoint);
        setCurrentConfigId(result._id);
        setCurrentConfigName(result.saveName);
        setShowLoadDialog(false);
        setSelectedSaveId(null);
        alert(`Loaded configuration: "${result.saveName}"`);
      }
    } catch (error) {
      alert('Failed to load configuration');
    }
  };

  const handleDelete = async (saveId: Id<"mekSuccessRateSaves">) => {
    if (!confirm('Are you sure you want to delete this saved configuration?')) {
      return;
    }

    try {
      await deleteSave({ saveId });
      if (saveId === currentConfigId) {
        setCurrentConfigId(null);
        setCurrentConfigName(null);
      }
      alert('Configuration deleted');
    } catch (error) {
      alert('Failed to delete configuration');
    }
  };

  const presetCurves = [
    { name: 'Gentle Linear', type: 'linear' as const, min: 30, max: 70, steep: 1 },
    { name: 'Standard', type: 'exponential' as const, min: 10, max: 90, steep: 1.5 },
    { name: 'Harsh', type: 'exponential' as const, min: 5, max: 95, steep: 2 },
    { name: 'Balanced', type: 'sigmoid' as const, min: 15, max: 85, steep: 1.5 },
    { name: 'Top Heavy', type: 'logarithmic' as const, min: 20, max: 95, steep: 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Confirmation Message */}
      {showConfirmation && (
        <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 text-green-400 text-sm font-semibold">
          ✓ Success rate curve applied to all {TOTAL_MEKS} Meks successfully!
        </div>
      )}

      {/* Header */}
      <div>
        <h4 className="text-lg font-bold text-yellow-400 mb-2">Mek Base Success Rate Configuration</h4>
        <p className="text-sm text-gray-400">
          Set the base success percentage for each Mek based on their rarity rank (1 = most common, {TOTAL_MEKS} = rarest).
        </p>
        {currentConfigName && (
          <p className="text-xs text-green-400 mt-1">
            Currently loaded: <span className="font-bold">{currentConfigName}</span>
          </p>
        )}
      </div>

      {/* Save/Load/Update Controls */}
      <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowSaveDialog(true)}
            className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-blue-400 transition-colors"
          >
            Save As New
          </button>
          {currentConfigId && (
            <button
              onClick={handleUpdate}
              className="bg-green-500 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-green-400 transition-colors"
            >
              Update Current
            </button>
          )}
          <button
            onClick={() => setShowLoadDialog(true)}
            className="bg-purple-500 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-purple-400 transition-colors"
          >
            Load Configuration
          </button>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="bg-gray-900/95 border-2 border-yellow-500 rounded-lg p-4">
          <h5 className="text-sm font-bold text-yellow-400 mb-3">Save Configuration</h5>
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Enter configuration name"
            className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1.5 text-white text-sm mb-3"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSaveNew()}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveNew}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm font-bold hover:bg-green-400"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowSaveDialog(false);
                setSaveName('');
              }}
              className="bg-gray-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="bg-gray-900/95 border-2 border-yellow-500 rounded-lg p-4">
          <h5 className="text-sm font-bold text-yellow-400 mb-3">Load Configuration</h5>
          <div className="space-y-2 max-h-60 overflow-y-auto mb-3">
            {savedConfigs && savedConfigs.length > 0 ? (
              savedConfigs.map((save) => (
                <div
                  key={save._id}
                  onClick={() => setSelectedSaveId(save._id)}
                  className={`bg-black/50 rounded p-2 cursor-pointer transition-colors ${
                    selectedSaveId === save._id
                      ? 'border-2 border-yellow-500'
                      : 'border border-gray-700 hover:border-yellow-500/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-bold text-white">{save.saveName}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(save.timestamp).toLocaleDateString()} at{' '}
                        {new Date(save.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {save.curveType} | Min: {save.minSuccess}% | Max: {save.maxSuccess}%
                      </div>
                    </div>
                    {save.isCurrentConfig && (
                      <span className="text-xs text-green-400 font-bold">ACTIVE</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No saved configurations found</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleLoad}
              disabled={!selectedSaveId}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm font-bold hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Load
            </button>
            {selectedSaveId && (
              <button
                onClick={() => handleDelete(selectedSaveId)}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm font-bold hover:bg-red-400"
              >
                Delete
              </button>
            )}
            <button
              onClick={() => {
                setShowLoadDialog(false);
                setSelectedSaveId(null);
              }}
              className="bg-gray-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Curve Configuration */}
      <div className="space-y-4">
        {/* Top Row - Curve Type and Min/Max */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Curve Type */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Curve Type</label>
            <select
              value={curveType}
              onChange={(e) => setCurveType(e.target.value as typeof curveType)}
              className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1.5 text-white text-sm"
            >
              <option value="linear">Linear</option>
              <option value="exponential">Exponential</option>
              <option value="logarithmic">Logarithmic</option>
              <option value="sigmoid">Sigmoid (S-Curve)</option>
            </select>
          </div>

          {/* Min Success */}
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

          {/* Max Success */}
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
        </div>

        {/* Second Row - Parameters and Presets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column - Curve Parameters */}
          <div className="space-y-3">
            {curveType === 'sigmoid' && (
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Mid Point (Rank)</label>
                <input
                  type="number"
                  min="1"
                  max={TOTAL_MEKS}
                  value={midPoint}
                  onChange={(e) => setMidPoint(Number(e.target.value))}
                  className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1.5 text-white text-sm"
                />
                <span className="text-xs text-gray-500">Center of the S-curve</span>
              </div>
            )}

            {(curveType === 'exponential' || curveType === 'sigmoid') && (
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Steepness: {steepness}</label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={steepness}
                  onChange={(e) => setSteepness(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Gentle</span>
                  <span>Steep</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Preset Curves */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Preset Curves</label>
            <div className="grid grid-cols-2 gap-1.5">
              {presetCurves.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setCurveType(preset.type);
                    setMinSuccess(preset.min);
                    setMaxSuccess(preset.max);
                    setSteepness(preset.steep);
                  }}
                  className="bg-gray-800/50 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 hover:bg-gray-700/50 hover:border-yellow-500/50 transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApplyCurve}
          className="w-full bg-yellow-500 text-black font-bold px-3 py-1.5 rounded hover:bg-yellow-400 transition-colors text-sm"
        >
          Apply Success Rate Curve
        </button>

        {/* Sample Values and Application Logs */}
        <div className="space-y-4">
          {/* Sample Values */}
          <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-4">
            <h5 className="text-sm font-bold text-yellow-400 mb-3">Sample Success Rates</h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-gray-800/50 rounded px-2 py-1">
                <span className="text-gray-400">Rank 1:</span>
                <span className="text-green-400 ml-1 font-bold">{calculateSuccessRate(1)}%</span>
              </div>
              <div className="bg-gray-800/50 rounded px-2 py-1">
                <span className="text-gray-400">Rank 500:</span>
                <span className="text-yellow-400 ml-1 font-bold">{calculateSuccessRate(500)}%</span>
              </div>
              <div className="bg-gray-800/50 rounded px-2 py-1">
                <span className="text-gray-400">Rank 1000:</span>
                <span className="text-yellow-400 ml-1 font-bold">{calculateSuccessRate(1000)}%</span>
              </div>
              <div className="bg-gray-800/50 rounded px-2 py-1">
                <span className="text-gray-400">Rank 2000:</span>
                <span className="text-orange-400 ml-1 font-bold">{calculateSuccessRate(2000)}%</span>
              </div>
              <div className="bg-gray-800/50 rounded px-2 py-1">
                <span className="text-gray-400">Rank 3000:</span>
                <span className="text-orange-400 ml-1 font-bold">{calculateSuccessRate(3000)}%</span>
              </div>
              <div className="bg-gray-800/50 rounded px-2 py-1">
                <span className="text-gray-400">Rank 4000:</span>
                <span className="text-red-400 ml-1 font-bold">{calculateSuccessRate(4000)}%</span>
              </div>
            </div>
          </div>

          {/* Application History */}
          {applicationLogs.length > 0 && (
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
              <h5 className="text-sm font-bold text-gray-400 mb-3">Application History</h5>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {applicationLogs.slice().reverse().map((log, index) => (
                  <div key={index} className="bg-black/30 rounded px-3 py-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-gray-500">
                          {log.timestamp.toLocaleDateString()} at {log.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-yellow-400 capitalize">{log.curveType}</span>
                      </div>
                    </div>
                    <div className="mt-1 text-gray-400">
                      Min: {log.minSuccess}% | Max: {log.maxSuccess}% | Steepness: {log.steepness}
                      {log.midPoint && ` | MidPoint: ${log.midPoint}`}
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