/**
 * Consolidated type definitions for the Talent Builder
 *
 * This is the SINGLE SOURCE OF TRUTH for all talent-builder types.
 * Do not create duplicate type files elsewhere.
 */

// ============================================================================
// CORE NODE TYPES
// ============================================================================

export type EssenceRequirement = {
  attribute: string; // e.g., 'Bumblebee', 'Taser', etc.
  amount: number;
};

export type TalentNode = {
  id: string;
  name: string;
  x: number;
  y: number;
  tier: number;
  desc: string;
  xp: number;
  variation?: string;
  variationType?: 'head' | 'body' | 'trait';
  imageUrl?: string;

  // CiruTree-specific fields
  goldCost?: number;
  essences?: EssenceRequirement[];
  ingredients?: string[];

  // Spell-specific fields
  isSpell?: boolean;
  spellType?: string; // e.g., 'Fire Blast', 'Healing Wave', etc.
  specialIngredient?: string;

  // Reward fields
  frameReward?: string; // Frame ID that gets unlocked
  buffReward?: { type: string; value: number }; // e.g., {type: 'goldRate', value: 10}
  essenceReward?: { type: string; amount: number }; // e.g., {type: 'Fire', amount: 5}
  signatureItemReward?: string; // Over Exposed Signature item ID

  // Mek-specific fields
  nodeType?: 'stat' | 'ability' | 'passive' | 'special';
  statBonus?: {
    health?: number;
    speed?: number;
    attack?: number;
    defense?: number;
    critChance?: number;
    critDamage?: number;
  };
  abilityId?: string;
  passiveEffect?: string;

  // Story Mode fields
  storyNodeType?: 'normal' | 'event' | 'boss' | 'final_boss';
  challenger?: boolean; // Higher rank mechanism that's tougher (for normal nodes)
  goldReward?: number;
  essenceRewards?: { type: string; amount: number }[];
  otherRewards?: { item: string; quantity: number }[]; // For event and boss nodes
  eventName?: string; // For event nodes
  bossMekId?: string; // For boss nodes

  // Additional optional fields
  unlocked?: boolean;
  buffGrant?: unknown;

  // Label node fields
  isLabel?: boolean;
  labelText?: string;
};

export type Connection = {
  from: string;
  to: string;
};

// ============================================================================
// MODE TYPES
// ============================================================================

export type BuilderMode = 'circutree' | 'mek' | 'story';

export type CanvasMode = 'select' | 'add' | 'connect' | 'addLabel' | 'lasso';

// ============================================================================
// INTERACTION STATE TYPES
// ============================================================================

export type DragState = {
  isDragging: boolean;
  nodeId: string | null;
  offsetX: number;
  offsetY: number;
};

export type BoxSelection = {
  isSelecting: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  addToSelection: boolean;
};

export type LassoSelection = {
  isSelecting: boolean;
  points: { x: number; y: number }[];
};

export type RotationHandle = {
  isDragging: boolean;
  startAngle: number;
  centroidX: number;
  centroidY: number;
};

export type ViewportDimensions = {
  width: number;
  height: number;
};

export type ViewportPosition = {
  x: number;
  y: number;
};

// ============================================================================
// TEMPLATE & SAVE TYPES
// ============================================================================

export interface TemplateConditions {
  headVariations?: string[];
  bodyVariations?: string[];
  traitVariations?: string[];
  rarityTiers?: string[];
  powerScoreMin?: number;
  powerScoreMax?: number;
  rankMin?: number;
  rankMax?: number;
}

export interface Template {
  _id: string;
  name: string;
  description?: string;
  nodes: TalentNode[];
  connections: Connection[];
  category?: string;
  viewportDimensions?: ViewportDimensions;
  viewportPosition?: ViewportPosition;
  conditions?: TemplateConditions;
  createdAt?: number;
  updatedAt?: number;
}

export interface SavedSpell {
  id: string;
  name: string;
  description: string;
  rarity: string;
  fluxAmount: number;
  cooldown: number;
  range: number;
  unlockPrice: {
    gold: number;
    level: number;
  };
  essenceRequirements?: Array<{
    type: string;
    amount: number;
  }>;
}

export interface SavedCiruTree {
  name: string;
  data: {
    nodes: TalentNode[];
    connections: Connection[];
    savedAt?: number;
  };
  isActive?: boolean;
}

export interface SavedStoryMode {
  name: string;
  chapter: number;
  data: {
    nodes: TalentNode[];
    connections: Connection[];
    savedAt?: number;
  };
}

export interface BackupFile {
  filename: string;
  timestamp: string;
  size: number;
}

// ============================================================================
// HISTORY TYPE (for undo/redo)
// ============================================================================

export interface HistoryEntry {
  nodes: TalentNode[];
  connections: Connection[];
}
