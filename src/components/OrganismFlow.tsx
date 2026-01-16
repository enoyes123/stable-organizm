import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useOrganism } from '@/hooks/useOrganism';
import { OrganismItem } from './OrganismItem';
import { TodayView } from './TodayView';
import { TodayWindow } from './TodayWindow';
import { Button } from '@/components/ui/button';
import { RotateCcw, Eye, Calendar, Plus, ArrowLeft, Briefcase, User, Heart, Maximize, Minimize } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OrganismFlow: React.FC = () => {
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const {
    state,
    todayItems,
    savedTreeState,
    isLoading,
    toggleCollapse,
    addItem,
    deleteItem,
    updateItemText,
    showAll,
    undo,
    switchToTodayView,
    returnToTreeView,
    reorderTodayItems,
    addGoal,
    reorderGoals,
    reorderChildren,
    switchWorkspace,
    getCurrentHistory
  } = useOrganism();

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === 'Delete') {
      deleteItem(itemId);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    reorderGoals(sourceIndex, destinationIndex);
  };

  const handleCopyToNewWindow = () => {
    const today = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const tabTitle = `${monthNames[today.getMonth()]} ${today.getDate()}`;
    
    const newWindow = window.open('', '_blank', 'width=1200,height=800');
    if (newWindow) {
      newWindow.document.title = tabTitle;
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${tabTitle}</title>
            <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
            <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
            <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
              @keyframes expandAndFade {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.8; }
                100% { transform: scale(1.1); opacity: 0; }
              }
              .disappearing {
                animation: expandAndFade 0.5s ease-out forwards;
              }
            </style>
          </head>
          <body>
            <div id="root"></div>
            <script type="text/babel">
              const { useState } = React;
              
              const TodayWindow = ({ items }) => {
                const [draggedIndex, setDraggedIndex] = useState(null);
                const [dropIndicatorIndex, setDropIndicatorIndex] = useState(null);
                const [windowItems, setWindowItems] = useState(items);
                const [disappearingItems, setDisappearingItems] = useState(new Set());
                const [editingId, setEditingId] = useState(null);
                const [editingText, setEditingText] = useState("");

                const handleDragStart = (e, index) => {
                  setDraggedIndex(index);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', index.toString());
                };

                const handleDragOver = (e, index) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  
                  if (draggedIndex === null) return;
                  
                  // Calculate which side of the item we're hovering over
                  const rect = e.currentTarget.getBoundingClientRect();
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

                const handleContainerDragOver = (e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  
                  if (draggedIndex === null) return;
                  
                  // Get the container element
                  const container = e.currentTarget;
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
                    setDropIndicatorIndex(windowItems.length);
                  }
                };

                const handleDragLeave = (e) => {
                  // Only clear if we're leaving the container entirely
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX;
                  const y = e.clientY;
                  
                  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                    setDropIndicatorIndex(null);
                  }
                };

                const handleDrop = (e) => {
                  e.preventDefault();
                  
                  if (draggedIndex !== null && dropIndicatorIndex !== null) {
                    const newItems = [...windowItems];
                    const [removed] = newItems.splice(draggedIndex, 1);
                    let insertIndex = dropIndicatorIndex;
                    
                    // Adjust insertion index if needed
                    if (draggedIndex < dropIndicatorIndex) {
                      insertIndex = dropIndicatorIndex - 1;
                    }
                    
                    newItems.splice(insertIndex, 0, removed);
                    setWindowItems(newItems.map((item, index) => ({ ...item, priority: index })));
                  }
                  
                  setDraggedIndex(null);
                  setDropIndicatorIndex(null);
                };

                const handleDragEnd = () => {
                  setDraggedIndex(null);
                  setDropIndicatorIndex(null);
                };

                const handleAddItem = () => {
                  const newItem = {
                    id: Date.now().toString(),
                    text: 'new item',
                    type: 'task',
                    priority: windowItems.length
                  };
                  setWindowItems([...windowItems, newItem]);
                  setEditingId(newItem.id);
                  setEditingText('new item');
                };

                const handleStartEdit = (item) => {
                  setEditingId(item.id);
                  setEditingText(item.text);
                };

                const handleSaveEdit = (itemId) => {
                  setWindowItems(prev => prev.map(item => 
                    item.id === itemId ? { ...item, text: editingText } : item
                  ));
                  setEditingId(null);
                  setEditingText("");
                };

                const handleCancelEdit = () => {
                  setEditingId(null);
                  setEditingText("");
                };

                const handleKeyDown = (e, itemId) => {
                  if (e.key === 'Enter') {
                    handleSaveEdit(itemId);
                  } else if (e.key === 'Escape') {
                    handleCancelEdit();
                  }
                };

                const handleCheckboxClick = (itemId) => {
                  setDisappearingItems(prev => new Set([...prev, itemId]));
                  
                  setTimeout(() => {
                    setWindowItems(prev => prev.filter(item => item.id !== itemId));
                    setDisappearingItems(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(itemId);
                      return newSet;
                    });
                  }, 500);
                };

                const getItemTypeColor = (type) => {
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
                      <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold text-white">Today's Focus</h2>
                        <button
                          onClick={handleAddItem}
                          className="bg-gray-900 hover:bg-black text-gray-300 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14"/>
                            <path d="m12 5v14"/>
                          </svg>
                          Add Item
                        </button>
                      </div>
                      
                      <div 
                        className="relative min-h-[200px]"
                        onDrop={handleDrop}
                        onDragOver={handleContainerDragOver}
                        onDragLeave={handleDragLeave}
                      >
                        {/* Drop indicator at top */}
                        {dropIndicatorIndex === 0 && (
                          <div className="h-px bg-blue-500 rounded-full mx-4 mb-2" style={{animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'}} />
                        )}
                        
                        {windowItems.map((item, index) => (
                          <React.Fragment key={item.id}>
                            {/* Drop indicator above item (but not at index 0) */}
                            {dropIndicatorIndex === index && index > 0 && (
                              <div className="h-px bg-blue-500 rounded-full mx-4 mb-2" style={{animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'}} />
                            )}
                            
                            <div
                              draggable={editingId !== item.id}
                              onDragStart={(e) => handleDragStart(e, index)}
                              onDragOver={(e) => handleDragOver(e, index)}
                              onDragEnd={handleDragEnd}
                              className={\`flex items-center gap-4 p-4 border-2 rounded-lg hover:shadow-lg transition-all relative mb-3 \${editingId === item.id ? 'cursor-default' : 'cursor-move'} \${getItemTypeColor(item.type)} \${draggedIndex === index ? 'opacity-30 scale-95' : ''} \${draggedIndex !== null && draggedIndex !== index ? 'transition-transform duration-200' : ''} \${disappearingItems.has(item.id) ? 'disappearing' : ''}\`}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 flex-shrink-0">
                                <circle cx="9" cy="12" r="1"/>
                                <circle cx="9" cy="5" r="1"/>
                                <circle cx="9" cy="19" r="1"/>
                                <circle cx="15" cy="12" r="1"/>
                                <circle cx="15" cy="5" r="1"/>
                                <circle cx="15" cy="19" r="1"/>
                              </svg>
                              
                              <div className="flex-1 min-w-0">
                                {editingId === item.id ? (
                                  <input
                                    type="text"
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    onBlur={() => handleSaveEdit(item.id)}
                                    onKeyDown={(e) => handleKeyDown(e, item.id)}
                                    className="w-full bg-transparent text-lg font-medium border-none outline-none focus:outline-none"
                                    autoFocus
                                    onFocus={(e) => e.target.select()}
                                  />
                                ) : (
                                  <div 
                                    className="font-medium text-lg truncate cursor-pointer"
                                    onClick={() => handleStartEdit(item)}
                                  >
                                    {item.text}
                                  </div>
                                )}
                              </div>

                              <div className="flex-shrink-0">
                                <input
                                  type="checkbox"
                                  onChange={() => handleCheckboxClick(item.id)}
                                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                                />
                              </div>
                            </div>
                            
                            {/* Drop indicator below item when it's the target */}
                            {dropIndicatorIndex === index + 1 && (
                              <div className="h-px bg-blue-500 rounded-full mx-4 mt-2" style={{animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'}} />
                            )}
                          </React.Fragment>
                        ))}
                        
                        {/* Drop indicator at bottom */}
                        {dropIndicatorIndex === windowItems.length && (
                          <div className="h-px bg-blue-500 rounded-full mx-4 mt-2" style={{animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'}} />
                        )}
                      </div>
                      
                      {windowItems.length === 0 && (
                        <div className="text-center text-gray-500 py-16">
                          <p className="text-xl mb-4">No items for today</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              };

              const items = ${JSON.stringify(todayItems)};
              ReactDOM.render(<TodayWindow items={items} />, document.getElementById('root'));
            </script>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-gray-100">
            <p className="text-2xl mb-4 font-semibold text-gray-600">Loading your organizm...</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header Controls */}
      <div className="flex justify-between items-center p-6 border-b border-white/20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Organizm
          </h1>
          
          {/* Workspace Toggle Buttons */}
          <div className="flex gap-2">
            <Button
              variant={state.workspace === 'work' ? 'default' : 'outline'}
              size="sm"
              onClick={() => switchWorkspace('work')}
              className="text-white bg-green-900 hover:bg-green-800 transition-all border-none"
            >
              <Briefcase size={16} className="mr-1" />
              Work
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => switchWorkspace('personal')}
              className="text-white bg-blue-800 hover:bg-blue-700 transition-all border-none"
            >
              <User size={16} className="mr-1" />
              Personal
            </Button>
          </div>
          
          {state.viewMode === 'tree' && (
            <Button
              variant="outline"
              size="sm"
              onClick={addGoal}
              className="text-white bg-gray-700 hover:bg-gray-600 transition-all border-none"
            >
              <Plus size={16} className="mr-1" />
              Add Goal
            </Button>
          )}
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/elizabeth')}
            className="text-gray-400 bg-gray-700 hover:bg-gray-600 transition-all border-none"
          >
            <Heart size={16} className="mr-1 text-gray-400" />
            Elizabeth
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={getCurrentHistory().length === 0}
            className="text-white bg-gray-700 hover:bg-gray-600 transition-all border-none disabled:opacity-50"
          >
            <RotateCcw size={16} className="mr-1" />
            Undo
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={showAll}
            className="text-white bg-gray-700 hover:bg-gray-600 transition-all border-none"
          >
            <Eye size={16} className="mr-1" />
            Show All
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={state.viewMode === 'tree' ? switchToTodayView : returnToTreeView}
            className="text-white bg-gray-700 hover:bg-gray-600 transition-all border-none"
          >
            {state.viewMode === 'tree' ? (
              <>
                <Calendar size={16} className="mr-1" />
                Today
              </>
            ) : (
              <>
                <ArrowLeft size={16} className="mr-1" />
                Return
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="text-white bg-gray-700 hover:bg-gray-600 transition-all border-none"
          >
            {isFullscreen ? (
              <>
                <Minimize size={16} className="mr-1" />
                Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize size={16} className="mr-1" />
                Fullscreen
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-88px)] overflow-auto">
        {state.viewMode === 'tree' ? (
          <div className="p-8">
            {state.items.length > 0 ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="goals-list">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="flex flex-col gap-10"
                    >
                      {state.items.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`flex justify-start transition-all duration-200 ${
                                snapshot.isDragging 
                                  ? 'scale-105 shadow-2xl bg-white/20 backdrop-blur-sm rounded-lg p-4' 
                                  : ''
                              }`}
                              style={{
                                ...provided.draggableProps.style,
                                cursor: snapshot.isDragging ? 'grabbing' : 'grab'
                              }}
                            >
                              <OrganismItem
                                item={item}
                                level={0}
                                workspace={state.workspace}
                                onToggleCollapse={toggleCollapse}
                                onAddItem={addItem}
                                onDeleteItem={deleteItem}
                                onUpdateText={updateItemText}
                                onKeyDown={handleKeyDown}
                                onReorderChildren={reorderChildren}
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
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-gray-100">
                    <p className="text-2xl mb-4 font-semibold text-gray-600">No goals yet</p>
                    <p className="text-gray-400 text-lg">Click "Add Goal" to get started with your {state.workspace} goals</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <TodayView
            items={todayItems}
            onReorder={reorderTodayItems}
            onCopyToNewWindow={handleCopyToNewWindow}
          />
        )}
      </div>
    </div>
  );
};
