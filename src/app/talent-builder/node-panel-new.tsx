// New Node Properties Panel
{/* Node Properties Panel - Floating */}
{selectedNode && (
  <div className="fixed left-4 bottom-4 z-30 bg-gray-900/95 backdrop-blur p-4 rounded-lg border border-yellow-400/50 w-96 max-h-[65vh] overflow-y-auto">
    <h3 className="text-lg font-bold text-yellow-400 mb-3">Edit Node</h3>
    {nodes.filter(n => n.id === selectedNode).map(node => (
      <div key={node.id} className="space-y-3">
        {/* Name with Autocomplete */}
        <div className="relative">
          <label className="text-xs text-gray-400">Attribute</label>
          <input
            type="text"
            value={node.name}
            onChange={(e) => {
              updateNode(node.id, { name: e.target.value });
              if (builderMode === 'circutree') {
                setVariationSearch(e.target.value);
                setShowVariationPicker(true);
              }
            }}
            onFocus={(e) => {
              if (builderMode === 'circutree') {
                e.target.select();
                setShowVariationPicker(true);
              }
            }}
            placeholder="Type to search attributes..."
            className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
          />
          
          {/* Autocomplete dropdown */}
          {builderMode === 'circutree' && showVariationPicker && variationSearch && (
            <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-600 rounded-lg max-h-40 overflow-y-auto">
              {filteredVariations.length > 0 ? (
                filteredVariations.slice(0, 10).map(variation => (
                  <div
                    key={`${variation.type}-${variation.name}`}
                    onClick={() => {
                      updateNode(node.id, {
                        name: variation.name,
                        variation: variation.name,
                        variationType: variation.type,
                        goldCost: variation.xp * 10,
                        imageUrl: `/variation-images/${variation.name.toLowerCase().replace(/ /g, '-')}.png`
                      });
                      setVariationSearch("");
                      setShowVariationPicker(false);
                    }}
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
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400">Tier</label>
            <input
              type="number"
              value={node.tier}
              onChange={(e) => updateNode(node.id, { tier: parseInt(e.target.value) })}
              className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Position</label>
            <div className="flex gap-1">
              <input
                type="number"
                value={node.x}
                onChange={(e) => updateNode(node.id, { x: parseInt(e.target.value) })}
                className="w-1/2 px-2 py-1 bg-gray-800 text-white rounded text-sm"
                placeholder="X"
              />
              <input
                type="number"
                value={node.y}
                onChange={(e) => updateNode(node.id, { y: parseInt(e.target.value) })}
                className="w-1/2 px-2 py-1 bg-gray-800 text-white rounded text-sm"
                placeholder="Y"
              />
            </div>
          </div>
        </div>
        
        {/* CiruTree specific fields */}
        {builderMode === 'circutree' && (
          <>
            {/* Gold Cost */}
            <div>
              <label className="text-xs text-gray-400">Gold Cost</label>
              <input
                type="number"
                value={node.goldCost || 0}
                onChange={(e) => updateNode(node.id, { goldCost: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
              />
            </div>
            
            {/* Essence Requirements */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Essence Requirements</label>
              <div className="space-y-2">
                {(node.essences || []).map((essence, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={essence.attribute}
                      onChange={(e) => {
                        const newEssences = [...(node.essences || [])];
                        newEssences[index].attribute = e.target.value;
                        updateNode(node.id, { essences: newEssences });
                        setEssenceSearch(e.target.value);
                        setShowEssencePicker(true);
                      }}
                      onFocus={(e) => {
                        e.target.select();
                        setEssenceSearch(e.target.value);
                        setShowEssencePicker(true);
                      }}
                      placeholder="Type attribute..."
                      className="flex-1 px-2 py-1 bg-gray-800 text-white rounded text-sm"
                    />
                    <input
                      type="number"
                      value={essence.amount}
                      onChange={(e) => {
                        const newEssences = [...(node.essences || [])];
                        newEssences[index].amount = parseInt(e.target.value) || 0;
                        updateNode(node.id, { essences: newEssences });
                      }}
                      className="w-20 px-2 py-1 bg-gray-800 text-white rounded text-sm"
                      min="1"
                    />
                    <button
                      onClick={() => {
                        const newEssences = [...(node.essences || [])];
                        newEssences.splice(index, 1);
                        updateNode(node.id, { essences: newEssences });
                      }}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                
                {/* Essence autocomplete */}
                {showEssencePicker && essenceSearch && (
                  <div className="relative">
                    <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-600 rounded-lg max-h-32 overflow-y-auto">
                      {filteredVariations.filter(v => v.name.toLowerCase().includes(essenceSearch.toLowerCase())).slice(0, 5).map(variation => (
                        <div
                          key={`${variation.type}-${variation.name}`}
                          onClick={() => {
                            const essences = node.essences || [];
                            const lastIndex = essences.length - 1;
                            if (lastIndex >= 0) {
                              essences[lastIndex].attribute = variation.name;
                              updateNode(node.id, { essences });
                            }
                            setEssenceSearch("");
                            setShowEssencePicker(false);
                          }}
                          className="px-3 py-1 hover:bg-gray-800 cursor-pointer text-sm"
                        >
                          {variation.name} Essence
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    const newEssences = [...(node.essences || []), { attribute: '', amount: 1 }];
                    updateNode(node.id, { essences: newEssences });
                  }}
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
                {(node.ingredients || []).map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={ingredient}
                      onChange={(e) => {
                        const newIngredients = [...(node.ingredients || [])];
                        newIngredients[index] = e.target.value;
                        updateNode(node.id, { ingredients: newIngredients });
                      }}
                      placeholder="e.g., Ancient Rune"
                      className="flex-1 px-2 py-1 bg-gray-800 text-white rounded text-sm"
                    />
                    <button
                      onClick={() => {
                        const newIngredients = [...(node.ingredients || [])];
                        newIngredients.splice(index, 1);
                        updateNode(node.id, { ingredients: newIngredients });
                      }}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newIngredients = [...(node.ingredients || []), ''];
                    updateNode(node.id, { ingredients: newIngredients });
                  }}
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
              value={node.xp}
              onChange={(e) => updateNode(node.id, { xp: parseInt(e.target.value) })}
              className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
            />
          </div>
        )}
        
        <button
          onClick={() => {
            deleteNode(node.id);
            setShowVariationPicker(false);
            setShowEssencePicker(false);
          }}
          className="w-full px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
          disabled={node.id === 'start'}
        >
          Delete Node
        </button>
      </div>
    ))}
  </div>
)}