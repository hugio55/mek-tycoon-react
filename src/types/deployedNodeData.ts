// Type definitions for deployed node data
// This file defines the contract between admin configuration and Story Climb consumption

export interface ChipReward {
  tier: number; // 1-6
  modifier: string; // 'x1', 'x2', 'x3', 'x5', 'x10'
  probability: number; // Percentage chance
}

export interface EssenceReward {
  variation: string;
  abundanceRank: number; // 1-80, where 1 is least abundant
  count: number; // How many times this variation appears in the chapter
  type: 'head' | 'body' | 'trait';
}

export interface CustomReward {
  id: string;
  name: string;
  type: 'frame' | 'canister' | 'gear' | 'other';
  description?: string;
}

export interface EventNodeData {
  eventNumber: number; // 1-200
  name: string;
  goldReward: number;
  xpReward: number;
  chipRewards?: ChipReward[]; // Calculated from chip reward calculator
  essenceRewards?: EssenceReward[];
  customRewards?: CustomReward[];
  imageReference?: string; // Path to event image
}

export interface NormalMekNodeData {
  nodeId: string;
  level: number;
  title?: string;
  goldReward?: number;
  xpReward?: number;
  // Add more fields as needed for normal nodes
}

export interface ChallengerNodeData {
  nodeId: string;
  level: number;
  title?: string;
  goldReward?: number;
  xpReward?: number;
  challengeMultiplier?: number;
  // Add more fields as needed for challenger nodes
}

export interface MiniBossNodeData {
  nodeId: string;
  level: number;
  title?: string;
  bossName?: string;
  goldReward?: number;
  xpReward?: number;
  specialRewards?: CustomReward[];
  // Add more fields as needed for mini boss nodes
}

export interface FinalBossNodeData {
  nodeId: string;
  chapterNumber: number;
  bossName: string;
  goldReward?: number;
  xpReward?: number;
  specialRewards?: CustomReward[];
  // Add more fields as needed for final boss nodes
}

export interface DeployedStoryClimbData {
  deploymentId: string;
  deployedAt: number; // Timestamp
  deployedBy: string; // User ID
  version: number; // Version number for tracking
  status: 'pending' | 'active' | 'archived';

  // Node data arrays
  eventNodes: EventNodeData[];
  normalNodes?: NormalMekNodeData[];
  challengerNodes?: ChallengerNodeData[];
  miniBossNodes?: MiniBossNodeData[];
  finalBossNodes?: FinalBossNodeData[];

  // Metadata
  configurationName?: string; // Name of the source configuration
  configurationId?: string; // ID of the source configuration
  notes?: string; // Deployment notes
}

// Deployment status for UI feedback
export interface DeploymentStatus {
  isDeploying: boolean;
  lastDeployment?: {
    timestamp: number;
    success: boolean;
    message?: string;
    deploymentId?: string;
  };
  error?: string;
}

// Validation result for pre-deployment checks
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalEvents: number;
    totalGold: number;
    totalXP: number;
    hasAllEventNames: boolean;
    hasAllRewards: boolean;
  };
}