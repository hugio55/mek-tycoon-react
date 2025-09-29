"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Example component showing how to use the node fee system in Story Climb
export default function NodeFeeExample() {
  // Example: Get fee for a specific node
  const exampleNodeType = 'normal' as const;
  const treeProgress = 75; // 75% through the tree
  const nodeIndex = 15; // The 15th node in the tree

  // Query the calculated fee for this specific node
  const calculatedFee = useQuery(api.nodeFees.calculateNodeFee, {
    nodeType: exampleNodeType,
    treeProgress: treeProgress,
    nodeIndex: nodeIndex
  });

  // Get the base configuration for reference
  const baseConfig = useQuery(api.nodeFees.getNodeFee, {
    nodeType: exampleNodeType
  });

  return (
    <div className="p-4 bg-black/50 rounded-lg border border-gray-700 space-y-4">
      <h3 className="text-lg font-bold text-purple-400">Node Fee Integration Example</h3>

      <div className="text-sm text-gray-300 space-y-2">
        <div className="font-semibold text-yellow-400">How to use in Story Climb:</div>

        <div className="bg-black/30 p-3 rounded text-xs font-mono">
          <div className="text-green-400">// In your Story Climb component:</div>
          <div>const fee = useQuery(api.nodeFees.calculateNodeFee, {"{"}</div>
          <div className="ml-4">nodeType: node.type,</div>
          <div className="ml-4">treeProgress: (nodeIndex / totalNodes) * 100,</div>
          <div className="ml-4">nodeIndex: nodeIndex</div>
          <div>{"}"});</div>
          <div className="mt-2">
            <div className="text-green-400">// Fee contains:</div>
            <div>// - gold: number (calculated cost)</div>
            <div>// - essence: {"{"} shouldSpawn, minRank, maxRank, quantity {"}"}</div>
            <div>// - chip: {"{"} type, tier {"}"}</div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-3">
          <div className="font-semibold text-blue-400">Example Result for Node #{nodeIndex}:</div>
          {calculatedFee ? (
            <div className="mt-2 space-y-1">
              <div>Type: {calculatedFee.nodeType}</div>
              <div>Progress: {treeProgress}% through tree</div>
              {calculatedFee.gold && <div>Gold Cost: {calculatedFee.gold}</div>}
              {calculatedFee.essence && (
                <div>
                  Essence: {calculatedFee.essence.quantity} essence
                  (ranks {calculatedFee.essence.minRank}-{calculatedFee.essence.maxRank})
                </div>
              )}
              {calculatedFee.chip && (
                <div>Chip: {calculatedFee.chip.type} {calculatedFee.chip.tier}</div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">No fees configured yet</div>
          )}
        </div>

        <div className="border-t border-gray-700 pt-3 text-xs text-gray-400">
          <div className="font-semibold mb-1">Integration Notes:</div>
          <ul className="list-disc list-inside space-y-1">
            <li>Node types: normal, challenger, event, miniboss, finalboss</li>
            <li>Tree progress: 0-100 (percentage through the chapter)</li>
            <li>Node index: Sequential number of this node (for frequency calculation)</li>
            <li>Gold scales based on min/max and curve settings</li>
            <li>Essence spawns based on spawn configs and rarity ranges</li>
            <li>Chips are fixed per node type (not progressive)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}