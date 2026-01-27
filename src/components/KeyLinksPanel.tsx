import React, { useState } from 'react';
import { useKeyLinks, KeyLink } from '@/hooks/useKeyLinks';
import { Plus, Trash2, GripVertical, Link, Pencil } from 'lucide-react';

interface KeyLinksPanelProps {
  isVisible: boolean;
}

export const KeyLinksPanel: React.FC<KeyLinksPanelProps> = ({ isVisible }) => {
  const { links, isLoading, addLink, updateLink, deleteLink, reorderLinks } = useKeyLinks();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Helper to ensure URL has a protocol
  const normalizeUrl = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleAddLink = async () => {
    if (newTitle.trim() && newUrl.trim()) {
      await addLink(newTitle.trim(), normalizeUrl(newUrl));
      setNewTitle('');
      setNewUrl('');
      setIsAdding(false);
    }
  };

  const handleStartEdit = (link: KeyLink) => {
    setEditingId(link.id);
    setEditTitle(link.title);
    setEditUrl(link.url);
  };

  const handleSaveEdit = async () => {
    if (editingId && editTitle.trim() && editUrl.trim()) {
      await updateLink(editingId, editTitle.trim(), normalizeUrl(editUrl));
      setEditingId(null);
      setEditTitle('');
      setEditUrl('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditUrl('');
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    reorderLinks(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: 'add' | 'edit') => {
    if (e.key === 'Enter') {
      if (action === 'add') {
        handleAddLink();
      } else {
        handleSaveEdit();
      }
    } else if (e.key === 'Escape') {
      if (action === 'add') {
        setIsAdding(false);
        setNewTitle('');
        setNewUrl('');
      } else {
        handleCancelEdit();
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div className="h-full bg-card p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Link size={20} />
          Key Links
        </h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 ease-ios active:scale-95 shadow-md hover:shadow-lg font-medium text-sm"
          >
            <Plus size={16} />
            Add
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-center py-8">Loading links...</div>
      ) : (
        <div className="space-y-3">
          {isAdding && (
            <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'add')}
                placeholder="Link title"
                className="w-full bg-card text-foreground px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                autoFocus
              />
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'add')}
                placeholder="https://..."
                className="w-full bg-card text-foreground px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddLink}
                  disabled={!newTitle.trim() || !newUrl.trim()}
                  className="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40"
                >
                  Add Link
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewTitle('');
                    setNewUrl('');
                  }}
                  className="px-3 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {links.length === 0 && !isAdding ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">No links yet</div>
              <p className="text-sm text-muted-foreground/70">
                Add links to Google Docs, websites, or other resources
              </p>
            </div>
          ) : (
            links.map((link, index) => (
              <div
                key={link.id}
                draggable={editingId !== link.id}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`group bg-secondary/30 hover:bg-secondary/50 rounded-xl p-3 transition-all duration-200 ${
                  draggedIndex === index ? 'opacity-50 scale-95' : ''
                }`}
              >
                {editingId === link.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 'edit')}
                      className="w-full bg-card text-foreground px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                      autoFocus
                    />
                    <input
                      type="url"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 'edit')}
                      className="w-full bg-card text-foreground px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="flex-1 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-all duration-200"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <GripVertical
                      size={18}
                      className="text-gray-400 cursor-grab flex-shrink-0 hover:text-gray-600"
                    />
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0 hover:text-blue-600 transition-colors"
                    >
                      <div className="font-medium text-foreground text-sm truncate hover:text-blue-600">
                        {link.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {link.url}
                      </div>
                    </a>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(link);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Edit link"
                      >
                        <Pencil size={16} className="text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteLink(link.id);
                        }}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete link"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
