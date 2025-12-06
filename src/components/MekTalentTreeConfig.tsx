"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Rarity rank ranges for the 6 tiers
const RARITY_TIERS = [
  { label: "Common (2001-4000)", min: 2001, max: 4000, color: "text-gray-400" },
  { label: "Uncommon (1001-2000)", min: 1001, max: 2000, color: "text-green-400" },
  { label: "Rare (251-1000)", min: 251, max: 1000, color: "text-blue-400" },
  { label: "Epic (101-250)", min: 101, max: 250, color: "text-purple-400" },
  { label: "Legendary (11-100)", min: 11, max: 100, color: "text-orange-400" },
  { label: "God Tier (1-10)", min: 1, max: 10, color: "text-yellow-400" },
];

// Talent tree tiers (T1-T10)
const TALENT_TIERS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10"];

// Official buff categories from the game's categories pool
const BUFF_CATEGORIES_BY_TYPE = {
  gold: [
    "Flat Gold",
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
    "XP Per Fight",
    "CircuTree XP Cost Reduction %",
    "Scrapyard XP Reward Increase",
  ],
  mek_slot: [
    "Mek Slot Increase",
  ],
};

// Flatten all categories for easy dropdown
const ALL_BUFF_CATEGORIES = Object.values(BUFF_CATEGORIES_BY_TYPE).flat();

interface TableData {
  [category: string]: {
    [rankRange: string]: {
      [talentTier: string]: {
        value: number;
        editing?: boolean;
        tempValue?: string;
      };
    };
  };
}

function interpolateValues(
  start: number,
  end: number,
  steps: number,
  curve: "linear" | "exponential" | "logarithmic" = "linear",
  strength: number = 1 // 0-1 strength slider
): number[] {
  if (steps === 1) return [start];

  const values: number[] = [];

  for (let i = 0; i < steps; i++) {
    let value: number;
    const ratio = i / (steps - 1);

    switch (curve) {
      case "exponential":
        // Exponential curve - faster growth at the end
        const expRatio = Math.pow(ratio, 1 + strength); // strength affects curve steepness
        value = start + (end - start) * expRatio;
        break;
      case "logarithmic":
        // Logarithmic curve - faster growth at the beginning
        const logBase = 1 + 9 * strength; // strength affects curve steepness
        const logRatio = Math.log(1 + ratio * (logBase - 1)) / Math.log(logBase);
        value = start + (end - start) * logRatio;
        break;
      default:
        // Linear interpolation (strength has no effect on linear)
        value = start + (end - start) * ratio;
    }

    values.push(value);
  }

  return values;
}

function applyRounding(value: number, roundingMode: string): number {
  switch (roundingMode) {
    case "0.001": return Math.round(value * 1000) / 1000;
    case "0.01": return Math.round(value * 100) / 100;
    case "0.1": return Math.round(value * 10) / 10;
    case "1": return Math.round(value);
    case "5": return Math.round(value / 5) * 5;
    case "10": return Math.round(value / 10) * 10;
    case "25": return Math.round(value / 25) * 25;
    case "50": return Math.round(value / 50) * 50;
    case "100": return Math.round(value / 100) * 100;
    default: return value;
  }
}

