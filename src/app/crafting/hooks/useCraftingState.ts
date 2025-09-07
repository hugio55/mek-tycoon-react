import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Category, ComponentType, CraftedItem } from '../types';

export function useCraftingState() {
  const router = useRouter();
  
  // Navigation state
  const [currentCategory, setCurrentCategory] = useState<Category>('main');
  const [selectedType, setSelectedType] = useState<ComponentType | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedFinal, setSelectedFinal] = useState<string | null>(null);
  
  // UI state
  const [showRecipe, setShowRecipe] = useState(false);
  const [showCraftedPopup, setShowCraftedPopup] = useState(false);
  const [showMekSelector, setShowMekSelector] = useState(false);
  const [craftedItem, setCraftedItem] = useState<CraftedItem | null>(null);

  const showCategory = (type: ComponentType) => {
    setSelectedType(type);
    setCurrentCategory('group');
  };

  const selectVariation = (variation: string) => {
    setSelectedVariation(variation);
    setCurrentCategory('style');
  };

  const selectStyle = (style: string) => {
    setSelectedStyle(style);
    setCurrentCategory('variation');
  };

  const selectFinalVariation = (final: string) => {
    setSelectedFinal(final);
    setShowRecipe(true);
  };

  const resetCrafting = () => {
    setCurrentCategory('main');
    setSelectedType(null);
    setSelectedVariation(null);
    setSelectedStyle(null);
    setSelectedFinal(null);
    setShowRecipe(false);
    setShowCraftedPopup(false);
    setShowMekSelector(false);
    setCraftedItem(null);
  };

  const goBack = () => {
    if (showRecipe) {
      setShowRecipe(false);
      setSelectedFinal(null);
    } else if (currentCategory === 'variation') {
      setCurrentCategory('style');
      setSelectedFinal(null);
    } else if (currentCategory === 'style') {
      setCurrentCategory('group');
      setSelectedStyle(null);
    } else if (currentCategory === 'group') {
      setCurrentCategory('main');
      setSelectedVariation(null);
      setSelectedType(null);
    }
  };

  const navigateToCategory = (category: Category) => {
    setCurrentCategory(category);
    if (category === 'group') {
      setSelectedStyle(null);
      setSelectedFinal(null);
    } else if (category === 'style') {
      setSelectedFinal(null);
    }
  };

  const handleCraftSuccess = (item: CraftedItem) => {
    setCraftedItem(item);
    setShowCraftedPopup(true);
  };

  const handleEquipClick = () => {
    setShowCraftedPopup(false);
    setShowMekSelector(true);
  };

  const handleMekSelect = (mekId: string) => {
    router.push(`/mek/${mekId}?equip=${selectedType}&item=${selectedFinal}`);
  };

  const handleContinueCrafting = () => {
    setShowCraftedPopup(false);
    resetCrafting();
  };

  return {
    // State
    currentCategory,
    selectedType,
    selectedVariation,
    selectedStyle,
    selectedFinal,
    showRecipe,
    showCraftedPopup,
    showMekSelector,
    craftedItem,
    
    // Actions
    showCategory,
    selectVariation,
    selectStyle,
    selectFinalVariation,
    resetCrafting,
    goBack,
    navigateToCategory,
    handleCraftSuccess,
    handleEquipClick,
    handleMekSelect,
    handleContinueCrafting,
    setShowCraftedPopup,
    setShowMekSelector
  };
}