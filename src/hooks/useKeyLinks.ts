import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface KeyLink {
  id: string;
  title: string;
  url: string;
  sort_order: number;
  created_at?: string;
  created_by?: string;
}

export const useKeyLinks = () => {
  const { user } = useAuth();
  const [links, setLinks] = useState<KeyLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLinks = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('key_links')
        .select('*')
        .order('sort_order');

      if (error) {
        console.error('Error loading key links:', error);
        return;
      }

      setLinks(data || []);
    } catch (error) {
      console.error('Error loading key links:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadLinks();

    // Subscribe to realtime changes for key_links table
    const channel = supabase
      .channel('key_links_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'key_links'
        },
        () => {
          // Reload all links when any change happens
          loadLinks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadLinks]);

  const addLink = useCallback(async (title: string, url: string) => {
    if (!user?.id) return;

    const newLink = {
      title,
      url,
      sort_order: links.length,
      created_by: user.id
    };

    try {
      const { data, error } = await supabase
        .from('key_links')
        .insert(newLink)
        .select()
        .single();

      if (error) {
        console.error('Error adding key link:', error);
        return;
      }

      setLinks(prev => [...prev, data]);
    } catch (error) {
      console.error('Error adding key link:', error);
    }
  }, [user?.id, links.length]);

  const updateLink = useCallback(async (id: string, title: string, url: string) => {
    try {
      const { error } = await supabase
        .from('key_links')
        .update({ title, url })
        .eq('id', id);

      if (error) {
        console.error('Error updating key link:', error);
        return;
      }

      setLinks(prev => prev.map(link =>
        link.id === id ? { ...link, title, url } : link
      ));
    } catch (error) {
      console.error('Error updating key link:', error);
    }
  }, []);

  const deleteLink = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('key_links')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting key link:', error);
        return;
      }

      setLinks(prev => prev.filter(link => link.id !== id));
    } catch (error) {
      console.error('Error deleting key link:', error);
    }
  }, []);

  const reorderLinks = useCallback(async (sourceIndex: number, destinationIndex: number) => {
    const newLinks = [...links];
    const [removed] = newLinks.splice(sourceIndex, 1);
    newLinks.splice(destinationIndex, 0, removed);

    const updatedLinks = newLinks.map((link, index) => ({
      ...link,
      sort_order: index
    }));

    setLinks(updatedLinks);

    // Update all sort orders in database
    try {
      for (const link of updatedLinks) {
        await supabase
          .from('key_links')
          .update({ sort_order: link.sort_order })
          .eq('id', link.id);
      }
    } catch (error) {
      console.error('Error reordering key links:', error);
    }
  }, [links]);

  return {
    links,
    isLoading,
    addLink,
    updateLink,
    deleteLink,
    reorderLinks,
    refreshLinks: loadLinks
  };
};
