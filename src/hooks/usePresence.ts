import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Participant } from './useParticipants'

interface CursorPosition {
  x: number
  y: number
  timestamp: number
}

interface ParticipantCursor extends Participant {
  cursor: CursorPosition
}

export function usePresence(sessionId: string, currentParticipant: Participant | null) {
  const [cursors, setCursors] = useState<Record<string, ParticipantCursor>>({})
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const lastSentPosition = useRef<CursorPosition | null>(null)
  const throttleTimeout = useRef<NodeJS.Timeout | null>(null)

  // Throttled функция для отправки позиции курсора
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
      
      // Если курсор сдвинулся меньше чем на 2 пикселя, не отправляем
      if (dx < 2 && dy < 2) return
    }

    // Очищаем предыдущий timeout
    if (throttleTimeout.current) {
      clearTimeout(throttleTimeout.current)
    }

    // Устанавливаем новый timeout
    throttleTimeout.current = setTimeout(() => {
      const participantWithCursor: ParticipantCursor = {
        ...currentParticipant,
        cursor: position
      }

      channel.track(participantWithCursor)
      lastSentPosition.current = position
    }, 16) // Throttle до 16ms (60 FPS)
  }, [channel, currentParticipant])

  useEffect(() => {
    if (!sessionId || !currentParticipant) return

    const presenceChannel = supabase.channel(`cursors:${sessionId}`)
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannel.presenceState()
        const activeCursors: Record<string, ParticipantCursor> = {}

        Object.keys(presenceState).forEach(key => {
          const participant = presenceState[key][0] as ParticipantCursor
          // Не показываем свой собственный курсор
          if (participant.id !== currentParticipant.id) {
            activeCursors[participant.id] = participant
          }
        })

        setCursors(activeCursors)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setCursors(prev => {
          const updated = { ...prev }
          leftPresences.forEach((participant: ParticipantCursor) => {
            delete updated[participant.id]
          })
          return updated
        })
      })
      .subscribe()

    setChannel(presenceChannel)

    return () => {
      if (throttleTimeout.current) {
        clearTimeout(throttleTimeout.current)
      }
      presenceChannel.unsubscribe()
    }
  }, [sessionId, currentParticipant])

  // Функция для обновления позиции курсора
  const updateCursor = useCallback((clientX: number, clientY: number) => {
    throttledSendCursor(clientX, clientY)
  }, [throttledSendCursor])

  // Функция для регистрации mouse move listener
  const startTracking = useCallback(() => {
    const handleMouseMove = (e: MouseEvent) => {
      updateCursor(e.clientX, e.clientY)
    }

    document.addEventListener('mousemove', handleMouseMove)
    
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