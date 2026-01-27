import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TaskItem } from '@/types/organism';
import { Plus, Trash2, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

// Connector lines component that draws curved bezier paths from parent to children
const ConnectorLines: React.FC<{ parentRef: React.RefObject<HTMLElement>; childrenRef: React.RefObject<HTMLElement>; childCount: number }> = ({ parentRef, childrenRef, childCount }) => {
  const [paths, setPaths] = useState<string[]>([]);
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });

  const calculatePaths = useCallback(() => {
    if (!parentRef.current || !childrenRef.current || childCount === 0) return;

    const parentRect = parentRef.current.getBoundingClientRect();
    const childrenContainer = childrenRef.current;
    const containerRect = childrenContainer.getBoundingClientRect();

    // SVG is positioned relative to the children container's parent
    const svgWidth = 40; // width of the connector area
    const svgHeight = containerRect.height;
    setSvgSize({ width: svgWidth, height: svgHeight });

    // Start point: middle-right of parent (relative to SVG position)
    const startY = parentRect.top + parentRect.height / 2 - containerRect.top;

    // Find each child element's vertical center
    const childElements = childrenContainer.children[0]?.children;
    if (!childElements) return;

    const newPaths: string[] = [];
    for (let i = 0; i < childElements.length; i++) {
      const childRect = childElements[i].getBoundingClientRect();
      const endY = childRect.top + childRect.height / 2 - containerRect.top;

      // Bezier curve from left to right
      const startX = 0;
      const endX = svgWidth;
      const controlX1 = svgWidth * 0.6;
      const controlX2 = svgWidth * 0.4;

      newPaths.push(`M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`);
    }
    setPaths(newPaths);
  }, [parentRef, childrenRef, childCount]);

  useEffect(() => {
    calculatePaths();
    // Recalculate on resize
    const observer = new ResizeObserver(calculatePaths);
    if (childrenRef.current) observer.observe(childrenRef.current);
    return () => observer.disconnect();
  }, [calculatePaths]);

  if (paths.length === 0 || svgSize.height === 0) return null;

  return (
    <svg
      className="absolute left-[-40px] top-0 pointer-events-none"
      width={svgSize.width}
      height={svgSize.height}
      style={{ overflow: 'visible' }}
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="currentColor"
          className="text-[#DBDEE3] dark:text-[#4a4f57]"
          strokeWidth="1"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
};

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
  const collapseButtonRef = useRef<HTMLButtonElement>(null);
  const childrenContainerRef = useRef<HTMLDivElement>(null);

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
      case 'goal': return 17;
      case 'subgoal': return 17;
      case 'task': return 17;
      default: return 17;
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
    const baseStyles = 'cursor-pointer transition-all duration-200 ease-ios relative inline-flex items-center justify-start text-left rounded-xl shadow-ios hover:shadow-ios-lg hover:-translate-y-0.5 h-[44px] px-5';

    switch (item.type) {
      case 'goal':
        return `${baseStyles} bg-gray-200 dark:bg-[#323236] text-gray-900 dark:text-white`;
      case 'subgoal':
        return `${baseStyles} bg-gray-100 dark:bg-[#2a2a2e] text-gray-900 dark:text-white`;
      case 'task':
        return `${baseStyles} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white`;
      default:
        return baseStyles;
    }
  };

  const getContainerWidth = () => {
    switch (item.type) {
      case 'goal':
        return 'w-[23vw]';
      case 'subgoal':
        return 'w-[21.6vw]';
      case 'task':
        return 'w-[33.75vw]';
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

  return (
    <div className="flex items-center">
      {/* Always render container with width to maintain layout, but hide content when collapsed */}
      <div className={cn("relative flex items-center", getContainerWidth())}>
        {!item.isCollapsed && (
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
                className="bg-transparent border-none outline-none text-left w-full text-inherit focus:ring-0"
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
              <div className="hover-buttons absolute -top-2 -right-2 flex gap-1.5 z-20">
                {item.type === 'goal' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddItem(item.id, 'subgoal');
                    }}
                    className="p-1.5 bg-blue-500 hover:bg-blue-600 rounded-full text-white shadow-ios transition-all duration-200 active:scale-95"
                    title="Add sub-goal"
                  >
                    <Plus size={14} />
                  </button>
                )}
                {item.type === 'subgoal' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddItem(item.id, 'task');
                    }}
                    className="p-1.5 bg-blue-500 hover:bg-blue-600 rounded-full text-white shadow-ios transition-all duration-200 active:scale-95"
                    title="Add task"
                  >
                    <Plus size={14} />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem(item.id);
                  }}
                  className="p-1.5 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 rounded-full text-white shadow-ios transition-all duration-200 active:scale-95"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        ref={collapseButtonRef}
        onClick={() => onToggleCollapse(item.id)}
        className="ml-2 p-0.5 transition-all duration-200 ease-ios hover:bg-gray-100 dark:hover:bg-gray-700 rounded active:scale-95"
        title={item.isCollapsed ? 'Expand' : 'Collapse'}
      >
        {item.isCollapsed ? <Plus size={10} className="text-[#DBDEE3] dark:text-[#4a4f57]" /> : <Minus size={10} className="text-[#DBDEE3] dark:text-[#4a4f57]" />}
      </button>

      {item.children.length > 0 && (
        <div className="flex items-center ml-10 relative">
          {/* Curved connector lines from parent to children */}
          {!item.isCollapsed && item.children.length > 0 && (
            <ConnectorLines
              parentRef={collapseButtonRef}
              childrenRef={childrenContainerRef}
              childCount={item.children.length}
            />
          )}

          <div ref={childrenContainerRef} className="flex flex-col gap-5">
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
                              className={`transition-all duration-200 ease-ios ${
                                snapshot.isDragging
                                  ? 'scale-98 opacity-90 shadow-ios-lg'
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
