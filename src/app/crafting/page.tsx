"use client";

import BackgroundEffects from "@/components/BackgroundEffects";
import { useCraftingState } from './hooks/useCraftingState';
import { getBaseVariations, getStyles, getFinalVariations } from './utils';
import {
  CategorySelector,
  ChipTypeSelector,
  CraftedItemPopup,
  MekSelector,
  PathBreadcrumb,
  RecipeDisplay,
  VariationGrid
} from './components';

export default function CraftingPage() {
  const {
    // State
    chipType,
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
    selectMekChips,
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
  } = useCraftingState();

  return (
    <div className="text-white py-8 min-h-screen relative">
      <BackgroundEffects />
      
      {/* Chip Type Selection (Uni-Chips vs Mek-Chips) */}
      {!chipType && !showRecipe && (
        <ChipTypeSelector onSelectMekChips={selectMekChips} />
      )}
      
      {/* Main Category Selection (for Mek-Chips) */}
      {chipType === 'mek' && currentCategory === 'main' && !showRecipe && (
        <CategorySelector onSelectCategory={showCategory} />
      )}

      {/* Variation Selection (Base variations like Accordion, Rolleiflex, etc.) */}
      {currentCategory === 'group' && selectedType && !showRecipe && (
        <>
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={goBack}
              className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-lg transition-all border border-gray-700 hover:border-yellow-500"
            >
              ← Back
            </button>
          </div>
          <PathBreadcrumb
            selectedType={selectedType}
            selectedVariation={selectedVariation}
            selectedStyle={selectedStyle}
            currentCategory={currentCategory}
            onNavigate={navigateToCategory}
            onReset={resetCrafting}
          />
          <VariationGrid
            variations={getBaseVariations(selectedType)}
            onSelect={selectVariation}
            showImages={true}
            selectedType={selectedType}
            searchable={true}
          />
        </>
      )}

      {/* Style Selection (Clean, Gatling, Drill, etc.) */}
      {currentCategory === 'style' && selectedVariation && selectedType && !showRecipe && (
        <>
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={goBack}
              className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-lg transition-all border border-gray-700 hover:border-yellow-500"
            >
              ← Back
            </button>
          </div>
          <PathBreadcrumb
            selectedType={selectedType}
            selectedVariation={selectedVariation}
            selectedStyle={selectedStyle}
            currentCategory={currentCategory}
            onNavigate={navigateToCategory}
            onReset={resetCrafting}
          />
          <VariationGrid
            variations={getStyles(selectedType, selectedVariation)}
            onSelect={selectStyle}
            showImages={true}
            selectedType={selectedType}
          />
        </>
      )}

      {/* Final Variation Selection */}
      {currentCategory === 'variation' && selectedStyle && selectedVariation && selectedType && !showRecipe && (
        <>
          <div className="flex items-center mb-6">
            <button 
              onClick={goBack}
              className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-lg transition-all border border-gray-700 hover:border-yellow-500 mr-4"
            >
              ← Back
            </button>
          </div>
          <PathBreadcrumb
            selectedType={selectedType}
            selectedVariation={selectedVariation}
            selectedStyle={selectedStyle}
            currentCategory={currentCategory}
            onNavigate={navigateToCategory}
            onReset={resetCrafting}
          />
          <VariationGrid
            variations={getFinalVariations(selectedType, selectedVariation, selectedStyle)}
            onSelect={selectFinalVariation}
            showImages={true}
            selectedType={selectedType}
          />
        </>
      )}

      {/* Recipe Display */}
      {showRecipe && selectedFinal && selectedType && selectedVariation && selectedStyle && (
        <RecipeDisplay
          selectedFinal={selectedFinal}
          selectedType={selectedType}
          selectedVariation={selectedVariation}
          selectedStyle={selectedStyle}
          onBack={goBack}
          onCraftSuccess={handleCraftSuccess}
        />
      )}
      
      {/* Add animation keyframes */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.05);
          }
        }
        
        @keyframes radiateFromEdge {
          0% {
            transform: translate(-50%, -50%);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--endX), var(--endY));
            opacity: 0;
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        
        @keyframes spinGlow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        @keyframes magicParticle {
          0% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0) scale(1);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-150px) translateX(var(--turbulence)) scale(0);
            opacity: 0;
          }
        }
        
        @keyframes pulsateStrong {
          0%, 100% {
            transform: scaleX(1);
            opacity: 0.9;
          }
          50% {
            transform: scaleX(1.05);
            opacity: 1;
          }
        }
        
        @keyframes redPulse {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
      
      {/* Crafted Item Popup */}
      {showCraftedPopup && craftedItem && (
        <CraftedItemPopup
          craftedItem={craftedItem}
          onEquip={handleEquipClick}
          onContinue={handleContinueCrafting}
          onClose={() => setShowCraftedPopup(false)}
        />
      )}
      
      {/* Mek Selection Grid */}
      {showMekSelector && craftedItem && (
        <MekSelector
          craftedItem={craftedItem}
          onSelectMek={handleMekSelect}
          onClose={() => {
            setShowMekSelector(false);
            resetCrafting();
          }}
        />
      )}
    </div>
  );
}