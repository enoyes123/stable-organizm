
import React from 'react';
import { TodayItem } from '@/types/organism';
import { GripVertical, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TodayViewProps {
  items: TodayItem[];
  onReorder: (oldIndex: number, newIndex: number) => void;
  onCopyToNewWindow: () => void;
}

export const TodayView: React.FC<TodayViewProps> = ({ items, onReorder, onCopyToNewWindow }) => {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dropIndicatorIndex, setDropIndicatorIndex] = React.useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex === null) return;
    
    // Calculate which side of the item we're hovering over
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const mouseY = e.clientY;
    
    // Determine drop position
    let dropIndex;
    if (mouseY < midY) {
      dropIndex = index;
    } else {
      dropIndex = index + 1;
    }
    
    // Adjust for dragged item position
    if (draggedIndex < dropIndex) {
      dropIndex = dropIndex - 1;
    }
    
    setDropIndicatorIndex(dropIndex);
  };

  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex === null) return;
    
    // Get the container element
    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const mouseY = e.clientY;
    
    // Check if we're in the top or bottom drop zones
    const topZoneHeight = 50; // pixels from top
    const bottomZoneHeight = 50; // pixels from bottom
    
    if (mouseY < rect.top + topZoneHeight) {
      // Top drop zone - insert at beginning
      setDropIndicatorIndex(0);
    } else if (mouseY > rect.bottom - bottomZoneHeight) {
      // Bottom drop zone - insert at end
      setDropIndicatorIndex(items.length);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the container entirely
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDropIndicatorIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (draggedIndex !== null && dropIndicatorIndex !== null) {
      onReorder(draggedIndex, dropIndicatorIndex);
    }
    
    setDraggedIndex(null);
    setDropIndicatorIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropIndicatorIndex(null);
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'goal':
        return 'bg-gray-800 text-white font-bold border-gray-800';
      case 'subgoal':
        return 'bg-gray-500 text-white font-semibold border-gray-500';
      case 'task':
        return 'bg-gray-300 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-300 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-88px)]">
      <div className="space-y-3 max-w-4xl mx-auto p-8">
        <h2 className="text-2xl font-bold text-center mb-8 text-white">Today's Focus</h2>
        
        <div 
          className="relative min-h-[200px]"
          onDrop={handleDrop}
          onDragOver={handleContainerDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Drop indicator at top */}
          {dropIndicatorIndex === 0 && (
            <div className="h-px bg-blue-500 rounded-full mx-4 mb-2 animate-pulse shadow-lg" />
          )}
          
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              {/* Drop indicator above item (but not at index 0) */}
              {dropIndicatorIndex === index && index > 0 && (
                <div className="h-px bg-blue-500 rounded-full mx-4 mb-2 animate-pulse shadow-lg" />
              )}
              
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'flex items-center gap-4 p-4 border-2 rounded-lg hover:shadow-lg transition-all cursor-move relative mb-3',
                  getItemTypeColor(item.type),
                  draggedIndex === index && 'opacity-30 scale-95 rotate-2 shadow-2xl',
                  draggedIndex !== null && draggedIndex !== index && 'transition-transform duration-200'
                )}
              >
                <GripVertical size={20} className="text-gray-400 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-lg truncate">
                    {item.text}
                  </div>
                </div>
              </div>
              
              {/* Drop indicator below item when it's the target */}
              {dropIndicatorIndex === index + 1 && (
                <div className="h-px bg-blue-500 rounded-full mx-4 mt-2 animate-pulse shadow-lg" />
              )}
            </React.Fragment>
          ))}
          
          {/* Drop indicator at bottom */}
          {dropIndicatorIndex === items.length && (
            <div className="h-px bg-blue-500 rounded-full mx-4 mt-2 animate-pulse shadow-lg" />
          )}
        </div>
        
        {items.length === 0 && (
          <div className="text-center text-gray-500 py-16">
            <p className="text-xl mb-4">No items visible for today</p>
            <p className="text-gray-400">Use "Show All" to expand your goals and add items to your daily focus</p>
          </div>
        )}
      </div>

      {/* Copy button positioned in lower right */}
      <div className="fixed bottom-8 right-8">
        <Button
          variant="outline"
          size="sm"
          onClick={onCopyToNewWindow}
          className="text-white bg-gray-700 hover:bg-gray-600 transition-all border-none shadow-lg"
        >
          <Copy size={16} className="mr-1" />
          Copy
        </Button>
      </div>
    </div>
  );
};
