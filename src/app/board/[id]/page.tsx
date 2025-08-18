'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ParticipantDialog } from '@/components/ParticipantDialog'
import { Cursor } from '@/components/Cursor'
import { 
  PlusIcon, 
  TrashIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { useSession } from '@/hooks/useSession'
import { useCardsWithRealtime } from '@/hooks/useCardsWithRealtime'
import { useParticipants } from '@/hooks/useParticipants'
import { useCursorBroadcast } from '@/hooks/useCursorBroadcast'
import { useDrawingWithRealtime } from '@/hooks/useDrawingWithRealtime'
import { useCardSelectionsWithRealtime } from '@/hooks/useCardSelectionsWithRealtime'
import { BoardMenu } from '@/components/BoardMenu'
import { DrawingCanvas } from '@/components/DrawingCanvas'
import { ToolsPanel } from '@/components/ToolsPanel'
import { GridBackground } from '@/components/GridBackground'
import { UserTheme } from '@/components/UserTheme'
import { useCanvas } from '@/hooks/useCanvas'
import { useToast } from '@/hooks/useToast'
import { ToastManager } from '@/components/ui/toast'

export default function BoardPage() {
  const params = useParams()
  const router = useRouter()
  // Debug: BoardPage initial render
  
  // Инициализируем sessionId сразу из params
  const [sessionId, setSessionId] = useState<string>(() => {
    const id = params.id as string;
    return id === 'new' ? '' : (id || '');
  });
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [draggingCard, setDraggingCard] = useState<string | null>(null);
  const [resizingCard, setResizingCard] = useState<string | null>(null);
  const [tempCardHeights, setTempCardHeights] = useState<Record<string, number>>({});
  
  // Toast уведомления
  const { toasts, showWarning, removeToast } = useToast();

  // Обрабатываем params и обновляем sessionId
  React.useEffect(() => {
    const id = params.id as string;
    
    if (!id) {
      return;
    }
    
    // Очищаем ID от лишних символов (например, URL encoding)
    const cleanId = decodeURIComponent(id).split(/[^0-9a-f-]/i)[0];
    
    // Проверяем валидность ID (должен быть UUID или 'new')
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    
    if (id === 'new' && !hasRedirected) {
      const newId = crypto.randomUUID();
      setSessionId(newId);
      setHasRedirected(true);
      // Используем Next.js router для правильной навигации
      router.replace(`/board/${newId}`);
    } else if (id !== 'new' && !isValidUUID) {
      // Некорректный ID - редиректим на главную с уведомлением
      showWarning(
        'Некорректная ссылка на доску. Вы будете перенаправлены для создания новой доски.',
        6000
      );
      setTimeout(() => {
        router.replace('/board/new');
      }, 1000);
    } else if (id !== 'new' && cleanId !== sessionId && isValidUUID) {
      // Используем очищенный ID
      setSessionId(cleanId);
      // Если ID был с мусором, редиректим на чистый URL
      if (id !== cleanId) {
        router.replace(`/board/${cleanId}`);
      }
    }
  }, [params.id, router, hasRedirected, sessionId, showWarning]);

  // Включаем все хуки
  const { session, loading: sessionLoading, error: sessionError, updateHasStartedBrainstorm } = useSession(sessionId);
  const { activeParticipants, currentParticipant, loading: participantsLoading, error: participantsError, isRestoring, joinSession, leaveSession } = useParticipants(sessionId);
  const { cards, loading: cardsLoading, isRealtimeConnected, createCard, updateCard, deleteCard, updateCardPosition, updateCardHeight } = useCardsWithRealtime(sessionId, currentParticipant?.id || null);
  
  // Оптимизированный realtime broadcast для курсоров
  const { cursors, startTracking } = useCursorBroadcast(sessionId, currentParticipant);
  
  // Drawing functionality
  const { lines: drawingLines, createLine, undoLastLine, canUndoLine } = useDrawingWithRealtime(sessionId, currentParticipant?.id || null);
  
  // Card selections functionality
  const { selectCard: selectCardRealtime, deselectCard: deselectCardRealtime, getParticipantBySelectedCard } = useCardSelectionsWithRealtime(sessionId, currentParticipant?.id || null);
  
  // Функция для получения цвета создателя карточки
  const getCreatorColor = (createdBy: string | null) => {
    if (!createdBy) return currentParticipant?.color || 'hsl(var(--primary))';
    
    // Если это текущий пользователь, используем его цвет
    if (createdBy === currentParticipant?.id) {
      return currentParticipant.color;
    }
    
    // Ищем среди активных участников
    const creator = activeParticipants.find(p => p.id === createdBy);
    return creator?.color || 'hsl(var(--primary))';
  };
  
  // Canvas functionality
  const { scale, panX, panY, isDrawingMode, setScale, setPan, toggleDrawingMode, zoomIn, zoomOut, resetZoom } = useCanvas();

  // Debug: BoardPage render state

  const handleJoinSession = async (name: string) => {
    await joinSession(name);
  };

  const handleCreateCard = async () => {
    if (!sessionId) return;
    
    // Создаем карточку в центре видимой области с учетом трансформаций
    const centerX = (window.innerWidth / 2 - panX) / scale;
    const centerY = (window.innerHeight / 2 - panY) / scale;
    
    await createCard({
      content: '',
      position: { 
        x: centerX - 128 + Math.random() * 100 - 50, // 128 = половина ширины карточки (256px)
        y: centerY - 100 + Math.random() * 100 - 50
      },
      createdBy: currentParticipant?.id || null
    });
    
    // Устанавливаем флаг в БД после создания первой карточки
    if (!session?.hasStartedBrainstorm) {
      await updateHasStartedBrainstorm(true);
    }
  };

  const handleCardUpdate = async (cardId: string, content: string) => {
    await updateCard(cardId, { content });
    setEditingCard(null);
  };

  const handleCardMove = async (cardId: string, x: number, y: number) => {
    await updateCardPosition(cardId, { x, y });
  };

  const handleCardDelete = async (cardId: string) => {
    await deleteCard(cardId);
  };

  const handleCardResize = async (cardId: string, height: number) => {
    await updateCardHeight(cardId, height);
  };

  // Запускаем отслеживание курсора при появлении участника
  React.useEffect(() => {
    if (currentParticipant) {
      const cleanup = startTracking();
      return cleanup;
    }
  }, [currentParticipant, startTracking]);

  // Обрабатываем ошибки через useEffect чтобы не блокировать рендеринг
  React.useEffect(() => {
    if (sessionError || participantsError) {
      const errorMessage = sessionError || participantsError;
      
      // Проверяем, является ли это rate limit ошибкой
      if (errorMessage.includes('RATE_LIMIT_EXCEEDED')) {
        // Rate limit ошибки уже обрабатываются в handleRateLimitError
        return;
      }
      
      // Проверяем, является ли это ошибкой UUID
      if (errorMessage.includes('invalid input syntax for type uuid')) {
        // UUID ошибки уже обрабатываются в хуках
        return;
      }
      
      // Для других критических ошибок показываем toast
      showWarning(errorMessage, 5000);
    }
  }, [sessionError, participantsError, showWarning]);

  if (sessionLoading || cardsLoading || participantsLoading || isRestoring) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Card className="p-8 glass-effect">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/30 border-t-primary mx-auto"></div>
            <p className="mt-6 text-muted-foreground">
              {isRestoring ? 'Восстановление сессии...' : 'Загрузка...'}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (!currentParticipant && !isRestoring) {
    // Определяем, новая ли это сессия (нет других участников)
    const isNewSession = activeParticipants.length === 0;
    
    return <ParticipantDialog isOpen={true} onJoin={handleJoinSession} sessionTitle={session?.title} isNewSession={isNewSession} />;
  }

  return (
    <UserTheme userColor={currentParticipant?.color}>
      <div className="min-h-screen gradient-bg relative overflow-hidden">
        {/* Grid Background */}
        <GridBackground scale={scale} panX={panX} panY={panY} />
      
      {/* Drawing Canvas */}
      <DrawingCanvas
        isDrawingMode={isDrawingMode}
        scale={scale}
        panX={panX}
        panY={panY}
        onPanChange={setPan}
        onScaleChange={setScale}
        userColor={currentParticipant?.color}
        drawingLines={drawingLines.map(line => ({
          id: line.id,
          points: line.points,
          color: line.color,
          createdBy: line.createdBy
        }))}
        onCreateLine={(points, color) => {
          createLine({
            points,
            color,
            createdBy: currentParticipant?.id || ''
          });
        }}
        onCreateCard={(x, y) => {
          createCard({
            content: '',
            position: { x, y },
            createdBy: currentParticipant?.id || null
          });
        }}
        onDeselectCard={() => {
          setSelectedCard(null);
          deselectCardRealtime();
        }}
      />
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 glass-effect border-b border-border/20 p-4 z-50 h-20">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-2 min-w-0">
            {/* Participants */}
            {activeParticipants
              .filter(participant => participant.id !== currentParticipant?.id)
              .map((participant) => (
              <Badge
                key={participant.id}
                variant="secondary"
                className="gap-1"
                style={{ 
                  backgroundColor: participant.color + '15', 
                  color: participant.color,
                  borderColor: participant.color + '40'
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: participant.color }}
                />
                {participant.name}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Иконка информации */}
            <div className="relative group">
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-muted/20 transition-all duration-200 cursor-pointer">
                <InformationCircleIcon className="w-6 h-6" />
              </button>
              
              {/* Тултип */}
              <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-card/95 backdrop-blur-sm border rounded-lg shadow-lg scale-95 opacity-0 invisible group-hover:scale-100 group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="text-xs text-muted-foreground mb-2">
                  Сделайте двойной клик по пустому месту на канвасе для создания заметки
                </div>
                <div className="text-xs text-muted-foreground mb-2 border-t border-border/30 pt-2">
                  Нажмите на свой аватар чтобы скопировать ссылку на доску и поделиться с коллегами
                </div>
                <div className="text-xs text-muted-foreground/70 border-t border-border/30 pt-2">
                  Неактивные доски автоматически удаляются через 24 часа
                </div>
                <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-border"></div>
              </div>
            </div>
            
            {/* Аватарка текущего пользователя */}
            <div className="relative">
              <BoardMenu 
                sessionId={sessionId}
                onShare={() => {
                  const url = window.location.href;
                  navigator.clipboard.writeText(url).then(() => {
                    // Простое уведомление
                    const notification = document.createElement('div');
                    notification.innerHTML = 'Ссылка скопирована!';
                    notification.style.backgroundColor = 'hsl(var(--card))';
                    notification.style.color = 'hsl(var(--foreground))';
                    notification.className = 'fixed top-20 right-4 border px-4 py-3 rounded-lg shadow-lg z-50';
                    document.body.appendChild(notification);
                    setTimeout(() => {
                      if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                      }
                    }, 3000);
                  }).catch(() => {
                    alert('Ссылка: ' + url);
                  });
                }}
                trigger={
                  <button className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm hover:scale-105 transition-transform duration-200 shadow-lg border-2 bg-card/80 backdrop-blur-sm cursor-pointer"
                    style={{ 
                      color: currentParticipant?.color || 'hsl(var(--primary))',
                      borderColor: currentParticipant?.color || 'hsl(var(--primary))',
                      backgroundColor: `${currentParticipant?.color || 'hsl(var(--primary))'}15`
                    }}
                  >
                    {currentParticipant?.name?.charAt(0)?.toUpperCase() || 'У'}
                  </button>
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Board Area */}
      <div 
        className="absolute inset-0 pt-24 p-4"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
          transformOrigin: '0 0',
          zIndex: 10, // Заметки всегда поверх канваса
          pointerEvents: cards.length === 0 && !session?.hasStartedBrainstorm ? 'auto' : 'none', // Позволяет взаимодействие с приветственным экраном
        }}
      >
        {cards.map((card) => (
          <Card
            key={card.id}
            data-card-id={card.id}
            className="w-64 p-4 idea-card cursor-move group glass-effect animate-float-up transition-all duration-500 ease-out relative"
            style={{
              position: 'absolute',
              left: card.position.x,
              top: card.position.y,
              height: tempCardHeights[card.id] || card.height,
              pointerEvents: isDrawingMode ? 'none' : 'auto',
              zIndex: (selectedCard === card.id || getParticipantBySelectedCard(card.id)) ? 20 : 15,
            }}
            onClick={() => {
              if (resizingCard) return; // Блокируем выбор во время resize
              
              // Если карточка уже выбрана, ничего не делаем
              if (selectedCard === card.id) return;
              
              // Сначала снимаем выделение с других карточек
              if (selectedCard) {
                deselectCardRealtime();
              }
              
              setSelectedCard(card.id);
              selectCardRealtime(card.id);
            }}
            onMouseDown={(e) => {
              if (isDrawingMode || resizingCard) return; // Блокируем drag во время resize
              
              // Предотвращаем выделение текста при начале перетаскивания
              e.preventDefault();
              
              // Добавляем класс для предотвращения выделения текста
              document.body.classList.add('dragging');
              setDraggingCard(card.id);
              
              const rect = e.currentTarget.getBoundingClientRect();
              const startX = (e.clientX - panX) / scale - card.position.x;
              const startY = (e.clientY - panY) / scale - card.position.y;
              
              const handleMouseMove = (e: MouseEvent) => {
                const newX = (e.clientX - panX) / scale - startX;
                const newY = (e.clientY - panY) / scale - startY;
                void handleCardMove(card.id, newX, newY);
              };
              
              const handleMouseUp = () => {
                // Убираем класс после завершения перетаскивания
                document.body.classList.remove('dragging');
                setDraggingCard(null);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          >
            {/* Анимированный бордер */}
            <div 
              className="absolute inset-0 transition-all duration-500 ease-out"
              style={{
                borderTop: selectedCard === card.id 
                  ? `2px solid ${currentParticipant?.color || 'hsl(var(--primary))'}`
                  : getParticipantBySelectedCard(card.id)
                    ? `2px solid ${activeParticipants.find(p => p.id === getParticipantBySelectedCard(card.id))?.color || 'hsl(var(--primary))'}`
                    : '2px solid transparent',
                borderRight: selectedCard === card.id 
                  ? `2px solid ${currentParticipant?.color || 'hsl(var(--primary))'}`
                  : getParticipantBySelectedCard(card.id)
                    ? `2px solid ${activeParticipants.find(p => p.id === getParticipantBySelectedCard(card.id))?.color || 'hsl(var(--primary))'}`
                    : '2px solid transparent',
                borderBottom: selectedCard === card.id 
                  ? `2px solid ${currentParticipant?.color || 'hsl(var(--primary))'}`
                  : getParticipantBySelectedCard(card.id)
                    ? `2px solid ${activeParticipants.find(p => p.id === getParticipantBySelectedCard(card.id))?.color || 'hsl(var(--primary))'}`
                    : '2px solid transparent',
                borderLeft: `4px solid ${getCreatorColor(card.createdBy)}`,
                borderRadius: 'inherit'
              }}
            />
            {/* Контент карточки */}
            <div className="relative z-10">
              <div className="space-y-2">
                <div className="min-h-[60px] flex items-start">
                  {editingCard === card.id ? (
                    <Textarea
                      defaultValue={card.content}
                      placeholder="Введите вашу идею..."
                      className="w-full h-[60px] resize-none border-none p-0 focus:ring-0 focus:outline-none focus:border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent leading-relaxed shadow-none"
                      style={{ outline: 'none', boxShadow: 'none' }}
                      onBlur={(e) => void handleCardUpdate(card.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.shiftKey) {
                          e.preventDefault();
                          void handleCardUpdate(card.id, e.currentTarget.value);
                        }
                        if (e.key === 'Escape') {
                          setEditingCard(null);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <div 
                      className="cursor-text leading-relaxed w-full min-h-[60px] flex items-start py-0"
                      onClick={() => setEditingCard(card.id)}
                    >
                      {card.content ? (
                        <p className="w-full">{card.content}</p>
                      ) : (
                        <p className="text-muted-foreground w-full">Введите вашу идею...</p>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>
            
            {/* Delete Handle - показываем для выбранной карточки */}
            {selectedCard === card.id && !draggingCard && !resizingCard && (
              <button
                className="absolute -top-2 -right-2 transition-all duration-200 opacity-90 scale-100 z-30 hover:scale-110 group/delete"
                style={{ pointerEvents: 'auto' }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCardDelete(card.id);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <div className="flex items-center justify-center w-6 h-6 cursor-pointer">
                  <div className="glass-effect border-2 border-destructive/50 rounded-full p-1 backdrop-blur-sm bg-card/80 shadow-lg group-hover/delete:bg-destructive/30 group-hover/delete:shadow-xl transition-all duration-200">
                    <TrashIcon className="w-3 h-3 text-destructive group-hover/delete:text-destructive-foreground" />
                  </div>
                </div>
              </button>
            )}

            {/* Resize Handle - показываем для выбранной или при resize */}
            {(selectedCard === card.id || resizingCard === card.id) && (
              <div
                className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 transition-all duration-200 hover:scale-105 group/resize ${
                  resizingCard === card.id 
                    ? 'opacity-100 scale-110' 
                    : 'opacity-90 scale-100'
                }`}
              onMouseDown={(e) => {
                if (isDrawingMode) return;
                
                e.preventDefault();
                e.stopPropagation();
                
                setResizingCard(card.id);
                const startY = e.clientY;
                const startHeight = card.height;
                
                const handleMouseMove = (e: MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const deltaY = (e.clientY - startY) / scale;
                  const newHeight = Math.max(120, Math.min(600, startHeight + deltaY));
                  
                  // Обновляем временную высоту через React state
                  setTempCardHeights(prev => ({
                    ...prev,
                    [card.id]: newHeight
                  }));
                };
                
                const handleMouseUp = (e: MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const deltaY = (e.clientY - startY) / scale;
                  const finalHeight = Math.max(120, Math.min(600, startHeight + deltaY));
                  
                  setResizingCard(null);
                  
                  // Очищаем временную высоту
                  setTempCardHeights(prev => {
                    const updated = { ...prev };
                    delete updated[card.id];
                    return updated;
                  });
                  
                  void handleCardResize(card.id, finalHeight);
                  
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                  document.removeEventListener('mouseleave', handleMouseLeave);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
                
                // Обработчик отмены resize при покидании окна браузера
                const handleMouseLeave = () => {
                  setResizingCard(null);
                  setTempCardHeights(prev => {
                    const updated = { ...prev };
                    delete updated[card.id];
                    return updated;
                  });
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                  document.removeEventListener('mouseleave', handleMouseLeave);
                };
                
                document.addEventListener('mouseleave', handleMouseLeave);
              }}
            >
              {/* Визуальный контроллер */}
              <div className="flex items-center justify-center w-16 h-4 cursor-ns-resize">
                <div className="glass-effect border-2 border-primary/50 rounded-lg px-3 py-1 backdrop-blur-sm bg-card/80 shadow-lg group-hover/resize:bg-primary/10 group-hover/resize:border-primary/70 group-hover/resize:shadow-xl transition-all duration-200">
                  <div className="flex flex-row gap-1 items-center">
                    <div className="w-1 h-1 bg-primary rounded-full group-hover/resize:bg-primary group-hover/resize:scale-110 transition-all duration-200"></div>
                    <div className="w-1 h-1 bg-primary rounded-full group-hover/resize:bg-primary group-hover/resize:scale-110 transition-all duration-200 delay-[25ms]"></div>
                    <div className="w-1 h-1 bg-primary rounded-full group-hover/resize:bg-primary group-hover/resize:scale-110 transition-all duration-200 delay-[50ms]"></div>
                    <div className="w-1 h-1 bg-primary rounded-full group-hover/resize:bg-primary group-hover/resize:scale-110 transition-all duration-200 delay-[75ms]"></div>
                    <div className="w-1 h-1 bg-primary rounded-full group-hover/resize:bg-primary group-hover/resize:scale-110 transition-all duration-200 delay-[100ms]"></div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </Card>
        ))}
        
        {cards.length === 0 && !session?.hasStartedBrainstorm && (
          <>
            <div className="flex items-center justify-center h-full" style={{ pointerEvents: 'auto' }}>
              <div className="flex flex-col items-center">
                <Card className="p-8 text-center max-w-md glass-effect relative z-30">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
                    <PlusIcon className="w-8 h-8 text-primary" />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2 text-center">
                    Начните мозговой штурм!
                  </h3>
                  <p className="text-muted-foreground mb-6 text-center">
                    Создайте первую карточку с идеей и запустите творческий процесс
                  </p>
                  
                  <button 
                    onClick={handleCreateCard} 
                    className="btn-primary text-lg px-6 py-3 w-full"
                  >
                    Создать первую заметку
                  </button>
                  
                  <div className="mt-6 text-xs text-gray-500 text-center">
                    Подсказка: Для создания последующих карточек используйте двойной клик по пустому месту
                  </div>
                </Card>
                

              </div>
            </div>
          </>
        )}
        
        {/* Курсоры других участников */}
        {cursors.map((cursor) => (
          <Cursor
            key={cursor.id}
            x={cursor.cursor.x}
            y={cursor.cursor.y}
            name={cursor.name}
            color={cursor.color}
          />
        ))}
      </div>

      {/* Tools Panel */}
      <ToolsPanel
        isDrawingMode={isDrawingMode}
        onToggleDrawingMode={toggleDrawingMode}
        scale={scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        onUndoLastLine={undoLastLine}
        canUndoLine={canUndoLine}
        isVisible={session?.hasStartedBrainstorm || false}
      />
      </div>
      
      {/* Toast уведомления */}
      <ToastManager toasts={toasts} onRemoveToast={removeToast} />
    </UserTheme>
  );
}
