"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import StoryTreeBuilder from "../scrap-yard/story-climb/StoryTreeBuilder";
import { StoryNode, Connection } from "../scrap-yard/story-climb/types";

export default function AdminStoryTreePage() {
  const [nodes, setNodes] = useState<StoryNode[]>([
    { id: 'start', x: 0, y: 100, label: 'START', storyNodeType: 'normal' }
  ]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [treeName, setTreeName] = useState("V1");
  const [selectedTree, setSelectedTree] = useState<string | null>(null);
  const [unconnectedNodes, setUnconnectedNodes] = useState<StoryNode[]>([]);
  const [showUnconnected, setShowUnconnected] = useState(false);
  
  // Load existing trees
  const storyTrees = useQuery(api.storyTrees.getAllStoryTrees);
  const createStoryTree = useMutation(api.storyTrees.createStoryTree);
  const updateStoryTree = useMutation(api.storyTrees.updateStoryTree);
  
  // Load selected tree
  useEffect(() => {
    if (selectedTree && storyTrees) {
      const tree = storyTrees.find(t => t._id === selectedTree);
      if (tree) {
        setNodes(tree.nodes || []);
        setConnections(tree.connections || []);
        setTreeName(tree.name);
      }
    }
  }, [selectedTree, storyTrees]);
  
  // Function to check for unconnected nodes
  const checkUnconnectedNodes = () => {
    const connectedNodeIds = new Set<string>();
    
    // Start node is always connected
    connectedNodeIds.add('start');
    
    // Build a graph of connections
    const graph = new Map<string, Set<string>>();
    connections.forEach(conn => {
      if (!graph.has(conn.from)) {
        graph.set(conn.from, new Set());
      }
      if (!graph.has(conn.to)) {
        graph.set(conn.to, new Set());
      }
      graph.get(conn.from)!.add(conn.to);
      graph.get(conn.to)!.add(conn.from);
    });
    
    // BFS to find all connected nodes from start
    const queue = ['start'];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = graph.get(current);
      if (neighbors) {
        neighbors.forEach(neighbor => {
          if (!connectedNodeIds.has(neighbor)) {
            connectedNodeIds.add(neighbor);
            queue.push(neighbor);
          }
        });
      }
    }
    
    // Find unconnected nodes
    const unconnected = nodes.filter(node => !connectedNodeIds.has(node.id));
    setUnconnectedNodes(unconnected);
    setShowUnconnected(true);
    
    if (unconnected.length === 0) {
      alert("Great! All nodes are connected to the tree.");
    } else {
      alert(`Found ${unconnected.length} unconnected nodes. They are highlighted in red.`);
    }
  };
  
  const handleSave = async () => {
    if (!treeName) {
      alert("Please enter a tree name");
      return;
    }
    
    try {
      if (selectedTree) {
        // Update existing tree
        await updateStoryTree({
          id: selectedTree as any,
          name: treeName,
          nodes,
          connections
        });
        alert("Tree updated successfully!");
      } else {
        // Create new tree
        await createStoryTree({
          name: treeName,
          nodes,
          connections
        });
        alert("Tree saved successfully!");
      }
    } catch (error) {
      console.error("Error saving tree:", error);
      alert("Error saving tree. Check console for details.");
    }
  };
  
  const handleLoad = (treeId: string) => {
    setSelectedTree(treeId);
    setShowUnconnected(false);
    setUnconnectedNodes([]);
  };
  
  const handleNew = () => {
    setSelectedTree(null);
    setTreeName("");
    setNodes([{ id: 'start', x: 0, y: 100, label: 'START', storyNodeType: 'normal' }]);
    setConnections([]);
    setShowUnconnected(false);
    setUnconnectedNodes([]);
  };
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Control Panel */}
      <div className="fixed top-0 left-0 right-0 bg-gray-900/95 border-b border-gray-700 p-4 z-50">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <input
            type="text"
            value={treeName}
            onChange={(e) => setTreeName(e.target.value)}
            placeholder="Tree Name"
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
          />
          
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded font-bold"
          >
            Save Tree
          </button>
          
          <button
            onClick={handleNew}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold"
          >
            New Tree
          </button>
          
          {/* Check Unconnected Nodes Button */}
          <button
            onClick={checkUnconnectedNodes}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded font-bold"
          >
            Check Unconnected Nodes
          </button>
          
          {/* Load Tree Dropdown */}
          {storyTrees && storyTrees.length > 0 && (
            <select
              value={selectedTree || ""}
              onChange={(e) => handleLoad(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
            >
              <option value="">Load Tree...</option>
              {storyTrees.map(tree => (
                <option key={tree._id} value={tree._id}>
                  {tree.name} ({tree.nodes?.length || 0} nodes, {tree.connections?.length || 0} connections)
                </option>
              ))}
            </select>
          )}
          
          {/* Stats */}
          <div className="ml-auto text-sm text-gray-400">
            Nodes: {nodes.length} | Connections: {connections.length}
            {unconnectedNodes.length > 0 && (
              <span className="ml-3 text-red-400">
                | Unconnected: {unconnectedNodes.length}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Builder Canvas */}
      <div className="pt-20 relative">
        <StoryTreeBuilder
          nodes={nodes.map(node => ({
            ...node,
            // Highlight unconnected nodes
            highlighted: showUnconnected && unconnectedNodes.some(un => un.id === node.id)
          } as any))}
          connections={connections}
          onNodesChange={setNodes}
          onConnectionsChange={setConnections}
          canvasWidth={1600}
          canvasHeight={2400}
        />
      </div>
      
      {/* Unconnected Nodes List */}
      {showUnconnected && unconnectedNodes.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-red-900/95 border border-red-600 rounded-lg p-4 max-w-sm z-50">
          <h3 className="text-red-400 font-bold mb-2">Unconnected Nodes:</h3>
          <ul className="text-sm space-y-1 max-h-48 overflow-y-auto">
            {unconnectedNodes.map(node => (
              <li key={node.id} className="text-red-200">
                • {node.label} (ID: {node.id})
              </li>
            ))}
          </ul>
          <button
            onClick={() => setShowUnconnected(false)}
            className="mt-3 text-xs text-gray-400 hover:text-white"
          >
            Hide
          </button>
        </div>
      )}
    </div>
  );
}