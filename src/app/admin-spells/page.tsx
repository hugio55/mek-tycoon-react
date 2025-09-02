"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface SpellEffect {
  type: "damage" | "heal" | "buff" | "debuff" | "summon" | "aoe" | "dot" | "hot" | "shield" | "stun" | "slow" | "speed";
  value: number;
  duration?: number;
  radius?: number;
  tickRate?: number;
}

interface SpellVisual {
  particleType: "fire" | "ice" | "lightning" | "nature" | "arcane" | "shadow" | "holy" | "physical";
  particleCount: number;
  particleSpeed: number;
  particleSize: number;
  color1: string;
  color2: string;
  color3?: string;
  emissionPattern: "burst" | "stream" | "spiral" | "rain" | "orbit" | "wave";
  trailEffect: boolean;
  glowIntensity: number;
}

interface Spell {
  _id?: Id<"spells">;
  name: string;
  description: string;
  category: "offensive" | "defensive" | "utility" | "ultimate";
  manaCost: number;
  cooldown: number;
  castTime: number;
  range: number;
  effects: SpellEffect[];
  visuals: SpellVisual;
  soundEffect?: string;
  icon?: string;
  requiredLevel: number;
  requiredClass?: string;
  isActive: boolean;
  createdAt?: number;
  updatedAt?: number;
}

const effectTypes = [
  { value: "damage", label: "Damage", color: "#ef4444" },
  { value: "heal", label: "Heal", color: "#10b981" },
  { value: "buff", label: "Buff", color: "#3b82f6" },
  { value: "debuff", label: "Debuff", color: "#a855f7" },
  { value: "summon", label: "Summon", color: "#f59e0b" },
  { value: "aoe", label: "Area of Effect", color: "#ec4899" },
  { value: "dot", label: "Damage Over Time", color: "#dc2626" },
  { value: "hot", label: "Heal Over Time", color: "#16a34a" },
  { value: "shield", label: "Shield", color: "#06b6d4" },
  { value: "stun", label: "Stun", color: "#fbbf24" },
  { value: "slow", label: "Slow", color: "#6366f1" },
  { value: "speed", label: "Speed Boost", color: "#84cc16" },
];

const particleTypes = [
  { value: "fire", label: "Fire", colors: ["#ff6b35", "#ff9558", "#ffc93c"] },
  { value: "ice", label: "Ice", colors: ["#60a5fa", "#93c5fd", "#dbeafe"] },
  { value: "lightning", label: "Lightning", colors: ["#fbbf24", "#fde047", "#ffffff"] },
  { value: "nature", label: "Nature", colors: ["#22c55e", "#86efac", "#bbf7d0"] },
  { value: "arcane", label: "Arcane", colors: ["#a855f7", "#c084fc", "#e9d5ff"] },
  { value: "shadow", label: "Shadow", colors: ["#4b5563", "#6b7280", "#9ca3af"] },
  { value: "holy", label: "Holy", colors: ["#fef3c7", "#fde68a", "#fbbf24"] },
  { value: "physical", label: "Physical", colors: ["#a8a29e", "#d6d3d1", "#f5f5f4"] },
];

const emissionPatterns = [
  "burst", "stream", "spiral", "rain", "orbit", "wave"
];

