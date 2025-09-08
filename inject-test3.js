// Script to inject test 3 story tree data
const test3Data = {
  name: "test 3",
  chapter: 3,
  data: {
    nodes: [
      // START node at talent-builder coordinates
      { id: 'start', x: 3000, y: 5400, label: 'START', storyNodeType: 'normal' },
      
      // Level 1 - branching paths
      { id: 'node-1', x: 2950, y: 5500, label: 'Left Path', storyNodeType: 'normal' },
      { id: 'node-2', x: 3000, y: 5500, label: 'Center Path', storyNodeType: 'normal' },
      { id: 'node-3', x: 3050, y: 5500, label: 'Right Path', storyNodeType: 'normal' },
      
      // Level 2 - more complexity
      { id: 'node-4', x: 2925, y: 5600, label: 'Scout Camp', storyNodeType: 'normal' },
      { id: 'node-5', x: 2975, y: 5600, label: 'Ambush', storyNodeType: 'event' },
      { id: 'node-6', x: 3025, y: 5600, label: 'Main Road', storyNodeType: 'normal' },
      { id: 'node-7', x: 3075, y: 5600, label: 'Treasure', storyNodeType: 'event' },
      
      // Level 3 - convergence
      { id: 'node-8', x: 2950, y: 5700, label: 'Rally Point', storyNodeType: 'normal' },
      { id: 'node-9', x: 3050, y: 5700, label: 'Battle Prep', storyNodeType: 'normal' },
      
      // Level 4 - boss encounter
      { id: 'node-10', x: 3000, y: 5800, label: 'Mini Boss', storyNodeType: 'boss' },
      
      // Level 5 - split again
      { id: 'node-11', x: 2960, y: 5900, label: 'Sneak Route', storyNodeType: 'normal' },
      { id: 'node-12', x: 3040, y: 5900, label: 'Assault', storyNodeType: 'normal' },
      
      // Final boss
      { id: 'node-13', x: 3000, y: 6000, label: 'Final Boss', storyNodeType: 'final_boss' }
    ],
    connections: [
      // From start
      { from: 'start', to: 'node-1' },
      { from: 'start', to: 'node-2' },
      { from: 'start', to: 'node-3' },
      
      // Level 1 to 2
      { from: 'node-1', to: 'node-4' },
      { from: 'node-1', to: 'node-5' },
      { from: 'node-2', to: 'node-5' },
      { from: 'node-2', to: 'node-6' },
      { from: 'node-3', to: 'node-6' },
      { from: 'node-3', to: 'node-7' },
      
      // Level 2 to 3
      { from: 'node-4', to: 'node-8' },
      { from: 'node-5', to: 'node-8' },
      { from: 'node-6', to: 'node-8' },
      { from: 'node-6', to: 'node-9' },
      { from: 'node-7', to: 'node-9' },
      
      // Level 3 to boss
      { from: 'node-8', to: 'node-10' },
      { from: 'node-9', to: 'node-10' },
      
      // Boss to level 5
      { from: 'node-10', to: 'node-11' },
      { from: 'node-10', to: 'node-12' },
      
      // To final boss
      { from: 'node-11', to: 'node-13' },
      { from: 'node-12', to: 'node-13' }
    ]
  }
};

// Get existing saves
let savedStoryModes = [];
const existing = localStorage.getItem('savedStoryModes');
if (existing) {
  try {
    savedStoryModes = JSON.parse(existing);
  } catch (e) {
    console.error('Failed to parse existing saves:', e);
  }
}

// Check if test 3 already exists
const test3Index = savedStoryModes.findIndex(s => s.name.toLowerCase() === 'test 3');

if (test3Index >= 0) {
  // Update existing test 3
  savedStoryModes[test3Index] = test3Data;
  console.log('Updated existing test 3 tree');
} else {
  // Add new test 3
  savedStoryModes.push(test3Data);
  console.log('Added new test 3 tree');
}

// Save back to localStorage
localStorage.setItem('savedStoryModes', JSON.stringify(savedStoryModes));

// Set test 3 as preferred tree
localStorage.setItem('preferredStoryTree', 'test 3');

console.log('Test 3 tree has been saved and set as preferred!');
console.log('Refresh the page to see the changes.');
