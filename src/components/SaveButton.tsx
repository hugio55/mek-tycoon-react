"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function SaveButton() {
  const [isSaving, setIsSaving] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const createSave = useMutation(api.saves.createSave);

  const handleSave = async () => {
    setIsSaving(true);
    setShowMessage(false);

    try {
      // Generate automatic save name with timestamp
      const now = new Date();
      const saveName = `Save_${now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}_${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '')}`.replace(/[,\s]/g, '_');

      // Use fetch to call our API endpoint
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName,
          description: `Automatic save on ${now.toLocaleString()}`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Record in database
        await createSave({
          name: saveName,
          description: `Automatic save on ${now.toLocaleString()}`,
          filesCount: result.filesCount,
          sizeInBytes: result.sizeInBytes,
        });

        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
      }
    } catch (error) {
      console.error('Error creating save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={`px-4 py-2 rounded-lg font-bold transition-all ${
          isSaving
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-600 hover:to-yellow-700 shadow-lg hover:shadow-yellow-500/30 hover:scale-105'
        }`}
      >
        {isSaving ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⚙️</span>
            Saving...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            💾 <span>SAVE</span>
          </span>
        )}
      </button>

      {showMessage && (
        <div className="absolute top-full mt-2 right-0 bg-green-900/90 border border-green-500 text-green-400 px-4 py-2 rounded-lg whitespace-nowrap">
          Save created successfully!
        </div>
      )}
    </div>
  );
}