import React, { useState, useRef, useEffect } from 'react';
import { TaskItem } from '@/types/organism';
import { Plus, Trash2, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface OrganismItemProps {
  item: TaskItem;
  level: number;
  workspace?: 'work' | 'personal';
  onToggleCollapse: (id: string) => void;
  onAddItem: (parentId: string, type: 'subgoal' | 'task') => void;
  onDeleteItem: (id: string) => void;
  onUpdateText: (id: string, text: string) => void;
  onKeyDown: (e: React.KeyboardEvent, id: string) => void;
  onReorderChildren?: (parentId: string, oldIndex: number, newIndex: number) => void;
}

export const OrganismItem: React.FC<OrganismItemProps> = ({
  item,
  level,
  workspace = 'work',
  onToggleCollapse,
  onAddItem,
  onDeleteItem,
  onUpdateText,
  onKeyDown,
  onReorderChildren
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const [isHovered, setIsHovered] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [editFontSize, setEditFontSize] = useState(18);
  const inputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.select();
      setEditFontSize(18);
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing && textRef.current && containerRef.current) {
      const adjustFontSize = () => {
        const container = containerRef.current;
        const textElement = textRef.current;
        
        if (!container || !textElement) return;
        
        let currentFontSize = getBaseFontSize(item.type);
        textElement.style.fontSize = `${currentFontSize}px`;
        
        // Use 98% of container width for goal and sub-goal nodes, keep existing logic for tasks
        const widthPercentage = (item.type === 'goal' || item.type === 'subgoal') ? 0.98 : 0.95;
        const containerWidth = (container.offsetWidth - 45) * widthPercentage;
        
        while (textElement.scrollWidth > containerWidth && currentFontSize > 8) {
          currentFontSize -= 1;
          textElement.style.fontSize = `${currentFontSize}px`;
        }
        
        setFontSize(currentFontSize);
      };
      
      setTimeout(adjustFontSize, 10);
    }
  }, [item.text, isEditing, item.type]);

  useEffect(() => {
    if (isEditing && inputRef.current && containerRef.current) {
      const adjustEditFontSize = () => {
        const container = containerRef.current;
        const inputElement = inputRef.current;
        
        if (!container || !inputElement) return;
        
        const tempSpan = document.createElement('span');
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.position = 'absolute';
        tempSpan.style.whiteSpace = 'nowrap';
        tempSpan.style.fontFamily = window.getComputedStyle(inputElement).fontFamily;
        tempSpan.textContent = editText || 'A';
        
        document.body.appendChild(tempSpan);
        
        let currentFontSize = 18;
        tempSpan.style.fontSize = `${currentFontSize}px`;
        
        // Use 98% of container width for goal and sub-goal nodes during editing
        const widthPercentage = (item.type === 'goal' || item.type === 'subgoal') ? 0.98 : 0.95;
        const availableWidth = (container.offsetWidth - 45) * widthPercentage;
        
        while (tempSpan.offsetWidth > availableWidth && currentFontSize > 8) {
          currentFontSize -= 1;
          tempSpan.style.fontSize = `${currentFontSize}px`;
        }
        
        document.body.removeChild(tempSpan);
        setEditFontSize(currentFontSize);
      };
      
      adjustEditFontSize();
    }
  }, [editText, isEditing, item.type]);

  const getBaseFontSize = (type: string) => {
    switch (type) {
      case 'goal': return 18;
      case 'subgoal': return 18;
      case 'task': return 18;
      default: return 18;
    }
  };

  const handleNodeMouseEnter = () => {
    setIsHovered(true);
  };

  const handleNodeMouseLeave = () => {
    setIsHovered(false);
  };

  const handleNodeClick = (e: React.MouseEvent) => {
    // Don't collapse if clicking on hover buttons or their container
    const target = e.target as HTMLElement;
    if (target.closest('.hover-buttons') || isEditing) {
      return;
    }
    
    // If clicking on text, enter edit mode
    if (target.closest('.edit-text')) {
      setIsEditing(true);
      return;
    }
    
    // Otherwise, toggle collapse
    onToggleCollapse(item.id);
  };

  const handleTextSubmit = () => {
    onUpdateText(item.id, editText);
    setIsEditing(false);
  };

  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTextSubmit();
    } else if (e.key === 'Escape') {
      setEditText(item.text);
      setIsEditing(false);
    }
  };

  const handleEditTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditText(e.target.value);
  };

  const getNodeStyles = () => {
    const baseStyles = 'cursor-pointer transition-all duration-200 hover:scale-105 relative inline-flex items-center justify-start text-left px-3 py-2 rounded-full shadow-lg h-10';
    
    switch (item.type) {
      case 'goal':
        return `${baseStyles} ${workspace === 'work' ? 'bg-green-900' : 'bg-blue-800'} text-white font-bold`;
      case 'subgoal':
        return `${baseStyles} bg-gray-500 text-white`;
      case 'task':
        return `${baseStyles} bg-gray-300 text-gray-800 px-4`;
      default:
        return baseStyles;
    }
  };

  const getContainerWidth = () => {
    switch (item.type) {
      case 'goal':
        return 'w-[23vw]';
      case 'subgoal':
        return 'w-[27vw]';
      case 'task':
        return 'w-[36vw]';
      default:
        return 'w-[23vw]';
    }
  };

  const getCollapseButtonColor = () => {
    switch (item.type) {
      case 'goal':
        return '#6B7280';
      case 'subgoal':
        return '#6B7280';
      case 'task':
        return '#9CA3AF';
      default:
        return '#9CA3AF';
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onReorderChildren) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    onReorderChildren(item.id, sourceIndex, destinationIndex);
  };

  // Count only expanded (visible) children for bracket display
  const getExpandedChildrenCount = (children: TaskItem[]): number => {
    return children.filter(child => !child.isCollapsed).length;
  };

  // Check if this sub-goal has 2 or more expanded tasks
  const expandedChildrenCount = getExpandedChildrenCount(item.children);
  const shouldShowBracket = item.type === 'subgoal' && expandedChildrenCount >= 2;

  return (
    <div className="flex items-center">
      {!item.isCollapsed && (
        <div className={cn("relative flex items-center", getContainerWidth())}>
          <div
            ref={containerRef}
            className={cn(getNodeStyles(), "w-full")}
            onMouseEnter={handleNodeMouseEnter}
            onMouseLeave={handleNodeMouseLeave}
            onKeyDown={(e) => onKeyDown(e, item.id)}
            onClick={handleNodeClick}
            tabIndex={0}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editText}
                onChange={handleEditTextChange}
                onBlur={handleTextSubmit}
                onKeyDown={handleTextKeyDown}
                className="bg-transparent border-none outline-none text-left w-full text-inherit"
                style={{ 
                  fontSize: `${editFontSize}px`,
                  whiteSpace: 'nowrap'
                }}
                autoFocus
              />
            ) : (
              <span 
                ref={textRef}
                className="edit-text cursor-text leading-tight text-left"
                style={{ 
                  fontSize: `${fontSize}px`,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden'
                }}
              >
                {item.text}
              </span>
            )}

            {isHovered && (
              <div className="hover-buttons absolute -top-2 -right-2 flex gap-1 z-20">
                {item.type === 'goal' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddItem(item.id, 'subgoal');
                    }}
                    className="p-1 bg-green-500 hover:bg-green-600 rounded-full text-white shadow-lg transition-colors"
                    title="Add sub-goal"
                  >
                    <Plus size={12} />
                  </button>
                )}
                {item.type === 'subgoal' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddItem(item.id, 'task');
                    }}
                    className="p-1 bg-gray-500 hover:bg-gray-600 rounded-full text-white shadow-lg transition-colors"
                    title="Add task"
                  >
                    <Plus size={12} />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem(item.id);
                  }}
                  className="p-1 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => onToggleCollapse(item.id)}
        className="ml-3 p-1 transition-all duration-200 hover:scale-110 font-bold bg-gray-800 hover:bg-gray-750 rounded-full border-none shadow-sm"
        style={{ color: getCollapseButtonColor() }}
        title={item.isCollapsed ? 'Expand' : 'Collapse'}
      >
        {item.isCollapsed ? <Plus size={8} /> : <Minus size={8} />}
      </button>

      {item.children.length > 0 && (
        <div className="flex items-center ml-4 relative">
          {/* Bracket for sub-goals with 2+ expanded tasks */}
          {shouldShowBracket && (
            <div className="absolute left-[-8px] flex items-center" style={{ height: '100%' }}>
              <div 
                className="border-l-2 border-t-2 border-b-2 border-gray-700 rounded-l-lg transition-all duration-300"
                style={{
                  height: `${expandedChildrenCount * 65 * 0.9}px`,
                  width: '16px',
                  borderTopLeftRadius: '12px',
                  borderBottomLeftRadius: '12px'
                }}
              />
            </div>
          )}
          
          <div className="flex flex-col gap-5">
            {onReorderChildren ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId={`children-${item.id}`}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="flex flex-col gap-5"
                    >
                      {item.children.map((child, index) => (
                        <Draggable key={child.id} draggableId={child.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`transition-all duration-200 ${
                                snapshot.isDragging 
                                  ? 'scale-105 shadow-2xl bg-white/20 backdrop-blur-sm rounded-lg p-2' 
                                  : ''
                              }`}
                              style={{
                                ...provided.draggableProps.style,
                                cursor: snapshot.isDragging ? 'grabbing' : 'grab'
                              }}
                            >
                              <OrganismItem
                                key={child.id}
                                item={child}
                                level={level + 1}
                                workspace={workspace}
                                onToggleCollapse={onToggleCollapse}
                                onAddItem={onAddItem}
                                onDeleteItem={onDeleteItem}
                                onUpdateText={onUpdateText}
                                onKeyDown={onKeyDown}
                                onReorderChildren={onReorderChildren}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              item.children.map((child) => (
                <OrganismItem
                  key={child.id}
                  item={child}
                  level={level + 1}
                  workspace={workspace}
                  onToggleCollapse={onToggleCollapse}
                  onAddItem={onAddItem}
                  onDeleteItem={onDeleteItem}
                  onUpdateText={onUpdateText}
                  onKeyDown={onKeyDown}
                  onReorderChildren={onReorderChildren}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
