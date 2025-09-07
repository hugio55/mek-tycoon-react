'use client';

import React from 'react';

interface TreeNode {
  name: string;
  tier: number;
  branches?: TreeNode[];
}

export default function CraftingTreeVisual() {
  const accordionTree: TreeNode = {
    name: "Accordion",
    tier: 1,
    branches: [
      {
        name: "Gatling",
        tier: 2,
        branches: [
          { name: "Bark", tier: 3 },
          { name: "Cadillac", tier: 3 },
          { name: "Bumblebee", tier: 3 },
          { name: "Snow", tier: 3 },
        ]
      }
    ]
  };

  const getVariationImage = (name: string) => {
    const sanitized = name.toLowerCase().replace(' ', '_').replace("'", "").replace("?", "q");
    return `/variation-images/${sanitized}.png`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-8 bg-black/50 rounded-lg">
      <h2 className="text-2xl font-bold text-yellow-400 mb-8 text-center font-orbitron">
        Accordion Crafting Tree
      </h2>
      
      <div className="flex flex-col items-center space-y-8">
        {/* Root: Accordion */}
        <div className="flex flex-col items-center">
          <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-lg p-4 hover:bg-yellow-500/30 transition-all">
            <img 
              src={getVariationImage(accordionTree.name)}
              alt={accordionTree.name}
              className="w-24 h-24 object-contain mb-2"
            />
            <p className="text-yellow-400 font-bold text-center">{accordionTree.name}</p>
          </div>
          
          {/* Arrow down */}
          <div className="w-0.5 h-12 bg-green-500 relative">
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-green-500"></div>
            </div>
          </div>
        </div>

        {/* Tier 2: Gatling */}
        <div className="flex flex-col items-center">
          <div className="bg-green-500/20 border-2 border-green-500 rounded-lg p-4 hover:bg-green-500/30 transition-all">
            <img 
              src={getVariationImage("Gatling")}
              alt="Gatling"
              className="w-24 h-24 object-contain mb-2"
            />
            <p className="text-green-400 font-bold text-center">Gatling</p>
          </div>
          
          {/* Branch connector */}
          <div className="w-0.5 h-8 bg-gray-500"></div>
          <div className="w-96 h-0.5 bg-gray-500 relative">
            <div className="absolute left-0 top-0 w-0.5 h-8 bg-gray-500"></div>
            <div className="absolute left-1/4 top-0 w-0.5 h-8 bg-gray-500"></div>
            <div className="absolute left-1/2 top-0 w-0.5 h-8 bg-gray-500"></div>
            <div className="absolute left-3/4 top-0 w-0.5 h-8 bg-gray-500"></div>
            <div className="absolute right-0 top-0 w-0.5 h-8 bg-gray-500"></div>
          </div>
        </div>

        {/* Tier 3: Branches */}
        <div className="flex space-x-8 justify-center">
          {accordionTree.branches?.[0]?.branches?.map((branch, index) => (
            <div key={branch.name} className="flex flex-col items-center">
              <div className="bg-gray-700/30 border-2 border-gray-500 rounded-lg p-3 hover:bg-gray-600/40 transition-all">
                <img 
                  src={getVariationImage(branch.name)}
                  alt={branch.name}
                  className="w-20 h-20 object-contain mb-2"
                />
                <p className="text-gray-300 font-semibold text-center text-sm">{branch.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 p-4 bg-gray-800/50 rounded-lg">
        <h3 className="text-yellow-400 font-bold mb-3">Crafting Requirements:</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-400">Accordion → Gatling:</span>
            <span>250 Gold, 5 Mechanical, 3 Metal Essence</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-400">Gatling → Bark:</span>
            <span>400 Gold, 4 Nature, 6 Wood Essence</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-400">Gatling → Cadillac:</span>
            <span>500 Gold, 5 Luxury, 5 Metal Essence</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-400">Gatling → Bumblebee:</span>
            <span>350 Gold, 3 Nature, 4 Candy Essence</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-400">Gatling → Snow:</span>
            <span>450 Gold, 6 Frost, 2 Crystal Essence</span>
          </div>
        </div>
      </div>
    </div>
  );
}