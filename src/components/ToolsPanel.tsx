'use client';

import React from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  MinusIcon,
} from '@heroicons/react/24/outline';

interface ToolsPanelProps {
  isDrawingMode: boolean;
  onToggleDrawingMode: () => void;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export function ToolsPanel({ 
  isDrawingMode, 
  onToggleDrawingMode, 
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom
}: ToolsPanelProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex flex-col gap-2">
        {/* Zoom Controls */}
        <div className="glass-effect border border-border/20 rounded-lg p-2 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onZoomIn}
              className="w-10 h-10 rounded-md hover:bg-muted/50 flex items-center justify-center transition-colors"
              title="Приблизить"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
            
            <button
              onClick={onResetZoom}
              className="text-xs px-2 py-1 rounded text-muted-foreground hover:text-foreground transition-colors min-w-[3rem]"
              title="Сбросить масштаб"
            >
              {Math.round(scale * 100)}%
            </button>
            
            <button
              onClick={onZoomOut}
              className="w-10 h-10 rounded-md hover:bg-muted/50 flex items-center justify-center transition-colors"
              title="Отдалить"
            >
              <MinusIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Tools */}
        <div className="glass-effect border border-border/20 rounded-lg p-2 backdrop-blur-sm">
          <div className="flex flex-col gap-2">
            {/* Drawing Tool */}
            <button
              onClick={onToggleDrawingMode}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all relative ${
                isDrawingMode 
                  ? 'text-white shadow-lg ring-2' 
                  : 'hover:bg-muted/50'
              }`}
              style={isDrawingMode ? {
                backgroundColor: 'var(--user-primary)',
                ringColor: 'var(--user-primary-light)'
              } : {}}
              title={isDrawingMode ? "Маркер активен" : "Активировать маркер"}
            >
              <PencilIcon className="w-5 h-5" />
              {isDrawingMode && (
                <div 
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
                  style={{ backgroundColor: 'var(--user-primary)' }}
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
