export interface Mek {
  id: string;
  name: string;
  variation: string;
  style?: string;
  traits?: string[];
  image?: string;
  hasMatch?: boolean;
}

export interface MissionReward {
  id: number;
  name: string;
  amount: number | string;
  dropChance: number;
  type: 'chip' | 'essence' | 'item' | 'frame' | 'material';
  icon?: string;
  image?: string;
}

export interface Contract {
  id: string;
  name: string;
  mekSlots: number;
}

export interface Mission {
  id: string;
  contractId: string;
  isGlobal: boolean;
  mekSlots: number;
  goldReward: number;
  xpReward: number;
  deployFee: number;
  deployFeeType: 'gold' | 'essence';
  deployFeeEssence?: { name: string; amount: number };
  expiryHours: number;
  endTime: number;
  rewards: MissionReward[];
  weaknesses: string[];
  multipliers: SuccessMultiplier[];
  selectedMeks?: Mek[];
  successRate?: number;
  dailyVariation?: string;
}

export interface SuccessMultiplier {
  id: string;
  name: string;
  image: string;
  bonus: string;
}

export interface MissionAilment {
  name: string;
  icon: string;
  counters: string[];
}

export type ElegantVariation = 
  | "elegant-v1-clean"
  | "elegant-v2-minimal"
  | "elegant-v3-gradient"
  | "elegant-v4-flat"
  | "elegant-v5-asymmetric"
  | "elegant-v6-compact"
  | "elegant-v7-horizontal"
  | "elegant-v8-cards"
  | "elegant-v9-modern"
  | "elegant-v10-premium"
  | "industrial-v1"
  | "industrial-v2"
  | "industrial-v3-grid"
  | "style-f-yellow";

export type BorderStyle = 
  | "rounded-gray"
  | "rounded-gold"
  | "sharp-gray"
  | "sharp-gold"
  | "rounded-thick-gray"
  | "rounded-thick-gold"
  | "sharp-double-gray"
  | "sharp-double-gold"
  | "rounded-gradient"
  | "sharp-neon";

export interface MekSlotProps {
  index: number;
  isLocked: boolean;
  mek?: Mek;
  missionId: string;
  onClick?: () => void;
  onHover?: (hovering: boolean) => void;
  style?: number;
}

export interface MissionCardProps {
  mission: Mission;
  variation?: ElegantVariation;
  borderStyle?: BorderStyle;
  onDeploy?: () => void;
  onMekSelect?: (missionId: string, slotIndex: number) => void;
  hoveredAilment?: string | null;
  setHoveredAilment?: (ailment: string | null) => void;
  matchedBonuses?: string[];
  animatingSuccess?: number;
  currentTime?: number;
}