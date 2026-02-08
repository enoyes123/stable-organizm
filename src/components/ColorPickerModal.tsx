import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { WorkspaceColors, DEFAULT_WORKSPACE_COLORS } from '@/types/organism';
import { RotateCcw, ChevronDown } from 'lucide-react';

// Curated palette of ~40 muted colors
const MUTED_COLORS = [
  // Grays & Neutrals
  '#1C1C1E', '#2C2C2E', '#3A3A3C', '#48484A', '#636366', '#8E8E93',
  // Warm Grays
  '#2D2926', '#3C3633', '#4A4340', '#5C5552', '#716A66',
  // Cool Grays
  '#1E2428', '#2A3238', '#384048', '#4A545C', '#5E6A72',
  // Muted Blues
  '#1E3A5F', '#2C4A6E', '#3D5A7C', '#4E6A8A', '#5F7A98',
  // Muted Teals
  '#1E4A4A', '#2C5858', '#3A6666', '#4A7474', '#5A8282',
  // Muted Greens
  '#2D4A3A', '#3C5A4A', '#4A6A5A', '#5A7A6A', '#6A8A7A',
  // Muted Purples
  '#3A2D4A', '#4A3C5A', '#5A4A6A', '#6A5A7A', '#7A6A8A',
  // Muted Magentas
  '#4A2D3A', '#5A3C4A', '#6A4A5A', '#7A5A6A', '#8A6A7A',
  // Muted Reds/Browns
  '#4A2D2D', '#5A3C3C', '#6A4A4A', '#7A5A5A', '#8A6A6A',
  // Muted Oranges/Tans
  '#4A3A2D', '#5A4A3C', '#6A5A4A', '#7A6A5A', '#8A7A6A',
];

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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="py-3 border-b border-border last:border-b-0">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>

        {/* Preview */}
        <div className="flex items-center gap-2">
          {previewType === 'background' ? (
            <div
              className="w-16 h-8 rounded-lg border border-border"
              style={{ backgroundColor: color }}
            />
          ) : (
            <div
              className="px-3 py-1 rounded-xl text-white text-xs font-medium shadow-sm"
              style={{ backgroundColor: color }}
            >
              {previewType === 'goal' ? 'Goal' : previewType === 'subgoal' ? 'Sub-goal' : 'Task'}
            </div>
          )}
        </div>
      </div>

      {/* Color Picker Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mt-2 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <div
          className="w-5 h-5 rounded border border-border"
          style={{ backgroundColor: color }}
        />
        <span className="font-mono uppercase">{color}</span>
        <ChevronDown
          size={14}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Color Swatches Grid */}
      {isOpen && (
        <div className="mt-3 p-2 bg-secondary/50 rounded-lg">
          <div className="grid grid-cols-10 gap-1">
            {MUTED_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  onChange(c);
                  setIsOpen(false);
                }}
                className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                  color === c ? 'border-white ring-1 ring-white' : 'border-transparent hover:border-white/50'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}
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

        <div className="py-4 max-h-[60vh] overflow-y-auto">
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
