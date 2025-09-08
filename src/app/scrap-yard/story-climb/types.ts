export type StoryNodeType = 'normal' | 'event' | 'boss' | 'final_boss';

export interface StoryNode {
  id: string;
  x: number;
  y: number;
  label: string;
  index?: number;
  storyNodeType?: StoryNodeType;
  completed?: boolean;
  available?: boolean;
  current?: boolean;
}

export interface Connection {
  from: string;
  to: string;
}

export interface SavedStoryMode {
  name: string;
  chapter: number;
  data: {
    nodes: StoryNode[];
    connections: Connection[];
  };
}