// Test tree data for story-climb page
export const testTreeData = {
  name: "Chapter 1 - Tutorial",
  chapter: 1,
  data: {
    nodes: [
      // Start at bottom
      { id: 'start', x: 0, y: 100, label: 'START', storyNodeType: 'normal' as const },
      
      // Level 1 - Two paths from start
      { id: 'node-1', x: -150, y: 250, label: 'Scout Mission', storyNodeType: 'normal' as const },
      { id: 'node-2', x: 150, y: 250, label: 'Combat Training', storyNodeType: 'normal' as const },
      
      // Level 2 - Merge point
      { id: 'node-3', x: 0, y: 400, label: 'Base Camp', storyNodeType: 'event' as const },
      
      // Level 3 - Three branches
      { id: 'node-4', x: -200, y: 550, label: 'Left Path', storyNodeType: 'normal' as const },
      { id: 'node-5', x: 0, y: 550, label: 'Main Path', storyNodeType: 'normal' as const },
      { id: 'node-6', x: 200, y: 550, label: 'Right Path', storyNodeType: 'normal' as const },
      
      // Level 4 - Mini boss
      { id: 'node-7', x: 0, y: 700, label: 'Mini Boss', storyNodeType: 'boss' as const },
      
      // Level 5 - Final approach
      { id: 'node-8', x: -100, y: 850, label: 'Preparation', storyNodeType: 'normal' as const },
      { id: 'node-9', x: 100, y: 850, label: 'Supply Run', storyNodeType: 'event' as const },
      
      // Final boss
      { id: 'node-10', x: 0, y: 1000, label: 'Chapter Boss', storyNodeType: 'final_boss' as const },
    ],
    connections: [
      // From start
      { from: 'start', to: 'node-1' },
      { from: 'start', to: 'node-2' },
      
      // To merge point
      { from: 'node-1', to: 'node-3' },
      { from: 'node-2', to: 'node-3' },
      
      // Three paths
      { from: 'node-3', to: 'node-4' },
      { from: 'node-3', to: 'node-5' },
      { from: 'node-3', to: 'node-6' },
      
      // To mini boss
      { from: 'node-4', to: 'node-7' },
      { from: 'node-5', to: 'node-7' },
      { from: 'node-6', to: 'node-7' },
      
      // After mini boss
      { from: 'node-7', to: 'node-8' },
      { from: 'node-7', to: 'node-9' },
      
      // To final boss
      { from: 'node-8', to: 'node-10' },
      { from: 'node-9', to: 'node-10' },
    ]
  }
};