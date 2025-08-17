import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Card, PresenceData } from '@/lib/types'

interface UseRealtimeSyncOptions {
  sessionId: string
  userId: string
  userName: string
  userColor: string
}

export function useRealtimeSync({ sessionId, userId, userName, userColor }: UseRealtimeSyncOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [cards, setCards] = useState<Card[]>([])
  const [presenceUsers, setPresenceUsers] = useState<Record<string, any>>({})
  const [cursors, setCursors] = useState<Record<string, { x: number; y: number; name: string; color: string }>>({})
  const [typingStatus, setTypingStatus] = useState<Record<string, { cardId: string; name: string; color: string }>>({})
  
  const channelRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const cursorThrottleRef = useRef<NodeJS.Timeout | null>(null)

  // Функция переподключения с экспоненциальной задержкой
  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Переподключение... Попытка ${reconnectAttempts + 1}`)
      setReconnectAttempts(prev => prev + 1)
      
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
      
      setupChannel()
    }, delay)
  }, [reconnectAttempts])

  // Настройка канала realtime
  const setupChannel = useCallback(() => {
    if (!sessionId) return

    const channel = supabase.channel(`session:${sessionId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: userId }
      }
    })

    channelRef.current = channel

    // Подписка на изменения карточек в БД
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'cards',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        const newCard = payload.new as Card
        console.log('Card created:', newCard)
        setCards(prev => [...prev.filter(c => c.id !== newCard.id), newCard])
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'cards',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        const updatedCard = payload.new as Card
        console.log('Card updated:', updatedCard)
        setCards(prev => prev.map(card => 
          card.id === updatedCard.id ? updatedCard : card
        ))
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'cards',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        const deletedCard = payload.old as Card
        console.log('Card deleted:', deletedCard)
        setCards(prev => prev.filter(card => card.id !== deletedCard.id))
      })

      // Подписка на presence события
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState()
        console.log('Presence sync:', presenceState)
        setPresenceUsers(presenceState)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
        setPresenceUsers(channel.presenceState())
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
        setPresenceUsers(channel.presenceState())
        
        // Удаляем курсор и статус печати ушедшего пользователя
        setCursors(prev => {
          const updated = { ...prev }
          delete updated[key]
          return updated
        })
        setTypingStatus(prev => {
          const updated = { ...prev }
          delete updated[key]
          return updated
        })
      })

      // Подписка на broadcast события
      .on('broadcast', { event: 'cursor_move' }, ({ payload }) => {
        const { userId: senderId, x, y, name, color } = payload
        if (senderId !== userId) {
          setCursors(prev => ({
            ...prev,
            [senderId]: { x, y, name, color }
          }))
        }
      })
      .on('broadcast', { event: 'typing_start' }, ({ payload }) => {
        const { userId: senderId, cardId, name, color } = payload
        if (senderId !== userId) {
          setTypingStatus(prev => ({
            ...prev,
            [senderId]: { cardId, name, color }
          }))
        }
      })
      .on('broadcast', { event: 'typing_stop' }, ({ payload }) => {
        const { userId: senderId } = payload
        if (senderId !== userId) {
          setTypingStatus(prev => {
            const updated = { ...prev }
            delete updated[senderId]
            return updated
          })
        }
      })
      .on('broadcast', { event: 'card_drag' }, ({ payload }) => {
        const { cardId, x, y, userId: senderId } = payload
        if (senderId !== userId) {
          // Временно обновляем позицию карточки для плавности
          setCards(prev => prev.map(card => 
            card.id === cardId 
              ? { ...card, position_x: x, position_y: y }
              : card
          ))
        }
      })

    // Подключение к каналу
    channel.subscribe((status) => {
      console.log('Channel status:', status)
      
      if (status === 'SUBSCRIBED') {
        setIsConnected(true)
        setConnectionError(null)
        setReconnectAttempts(0)
        
        // Отправляем информацию о присутствии
        channel.track({
          userId,
          name: userName,
          color: userColor,
          joinedAt: new Date().toISOString()
        })
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) {
        setIsConnected(false)
        setConnectionError(`Проблема соединения: ${status}`)
        reconnect()
      }
    })

  }, [sessionId, userId, userName, userColor, reconnect])

  // Загрузка существующих карточек при подключении
  const loadCards = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setCards(data || [])
    } catch (error) {
      console.error('Ошибка загрузки карточек:', error)
    }
  }, [sessionId])

  useEffect(() => {
    setupChannel()
    loadCards()

    return () => {
      if (channelRef.current) {
        channelRef.current.untrack()
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (cursorThrottleRef.current) {
        clearTimeout(cursorThrottleRef.current)
      }
    }
  }, [setupChannel, loadCards])

  // API для взаимодействия с карточками
  const createCard = useCallback(async (content: string, x: number, y: number) => {
    try {
      const { data, error } = await supabase
        .from('cards')
        .insert({
          session_id: sessionId,
          content,
          position_x: x,
          position_y: y,
          created_by: userId
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Ошибка создания карточки:', error)
      throw error
    }
  }, [sessionId, userId])

  const updateCard = useCallback(async (cardId: string, updates: Partial<Card>) => {
    try {
      const { data, error } = await supabase
        .from('cards')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', cardId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Ошибка обновления карточки:', error)
      throw error
    }
  }, [])

  const deleteCard = useCallback(async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId)

      if (error) throw error
    } catch (error) {
      console.error('Ошибка удаления карточки:', error)
      throw error
    }
  }, [])

  // Broadcast API
  const broadcastCursor = useCallback((x: number, y: number) => {
    if (cursorThrottleRef.current) {
      clearTimeout(cursorThrottleRef.current)
    }

    cursorThrottleRef.current = setTimeout(() => {
      if (channelRef.current && isConnected) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'cursor_move',
          payload: { userId, x, y, name: userName, color: userColor }
        })
      }
    }, 16) // ~60fps
  }, [userId, userName, userColor, isConnected])

  const broadcastTypingStart = useCallback((cardId: string) => {
    if (channelRef.current && isConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing_start',
        payload: { userId, cardId, name: userName, color: userColor }
      })
    }
  }, [userId, userName, userColor, isConnected])

  const broadcastTypingStop = useCallback(() => {
    if (channelRef.current && isConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing_stop',
        payload: { userId }
      })
    }
  }, [userId, isConnected])

  const broadcastCardDrag = useCallback((cardId: string, x: number, y: number) => {
    if (channelRef.current && isConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'card_drag',
        payload: { cardId, x, y, userId }
      })
    }
  }, [userId, isConnected])

  return {
    // Состояние подключения
    isConnected,
    connectionError,
    reconnectAttempts,

    // Данные
    cards,
    presenceUsers,
    cursors,
    typingStatus,

    // API для карточек
    createCard,
    updateCard,
    deleteCard,

    // Broadcast API
    broadcastCursor,
    broadcastTypingStart,
    broadcastTypingStop,
    broadcastCardDrag
  }
}