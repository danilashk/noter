'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  EllipsisHorizontalIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface BoardMenuProps {
  sessionId: string;
  trigger?: React.ReactNode;
  currentParticipant?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

export function BoardMenu({ sessionId, trigger, currentParticipant }: BoardMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const createNewBoard = () => {
    router.push('/board/new');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)}>
          {trigger}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn-ghost inline-flex items-center justify-center w-8 h-8 p-0"
          aria-label="Дополнительные действия"
        >
          <EllipsisHorizontalIcon className="w-5 h-5" />
        </button>
      )}

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 glass-effect border border-border rounded-lg shadow-lg z-50 animate-slide-up">
          <div className="py-2">
            {/* Имя пользователя */}
            {currentParticipant && (
              <div className="px-3 py-2 border-b border-border/50">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: currentParticipant.color }}
                  />
                  <span className="text-sm font-medium text-foreground truncate">
                    {currentParticipant.name}
                  </span>
                </div>
              </div>
            )}
            
            {/* Действия */}
            <div className="py-1">
              <button
                onClick={createNewBoard}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <PlusIcon className="w-4 h-4" />
                Создать новую доску
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
