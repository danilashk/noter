'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Trash2, GripVertical } from 'lucide-react'
import { Card } from '@/lib/types'

interface SimpleCardProps {
  card: Card
  onUpdate: (cardId: string, updates: Partial<Card>) => Promise<void>
  onDelete: (cardId: string) => Promise<void>
  onTypingStart: (cardId: string) => void
  onTypingStop: () => void
  onDrag: (cardId: string, x: number, y: number) => void
  typingUser?: { name: string; color: string }
  isOwner: boolean
}

export function SimpleCard({
  card,
  onUpdate,
  onDelete,
  onTypingStart,
  onTypingStop,
  onDrag,
  typingUser,
  isOwner
}: SimpleCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(card.content)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Обновляем контент при изменении карточки
  useEffect(() => {
    if (!isEditing) {
      setContent(card.content)
    }
  }, [card.content, isEditing])

  // Автоматическая высота textarea
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [])

  // Обработка изменения текста
  const handleContentChange = useCallback((value: string) => {
    setContent(value)
    adjustTextareaHeight()

    onTypingStart(card.id)

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
        setContent(card.content)
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

    onDrag(card.id, x, y)

    if (cardRef.current) {
      cardRef.current.style.left = `${x}px`
      cardRef.current.style.top = `${y}px`
    }
  }, [isDragging, dragOffset, card.id, onDrag])

  const handleMouseUp = useCallback(async () => {
    if (!isDragging) return

    setIsDragging(false)

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

  // Подписка на события мыши для перетаскивания
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

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={cardRef}
      className={`absolute bg-yellow-100 border-2 border-yellow-300 rounded-lg shadow-md min-w-[200px] min-h-[120px] cursor-pointer group transition-all duration-200 ${
        isDragging ? 'z-50 shadow-xl scale-105' : 'z-10'
      } ${isEditing ? 'ring-2 ring-blue-400' : ''}`}
      style={{
        left: card.position_x,
        top: card.position_y
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Заголовок карточки */}
      <div className="flex items-center justify-between p-2 border-b border-yellow-300 bg-yellow-200 rounded-t-md">
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

      {/* Контент карточки */}
      <div className="p-3 relative">
        {/* Индикатор печати */}
        {typingUser && (
          <div className="absolute -top-8 left-2 z-10">
            <div
              className="px-2 py-1 rounded-md text-xs text-white font-medium flex items-center gap-1 shadow-sm"
              style={{ backgroundColor: typingUser.color }}
            >
              <span>{typingUser.name} печатает</span>
              <div className="flex gap-0.5">
                <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                <div className="w-1 h-1 bg-white rounded-full animate-pulse delay-75" />
                <div className="w-1 h-1 bg-white rounded-full animate-pulse delay-150" />
              </div>
            </div>
            <div 
              className="absolute top-full left-3 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent"
              style={{ borderTopColor: typingUser.color }}
            />
          </div>
        )}

        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="w-full bg-transparent border-none outline-none resize-none text-gray-800 placeholder-gray-500"
            placeholder="Введите текст..."
            autoFocus
            rows={1}
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="text-gray-800 whitespace-pre-wrap cursor-text min-h-[20px]"
          >
            {content || 'Нажмите для редактирования...'}
          </div>
        )}

        {/* Подсказки при редактировании */}
        {isEditing && (
          <div className="absolute bottom-1 right-1 text-xs text-gray-500">
            Ctrl+Enter - сохранить, Esc - отмена
          </div>
        )}
      </div>

      {/* Индикатор перетаскивания */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg pointer-events-none" />
      )}
    </div>
  )
}