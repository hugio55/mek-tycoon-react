import React, { memo, useCallback, useRef, useState, useMemo } from 'react';
import { Template, SavedCiruTree, TalentNode, Connection, TreeCategoryWithCounts } from '@/app/talent-builder/types';
import { TalentAction } from './talentReducer';
import { Id } from '../../../convex/_generated/dataModel';

interface TemplateManagerProps {
  show: boolean;
  templates?: Template[];
  categories?: TreeCategoryWithCounts[];
  savedCiruTrees?: SavedCiruTree[];
  onClose: () => void;
  onLoadTemplate: (nodes: TalentNode[], connections: Connection[], templateId?: string, categoryId?: string) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onSetActiveTemplate?: (categoryId: string, templateId: string) => void;
  onCreateDefaultTemplates?: () => void;
  dispatch: React.Dispatch<TalentAction>;
  mode: 'mek' | 'cirutree';
}

const TemplateManager: React.FC<TemplateManagerProps> = memo(({
  show,
  templates,
  categories,
  savedCiruTrees,
  onClose,
  onLoadTemplate,
  onDeleteTemplate,
  onSetActiveTemplate,
  onCreateDefaultTemplates,
  dispatch,
  mode
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Group templates by category
  const { categorizedTemplates, uncategorizedTemplates } = useMemo(() => {
    if (!templates) return { categorizedTemplates: new Map(), uncategorizedTemplates: [] };

    const categorized = new Map<string, Template[]>();
    const uncategorized: Template[] = [];

    templates.forEach(template => {
      if (template.categoryId) {
        const existing = categorized.get(template.categoryId) || [];
        categorized.set(template.categoryId, [...existing, template]);
      } else {
        uncategorized.push(template);
      }
    });

    return { categorizedTemplates: categorized, uncategorizedTemplates: uncategorized };
  }, [templates]);

  // Get templates for selected category view
  const displayedTemplates = useMemo(() => {
    if (selectedCategoryId === null) {
      return uncategorizedTemplates;
    }
    return categorizedTemplates.get(selectedCategoryId) || [];
  }, [selectedCategoryId, categorizedTemplates, uncategorizedTemplates]);

  // Get selected category
  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId || !categories) return null;
    return categories.find(c => c._id === selectedCategoryId) || null;
  }, [selectedCategoryId, categories]);

  const handleLoad = useCallback((template: Template) => {
    onLoadTemplate(template.nodes, template.connections, template._id, template.categoryId);

    // Auto-align to start node
    const startNode = template.nodes.find((n: TalentNode) => n.id === 'start');
    if (startNode && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      dispatch({
        type: 'SET_PAN_OFFSET',
        payload: {
          x: canvasRect.width / 2 - startNode.x,
          y: canvasRect.height / 2 - startNode.y
        }
      });
      dispatch({ type: 'SET_ZOOM', payload: 1 });
    }

    // Set the template name for editing
    dispatch({ type: 'SET_TEMPLATE_NAME', payload: template.name });
    dispatch({ type: 'SET_SELECTED_TEMPLATE_ID', payload: template._id });

    onClose();
    dispatch({ type: 'SET_SAVE_STATUS', payload: 'Loaded successfully' });
    setTimeout(() => dispatch({ type: 'SET_SAVE_STATUS', payload: '' }), 2000);
  }, [onLoadTemplate, onClose, dispatch]);

  const handleSetActive = useCallback((index: number) => {
    if (!savedCiruTrees) return;

    const saves = [...savedCiruTrees];
    saves.forEach((s: SavedCiruTree) => s.isActive = false);
    saves[index].isActive = true;

    localStorage.setItem('ciruTreeSaves', JSON.stringify(saves));
    localStorage.setItem('publicTalentTree', JSON.stringify(saves[index].data));

    dispatch({ type: 'SET_SAVE_STATUS', payload: 'Set as active website tree' });
    setTimeout(() => dispatch({ type: 'SET_SAVE_STATUS', payload: '' }), 2000);
    onClose();
  }, [savedCiruTrees, dispatch, onClose]);

  const handleSetActiveTemplate = useCallback((template: Template) => {
    if (!template.categoryId || !onSetActiveTemplate) return;
    onSetActiveTemplate(template.categoryId, template._id);
  }, [onSetActiveTemplate]);

  const handleDelete = useCallback((index: number) => {
    if (!confirm('Delete this saved tree?')) return;

    if (mode === 'cirutree' && savedCiruTrees) {
      const saves = [...savedCiruTrees];
      saves.splice(index, 1);
      localStorage.setItem('ciruTreeSaves', JSON.stringify(saves));
      // Reload the modal
      onClose();
      setTimeout(() => dispatch({ type: 'SET_SHOW_CIRU_TREE_LOADER', payload: true }), 100);
    }
  }, [mode, savedCiruTrees, onClose, dispatch]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">
          {mode === 'mek' ? 'Mek Template Manager' : 'Load CiruTree'}
        </h2>

        {mode === 'mek' && !templates && onCreateDefaultTemplates && (
          <button
            onClick={onCreateDefaultTemplates}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded mb-4"
          >
            Create Default Templates
          </button>
        )}

        {/* Category Tabs for Mek Mode */}
        {mode === 'mek' && categories && categories.length > 0 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                selectedCategoryId === null
                  ? 'bg-gray-600 text-white font-medium'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Uncategorized ({uncategorizedTemplates.length})
            </button>
            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => setSelectedCategoryId(category._id)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all flex items-center gap-2 ${
                  selectedCategoryId === category._id
                    ? 'bg-purple-600 text-white font-medium'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {category.name} ({category.templateCount})
                {category.hasActiveTemplate && (
                  <span className="w-2 h-2 rounded-full bg-green-400" title="Has active template" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Category Info Banner */}
        {mode === 'mek' && selectedCategory && (
          <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-purple-300">{selectedCategory.name}</h3>
                {selectedCategory.description && (
                  <p className="text-sm text-gray-400">{selectedCategory.description}</p>
                )}
              </div>
              {selectedCategory.activeTemplateId && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  Active template set
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto" ref={canvasRef}>
          {mode === 'mek' && displayedTemplates.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {displayedTemplates.map((template: Template) => {
                const isActive = selectedCategory?.activeTemplateId === template._id;
                return (
                  <div
                    key={template._id}
                    className={`bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-all border ${
                      isActive ? 'border-green-500 bg-green-900/20' : 'border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-yellow-400">{template.name}</h3>
                      {isActive && (
                        <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{template.description}</p>
                    <div className="text-xs text-gray-500 mb-3">
                      Nodes: {template.nodes.length} | Connections: {template.connections.length}
                      {template.updatedAt && (
                        <span className="ml-2">| {new Date(template.updatedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleLoad(template)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                      >
                        Load
                      </button>
                      {template.categoryId && onSetActiveTemplate && !isActive && (
                        <button
                          onClick={() => handleSetActiveTemplate(template)}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                        >
                          Set as Active
                        </button>
                      )}
                      {onDeleteTemplate && (
                        <button
                          onClick={() => onDeleteTemplate(template._id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : mode === 'mek' && templates && templates.length > 0 ? (
            <div className="text-center py-8 text-gray-400">
              No templates in this category. Select a different category or create a new template.
            </div>
          ) : mode === 'cirutree' && savedCiruTrees && savedCiruTrees.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {savedCiruTrees.map((save: SavedCiruTree, index: number) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-all"
                >
                  <h3 className="font-bold text-yellow-400 mb-2">{save.name}</h3>
                  <div className="text-sm text-gray-400 mb-3">
                    Nodes: {save.data.nodes?.length || 0} |
                    Connections: {save.data.connections?.length || 0}
                  </div>
                  {save.isActive && (
                    <div className="text-xs text-green-400 mb-2">✓ Currently Active on Website</div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onLoadTemplate(save.data.nodes || [], save.data.connections || []);
                        onClose();
                      }}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleSetActive(index)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                    >
                      Set as Active
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              {mode === 'mek'
                ? 'No templates found. Create default templates or build your own!'
                : 'No saved CiruTrees found. Create and save a tree first!'}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
});

TemplateManager.displayName = 'TemplateManager';

export default TemplateManager;
