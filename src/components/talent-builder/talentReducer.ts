import {
  TalentNode,
  Connection,
  DragState,
  BuilderMode,
  CanvasMode,
  BoxSelection,
  LassoSelection,
  RotationHandle,
  ViewportDimensions,
  ViewportPosition,
  HistoryEntry,
  SavedSpell,
  SavedCiruTree,
  SavedStoryMode,
  BackupFile
} from '@/app/talent-builder/types';

export interface TalentState {
  // Core node state
  nodes: TalentNode[];
  connections: Connection[];
  selectedNode: string | null;
  selectedNodes: Set<string>;

  // Canvas interaction
  mode: CanvasMode;
  connectFrom: string | null;
  dragState: DragState;
  isPanning: boolean;
  panStart: { x: number; y: number };
  panOffset: { x: number; y: number };
  zoom: number;

  // Selection tools
  boxSelection: BoxSelection;
  lassoSelection: LassoSelection;
  rotationHandle: RotationHandle;

  // UI toggles
  showGrid: boolean;
  snapToGrid: boolean;
  editingNode: string | null;

  // Search/picker state
  variationSearch: string;
  showVariationPicker: boolean;
  showEssencePicker: boolean;
  essenceSearch: string;

  // Save state
  saveStatus: string;
  hasUnsavedChanges: boolean;
  currentSaveName: string | null;

  // Autosave tracking
  autoSave: boolean;
  changeCounter: number;
  lastAutoSave: Date | null;
  lastConvexBackup: Date | null;
  lastConvexSync: Date | null;
  autosaveError: string | null;
  skipNextHistoryPush: boolean;

  // Builder mode
  builderMode: BuilderMode;
  selectedTemplateId: string | null;
  templateName: string;
  templateDescription: string;

  // Modal visibility
  showTemplateManager: boolean;
  showCiruTreeLoader: boolean;
  showSaveDialog: boolean;
  showStoryLoader: boolean;
  showStorySaveDialog: boolean;

  // Story mode
  storyChapter: number;
  storyNodeEditMode: 'normal' | 'event' | 'boss' | 'final_boss';
  storySaveName: string;

  // Data stores (loaded from localStorage/Convex)
  savedSpells: SavedSpell[];
  savedCiruTrees: SavedCiruTree[];
  savedStoryModes: SavedStoryMode[];
  backupFiles: BackupFile[];

  // Connection analysis
  unconnectedNodes: Set<string>;
  deadEndNodes: Set<string>;
  highlightDisconnected: boolean;

  // Viewport preview
  showViewportBox: boolean;
  viewportDimensions: ViewportDimensions;
  viewportPosition: ViewportPosition;
  isDraggingViewport: boolean;

  // History (undo/redo)
  history: HistoryEntry[];
  historyIndex: number;
}

