'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Plus, Settings, Share2, Wifi, WifiOff } from 'lucide-react'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { SimpleCard } from '@/components/realtime/SimpleCard'
import { SimpleCursor } from '@/components/realtime/SimpleCursor'
import { SimplePresence } from '@/components/realtime/SimplePresence'

interface SimpleBoardPageProps {
  sessionId: string
  userId: string
  userName: string
  userColor: string
}

export function SimpleBoardPage({ sessionId, userId, userName, userColor }: SimpleBoardPageProps) {
  const [showAddButton, setShowAddButton] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const boardRef = useRef<HTMLDivElement>(null)

  // Realtime синхронизация
  const {
    isConnected,
    connectionError,
    reconnectAttempts,
    cards,
    presenceUsers,
    cursors,
    typingStatus,
    createCard,
    updateCard,
    deleteCard,
    broadcastCursor,
    broadcastTypingStart,
    broadcastTypingStop,
    broadcastCardDrag
  } = useRealtimeSync({
    sessionId,
    userId,
    userName,
    userColor
  })

  // Обработка движения мыши
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = boardRef.current?.getBoundingClientRect()
    if (rect) {
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setMousePosition({ x, y })
      broadcastCursor(e.clientX, e.clientY) // Глобальные координаты для курсоров
    }
  }, [broadcastCursor])

  // Обработка клика по доске
  const handleBoardClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.board-background')) {
      setShowAddButton(true)
    } else {
      setShowAddButton(false)
    }
  }, [])

  // Создание новой карточки
  const handleCreateCard = useCallback(async () => {
    if (!showAddButton) return

    try {
      await createCard(
        'Новая карточка',
        mousePosition.x - 100,
        mousePosition.y - 60
      )
      setShowAddButton(false)
    } catch (error) {
      console.error('Ошибка создания карточки:', error)
    }
  }, [createCard, mousePosition, showAddButton])

  // Обработка горячих клавиш
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddButton(false)
        broadcastTypingStop()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [broadcastTypingStop])

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden relative">
      {/* Заголовок */}
      <header className="absolute top-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900">
              Realtime Сессия: {sessionId.slice(0, 8)}...
            </h1>
            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
              isConnected 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isConnected ? 'В сети' : 'Не подключен'}
              {reconnectAttempts > 0 && ` (попытка ${reconnectAttempts})`}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Share2 className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Основная доска */}
      <div
        ref={boardRef}
        className="absolute inset-0 pt-16 board-background"
        onMouseMove={handleMouseMove}
        onClick={handleBoardClick}
        style={{ cursor: showAddButton ? 'pointer' : 'default' }}
      >
        {/* Сетка */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />

        {/* Карточки */}
        {cards.map((card) => {
          const typingUser = Object.values(typingStatus).find(
            status => status.cardId === card.id
          )
          
          return (
            <SimpleCard
              key={card.id}
              card={card}
              onUpdate={updateCard}
              onDelete={deleteCard}
              onTypingStart={broadcastTypingStart}
              onTypingStop={broadcastTypingStop}
              onDrag={broadcastCardDrag}
              typingUser={typingUser}
              isOwner={card.created_by === userId}
            />
          )
        })}

        {/* Кнопка добавления карточки */}
        {showAddButton && (
          <button
            onClick={handleCreateCard}
            className="absolute z-20 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg transition-colors transform hover:scale-105"
            style={{
              left: mousePosition.x - 24,
              top: mousePosition.y - 24
            }}
          >
            <Plus className="w-6 h-6" />
          </button>
        )}

        {/* Курсоры других пользователей */}
        {Object.entries(cursors).map(([userId, cursor]) => (
          <SimpleCursor
            key={userId}
            x={cursor.x}
            y={cursor.y}
            name={cursor.name}
            color={cursor.color}
          />
        ))}
      </div>

      {/* Индикатор присутствия */}
      <SimplePresence users={presenceUsers} currentUserId={userId} />

      {/* Статус подключения (показываем только при проблемах) */}
      {!isConnected && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className="bg-white rounded-lg shadow-lg border border-red-200 p-3 flex items-center gap-3 max-w-sm">
            <WifiOff className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">
                {reconnectAttempts > 0 ? 'Переподключение...' : 'Соединение потеряно'}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {connectionError || 'Проверьте интернет-соединение'}
              </div>
              {reconnectAttempts > 0 && (
                <div className="text-xs text-orange-600 mt-1">
                  Попытка {reconnectAttempts}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Подсказки */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-gray-600 shadow-sm">
          Нажмите в любом месте доски, чтобы добавить карточку • {cards.length} карточек • {Object.keys(presenceUsers).length + 1} участников
        </div>
      </div>
    </div>
  )
}