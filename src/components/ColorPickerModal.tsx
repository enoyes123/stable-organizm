import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { WorkspaceColors, DEFAULT_WORKSPACE_COLORS } from '@/types/organism';
import { RotateCcw } from 'lucide-react';

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: 'generator' | 'elizabeth';
  currentColors: WorkspaceColors;
  onSave: (colors: WorkspaceColors) => void;
}

interface ColorPickerRowProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
  previewType?: 'background' | 'goal' | 'subgoal' | 'task';
}

const ColorPickerRow: React.FC<ColorPickerRowProps> = ({ label, color, onChange, previewType }) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-foreground w-32">{label}</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer border-2 border-border hover:border-primary transition-colors"
            style={{ padding: 0 }}
          />
          <span className="text-xs font-mono text-muted-foreground uppercase w-20">{color}</span>
        </div>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-2">
        {previewType === 'background' ? (
          <div
            className="w-16 h-10 rounded-lg border border-border"
            style={{ backgroundColor: color }}
          />
        ) : (
          <div
            className="px-3 py-1.5 rounded-xl text-white text-xs font-medium shadow-sm"
            style={{ backgroundColor: color }}
          >
            {previewType === 'goal' ? 'Goal' : previewType === 'subgoal' ? 'Sub-goal' : 'Task'}
          </div>
        )}
      </div>
    </div>
  );
};

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  isOpen,
  onClose,
  workspace,
  currentColors,
  onSave,
}) => {
  const [colors, setColors] = useState<WorkspaceColors>(currentColors);

  const handleColorChange = (key: keyof WorkspaceColors, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setColors(DEFAULT_WORKSPACE_COLORS);
  };

  const handleSave = () => {
    onSave(colors);
  };

  const workspaceName = workspace === 'generator' ? 'Generator' : 'Elizabeth';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Colors for {workspaceName}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <ColorPickerRow
            label="Background"
            color={colors.background}
            onChange={(c) => handleColorChange('background', c)}
            previewType="background"
          />
          <ColorPickerRow
            label="Goal Nodes"
            color={colors.goalNode}
            onChange={(c) => handleColorChange('goalNode', c)}
            previewType="goal"
          />
          <ColorPickerRow
            label="Sub-Goal Nodes"
            color={colors.subgoalNode}
            onChange={(c) => handleColorChange('subgoalNode', c)}
            previewType="subgoal"
          />
          <ColorPickerRow
            label="Task Nodes"
            color={colors.taskNode}
            onChange={(c) => handleColorChange('taskNode', c)}
            previewType="task"
          />
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            <RotateCcw size={14} />
            Reset to Defaults
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-secondary hover:bg-secondary/80 text-foreground rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-colors"
            >
              Save
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
