import { ComponentType } from '../types';
import { VARIATION_TREES } from '../constants/variationTrees';
import { HEADS_VARIATIONS, BODIES_VARIATIONS, TRAITS_VARIATIONS } from '../constants/variations';
import { AVAILABLE_RECIPES } from '../constants/mockData';

export const getBaseVariations = (type: ComponentType) => {
  return Object.keys(VARIATION_TREES[type] || {});
};

export const getStyles = (type: ComponentType, variation: string) => {
  return VARIATION_TREES[type]?.[variation]?.styles || ["Clean", "Gatling", "Drill"];
};

export const getFinalVariations = (type: ComponentType, variation: string, style: string) => {
  return VARIATION_TREES[type]?.[variation]?.variations?.[style] || 
    (type === 'heads' ? HEADS_VARIATIONS.slice(0, 12) :
     type === 'bodies' ? BODIES_VARIATIONS.slice(0, 12) :
     TRAITS_VARIATIONS.slice(0, 12));
};

export const hasRecipeForVariation = (variation: string): boolean => {
  return AVAILABLE_RECIPES.includes(variation);
};

export const getVariationImagePath = (variation: string): string => {
  const baseVariationMap: { [key: string]: string } = {
    // Heads base variations
    'Accordion': 'recon',
    'Rolleiflex': 'snapshot', 
    'Turret': 'terminator',
    'Polaroid': 'cream',
    'Security': 'nightstalker',
    '35mm': 'projectionist',
    'Flashbulb': 'lightning',
    '8mm': 'silent_film',
    'Reels': 'arcade',
    'Projector': 'heatmap',
    // Bodies base variations
    'Cartoon': 'cartoon',
    'Irons': 'iron',
    'Luxury': 'luxury',
    'Stone': 'stone',
    'Bob Ross': 'oil',
    // Traits base variations
    'Wings': 'wings',
    'Weapons': 'golden_guns',
    'Laser': 'light',
    'Instruments': 'microphone',
    'Turret': 'tactical',
    'Drill': 'drill',
    // Style variations
    'Clean': 'mint',
    'Gatling': 'hammerheat',
    'Brain': 'hacker',
    'Gummy': 'jolly_rancher',
    'Defense': 'kevlar',
    'Assault': 'nuke',
    'Tactical': 'tactical',
    'Instant': 'snapshot',
    'Vintage': 'classic',
    'Modern': 'neon_flamingo'
  };
  
  const mappedImage = baseVariationMap[variation];
  if (mappedImage) {
    return `/variation-images/${mappedImage}.png`;
  }
  
  const processedName = variation.toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/['']/g, '')
    .replace(/&/g, '_')
    .replace(/__+/g, '_')
    .replace(/\?\?\?/g, 'qqq')
    .replace(/\./g, '')
    .replace(/1960's/gi, '1960s')
    .replace(/dr\./gi, 'dr')
    .replace(/101\.1_fm/gi, '101.1_fm')
    .replace(/mac_&_cheese/gi, 'mac_&_cheese')
    .replace(/r&b/gi, 'r&b')
    .replace(/desufnoc/gi, 'desufnoc');
    
  return `/variation-images/${processedName}.png`;
};

export const getComponentIcon = (type: ComponentType): string => {
  switch (type) {
    case 'heads':
      return '📷';
    case 'bodies':
      return '🤖';
    case 'traits':
      return '⚡';
    default:
      return '❓';
  }
};