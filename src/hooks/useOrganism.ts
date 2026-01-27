import { useState, useCallback, useEffect, useRef } from 'react';
import { TaskItem, OrganismState, TodayItem, WorkspaceType } from '@/types/organism';
import { useOrganismDatabase } from './useOrganismDatabase';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useOrganism = () => {
  const { user } = useAuth();
  const { loadItemsFromDatabase, saveItemsToDatabase, loadPersonalItemsFromDatabase, savePersonalItemsToDatabase, loadGeneratorItemsFromDatabase, saveGeneratorItemsToDatabase } = useOrganismDatabase();
  
  const [state, setState] = useState<OrganismState>({
    items: [],
    personalItems: [],
    generatorItems: [],
    selectedId: null,
    viewMode: 'tree',
    workspace: 'work',
    history: [],
    personalHistory: [],
    generatorHistory: []
  });

  const [todayItems, setTodayItems] = useState<TodayItem[]>([]);
  const [savedTreeState, setSavedTreeState] = useState<TaskItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from database on component mount
  useEffect(() => {
    if (!user?.id) return;
    
    const loadData = async () => {
      const [workItems, personalItems, generatorItems] = await Promise.all([
        loadItemsFromDatabase(user.id),
        loadPersonalItemsFromDatabase(user.id),
        loadGeneratorItemsFromDatabase(user.id)
      ]);
      
      if (workItems.length === 0) {
        // If no work data in database, use default data
        const defaultItems = [
          {
            id: '1',
            text: 'Lead the Generator forward!',
            type: 'goal' as const,
            isCollapsed: false,
            children: [
              {
                id: '1-1',
                text: 'Attack website and marketing improvements',
                type: 'subgoal' as const,
                isCollapsed: false,
                parentId: '1',
                children: [
                  { id: '1-1-1', text: 'Redesign homepage', type: 'task' as const, isCollapsed: false, parentId: '1-1', children: [] },
                  { id: '1-1-2', text: 'Optimize SEO', type: 'task' as const, isCollapsed: false, parentId: '1-1', children: [] }
                ]
              },
              {
                id: '1-2',
                text: 'Develop new features',
                type: 'subgoal' as const,
                isCollapsed: false,
                parentId: '1',
                children: [
                  { id: '1-2-1', text: 'User dashboard', type: 'task' as const, isCollapsed: false, parentId: '1-2', children: [] },
                  { id: '1-2-2', text: 'Analytics integration', type: 'task' as const, isCollapsed: false, parentId: '1-2', children: [] }
                ]
              }
            ]
          }
        ];
        setState(prev => ({ ...prev, items: defaultItems }));
        await saveItemsToDatabase(defaultItems, user.id);
      } else {
        setState(prev => ({ ...prev, items: workItems, personalItems, generatorItems }));
      }
      setIsLoading(false);
    };

    loadData();
  }, [user?.id]);

  // Subscribe to realtime changes for Generator workspace (shared)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('generator_items_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organism_items',
          filter: 'workspace=eq.generator'
        },
        async () => {
          // Reload generator items when any change happens
          const generatorItems = await loadGeneratorItemsFromDatabase(user.id);
          setState(prev => ({ ...prev, generatorItems }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadGeneratorItemsFromDatabase]);

  // Save to database whenever items change
  const saveToDatabase = useCallback(async (items: TaskItem[], workspace: WorkspaceType) => {
    if (!user?.id) return;

    if (workspace === 'work') {
      await saveItemsToDatabase(items, user.id);
    } else if (workspace === 'personal') {
      await savePersonalItemsToDatabase(items, user.id);
    } else {
      await saveGeneratorItemsToDatabase(items, user.id);
    }
  }, [saveItemsToDatabase, savePersonalItemsToDatabase, saveGeneratorItemsToDatabase, user?.id]);

  const getCurrentItems = useCallback(() => {
    if (state.workspace === 'work') return state.items;
    if (state.workspace === 'personal') return state.personalItems;
    return state.generatorItems;
  }, [state.workspace, state.items, state.personalItems, state.generatorItems]);

  const getCurrentHistory = useCallback(() => {
    if (state.workspace === 'work') return state.history;
    if (state.workspace === 'personal') return state.personalHistory;
    return state.generatorHistory;
  }, [state.workspace, state.history, state.personalHistory, state.generatorHistory]);

  const saveToHistory = useCallback(() => {
    setState(prev => {
      const currentItems = prev.workspace === 'work' ? prev.items : prev.workspace === 'personal' ? prev.personalItems : prev.generatorItems;
      const currentHistory = prev.workspace === 'work' ? prev.history : prev.workspace === 'personal' ? prev.personalHistory : prev.generatorHistory;

      if (prev.workspace === 'work') {
        return {
          ...prev,
          history: [...currentHistory.slice(-9), currentItems]
        };
      } else if (prev.workspace === 'personal') {
        return {
          ...prev,
          personalHistory: [...currentHistory.slice(-9), currentItems]
        };
      } else {
        return {
          ...prev,
          generatorHistory: [...currentHistory.slice(-9), currentItems]
        };
      }
    });
  }, []);

  const switchWorkspace = useCallback((workspace: WorkspaceType) => {
    setState(prev => ({ ...prev, workspace, viewMode: 'tree' }));
    setSavedTreeState(null);
  }, []);

  const toggleCollapse = useCallback((id: string) => {
    saveToHistory();
    setState(prev => {
      const currentItems = prev.workspace === 'work' ? prev.items : prev.workspace === 'personal' ? prev.personalItems : prev.generatorItems;
      const newItems = toggleItemCollapse(currentItems, id);
      saveToDatabase(newItems, prev.workspace);

      if (prev.workspace === 'work') {
        return { ...prev, items: newItems };
      } else if (prev.workspace === 'personal') {
        return { ...prev, personalItems: newItems };
      } else {
        return { ...prev, generatorItems: newItems };
      }
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
      const currentItems = prev.workspace === 'work' ? prev.items : prev.workspace === 'personal' ? prev.personalItems : prev.generatorItems;
      const newItems = [...currentItems, newGoal];
      saveToDatabase(newItems, prev.workspace);

      if (prev.workspace === 'work') {
        return { ...prev, items: newItems };
      } else if (prev.workspace === 'personal') {
        return { ...prev, personalItems: newItems };
      } else {
        return { ...prev, generatorItems: newItems };
      }
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
      const currentItems = prev.workspace === 'work' ? prev.items : prev.workspace === 'personal' ? prev.personalItems : prev.generatorItems;
      const newItems = addItemToTree(currentItems, parentId, newItem);
      saveToDatabase(newItems, prev.workspace);

      if (prev.workspace === 'work') {
        return { ...prev, items: newItems };
      } else if (prev.workspace === 'personal') {
        return { ...prev, personalItems: newItems };
      } else {
        return { ...prev, generatorItems: newItems };
      }
    });
  }, [saveToHistory, saveToDatabase]);

  const deleteItem = useCallback((id: string) => {
    saveToHistory();
    setState(prev => {
      const currentItems = prev.workspace === 'work' ? prev.items : prev.workspace === 'personal' ? prev.personalItems : prev.generatorItems;
      const newItems = deleteItemFromTree(currentItems, id);
      saveToDatabase(newItems, prev.workspace);

      if (prev.workspace === 'work') {
        return { ...prev, items: newItems };
      } else if (prev.workspace === 'personal') {
        return { ...prev, personalItems: newItems };
      } else {
        return { ...prev, generatorItems: newItems };
      }
    });
  }, [saveToHistory, saveToDatabase]);

  const updateItemText = useCallback((id: string, text: string) => {
    setState(prev => {
      const currentItems = prev.workspace === 'work' ? prev.items : prev.workspace === 'personal' ? prev.personalItems : prev.generatorItems;
      const newItems = updateItemInTree(currentItems, id, text);
      saveToDatabase(newItems, prev.workspace);

      if (prev.workspace === 'work') {
        return { ...prev, items: newItems };
      } else if (prev.workspace === 'personal') {
        return { ...prev, personalItems: newItems };
      } else {
        return { ...prev, generatorItems: newItems };
      }
    });
  }, [saveToDatabase]);

  const showAll = useCallback(() => {
    saveToHistory();
    setState(prev => {
      const currentItems = prev.workspace === 'work' ? prev.items : prev.workspace === 'personal' ? prev.personalItems : prev.generatorItems;
      const newItems = expandAllItems(currentItems);
      saveToDatabase(newItems, prev.workspace);

      if (prev.workspace === 'work') {
        return { ...prev, items: newItems, viewMode: 'tree' };
      } else if (prev.workspace === 'personal') {
        return { ...prev, personalItems: newItems, viewMode: 'tree' };
      } else {
        return { ...prev, generatorItems: newItems, viewMode: 'tree' };
      }
    });
    setSavedTreeState(null);
  }, [saveToHistory, saveToDatabase]);

  const undo = useCallback(() => {
    setState(prev => {
      const currentHistory = prev.workspace === 'work' ? prev.history : prev.workspace === 'personal' ? prev.personalHistory : prev.generatorHistory;
      if (currentHistory.length === 0) return prev;

      const previousState = currentHistory[currentHistory.length - 1];
      saveToDatabase(previousState, prev.workspace);

      if (prev.workspace === 'work') {
        return {
          ...prev,
          items: previousState,
          history: prev.history.slice(0, -1)
        };
      } else if (prev.workspace === 'personal') {
        return {
          ...prev,
          personalItems: previousState,
          personalHistory: prev.personalHistory.slice(0, -1)
        };
      } else {
        return {
          ...prev,
          generatorItems: previousState,
          generatorHistory: prev.generatorHistory.slice(0, -1)
        };
      }
    });
  }, [saveToDatabase]);

  const switchToTodayView = useCallback(() => {
    const currentItems = getCurrentItems();
    setSavedTreeState(currentItems);
    
    // Get items from both workspaces
    const personalVisibleItems = flattenVisibleItems(state.personalItems, [], 'personal');
    const workVisibleItems = flattenVisibleItems(state.items, [], 'work');
    
    // Show personal items first, then work items
    const allVisibleItems = [...personalVisibleItems, ...workVisibleItems];
    
    setTodayItems(allVisibleItems);
    setState(prev => ({ ...prev, viewMode: 'today' }));
  }, [getCurrentItems, state.personalItems, state.items]);

  const returnToTreeView = useCallback(() => {
    if (savedTreeState) {
      setState(prev => {
        if (prev.workspace === 'work') {
          return { ...prev, items: savedTreeState, viewMode: 'tree' };
        } else if (prev.workspace === 'personal') {
          return { ...prev, personalItems: savedTreeState, viewMode: 'tree' };
        } else {
          return { ...prev, generatorItems: savedTreeState, viewMode: 'tree' };
        }
      });
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
      const currentItems = prev.workspace === 'work' ? prev.items : prev.workspace === 'personal' ? prev.personalItems : prev.generatorItems;
      const newItems = [...currentItems];
      const [removed] = newItems.splice(sourceIndex, 1);
      newItems.splice(destinationIndex, 0, removed);
      saveToDatabase(newItems, prev.workspace);

      if (prev.workspace === 'work') {
        return { ...prev, items: newItems };
      } else if (prev.workspace === 'personal') {
        return { ...prev, personalItems: newItems };
      } else {
        return { ...prev, generatorItems: newItems };
      }
    });
  }, [saveToHistory, saveToDatabase]);

  const reorderChildren = useCallback((parentId: string, oldIndex: number, newIndex: number) => {
    saveToHistory();
    setState(prev => {
      const currentItems = prev.workspace === 'work' ? prev.items : prev.workspace === 'personal' ? prev.personalItems : prev.generatorItems;
      const newItems = reorderItemChildren(currentItems, parentId, oldIndex, newIndex);
      saveToDatabase(newItems, prev.workspace);

      if (prev.workspace === 'work') {
        return { ...prev, items: newItems };
      } else if (prev.workspace === 'personal') {
        return { ...prev, personalItems: newItems };
      } else {
        return { ...prev, generatorItems: newItems };
      }
    });
  }, [saveToHistory, saveToDatabase]);

  return {
    state: {
      ...state,
      items: getCurrentItems()
    },
    todayItems,
    savedTreeState,
    isLoading,
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
    switchWorkspace,
    getCurrentHistory
  };
};

