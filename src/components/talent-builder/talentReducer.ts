import { TalentNode, Connection, DragState, BuilderMode, CanvasMode } from './types';

export interface TalentState {
  nodes: TalentNode[];
  connections: Connection[];
  selectedNode: string | null;
  mode: CanvasMode;
  connectFrom: string | null;
  dragState: DragState;
  showGrid: boolean;
  snapToGrid: boolean;
  editingNode: string | null;
  variationSearch: string;
  showVariationPicker: boolean;
  showEssencePicker: boolean;
  essenceSearch: string;
  saveStatus: string;
  autoSave: boolean;
  hasUnsavedChanges: boolean;
  panOffset: { x: number; y: number };
  zoom: number;
  isPanning: boolean;
  panStart: { x: number; y: number };
  builderMode: BuilderMode;
  selectedTemplateId: string | null;
  templateName: string;
  templateDescription: string;
  showTemplateManager: boolean;
  showCiruTreeLoader: boolean;
}

export type TalentAction =
  | { type: 'SET_NODES'; payload: TalentNode[] }
  | { type: 'ADD_NODE'; payload: TalentNode }
  | { type: 'UPDATE_NODE'; nodeId: string; updates: Partial<TalentNode> }
  | { type: 'DELETE_NODE'; nodeId: string }
  | { type: 'SET_CONNECTIONS'; payload: Connection[] }
  | { type: 'ADD_CONNECTION'; payload: Connection }
  | { type: 'DELETE_CONNECTION'; index: number }
  | { type: 'SET_SELECTED_NODE'; payload: string | null }
  | { type: 'SET_MODE'; payload: CanvasMode }
  | { type: 'SET_CONNECT_FROM'; payload: string | null }
  | { type: 'SET_DRAG_STATE'; payload: DragState }
  | { type: 'SET_SHOW_GRID'; payload: boolean }
  | { type: 'SET_SNAP_TO_GRID'; payload: boolean }
  | { type: 'SET_EDITING_NODE'; payload: string | null }
  | { type: 'SET_VARIATION_SEARCH'; payload: string }
  | { type: 'SET_SHOW_VARIATION_PICKER'; payload: boolean }
  | { type: 'SET_SHOW_ESSENCE_PICKER'; payload: boolean }
  | { type: 'SET_ESSENCE_SEARCH'; payload: string }
  | { type: 'SET_SAVE_STATUS'; payload: string }
  | { type: 'SET_AUTO_SAVE'; payload: boolean }
  | { type: 'SET_HAS_UNSAVED_CHANGES'; payload: boolean }
  | { type: 'SET_PAN_OFFSET'; payload: { x: number; y: number } }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_IS_PANNING'; payload: boolean }
  | { type: 'SET_PAN_START'; payload: { x: number; y: number } }
  | { type: 'SET_BUILDER_MODE'; payload: BuilderMode }
  | { type: 'SET_SELECTED_TEMPLATE_ID'; payload: string | null }
  | { type: 'SET_TEMPLATE_NAME'; payload: string }
  | { type: 'SET_TEMPLATE_DESCRIPTION'; payload: string }
  | { type: 'SET_SHOW_TEMPLATE_MANAGER'; payload: boolean }
  | { type: 'SET_SHOW_CIRU_TREE_LOADER'; payload: boolean }
  | { type: 'LOAD_TREE'; nodes: TalentNode[]; connections: Connection[] }
  | { type: 'CLEAR_ALL' }
  | { type: 'RESET_VIEW' };

export const initialState: TalentState = {
  nodes: [],
  connections: [],
  selectedNode: null,
  mode: 'select',
  connectFrom: null,
  dragState: {
    isDragging: false,
    nodeId: null,
    offsetX: 0,
    offsetY: 0
  },
  showGrid: true,
  snapToGrid: true,
  editingNode: null,
  variationSearch: '',
  showVariationPicker: false,
  showEssencePicker: false,
  essenceSearch: '',
  saveStatus: '',
  autoSave: false,
  hasUnsavedChanges: false,
  panOffset: { x: 0, y: 0 },
  zoom: 1,
  isPanning: false,
  panStart: { x: 0, y: 0 },
  builderMode: 'circutree',
  selectedTemplateId: null,
  templateName: '',
  templateDescription: '',
  showTemplateManager: false,
  showCiruTreeLoader: false
};

