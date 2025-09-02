import React, { memo, useCallback } from 'react';
import { TalentNode, BuilderMode, SavedSpell } from './types';
import { TalentAction } from './talentReducer';
import { getAllVariations } from '../../lib/variationsData';

interface PropertyPanelProps {
  selectedNode: TalentNode | null;
  builderMode: BuilderMode;
  variationSearch: string;
  showVariationPicker: boolean;
  showEssencePicker: boolean;
  essenceSearch: string;
  savedSpells: SavedSpell[];
  dispatch: React.Dispatch<TalentAction>;
  onDeleteNode: (nodeId: string) => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = memo(({
  selectedNode,
  builderMode,
  variationSearch,
  showVariationPicker,
  showEssencePicker,
  essenceSearch,
  savedSpells,
  dispatch,
  onDeleteNode
}) => {
  const allVariations = getAllVariations();
  const filteredVariations = variationSearch
    ? allVariations.filter(v => 
        v.name.toLowerCase().includes(variationSearch.toLowerCase())
      ).slice(0, 10)
    : [];
    
  const filteredEssences = essenceSearch
    ? allVariations.filter(v => 
        v.name.toLowerCase().includes(essenceSearch.toLowerCase())
      ).slice(0, 5)
    : [];

  const updateNode = useCallback((updates: Partial<TalentNode>) => {
    if (!selectedNode) return;
    dispatch({ 
      type: 'UPDATE_NODE', 
      nodeId: selectedNode.id, 
      updates 
    });
  }, [selectedNode, dispatch]);

  const handleVariationSelect = useCallback((variation: any) => {
    updateNode({
      name: variation.name,
      variation: variation.name,
      variationType: variation.type,
      goldCost: variation.xp * 10,
      imageUrl: `/variation-images/${variation.name.toLowerCase().replace(/ /g, '-')}.png`
    });
    dispatch({ type: 'SET_VARIATION_SEARCH', payload: '' });
    dispatch({ type: 'SET_SHOW_VARIATION_PICKER', payload: false });
  }, [updateNode, dispatch]);

  const handleEssenceAdd = useCallback(() => {
    if (!selectedNode) return;
    const newEssences = [...(selectedNode.essences || []), { attribute: '', amount: 1 }];
    updateNode({ essences: newEssences });
  }, [selectedNode, updateNode]);

  const handleEssenceRemove = useCallback((index: number) => {
    if (!selectedNode) return;
    const newEssences = [...(selectedNode.essences || [])];
    newEssences.splice(index, 1);
    updateNode({ essences: newEssences });
  }, [selectedNode, updateNode]);

  const handleIngredientAdd = useCallback(() => {
    if (!selectedNode) return;
    const newIngredients = [...(selectedNode.ingredients || []), ''];
    updateNode({ ingredients: newIngredients });
  }, [selectedNode, updateNode]);

  const handleIngredientRemove = useCallback((index: number) => {
    if (!selectedNode) return;
    const newIngredients = [...(selectedNode.ingredients || [])];
    newIngredients.splice(index, 1);
    updateNode({ ingredients: newIngredients });
  }, [selectedNode, updateNode]);

  if (!selectedNode) return null;

  return (
    <div className="fixed left-4 bottom-4 z-30 bg-gray-900/95 backdrop-blur p-4 rounded-lg border border-yellow-400/50 w-96 max-h-[60vh] overflow-y-auto">
      <h3 className="text-lg font-bold text-yellow-400 mb-3">Edit Node</h3>
      
      <div className="space-y-3">
        {/* Name with Autocomplete */}
        <div className="relative">
          <label className="text-xs text-gray-400">Attribute</label>
          <input
            type="text"
            value={selectedNode.name}
            onChange={(e) => {
              updateNode({ name: e.target.value });
              if (builderMode === 'circutree') {
                dispatch({ type: 'SET_VARIATION_SEARCH', payload: e.target.value });
                dispatch({ type: 'SET_SHOW_VARIATION_PICKER', payload: true });
              }
            }}
            onFocus={(e) => {
              if (builderMode === 'circutree') {
                e.target.select();
                dispatch({ type: 'SET_SHOW_VARIATION_PICKER', payload: true });
                dispatch({ type: 'SET_SHOW_ESSENCE_PICKER', payload: false });
              }
            }}
            onBlur={() => {
              setTimeout(() => dispatch({ type: 'SET_SHOW_VARIATION_PICKER', payload: false }), 200);
            }}
            placeholder="Type to search attributes..."
            className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
          />
          
          {/* Autocomplete dropdown */}
          {builderMode === 'circutree' && showVariationPicker && variationSearch && (
            <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-600 rounded-lg max-h-40 overflow-y-auto">
              {filteredVariations.length > 0 ? (
                filteredVariations.map(variation => (
                  <div
                    key={`${variation.type}-${variation.name}`}
                    onClick={() => handleVariationSelect(variation)}
                    className="px-3 py-2 hover:bg-gray-800 cursor-pointer border-b border-gray-700 last:border-b-0"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-white font-medium">{variation.name}</span>
                        <span className="ml-2 text-xs text-gray-400">({variation.type})</span>
                      </div>
                      <span className="text-xs text-gray-500">{variation.copies} copies</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500">No attributes found</div>
              )}
            </div>
          )}
        </div>
        
        {/* Position and Tier */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400">Tier</label>
            <input
              type="number"
              value={selectedNode.tier}
              onChange={(e) => updateNode({ tier: parseInt(e.target.value) })}
              className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Position</label>
            <div className="flex gap-1">
              <input
                type="number"
                value={selectedNode.x}
                onChange={(e) => updateNode({ x: parseInt(e.target.value) })}
                className="w-1/2 px-2 py-1 bg-gray-800 text-white rounded text-sm"
                placeholder="X"
              />
              <input
                type="number"
                value={selectedNode.y}
                onChange={(e) => updateNode({ y: parseInt(e.target.value) })}
                className="w-1/2 px-2 py-1 bg-gray-800 text-white rounded text-sm"
                placeholder="Y"
              />
            </div>
          </div>
        </div>
        
        {/* CiruTree specific fields */}
        {builderMode === 'circutree' && (
          <>
            {/* Node Type Selector */}
            <div>
              <label className="text-xs text-gray-400">Node Type</label>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => updateNode({ isSpell: false })}
                  className={`flex-1 px-2 py-1 text-sm rounded ${
                    !selectedNode.isSpell ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Variation
                </button>
                <button
                  onClick={() => updateNode({ isSpell: true })}
                  className={`flex-1 px-2 py-1 text-sm rounded ${
                    selectedNode.isSpell ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Spell
                </button>
              </div>
            </div>
            
            {/* Spell-specific fields */}
            {selectedNode.isSpell && (
              <>
                <div>
                  <label className="text-xs text-gray-400">Select Spell</label>
                  <select
                    value={selectedNode.spellType || ''}
                    onChange={(e) => {
                      const spell = savedSpells.find(s => s.id === e.target.value);
                      if (spell) {
                        updateNode({
                          spellType: spell.id,
                          name: spell.name,
                          desc: spell.description,
                          goldCost: spell.unlockPrice.gold,
                          xp: spell.unlockPrice.level
                        });
                      }
                    }}
                    className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                  >
                    <option value="">Select a spell...</option>
                    {savedSpells.map(spell => (
                      <option key={spell.id} value={spell.id}>
                        {spell.name} ({spell.rarity})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-xs text-gray-400">Special Ingredient</label>
                  <input
                    type="text"
                    value={selectedNode.specialIngredient || ''}
                    onChange={(e) => updateNode({ specialIngredient: e.target.value })}
                    placeholder="e.g., Dragon Scale"
                    className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                  />
                </div>
              </>
            )}
            
            {/* Gold Cost */}
            <div>
              <label className="text-xs text-gray-400">Gold Cost</label>
              <input
                type="number"
                value={selectedNode.goldCost || 0}
                onChange={(e) => updateNode({ goldCost: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
              />
            </div>
            
            {/* Essence Requirements */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Essence Requirements</label>
              <div className="space-y-2">
                {(selectedNode.essences || []).map((essence, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={essence.attribute}
                      onChange={(e) => {
                        const newEssences = [...(selectedNode.essences || [])];
                        newEssences[index].attribute = e.target.value;
                        updateNode({ essences: newEssences });
                        dispatch({ type: 'SET_ESSENCE_SEARCH', payload: e.target.value });
                        dispatch({ type: 'SET_SHOW_ESSENCE_PICKER', payload: true });
                      }}
                      placeholder="Type attribute..."
                      className="flex-1 px-2 py-1 bg-gray-800 text-white rounded text-sm"
                    />
                    <input
                      type="number"
                      value={essence.amount}
                      onChange={(e) => {
                        const newEssences = [...(selectedNode.essences || [])];
                        newEssences[index].amount = parseInt(e.target.value) || 0;
                        updateNode({ essences: newEssences });
                      }}
                      className="w-20 px-2 py-1 bg-gray-800 text-white rounded text-sm"
                      min="1"
                    />
                    <button
                      onClick={() => handleEssenceRemove(index)}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={handleEssenceAdd}
                  className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                >
                  + Add Essence
                </button>
              </div>
            </div>
            
            {/* Ingredients */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Ingredients</label>
              <div className="space-y-2">
                {(selectedNode.ingredients || []).map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={ingredient}
                      onChange={(e) => {
                        const newIngredients = [...(selectedNode.ingredients || [])];
                        newIngredients[index] = e.target.value;
                        updateNode({ ingredients: newIngredients });
                      }}
                      placeholder="e.g., Ancient Rune"
                      className="flex-1 px-2 py-1 bg-gray-800 text-white rounded text-sm"
                    />
                    <button
                      onClick={() => handleIngredientRemove(index)}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleIngredientAdd}
                  className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                >
                  + Add Ingredient
                </button>
              </div>
            </div>
          </>
        )}
        
        {/* Mek specific fields */}
        {builderMode === 'mek' && (
          <div>
            <label className="text-xs text-gray-400">XP Cost</label>
            <input
              type="number"
              value={selectedNode.xp}
              onChange={(e) => updateNode({ xp: parseInt(e.target.value) })}
              className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
            />
          </div>
        )}
        
        <button
          onClick={() => onDeleteNode(selectedNode.id)}
          className="w-full px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
          disabled={selectedNode.id === 'start'}
        >
          Delete Node
        </button>
      </div>
    </div>
  );
});

PropertyPanel.displayName = 'PropertyPanel';

export default PropertyPanel;