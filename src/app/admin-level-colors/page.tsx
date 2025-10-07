"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

// Default colors for each level (1-10)
const DEFAULT_COLORS = [
  "#4ade80", // Level 1 - Green
  "#22c55e", // Level 2 - Darker Green
  "#10b981", // Level 3 - Emerald
  "#14b8a6", // Level 4 - Teal
  "#06b6d4", // Level 5 - Cyan
  "#0ea5e9", // Level 6 - Sky Blue
  "#3b82f6", // Level 7 - Blue
  "#6366f1", // Level 8 - Indigo
  "#8b5cf6", // Level 9 - Violet
  "#a855f7", // Level 10 - Purple
];

export default function AdminLevelColorsPage() {
  const router = useRouter();
  const [colors, setColors] = useState<string[]>(DEFAULT_COLORS);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // Convex queries and mutations
  const savedColors = useQuery(api.levelColors.getLevelColors);
  const saveLevelColors = useMutation(api.levelColors.saveLevelColors);
  const resetToDefaults = useMutation(api.levelColors.resetToDefaults);

  // Load colors from Convex on mount
  useEffect(() => {
    if (savedColors && Array.isArray(savedColors) && savedColors.length === 10) {
      setColors(savedColors);
    }
  }, [savedColors]);

  const handleColorChange = (level: number, newColor: string) => {
    const newColors = [...colors];
    newColors[level - 1] = newColor;
    setColors(newColors);
  };

  const handleSave = async () => {
    try {
      await saveLevelColors({ colors });
      setMessage({ type: 'success', text: 'Level colors saved to database!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save colors:', error);
      setMessage({ type: 'error', text: 'Failed to save colors. Please try again.' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleReset = async () => {
    try {
      await resetToDefaults();
      setColors(DEFAULT_COLORS);
      setMessage({ type: 'info', text: 'Reset to default colors' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to reset colors:', error);
      setMessage({ type: 'error', text: 'Failed to reset colors. Please try again.' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="mb-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-sm transition-colors"
          >
            ← Back to Game
          </button>

          <h1 className="text-4xl font-bold text-yellow-500 font-['Orbitron'] uppercase tracking-wider mb-2">
            Level Color Configuration
          </h1>
          <p className="text-gray-400 text-sm font-mono">
            Configure the power bar colors for each Mek level (1-10) - Stored in database
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 border rounded ${
            message.type === 'success' ? 'bg-green-900/20 border-green-500/50 text-green-400' :
            message.type === 'error' ? 'bg-red-900/20 border-red-500/50 text-red-400' :
            'bg-blue-900/20 border-blue-500/50 text-blue-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Color Grid */}
        <div className="bg-black/40 border-2 border-yellow-500/30 backdrop-blur-sm p-6 rounded-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {colors.map((color, index) => {
              const level = index + 1;
              return (
                <div key={level} className="bg-gray-900/50 border border-gray-700 p-4 rounded">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-yellow-500 font-mono uppercase text-sm tracking-wider">
                      Level {level}
                    </label>
                    <span className="text-gray-500 font-mono text-xs">{color}</span>
                  </div>

                  {/* Color picker */}
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => handleColorChange(level, e.target.value)}
                      className="w-20 h-12 rounded cursor-pointer border-2 border-gray-700 bg-transparent"
                    />

                    {/* Preview bar */}
                    <div className="flex-1 h-12 rounded border border-gray-700 overflow-hidden relative">
                      <div
                        className="absolute inset-0 transition-all duration-300"
                        style={{
                          background: `linear-gradient(90deg, ${color}00 0%, ${color} 100%)`,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-white font-mono text-sm font-bold mix-blend-difference">
                        Power Level {level}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-black/40 border-2 border-yellow-500/30 backdrop-blur-sm p-6 rounded-sm mb-6">
          <h2 className="text-yellow-500 font-mono uppercase text-sm tracking-wider mb-4">
            Preview - All Levels
          </h2>
          <div className="space-y-2">
            {colors.map((color, index) => {
              const level = index + 1;
              const percentage = (level / 10) * 100;
              return (
                <div key={level} className="flex items-center gap-3">
                  <span className="text-gray-500 font-mono text-xs w-16">Lvl {level}</span>
                  <div className="flex-1 h-8 bg-gray-900 rounded border border-gray-700 overflow-hidden relative">
                    <div
                      className="absolute inset-y-0 left-0 transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 10px ${color}80`
                      }}
                    />
                  </div>
                  <span className="text-gray-400 font-mono text-xs w-12">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 border-2 border-yellow-500/50 hover:border-yellow-500 text-yellow-500 font-['Orbitron'] uppercase tracking-wider text-sm transition-all rounded"
          >
            Save Colors
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300 font-['Orbitron'] uppercase tracking-wider text-sm transition-all rounded"
          >
            Reset to Default
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-gray-900/50 border border-gray-800 rounded text-gray-500 text-sm font-mono">
          <p className="mb-2"><strong className="text-yellow-500">How to use:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Click on a color square to open the color picker</li>
            <li>Choose your desired color for each level</li>
            <li>Click "Save Colors" to apply changes</li>
            <li>Colors are stored in the database and work across all domains</li>
            <li>Changes apply immediately to all Mek cards</li>
            <li>Click "Reset to Default" to restore original colors</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
