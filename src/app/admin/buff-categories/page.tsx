"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface BuffCategory {
  _id: Id<"buffCategories">;
  name: string;
  description?: string;
  category: "gold" | "essence" | "rarity_bias" | "xp" | "mek_slot" | "market" | "reward_chance";
  unitType: "flat_number" | "rate_change" | "rate_percentage" | "flat_percentage";
  applicationType?: "universal" | "attachable";
  tierStart?: number;
  tierEnd?: number;
  isActive?: boolean;
  createdAt: number;
  updatedAt: number;
}

interface MechanismTier {
  _id: Id<"mechanismTiers">;
  tier: number;
  startRank: number;
  endRank: number;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export default function BuffCategoriesPage() {
  const [editingId, setEditingId] = useState<Id<"buffCategories"> | null>(null);
  
  const categories = useQuery(api.buffCategories.getAll);
  const createCategory = useMutation(api.buffCategories.create);
  const updateCategory = useMutation(api.buffCategories.update);
  const deleteCategory = useMutation(api.buffCategories.remove);
  const seedCategories = useMutation(api.seedBuffCategories.seedAll);
  const removeCategoryFromConfigs = useMutation(api.chipConfigurations.removeCategoryFromConfigs);
  
  const mechanismTiers = useQuery(api.mechanismTiers.getAll);
  const updateMechanismTier = useMutation(api.mechanismTiers.updateTier);
  const initializeTiers = useMutation(api.mechanismTiers.initializeDefaults);
  const resetTiers = useMutation(api.mechanismTiers.resetToDefaults);
  const [editingTierId, setEditingTierId] = useState<Id<"mechanismTiers"> | null>(null);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">("synced");
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showTierConfig, setShowTierConfig] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "gold" as BuffCategory["category"],
    unitType: "flat_number" as BuffCategory["unitType"],
    applicationType: "universal" as BuffCategory["applicationType"],
    tierStart: 1 as number | undefined,
    tierEnd: 1 as number | undefined,
    isActive: true,
  });
  const [tierFormData, setTierFormData] = useState({
    startRank: 0,
    endRank: 0,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "gold",
      unitType: "flat_number",
      applicationType: "universal",
      tierStart: 1,
      tierEnd: 1,
      isActive: true,
    });
    setEditingId(null);
  };

  const categoryOptions = [
    { value: "gold", label: "Gold" },
    { value: "essence", label: "Essence" },
    { value: "rarity_bias", label: "Rarity Bias" },
    { value: "xp", label: "XP" },
    { value: "mek_slot", label: "Mek Slot" },
    { value: "market", label: "Market" },
    { value: "reward_chance", label: "Reward Chance" },
  ];

  const unitTypeOptions = [
    { value: "flat_number", label: "Flat Number (+10)" },
    { value: "rate_change", label: "Rate Change (+0.1 essence/day)" },
    { value: "rate_percentage", label: "Rate Percentage (+1% essence/day)" },
    { value: "flat_percentage", label: "Flat Percentage (+10%)" },
  ];

  const applicationTypeOptions = [
    { value: "universal", label: "Universal" },
    { value: "attachable", label: "Attachable" },
  ];

  const tierOptions = Array.from({ length: 10 }, (_, i) => ({
    value: i + 1,
    label: `Tier ${i + 1}`,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncStatus("syncing");
    
    try {
      if (editingId) {
        await updateCategory({
          id: editingId,
          ...formData,
          tierStart: formData.tierStart || 1,
          tierEnd: formData.tierEnd || 1,
        });
      } else {
        await createCategory({
          ...formData,
          tierStart: formData.tierStart || 1,
          tierEnd: formData.tierEnd || 1,
        });
      }
      
      setSyncStatus("synced");
      setLastSyncTime(new Date());
      resetForm();
    } catch (error) {
      setSyncStatus("error");
      console.error("Failed to save buff category:", error);
    }
  };

  const handleEdit = (category: BuffCategory) => {
    setEditingId(category._id);
    setFormData({
      name: category.name,
      description: category.description || "",
      category: category.category,
      unitType: category.unitType,
      applicationType: category.applicationType || "universal",
      tierStart: category.tierStart || 1,
      tierEnd: category.tierEnd || 1,
      isActive: category.isActive !== false,
    });
  };

  const handleDelete = async (id: Id<"buffCategories">) => {
    // Check dependencies first
    const deps = await checkDependencies({ buffCategoryId: id });
    
    let warningMessage = "Are you sure you want to delete this buff category?";
    
    if (deps && (deps.hasMasterRange || deps.affectedChipConfigs > 0)) {
      warningMessage = `⚠️ WARNING: This buff category is being used!\n\n`;
      
      if (deps.hasMasterRange) {
        warningMessage += `• Has master range configuration in Chip Builder\n`;
      }
      
      if (deps.affectedChipConfigs > 0) {
        warningMessage += `• Used in ${deps.affectedChipConfigs} chip configurations\n`;
      }
      
      warningMessage += `\nDeleting this category will:\n`;
      warningMessage += `• Remove its master range settings\n`;
      warningMessage += `• Remove it from all chip configurations\n`;
      warningMessage += `• Require reconfiguration in the Chip Builder\n\n`;
      warningMessage += `Are you ABSOLUTELY SURE you want to delete this buff category?`;
    }
    
    if (confirm(warningMessage)) {
      setSyncStatus("syncing");
      try {
        // Remove from chip configurations first
        if (deps && (deps.hasMasterRange || deps.affectedChipConfigs > 0)) {
          await removeCategoryFromConfigs({ buffCategoryId: id });
        }
        
        // Then delete the category
        await deleteCategory({ id });
        setSyncStatus("synced");
        setLastSyncTime(new Date());
      } catch (error) {
        setSyncStatus("error");
        console.error("Failed to delete buff category:", error);
      }
    }
  };

  // Auto-detect connection status
  useEffect(() => {
    if (categories === undefined) {
      setSyncStatus("syncing");
    } else if (categories !== undefined) {
      setSyncStatus("synced");
      // Set sync time on client side only
      if (!lastSyncTime) {
        setLastSyncTime(new Date());
      }
    }
  }, [categories, lastSyncTime]);

  // Initialize tiers if they don't exist
  useEffect(() => {
    if (mechanismTiers !== undefined && mechanismTiers.length === 0) {
      initializeTiers();
    }
  }, [mechanismTiers, initializeTiers]);

  const handleTierUpdate = async (tier: MechanismTier) => {
    setSyncStatus("syncing");
    try {
      await updateMechanismTier({
        id: tier._id,
        startRank: tierFormData.startRank,
        endRank: tierFormData.endRank,
      });
      setSyncStatus("synced");
      setLastSyncTime(new Date());
      setEditingTierId(null);
    } catch (error) {
      setSyncStatus("error");
      console.error("Failed to update tier:", error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Sync Status Bar */}
      <div className="fixed top-0 left-0 right-0 bg-gray-900/95 border-b border-yellow-500/30 px-8 py-1 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Backend Status:</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                syncStatus === "synced" ? "bg-green-500" : 
                syncStatus === "syncing" ? "bg-yellow-500 animate-pulse" : 
                "bg-red-500"
              }`} />
              <span className={`text-xs font-semibold ${
                syncStatus === "synced" ? "text-green-400" : 
                syncStatus === "syncing" ? "text-yellow-400" : 
                "text-red-400"
              }`}>
                {syncStatus === "synced" ? "Synced" : 
                 syncStatus === "syncing" ? "Syncing..." : 
                 "Connection Error"}
              </span>
            </div>
            {syncStatus === "synced" && lastSyncTime && (
              <span className="text-xs text-gray-500">
                Last sync: {lastSyncTime.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400">
            {categories ? `${categories.length} categories` : "Loading..."}
          </div>
        </div>
      </div>
      
      <div className="pt-12 w-full h-screen overflow-y-auto">
        <h1 className="text-3xl font-bold text-yellow-500 uppercase tracking-wider mb-3 px-8">
          Admin - Buff Categories
        </h1>

        {/* Form Section */}
        <div className="bg-gray-900/50 border-y-2 border-yellow-500/50 px-8 py-4 mb-3 w-full">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-yellow-500">
              {editingId ? "Edit Category" : "Add New Category"}
            </h2>
            {(!categories || categories.length === 0) && (
              <button
                onClick={async () => {
                  setSyncStatus("syncing");
                  try {
                    await seedCategories();
                    setSyncStatus("synced");
                    setLastSyncTime(new Date());
                  } catch (error) {
                    setSyncStatus("error");
                    console.error("Failed to seed categories:", error);
                  }
                }}
                className="bg-green-600 text-white font-bold px-4 py-1 rounded hover:bg-green-500 transition-colors text-sm"
              >
                Seed Default Categories
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1 text-white text-sm"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as BuffCategory["category"] })}
                className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1 text-white text-sm"
                required
              >
                {categoryOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Unit Type</label>
              <select
                value={formData.unitType}
                onChange={(e) => setFormData({ ...formData, unitType: e.target.value as BuffCategory["unitType"] })}
                className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1 text-white text-sm"
                required
              >
                {unitTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Application</label>
              <select
                value={formData.applicationType}
                onChange={(e) => setFormData({ ...formData, applicationType: e.target.value as BuffCategory["applicationType"] })}
                className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1 text-white text-sm"
                required
              >
                {applicationTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tier Start</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.tierStart || 1}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 1 && val <= 10) {
                      setFormData({ ...formData, tierStart: val });
                    }
                  }}
                  className="w-20 bg-black/50 border border-yellow-500/30 rounded px-2 py-1 text-white text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tier End</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  min={formData.tierStart || 1}
                  max="10"
                  value={formData.tierEnd || 1}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= (formData.tierStart || 1) && val <= 10) {
                      setFormData({ ...formData, tierEnd: val });
                    }
                  }}
                  className="w-20 bg-black/50 border border-yellow-500/30 rounded px-2 py-1 text-white text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">&nbsp;</label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tierStart: 1, tierEnd: 10 })}
                className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors text-sm"
              >
                All Tiers
              </button>
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <label className="flex items-center gap-1 mt-1">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded w-3 h-3"
                />
                <span className="text-xs text-white">Active</span>
              </label>
            </div>
            
            <div className="col-span-full lg:col-span-2 xl:col-span-3 2xl:col-span-4">
              <label className="block text-xs text-gray-400 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-black/50 border border-yellow-500/30 rounded px-3 py-2 text-white text-sm"
                rows={1}
              />
            </div>
            
            <div className="col-span-full flex gap-2">
              <button
                type="submit"
                className="bg-yellow-500 text-black font-bold px-4 py-1 rounded hover:bg-yellow-400 transition-colors text-sm"
              >
                {editingId ? "Update" : "Create"} Category
              </button>
              
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-700 text-white font-bold px-4 py-1 rounded hover:bg-gray-600 transition-colors text-sm"
                >
                  Cancel
                </button>
              )}
              
              {editingId && (
                <button
                  type="button"
                  onClick={() => handleDelete(editingId)}
                  className="bg-red-600 text-white font-bold px-4 py-1 rounded hover:bg-red-500 transition-colors text-sm ml-auto"
                >
                  Delete
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Categories List */}
        <div className="bg-gray-900/50 border-y-2 border-yellow-500/50 px-8 py-4 w-full">
          <h2 className="text-xl font-bold text-yellow-500 mb-3">Existing Categories</h2>
          
          {categories && categories.length > 0 ? (
            <div className="overflow-x-auto w-full">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-yellow-500/30">
                    <th className="text-left py-2 px-3 text-gray-400 text-xs font-semibold whitespace-nowrap">Name</th>
                    <th className="text-left py-2 px-3 text-gray-400 text-xs font-semibold whitespace-nowrap">Category</th>
                    <th className="text-left py-2 px-3 text-gray-400 text-xs font-semibold whitespace-nowrap">Unit Type</th>
                    <th className="text-left py-2 px-3 text-gray-400 text-xs font-semibold whitespace-nowrap">Application</th>
                    <th className="text-left py-2 px-3 text-gray-400 text-xs font-semibold whitespace-nowrap">Tier Range</th>
                    <th className="text-left py-2 px-3 text-gray-400 text-xs font-semibold min-w-[200px]">Description</th>
                    <th className="text-left py-2 px-3 text-gray-400 text-xs font-semibold text-center">Status</th>
                    <th className="text-left py-2 px-3 text-gray-400 text-xs font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Group categories by type */}
                  {(() => {
                    const groupedCategories = {
                      gold: categories.filter(c => c.category === "gold" || c.category === "market"),
                      essence: categories.filter(c => c.category === "essence"),
                      looter: categories.filter(c => c.category === "rarity_bias" || c.category === "reward_chance" || c.category === "xp"),
                      other: categories.filter(c => c.category === "mek_slot"),
                    };

                    return (
                      <>
                        {/* Gold & Market Buffs */}
                        {groupedCategories.gold.length > 0 && (
                          <>
                            <tr>
                              <td colSpan={8} className="bg-yellow-500/10 px-3 py-1 border-y border-yellow-500/30">
                                <span className="text-yellow-500 font-bold text-xs uppercase">Gold & Market</span>
                              </td>
                            </tr>
                            {groupedCategories.gold.map((category) => {
                              const categoryLabel = categoryOptions.find(c => c.value === category.category)?.label || category.category || "-";
                              const unitTypeLabel = unitTypeOptions.find(u => u.value === category.unitType)?.label || category.unitType || "-";
                              const applicationLabel = applicationTypeOptions.find(a => a.value === category.applicationType)?.label || category.applicationType || "Universal";
                              
                              return (
                      <tr key={category._id} className="border-b border-gray-800 hover:bg-gray-800/30">
                        <td className="py-2 px-3 font-semibold text-sm whitespace-nowrap">
                          <button
                            onClick={() => handleEdit(category)}
                            className="text-yellow-500 hover:text-yellow-400 text-left"
                          >
                            {category.name}
                          </button>
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                            {categoryLabel}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-sm whitespace-nowrap">
                          <span className={category.unitType ? "text-yellow-500" : "text-gray-500"}>
                            {unitTypeLabel}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            category.applicationType === "universal" 
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-orange-500/20 text-orange-400"
                          }`}>
                            {applicationLabel}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          {category.tierStart === 1 && category.tierEnd === 10 ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                              All Tiers (1-10)
                            </span>
                          ) : category.tierStart && category.tierEnd ? (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                              T{category.tierStart}-T{category.tierEnd}
                            </span>
                          ) : category.tierStart ? (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                              T{category.tierStart}+
                            </span>
                          ) : (
                            <span className="text-gray-500 text-xs">T1-T1</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-sm text-gray-400" title={category.description || "-"}>
                          <div className="truncate max-w-lg">{category.description || "-"}</div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              category.isActive
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {category.isActive ? "✓" : "✗"}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <button
                            onClick={() => handleEdit(category)}
                            className="text-yellow-500 hover:text-yellow-400 text-sm font-medium"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                              );
                            })}
                          </>
                        )}

                        {/* Essence Buffs */}
                        {groupedCategories.essence.length > 0 && (
                          <>
                            <tr>
                              <td colSpan={8} className="bg-purple-500/10 px-3 py-1 border-y border-purple-500/30">
                                <span className="text-purple-500 font-bold text-xs uppercase">Essence</span>
                              </td>
                            </tr>
                            {groupedCategories.essence.map((category) => {
                              const categoryLabel = categoryOptions.find(c => c.value === category.category)?.label || category.category || "-";
                              const unitTypeLabel = unitTypeOptions.find(u => u.value === category.unitType)?.label || category.unitType || "-";
                              const applicationLabel = applicationTypeOptions.find(a => a.value === category.applicationType)?.label || category.applicationType || "Universal";
                              
                              return (
                                <tr key={category._id} className="border-b border-gray-800 hover:bg-gray-800/30">
                                  <td className="py-2 px-3 font-semibold text-sm whitespace-nowrap">
                                    <button
                                      onClick={() => handleEdit(category)}
                                      className="text-yellow-500 hover:text-yellow-400 text-left"
                                    >
                                      {category.name}
                                    </button>
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                                      {categoryLabel}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-sm">
                                    <span className={category.unitType ? "text-yellow-500" : "text-gray-500"}>
                                      {unitTypeLabel}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      category.applicationType === "universal" 
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "bg-orange-500/20 text-orange-400"
                                    }`}>
                                      {applicationLabel}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3">
                                    {category.tierStart === 1 && category.tierEnd === 10 ? (
                                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                                        All Tiers (1-10)
                                      </span>
                                    ) : category.tierStart && category.tierEnd ? (
                                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                                        T{category.tierStart}-T{category.tierEnd}
                                      </span>
                                    ) : category.tierStart ? (
                                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                                        T{category.tierStart}+
                                      </span>
                                    ) : (
                                      <span className="text-gray-500 text-xs">T1-T1</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-sm text-gray-400" title={category.description || "-"}>
                                    <div className="truncate max-w-lg">{category.description || "-"}</div>
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-semibold ${
                                        category.isActive
                                          ? "bg-green-500/20 text-green-400"
                                          : "bg-red-500/20 text-red-400"
                                      }`}
                                    >
                                      {category.isActive ? "✓" : "✗"}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3">
                                    <button
                                      onClick={() => handleEdit(category)}
                                      className="text-yellow-500 hover:text-yellow-400 text-sm font-medium"
                                    >
                                      Edit
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </>
                        )}

                        {/* Looter Buffs (Rarity, Rewards, XP) */}
                        {groupedCategories.looter.length > 0 && (
                          <>
                            <tr>
                              <td colSpan={8} className="bg-blue-500/10 px-3 py-1 border-y border-blue-500/30">
                                <span className="text-blue-500 font-bold text-xs uppercase">Looter & Rewards</span>
                              </td>
                            </tr>
                            {groupedCategories.looter.map((category) => {
                              const categoryLabel = categoryOptions.find(c => c.value === category.category)?.label || category.category || "-";
                              const unitTypeLabel = unitTypeOptions.find(u => u.value === category.unitType)?.label || category.unitType || "-";
                              const applicationLabel = applicationTypeOptions.find(a => a.value === category.applicationType)?.label || category.applicationType || "Universal";
                              
                              return (
                                <tr key={category._id} className="border-b border-gray-800 hover:bg-gray-800/30">
                                  <td className="py-2 px-3 font-semibold text-sm whitespace-nowrap">
                                    <button
                                      onClick={() => handleEdit(category)}
                                      className="text-yellow-500 hover:text-yellow-400 text-left"
                                    >
                                      {category.name}
                                    </button>
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                                      {categoryLabel}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-sm">
                                    <span className={category.unitType ? "text-yellow-500" : "text-gray-500"}>
                                      {unitTypeLabel}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      category.applicationType === "universal" 
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "bg-orange-500/20 text-orange-400"
                                    }`}>
                                      {applicationLabel}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3">
                                    {category.tierStart === 1 && category.tierEnd === 10 ? (
                                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                                        All Tiers (1-10)
                                      </span>
                                    ) : category.tierStart && category.tierEnd ? (
                                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                                        T{category.tierStart}-T{category.tierEnd}
                                      </span>
                                    ) : category.tierStart ? (
                                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                                        T{category.tierStart}+
                                      </span>
                                    ) : (
                                      <span className="text-gray-500 text-xs">T1-T1</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-sm text-gray-400" title={category.description || "-"}>
                                    <div className="truncate max-w-lg">{category.description || "-"}</div>
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-semibold ${
                                        category.isActive
                                          ? "bg-green-500/20 text-green-400"
                                          : "bg-red-500/20 text-red-400"
                                      }`}
                                    >
                                      {category.isActive ? "✓" : "✗"}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3">
                                    <button
                                      onClick={() => handleEdit(category)}
                                      className="text-yellow-500 hover:text-yellow-400 text-sm font-medium"
                                    >
                                      Edit
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </>
                        )}

                        {/* Other Buffs */}
                        {groupedCategories.other.length > 0 && (
                          <>
                            <tr>
                              <td colSpan={8} className="bg-gray-500/10 px-3 py-1 border-y border-gray-500/30">
                                <span className="text-gray-400 font-bold text-xs uppercase">Other</span>
                              </td>
                            </tr>
                            {groupedCategories.other.map((category) => {
                              const categoryLabel = categoryOptions.find(c => c.value === category.category)?.label || category.category || "-";
                              const unitTypeLabel = unitTypeOptions.find(u => u.value === category.unitType)?.label || category.unitType || "-";
                              const applicationLabel = applicationTypeOptions.find(a => a.value === category.applicationType)?.label || category.applicationType || "Universal";
                              
                              return (
                                <tr key={category._id} className="border-b border-gray-800 hover:bg-gray-800/30">
                                  <td className="py-2 px-3 font-semibold text-sm whitespace-nowrap">
                                    <button
                                      onClick={() => handleEdit(category)}
                                      className="text-yellow-500 hover:text-yellow-400 text-left"
                                    >
                                      {category.name}
                                    </button>
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                                      {categoryLabel}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-sm">
                                    <span className={category.unitType ? "text-yellow-500" : "text-gray-500"}>
                                      {unitTypeLabel}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      category.applicationType === "universal" 
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "bg-orange-500/20 text-orange-400"
                                    }`}>
                                      {applicationLabel}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3">
                                    {category.tierStart === 1 && category.tierEnd === 10 ? (
                                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                                        All Tiers (1-10)
                                      </span>
                                    ) : category.tierStart && category.tierEnd ? (
                                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                                        T{category.tierStart}-T{category.tierEnd}
                                      </span>
                                    ) : category.tierStart ? (
                                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                                        T{category.tierStart}+
                                      </span>
                                    ) : (
                                      <span className="text-gray-500 text-xs">T1-T1</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-sm text-gray-400" title={category.description || "-"}>
                                    <div className="truncate max-w-lg">{category.description || "-"}</div>
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-semibold ${
                                        category.isActive
                                          ? "bg-green-500/20 text-green-400"
                                          : "bg-red-500/20 text-red-400"
                                      }`}
                                    >
                                      {category.isActive ? "✓" : "✗"}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3">
                                    <button
                                      onClick={() => handleEdit(category)}
                                      className="text-yellow-500 hover:text-yellow-400 text-sm font-medium"
                                    >
                                      Edit
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </>
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">No buff categories created yet.</p>
          )}
        </div>

        {/* Mechanism Tier Configuration Section */}
        <div className="bg-gray-900/50 border-y-2 border-yellow-500/50 px-8 py-4 w-full mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-yellow-500">Mechanism Tier Configuration</h2>
            <button
              onClick={() => setShowTierConfig(!showTierConfig)}
              className="bg-yellow-500 text-black font-bold px-3 py-1 rounded hover:bg-yellow-400 transition-colors text-sm"
            >
              {showTierConfig ? "Hide" : "Show"} Configuration
            </button>
          </div>
          
          {showTierConfig && mechanismTiers && (
            <div>
              <p className="text-sm text-gray-400 mb-3">
                Define how the 4000 mechanism ranks are divided into 10 tiers. These tiers determine which buffs can be applied to specific mechanisms.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                {mechanismTiers.map((tier) => {
                  const isEditing = editingTierId === tier._id;
                  return (
                    <div key={tier._id} className="bg-black/50 border border-yellow-500/30 rounded p-2">
                      <div className="text-yellow-500 font-bold text-sm mb-1">Tier {tier.tier}</div>
                      {isEditing ? (
                        <div>
                          <input
                            type="number"
                            value={tierFormData.startRank}
                            onChange={(e) => setTierFormData({ ...tierFormData, startRank: Number(e.target.value) })}
                            className="w-full bg-black/50 border border-yellow-500/30 rounded px-1 py-0.5 text-white text-xs mb-1"
                            placeholder="Start"
                          />
                          <input
                            type="number"
                            value={tierFormData.endRank}
                            onChange={(e) => setTierFormData({ ...tierFormData, endRank: Number(e.target.value) })}
                            className="w-full bg-black/50 border border-yellow-500/30 rounded px-1 py-0.5 text-white text-xs mb-1"
                            placeholder="End"
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleTierUpdate(tier)}
                              className="bg-green-500 text-black text-xs px-2 py-0.5 rounded flex-1"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingTierId(null)}
                              className="bg-gray-600 text-white text-xs px-2 py-0.5 rounded flex-1"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs text-gray-400">Ranks {tier.startRank}-{tier.endRank}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {tier.endRank - tier.startRank + 1} mechs
                          </div>
                          <button
                            onClick={() => {
                              setEditingTierId(tier._id);
                              setTierFormData({ startRank: tier.startRank, endRank: tier.endRank });
                            }}
                            className="text-yellow-500 hover:text-yellow-400 text-xs mt-1"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => resetTiers()}
                  className="bg-gray-700 text-white font-bold px-3 py-1 rounded hover:bg-gray-600 transition-colors text-sm"
                >
                  Reset to Defaults
                </button>
                <span className="text-xs text-gray-500 py-1">
                  Tier ranges affect which mechanisms and universal chips can receive specific buffs
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}