'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trash2, GripVertical, MoreVertical } from 'lucide-react'
import { TypingIndicator } from '../realtime/TypingIndicator'
import { Card } from '@/lib/types'

interface RealtimeCardProps {
  card: Card
  onUpdate: (cardId: string, updates: Partial<Card>) => Promise<void>
  onDelete: (cardId: string) => Promise<void>
  onTypingStart: (cardId: string) => void
  onTypingStop: () => void
  onDrag: (cardId: string, x: number, y: number) => void
  typingUser?: { name: string; color: string }
  isOwner: boolean
}

export function RealtimeCard({
  card,
  onUpdate,
  onDelete,
  onTypingStart,
  onTypingStop,
  onDrag,
  typingUser,
  isOwner
}: RealtimeCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(card.content)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [cardSize, setCardSize] = useState({ 
    width: 250, 
    height: Math.min(400, Math.max(180, card.height || 180))
  })
  const [hasOverflow, setHasOverflow] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Обновляем контент при изменении карточки
  useEffect(() => {
    if (!isEditing) {
      setContent(card.content)
    }
  }, [card.content, isEditing])

  // Обновляем высоту textarea при изменении размера карточки
  useEffect(() => {
    if (isEditing) {
      adjustTextareaHeight()
    }
  }, [cardSize.height, isEditing, adjustTextareaHeight])

  // Проверяем, есть ли переполнение контента
  useEffect(() => {
    if (!isEditing && contentRef.current) {
      const hasScroll = contentRef.current.scrollHeight > contentRef.current.clientHeight
      setHasOverflow(hasScroll)
    }
  }, [content, isEditing, cardSize.height])

  // Автоматическая высота textarea
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const maxHeight = cardSize.height - 80 // Учитываем заголовок и отступы
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  }, [cardSize.height])

  // Обработка изменения текста
  const handleContentChange = useCallback((value: string) => {
    setContent(value)
    adjustTextareaHeight()

    // Уведомляем о начале печати
    onTypingStart(card.id)

    // Сбрасываем таймер остановки печати
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTypingStop()
    }, 1000)
  }, [card.id, onTypingStart, onTypingStop, adjustTextareaHeight])

  // Сохранение изменений
  const handleSave = useCallback(async () => {
    if (content !== card.content) {
      try {
        await onUpdate(card.id, { content })
      } catch (error) {
        console.error('Ошибка сохранения карточки:', error)
        setContent(card.content) // Откатываем изменения
      }
    }
    setIsEditing(false)
    onTypingStop()
  }, [content, card.content, card.id, onUpdate, onTypingStop])

  // Отмена редактирования
  const handleCancel = useCallback(() => {
    setContent(card.content)
    setIsEditing(false)
    onTypingStop()
  }, [card.content, onTypingStop])

  // Обработка клавиш
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }, [handleSave, handleCancel])

  // Обработка удаления
  const handleDelete = useCallback(async () => {
    if (confirm('Удалить карточку?')) {
      try {
        await onDelete(card.id)
      } catch (error) {
        console.error('Ошибка удаления карточки:', error)
      }
    }
  }, [card.id, onDelete])

  // Обработка перетаскивания
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Проверяем, не нажат ли resize контроллер
    if ((e.target as HTMLElement).closest('.resize-handle')) {
      return
    }

    if (e.target !== e.currentTarget && !(e.target as HTMLElement).closest('.drag-handle')) {
      return
    }

    e.preventDefault()
    setIsDragging(true)
    
    const rect = cardRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return

    const x = e.clientX - dragOffset.x
    const y = e.clientY - dragOffset.y

    // Обновляем позицию для других пользователей
    onDrag(card.id, x, y)

    // Обновляем позицию локально
    if (cardRef.current) {
      cardRef.current.style.left = `${x}px`
      cardRef.current.style.top = `${y}px`
    }
  }, [isDragging, dragOffset, card.id, onDrag])

  const handleMouseUp = useCallback(async () => {
    if (!isDragging) return

    setIsDragging(false)

    // Сохраняем финальную позицию в базе данных
    const rect = cardRef.current?.getBoundingClientRect()
    if (rect) {
      try {
        await onUpdate(card.id, {
          position_x: rect.left,
          position_y: rect.top
        })
      } catch (error) {
        console.error('Ошибка сохранения позиции:', error)
      }
    }
  }, [isDragging, card.id, onUpdate])

  // Обработка изменения размера
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
  }, [])

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const newWidth = Math.max(200, Math.min(400, e.clientX - rect.left))
    const newHeight = Math.max(120, Math.min(400, e.clientY - rect.top))

    setCardSize({ width: newWidth, height: newHeight })
  }, [isResizing])

  const handleResizeEnd = useCallback(async () => {
    if (!isResizing) return

    setIsResizing(false)

    // Сохраняем новую высоту в базе данных
    try {
      await onUpdate(card.id, { height: cardSize.height })
    } catch (error) {
      console.error('Ошибка сохранения размера:', error)
    }
  }, [isResizing, card.id, cardSize.height, onUpdate])

  // Подписка на события мыши для перетаскивания и изменения размера
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeEnd)
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove)
        document.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [isResizing, handleResizeMove, handleResizeEnd])

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return (
    <motion.div
      ref={cardRef}
      className={`absolute bg-yellow-100 border-2 border-yellow-300 rounded-lg shadow-md cursor-pointer group flex flex-col ${
        isDragging ? 'z-50 shadow-xl scale-105' : 'z-10'
      } ${isResizing ? 'select-none' : ''}`}
      style={{
        left: card.position_x,
        top: card.position_y,
        width: `${cardSize.width}px`,
        height: `${cardSize.height}px`
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      whileHover={{ scale: 1.02 }}
      onMouseDown={handleMouseDown}
    >
      {/* Заголовок карточки - фиксированный */}
      <div className="flex items-center justify-between p-2 border-b border-yellow-300 bg-yellow-200 rounded-t-md flex-shrink-0">
        <div className="drag-handle cursor-move flex items-center gap-1 text-yellow-700">
          <GripVertical className="w-4 h-4" />
          <span className="text-xs font-medium">
            {new Date(card.created_at).toLocaleTimeString()}
          </span>
        </div>
        
        {isOwner && (
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-yellow-300 rounded"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        )}
      </div>

      {/* Контент карточки - с прокруткой */}
      <div className="p-3 relative flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {/* Индикатор печати */}
        {typingUser && (
          <TypingIndicator name={typingUser.name} color={typingUser.color} />
        )}

        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="w-full bg-transparent border-none outline-none resize-none text-gray-800 placeholder-gray-500 overflow-y-auto"
            placeholder="Введите текст..."
            autoFocus
            rows={1}
            style={{ maxHeight: `${cardSize.height - 80}px` }}
          />
        ) : (
          <div
            ref={contentRef}
            onClick={() => setIsEditing(true)}
            className="text-gray-800 whitespace-pre-wrap cursor-text min-h-[20px] break-words overflow-hidden"
            style={{ wordBreak: 'break-word' }}
          >
            {content || 'Нажмите для редактирования...'}
          </div>
        )}

        {/* Индикатор скрытого текста */}
        {!isEditing && hasOverflow && (
          <div className="absolute bottom-1 right-1 text-yellow-600 pointer-events-none">
            <MoreVertical className="w-4 h-4" />
          </div>
        )}

        {/* Подсказки при редактировании - с фиксированной позицией */}
        {isEditing && (
          <div className="sticky bottom-0 right-0 text-xs text-gray-500 text-right mt-2 bg-yellow-100 pt-1">
            Ctrl+Enter - сохранить, Esc - отмена
          </div>
        )}
      </div>

      {/* Resize контроллер - фиксированный снизу */}
      <div 
        className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize group-hover:opacity-100 opacity-0 transition-opacity"
        onMouseDown={handleResizeStart}
      >
        <svg className="w-full h-full text-yellow-600 pointer-events-none" viewBox="0 0 16 16">
          <path fill="currentColor" d="M14 14H12V16H14V14Z M10 14H8V16H10V14Z M14 10H12V12H14V10Z" />
        </svg>
      </div>

      {/* Индикатор перетаскивания */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg pointer-events-none" />
      )}
    </motion.div>
  )
}
