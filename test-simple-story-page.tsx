"use client";

import { useState } from "react";

export default function SimpleStoryClimbTest() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Two Column Layout Test */}
      <div className="flex h-screen">
        {/* Left Column - Tree Canvas */}
        <div className="w-2/3 bg-gray-900 border-r border-yellow-500/30 relative">
          <h2 className="text-yellow-500 text-xl p-4">Tree Canvas (Left)</h2>
          <div className="p-4">
            <div className="w-full h-96 bg-black/50 border border-yellow-500/20 flex items-center justify-center">
              <p className="text-yellow-500">Canvas area would go here</p>
            </div>
          </div>
        </div>

        {/* Right Column - Details Pane */}
        <div className="w-1/3 bg-gray-800 relative">
          <h2 className="text-yellow-500 text-xl p-4">Details Pane (Right)</h2>
          <div className="p-4">
            <div className="bg-black/50 border border-yellow-500/20 p-4">
              <p className="text-white">Mission details would appear here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}