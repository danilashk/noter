'use client';

import React from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  MinusIcon,
  ArrowUturnLeftIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface ToolsPanelProps {
  isDrawingMode: boolean;
  onToggleDrawingMode: () => void;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onUndoLastLine: () => void;
  canUndoLine: boolean;
  isVisible?: boolean;
}

export function ToolsPanel({ 
  isDrawingMode, 
  onToggleDrawingMode, 
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onUndoLastLine,
  canUndoLine,
  isVisible = true
}: ToolsPanelProps) {
  return (
    <>
      {/* Zoom Controls - теперь слева, скрываются если не начат brainstorm */}
      <div 
        className={`fixed bottom-6 left-6 z-50 transition-all duration-500 ease-out ${
          isVisible 
            ? 'opacity-100 translate-x-0' 
            : 'opacity-0 -translate-x-4 pointer-events-none'
        }`}
      >
        <div className="glass-effect border border-border/20 rounded-lg p-2 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onZoomIn}
              className="w-10 h-10 rounded-md hover:bg-muted/50 flex items-center justify-center transition-colors cursor-pointer"
              title="Приблизить"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
            
            <button
              onClick={onResetZoom}
              className="text-xs px-2 py-1 rounded text-muted-foreground hover:text-foreground transition-colors min-w-[3rem] cursor-pointer"
              title="Сбросить масштаб"
            >
              {Math.round(scale * 100)}%
            </button>
            
            <button
              onClick={onZoomOut}
              className="w-10 h-10 rounded-md hover:bg-muted/50 flex items-center justify-center transition-colors cursor-pointer"
              title="Отдалить"
            >
              <MinusIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Drawing Tools - остаются справа, с плавным появлением */}
      <div 
        className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-out ${
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="glass-effect border border-border/20 rounded-lg p-2 backdrop-blur-sm">
          <div className="flex flex-col gap-2">
            {/* Undo Line Tool */}
            <button
              onClick={onUndoLastLine}
              disabled={!canUndoLine}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                canUndoLine 
                  ? 'hover:bg-muted/50 text-foreground cursor-pointer' 
                  : 'text-muted-foreground cursor-not-allowed opacity-50'
              }`}
              title="Отменить последнюю линию"
            >
              <ArrowUturnLeftIcon className="w-5 h-5" />
            </button>
            
            {/* Drawing Tool */}
            <button
              onClick={onToggleDrawingMode}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all relative cursor-pointer ${
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
            
            {/* Information Tool */}
            <div className="relative group">
              <button
                className="w-12 h-12 rounded-lg flex items-center justify-center transition-all hover:bg-muted/50 cursor-pointer"
                title="Подсказки по использованию"
              >
                <InformationCircleIcon className="w-5 h-5" />
              </button>
              
              {/* Tooltip */}
              <div className="absolute bottom-0 right-full mr-3 w-64 p-3 bg-card/95 backdrop-blur-sm border rounded-lg shadow-lg scale-95 opacity-0 invisible group-hover:scale-100 group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="text-xs text-muted-foreground mb-2">
                  Сделайте двойной клик по пустому месту на канвасе для создания заметки
                </div>
                <div className="text-xs text-muted-foreground/70 border-t border-border/30 pt-2">
                  Неактивные доски автоматически удаляются через 24 часа
                </div>
                {/* Arrow pointing to the right */}
                <div className="absolute top-1/2 left-full w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-border -translate-y-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
