"use client";

import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState } from "react";
import Link from "next/link";

export default function MigrateBuffCategoriesPage() {
  const deleteOld = useMutation(api.migrateBuffCategories.deleteAllOldBuffCategories);
  const seedNew = useMutation(api.seedBuffCategories.seedAll);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleMigrate = async () => {
    setLoading(true);
    setResult("Starting migration...");
    
    try {
      // Step 1: Delete all old categories
      const deleteResult = await deleteOld();
      setResult(`Step 1: ${deleteResult.message}`);
      
      // Wait a moment for Convex to process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 2: Seed new categories
      const seedResult = await seedNew();
      setResult(`Migration Complete!\n${deleteResult.message}\n${seedResult.message}`);
      
    } catch (error) {
      setResult(`Error during migration: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-500 uppercase tracking-wider mb-8">
          Migrate Buff Categories
        </h1>

        <div className="bg-gray-900/50 border-2 border-yellow-500/50 rounded-lg p-6">
          <div className="bg-red-900/30 border border-red-500 rounded p-4 mb-6">
            <h2 className="text-red-400 font-bold mb-2">⚠️ Warning</h2>
            <p className="text-gray-300">
              This will DELETE all existing buff categories and replace them with the new schema format.
              This action cannot be undone.
            </p>
          </div>

          <p className="text-gray-300 mb-6">
            This migration will:
          </p>
          <ol className="list-decimal list-inside text-gray-400 mb-6 space-y-2">
            <li>Delete all existing buff categories (old schema)</li>
            <li>Create new buff categories with category and unit type fields</li>
          </ol>

          <button
            onClick={handleMigrate}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Migrating..." : "Run Migration"}
          </button>

          {result && (
            <div className={`mt-6 p-4 rounded whitespace-pre-line ${
              result.includes("Error") 
                ? "bg-red-900/30 text-red-400" 
                : result.includes("Complete")
                ? "bg-green-900/30 text-green-400"
                : "bg-blue-900/30 text-blue-400"
            }`}>
              {result}
            </div>
          )}

          <div className="mt-6 flex gap-4">
            <Link href="/admin/buff-categories" className="text-yellow-500 hover:text-yellow-400">
              ← Back to Buff Categories
            </Link>
            <Link href="/admin/buff-categories/seed" className="text-yellow-500 hover:text-yellow-400">
              Go to Seed Page →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}