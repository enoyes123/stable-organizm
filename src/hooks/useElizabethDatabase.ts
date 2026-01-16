
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TaskItem } from '@/types/organism';
import { useToast } from '@/hooks/use-toast';

// Define a simple interface for database items to avoid type complexity
interface DatabaseItem {
  id: string;
  text: string;
  type: string;
  parent_id: string | null;
  is_collapsed: boolean;
  sort_order: number;
  workspace: string;
  user_id: string;
}

export const useElizabethDatabase = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryAttemptRef = useRef(0);
  const maxRetries = 3;

  // Local storage backup functions
  const saveToLocalStorage = (items: TaskItem[]) => {
    try {
      const timestamp = new Date().toISOString();
      const backup = { items, timestamp };
      localStorage.setItem('elizabeth_backup', JSON.stringify(backup));
      console.log('✅ Data backed up to localStorage at', timestamp);
    } catch (error) {
      console.error('❌ Failed to backup to localStorage:', error);
    }
  };

  const loadFromLocalStorage = (): TaskItem[] | null => {
    try {
      const backup = localStorage.getItem('elizabeth_backup');
      if (backup) {
        const parsed = JSON.parse(backup);
        console.log('📦 Found localStorage backup from', parsed.timestamp);
        return parsed.items;
      }
    } catch (error) {
      console.error('❌ Failed to load from localStorage:', error);
    }
    return null;
  };

  const loadItemsFromDatabase = async (userId: string): Promise<TaskItem[]> => {
    try {
      console.log('🔄 Loading Elizabeth items from database...');
      // Try owned items first
      const { data: owned, error: ownedError } = await supabase
        .from('organism_items')
        .select('*')
        .eq('workspace', 'elizabeth')
        .eq('user_id', userId)
        .order('sort_order');

      if (ownedError) {
        console.error('❌ Error loading Elizabeth items:', ownedError);
        
        // Try to load from localStorage as fallback
        const backupItems = loadFromLocalStorage();
        if (backupItems) {
          console.log('📦 Using localStorage backup as fallback');
          toast({
            title: "Database Error",
            description: "Loaded from local backup. Some recent changes may be lost.",
            variant: "destructive"
          });
          return backupItems;
        }
        
        return [];
      }

      if ((owned?.length || 0) > 0) {
        const items = buildTreeFromFlatData(owned || []);
        console.log('✅ Loaded', items.length, 'Elizabeth items from database');
        // Update localStorage backup with fresh data
        saveToLocalStorage(items);
        return items;
      }

      // Fallback to legacy (pre-auth) data
      const { data: legacy, error: legacyError } = await supabase
        .from('organism_items')
        .select('*')
        .eq('workspace', 'elizabeth')
        .is('user_id', null)
        .order('sort_order');

      if (legacyError) {
        console.error('❌ Error loading legacy Elizabeth items:', legacyError);
        
        const backupItems = loadFromLocalStorage();
        if (backupItems) {
          console.log('📦 Using localStorage backup as fallback');
          toast({
            title: "Database Error",
            description: "Loaded from local backup. Some recent changes may be lost.",
            variant: "destructive"
          });
          return backupItems;
        }
        
        return [];
      }

      if ((legacy?.length || 0) > 0) {
        // Claim legacy items to current user
        await supabase
          .from('organism_items')
          .update({ user_id: userId })
          .eq('workspace', 'elizabeth')
          .is('user_id', null);

        const items = buildTreeFromFlatData(legacy || []);
        console.log('✅ Migrated', items.length, 'legacy Elizabeth items to your account');
        saveToLocalStorage(items);
        return items;
      }

      // Nothing found
      return [];
    } catch (error) {
      console.error('❌ Error loading Elizabeth items:', error);
      
      // Try to load from localStorage as fallback
      const backupItems = loadFromLocalStorage();
      if (backupItems) {
        console.log('📦 Using localStorage backup as fallback');
        toast({
          title: "Connection Error",
          description: "Loaded from local backup. Please check your internet connection.",
          variant: "destructive"
        });
        return backupItems;
      }
      
      return [];
    }
  };

  const saveItemsToDatabaseImmediate = async (items: TaskItem[], userId: string, retryCount = 0): Promise<boolean> => {
    try {
      console.log('💾 Saving Elizabeth items to database... (attempt', retryCount + 1, ')');
      setIsSaving(true);
      
      // Always backup to localStorage first
      saveToLocalStorage(items);
      
      // Clear existing Elizabeth items for this user
      const { error: deleteError } = await supabase
        .from('organism_items')
        .delete()
        .eq('workspace', 'elizabeth')
        .eq('user_id', userId);

      if (deleteError) {
        console.error('❌ Error deleting existing items:', deleteError);
        throw deleteError;
      }

      // Flatten the tree structure and save
      const flatItems = flattenTreeForDatabase(items, 0, 'elizabeth', userId);
      
      if (flatItems.length > 0) {
        const { error: insertError } = await supabase
          .from('organism_items')
          .insert(flatItems);

        if (insertError) {
          console.error('❌ Error inserting items:', insertError);
          throw insertError;
        }
      }

      console.log('✅ Successfully saved', flatItems.length, 'Elizabeth items to database');
      setLastSaved(new Date());
      retryAttemptRef.current = 0;
      
      toast({
        title: "Saved",
        description: "Your changes have been saved successfully.",
        duration: 2000
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error saving Elizabeth items:', error);
      
      // Retry logic
      if (retryCount < maxRetries) {
        console.log('🔄 Retrying save in 2 seconds...');
        setTimeout(() => {
          saveItemsToDatabaseImmediate(items, userId, retryCount + 1);
        }, 2000);
      } else {
        console.error('❌ Max save retries exceeded');
        toast({
          title: "Save Failed",
          description: "Unable to save to database. Data backed up locally.",
          variant: "destructive"
        });
      }
      
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced save function
  const saveItemsToDatabase = useCallback((items: TaskItem[], userId: string) => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Always backup to localStorage immediately
    saveToLocalStorage(items);
    
    // Set new timeout for database save
    saveTimeoutRef.current = setTimeout(() => {
      saveItemsToDatabaseImmediate(items, userId);
    }, 1000); // 1 second debounce
    
    console.log('⏱️ Debounced save scheduled');
  }, []);

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

  const flattenTreeForDatabase = (items: TaskItem[], sortOrderStart = 0, workspace: 'elizabeth', userId: string): DatabaseItem[] => {
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
    isSaving,
    lastSaved,
    loadItemsFromDatabase,
    saveItemsToDatabase,
    saveToLocalStorage,
    loadFromLocalStorage
  };
};
