"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import SuccessBuffConfig from "@/components/SuccessBuffConfig";

interface BuffCategory {
  _id: Id<"buffCategories">;
  name: string;
  description?: string;
  category: "gold" | "essence" | "rarity_bias" | "xp" | "mek_slot" | "market" | "reward_chance" | "success";
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

export default function BuffCategoriesAdmin() {
  const [editingId, setEditingId] = useState<Id<"buffCategories"> | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuccessConfig, setShowSuccessConfig] = useState(false);
  const [selectedSuccessBuffId, setSelectedSuccessBuffId] = useState<string | undefined>();

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
    setShowEditModal(false);
  };

  const categoryOptions = [
    { value: "gold", label: "Gold" },
    { value: "essence", label: "Essence" },
    { value: "rarity_bias", label: "Rarity Bias" },
    { value: "xp", label: "XP" },
    { value: "mek_slot", label: "Mek Slot" },
    { value: "market", label: "Market" },
    { value: "reward_chance", label: "Reward Chance" },
    { value: "success", label: "Success Rate" },
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
    setShowEditModal(true);
  };

  const handleDelete = async (id: Id<"buffCategories">) => {
    if (confirm("Are you sure you want to delete this buff category?")) {
      setSyncStatus("syncing");
      try {
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
    <div className="space-y-4">
      {/* Form Section */}
      <div className="bg-gray-900/50 border-2 border-yellow-500/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-yellow-500">
            {editingId ? "Edit Category" : "Add New Category"}
          </h3>
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

        <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
              {categoryOptions.map((opt: any) => (
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
              {unitTypeOptions.map((opt: any) => (
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
              {applicationTypeOptions.map((opt: any) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Tier Start</label>
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
              className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Tier End</label>
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
              className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1 text-white text-sm"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1 text-white text-sm"
            />
          </div>

          <div className="flex items-center gap-2 col-span-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, tierStart: 1, tierEnd: 10 })}
              className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors text-sm"
            >
              All Tiers
            </button>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded w-3 h-3"
              />
              <span className="text-xs text-white">Active</span>
            </label>
          </div>

          <div className="col-span-full flex gap-2">
            <button
              type="submit"
              className="bg-yellow-500 text-black font-bold px-4 py-1 rounded hover:bg-yellow-400 transition-colors text-sm"
            >
              {editingId ? "Update" : "Create"} Category
            </button>

            {editingId && (
              <>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-700 text-white font-bold px-4 py-1 rounded hover:bg-gray-600 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(editingId)}
                  className="bg-red-600 text-white font-bold px-4 py-1 rounded hover:bg-red-500 transition-colors text-sm"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-gray-900/50 border-2 border-yellow-500/50 rounded-lg p-4">
        <h3 className="text-lg font-bold text-yellow-500 mb-3">Existing Categories</h3>

        {categories && categories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-yellow-500/30">
                  <th className="text-left py-2 px-3 text-gray-400 text-xs font-semibold">Name</th>
                  <th className="text-left py-2 px-3 text-gray-400 text-xs font-semibold">Category</th>
                  <th className="text-left py-2 px-3 text-gray-400 text-xs font-semibold">Unit Type</th>
                  <th className="text-left py-2 px-3 text-gray-400 text-xs font-semibold">Application</th>
                  <th className="text-left py-2 px-3 text-gray-400 text-xs font-semibold">Tier Range</th>
                  <th className="text-left py-2 px-3 text-gray-400 text-xs font-semibold">Description</th>
                  <th className="text-center py-2 px-3 text-gray-400 text-xs font-semibold">Status</th>
                  <th className="text-left py-2 px-3 text-gray-400 text-xs font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Group categories by type */}
                {(() => {
                  const groupedCategories = {
                    success: categories.filter((c: any) => c.category === "success"),
                    gold: categories.filter((c: any) => c.category === "gold" || c.category === "market"),
                    essence: categories.filter((c: any) => c.category === "essence"),
                    looter: categories.filter((c: any) => c.category === "rarity_bias" || c.category === "reward_chance" || c.category === "xp"),
                    other: categories.filter((c: any) => c.category === "mek_slot"),
                  };

                  return (
                    <>
                      {/* Success Rate Buffs */}
                      {groupedCategories.success.length > 0 && (
                        <>
                          <tr>
                            <td colSpan={8} className="bg-green-500/10 px-3 py-1 border-y border-green-500/30">
                              <div className="flex justify-between items-center">
                                <span className="text-green-500 font-bold text-xs uppercase">Success Rate</span>
                                <button
                                  onClick={() => setShowSuccessConfig(true)}
                                  className="bg-green-600/30 hover:bg-green-600/50 text-green-400 text-xs px-3 py-1 rounded font-semibold transition-colors"
                                >
                                  Configure Curve
                                </button>
                              </div>
                            </td>
                          </tr>
                          {groupedCategories.success.map((category) => (
                            <tr key={category._id} className="border-b border-gray-800 hover:bg-gray-800/30">
                              <td className="py-2 px-3 font-semibold text-sm">
                                <button
                                  onClick={() => handleEdit(category)}
                                  className="text-yellow-500 hover:text-yellow-400 text-left"
                                >
                                  {category.name}
                                </button>
                              </td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-1 bg-green-700/30 rounded text-xs text-green-400">Success</span>
                              </td>
                              <td className="py-2 px-3 text-sm">
                                <span className="text-yellow-500">{unitTypeOptions.find((u: any) => u.value === category.unitType)?.label}</span>
                              </td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                                  {category.applicationType === "universal" ? "Universal" : "Attachable"}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                {category.tierStart === 1 && category.tierEnd === 10 ? (
                                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">All Tiers</span>
                                ) : (
                                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                                    T{category.tierStart}-T{category.tierEnd}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-sm text-gray-400">{category.description || "-"}</td>
                              <td className="py-2 px-3 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  category.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                }`}>
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
                          ))}
                        </>
                      )}

                      {/* Gold & Market Buffs */}
                      {groupedCategories.gold.length > 0 && (
                        <>
                          <tr>
                            <td colSpan={8} className="bg-yellow-500/10 px-3 py-1 border-y border-yellow-500/30">
                              <span className="text-yellow-500 font-bold text-xs uppercase">Gold & Market</span>
                            </td>
                          </tr>
                          {groupedCategories.gold.map((category) => (
                            <tr key={category._id} className="border-b border-gray-800 hover:bg-gray-800/30">
                              <td className="py-2 px-3 font-semibold text-sm">
                                <button
                                  onClick={() => handleEdit(category)}
                                  className="text-yellow-500 hover:text-yellow-400 text-left"
                                >
                                  {category.name}
                                </button>
                              </td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                                  {categoryOptions.find((c: any) => c.value === category.category)?.label}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-sm">
                                <span className="text-yellow-500">{unitTypeOptions.find((u: any) => u.value === category.unitType)?.label}</span>
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  category.applicationType === "universal"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-orange-500/20 text-orange-400"
                                }`}>
                                  {category.applicationType === "universal" ? "Universal" : "Attachable"}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                {category.tierStart === 1 && category.tierEnd === 10 ? (
                                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">All Tiers</span>
                                ) : (
                                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                                    T{category.tierStart}-T{category.tierEnd}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-sm text-gray-400">{category.description || "-"}</td>
                              <td className="py-2 px-3 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  category.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                }`}>
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
                          ))}
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
                          {groupedCategories.essence.map((category) => (
                            <tr key={category._id} className="border-b border-gray-800 hover:bg-gray-800/30">
                              <td className="py-2 px-3 font-semibold text-sm">
                                <button
                                  onClick={() => handleEdit(category)}
                                  className="text-yellow-500 hover:text-yellow-400 text-left"
                                >
                                  {category.name}
                                </button>
                              </td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                                  {categoryOptions.find((c: any) => c.value === category.category)?.label}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-sm">
                                <span className="text-yellow-500">{unitTypeOptions.find((u: any) => u.value === category.unitType)?.label}</span>
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  category.applicationType === "universal"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-orange-500/20 text-orange-400"
                                }`}>
                                  {category.applicationType === "universal" ? "Universal" : "Attachable"}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                {category.tierStart === 1 && category.tierEnd === 10 ? (
                                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">All Tiers</span>
                                ) : (
                                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                                    T{category.tierStart}-T{category.tierEnd}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-sm text-gray-400">{category.description || "-"}</td>
                              <td className="py-2 px-3 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  category.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                }`}>
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
                          ))}
                        </>
                      )}

                      {/* Looter & Rewards Buffs */}
                      {groupedCategories.looter.length > 0 && (
                        <>
                          <tr>
                            <td colSpan={8} className="bg-blue-500/10 px-3 py-1 border-y border-blue-500/30">
                              <span className="text-blue-500 font-bold text-xs uppercase">Looter & Rewards</span>
                            </td>
                          </tr>
                          {groupedCategories.looter.map((category) => (
                            <tr key={category._id} className="border-b border-gray-800 hover:bg-gray-800/30">
                              <td className="py-2 px-3 font-semibold text-sm">
                                <button
                                  onClick={() => handleEdit(category)}
                                  className="text-yellow-500 hover:text-yellow-400 text-left"
                                >
                                  {category.name}
                                </button>
                              </td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                                  {categoryOptions.find((c: any) => c.value === category.category)?.label}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-sm">
                                <span className="text-yellow-500">{unitTypeOptions.find((u: any) => u.value === category.unitType)?.label}</span>
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  category.applicationType === "universal"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-orange-500/20 text-orange-400"
                                }`}>
                                  {category.applicationType === "universal" ? "Universal" : "Attachable"}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                {category.tierStart === 1 && category.tierEnd === 10 ? (
                                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">All Tiers</span>
                                ) : (
                                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                                    T{category.tierStart}-T{category.tierEnd}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-sm text-gray-400">{category.description || "-"}</td>
                              <td className="py-2 px-3 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  category.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                }`}>
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
                          ))}
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
                          {groupedCategories.other.map((category) => (
                            <tr key={category._id} className="border-b border-gray-800 hover:bg-gray-800/30">
                              <td className="py-2 px-3 font-semibold text-sm">
                                <button
                                  onClick={() => handleEdit(category)}
                                  className="text-yellow-500 hover:text-yellow-400 text-left"
                                >
                                  {category.name}
                                </button>
                              </td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                                  {categoryOptions.find((c: any) => c.value === category.category)?.label}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-sm">
                                <span className="text-yellow-500">{unitTypeOptions.find((u: any) => u.value === category.unitType)?.label}</span>
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  category.applicationType === "universal"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-orange-500/20 text-orange-400"
                                }`}>
                                  {category.applicationType === "universal" ? "Universal" : "Attachable"}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                {category.tierStart === 1 && category.tierEnd === 10 ? (
                                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">All Tiers</span>
                                ) : (
                                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                                    T{category.tierStart}-T{category.tierEnd}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-sm text-gray-400">{category.description || "-"}</td>
                              <td className="py-2 px-3 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  category.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                }`}>
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
                          ))}
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

      {/* Success Buff Configuration Modal */}
      <SuccessBuffConfig
        isOpen={showSuccessConfig}
        onClose={() => {
          setShowSuccessConfig(false);
          setSelectedSuccessBuffId(undefined);
        }}
        buffCategoryId={selectedSuccessBuffId}
      />
    </div>
  );
}