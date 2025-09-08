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
  applicationType?: "universal" | "mek" | "chip" | "item" | "talent";
  isActive?: boolean;
  createdAt: number;
  updatedAt: number;
}

export default function BuffCategoriesPage() {
  const categories = useQuery(api.buffCategories.getAll);
  const createCategory = useMutation(api.buffCategories.create);
  const updateCategory = useMutation(api.buffCategories.update);
  const deleteCategory = useMutation(api.buffCategories.remove);

  const [editingId, setEditingId] = useState<Id<"buffCategories"> | null>(null);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">("synced");
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "gold" as BuffCategory["category"],
    unitType: "flat_number" as BuffCategory["unitType"],
    applicationType: "universal" as BuffCategory["applicationType"],
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "gold",
      unitType: "flat_number",
      applicationType: "universal",
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
    { value: "mek", label: "Mek-Specific" },
    { value: "chip", label: "Chip-Based" },
    { value: "item", label: "Item-Based" },
    { value: "talent", label: "Talent Tree" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncStatus("syncing");
    
    try {
      if (editingId) {
        await updateCategory({
          id: editingId,
          ...formData,
        });
      } else {
        await createCategory(formData);
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
      isActive: category.isActive !== false,
    });
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
    }
  }, [categories]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sync Status Bar */}
      <div className="fixed top-0 left-0 right-0 bg-gray-900/95 border-b border-yellow-500/30 px-4 py-1 z-50">
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
            {syncStatus === "synced" && (
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
      
      <div className="pt-12">
        <h1 className="text-3xl font-bold text-yellow-500 uppercase tracking-wider mb-3 px-4">
          Admin - Buff Categories
        </h1>

        {/* Form Section */}
        <div className="bg-gray-900/50 border-y-2 border-yellow-500/50 px-4 py-3 mb-3">
          <h2 className="text-xl font-bold text-yellow-500 mb-3">
            {editingId ? "Edit Category" : "Add New Category"}
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2">
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
            
            <div className="col-span-full xl:col-span-3">
              <label className="block text-xs text-gray-400 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-black/50 border border-yellow-500/30 rounded px-3 py-1 text-white text-sm"
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
            </div>
          </form>
        </div>

        {/* Categories List */}
        <div className="bg-gray-900/50 border-y-2 border-yellow-500/50 px-4 py-3">
          <h2 className="text-xl font-bold text-yellow-500 mb-3">Existing Categories</h2>
          
          {categories && categories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-yellow-500/30">
                    <th className="text-left py-2 px-2 text-gray-400 text-xs font-semibold">Name</th>
                    <th className="text-left py-2 px-2 text-gray-400 text-xs font-semibold">Category</th>
                    <th className="text-left py-2 px-2 text-gray-400 text-xs font-semibold">Unit Type</th>
                    <th className="text-left py-2 px-2 text-gray-400 text-xs font-semibold">Application</th>
                    <th className="text-left py-2 px-2 text-gray-400 text-xs font-semibold">Description</th>
                    <th className="text-left py-2 px-2 text-gray-400 text-xs font-semibold">Status</th>
                    <th className="text-left py-2 px-2 text-gray-400 text-xs font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => {
                    const categoryLabel = categoryOptions.find(c => c.value === category.category)?.label || category.category || "-";
                    const unitTypeLabel = unitTypeOptions.find(u => u.value === category.unitType)?.label || category.unitType || "-";
                    const applicationLabel = applicationTypeOptions.find(a => a.value === category.applicationType)?.label || category.applicationType || "Universal";
                    
                    return (
                      <tr key={category._id} className="border-b border-gray-800 hover:bg-gray-800/30">
                        <td className="py-2 px-2 font-semibold text-sm">{category.name}</td>
                        <td className="py-2 px-2">
                          <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                            {categoryLabel}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-sm">
                          <span className={category.unitType ? "text-yellow-500" : "text-gray-500"}>
                            {unitTypeLabel}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            category.applicationType === "universal" 
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-orange-500/20 text-orange-400"
                          }`}>
                            {applicationLabel}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-sm text-gray-400" title={category.description || "-"}>
                          <div className="truncate max-w-xs">{category.description || "-"}</div>
                        </td>
                        <td className="py-2 px-2">
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
                        <td className="py-2 px-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(category)}
                              className="text-yellow-500 hover:text-yellow-400 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(category._id)}
                              className="text-red-500 hover:text-red-400 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">No buff categories created yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}