export default function MekTalentTreeConfig() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Flat Gold");
  const [editMode, setEditMode] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [tableData, setTableData] = useState<TableData>({});
  const [localValues, setLocalValues] = useState<{
    [category: string]: { [key: string]: number };
  }>({});

  // Interpolation settings
  const [interpolationCurve, setInterpolationCurve] = useState<"linear" | "exponential" | "logarithmic">("linear");
  const [interpolationDirection, setInterpolationDirection] = useState<"vertical" | "horizontal">("vertical");
  const [interpolationStrength, setInterpolationStrength] = useState(0.5); // 0-1 slider
  const [roundingMode, setRoundingMode] = useState("0.01");

  // Corner values for simple interpolation
  const [commonT1, setCommonT1] = useState("50");
  const [godT1, setGodT1] = useState("1000");
  const [commonT10, setCommonT10] = useState("500");
  const [godT10, setGodT10] = useState("2800");
  const [t1CurveStrength, setT1CurveStrength] = useState(0.5); // Curve for T1 column
  const [t10CurveStrength, setT10CurveStrength] = useState(0.5); // Curve for T10 column
  const [tableInitialized, setTableInitialized] = useState(false); // Track if table has been filled at least once

  // Save/Load system
  const [saveLoadMode, setSaveLoadMode] = useState<"none" | "save" | "load">("none");
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [selectedSaveId, setSelectedSaveId] = useState<Id<"mekTreeTableSaves"> | null>(null);
  const [currentConfigId, setCurrentConfigId] = useState<Id<"mekTreeTableSaves"> | null>(null);
  const [currentConfigName, setCurrentConfigName] = useState<string>("");

  // Query existing data from Convex
  const existingData = useQuery(api.mekTreeTables.getTableData);
  const saveTableData = useMutation(api.mekTreeTables.saveTableData);

  // Save/Load queries and mutations
  const savedConfigs = useQuery(api.mekTreeTableSaves.getSaves);
  const createSave = useMutation(api.mekTreeTableSaves.createSave);
  const updateSave = useMutation(api.mekTreeTableSaves.updateSave);
  const loadSave = useMutation(api.mekTreeTableSaves.loadSaveIntoTable);
  const deleteSave = useMutation(api.mekTreeTableSaves.deleteSave);

  // Load current config from localStorage on mount
  useEffect(() => {
    const savedConfigId = localStorage.getItem('currentConfigId');
    const savedConfigName = localStorage.getItem('currentConfigName');
    if (savedConfigId) {
      setCurrentConfigId(savedConfigId as Id<"mekTreeTableSaves">);
    }
    if (savedConfigName) {
      setCurrentConfigName(savedConfigName);
    }
  }, []);

  // Save current config to localStorage when it changes
  useEffect(() => {
    if (currentConfigId) {
      localStorage.setItem('currentConfigId', currentConfigId);
    } else {
      localStorage.removeItem('currentConfigId');
    }
    if (currentConfigName) {
      localStorage.setItem('currentConfigName', currentConfigName);
    } else {
      localStorage.removeItem('currentConfigName');
    }
  }, [currentConfigId, currentConfigName]);

  // Initialize table data on mount or when existingData changes
  useEffect(() => {
    const initialData: TableData = {};

    ALL_BUFF_CATEGORIES.forEach((category) => {
      initialData[category] = {};
      RARITY_TIERS.forEach((tier) => {
        const rankKey = `${tier.min}-${tier.max}`;
        initialData[category][rankKey] = {};
        TALENT_TIERS.forEach((talentTier) => {
          // Check if we have existing data for this category, rank range, and talent tier
          const existingValue = existingData?.find(
            d => d.category === category &&
                d.rankRange === rankKey &&
                d.talentTier === talentTier
          );
          initialData[category][rankKey][talentTier] = {
            value: existingValue?.value || 0,
            editing: false,
          };
        });
      });
    });

    setTableData(initialData);
  }, [existingData]);

  // Live update when curve sliders or corner values change
  useEffect(() => {
    if (tableInitialized) {
      handleFillTable();
    }
  }, [t1CurveStrength, t10CurveStrength, commonT1, godT1, commonT10, godT10, roundingMode]);


  const handleCellClick = (category: string, rankRange: string, talentTier: string) => {
    if (!editMode) return;

    setTableData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [rankRange]: {
          ...prev[category][rankRange],
          [talentTier]: {
            ...prev[category][rankRange][talentTier],
            editing: true,
            tempValue: prev[category][rankRange][talentTier].value.toString(),
          },
        },
      },
    }));
  };

  const handleCellChange = (
    category: string,
    rankRange: string,
    talentTier: string,
    value: string
  ) => {
    setTableData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [rankRange]: {
          ...prev[category][rankRange],
          [talentTier]: {
            ...prev[category][rankRange][talentTier],
            tempValue: value,
          },
        },
      },
    }));
  };

  const handleCellBlur = (category: string, rankRange: string, talentTier: string) => {
    const tempValue = tableData[category][rankRange][talentTier].tempValue || "0";
    const numValue = applyRounding(parseFloat(tempValue) || 0, roundingMode);

    setTableData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [rankRange]: {
          ...prev[category][rankRange],
          [talentTier]: {
            value: numValue,
            editing: false,
          },
        },
      },
    }));

    const key = `${rankRange}_${talentTier}`;
    setLocalValues(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: numValue,
      },
    }));
  };

  const handleInterpolate = () => {
    const currentCategoryData = tableData[selectedCategory];

    if (interpolationDirection === "vertical") {
      // Interpolate vertically (across rank ranges for each talent tier)
      TALENT_TIERS.forEach((talentTier: any) => {
        const firstRankRange = `${RARITY_TIERS[0].min}-${RARITY_TIERS[0].max}`;
        const lastRankRange = `${RARITY_TIERS[RARITY_TIERS.length - 1].min}-${RARITY_TIERS[RARITY_TIERS.length - 1].max}`;

        const startValue = currentCategoryData[firstRankRange][talentTier].value;
        const endValue = currentCategoryData[lastRankRange][talentTier].value;

        // Skip if both values are 0
        if (startValue === 0 && endValue === 0) return;

        const interpolatedValues = interpolateValues(startValue, endValue, RARITY_TIERS.length, interpolationCurve, interpolationStrength)
          .map((v: any) => applyRounding(v, roundingMode));

        RARITY_TIERS.forEach((tier, index) => {
          const rankKey = `${tier.min}-${tier.max}`;
          setTableData(prev => ({
            ...prev,
            [selectedCategory]: {
              ...prev[selectedCategory],
              [rankKey]: {
                ...prev[selectedCategory][rankKey],
                [talentTier]: {
                  value: interpolatedValues[index],
                  editing: false,
                },
              },
            },
          }));

          const key = `${rankKey}_${talentTier}`;
          setLocalValues(prev => ({
            ...prev,
            [selectedCategory]: {
              ...prev[selectedCategory],
              [key]: interpolatedValues[index],
            },
          }));
        });
      });
    } else {
      // Interpolate horizontally (across talent tiers for each rank range)
      RARITY_TIERS.forEach((tier: any) => {
        const rankKey = `${tier.min}-${tier.max}`;
        const firstTalent = "T1";
        const lastTalent = "T10";

        const startValue = currentCategoryData[rankKey][firstTalent].value;
        const endValue = currentCategoryData[rankKey][lastTalent].value;

        // Skip if both values are 0
        if (startValue === 0 && endValue === 0) return;

        const interpolatedValues = interpolateValues(startValue, endValue, TALENT_TIERS.length, interpolationCurve, interpolationStrength)
          .map((v: any) => applyRounding(v, roundingMode));

        TALENT_TIERS.forEach((talentTier, index) => {
          setTableData(prev => ({
            ...prev,
            [selectedCategory]: {
              ...prev[selectedCategory],
              [rankKey]: {
                ...prev[selectedCategory][rankKey],
                [talentTier]: {
                  value: interpolatedValues[index],
                  editing: false,
                },
              },
            },
          }));

          const key = `${rankKey}_${talentTier}`;
          setLocalValues(prev => ({
            ...prev,
            [selectedCategory]: {
              ...prev[selectedCategory],
              [key]: interpolatedValues[index],
            },
          }));
        });
      });
    }
  };

  const handlePaste = () => {
    try {
      const lines = pasteText.trim().split('\n');
      const dataRows = lines.slice(1); // Skip header row if present

      if (dataRows.length !== RARITY_TIERS.length) {
        alert(`Expected ${RARITY_TIERS.length} rows, but got ${dataRows.length}`);
        return;
      }

      dataRows.forEach((line, rowIndex) => {
        const values = line.split('\t');
        const rankRange = `${RARITY_TIERS[rowIndex].min}-${RARITY_TIERS[rowIndex].max}`;

        // Start from index 1 to skip the rank label column
        for (let i = 1; i <= TALENT_TIERS.length && i < values.length; i++) {
          const talentTier = TALENT_TIERS[i - 1];
          const value = parseFloat(values[i]) || 0;

          setTableData(prev => ({
            ...prev,
            [selectedCategory]: {
              ...prev[selectedCategory],
              [rankRange]: {
                ...prev[selectedCategory][rankRange],
                [talentTier]: {
                  value: value,
                  editing: false,
                },
              },
            },
          }));

          const key = `${rankRange}_${talentTier}`;
          setLocalValues(prev => ({
            ...prev,
            [selectedCategory]: {
              ...prev[selectedCategory],
              [key]: value,
            },
          }));
        }
      });

      setPasteMode(false);
      setPasteText("");
    } catch (error) {
      alert("Failed to parse pasted data. Make sure it's in the correct format.");
    }
  };

  const handleExportCSV = () => {
    let csv = `Rank Range,${TALENT_TIERS.join(',')}\n`;

    RARITY_TIERS.forEach((tier: any) => {
      const rankKey = `${tier.min}-${tier.max}`;
      const values = TALENT_TIERS.map((talentTier: any) =>
        tableData[selectedCategory]?.[rankKey]?.[talentTier]?.value || 0
      );
      csv += `"${tier.label}",${values.join(',')}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCategory.replace(/\s+/g, '_')}_talent_tree.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFillTable = () => {
    // Parse corner values
    const cT1 = parseFloat(commonT1) || 50;
    const gT1 = parseFloat(godT1) || 1000;
    const cT10 = parseFloat(commonT10) || 500;
    const gT10 = parseFloat(godT10) || 2800;

    // Step 1: Calculate T1 column values using curve
    const t1Values: number[] = [];
    for (let i = 0; i < RARITY_TIERS.length; i++) {
      const ratio = i / (RARITY_TIERS.length - 1);
      // Apply curve strength to the interpolation
      const curvedRatio = Math.pow(ratio, Math.pow(2, t1CurveStrength * 2 - 1));
      const t1Value = cT1 + (gT1 - cT1) * curvedRatio;
      t1Values.push(applyRounding(t1Value, roundingMode));
    }

    // Step 2: Calculate T10 column values using curve
    const t10Values: number[] = [];
    for (let i = 0; i < RARITY_TIERS.length; i++) {
      const ratio = i / (RARITY_TIERS.length - 1);
      // Apply curve strength to the interpolation
      const curvedRatio = Math.pow(ratio, Math.pow(2, t10CurveStrength * 2 - 1));
      const t10Value = cT10 + (gT10 - cT10) * curvedRatio;
      t10Values.push(applyRounding(t10Value, roundingMode));
    }

    // Step 3: Fill in the entire table by interpolating between T1 and T10 for each row
    const updatedTableData = { ...tableData };
    const updatedLocalValues = { ...localValues[selectedCategory] || {} };

    RARITY_TIERS.forEach((tier, tierIndex) => {
      const rankKey = `${tier.min}-${tier.max}`;

      // Ensure the structure exists
      if (!updatedTableData[selectedCategory]) {
        updatedTableData[selectedCategory] = {};
      }
      if (!updatedTableData[selectedCategory][rankKey]) {
        updatedTableData[selectedCategory][rankKey] = {};
      }

      // For each talent tier, interpolate between T1 and T10 values for this rarity
      const startValue = t1Values[tierIndex];
      const endValue = t10Values[tierIndex];

      TALENT_TIERS.forEach((talentTier, talentIndex) => {
        const ratio = talentIndex / (TALENT_TIERS.length - 1);
        // Use a slight exponential curve for talent tier progression
        const curvedRatio = Math.pow(ratio, 1.3);
        const value = startValue + (endValue - startValue) * curvedRatio;

        updatedTableData[selectedCategory][rankKey][talentTier] = {
          value: applyRounding(value, roundingMode),
          editing: false,
        };

        updatedLocalValues[`${rankKey}_${talentTier}`] = applyRounding(value, roundingMode);
      });
    });

    setTableData(updatedTableData);
    setLocalValues(prev => ({
      ...prev,
      [selectedCategory]: updatedLocalValues,
    }));

    // Mark table as initialized for live updates
    if (!tableInitialized) {
      setTableInitialized(true);
    }
  };

  const handleReset = () => {
    // Reset the current category's data
    setTableData(prev => {
      const updated = { ...prev };
      if (updated[selectedCategory]) {
        RARITY_TIERS.forEach((tier: any) => {
          const rankKey = `${tier.min}-${tier.max}`;
          if (updated[selectedCategory][rankKey]) {
            TALENT_TIERS.forEach((talentTier: any) => {
              updated[selectedCategory][rankKey][talentTier] = {
                value: 0,
                editing: false,
              };
            });
          }
        });
      }
      return updated;
    });

    setLocalValues(prev => ({
      ...prev,
      [selectedCategory]: {},
    }));

    // Reset initialization flag
    setTableInitialized(false);
  };

  const handleSaveConfig = async () => {
    const dataToSave: Array<{
      category: string;
      rankRange: string;
      talentTier: string;
      value: number;
    }> = [];

    // Collect all current table data
    ALL_BUFF_CATEGORIES.forEach((category: any) => {
      RARITY_TIERS.forEach((tier: any) => {
        const rankKey = `${tier.min}-${tier.max}`;
        TALENT_TIERS.forEach((talentTier: any) => {
          const value = tableData[category]?.[rankKey]?.[talentTier]?.value || 0;
          if (value !== 0) {
            dataToSave.push({
              category,
              rankRange: rankKey,
              talentTier,
              value,
            });
          }
        });
      });
    });

    try {
      const newSaveId = await createSave({
        saveName,
        description: saveDescription,
        data: dataToSave,
      });
      // Set this as the current config
      setCurrentConfigId(newSaveId);
      setCurrentConfigName(saveName);
      alert(`Configuration saved as "${saveName}"`);
      setSaveLoadMode("none");
      setSaveName("");
      setSaveDescription("");
    } catch (error: any) {
      alert(error.message || "Failed to save configuration");
    }
  };

  const handleUpdateConfig = async () => {
    if (!currentConfigId) {
      alert("No configuration is currently loaded. Please save as a new configuration first.");
      return;
    }

    const dataToSave: Array<{
      category: string;
      rankRange: string;
      talentTier: string;
      value: number;
    }> = [];

    // Collect all current table data
    ALL_BUFF_CATEGORIES.forEach((category: any) => {
      RARITY_TIERS.forEach((tier: any) => {
        const rankKey = `${tier.min}-${tier.max}`;
        TALENT_TIERS.forEach((talentTier: any) => {
          const value = tableData[category]?.[rankKey]?.[talentTier]?.value || 0;
          if (value !== 0) {
            dataToSave.push({
              category,
              rankRange: rankKey,
              talentTier,
              value,
            });
          }
        });
      });
    });

    try {
      await updateSave({
        saveId: currentConfigId,
        data: dataToSave,
      });
      alert(`Updated configuration: "${currentConfigName}"`);
    } catch (error) {
      alert("Failed to update configuration");
    }
  };

  const handleLoadConfig = async () => {
    if (!selectedSaveId) {
      alert("Please select a save to load");
      return;
    }

    try {
      const result = await loadSave({ saveId: selectedSaveId });
      // Set the current config tracking
      setCurrentConfigId(selectedSaveId);
      const selectedSave = savedConfigs?.find((s: any) => s._id === selectedSaveId);
      if (selectedSave) {
        setCurrentConfigName(selectedSave.saveName);
      }
      alert(`Loaded configuration: ${result.saveName}`);
      setSaveLoadMode("none");
      setSelectedSaveId(null);
      // Refresh the page data
      window.location.reload();
    } catch (error) {
      alert("Failed to load configuration");
    }
  };

  const handleDeleteConfig = async (saveId: Id<"mekTreeTableSaves">) => {
    if (!confirm("Are you sure you want to delete this saved configuration?")) {
      return;
    }

    try {
      await deleteSave({ saveId });
      alert("Configuration deleted");
    } catch (error) {
      alert("Failed to delete configuration");
    }
  };

  const handleSave = async () => {
    const dataToSave: Array<{
      category: string;
      rankRange: string;
      talentTier: string;
      value: number;
    }> = [];

    Object.entries(localValues).forEach(([category, data]) => {
      Object.entries(data).forEach(([key, value]) => {
        const [rankRange, talentTier] = key.split('_');
        if (rankRange && talentTier) {
          dataToSave.push({
            category,
            rankRange,
            talentTier,
            value,
          });
        }
      });
    });

    if (dataToSave.length > 0) {
      await saveTableData({ data: dataToSave });
      alert("Data saved successfully!");
    }
  };

  const getCategoryTypeColor = (category: string) => {
    if (BUFF_CATEGORIES_BY_TYPE.gold.includes(category)) return "text-yellow-400";
    if (BUFF_CATEGORIES_BY_TYPE.essence.includes(category)) return "text-purple-400";
    if (BUFF_CATEGORIES_BY_TYPE.market.includes(category)) return "text-blue-400";
    if (BUFF_CATEGORIES_BY_TYPE.reward_chance.includes(category)) return "text-green-400";
    if (BUFF_CATEGORIES_BY_TYPE.rarity_bias.includes(category)) return "text-orange-400";
    if (BUFF_CATEGORIES_BY_TYPE.xp.includes(category)) return "text-cyan-400";
    if (BUFF_CATEGORIES_BY_TYPE.mek_slot.includes(category)) return "text-pink-400";
    return "text-gray-400";
  };

  return (
    <div className="w-full">
      {/* Header Controls */}
      <div className="bg-black/60 rounded-lg p-4 mb-4 border border-gray-700">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          {/* Category Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm font-bold ${getCategoryTypeColor(selectedCategory)}`}
            >
              {Object.entries(BUFF_CATEGORIES_BY_TYPE).map(([type, categories]) => (
                <optgroup key={type} label={type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Rounding Control */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Round to:</label>
            <select
              value={roundingMode}
              onChange={(e) => setRoundingMode(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-300"
            >
              <option value="0.001">0.001</option>
              <option value="0.01">0.01</option>
              <option value="0.1">0.1</option>
              <option value="1">1</option>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          {/* Mode Toggles */}
          <div className="flex gap-2">
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-3 py-1 rounded text-sm font-bold transition-all ${
                editMode
                  ? "bg-yellow-600 text-black"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setPasteMode(!pasteMode)}
              className={`px-3 py-1 rounded text-sm font-bold transition-all ${
                pasteMode
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Paste
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm font-bold transition-all"
            >
              Export CSV
            </button>
          </div>

          {/* Save/Load Controls */}
          <div className="flex gap-2 items-center">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-bold transition-all"
            >
              Update DB
            </button>
            <div className="border-l border-gray-600 h-6 mx-1" />
            <button
              onClick={() => setSaveLoadMode("save")}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm font-bold transition-all"
            >
              Save Config
            </button>
            {currentConfigId && (
              <button
                onClick={handleUpdateConfig}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-sm font-bold transition-all"
                title={`Update current config: ${currentConfigName}`}
              >
                Update Config
              </button>
            )}
            <button
              onClick={() => setSaveLoadMode("load")}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-bold transition-all"
            >
              Load Config
            </button>
          </div>
        </div>

        {/* Current Configuration Display */}
        {currentConfigName && (
          <div className="mt-2 px-3 py-2 bg-amber-900/20 border border-amber-600/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-400 font-bold">Currently Editing:</span>
              <span className="text-sm text-amber-300">{currentConfigName}</span>
            </div>
            <button
              onClick={() => {
                if (confirm("Clear the current config selection? This won't delete the config.")) {
                  setCurrentConfigId(null);
                  setCurrentConfigName("");
                }
              }}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
              title="Clear current config"
            >
              ✕
            </button>
          </div>
        )}

        {/* Combined Quick Fill & Interpolation Controls - Always Visible */}
        <div className="mt-3 p-4 bg-gradient-to-br from-blue-900/20 to-orange-900/20 rounded-lg border border-gray-700">
          <h3 className="text-sm font-bold text-yellow-400 mb-3 flex items-center justify-between">
            <span>Corner Value Table Generator</span>
            <button
              onClick={handleReset}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold"
            >
              Reset Table
            </button>
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Left Column - Corner Values */}
            <div className="space-y-3">
              <div className="border-l-2 border-orange-500 pl-3">
                <h4 className="text-sm font-bold text-orange-400 mb-2">Corner Values</h4>
                <div className="space-y-3">
                  {/* T1 Values */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-gray-400">T1 Column</div>
                    <div className="flex gap-3 items-center">
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-gray-300">Common:</label>
                        <input
                          type="number"
                          value={commonT1}
                          onChange={(e) => setCommonT1(e.target.value)}
                          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-yellow-400 w-20"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-gray-300">God:</label>
                        <input
                          type="number"
                          value={godT1}
                          onChange={(e) => setGodT1(e.target.value)}
                          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-yellow-400 w-20"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-orange-300">Curve:</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={t1CurveStrength}
                        onChange={(e) => setT1CurveStrength(parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs text-orange-300 min-w-[35px]">{t1CurveStrength.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* T10 Values */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-gray-400">T10 Column</div>
                    <div className="flex gap-3 items-center">
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-gray-300">Common:</label>
                        <input
                          type="number"
                          value={commonT10}
                          onChange={(e) => setCommonT10(e.target.value)}
                          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-cyan-400 w-20"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-gray-300">God:</label>
                        <input
                          type="number"
                          value={godT10}
                          onChange={(e) => setGodT10(e.target.value)}
                          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-cyan-400 w-20"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-orange-300">Curve:</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={t10CurveStrength}
                        onChange={(e) => setT10CurveStrength(parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs text-orange-300 min-w-[35px]">{t10CurveStrength.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleFillTable}
                    className="px-3 py-1 bg-gradient-to-r from-orange-600 to-cyan-600 hover:from-orange-700 hover:to-cyan-700 text-white rounded text-sm font-bold w-full"
                  >
                    Fill Table
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Preview & Fine Tuning */}
            <div className="space-y-3">
              <div className="border-l-2 border-blue-500 pl-3">
                <h4 className="text-sm font-bold text-blue-400 mb-2">Preview & Manual Fine-Tuning</h4>
                <div className="space-y-3">
                  {/* Preview Section */}
                  <div className="p-2 bg-gray-800/30 rounded text-xs">
                    <div className="text-cyan-400 font-bold mb-2">Calculated Values:</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-gray-500">T1 Column:</div>
                        {(() => {
                          const values = [];
                          for (let i = 0; i < Math.min(3, RARITY_TIERS.length); i++) {
                            const ratio = i / (RARITY_TIERS.length - 1);
                            const curvedRatio = Math.pow(ratio, Math.pow(2, t1CurveStrength * 2 - 1));
                            const value = (parseFloat(commonT1) || 50) + ((parseFloat(godT1) || 1000) - (parseFloat(commonT1) || 50)) * curvedRatio;
                            values.push(applyRounding(value, roundingMode));
                          }
                          return (
                            <>
                              <span className="text-gray-400">Common: </span><span className="text-yellow-400">{values[0]}</span><br/>
                              <span className="text-gray-400">Uncommon: </span><span className="text-yellow-400">{values[1]}</span><br/>
                              <span className="text-gray-400">Rare: </span><span className="text-yellow-400">{values[2]}</span><br/>
                              <span className="text-gray-500">...</span>
                            </>
                          );
                        })()}
                      </div>
                      <div>
                        <div className="text-gray-500">T10 Column:</div>
                        {(() => {
                          const values = [];
                          for (let i = 0; i < Math.min(3, RARITY_TIERS.length); i++) {
                            const ratio = i / (RARITY_TIERS.length - 1);
                            const curvedRatio = Math.pow(ratio, Math.pow(2, t10CurveStrength * 2 - 1));
                            const value = (parseFloat(commonT10) || 500) + ((parseFloat(godT10) || 2800) - (parseFloat(commonT10) || 500)) * curvedRatio;
                            values.push(applyRounding(value, roundingMode));
                          }
                          return (
                            <>
                              <span className="text-gray-400">Common: </span><span className="text-cyan-400">{values[0]}</span><br/>
                              <span className="text-gray-400">Uncommon: </span><span className="text-cyan-400">{values[1]}</span><br/>
                              <span className="text-gray-400">Rare: </span><span className="text-cyan-400">{values[2]}</span><br/>
                              <span className="text-gray-500">...</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Manual Fine-Tuning */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-gray-400">Manual Fine-Tuning</div>
                    <div className="flex gap-2 items-center">
                      <select
                        value={interpolationDirection}
                        onChange={(e) => setInterpolationDirection(e.target.value as "vertical" | "horizontal")}
                        className="bg-gray-800 border border-gray-600 rounded px-1 py-1 text-xs text-gray-300 flex-1"
                      >
                        <option value="vertical">Vertical</option>
                        <option value="horizontal">Horizontal</option>
                      </select>
                      <select
                        value={interpolationCurve}
                        onChange={(e) => setInterpolationCurve(e.target.value as "linear" | "exponential" | "logarithmic")}
                        className="bg-gray-800 border border-gray-600 rounded px-1 py-1 text-xs text-gray-300 flex-1"
                      >
                        <option value="linear">Linear</option>
                        <option value="exponential">Exponential</option>
                        <option value="logarithmic">Logarithmic</option>
                      </select>
                      <button
                        onClick={handleInterpolate}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 p-2 bg-gray-800/40 rounded text-xs text-gray-400">
            <strong className="text-cyan-400">How it works:</strong> Set the 4 corner values (Common T1, God T1, Common T10, God T10).
            Adjust curve sliders to control interpolation between rarities. Click "Fill Table" to generate all values in between.
          </div>
        </div>

        {/* Paste Mode */}
        {pasteMode && (
          <div className="mt-3 p-3 bg-purple-900/20 rounded border border-purple-700/50">
            <p className="text-sm text-purple-400 mb-2">
              Paste tab-delimited data with rank ranges in rows and T1-T10 in columns:
            </p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Rank	T1	T2	T3	T4	T5	T6	T7	T8	T9	T10&#10;Common (2001-4000)	0	0	0	0	0	0	0	0	0	0&#10;..."
              className="w-full h-32 bg-gray-800 border border-gray-600 rounded p-2 text-xs text-gray-300 font-mono"
            />
            <button
              onClick={handlePaste}
              className="mt-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-bold"
            >
              Apply Paste
            </button>
          </div>
        )}

        {/* Save Configuration Modal */}
        {saveLoadMode === "save" && (
          <div className="mt-3 p-3 bg-cyan-900/20 rounded border border-cyan-700/50">
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-cyan-400">Save Configuration</h3>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Save name (e.g., 'Balanced Build v1')"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-300"
                />
                <textarea
                  placeholder="Optional description..."
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-300 h-20"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveConfig}
                  disabled={!saveName}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white rounded text-sm font-bold"
                >
                  Save Configuration
                </button>
                <button
                  onClick={() => {
                    setSaveLoadMode("none");
                    setSaveName("");
                    setSaveDescription("");
                  }}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Load Configuration Modal */}
        {saveLoadMode === "load" && (
          <div className="mt-3 p-3 bg-indigo-900/20 rounded border border-indigo-700/50">
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-indigo-400">Load Configuration</h3>
              <div className="max-h-60 overflow-y-auto">
                {savedConfigs && savedConfigs.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {savedConfigs.map((save) => (
                      <div
                        key={save._id}
                        className={`flex items-center justify-between p-2 rounded border ${
                          selectedSaveId === save._id
                            ? "bg-indigo-800/30 border-indigo-500"
                            : "bg-gray-800/30 border-gray-700"
                        } hover:bg-gray-700/30 cursor-pointer`}
                        onClick={() => setSelectedSaveId(save._id)}
                      >
                        <div>
                          <div className="text-sm font-bold text-gray-200">{save.saveName}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(save.timestamp).toLocaleString()}
                          </div>
                          {save.description && (
                            <div className="text-xs text-gray-500 mt-1">{save.description}</div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConfig(save._id);
                          }}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No saved configurations found.</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleLoadConfig}
                  disabled={!selectedSaveId}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded text-sm font-bold"
                >
                  Load Configuration
                </button>
                <button
                  onClick={() => {
                    setSaveLoadMode("none");
                    setSelectedSaveId(null);
                  }}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-black/60 rounded-lg border border-gray-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/50 border-b border-gray-700">
              <th className="px-4 py-2 text-left text-xs font-bold text-yellow-400 whitespace-nowrap sticky left-0 bg-gray-800/90 z-10">
                Rank
              </th>
              {TALENT_TIERS.map((tier: any) => (
                <th key={tier} className="px-3 py-2 text-center text-xs font-bold text-yellow-400 min-w-[60px]">
                  {tier}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RARITY_TIERS.map((tier: any, rowIndex: number) => {
              const rankKey = `${tier.min}-${tier.max}`;
              const rowData = tableData[selectedCategory]?.[rankKey];

              if (!rowData) return null;

              return (
                <tr
                  key={rankKey}
                  className={`border-b border-gray-700/50 ${
                    rowIndex % 2 === 0 ? "bg-gray-900/30" : "bg-gray-800/20"
                  }`}
                >
                  <td className={`px-4 py-2 text-xs font-medium whitespace-nowrap sticky left-0 z-10 ${
                    rowIndex % 2 === 0 ? "bg-gray-900/95" : "bg-gray-800/95"
                  } ${tier.color}`}>
                    {tier.label}
                  </td>
                  {TALENT_TIERS.map((talentTier: any) => {
                    const cellData = rowData[talentTier];
                    if (!cellData) return <td key={talentTier} />;

                    return (
                      <td key={talentTier} className="px-3 py-2 text-center">
                        {cellData.editing ? (
                          <input
                            type="number"
                            value={cellData.tempValue}
                            onChange={(e) =>
                              handleCellChange(selectedCategory, rankKey, talentTier, e.target.value)
                            }
                            onBlur={() => handleCellBlur(selectedCategory, rankKey, talentTier)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleCellBlur(selectedCategory, rankKey, talentTier);
                              }
                            }}
                            className="w-14 px-1 py-0.5 bg-gray-800 border border-yellow-500 rounded text-xs text-yellow-400 text-center"
                            autoFocus
                          />
                        ) : (
                          <div
                            onClick={() => handleCellClick(selectedCategory, rankKey, talentTier)}
                            className={`inline-block px-2 py-0.5 rounded cursor-pointer transition-all text-xs ${
                              editMode
                                ? "hover:bg-gray-700 hover:ring-1 hover:ring-yellow-500/50"
                                : ""
                            } ${
                              cellData.value > 0 ? "text-yellow-400 font-bold" : "text-gray-600"
                            }`}
                          >
                            {cellData.value}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Quick Guide */}
      <div className="mt-4 p-3 bg-black/40 rounded border border-gray-700/50">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <span className="text-cyan-400">ℹ️ Quick Guide:</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400">
          <div>• <span className="text-yellow-400">Rows</span> = Mek rarity (rarer = higher tier values)</div>
          <div>• <span className="text-yellow-400">Columns</span> = Tree tiers (1-10)</div>
          <div>• <span className="text-blue-400">Interpolate</span> to auto-generate values with curves</div>
          <div>• <span className="text-purple-400">Paste Data</span> from spreadsheets</div>
        </div>
      </div>
    </div>
  );
}