export type TalentAction =
  // Node actions
  | { type: 'SET_NODES'; payload: TalentNode[] }
  | { type: 'ADD_NODE'; payload: TalentNode }
  | { type: 'UPDATE_NODE'; nodeId: string; updates: Partial<TalentNode> }
  | { type: 'UPDATE_NODES'; updates: { nodeId: string; updates: Partial<TalentNode> }[] }
  | { type: 'DELETE_NODE'; nodeId: string }
  | { type: 'DELETE_NODES'; nodeIds: string[] }

  // Connection actions
  | { type: 'SET_CONNECTIONS'; payload: Connection[] }
  | { type: 'ADD_CONNECTION'; payload: Connection }
  | { type: 'DELETE_CONNECTION'; index: number }
  | { type: 'DELETE_CONNECTION_BY_NODES'; from: string; to: string }

  // Selection actions
  | { type: 'SET_SELECTED_NODE'; payload: string | null }
  | { type: 'SET_SELECTED_NODES'; payload: Set<string> }
  | { type: 'ADD_TO_SELECTION'; nodeId: string }
  | { type: 'REMOVE_FROM_SELECTION'; nodeId: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SELECT_ALL' }

  // Mode and canvas interaction
  | { type: 'SET_MODE'; payload: CanvasMode }
  | { type: 'SET_CONNECT_FROM'; payload: string | null }
  | { type: 'SET_DRAG_STATE'; payload: DragState }
  | { type: 'SET_IS_PANNING'; payload: boolean }
  | { type: 'SET_PAN_START'; payload: { x: number; y: number } }
  | { type: 'SET_PAN_OFFSET'; payload: { x: number; y: number } }
  | { type: 'SET_ZOOM'; payload: number }

  // Selection tools
  | { type: 'SET_BOX_SELECTION'; payload: BoxSelection }
  | { type: 'SET_LASSO_SELECTION'; payload: LassoSelection }
  | { type: 'SET_ROTATION_HANDLE'; payload: RotationHandle }

  // UI toggles
  | { type: 'SET_SHOW_GRID'; payload: boolean }
  | { type: 'SET_SNAP_TO_GRID'; payload: boolean }
  | { type: 'SET_EDITING_NODE'; payload: string | null }

  // Search/picker
  | { type: 'SET_VARIATION_SEARCH'; payload: string }
  | { type: 'SET_SHOW_VARIATION_PICKER'; payload: boolean }
  | { type: 'SET_SHOW_ESSENCE_PICKER'; payload: boolean }
  | { type: 'SET_ESSENCE_SEARCH'; payload: string }

  // Save state
  | { type: 'SET_SAVE_STATUS'; payload: string }
  | { type: 'SET_HAS_UNSAVED_CHANGES'; payload: boolean }
  | { type: 'SET_CURRENT_SAVE_NAME'; payload: string | null }

  // Autosave
  | { type: 'SET_AUTO_SAVE'; payload: boolean }
  | { type: 'SET_CHANGE_COUNTER'; payload: number }
  | { type: 'INCREMENT_CHANGE_COUNTER' }
  | { type: 'SET_LAST_AUTO_SAVE'; payload: Date | null }
  | { type: 'SET_LAST_CONVEX_BACKUP'; payload: Date | null }
  | { type: 'SET_LAST_CONVEX_SYNC'; payload: Date | null }
  | { type: 'SET_AUTOSAVE_ERROR'; payload: string | null }
  | { type: 'SET_SKIP_NEXT_HISTORY_PUSH'; payload: boolean }

  // Builder mode
  | { type: 'SET_BUILDER_MODE'; payload: BuilderMode }
  | { type: 'SET_SELECTED_TEMPLATE_ID'; payload: string | null }
  | { type: 'SET_TEMPLATE_NAME'; payload: string }
  | { type: 'SET_TEMPLATE_DESCRIPTION'; payload: string }

  // Modal visibility
  | { type: 'SET_SHOW_TEMPLATE_MANAGER'; payload: boolean }
  | { type: 'SET_SHOW_CIRU_TREE_LOADER'; payload: boolean }
  | { type: 'SET_SHOW_SAVE_DIALOG'; payload: boolean }
  | { type: 'SET_SHOW_STORY_LOADER'; payload: boolean }
  | { type: 'SET_SHOW_STORY_SAVE_DIALOG'; payload: boolean }

  // Story mode
  | { type: 'SET_STORY_CHAPTER'; payload: number }
  | { type: 'SET_STORY_NODE_EDIT_MODE'; payload: 'normal' | 'event' | 'boss' | 'final_boss' }
  | { type: 'SET_STORY_SAVE_NAME'; payload: string }

  // Data stores
  | { type: 'SET_SAVED_SPELLS'; payload: SavedSpell[] }
  | { type: 'SET_SAVED_CIRU_TREES'; payload: SavedCiruTree[] }
  | { type: 'SET_SAVED_STORY_MODES'; payload: SavedStoryMode[] }
  | { type: 'SET_BACKUP_FILES'; payload: BackupFile[] }

  // Connection analysis
  | { type: 'SET_UNCONNECTED_NODES'; payload: Set<string> }
  | { type: 'SET_DEAD_END_NODES'; payload: Set<string> }
  | { type: 'SET_HIGHLIGHT_DISCONNECTED'; payload: boolean }
  | { type: 'CLEAR_CONNECTION_HIGHLIGHTS' }

  // Viewport
  | { type: 'SET_SHOW_VIEWPORT_BOX'; payload: boolean }
  | { type: 'SET_VIEWPORT_DIMENSIONS'; payload: ViewportDimensions }
  | { type: 'SET_VIEWPORT_POSITION'; payload: ViewportPosition }
  | { type: 'SET_IS_DRAGGING_VIEWPORT'; payload: boolean }
  | { type: 'CENTER_VIEWPORT' }

  // History
  | { type: 'SET_HISTORY'; payload: HistoryEntry[] }
  | { type: 'SET_HISTORY_INDEX'; payload: number }
  | { type: 'PUSH_HISTORY'; entry: HistoryEntry }
  | { type: 'UNDO' }
  | { type: 'REDO' }

  // Compound actions
  | { type: 'LOAD_TREE'; nodes: TalentNode[]; connections: Connection[]; saveName?: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'RESET_VIEW' }
  | { type: 'RESET_STATE' };

export const initialState: TalentState = {
  // Core node state
  nodes: [],
  connections: [],
  selectedNode: null,
  selectedNodes: new Set(),

  // Canvas interaction
  mode: 'select',
  connectFrom: null,
  dragState: {
    isDragging: false,
    nodeId: null,
    offsetX: 0,
    offsetY: 0
  },
  isPanning: false,
  panStart: { x: 0, y: 0 },
  panOffset: { x: 0, y: 0 },
  zoom: 1,

  // Selection tools
  boxSelection: {
    isSelecting: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    addToSelection: false
  },
  lassoSelection: {
    isSelecting: false,
    points: []
  },
  rotationHandle: {
    isDragging: false,
    startAngle: 0,
    centroidX: 0,
    centroidY: 0
  },

  // UI toggles
  showGrid: true,
  snapToGrid: true,
  editingNode: null,

  // Search/picker state
  variationSearch: '',
  showVariationPicker: false,
  showEssencePicker: false,
  essenceSearch: '',

  // Save state
  saveStatus: '',
  hasUnsavedChanges: false,
  currentSaveName: null,

  // Autosave tracking
  autoSave: false,
  changeCounter: 0,
  lastAutoSave: null,
  lastConvexBackup: null,
  lastConvexSync: null,
  autosaveError: null,
  skipNextHistoryPush: false,

  // Builder mode
  builderMode: 'circutree',
  selectedTemplateId: null,
  templateName: '',
  templateDescription: '',

  // Modal visibility
  showTemplateManager: false,
  showCiruTreeLoader: false,
  showSaveDialog: false,
  showStoryLoader: false,
  showStorySaveDialog: false,

  // Story mode
  storyChapter: 1,
  storyNodeEditMode: 'normal',
  storySaveName: '',

  // Data stores
  savedSpells: [],
  savedCiruTrees: [],
  savedStoryModes: [],
  backupFiles: [],

  // Connection analysis
  unconnectedNodes: new Set(),
  deadEndNodes: new Set(),
  highlightDisconnected: false,

  // Viewport preview
  showViewportBox: true,
  viewportDimensions: { width: 800, height: 600 },
  viewportPosition: { x: 1500, y: 1500 }, // Center of 3000x3000 canvas
  isDraggingViewport: false,

  // History
  history: [],
  historyIndex: -1
};

const MAX_HISTORY_LENGTH = 100;

export function talentReducer(state: TalentState, action: TalentAction): TalentState {
  switch (action.type) {
    // =========================================================================
    // NODE ACTIONS
    // =========================================================================
    case 'SET_NODES':
      return { ...state, nodes: action.payload, hasUnsavedChanges: true };

    case 'ADD_NODE':
      return {
        ...state,
        nodes: [...state.nodes, action.payload],
        selectedNode: action.payload.id,
        selectedNodes: new Set([action.payload.id]),
        editingNode: action.payload.id,
        hasUnsavedChanges: true
      };

    case 'UPDATE_NODE':
      return {
        ...state,
        nodes: state.nodes.map(n =>
          n.id === action.nodeId ? { ...n, ...action.updates } : n
        ),
        hasUnsavedChanges: true
      };

    case 'UPDATE_NODES':
      return {
        ...state,
        nodes: state.nodes.map(n => {
          const update = action.updates.find(u => u.nodeId === n.id);
          return update ? { ...n, ...update.updates } : n;
        }),
        hasUnsavedChanges: true
      };

    case 'DELETE_NODE': {
      if (action.nodeId === 'start' || action.nodeId.startsWith('start-')) {
        return state;
      }
      const newSelectedNodes = new Set(state.selectedNodes);
      newSelectedNodes.delete(action.nodeId);
      return {
        ...state,
        nodes: state.nodes.filter(n => n.id !== action.nodeId),
        connections: state.connections.filter(
          c => c.from !== action.nodeId && c.to !== action.nodeId
        ),
        selectedNode: state.selectedNode === action.nodeId ? null : state.selectedNode,
        selectedNodes: newSelectedNodes,
        hasUnsavedChanges: true
      };
    }

    case 'DELETE_NODES': {
      const nodeIdsToDelete = action.nodeIds.filter(
        id => id !== 'start' && !id.startsWith('start-')
      );
      const deleteSet = new Set(nodeIdsToDelete);
      const newSelectedNodes = new Set(
        [...state.selectedNodes].filter(id => !deleteSet.has(id))
      );
      return {
        ...state,
        nodes: state.nodes.filter(n => !deleteSet.has(n.id)),
        connections: state.connections.filter(
          c => !deleteSet.has(c.from) && !deleteSet.has(c.to)
        ),
        selectedNode: deleteSet.has(state.selectedNode || '') ? null : state.selectedNode,
        selectedNodes: newSelectedNodes,
        hasUnsavedChanges: true
      };
    }

    // =========================================================================
    // CONNECTION ACTIONS
    // =========================================================================
    case 'SET_CONNECTIONS':
      return { ...state, connections: action.payload, hasUnsavedChanges: true };

    case 'ADD_CONNECTION':
      return {
        ...state,
        connections: [...state.connections, action.payload],
        hasUnsavedChanges: true
      };

    case 'DELETE_CONNECTION':
      return {
        ...state,
        connections: state.connections.filter((_, i) => i !== action.index),
        hasUnsavedChanges: true
      };

    case 'DELETE_CONNECTION_BY_NODES':
      return {
        ...state,
        connections: state.connections.filter(
          c => !(c.from === action.from && c.to === action.to) &&
               !(c.from === action.to && c.to === action.from)
        ),
        hasUnsavedChanges: true
      };

    // =========================================================================
    // SELECTION ACTIONS
    // =========================================================================
    case 'SET_SELECTED_NODE':
      return { ...state, selectedNode: action.payload };

    case 'SET_SELECTED_NODES':
      return { ...state, selectedNodes: action.payload };

    case 'ADD_TO_SELECTION': {
      const newSelection = new Set(state.selectedNodes);
      newSelection.add(action.nodeId);
      return { ...state, selectedNodes: newSelection };
    }

    case 'REMOVE_FROM_SELECTION': {
      const newSelection = new Set(state.selectedNodes);
      newSelection.delete(action.nodeId);
      return { ...state, selectedNodes: newSelection };
    }

    case 'CLEAR_SELECTION':
      return { ...state, selectedNode: null, selectedNodes: new Set() };

    case 'SELECT_ALL':
      return {
        ...state,
        selectedNodes: new Set(state.nodes.map(n => n.id))
      };

    // =========================================================================
    // MODE AND CANVAS INTERACTION
    // =========================================================================
    case 'SET_MODE':
      return { ...state, mode: action.payload };

    case 'SET_CONNECT_FROM':
      return { ...state, connectFrom: action.payload };

    case 'SET_DRAG_STATE':
      return { ...state, dragState: action.payload };

    case 'SET_IS_PANNING':
      return { ...state, isPanning: action.payload };

    case 'SET_PAN_START':
      return { ...state, panStart: action.payload };

    case 'SET_PAN_OFFSET':
      return { ...state, panOffset: action.payload };

    case 'SET_ZOOM':
      return { ...state, zoom: action.payload };

    // =========================================================================
    // SELECTION TOOLS
    // =========================================================================
    case 'SET_BOX_SELECTION':
      return { ...state, boxSelection: action.payload };

    case 'SET_LASSO_SELECTION':
      return { ...state, lassoSelection: action.payload };

    case 'SET_ROTATION_HANDLE':
      return { ...state, rotationHandle: action.payload };

    // =========================================================================
    // UI TOGGLES
    // =========================================================================
    case 'SET_SHOW_GRID':
      return { ...state, showGrid: action.payload };

    case 'SET_SNAP_TO_GRID':
      return { ...state, snapToGrid: action.payload };

    case 'SET_EDITING_NODE':
      return { ...state, editingNode: action.payload };

    // =========================================================================
    // SEARCH/PICKER
    // =========================================================================
    case 'SET_VARIATION_SEARCH':
      return { ...state, variationSearch: action.payload };

    case 'SET_SHOW_VARIATION_PICKER':
      return { ...state, showVariationPicker: action.payload };

    case 'SET_SHOW_ESSENCE_PICKER':
      return { ...state, showEssencePicker: action.payload };

    case 'SET_ESSENCE_SEARCH':
      return { ...state, essenceSearch: action.payload };

    // =========================================================================
    // SAVE STATE
    // =========================================================================
    case 'SET_SAVE_STATUS':
      return { ...state, saveStatus: action.payload };

    case 'SET_HAS_UNSAVED_CHANGES':
      return { ...state, hasUnsavedChanges: action.payload };

    case 'SET_CURRENT_SAVE_NAME':
      return { ...state, currentSaveName: action.payload };

    // =========================================================================
    // AUTOSAVE
    // =========================================================================
    case 'SET_AUTO_SAVE':
      return { ...state, autoSave: action.payload };

    case 'SET_CHANGE_COUNTER':
      return { ...state, changeCounter: action.payload };

    case 'INCREMENT_CHANGE_COUNTER':
      return { ...state, changeCounter: state.changeCounter + 1 };

    case 'SET_LAST_AUTO_SAVE':
      return { ...state, lastAutoSave: action.payload };

    case 'SET_LAST_CONVEX_BACKUP':
      return { ...state, lastConvexBackup: action.payload };

    case 'SET_LAST_CONVEX_SYNC':
      return { ...state, lastConvexSync: action.payload };

    case 'SET_AUTOSAVE_ERROR':
      return { ...state, autosaveError: action.payload };

    case 'SET_SKIP_NEXT_HISTORY_PUSH':
      return { ...state, skipNextHistoryPush: action.payload };

    // =========================================================================
    // BUILDER MODE
    // =========================================================================
    case 'SET_BUILDER_MODE':
      return { ...state, builderMode: action.payload };

    case 'SET_SELECTED_TEMPLATE_ID':
      return { ...state, selectedTemplateId: action.payload };

    case 'SET_TEMPLATE_NAME':
      return { ...state, templateName: action.payload };

    case 'SET_TEMPLATE_DESCRIPTION':
      return { ...state, templateDescription: action.payload };

    // =========================================================================
    // MODAL VISIBILITY
    // =========================================================================
    case 'SET_SHOW_TEMPLATE_MANAGER':
      return { ...state, showTemplateManager: action.payload };

    case 'SET_SHOW_CIRU_TREE_LOADER':
      return { ...state, showCiruTreeLoader: action.payload };

    case 'SET_SHOW_SAVE_DIALOG':
      return { ...state, showSaveDialog: action.payload };

    case 'SET_SHOW_STORY_LOADER':
      return { ...state, showStoryLoader: action.payload };

    case 'SET_SHOW_STORY_SAVE_DIALOG':
      return { ...state, showStorySaveDialog: action.payload };

    // =========================================================================
    // STORY MODE
    // =========================================================================
    case 'SET_STORY_CHAPTER':
      return { ...state, storyChapter: action.payload };

    case 'SET_STORY_NODE_EDIT_MODE':
      return { ...state, storyNodeEditMode: action.payload };

    case 'SET_STORY_SAVE_NAME':
      return { ...state, storySaveName: action.payload };

    // =========================================================================
    // DATA STORES
    // =========================================================================
    case 'SET_SAVED_SPELLS':
      return { ...state, savedSpells: action.payload };

    case 'SET_SAVED_CIRU_TREES':
      return { ...state, savedCiruTrees: action.payload };

    case 'SET_SAVED_STORY_MODES':
      return { ...state, savedStoryModes: action.payload };

    case 'SET_BACKUP_FILES':
      return { ...state, backupFiles: action.payload };

    // =========================================================================
    // CONNECTION ANALYSIS
    // =========================================================================
    case 'SET_UNCONNECTED_NODES':
      return { ...state, unconnectedNodes: action.payload };

    case 'SET_DEAD_END_NODES':
      return { ...state, deadEndNodes: action.payload };

    case 'SET_HIGHLIGHT_DISCONNECTED':
      return { ...state, highlightDisconnected: action.payload };

    case 'CLEAR_CONNECTION_HIGHLIGHTS':
      return {
        ...state,
        unconnectedNodes: new Set(),
        deadEndNodes: new Set(),
        highlightDisconnected: false
      };

    // =========================================================================
    // VIEWPORT
    // =========================================================================
    case 'SET_SHOW_VIEWPORT_BOX':
      return { ...state, showViewportBox: action.payload };

    case 'SET_VIEWPORT_DIMENSIONS':
      return { ...state, viewportDimensions: action.payload };

    case 'SET_VIEWPORT_POSITION':
      return { ...state, viewportPosition: action.payload };

    case 'SET_IS_DRAGGING_VIEWPORT':
      return { ...state, isDraggingViewport: action.payload };

    case 'CENTER_VIEWPORT': {
      // Center viewport based on current builder mode
      const gridSize = state.builderMode === 'story' ? 6000 : 3000;
      const centerX = gridSize / 2;
      const centerY = gridSize / 2;
      return { ...state, viewportPosition: { x: centerX, y: centerY } };
    }

    // =========================================================================
    // HISTORY (UNDO/REDO)
    // =========================================================================
    case 'SET_HISTORY':
      return { ...state, history: action.payload };

    case 'SET_HISTORY_INDEX':
      return { ...state, historyIndex: action.payload };

    case 'PUSH_HISTORY': {
      // Don't push if skipNextHistoryPush is true
      if (state.skipNextHistoryPush) {
        return { ...state, skipNextHistoryPush: false };
      }

      // Trim history if we're not at the end (redo stack is discarded)
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(action.entry);

      // Limit history length
      if (newHistory.length > MAX_HISTORY_LENGTH) {
        newHistory.shift();
      }

      return {
        ...state,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    }

    case 'UNDO': {
      if (state.historyIndex <= 0) return state;

      const newIndex = state.historyIndex - 1;
      const entry = state.history[newIndex];

      return {
        ...state,
        nodes: entry.nodes,
        connections: entry.connections,
        historyIndex: newIndex,
        skipNextHistoryPush: true,
        hasUnsavedChanges: true
      };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;

      const newIndex = state.historyIndex + 1;
      const entry = state.history[newIndex];

      return {
        ...state,
        nodes: entry.nodes,
        connections: entry.connections,
        historyIndex: newIndex,
        skipNextHistoryPush: true,
        hasUnsavedChanges: true
      };
    }

    // =========================================================================
    // COMPOUND ACTIONS
    // =========================================================================
    case 'LOAD_TREE':
      return {
        ...state,
        nodes: action.nodes,
        connections: action.connections,
        currentSaveName: action.saveName || null,
        hasUnsavedChanges: false,
        selectedNode: null,
        selectedNodes: new Set(),
        skipNextHistoryPush: true
      };

    case 'CLEAR_ALL':
      return {
        ...state,
        nodes: [],
        connections: [],
        selectedNode: null,
        selectedNodes: new Set(),
        hasUnsavedChanges: false,
        currentSaveName: null
      };

    case 'RESET_VIEW':
      return {
        ...state,
        zoom: 1,
        panOffset: { x: 0, y: 0 }
      };

    case 'RESET_STATE':
      return { ...initialState };

    default:
      return state;
  }
}