export default function AdminSpellsPage() {
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showSampleButton, setShowSampleButton] = useState(false);

  // Convex queries and mutations
  const spells = useQuery(api.spells.getAllSpells) || [];
  const saveSpellMutation = useMutation(api.spells.saveSpell);
  const deleteSpellMutation = useMutation(api.spells.deleteSpell);
  const duplicateSpellMutation = useMutation(api.spells.duplicateSpell);
  const toggleActiveSpellMutation = useMutation(api.spells.toggleSpellActive);
  const createSampleSpellsMutation = useMutation(api.spells.createSampleSpells);

  useEffect(() => {
    // Show sample button if no spells exist
    setShowSampleButton(spells.length === 0);
  }, [spells.length]);

  const defaultSpell: Spell = {
    name: "",
    description: "",
    category: "offensive",
    manaCost: 10,
    cooldown: 5,
    castTime: 1,
    range: 10,
    effects: [{
      type: "damage",
      value: 50
    }],
    visuals: {
      particleType: "fire",
      particleCount: 50,
      particleSpeed: 5,
      particleSize: 1,
      color1: "#ff6b35",
      color2: "#ff9558",
      emissionPattern: "burst",
      trailEffect: true,
      glowIntensity: 0.5
    },
    requiredLevel: 1,
    isActive: true
  };

  const handleNewSpell = () => {
    setSelectedSpell(defaultSpell);
    setIsCreating(true);
  };

  const handleSaveSpell = async () => {
    if (!selectedSpell) return;
    
    try {
      const { _id, createdAt, updatedAt, ...spellData } = selectedSpell;
      
      await saveSpellMutation({
        id: isCreating ? undefined : _id,
        ...spellData
      });
      
      setSelectedSpell(null);
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to save spell:", error);
    }
  };

  const handleDeleteSpell = async (id: Id<"spells">) => {
    if (!confirm("Are you sure you want to delete this spell?")) return;
    
    try {
      await deleteSpellMutation({ id });
      setSelectedSpell(null);
    } catch (error) {
      console.error("Failed to delete spell:", error);
    }
  };

  const handleDuplicateSpell = async (id: Id<"spells">) => {
    try {
      await duplicateSpellMutation({ id });
    } catch (error) {
      console.error("Failed to duplicate spell:", error);
    }
  };

  const handleToggleActive = async (id: Id<"spells">) => {
    try {
      await toggleActiveSpellMutation({ id });
    } catch (error) {
      console.error("Failed to toggle spell active status:", error);
    }
  };

  const handleCreateSampleSpells = async () => {
    try {
      await createSampleSpellsMutation({});
      setShowSampleButton(false);
    } catch (error) {
      console.error("Failed to create sample spells:", error);
    }
  };

  const addEffect = () => {
    if (!selectedSpell) return;
    setSelectedSpell({
      ...selectedSpell,
      effects: [...selectedSpell.effects, { type: "damage", value: 10 }]
    });
  };

  const removeEffect = (index: number) => {
    if (!selectedSpell) return;
    setSelectedSpell({
      ...selectedSpell,
      effects: selectedSpell.effects.filter((_, i) => i !== index)
    });
  };

  const updateEffect = (index: number, effect: SpellEffect) => {
    if (!selectedSpell) return;
    const newEffects = [...selectedSpell.effects];
    newEffects[index] = effect;
    setSelectedSpell({
      ...selectedSpell,
      effects: newEffects
    });
  };

  const filteredSpells = spells.filter(spell => {
    const matchesSearch = spell.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || spell.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-black text-gray-100 p-4">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">Spell Designer</h1>
            <p className="text-gray-400 text-sm">Create and manage spells for the spell caster minigame</p>
          </div>
          {showSampleButton && (
            <button
              onClick={handleCreateSampleSpells}
              className="px-4 py-2 bg-purple-600/20 border border-purple-500 text-purple-400 rounded hover:bg-purple-600/30 transition-colors"
            >
              Generate Sample Spells
            </button>
          )}
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Spell List */}
          <div className="col-span-3 bg-gray-900/50 border border-yellow-400/30 rounded-lg p-3">
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search spells..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1 bg-black/50 border border-gray-700 rounded text-sm"
              />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full mt-2 px-2 py-1 bg-black/50 border border-gray-700 rounded text-sm"
              >
                <option value="all">All Categories</option>
                <option value="offensive">Offensive</option>
                <option value="defensive">Defensive</option>
                <option value="utility">Utility</option>
                <option value="ultimate">Ultimate</option>
              </select>
            </div>

            <button
              onClick={handleNewSpell}
              className="w-full mb-3 px-3 py-1.5 bg-green-600/20 border border-green-500 text-green-400 rounded text-sm hover:bg-green-600/30 transition-colors"
            >
              + New Spell
            </button>

            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {filteredSpells.map((spell) => (
                <div
                  key={spell._id}
                  onClick={() => {
                    setSelectedSpell(spell as Spell);
                    setIsCreating(false);
                  }}
                  className={`p-2 rounded cursor-pointer text-sm transition-colors ${
                    selectedSpell?._id === spell._id
                      ? "bg-yellow-400/20 border border-yellow-400/50"
                      : "bg-gray-800/30 hover:bg-gray-800/50 border border-transparent"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold">{spell.name}</div>
                      <div className="text-xs text-gray-500">
                        {spell.category} • {spell.manaCost} mana
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(spell._id);
                        }}
                        className={`w-2 h-2 rounded-full ${spell.isActive ? "bg-green-400" : "bg-gray-600"}`}
                        title={spell.isActive ? "Active" : "Inactive"}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateSpell(spell._id);
                        }}
                        className="text-blue-400 hover:text-blue-300 text-xs"
                        title="Duplicate"
                      >
                        ⎘
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Spell Editor */}
          {selectedSpell && (
            <div className="col-span-6 bg-gray-900/50 border border-yellow-400/30 rounded-lg p-4">
              <h2 className="text-xl font-bold text-yellow-400 mb-4">
                {isCreating ? "Create New Spell" : "Edit Spell"}
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {/* Basic Info */}
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={selectedSpell.name}
                    onChange={(e) => setSelectedSpell({ ...selectedSpell, name: e.target.value })}
                    className="w-full px-2 py-1 bg-black/50 border border-gray-700 rounded text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Description</label>
                  <textarea
                    value={selectedSpell.description}
                    onChange={(e) => setSelectedSpell({ ...selectedSpell, description: e.target.value })}
                    className="w-full px-2 py-1 bg-black/50 border border-gray-700 rounded text-sm h-16 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Category</label>
                  <select
                    value={selectedSpell.category}
                    onChange={(e) => setSelectedSpell({ ...selectedSpell, category: e.target.value as any })}
                    className="w-full px-2 py-1 bg-black/50 border border-gray-700 rounded text-sm"
                  >
                    <option value="offensive">Offensive</option>
                    <option value="defensive">Defensive</option>
                    <option value="utility">Utility</option>
                    <option value="ultimate">Ultimate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Required Level</label>
                  <input
                    type="number"
                    value={selectedSpell.requiredLevel}
                    onChange={(e) => setSelectedSpell({ ...selectedSpell, requiredLevel: parseInt(e.target.value) || 1 })}
                    className="w-full px-2 py-1 bg-black/50 border border-gray-700 rounded text-sm"
                  />
                </div>

                {/* Combat Stats */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Mana Cost</label>
                  <input
                    type="number"
                    value={selectedSpell.manaCost}
                    onChange={(e) => setSelectedSpell({ ...selectedSpell, manaCost: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 bg-black/50 border border-gray-700 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Cooldown (s)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={selectedSpell.cooldown}
                    onChange={(e) => setSelectedSpell({ ...selectedSpell, cooldown: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 bg-black/50 border border-gray-700 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Cast Time (s)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedSpell.castTime}
                    onChange={(e) => setSelectedSpell({ ...selectedSpell, castTime: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 bg-black/50 border border-gray-700 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Range</label>
                  <input
                    type="number"
                    value={selectedSpell.range}
                    onChange={(e) => setSelectedSpell({ ...selectedSpell, range: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 bg-black/50 border border-gray-700 rounded text-sm"
                  />
                </div>

                {/* Effects */}
                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-gray-400">Effects</label>
                    <button
                      onClick={addEffect}
                      className="px-2 py-0.5 bg-green-600/20 border border-green-500 text-green-400 rounded text-xs hover:bg-green-600/30"
                    >
                      + Add Effect
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedSpell.effects.map((effect, index) => (
                      <div key={index} className="p-2 bg-black/30 rounded border border-gray-700">
                        <div className="grid grid-cols-4 gap-2">
                          <select
                            value={effect.type}
                            onChange={(e) => updateEffect(index, { ...effect, type: e.target.value as any })}
                            className="px-1 py-0.5 bg-black/50 border border-gray-700 rounded text-xs"
                          >
                            {effectTypes.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            placeholder="Value"
                            value={effect.value}
                            onChange={(e) => updateEffect(index, { ...effect, value: parseInt(e.target.value) || 0 })}
                            className="px-1 py-0.5 bg-black/50 border border-gray-700 rounded text-xs"
                          />
                          <input
                            type="number"
                            placeholder="Duration"
                            value={effect.duration || ""}
                            onChange={(e) => updateEffect(index, { ...effect, duration: parseFloat(e.target.value) || undefined })}
                            className="px-1 py-0.5 bg-black/50 border border-gray-700 rounded text-xs"
                          />
                          <button
                            onClick={() => removeEffect(index)}
                            className="px-1 py-0.5 bg-red-600/20 border border-red-500 text-red-400 rounded text-xs hover:bg-red-600/30"
                          >
                            Remove
                          </button>
                        </div>
                        {(effect.type === "aoe" || effect.type === "slow") && (
                          <input
                            type="number"
                            placeholder="Radius"
                            value={effect.radius || ""}
                            onChange={(e) => updateEffect(index, { ...effect, radius: parseFloat(e.target.value) || undefined })}
                            className="mt-1 w-full px-1 py-0.5 bg-black/50 border border-gray-700 rounded text-xs"
                          />
                        )}
                        {(effect.type === "dot" || effect.type === "hot") && (
                          <input
                            type="number"
                            placeholder="Tick Rate (s)"
                            value={effect.tickRate || ""}
                            onChange={(e) => updateEffect(index, { ...effect, tickRate: parseFloat(e.target.value) || undefined })}
                            className="mt-1 w-full px-1 py-0.5 bg-black/50 border border-gray-700 rounded text-xs"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="col-span-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedSpell.isActive}
                      onChange={(e) => setSelectedSpell({ ...selectedSpell, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-gray-400">Active (available in game)</span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="col-span-2 flex gap-2 mt-4">
                  <button
                    onClick={handleSaveSpell}
                    className="flex-1 px-3 py-1.5 bg-green-600/20 border border-green-500 text-green-400 rounded text-sm hover:bg-green-600/30 transition-colors"
                  >
                    {isCreating ? "Create Spell" : "Save Changes"}
                  </button>
                  {!isCreating && selectedSpell._id && (
                    <button
                      onClick={() => handleDeleteSpell(selectedSpell._id!)}
                      className="px-3 py-1.5 bg-red-600/20 border border-red-500 text-red-400 rounded text-sm hover:bg-red-600/30 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedSpell(null);
                      setIsCreating(false);
                    }}
                    className="px-3 py-1.5 bg-gray-700/50 border border-gray-600 text-gray-400 rounded text-sm hover:bg-gray-700/70 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Visual Editor */}
          {selectedSpell && (
            <div className="col-span-3 bg-gray-900/50 border border-yellow-400/30 rounded-lg p-4">
              <h3 className="text-lg font-bold text-yellow-400 mb-3">Visual Effects</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Particle Type</label>
                  <select
                    value={selectedSpell.visuals.particleType}
                    onChange={(e) => {
                      const type = particleTypes.find(t => t.value === e.target.value);
                      setSelectedSpell({
                        ...selectedSpell,
                        visuals: {
                          ...selectedSpell.visuals,
                          particleType: e.target.value as any,
                          color1: type?.colors[0] || "#ffffff",
                          color2: type?.colors[1] || "#ffffff",
                          color3: type?.colors[2]
                        }
                      });
                    }}
                    className="w-full px-2 py-1 bg-black/50 border border-gray-700 rounded text-sm"
                  >
                    {particleTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Color 1</label>
                    <input
                      type="color"
                      value={selectedSpell.visuals.color1}
                      onChange={(e) => setSelectedSpell({
                        ...selectedSpell,
                        visuals: { ...selectedSpell.visuals, color1: e.target.value }
                      })}
                      className="w-full h-8 bg-black/50 border border-gray-700 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Color 2</label>
                    <input
                      type="color"
                      value={selectedSpell.visuals.color2}
                      onChange={(e) => setSelectedSpell({
                        ...selectedSpell,
                        visuals: { ...selectedSpell.visuals, color2: e.target.value }
                      })}
                      className="w-full h-8 bg-black/50 border border-gray-700 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Color 3</label>
                    <input
                      type="color"
                      value={selectedSpell.visuals.color3 || "#000000"}
                      onChange={(e) => setSelectedSpell({
                        ...selectedSpell,
                        visuals: { ...selectedSpell.visuals, color3: e.target.value }
                      })}
                      className="w-full h-8 bg-black/50 border border-gray-700 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Emission Pattern</label>
                  <select
                    value={selectedSpell.visuals.emissionPattern}
                    onChange={(e) => setSelectedSpell({
                      ...selectedSpell,
                      visuals: { ...selectedSpell.visuals, emissionPattern: e.target.value as any }
                    })}
                    className="w-full px-2 py-1 bg-black/50 border border-gray-700 rounded text-sm"
                  >
                    {emissionPatterns.map(pattern => (
                      <option key={pattern} value={pattern}>
                        {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Particle Count: {selectedSpell.visuals.particleCount}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={selectedSpell.visuals.particleCount}
                    onChange={(e) => setSelectedSpell({
                      ...selectedSpell,
                      visuals: { ...selectedSpell.visuals, particleCount: parseInt(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Particle Speed: {selectedSpell.visuals.particleSpeed}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={selectedSpell.visuals.particleSpeed}
                    onChange={(e) => setSelectedSpell({
                      ...selectedSpell,
                      visuals: { ...selectedSpell.visuals, particleSpeed: parseInt(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Particle Size: {selectedSpell.visuals.particleSize}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={selectedSpell.visuals.particleSize}
                    onChange={(e) => setSelectedSpell({
                      ...selectedSpell,
                      visuals: { ...selectedSpell.visuals, particleSize: parseFloat(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Glow Intensity: {(selectedSpell.visuals.glowIntensity * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={selectedSpell.visuals.glowIntensity}
                    onChange={(e) => setSelectedSpell({
                      ...selectedSpell,
                      visuals: { ...selectedSpell.visuals, glowIntensity: parseFloat(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedSpell.visuals.trailEffect}
                      onChange={(e) => setSelectedSpell({
                        ...selectedSpell,
                        visuals: { ...selectedSpell.visuals, trailEffect: e.target.checked }
                      })}
                      className="rounded"
                    />
                    <span className="text-gray-400">Trail Effect</span>
                  </label>
                </div>

                {/* Visual Preview */}
                <div className="mt-4 p-4 bg-black/50 rounded border border-gray-700">
                  <div className="text-xs text-gray-400 mb-2">Visual Preview</div>
                  <div className="h-32 bg-gradient-to-br from-gray-900 to-black rounded flex items-center justify-center relative overflow-hidden">
                    <div 
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        background: `radial-gradient(circle, ${selectedSpell.visuals.color1}30 0%, transparent 70%)`,
                        filter: `blur(${selectedSpell.visuals.glowIntensity * 20}px)`
                      }}
                    />
                    <div className="text-center relative z-10">
                      <div className="text-2xl mb-1" style={{ color: selectedSpell.visuals.color1 }}>✨</div>
                      <div className="text-xs text-gray-500">
                        {selectedSpell.visuals.particleType} • {selectedSpell.visuals.emissionPattern}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-gray-900/50 border border-yellow-400/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Total Spells</div>
            <div className="text-2xl font-bold text-yellow-400">{spells.length}</div>
          </div>
          <div className="bg-gray-900/50 border border-yellow-400/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Active Spells</div>
            <div className="text-2xl font-bold text-green-400">
              {spells.filter(s => s.isActive).length}
            </div>
          </div>
          <div className="bg-gray-900/50 border border-yellow-400/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Categories</div>
            <div className="text-xs space-y-1 mt-1">
              <div>Offensive: {spells.filter(s => s.category === "offensive").length}</div>
              <div>Defensive: {spells.filter(s => s.category === "defensive").length}</div>
              <div>Utility: {spells.filter(s => s.category === "utility").length}</div>
              <div>Ultimate: {spells.filter(s => s.category === "ultimate").length}</div>
            </div>
          </div>
          <div className="bg-gray-900/50 border border-yellow-400/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Avg Mana Cost</div>
            <div className="text-2xl font-bold text-blue-400">
              {spells.length > 0 
                ? Math.round(spells.reduce((sum, s) => sum + s.manaCost, 0) / spells.length)
                : 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}