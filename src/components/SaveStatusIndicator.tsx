import React from 'react';
import { Loader2, Check, AlertTriangle } from 'lucide-react';

interface SaveStatusIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  className?: string;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  isSaving,
  lastSaved,
  className = ""
}) => {
  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just saved';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Saved ${minutes}m ago`;
    } else {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Saved ${hours}h ago`;
    }
  };

  if (isSaving) {
    return (
      <div className={`flex items-center gap-2 text-yellow-400 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Saving...</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className={`flex items-center gap-2 text-green-400 ${className}`}>
        <Check className="w-4 h-4" />
        <span className="text-sm">{formatLastSaved(lastSaved)}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-gray-400 ${className}`}>
      <AlertTriangle className="w-4 h-4" />
      <span className="text-sm">Not saved</span>
    </div>
  );
};