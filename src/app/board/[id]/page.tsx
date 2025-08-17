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
  TrashIcon
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

  // Обрабатываем params и обновляем sessionId
  React.useEffect(() => {
    const id = params.id as string;
    
    if (!id) {
      return;
    }
    
    if (id === 'new' && !hasRedirected) {
      const newId = crypto.randomUUID();
      setSessionId(newId);
      setHasRedirected(true);
      // Используем Next.js router для правильной навигации
      router.replace(`/board/${newId}`);
    } else if (id !== 'new' && id !== sessionId) {
      setSessionId(id);
    }
  }, [params.id, router, hasRedirected, sessionId]);

  // Включаем все хуки
  const { session, loading: sessionLoading, error: sessionError } = useSession(sessionId);
  const { activeParticipants, currentParticipant, loading: participantsLoading, error: participantsError, isRestoring, joinSession, leaveSession } = useParticipants(sessionId);
  const { cards, loading: cardsLoading, error: cardsError, isRealtimeConnected, createCard, updateCard, deleteCard, updateCardPosition } = useCardsWithRealtime(sessionId, currentParticipant?.id || null);
  
  // Оптимизированный realtime broadcast для курсоров
  const { cursors, startTracking } = useCursorBroadcast(sessionId, currentParticipant);
  
  // Drawing functionality
  const { lines: drawingLines, createLine } = useDrawingWithRealtime(sessionId, currentParticipant?.id || null);
  
  // Card selections functionality
  const { selectCard: selectCardRealtime, deselectCard: deselectCardRealtime, getParticipantBySelectedCard } = useCardSelectionsWithRealtime(sessionId, currentParticipant?.id || null);
  
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
      content: 'Новая заметка',
      position: { 
        x: centerX - 128 + Math.random() * 100 - 50, // 128 = половина ширины карточки (256px)
        y: centerY - 100 + Math.random() * 100 - 50
      },
      createdBy: currentParticipant?.id || null
    });
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

  // Запускаем отслеживание курсора при появлении участника
  React.useEffect(() => {
    if (currentParticipant) {
      const cleanup = startTracking();
      return cleanup;
    }
  }, [currentParticipant, startTracking]);

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

  if (sessionError || cardsError || participantsError) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Card className="p-8 glass-effect border-destructive">
          <div className="text-center">
            <p className="text-destructive">Ошибка: {sessionError || cardsError || participantsError}</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!currentParticipant && !isRestoring) {
    return <ParticipantDialog isOpen={true} onJoin={handleJoinSession} sessionTitle={session?.title} />;
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
            content: 'Новая заметка',
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
      <div className="absolute top-0 left-0 right-0 glass-effect border-b border-border/20 p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-foreground">
                {session?.title || 'Live Brainstorm'}
              </h1>
              
              {/* Progress ring for session */}
              <div className="relative w-8 h-8">
                <svg className="w-8 h-8 transform -rotate-90">
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="hsl(var(--border))"
                    strokeWidth="2"
                    fill="transparent"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    fill="transparent"
                    strokeDasharray={`${(cards.length * 10) % 88} 88`}
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                  {cards.length}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Меню с остальными действиями */}
            <BoardMenu 
              sessionId={sessionId}
              isRealtimeConnected={isRealtimeConnected}
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
              onLeave={() => {
                leaveSession().then(() => {
                  router.push('/');
                }).catch(() => {
                  // Error handling
                });
              }}
            />
          </div>
        </div>
        
        {/* Participants */}
        <div className="flex items-center gap-2 mt-3">
          {activeParticipants.map((participant) => (
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
              {participant.id === currentParticipant?.id && (
                <span className="text-xs opacity-60">(Вы)</span>
              )}
            </Badge>
          ))}
        </div>
      </div>

      {/* Board Area */}
      <div 
        className="absolute inset-0 pt-32 p-4"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
          transformOrigin: '0 0',
          zIndex: 10, // Заметки всегда поверх канваса
          pointerEvents: cards.length === 0 ? 'auto' : 'none', // Позволяет взаимодействие только когда нет карточек
        }}
      >
        {cards.map((card) => (
          <Card
            key={card.id}
            className="absolute w-64 p-4 idea-card cursor-move group glass-effect animate-float-up transition-all duration-300 relative overflow-hidden"
            style={{
              left: card.position.x,
              top: card.position.y,
              pointerEvents: isDrawingMode ? 'none' : 'auto',
              zIndex: (selectedCard === card.id || getParticipantBySelectedCard(card.id)) ? 20 : 15,
            }}
            onClick={() => {
              setSelectedCard(card.id);
              selectCardRealtime(card.id);
            }}
            onMouseDown={(e) => {
              if (isDrawingMode) return;
              
              const rect = e.currentTarget.getBoundingClientRect();
              const startX = (e.clientX - panX) / scale - card.position.x;
              const startY = (e.clientY - panY) / scale - card.position.y;
              
              const handleMouseMove = (e: MouseEvent) => {
                const newX = (e.clientX - panX) / scale - startX;
                const newY = (e.clientY - panY) / scale - startY;
                void handleCardMove(card.id, newX, newY);
              };
              
              const handleMouseUp = () => {
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
                    : 'transparent',
                borderRight: selectedCard === card.id 
                  ? `2px solid ${currentParticipant?.color || 'hsl(var(--primary))'}`
                  : getParticipantBySelectedCard(card.id)
                    ? `2px solid ${activeParticipants.find(p => p.id === getParticipantBySelectedCard(card.id))?.color || 'hsl(var(--primary))'}`
                    : 'transparent',
                borderBottom: selectedCard === card.id 
                  ? `2px solid ${currentParticipant?.color || 'hsl(var(--primary))'}`
                  : getParticipantBySelectedCard(card.id)
                    ? `2px solid ${activeParticipants.find(p => p.id === getParticipantBySelectedCard(card.id))?.color || 'hsl(var(--primary))'}`
                    : 'transparent',
                borderLeft: `4px solid ${currentParticipant?.color || 'hsl(var(--primary))'}`,
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
                      className="w-full h-[60px] resize-none border-none p-0 focus:ring-0 bg-transparent leading-relaxed"
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
                    <p 
                      className="cursor-text leading-relaxed w-full min-h-[60px] flex items-start py-0"
                      onClick={() => setEditingCard(card.id)}
                    >
                      {card.content}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-end">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardDelete(card.id);
                      }}
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
        
        {cards.length === 0 && (
          <div className="flex items-center justify-center h-full" style={{ pointerEvents: 'auto' }}>
            <Card className="p-8 text-center max-w-md glass-effect relative z-30">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
                <PlusIcon className="w-8 h-8 text-primary" />
              </div>
              
              <h3 className="text-xl font-semibold mb-2">
                Начните мозговой штурм!
              </h3>
              <p className="text-muted-foreground mb-6">
                Создайте первую карточку с идеей и запустите творческий процесс
              </p>
              
              <button 
                onClick={handleCreateCard} 
                className="btn-primary inline-flex items-center gap-2 text-lg px-6 py-3"
              >
                <PlusIcon className="w-5 h-5" />
                Создать первую заметку
              </button>
              
              <div className="mt-6 text-xs text-muted-foreground/70">
                Совет: Перетаскивайте карточки для изменения их положения
              </div>
            </Card>
          </div>
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
      />
      </div>
    </UserTheme>
  );
}