export function talentReducer(state: TalentState, action: TalentAction): TalentState {
  switch (action.type) {
    case 'SET_NODES':
      return { ...state, nodes: action.payload, hasUnsavedChanges: true };
    
    case 'ADD_NODE':
      return { 
        ...state, 
        nodes: [...state.nodes, action.payload],
        selectedNode: action.payload.id,
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
    
    case 'DELETE_NODE': {
      if (action.nodeId === 'start' || action.nodeId.startsWith('start-')) {
        return state;
      }
      return {
        ...state,
        nodes: state.nodes.filter(n => n.id !== action.nodeId),
        connections: state.connections.filter(
          c => c.from !== action.nodeId && c.to !== action.nodeId
        ),
        selectedNode: state.selectedNode === action.nodeId ? null : state.selectedNode,
        hasUnsavedChanges: true
      };
    }
    
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
    
    case 'SET_SELECTED_NODE':
      return { ...state, selectedNode: action.payload };
    
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    
    case 'SET_CONNECT_FROM':
      return { ...state, connectFrom: action.payload };
    
    case 'SET_DRAG_STATE':
      return { ...state, dragState: action.payload };
    
    case 'SET_SHOW_GRID':
      return { ...state, showGrid: action.payload };
    
    case 'SET_SNAP_TO_GRID':
      return { ...state, snapToGrid: action.payload };
    
    case 'SET_EDITING_NODE':
      return { ...state, editingNode: action.payload };
    
    case 'SET_VARIATION_SEARCH':
      return { ...state, variationSearch: action.payload };
    
    case 'SET_SHOW_VARIATION_PICKER':
      return { ...state, showVariationPicker: action.payload };
    
    case 'SET_SHOW_ESSENCE_PICKER':
      return { ...state, showEssencePicker: action.payload };
    
    case 'SET_ESSENCE_SEARCH':
      return { ...state, essenceSearch: action.payload };
    
    case 'SET_SAVE_STATUS':
      return { ...state, saveStatus: action.payload };
    
    case 'SET_AUTO_SAVE':
      return { ...state, autoSave: action.payload };
    
    case 'SET_HAS_UNSAVED_CHANGES':
      return { ...state, hasUnsavedChanges: action.payload };
    
    case 'SET_PAN_OFFSET':
      return { ...state, panOffset: action.payload };
    
    case 'SET_ZOOM':
      return { ...state, zoom: action.payload };
    
    case 'SET_IS_PANNING':
      return { ...state, isPanning: action.payload };
    
    case 'SET_PAN_START':
      return { ...state, panStart: action.payload };
    
    case 'SET_BUILDER_MODE':
      return { ...state, builderMode: action.payload };
    
    case 'SET_SELECTED_TEMPLATE_ID':
      return { ...state, selectedTemplateId: action.payload };
    
    case 'SET_TEMPLATE_NAME':
      return { ...state, templateName: action.payload };
    
    case 'SET_TEMPLATE_DESCRIPTION':
      return { ...state, templateDescription: action.payload };
    
    case 'SET_SHOW_TEMPLATE_MANAGER':
      return { ...state, showTemplateManager: action.payload };
    
    case 'SET_SHOW_CIRU_TREE_LOADER':
      return { ...state, showCiruTreeLoader: action.payload };
    
    case 'LOAD_TREE':
      return {
        ...state,
        nodes: action.nodes,
        connections: action.connections,
        hasUnsavedChanges: false
      };
    
    case 'CLEAR_ALL':
      return {
        ...state,
        nodes: [],
        connections: [],
        selectedNode: null,
        hasUnsavedChanges: false
      };
    
    case 'RESET_VIEW':
      return {
        ...state,
        zoom: 1,
        panOffset: { x: 0, y: 0 }
      };
    
    default:
      return state;
  }
}