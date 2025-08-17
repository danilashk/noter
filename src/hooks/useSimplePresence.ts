import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface CursorData {
  id: string
  name: string
  color: string
  x: number
  y: number
  timestamp: number
}

export function useSimplePresence(sessionId: string, currentUser: any) {
  const [cursors, setCursors] = useState<CursorData[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const throttleTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!sessionId || !currentUser) return

    const presenceChannel = supabase.channel(`cursors:${sessionId}`)
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannel.presenceState()
        const activeCursors: CursorData[] = []

        Object.keys(presenceState).forEach(key => {
          const cursor = presenceState[key][0] as CursorData
          // Не показываем свой собственный курсор
          if (cursor.id !== currentUser.id) {
            activeCursors.push(cursor)
          }
        })

        setCursors(activeCursors)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Cursor joined:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Cursor left:', leftPresences)
      })
      .subscribe()

    setChannel(presenceChannel)

    return () => {
      if (throttleTimeout.current) {
        clearTimeout(throttleTimeout.current)
      }
      presenceChannel.unsubscribe()
    }
  }, [sessionId, currentUser])

  const updateCursor = useCallback((clientX: number, clientY: number) => {
    if (!channel || !currentUser) return

    // Очищаем предыдущий timeout
    if (throttleTimeout.current) {
      clearTimeout(throttleTimeout.current)
    }

    // Устанавливаем новый timeout
    throttleTimeout.current = setTimeout(() => {
      const cursorData: CursorData = {
        id: currentUser.id,
        name: currentUser.name,
        color: currentUser.color,
        x: clientX,
        y: clientY,
        timestamp: Date.now()
      }

      channel.track(cursorData)
    }, 50) // Throttle до 50ms
  }, [channel, currentUser])

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
    cursors,
    startTracking,
    updateCursor
  }
}