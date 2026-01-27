
export interface TaskItem {
  id: string;
  text: string;
  type: 'goal' | 'subgoal' | 'task';
  children: TaskItem[];
  isCollapsed: boolean;
  parentId?: string;
}

export type WorkspaceType = 'work' | 'personal' | 'generator';

export interface OrganismState {
  items: TaskItem[];
  personalItems: TaskItem[];
  generatorItems: TaskItem[];
  selectedId: string | null;
  viewMode: 'tree' | 'today';
  workspace: WorkspaceType;
  history: TaskItem[][];
  personalHistory: TaskItem[][];
  generatorHistory: TaskItem[][];
}

export interface TodayItem {
  id: string;
  text: string;
  type: 'goal' | 'subgoal' | 'task';
  originalPath: string[];
  priority: number;
  workspace?: WorkspaceType;
}
