'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  EllipsisHorizontalIcon,
  ShareIcon, 
  ArrowLeftOnRectangleIcon,
  ClipboardDocumentIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface BoardMenuProps {
  sessionId: string;
  isRealtimeConnected: boolean;
  onShare: () => void;
  onLeave: () => void;
}

export function BoardMenu({ sessionId, isRealtimeConnected, onShare, onLeave }: BoardMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Закрываем меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId).then(() => {
      // Простое уведомление
      const notification = document.createElement('div');
      notification.innerHTML = 'ID сессии скопирован!';
      notification.style.backgroundColor = 'hsl(var(--card))';
      notification.style.color = 'hsl(var(--foreground))';
      notification.className = 'fixed top-20 right-4 border px-4 py-3 rounded-lg shadow-lg z-50';
      document.body.appendChild(notification);
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
    });
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-ghost inline-flex items-center justify-center w-8 h-8 p-0"
        aria-label="Дополнительные действия"
      >
        <EllipsisHorizontalIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 glass-effect border border-border rounded-lg shadow-lg z-50 animate-slide-up">
          <div className="py-2">
            {/* Информация о сессии */}
            <div className="px-3 py-2 border-b border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <InformationCircleIcon className="w-4 h-4" />
                <span>Статус сессии</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isRealtimeConnected ? 'bg-green-400' : 'bg-red-500'
                }`} />
                <span className="text-sm">
                  {isRealtimeConnected ? 'Подключено' : 'Отключено'}
                </span>
              </div>
            </div>

            {/* Действия */}
            <div className="py-1">
              <button
                onClick={onShare}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-3 transition-colors"
              >
                <ShareIcon className="w-4 h-4" />
                Поделиться ссылкой
              </button>

              <button
                onClick={copySessionId}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-3 transition-colors"
              >
                <ClipboardDocumentIcon className="w-4 h-4" />
                Скопировать ID сессии
              </button>
            </div>

            {/* Выход */}
            <div className="border-t border-border/50 py-1">
              <button
                onClick={onLeave}
                className="w-full px-3 py-2 text-left text-sm hover:bg-destructive/10 text-destructive flex items-center gap-3 transition-colors"
              >
                <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                Покинуть сессию
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}