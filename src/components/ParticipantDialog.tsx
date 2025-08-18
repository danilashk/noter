'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRightOnRectangleIcon, 
  SparklesIcon, 
  UsersIcon 
} from '@heroicons/react/24/outline';
import { GridBackground } from '@/components/GridBackground';
import { Cursor } from '@/components/Cursor';

interface ParticipantDialogProps {
  isOpen: boolean;
  onJoin: (name: string) => Promise<void>;
  sessionTitle?: string;
  isNewSession?: boolean;
  participantCount?: number;
  activeParticipantCount?: number;
}

export function ParticipantDialog({ 
  isOpen, 
  onJoin, 
  sessionTitle, 
  isNewSession = false, 
  participantCount, 
  activeParticipantCount 
}: ParticipantDialogProps) {
  const [name, setName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  
  // Генерируем случайные цвета и позицию при монтировании
  const [demoConfig] = useState(() => {
    // Все доступные цвета
    const allColors = ['#E53E3E', '#3182CE', '#38A169', '#D69E2E', '#805AD5', '#DD6B20'];
    
    // Выбираем 3 разных случайных цвета
    const shuffled = [...allColors].sort(() => Math.random() - 0.5);
    const selectedColors = {
      card: shuffled[0],
      cursor1: shuffled[1],
      cursor2: shuffled[2]
    };
    
    // Генерируем позицию карточки - максимально слева
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const marginFromEdge = 50; // Небольшой отступ от края экрана
    const cardWidth = 256;
    const cardHeight = 120;
    
    // Максимальная позиция X - чтобы карточка была как можно левее
    // но не ближе чем centerX - 450 (чтобы даже с курсорами не пересекалась с центром)
    const maxX = Math.min(350, centerX - 450); // Не дальше 350px от левого края
    
    // Определяем 2 безопасные зоны только в левом краю
    const zones = [
      { // Левый верхний угол
        minX: marginFromEdge,
        maxX: maxX,
        minY: marginFromEdge,
        maxY: centerY - 350 // Еще дальше от центра по вертикали
      },
      { // Левый нижний угол
        minX: marginFromEdge,
        maxX: maxX,
        minY: centerY + 350, // Еще дальше от центра по вертикали
        maxY: window.innerHeight - marginFromEdge - cardHeight
      }
    ].filter(zone => zone.maxX > zone.minX && zone.maxY > zone.minY);
    
    // Если нет валидных зон (очень маленький экран), используем фиксированную позицию
    const zone = zones.length > 0 
      ? zones[Math.floor(Math.random() * zones.length)] 
      : {
          minX: marginFromEdge,
          maxX: marginFromEdge + 100,
          minY: marginFromEdge,
          maxY: marginFromEdge + 100
        };
    
    // Генерируем позицию в выбранной зоне
    const x = zone.minX + Math.random() * (zone.maxX - zone.minX);
    const y = zone.minY + Math.random() * (zone.maxY - zone.minY);
    
    return {
      colors: selectedColors,
      cardPosition: { x, y }
    };
  });
  
  // Состояния для демо-анимации
  const [showDemoCard, setShowDemoCard] = useState(false);
  const [demoCardText, setDemoCardText] = useState('');
  const [showDemoCursor, setShowDemoCursor] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showSecondCursor, setShowSecondCursor] = useState(false);
  const [secondCursorPosition, setSecondCursorPosition] = useState({ x: 0, y: 0 });
  
  const demoText = 'Отличная идея для продукта!';

  useEffect(() => {
    if (!isOpen) return;

    const startDemoAnimation = () => {
      // Через 2 секунды показываем карточку
      setTimeout(() => {
        setShowDemoCard(true);
        
        // Через 0.5 секунды начинаем печатать текст
        setTimeout(() => {
          let currentIndex = 0;
          const typeInterval = setInterval(() => {
            if (currentIndex <= demoText.length) {
              setDemoCardText(demoText.slice(0, currentIndex));
              currentIndex++;
            } else {
              clearInterval(typeInterval);
              
              // После завершения печатания показываем курсоры
              setTimeout(() => {
                setShowDemoCursor(true);
                // Второй курсор появляется через 6 секунд
                setTimeout(() => {
                  setShowSecondCursor(true);
                }, 6000);
              }, 500);
            }
          }, 100); // Скорость печатания
        }, 500);
      }, 2000);
    };

    startDemoAnimation();
  }, [isOpen]);



  // Анимация первого курсора с плавным появлением
  useEffect(() => {
    if (!showDemoCursor) return;

    const animateCursor = () => {
      let time = 0;
      let currentX = 50; // Начальная позиция в левом углу
      let currentY = 100;
      const speed = 0.007;
      const centerX = demoConfig.cardPosition.x + 128;
      const centerY = demoConfig.cardPosition.y + 60;
      
      const moveInterval = setInterval(() => {
        time += speed;
        
        // Целевая позиция по эллиптической траектории
        const targetX = centerX + Math.cos(time) * 200;
        const targetY = centerY + Math.sin(time * 1.3) * 120;
        
        // Медленное движение к цели (плавное появление)
        const easeSpeed = Math.min(0.02 + time * 0.001, 0.08); // Ускоряется со временем
        currentX += (targetX - currentX) * easeSpeed;
        currentY += (targetY - currentY) * easeSpeed;
        
        setCursorPosition({ x: currentX, y: currentY });
      }, 16);

      return () => clearInterval(moveInterval);
    };

    return animateCursor();
  }, [showDemoCursor, demoConfig.cardPosition]);

  // Анимация второго курсора с плавным появлением из другого угла
  useEffect(() => {
    if (!showSecondCursor) return;

    const animateCursor = () => {
      let time = 0;
      let currentX = 80; // Начальная позиция в левом нижнем углу
      let currentY = window.innerHeight - 150;
      const speed = 0.005;
      const centerX = demoConfig.cardPosition.x + 128;
      const centerY = demoConfig.cardPosition.y + 60;
      
      const moveInterval = setInterval(() => {
        time += speed;
        
        // Целевая позиция по траектории восьмерки
        const scale = 180;
        const targetX = centerX + (scale * Math.cos(time)) / (1 + Math.sin(time) * Math.sin(time));
        const targetY = centerY + (scale * Math.sin(time) * Math.cos(time)) / (1 + Math.sin(time) * Math.sin(time));
        
        // Медленное движение к цели (плавное появление)
        const easeSpeed = Math.min(0.015 + time * 0.0008, 0.06); // Медленнее чем первый
        currentX += (targetX - currentX) * easeSpeed;
        currentY += (targetY - currentY) * easeSpeed;
        
        setSecondCursorPosition({ x: currentX, y: currentY });
      }, 16);

      return () => clearInterval(moveInterval);
    };

    return animateCursor();
  }, [showSecondCursor, demoConfig.cardPosition]);

  const handleJoin = async () => {
    if (!name.trim()) return;

    try {
      setIsJoining(true);
      await onJoin(name.trim());
    } catch (error) {
      console.error('Ошибка присоединения:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      handleJoin();
    }
  };

  return (
    <div className="fixed inset-0 gradient-bg relative overflow-hidden z-50">
      {/* Grid Background - как на канвасе */}
      <GridBackground scale={1} panX={0} panY={0} />
      
      {/* Демо-анимация карточки */}
      {showDemoCard && (
        <div
          className="absolute transition-all duration-500 ease-out animate-float-up"
          style={{
            left: demoConfig.cardPosition.x,
            top: demoConfig.cardPosition.y,
            zIndex: 10,
          }}
        >
          <Card
            className="w-64 idea-card glass-effect relative flex flex-col"
            style={{
              height: 120,
              padding: 0,
            }}
          >
            {/* Анимированный бордер */}
            <div 
              className="absolute inset-0 transition-all duration-500 ease-out"
              style={{
                borderTop: '2px solid transparent',
                borderRight: '2px solid transparent', 
                borderBottom: '2px solid transparent',
                borderLeft: `4px solid ${demoConfig.colors.card}`,
                borderRadius: 'inherit'
              }}
            />
            
            {/* Контент карточки */}
            <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-4 pt-4 pb-4">
              <div 
                className="cursor-text w-full break-words"
                style={{ 
                  wordBreak: 'break-word',
                  fontSize: '1rem',
                  lineHeight: '1.5rem',
                  padding: '0',
                  margin: '0',
                  minHeight: '60px',
                  maxHeight: '72px',
                  overflowY: 'auto'
                }}
              >
                {demoCardText ? (
                  <span className="whitespace-pre-wrap block">
                    {demoCardText}
                    {demoCardText.length < demoText.length && (
                      <span className="animate-pulse">|</span>
                    )}
                  </span>
                ) : (
                  <span className="text-muted-foreground block">Введите вашу идею...</span>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Первый демо-курсор */}
      {showDemoCursor && (
        <Cursor
          x={cursorPosition.x}
          y={cursorPosition.y}
          name="Алекс Р."
          color={demoConfig.colors.cursor1}
        />
      )}
      
      {/* Второй демо-курсор */}
      {showSecondCursor && (
        <Cursor
          x={secondCursorPosition.x}
          y={secondCursorPosition.y}
          name="Мария С."
          color={demoConfig.colors.cursor2}
        />
      )}
      
      {/* Основной диалог */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md glass-effect relative z-20">
          <div className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
                {isNewSession ? (
                  <SparklesIcon className="w-8 h-8 text-primary" />
                ) : (
                  <UsersIcon className="w-8 h-8 text-primary" />
                )}
              </div>
              
              <h2 className="text-2xl font-semibold mb-2">
                {isNewSession ? 'Создание новой доски' : 'Присоединиться к доске'}
              </h2>
              
              {!isNewSession && (participantCount !== undefined) && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 text-center">
                    Количество участников: {participantCount}
                  </p>
                </div>
              )}
            </div>
            
            {/* Form */}
            <Card className="p-4 space-y-4 bg-muted/30 border-border/40">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Ваше имя
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Например: Анна К."
                  className="input-field"
                  autoFocus
                />
              </div>
            </Card>

            {/* Footer */}
            <div className="mt-6">
              <button
                onClick={handleJoin}
                disabled={!name.trim() || isJoining}
                className="w-full btn-primary text-lg px-6 py-3 text-center"
              >
                {isJoining ? (
                  isNewSession ? 'Создаем доску...' : 'Присоединяемся...'
                ) : (
                  isNewSession ? 'Создать доску' : 'Присоединиться к команде'
                )}
              </button>
              
              <p className="text-xs text-gray-500 text-center mt-5">
                {isNewSession 
                  ? 'Штурмуйте идеи в реальном времени с коллегами'
                  : 'Начните создавать идеи вместе в реальном времени'
                }
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
