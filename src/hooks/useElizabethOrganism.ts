
import { useState, useCallback, useEffect } from 'react';
import { TaskItem, OrganismState, TodayItem } from '@/types/organism';
import { useElizabethDatabase } from './useElizabethDatabase';
import { useAuth } from './useAuth';

export const useElizabethOrganism = () => {
  const { user } = useAuth();
  const { 
    loadItemsFromDatabase, 
    saveItemsToDatabase, 
    isSaving, 
    lastSaved,
    saveToLocalStorage,
    loadFromLocalStorage 
  } = useElizabethDatabase();
  
  const [state, setState] = useState<OrganismState>({
    items: [],
    personalItems: [],
    selectedId: null,
    viewMode: 'tree',
    workspace: 'work',
    history: [],
    personalHistory: []
  });

  const [todayItems, setTodayItems] = useState<TodayItem[]>([]);
  const [savedTreeState, setSavedTreeState] = useState<TaskItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from database on component mount
  useEffect(() => {
    if (!user?.id) return;
    
    const loadData = async () => {
      const elizabethItems = await loadItemsFromDatabase(user.id);
      
      if (elizabethItems.length === 0) {
        // Default data for Elizabeth
        const defaultItems = [
          {
            id: '1',
            text: 'Elizabeth\'s Main Goal',
            type: 'goal' as const,
            isCollapsed: false,
            children: [
              {
                id: '1-1',
                text: 'Priority project',
                type: 'subgoal' as const,
                isCollapsed: false,
                parentId: '1',
                children: [
                  { id: '1-1-1', text: 'First task', type: 'task' as const, isCollapsed: false, parentId: '1-1', children: [] },
                  { id: '1-1-2', text: 'Second task', type: 'task' as const, isCollapsed: false, parentId: '1-1', children: [] }
                ]
              }
            ]
          }
        ];
        setState(prev => ({ ...prev, items: defaultItems }));
        await saveItemsToDatabase(defaultItems, user.id);
      } else {
        setState(prev => ({ ...prev, items: elizabethItems }));
      }
      setIsLoading(false);
    };

    loadData();
  }, [user?.id]);

  // Save to database whenever items change
  const saveToDatabase = useCallback(async (items: TaskItem[]) => {
    if (!user?.id) return;
    await saveItemsToDatabase(items, user.id);
  }, [saveItemsToDatabase, user?.id]);

  const getCurrentHistory = useCallback(() => {
    return state.history;
  }, [state.history]);

  const saveToHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      history: [...prev.history.slice(-9), prev.items]
    }));
  }, []);

  const toggleCollapse = useCallback((id: string) => {
    saveToHistory();
    setState(prev => {
      const newItems = toggleItemCollapse(prev.items, id);
      saveToDatabase(newItems);
      return { ...prev, items: newItems };
    });
  }, [saveToHistory, saveToDatabase]);

  const addGoal = useCallback(() => {
    saveToHistory();
    const newGoal: TaskItem = {
      id: Date.now().toString(),
      text: 'New Goal',
      type: 'goal',
      isCollapsed: false,
      children: []
    };
    
    setState(prev => {
      const newItems = [...prev.items, newGoal];
      saveToDatabase(newItems);
      return { ...prev, items: newItems };
    });
  }, [saveToHistory, saveToDatabase]);

  const addItem = useCallback((parentId: string, type: 'subgoal' | 'task') => {
    saveToHistory();
    const newId = Date.now().toString();
    const newItem: TaskItem = {
      id: newId,
      text: type === 'subgoal' ? 'New sub-goal' : 'New task',
      type,
      isCollapsed: false,
      parentId,
      children: []
    };

    setState(prev => {
      const newItems = addItemToTree(prev.items, parentId, newItem);
      saveToDatabase(newItems);
      return { ...prev, items: newItems };
    });
  }, [saveToHistory, saveToDatabase]);

  const deleteItem = useCallback((id: string) => {
    saveToHistory();
    setState(prev => {
      const newItems = deleteItemFromTree(prev.items, id);
      saveToDatabase(newItems);
      return { ...prev, items: newItems };
    });
  }, [saveToHistory, saveToDatabase]);

  const updateItemText = useCallback((id: string, text: string) => {
    setState(prev => {
      const newItems = updateItemInTree(prev.items, id, text);
      saveToDatabase(newItems);
      return { ...prev, items: newItems };
    });
  }, [saveToDatabase]);

  const showAll = useCallback(() => {
    saveToHistory();
    setState(prev => {
      const newItems = expandAllItems(prev.items);
      saveToDatabase(newItems);
      return { ...prev, items: newItems, viewMode: 'tree' };
    });
    setSavedTreeState(null);
  }, [saveToHistory, saveToDatabase]);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.history.length === 0) return prev;
      
      const previousState = prev.history[prev.history.length - 1];
      saveToDatabase(previousState);
      
      return {
        ...prev,
        items: previousState,
        history: prev.history.slice(0, -1)
      };
    });
  }, [saveToDatabase]);

  const switchToTodayView = useCallback(() => {
    setSavedTreeState(state.items);
    
    const allVisibleItems = flattenVisibleItems(state.items, []);
    
    setTodayItems(allVisibleItems);
    setState(prev => ({ ...prev, viewMode: 'today' }));
  }, [state.items]);

  const returnToTreeView = useCallback(() => {
    if (savedTreeState) {
      setState(prev => ({ ...prev, items: savedTreeState, viewMode: 'tree' }));
    } else {
      setState(prev => ({ ...prev, viewMode: 'tree' }));
    }
    setSavedTreeState(null);
  }, [savedTreeState]);

  const reorderTodayItems = useCallback((oldIndex: number, newIndex: number) => {
    setTodayItems(prev => {
      const newItems = [...prev];
      const [removed] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, removed);
      return newItems.map((item, index) => ({ ...item, priority: index }));
    });
  }, []);

  const reorderGoals = useCallback((sourceIndex: number, destinationIndex: number) => {
    saveToHistory();
    setState(prev => {
      const newItems = [...prev.items];
      const [removed] = newItems.splice(sourceIndex, 1);
      newItems.splice(destinationIndex, 0, removed);
      saveToDatabase(newItems);
      return { ...prev, items: newItems };
    });
  }, [saveToHistory, saveToDatabase]);

  const reorderChildren = useCallback((parentId: string, oldIndex: number, newIndex: number) => {
    saveToHistory();
    setState(prev => {
      const newItems = reorderItemChildren(prev.items, parentId, oldIndex, newIndex);
      saveToDatabase(newItems);
      return { ...prev, items: newItems };
    });
  }, [saveToHistory, saveToDatabase]);

  return {
    state,
    todayItems,
    savedTreeState,
    isLoading,
    isSaving,
    lastSaved,
    toggleCollapse,
    addItem,
    deleteItem,
    updateItemText,
    showAll,
    undo,
    switchToTodayView,
    returnToTreeView,
    reorderTodayItems,
    addGoal,
    reorderGoals,
    reorderChildren,
    getCurrentHistory,
    saveToLocalStorage,
    loadFromLocalStorage
  };
};

