
export interface TaskItem {
  id: string;
  text: string;
  type: 'goal' | 'subgoal' | 'task';
  children: TaskItem[];
  isCollapsed: boolean;
  parentId?: string;
}

export interface OrganismState {
  items: TaskItem[];
  personalItems: TaskItem[];
  selectedId: string | null;
  viewMode: 'tree' | 'today';
  workspace: 'work' | 'personal';
  history: TaskItem[][];
  personalHistory: TaskItem[][];
}

export interface TodayItem {
  id: string;
  text: string;
  type: 'goal' | 'subgoal' | 'task';
  originalPath: string[];
  priority: number;
  workspace?: 'work' | 'personal';
}
