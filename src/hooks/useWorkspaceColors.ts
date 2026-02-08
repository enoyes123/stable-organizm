import { useState, useEffect, useCallback } from 'react';
import { WorkspaceColors, DEFAULT_WORKSPACE_COLORS, WorkspaceType } from '@/types/organism';

const STORAGE_KEY_GENERATOR = 'organizm-colors-generator';
const STORAGE_KEY_ELIZABETH = 'organizm-colors-elizabeth';

interface WorkspaceColorsState {
  generator: WorkspaceColors;
  elizabeth: WorkspaceColors;
}

const loadColorsFromStorage = (): WorkspaceColorsState => {
  try {
    const generatorColors = localStorage.getItem(STORAGE_KEY_GENERATOR);
    const elizabethColors = localStorage.getItem(STORAGE_KEY_ELIZABETH);

    return {
      generator: generatorColors ? JSON.parse(generatorColors) : DEFAULT_WORKSPACE_COLORS,
      elizabeth: elizabethColors ? JSON.parse(elizabethColors) : DEFAULT_WORKSPACE_COLORS
    };
  } catch {
    return {
      generator: DEFAULT_WORKSPACE_COLORS,
      elizabeth: DEFAULT_WORKSPACE_COLORS
    };
  }
};

export const useWorkspaceColors = () => {
  const [colors, setColors] = useState<WorkspaceColorsState>(() => loadColorsFromStorage());

  // Sync with localStorage on mount (handles SSR/hydration)
  useEffect(() => {
    setColors(loadColorsFromStorage());
  }, []);

  const getColorsForWorkspace = useCallback((workspace: WorkspaceType): WorkspaceColors | null => {
    if (workspace === 'generator') {
      return colors.generator;
    }
    if (workspace === 'elizabeth') {
      return colors.elizabeth;
    }
    return null; // work and personal use default styles
  }, [colors]);

  const setColorsForWorkspace = useCallback((workspace: 'generator' | 'elizabeth', newColors: WorkspaceColors) => {
    const storageKey = workspace === 'generator' ? STORAGE_KEY_GENERATOR : STORAGE_KEY_ELIZABETH;

    try {
      localStorage.setItem(storageKey, JSON.stringify(newColors));
    } catch (e) {
      console.error('Failed to save colors to localStorage:', e);
    }

    setColors(prev => ({
      ...prev,
      [workspace]: newColors
    }));
  }, []);

  const resetColorsForWorkspace = useCallback((workspace: 'generator' | 'elizabeth') => {
    setColorsForWorkspace(workspace, DEFAULT_WORKSPACE_COLORS);
  }, [setColorsForWorkspace]);

  return {
    colors,
    getColorsForWorkspace,
    setColorsForWorkspace,
    resetColorsForWorkspace
  };
};