// Helper functions (same as original)
const toggleItemCollapse = (items: TaskItem[], targetId: string): TaskItem[] => {
  return items.map(item => {
    if (item.id === targetId) {
      return { ...item, isCollapsed: !item.isCollapsed };
    }
    return { ...item, children: toggleItemCollapse(item.children, targetId) };
  });
};

const addItemToTree = (items: TaskItem[], parentId: string, newItem: TaskItem): TaskItem[] => {
  return items.map(item => {
    if (item.id === parentId) {
      return { ...item, children: [...item.children, newItem] };
    }
    return { ...item, children: addItemToTree(item.children, parentId, newItem) };
  });
};

const deleteItemFromTree = (items: TaskItem[], targetId: string): TaskItem[] => {
  return items.filter(item => item.id !== targetId).map(item => ({
    ...item,
    children: deleteItemFromTree(item.children, targetId)
  }));
};

const updateItemInTree = (items: TaskItem[], targetId: string, text: string): TaskItem[] => {
  return items.map(item => {
    if (item.id === targetId) {
      return { ...item, text };
    }
    return { ...item, children: updateItemInTree(item.children, targetId, text) };
  });
};

const expandAllItems = (items: TaskItem[]): TaskItem[] => {
  return items.map(item => ({
    ...item,
    isCollapsed: false,
    children: expandAllItems(item.children)
  }));
};

const reorderItemChildren = (items: TaskItem[], parentId: string, oldIndex: number, newIndex: number): TaskItem[] => {
  return items.map(item => {
    if (item.id === parentId) {
      const newChildren = [...item.children];
      const [removed] = newChildren.splice(oldIndex, 1);
      newChildren.splice(newIndex, 0, removed);
      return { ...item, children: newChildren };
    }
    return { ...item, children: reorderItemChildren(item.children, parentId, oldIndex, newIndex) };
  });
};

const flattenVisibleItems = (items: TaskItem[], path: string[] = []): TodayItem[] => {
  const result: TodayItem[] = [];
  
  const collectExpandedTasks = (items: TaskItem[], currentPath: string[] = []) => {
    items.forEach((item) => {
      const itemPath = [...currentPath, item.text];
      
      if (!item.isCollapsed && item.type !== 'goal') {
        result.push({
          id: item.id,
          text: item.text,
          type: item.type,
          originalPath: itemPath,
          priority: result.length,
          workspace: 'work'
        });
      }
      
      if (item.children.length > 0) {
        collectExpandedTasks(item.children, itemPath);
      }
    });
  };
  
  collectExpandedTasks(items, path);
  return result;
};
