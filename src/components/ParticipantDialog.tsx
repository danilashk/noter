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
  
  // Состояния для демо-анимации
  const [showDemoCard, setShowDemoCard] = useState(false);
  const [demoCardText, setDemoCardText] = useState('');
  const [showDemoCursor, setShowDemoCursor] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showSecondCursor, setShowSecondCursor] = useState(false);
  const [secondCursorPosition, setSecondCursorPosition] = useState({ x: 0, y: 0 });
  
  const demoText = 'Отличная идея для продукта!';
  const demoColors = {
    card: '#805AD5', // Фиолетовый цвет для карточки
    cursor1: '#E53E3E', // Красный цвет для первого курсора
    cursor2: '#38A169' // Зеленый цвет для второго курсора
  };

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
                // Второй курсор появляется чуть позже
                setTimeout(() => {
                  setShowSecondCursor(true);
                }, 800);
              }, 500);
            }
          }, 100); // Скорость печатания
        }, 500);
      }, 2000);
    };

    startDemoAnimation();
  }, [isOpen]);

  // Анимация движения первого курсора (красный) - из левого верхнего угла
  useEffect(() => {
    if (!showDemoCursor) return;

    const animateCursor = () => {
      // Стартовая позиция - левый верхний угол
      let currentX = 50;
      let currentY = 50;
      let targetX = 350;
      let targetY = 150;
      let movingToTarget = true;
      
      const moveInterval = setInterval(() => {
        // Плавное движение с easing
        if (movingToTarget) {
          const speed = 0.05; // Оптимальная скорость для плавности
          currentX += (targetX - currentX) * speed;
          currentY += (targetY - currentY) * speed;
          
          // Если достигли цели, меняем цель через некоторое время
          if (Math.abs(currentX - targetX) < 2 && Math.abs(currentY - targetY) < 2) {
            setTimeout(() => {
              // Новая случайная цель в левой части экрана
              targetX = 100 + Math.random() * 300;
              targetY = 100 + Math.random() * 150;
            }, 1000 + Math.random() * 2000); // Пауза 1-3 секунды
          }
          
          setCursorPosition({ 
            x: currentX, 
            y: currentY 
          });
        }
      }, 16);

      return () => clearInterval(moveInterval);
    };

    return animateCursor();
  }, [showDemoCursor]);

  // Анимация движения второго курсора (зеленый) - из левого нижнего угла
  useEffect(() => {
    if (!showSecondCursor) return;

    const animateCursor = () => {
      // Стартовая позиция - левый нижний угол
      let currentX = 80;
      let currentY = window.innerHeight - 100;
      let targetX = 250;
      let targetY = 280;
      
      const moveInterval = setInterval(() => {
        // Супер плавное движение
        const speed = 0.04; // Чуть медленнее для разнообразия
        currentX += (targetX - currentX) * speed;
        currentY += (targetY - currentY) * speed;
        
        // Если достигли цели, выбираем новую
        if (Math.abs(currentX - targetX) < 2 && Math.abs(currentY - targetY) < 2) {
          setTimeout(() => {
            // Движение вокруг карточки
            targetX = 150 + Math.random() * 250;
            targetY = 200 + Math.random() * 150;
          }, 1500 + Math.random() * 2000); // Пауза 1.5-3.5 секунды
        }
        
        setSecondCursorPosition({ 
          x: currentX, 
          y: currentY 
        });
      }, 16);

      return () => clearInterval(moveInterval);
    };

    return animateCursor();
  }, [showSecondCursor]);

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
            left: 100,
            top: 100,
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
                borderLeft: `4px solid ${demoColors.card}`,
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
          color={demoColors.cursor1}
        />
      )}
      
      {/* Второй демо-курсор */}
      {showSecondCursor && (
        <Cursor
          x={secondCursorPosition.x}
          y={secondCursorPosition.y}
          name="Мария С."
          color={demoColors.cursor2}
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