// Helper functions
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

const findAllParentIds = (items: TaskItem[], targetId: string, currentPath: string[] = []): string[] => {
  for (const item of items) {
    const newPath = [...currentPath, item.id];
    
    if (item.id === targetId) {
      return currentPath; // Return the path without the target item itself
    }
    
    if (item.children.length > 0) {
      const result = findAllParentIds(item.children, targetId, newPath);
      if (result.length > 0 || (item.children.some(child => child.id === targetId))) {
        return result;
      }
    }
  }
  return [];
};

const findItemById = (items: TaskItem[], targetId: string): TaskItem | null => {
  for (const item of items) {
    if (item.id === targetId) {
      return item;
    }
    if (item.children.length > 0) {
      const found = findItemById(item.children, targetId);
      if (found) return found;
    }
  }
  return null;
};

const expandItemsByIds = (items: TaskItem[], targetIds: string[]): TaskItem[] => {
  return items.map(item => {
    if (targetIds.includes(item.id)) {
      return { ...item, isCollapsed: false, children: expandItemsByIds(item.children, targetIds) };
    }
    return { ...item, children: expandItemsByIds(item.children, targetIds) };
  });
};

const collapseItemsByIds = (items: TaskItem[], targetIds: string[]): TaskItem[] => {
  return items.map(item => {
    if (targetIds.includes(item.id)) {
      return { ...item, isCollapsed: true, children: collapseItemsByIds(item.children, targetIds) };
    }
    return { ...item, children: collapseItemsByIds(item.children, targetIds) };
  });
};

const flattenVisibleItems = (items: TaskItem[], path: string[] = [], workspace?: WorkspaceType): TodayItem[] => {
  const result: TodayItem[] = [];
  
  const collectExpandedTasks = (items: TaskItem[], currentPath: string[] = []) => {
    items.forEach((item) => {
      const itemPath = [...currentPath, item.text];
      
      // Only include sub-goals and tasks in Today view, exclude goals
      if (!item.isCollapsed && item.type !== 'goal') {
        result.push({
          id: item.id,
          text: item.text,
          type: item.type,
          originalPath: itemPath,
          priority: result.length,
          workspace: workspace
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
