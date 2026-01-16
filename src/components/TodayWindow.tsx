
import React from 'react';
import { TodayItem } from '@/types/organism';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodayWindowProps {
  items: TodayItem[];
}

export const TodayWindow: React.FC<TodayWindowProps> = ({ items }) => {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [windowItems, setWindowItems] = React.useState<TodayItem[]>(items);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const newItems = [...windowItems];
      const [removed] = newItems.splice(draggedIndex, 1);
      newItems.splice(dropIndex, 0, removed);
      setWindowItems(newItems.map((item, index) => ({ ...item, priority: index })));
    }
    setDraggedIndex(null);
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
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="space-y-3 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8 text-white">Today's Focus</h2>
        
        {windowItems.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={cn(
              'flex items-center gap-4 p-4 border-2 rounded-lg hover:shadow-lg transition-all cursor-move',
              getItemTypeColor(item.type),
              draggedIndex === index && 'opacity-50 scale-95'
            )}
          >
            <GripVertical size={20} className="text-gray-400 flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <div className="font-medium text-lg truncate">
                {item.text}
              </div>
            </div>
          </div>
        ))}
        
        {windowItems.length === 0 && (
          <div className="text-center text-gray-500 py-16">
            <p className="text-xl mb-4">No items for today</p>
          </div>
        )}
      </div>
    </div>
  );
};
