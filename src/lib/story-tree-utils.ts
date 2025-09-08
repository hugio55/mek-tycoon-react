/**
 * Utility functions for story tree coordinate transformation
 * Ensures visual consistency between talent-builder and story-climb pages
 */

export interface StoryNode {
  id: string;
  x: number;
  y: number;
  label?: string;
  name?: string;
  index?: number;
  storyNodeType?: 'normal' | 'event' | 'boss' | 'final_boss';
  completed?: boolean;
  available?: boolean;
  current?: boolean;
}

export interface Connection {
  from: string;
  to: string;
}

/**
 * Transform nodes from talent-builder coordinate space to story-climb display space
 * 
 * Talent-builder space:
 * - X: centered at 3000, range 2850-3150 (300px width)
 * - Y: starts at ~5400, grows upward (higher Y = further in tree)
 * 
 * Story-climb space:
 * - X: centered at 0, with horizontal spread scaled for canvas width
 * - Y: starts at 100, grows to 1150 (inverted from builder)
 */
export function transformNodesToDisplaySpace(nodes: StoryNode[], canvasWidth: number = 800): StoryNode[] {
  if (!nodes || nodes.length === 0) return [];
  
  // Detect coordinate system by checking X values
  const avgX = nodes.reduce((sum, n) => sum + n.x, 0) / nodes.length;
  const isTalentBuilderSpace = avgX > 1000;
  
  if (!isTalentBuilderSpace) {
    // Already in display space - but we should scale X for wider canvas
    console.log('Nodes already in display space, scaling for canvas width');
    
    // Find X range
    const xValues = nodes.map(n => n.x);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const currentRange = maxX - minX;
    
    // Scale factor to use more of the canvas width
    // Target to use about 80% of canvas width for the tree spread
    const targetRange = canvasWidth * 0.8;
    const scaleFactor = currentRange > 0 ? targetRange / currentRange : 2;
    
    return nodes.map(node => ({
      ...node,
      x: node.x * Math.min(scaleFactor, 3) // Cap scaling at 3x to prevent too much spread
    }));
  }
  
  console.log('Transforming from talent-builder space to display space');
  
  // Find Y range for normalization
  const yValues = nodes.map(n => n.y);
  const minY = Math.min(...yValues); // START node (lowest in builder)
  const maxY = Math.max(...yValues); // Final node (highest in builder)
  const yRange = maxY - minY || 1000; // Prevent division by zero
  
  // Find the START node to center it at x=0
  const startNode = nodes.find(n => n.id === 'start' || n.id === 'Start' || n.name === 'Start' || n.name === 'START');
  const startX = startNode ? startNode.x : 3000; // Default to center if no START found
  
  // Find X range for scaling
  const xValues = nodes.map(n => n.x);
  const minBuilderX = Math.min(...xValues);
  const maxBuilderX = Math.max(...xValues);
  const builderXRange = maxBuilderX - minBuilderX || 300;
  
  // Scale X coordinates to use more canvas width
  const targetXRange = canvasWidth * 0.8; // Use 80% of canvas width
  const xScaleFactor = targetXRange / builderXRange;
  
  return nodes.map(node => {
    // Transform X: center START node at 0, scale for canvas width
    const centeredX = node.x - startX;
    const transformedX = centeredX * xScaleFactor;
    
    // Transform Y: normalize and map to display range
    // In builder: START is at minY (e.g., 5400), final is at maxY (e.g., 6000)
    // In display: START should be at 100, final at 1150
    const normalizedY = (node.y - minY) / yRange; // 0 to 1
    const transformedY = 100 + normalizedY * 1050; // Map to 100-1150
    
    console.log(`Transform ${node.id}: (${node.x}, ${node.y}) -> (${transformedX}, ${transformedY})`);
    
    return {
      ...node,
      x: transformedX,
      y: transformedY
    };
  });
}

/**
 * Transform nodes from display space back to talent-builder space
 * Used when saving edits made in story-climb back to the builder
 */
export function transformNodesToBuilderSpace(nodes: StoryNode[]): StoryNode[] {
  if (!nodes || nodes.length === 0) return [];
  
  // Detect coordinate system
  const avgX = nodes.reduce((sum, n) => sum + n.x, 0) / nodes.length;
  const isTalentBuilderSpace = avgX > 1000;
  
  if (isTalentBuilderSpace) {
    // Already in builder space
    return nodes;
  }
  
  return nodes.map(node => {
    // Transform X: center at 3000 instead of 0
    const transformedX = node.x + 3000;
    
    // Transform Y: map from display range back to builder range
    // Assuming display Y is 100-1150, map to builder 5400-6000
    const normalizedY = (node.y - 100) / 1050; // Normalize to 0-1
    const transformedY = 5400 + normalizedY * 600; // Map to builder range
    
    return {
      ...node,
      x: transformedX,
      y: transformedY
    };
  });
}

/**
 * Get node size in pixels based on type
 */
export function getNodeSize(type?: string): number {
  switch (type) {
    case 'event': return 80;      // 2x normal
    case 'boss': return 120;      // 3x normal
    case 'final_boss': return 160; // 4x normal
    case 'normal':
    default: return 40;           // Base size
  }
}

/**
 * Get node icon based on type
 */
export function getNodeIcon(type?: string): string {
  switch (type) {
    case 'event': return '❓';
    case 'boss': return '👹';
    case 'final_boss': return '👑';
    case 'normal':
    default: return '⚔️';
  }
}

/**
 * Calculate viewport bounds for centering on a specific node
 */
export function calculateViewportForNode(
  node: StoryNode, 
  canvasWidth: number, 
  canvasHeight: number
): { x: number, y: number } {
  // In inverted display space, calculate proper camera position
  const invertedY = 1400 - node.y;
  
  return {
    x: canvasWidth / 2 - node.x,
    y: Math.max(0, invertedY - canvasHeight / 2)
  };
}