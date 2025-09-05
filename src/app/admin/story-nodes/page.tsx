"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Node {
  id: number;
  level: number;
  type: 'normal' | 'boss' | 'event';
  x: number;
  y: number;
  connections: number[];
  mekId?: string;
}

interface GeneratorSettings {
  chapter: number;
  nodeCount: number;
  bossFreq: number;
  eventChance: number;
  maxWidth: number;
  seed: string;
  algorithm: 'diamond' | 'organic' | 'wave';
}

export default function StoryNodeGeneratorPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [settings, setSettings] = useState<GeneratorSettings>({
    chapter: 1,
    nodeCount: 50,
    bossFreq: 80,
    eventChance: 10,
    maxWidth: 7,
    seed: '',
    algorithm: 'diamond'
  });
  
  const [nodes, setNodes] = useState<Node[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    normal: 0,
    boss: 0,
    event: 0,
    maxWidth: 0,
    paths: 0
  });
  
  const [exportData, setExportData] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

  // Generate nodes based on selected algorithm
  const generateNodes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    let generatedNodes: Node[] = [];
    
    switch(settings.algorithm) {
      case 'diamond':
        generatedNodes = generateDiamondPattern();
        break;
      case 'organic':
        generatedNodes = generateOrganicPattern();
        break;
      case 'wave':
        generatedNodes = generateWavePattern();
        break;
    }
    
    setNodes(generatedNodes);
    drawNodes(generatedNodes);
    updateStats(generatedNodes);
    updateExportData(generatedNodes);
  };
  
  // Diamond pattern generator
  const generateDiamondPattern = (): Node[] => {
    const nodes: Node[] = [];
    const nodeHeight = 700 / settings.nodeCount;
    let nodeId = 0;
    
    for (let level = 0; level < settings.nodeCount; level++) {
      const progress = level / settings.nodeCount;
      let width: number;
      
      if (progress < 0.4) {
        width = Math.floor(1 + (progress / 0.4) * (settings.maxWidth - 1));
      } else if (progress < 0.9) {
        width = Math.floor(settings.maxWidth - ((progress - 0.4) / 0.5) * (settings.maxWidth - 2));
      } else {
        width = Math.max(1, 2 - Math.floor((progress - 0.9) * 10));
      }
      
      for (let i = 0; i < width; i++) {
        const x = (400 / 2) - (width * 40 / 2) + (i * 40) + 20;
        const y = 700 - 30 - (level * nodeHeight);
        
        let type: 'normal' | 'boss' | 'event' = 'normal';
        if (level > 0 && level % settings.bossFreq === 0 && i === Math.floor(width/2)) {
          type = 'boss';
        } else if (Math.random() < settings.eventChance / 100 && level % settings.bossFreq !== 0) {
          type = 'event';
        }
        
        const node: Node = {
          id: nodeId++,
          level,
          type,
          x,
          y,
          connections: []
        };
        
        // Connect to previous level
        if (level > 0) {
          const prevLevelNodes = nodes.filter(n => n.level === level - 1);
          if (prevLevelNodes.length > 0) {
            const closest = prevLevelNodes.reduce((prev, curr) => 
              Math.abs(curr.x - x) < Math.abs(prev.x - x) ? curr : prev
            );
            node.connections.push(closest.id);
          }
        }
        
        nodes.push(node);
      }
    }
    
    return nodes;
  };
  
  // Organic tree pattern generator
  const generateOrganicPattern = (): Node[] => {
    const nodes: Node[] = [];
    const nodeHeight = 700 / settings.nodeCount;
    let nodeId = 0;
    
    // Start with single node
    nodes.push({
      id: nodeId++,
      level: 0,
      type: 'normal',
      x: 200,
      y: 670,
      connections: []
    });
    
    interface Path {
      x: number;
      life: number;
    }
    
    let activePaths: Path[] = [{x: 200, life: 20 + Math.random() * 30}];
    
    for (let level = 1; level < settings.nodeCount; level++) {
      const y = 700 - 30 - (level * nodeHeight);
      const newPaths: Path[] = [];
      const levelNodes: Node[] = [];
      
      activePaths.forEach((path, index) => {
        if (path.life > 0) {
          let type: 'normal' | 'boss' | 'event' = 'normal';
          if (level % settings.bossFreq === 0 && index === 0) {
            type = 'boss';
          } else if (Math.random() < settings.eventChance / 100) {
            type = 'event';
          }
          
          const node: Node = {
            id: nodeId++,
            level,
            type,
            x: path.x,
            y,
            connections: []
          };
          
          levelNodes.push(node);
          nodes.push(node);
          
          // Random branching
          if (Math.random() < 0.3 && activePaths.length < settings.maxWidth) {
            const offset = (Math.random() - 0.5) * 80;
            const newX = Math.max(40, Math.min(360, path.x + offset));
            newPaths.push({x: newX, life: 10 + Math.random() * 20});
          }
          
          // Random merging
          if (Math.random() < 0.2 && activePaths.length > 2) {
            path.life = 0;
          } else {
            path.life--;
            path.x += (Math.random() - 0.5) * 30;
            path.x = Math.max(40, Math.min(360, path.x));
          }
        }
      });
      
      // Connect to previous level
      const prevLevelNodes = nodes.filter(n => n.level === level - 1);
      levelNodes.forEach(node => {
        if (prevLevelNodes.length > 0) {
          const closest = prevLevelNodes.reduce((prev, curr) => 
            Math.abs(curr.x - node.x) < Math.abs(prev.x - node.x) ? curr : prev
          );
          node.connections.push(closest.id);
        }
      });
      
      activePaths = activePaths.filter(p => p.life > 0).concat(newPaths);
      
      // Ensure at least one path
      if (activePaths.length === 0) {
        activePaths.push({x: 200, life: 20});
      }
    }
    
    return nodes;
  };
  
  // Wave pattern generator
  const generateWavePattern = (): Node[] => {
    const nodes: Node[] = [];
    const nodeHeight = 700 / settings.nodeCount;
    let nodeId = 0;
    
    for (let level = 0; level < settings.nodeCount; level++) {
      const progress = level / settings.nodeCount;
      
      // Sinusoidal wave pattern
      const waveFreq = 3;
      const width = Math.floor(3 + (settings.maxWidth - 3) * (Math.sin(progress * Math.PI * 2 * waveFreq) * 0.5 + 0.5));
      
      for (let i = 0; i < width; i++) {
        const x = (400 / 2) - (width * 40 / 2) + (i * 40) + 20;
        const y = 700 - 30 - (level * nodeHeight);
        
        let type: 'normal' | 'boss' | 'event' = 'normal';
        // Bosses at wave peaks
        if (width >= settings.maxWidth - 1 && level % settings.bossFreq === 0 && i === Math.floor(width/2)) {
          type = 'boss';
        // Events at wave troughs
        } else if (width <= 4 && Math.random() < (settings.eventChance / 100) * 2) {
          type = 'event';
        } else if (Math.random() < settings.eventChance / 100) {
          type = 'event';
        }
        
        const node: Node = {
          id: nodeId++,
          level,
          type,
          x,
          y,
          connections: []
        };
        
        // Connect to previous level
        if (level > 0) {
          const prevLevelNodes = nodes.filter(n => n.level === level - 1);
          prevLevelNodes.forEach(prev => {
            const dist = Math.abs(prev.x - node.x);
            if (dist < 50) {
              node.connections.push(prev.id);
            }
          });
          
          // Ensure at least one connection
          if (node.connections.length === 0 && prevLevelNodes.length > 0) {
            const closest = prevLevelNodes.reduce((prev, curr) => 
              Math.abs(curr.x - node.x) < Math.abs(prev.x - node.x) ? curr : prev
            );
            node.connections.push(closest.id);
          }
        }
        
        nodes.push(node);
      }
    }
    
    return nodes;
  };
  
  // Draw nodes on canvas
  const drawNodes = (nodesToDraw: Node[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw connections
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    nodesToDraw.forEach(node => {
      node.connections.forEach(targetId => {
        const target = nodesToDraw.find(n => n.id === targetId);
        if (target) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
        }
      });
    });
    
    // Draw nodes
    nodesToDraw.forEach(node => {
      switch(node.type) {
        case 'boss':
          ctx.fillStyle = '#ff4a4a';
          ctx.fillRect(node.x - 12, node.y - 12, 24, 24);
          break;
        case 'event':
          ctx.fillStyle = '#ffa500';
          ctx.beginPath();
          ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);
          ctx.fill();
          break;
        default:
          ctx.fillStyle = '#4a9eff';
          ctx.fillRect(node.x - 6, node.y - 6, 12, 12);
      }
    });
  };
  
  // Update statistics
  const updateStats = (nodesToAnalyze: Node[]) => {
    const stats = {
      normal: 0,
      boss: 0,
      event: 0
    };
    
    nodesToAnalyze.forEach(node => {
      stats[node.type]++;
    });
    
    // Calculate max width
    const levels: { [key: number]: number } = {};
    nodesToAnalyze.forEach(node => {
      if (!levels[node.level]) levels[node.level] = 0;
      levels[node.level]++;
    });
    const maxWidth = Math.max(...Object.values(levels));
    
    // Calculate total paths (leaf nodes)
    const leafNodes = nodesToAnalyze.filter(node => {
      return !nodesToAnalyze.some(other => 
        other.connections.includes(node.id)
      );
    }).length;
    
    setStats({
      total: nodesToAnalyze.length,
      normal: stats.normal,
      boss: stats.boss,
      event: stats.event,
      maxWidth,
      paths: leafNodes || 1
    });
  };
  
  // Update export data
  const updateExportData = (nodesToExport: Node[]) => {
    const data = {
      generator: settings.algorithm,
      chapter: settings.chapter,
      settings: {
        nodeCount: settings.nodeCount,
        bossFreq: settings.bossFreq,
        eventChance: settings.eventChance,
        maxWidth: settings.maxWidth,
        seed: settings.seed || 'random'
      },
      nodes: nodesToExport.map(node => ({
        id: node.id,
        level: node.level,
        type: node.type,
        x: Math.round(node.x),
        y: Math.round(node.y),
        connections: node.connections
      }))
    };
    
    setExportData(JSON.stringify(data, null, 2));
  };
  
  // Export functions
  const exportJSON = () => {
    const blob = new Blob([exportData], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `story_nodes_chapter_${settings.chapter}_${Date.now()}.json`;
    a.click();
  };
  
  const exportCSV = () => {
    const data = JSON.parse(exportData);
    let csv = 'ID,Level,Type,X,Y,Connections\n';
    
    data.nodes.forEach((node: any) => {
      csv += `${node.id},${node.level},${node.type},${node.x},${node.y},"${node.connections.join(',')}"\n`;
    });
    
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `story_nodes_chapter_${settings.chapter}_${Date.now()}.csv`;
    a.click();
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportData);
    alert('Copied to clipboard!');
  };
  
  const saveToLocalStorage = () => {
    const key = `story_nodes_chapter_${settings.chapter}`;
    localStorage.setItem(key, exportData);
    alert(`Saved to local storage as: ${key}`);
  };
  
  // Generate on mount
  useEffect(() => {
    generateNodes();
  }, []);
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">Story Mode Node Generator</h1>
          <p className="text-gray-400">Procedural generation system for story mode path layouts</p>
        </div>
        
        {/* Back Button */}
        <button
          onClick={() => router.push('/admin')}
          className="mb-6 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 hover:border-yellow-400 rounded-lg transition-all text-gray-400 hover:text-white"
        >
          ← Back to Admin
        </button>
        
        {/* Control Panel */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-yellow-400 text-sm mb-1">Chapter</label>
              <select
                value={settings.chapter}
                onChange={(e) => setSettings({...settings, chapter: Number(e.target.value)})}
                className="w-full bg-black/60 border border-gray-700 rounded px-3 py-2 text-white"
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Chapter {i + 1} {i === 9 ? '(Wren)' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-yellow-400 text-sm mb-1">Nodes to Display</label>
              <input
                type="number"
                value={settings.nodeCount}
                onChange={(e) => setSettings({...settings, nodeCount: Number(e.target.value)})}
                min="10"
                max="400"
                className="w-full bg-black/60 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
            
            <div>
              <label className="block text-yellow-400 text-sm mb-1">Boss Frequency</label>
              <input
                type="number"
                value={settings.bossFreq}
                onChange={(e) => setSettings({...settings, bossFreq: Number(e.target.value)})}
                min="20"
                max="150"
                className="w-full bg-black/60 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
            
            <div>
              <label className="block text-yellow-400 text-sm mb-1">Event Chance %</label>
              <input
                type="number"
                value={settings.eventChance}
                onChange={(e) => setSettings({...settings, eventChance: Number(e.target.value)})}
                min="0"
                max="30"
                className="w-full bg-black/60 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
            
            <div>
              <label className="block text-yellow-400 text-sm mb-1">Max Width</label>
              <input
                type="number"
                value={settings.maxWidth}
                onChange={(e) => setSettings({...settings, maxWidth: Number(e.target.value)})}
                min="3"
                max="10"
                className="w-full bg-black/60 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
            
            <div>
              <label className="block text-yellow-400 text-sm mb-1">Seed (optional)</label>
              <input
                type="text"
                value={settings.seed}
                onChange={(e) => setSettings({...settings, seed: e.target.value})}
                placeholder="Random"
                className="w-full bg-black/60 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-4 mt-4">
            <button
              onClick={generateNodes}
              className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-all"
            >
              Generate Path
            </button>
            <button
              onClick={() => {
                setNodes([]);
                const canvas = canvasRef.current;
                if (canvas) {
                  const ctx = canvas.getContext('2d');
                  ctx?.clearRect(0, 0, canvas.width, canvas.height);
                }
              }}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
            >
              Reset View
            </button>
          </div>
        </div>
        
        {/* Generator Options */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div
            onClick={() => setSettings({...settings, algorithm: 'diamond'})}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              settings.algorithm === 'diamond'
                ? 'border-yellow-400 bg-yellow-400/10'
                : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
            }`}
          >
            <h3 className="text-yellow-400 font-bold mb-2">Diamond Flow</h3>
            <p className="text-sm text-gray-400">Expands to max width at 40%, then contracts</p>
            <ul className="text-xs text-gray-500 mt-2 space-y-1">
              <li>• Predictable expansion/contraction</li>
              <li>• Fixed boss intervals</li>
              <li>• Smooth transitions</li>
            </ul>
          </div>
          
          <div
            onClick={() => setSettings({...settings, algorithm: 'organic'})}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              settings.algorithm === 'organic'
                ? 'border-yellow-400 bg-yellow-400/10'
                : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
            }`}
          >
            <h3 className="text-yellow-400 font-bold mb-2">Organic Tree</h3>
            <p className="text-sm text-gray-400">Natural branching with random merge points</p>
            <ul className="text-xs text-gray-500 mt-2 space-y-1">
              <li>• Unpredictable patterns</li>
              <li>• Dynamic path lifetimes</li>
              <li>• High replay variety</li>
            </ul>
          </div>
          
          <div
            onClick={() => setSettings({...settings, algorithm: 'wave'})}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              settings.algorithm === 'wave'
                ? 'border-yellow-400 bg-yellow-400/10'
                : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
            }`}
          >
            <h3 className="text-yellow-400 font-bold mb-2">Rhythmic Waves</h3>
            <p className="text-sm text-gray-400">Sinusoidal expansion creating rhythm</p>
            <ul className="text-xs text-gray-500 mt-2 space-y-1">
              <li>• 3-4 expansion waves</li>
              <li>• Bosses at peaks</li>
              <li>• Events at troughs</li>
            </ul>
          </div>
        </div>
        
        {/* Canvas Container */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500"></div>
                <span className="text-sm text-gray-400">Normal (Mek)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-red-500"></div>
                <span className="text-sm text-gray-400">Boss (Top Mek)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-400">Event (Special)</span>
              </div>
            </div>
          </div>
          
          <canvas
            ref={canvasRef}
            width={400}
            height={700}
            className="bg-gray-950 border border-gray-700 rounded mx-auto"
          />
        </div>
        
        {/* Statistics */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-yellow-400 font-bold mb-4">Generation Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-black/40 rounded p-3">
              <div className="text-gray-400 text-xs uppercase mb-1">Total Nodes</div>
              <div className="text-2xl font-bold text-yellow-400">{stats.total}</div>
            </div>
            <div className="bg-black/40 rounded p-3">
              <div className="text-gray-400 text-xs uppercase mb-1">Normal Nodes</div>
              <div className="text-2xl font-bold text-blue-400">{stats.normal}</div>
            </div>
            <div className="bg-black/40 rounded p-3">
              <div className="text-gray-400 text-xs uppercase mb-1">Boss Nodes</div>
              <div className="text-2xl font-bold text-red-400">{stats.boss}</div>
            </div>
            <div className="bg-black/40 rounded p-3">
              <div className="text-gray-400 text-xs uppercase mb-1">Event Nodes</div>
              <div className="text-2xl font-bold text-orange-400">{stats.event}</div>
            </div>
            <div className="bg-black/40 rounded p-3">
              <div className="text-gray-400 text-xs uppercase mb-1">Max Width</div>
              <div className="text-2xl font-bold text-purple-400">{stats.maxWidth}</div>
            </div>
            <div className="bg-black/40 rounded p-3">
              <div className="text-gray-400 text-xs uppercase mb-1">Total Paths</div>
              <div className="text-2xl font-bold text-green-400">{stats.paths}</div>
            </div>
          </div>
        </div>
        
        {/* Export Panel */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
          <h3 className="text-yellow-400 font-bold mb-4">Export Data</h3>
          <div className="flex gap-2 flex-wrap mb-4">
            <button
              onClick={exportJSON}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded transition-all"
            >
              Export as JSON
            </button>
            <button
              onClick={exportCSV}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded transition-all"
            >
              Export as CSV
            </button>
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded transition-all"
            >
              Copy to Clipboard
            </button>
            <button
              onClick={saveToLocalStorage}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded transition-all"
            >
              Save to Storage
            </button>
            <button
              onClick={() => setShowExportModal(!showExportModal)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded transition-all"
            >
              {showExportModal ? 'Hide' : 'Show'} Data
            </button>
          </div>
          
          {showExportModal && (
            <textarea
              value={exportData}
              readOnly
              className="w-full h-64 bg-black/60 border border-gray-700 rounded p-3 text-gray-300 text-sm font-mono"
              placeholder="Generated data will appear here..."
            />
          )}
        </div>
      </div>
    </div>
  );
}