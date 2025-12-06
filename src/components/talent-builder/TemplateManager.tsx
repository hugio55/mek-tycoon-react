import React, { memo, useCallback, useRef } from 'react';
import { Template, SavedCiruTree, TalentNode, Connection } from '@/app/talent-builder/types';
import { TalentAction } from './talentReducer';

interface TemplateManagerProps {
  show: boolean;
  templates?: Template[];
  savedCiruTrees?: SavedCiruTree[];
  onClose: () => void;
  onLoadTemplate: (nodes: TalentNode[], connections: Connection[]) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onCreateDefaultTemplates?: () => void;
  dispatch: React.Dispatch<TalentAction>;
  mode: 'mek' | 'cirutree';
}

const TemplateManager: React.FC<TemplateManagerProps> = memo(({
  show,
  templates,
  savedCiruTrees,
  onClose,
  onLoadTemplate,
  onDeleteTemplate,
  onCreateDefaultTemplates,
  dispatch,
  mode
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleLoad = useCallback((nodes: TalentNode[], connections: Connection[]) => {
    onLoadTemplate(nodes, connections);
    
    // Auto-align to start node
    const startNode = nodes.find((n: TalentNode) => n.id === 'start');
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
      <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
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
        
        <div className="flex-1 overflow-y-auto" ref={canvasRef}>
          {mode === 'mek' && templates && templates.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {templates.map((template: Template) => (
                <div
                  key={template._id}
                  className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-all border border-gray-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-yellow-400">{template.name}</h3>
                    {template.conditions?.rankMin !== undefined && (
                      <div className="bg-purple-900/50 border border-purple-500/30 rounded px-2 py-0.5 text-xs">
                        <span className="text-purple-400 font-mono">
                          Ranks {template.conditions.rankMin}-{template.conditions.rankMax || '∞'}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{template.description}</p>
                  <div className="text-xs text-gray-500 mb-3">
                    Nodes: {template.nodes.length} | Connections: {template.connections.length}
                    {template.updatedAt && (
                      <span className="ml-2">| Updated: {new Date(template.updatedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoad(template.nodes, template.connections)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                    >
                      Load
                    </button>
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
              ))}
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
                      onClick={() => handleLoad(save.data.nodes || [], save.data.connections || [])}
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