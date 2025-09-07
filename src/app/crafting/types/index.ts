export type Category = 'main' | 'group' | 'style' | 'variation';
export type ComponentType = 'heads' | 'bodies' | 'traits';

export interface VariationTree {
  styles: string[];
  variations: {
    [style: string]: string[];
  };
}

export interface VariationTrees {
  [type: string]: {
    [variation: string]: VariationTree;
  };
}

export interface CraftedItem {
  name: string;
  type: ComponentType;
}

export interface UserMek {
  id: string;
  name: string;
  headSlot: string | null;
  bodySlot: string | null;
  traitSlot: string | null;
  headFilled: boolean;
  bodyFilled: boolean;
  traitFilled: boolean;
}

export interface ComponentCategory {
  type: ComponentType;
  icon: string;
  name: string;
  desc: string;
  count: number;
}

export interface RecipeRequirement {
  icon: string;
  amount: number;
  name: string;
  current?: number;
  required?: number;
  hasEnough?: boolean;
}

export interface RarityBias {
  percent: number;
  height: number;
  rank: string;
  color: string;
  active?: boolean;
}

export interface CraftingPath {
  type: ComponentType | null;
  variation: string | null;
  style: string | null;
  final: string | null;
}