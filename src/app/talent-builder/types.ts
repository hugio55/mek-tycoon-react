export interface Template {
  _id: string;
  name: string;
  description?: string;
  nodes: TalentNode[];
  connections: Connection[];
  category?: string;
}

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
  goldReward?: number;
  essenceRewards?: { type: string; amount: number }[];
  otherRewards?: { item: string; quantity: number }[]; // For event and boss nodes
  eventName?: string; // For event nodes
  bossMekId?: string; // For boss nodes
  // Additional optional fields found in code
  unlocked?: boolean;
  buffGrant?: any; // Type not clear from usage
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

export type BuilderMode = 'circutree' | 'mek' | 'story';