import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useElizabethOrganism } from '@/hooks/useElizabethOrganism';
import { OrganismItem } from './OrganismItem';
import { TodayView } from './TodayView';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { Button } from '@/components/ui/button';
import { RotateCcw, Eye, Calendar, Plus, ArrowLeft } from 'lucide-react';

export const ElizabethFlow: React.FC = () => {
  const {
    state,
    todayItems,
    savedTreeState,
    isLoading,
    isSaving,
    lastSaved,
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
    getCurrentHistory
  } = useElizabethOrganism();

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
    const tabTitle = `${monthNames[today.getMonth()]} ${today.getDate()} - Elizabeth`;
    
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
            </style>
          </head>
          <body>
            <div id="root"></div>
            <script type="text/babel">
              const { useState } = React;
              
              const TodayWindow = ({ items }) => {
                const [draggedIndex, setDraggedIndex] = useState(null);
                const [windowItems, setWindowItems] = useState(items);

                const handleDragStart = (e, index) => {
                  setDraggedIndex(index);
                  e.dataTransfer.effectAllowed = 'move';
                };

                const handleDragOver = (e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                };

                const handleDrop = (e, dropIndex) => {
                  e.preventDefault();
                  if (draggedIndex !== null && draggedIndex !== dropIndex) {
                    const newItems = [...windowItems];
                    const [removed] = newItems.splice(draggedIndex, 1);
                    newItems.splice(dropIndex, 0, removed);
                    setWindowItems(newItems.map((item, index) => ({ ...item, priority: index })));
                  }
                  setDraggedIndex(null);
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
                      <h2 className="text-2xl font-bold text-center mb-8 text-white">Today's Focus</h2>
                      
                      {windowItems.map((item, index) => (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                          className={\`flex items-center gap-4 p-4 border-2 rounded-lg hover:shadow-lg transition-all cursor-move \${getItemTypeColor(item.type)} \${draggedIndex === index ? 'opacity-50 scale-95' : ''}\`}
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
            <p className="text-2xl mb-4 font-semibold text-gray-600">Loading Elizabeth's organizm...</p>
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Elizabeth's Organizm
          </h1>
          
          <SaveStatusIndicator isSaving={isSaving} lastSaved={lastSaved} />
          
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
                                workspace="work"
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
                    <p className="text-gray-400 text-lg">Click "Add Goal" to get started with Elizabeth's goals</p>
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
