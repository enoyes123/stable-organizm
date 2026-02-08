
export interface TaskItem {
  id: string;
  text: string;
  type: 'goal' | 'subgoal' | 'task';
  children: TaskItem[];
  isCollapsed: boolean;
  parentId?: string;
  isStrikethrough?: boolean;
  icon?: string;
}

export type WorkspaceType = 'work' | 'personal' | 'generator' | 'elizabeth';

export interface OrganismState {
  items: TaskItem[];
  personalItems: TaskItem[];
  generatorItems: TaskItem[];
  elizabethItems: TaskItem[];
  selectedId: string | null;
  viewMode: 'tree' | 'today';
  workspace: WorkspaceType;
  history: TaskItem[][];
  personalHistory: TaskItem[][];
  generatorHistory: TaskItem[][];
  elizabethHistory: TaskItem[][];
}

export interface TodayItem {
  id: string;
  text: string;
  type: 'goal' | 'subgoal' | 'task';
  originalPath: string[];
  priority: number;
  workspace?: WorkspaceType;
}

export interface WorkspaceColors {
  background: string;
  goalNode: string;
  subgoalNode: string;
  taskNode: string;
}

export const DEFAULT_WORKSPACE_COLORS: WorkspaceColors = {
  background: '#1C1C1E',
  goalNode: '#323236',
  subgoalNode: '#2a2a2e',
  taskNode: '#1f2937'
};
