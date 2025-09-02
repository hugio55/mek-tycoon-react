export type EssenceRequirement = {
  attribute: string;
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
  spellType?: string;
  specialIngredient?: string;
  // Reward fields
  frameReward?: string;
  buffReward?: { type: string; value: number };
  essenceReward?: { type: string; amount: number };
  signatureItemReward?: string;
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
};

export type Connection = {
  from: string;
  to: string;
};

export type DragState = {
  isDragging: boolean;
  nodeId: string | null;
  offsetX: number;
  offsetY: number;
};

export type BuilderMode = 'circutree' | 'mek';

export type CanvasMode = 'select' | 'add' | 'connect';

export interface Template {
  _id: string;
  name: string;
  description?: string;
  nodes: TalentNode[];
  connections: Connection[];
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