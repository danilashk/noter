'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  EllipsisHorizontalIcon,
  ShareIcon, 
  PlusIcon
} from '@heroicons/react/24/outline';

interface BoardMenuProps {
  sessionId: string;
  onShare: () => void;
  trigger?: React.ReactNode;
}

export function BoardMenu({ sessionId, onShare, trigger }: BoardMenuProps) {
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
            {/* Действия */}
            <div className="py-1">
              <button
                onClick={onShare}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <ShareIcon className="w-4 h-4" />
                Поделиться ссылкой
              </button>

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
