
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TaskItem, WorkspaceType } from '@/types/organism';

// Define a simple interface for database items to avoid type complexity
interface DatabaseItem {
  id: string;
  text: string;
  type: string;
  parent_id: string | null;
  is_collapsed: boolean;
  is_strikethrough?: boolean;
  sort_order: number;
  workspace: string;
  user_id: string;
}

export const useOrganismDatabase = () => {
  const [isLoading, setIsLoading] = useState(true);

  const loadItemsFromDatabase = async (userId: string): Promise<TaskItem[]> => {
    try {
      // First try to load items owned by this user
      const { data: owned, error: ownedError } = await supabase
        .from('organism_items')
        .select('*')
        .eq('workspace', 'work')
        .eq('user_id', userId)
        .order('sort_order');

      if (ownedError) {
        console.error('Error loading work items:', ownedError);
        return [];
      }

      if ((owned?.length || 0) > 0) {
        return buildTreeFromFlatData(owned || []);
      }

      // Fallback: load legacy items (created before auth, user_id IS NULL)
      const { data: legacy, error: legacyError } = await supabase
        .from('organism_items')
        .select('*')
        .eq('workspace', 'work')
        .is('user_id', null)
        .order('sort_order');

      if (legacyError) {
        console.error('Error loading legacy work items:', legacyError);
        return [];
      }

      if ((legacy?.length || 0) > 0) {
        // Claim legacy items so they persist under this account
        await supabase
          .from('organism_items')
          .update({ user_id: userId })
          .eq('workspace', 'work')
          .is('user_id', null);

        return buildTreeFromFlatData(legacy || []);
      }

      return [];
    } catch (error) {
      console.error('Error loading work items:', error);
      return [];
    }
  };

  const loadPersonalItemsFromDatabase = async (userId: string): Promise<TaskItem[]> => {
    try {
      const { data: owned, error: ownedError } = await supabase
        .from('organism_items')
        .select('*')
        .eq('workspace', 'personal')
        .eq('user_id', userId)
        .order('sort_order');

      if (ownedError) {
        console.error('Error loading personal items:', ownedError);
        return [];
      }

      if ((owned?.length || 0) > 0) {
        return buildTreeFromFlatData(owned || []);
      }

      const { data: legacy, error: legacyError } = await supabase
        .from('organism_items')
        .select('*')
        .eq('workspace', 'personal')
        .is('user_id', null)
        .order('sort_order');

      if (legacyError) {
        console.error('Error loading legacy personal items:', legacyError);
        return [];
      }

      if ((legacy?.length || 0) > 0) {
        await supabase
          .from('organism_items')
          .update({ user_id: userId })
          .eq('workspace', 'personal')
          .is('user_id', null);

        return buildTreeFromFlatData(legacy || []);
      }

      return [];
    } catch (error) {
      console.error('Error loading personal items:', error);
      return [];
    }
  };

  const saveItemsToDatabase = async (items: TaskItem[], userId: string) => {
    try {
      // Clear existing work items for this user
      await supabase.from('organism_items').delete()
        .eq('workspace', 'work')
        .eq('user_id', userId);

      // Flatten the tree structure and save
      const flatItems = flattenTreeForDatabase(items, 0, 'work', userId);
      
      if (flatItems.length > 0) {
        const { error } = await supabase
          .from('organism_items')
          .insert(flatItems);

        if (error) {
          console.error('Error saving work items:', error);
        }
      }
    } catch (error) {
      console.error('Error saving work items:', error);
    }
  };

  const savePersonalItemsToDatabase = async (items: TaskItem[], userId: string) => {
    try {
      // Clear existing personal items for this user
      await supabase.from('organism_items').delete()
        .eq('workspace', 'personal')
        .eq('user_id', userId);

      // Flatten the tree structure and save
      const flatItems = flattenTreeForDatabase(items, 0, 'personal', userId);

      if (flatItems.length > 0) {
        const { error } = await supabase
          .from('organism_items')
          .insert(flatItems);

        if (error) {
          console.error('Error saving personal items:', error);
        }
      }
    } catch (error) {
      console.error('Error saving personal items:', error);
    }
  };

  // Generator workspace is SHARED - all authenticated users can see and edit
  const loadGeneratorItemsFromDatabase = async (userId: string): Promise<TaskItem[]> => {
    try {
      // Load ALL generator items (shared workspace - no user_id filter)
      const { data, error } = await supabase
        .from('organism_items')
        .select('*')
        .eq('workspace', 'generator')
        .order('sort_order');

      if (error) {
        console.error('Error loading generator items:', error);
        return [];
      }

      return buildTreeFromFlatData(data || []);
    } catch (error) {
      console.error('Error loading generator items:', error);
      return [];
    }
  };

  const saveGeneratorItemsToDatabase = async (items: TaskItem[], userId: string) => {
    try {
      // Clear ALL existing generator items (shared workspace)
      await supabase.from('organism_items').delete()
        .eq('workspace', 'generator');

      // Flatten the tree structure and save
      const flatItems = flattenTreeForDatabase(items, 0, 'generator', userId);

      if (flatItems.length > 0) {
        const { error } = await supabase
          .from('organism_items')
          .insert(flatItems);

        if (error) {
          console.error('Error saving generator items:', error);
        }
      }
    } catch (error) {
      console.error('Error saving generator items:', error);
    }
  };

  // Elizabeth workspace is SHARED between specific users
  const loadElizabethItemsFromDatabase = async (userId: string): Promise<TaskItem[]> => {
    try {
      // Load ALL elizabeth items (shared workspace - no user_id filter)
      const { data, error } = await supabase
        .from('organism_items')
        .select('*')
        .eq('workspace', 'elizabeth')
        .order('sort_order');

      if (error) {
        console.error('Error loading elizabeth items:', error);
        return [];
      }

      return buildTreeFromFlatData(data || []);
    } catch (error) {
      console.error('Error loading elizabeth items:', error);
      return [];
    }
  };

  const saveElizabethItemsToDatabase = async (items: TaskItem[], userId: string) => {
    try {
      // Clear ALL existing elizabeth items (shared workspace)
      await supabase.from('organism_items').delete()
        .eq('workspace', 'elizabeth');

      // Flatten the tree structure and save
      const flatItems = flattenTreeForDatabase(items, 0, 'elizabeth', userId);

      if (flatItems.length > 0) {
        const { error } = await supabase
          .from('organism_items')
          .insert(flatItems);

        if (error) {
          console.error('Error saving elizabeth items:', error);
        }
      }
    } catch (error) {
      console.error('Error saving elizabeth items:', error);
    }
  };

  const buildTreeFromFlatData = (flatData: DatabaseItem[]): TaskItem[] => {
    const itemMap = new Map<string, TaskItem>();
    const rootItems: TaskItem[] = [];

    // First pass: create all items
    flatData.forEach(item => {
      itemMap.set(item.id, {
        id: item.id,
        text: item.text,
        type: item.type as 'goal' | 'subgoal' | 'task',
        isCollapsed: item.is_collapsed,
        isStrikethrough: item.is_strikethrough || false,
        children: [],
        parentId: item.parent_id || undefined
      });
    });

    // Second pass: build the tree structure
    flatData.forEach(item => {
      const currentItem = itemMap.get(item.id)!;
      
      if (item.parent_id) {
        const parent = itemMap.get(item.parent_id);
        if (parent) {
          parent.children.push(currentItem);
        }
      } else {
        rootItems.push(currentItem);
      }
    });

    return rootItems;
  };

  const flattenTreeForDatabase = (items: TaskItem[], sortOrderStart = 0, workspace: WorkspaceType, userId: string): DatabaseItem[] => {
    const result: DatabaseItem[] = [];
    let currentSortOrder = sortOrderStart;

    const flattenRecursive = (items: TaskItem[], parentId?: string) => {
      items.forEach(item => {
        result.push({
          id: item.id,
          text: item.text,
          type: item.type,
          parent_id: parentId || null,
          is_collapsed: item.isCollapsed,
          is_strikethrough: item.isStrikethrough || false,
          sort_order: currentSortOrder++,
          workspace: workspace,
          user_id: userId
        });

        if (item.children.length > 0) {
          flattenRecursive(item.children, item.id);
        }
      });
    };

    flattenRecursive(items);
    return result;
  };

  return {
    isLoading,
    setIsLoading,
    loadItemsFromDatabase,
    loadPersonalItemsFromDatabase,
    loadGeneratorItemsFromDatabase,
    loadElizabethItemsFromDatabase,
    saveItemsToDatabase,
    savePersonalItemsToDatabase,
    saveGeneratorItemsToDatabase,
    saveElizabethItemsToDatabase
  };
};
