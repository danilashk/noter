import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Participant } from '../lib/types/board'

interface CursorPosition {
  x: number
  y: number
  timestamp: number
}

interface CursorData extends Participant {
  cursor: CursorPosition
}

export function useCursorBroadcast(sessionId: string, currentParticipant: Participant | null) {
  const [cursors, setCursors] = useState<Record<string, CursorData>>({})
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const lastSentPosition = useRef<CursorPosition | null>(null)
  const throttleTimeout = useRef<NodeJS.Timeout | null>(null)

  // Optimized throttled функция для отправки позиции курсора
  const throttledSendCursor = useCallback((x: number, y: number) => {
    if (!channel || !currentParticipant) return

    const position: CursorPosition = {
      x,
      y,
      timestamp: Date.now()
    }

    // Проверяем, изменилась ли позиция достаточно сильно
    if (lastSentPosition.current) {
      const dx = Math.abs(x - lastSentPosition.current.x)
      const dy = Math.abs(y - lastSentPosition.current.y)
      
      // Минимальное расстояние для отправки - 1 пиксель (более точное отслеживание)
      if (dx < 1 && dy < 1) return
    }

    // Очищаем предыдущий timeout
    if (throttleTimeout.current) {
      clearTimeout(throttleTimeout.current)
    }

    // Устанавливаем новый timeout с оптимизированным интервалом
    throttleTimeout.current = setTimeout(() => {
      const cursorData: CursorData = {
        ...currentParticipant,
        cursor: position
      }

      // Используем broadcast вместо track для лучшей производительности
      channel.send({
        type: 'broadcast',
        event: 'cursor_move',
        payload: cursorData
      })
      
      lastSentPosition.current = position
    }, 8) // 8ms = ~120 FPS максимум
  }, [channel, currentParticipant])

  useEffect(() => {
    if (!sessionId || !currentParticipant) return

    // Используем отдельный канал для cursor broadcast
    const cursorChannel = supabase.channel(`cursor-broadcast:${sessionId}`, {
      config: {
        // Оптимизированные настройки для cursor broadcast
        presence: {
          key: currentParticipant.id
        },
        broadcast: {
          self: false, // Не получаем собственные broadcast сообщения
          ack: false   // Не ждем подтверждения для скорости
        }
      }
    })
      .on('broadcast', { event: 'cursor_move' }, ({ payload }) => {
        const cursorData = payload as CursorData
        
        // Не показываем свой собственный курсор
        if (cursorData && cursorData.id !== currentParticipant.id) {
          setCursors(prev => ({
            ...prev,
            [cursorData.id]: cursorData
          }))
        }
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('Cursor participant joined:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('Cursor participant left:', leftPresences)
        setCursors(prev => {
          const updated = { ...prev }
          leftPresences.forEach((presence: any) => {
            if (presence.id) {
              delete updated[presence.id]
            }
          })
          return updated
        })
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Отправляем presence только для отслеживания подключения/отключения
          cursorChannel.track({
            id: currentParticipant.id,
            name: currentParticipant.name,
            color: currentParticipant.color,
            online_at: new Date().toISOString()
          })
        }
      })

    setChannel(cursorChannel)

    return () => {
      if (throttleTimeout.current) {
        clearTimeout(throttleTimeout.current)
      }
      cursorChannel.unsubscribe()
    }
  }, [sessionId, currentParticipant])

  // Функция для обновления позиции курсора с RAF оптимизацией
  const updateCursor = useCallback((clientX: number, clientY: number) => {
    // Используем requestAnimationFrame для плавности
    requestAnimationFrame(() => {
      throttledSendCursor(clientX, clientY)
    })
  }, [throttledSendCursor])

  // Функция для регистрации mouse move listener с passive событиями
  const startTracking = useCallback(() => {
    const handleMouseMove = (e: MouseEvent) => {
      updateCursor(e.clientX, e.clientY)
    }

    // Используем passive listener для лучшей производительности
    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [updateCursor])

  return {
    cursors: Object.values(cursors),
    startTracking,
    updateCursor
  }
}