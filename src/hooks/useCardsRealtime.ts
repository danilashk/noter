/**
 * Hook для управления карточками с realtime синхронизацией
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { realtimeManager } from '@/lib/realtime'
import type { Card } from '@/lib/types'
import { debounce } from '@/lib/utils/debounce'

export interface CreateCardData {
  session_id: string
  content: string
  position_x: number
  position_y: number
  created_by: string
}

export interface UpdateCardData {
  content?: string
  position_x?: number
  position_y?: number
}

export interface UseCardsReturn {
  cards: Card[]
  loading: boolean
  error: string | null
  createCard: (data: CreateCardData) => Promise<void>
  updateCard: (id: string, data: UpdateCardData) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  updatePosition: (id: string, x: number, y: number) => void
  isOnline: boolean
  syncStatus: 'connected' | 'connecting' | 'disconnected'
}

export function useCards(sessionId: string): UseCardsReturn {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting')
  
  // Для оптимистичных обновлений
  const optimisticUpdates = useRef<Map<string, Card>>(new Map())
  
  // Для batching позиций
  const positionUpdates = useRef<Map<string, { x: number; y: number }>>(new Map())
  
  // Debounced функция для обновления позиций
  const debouncedPositionUpdate = useCallback(
    debounce(async () => {
      const updates = Array.from(positionUpdates.current.entries()).map(([id, pos]) => ({
        id,
        position_x: pos.x,
        position_y: pos.y
      }))
      
      if (updates.length === 0) return
      
      positionUpdates.current.clear()
      
      try {
        const promises = updates.map(update => 
          supabase
            .from('cards')
            .update({
              position_x: update.position_x,
              position_y: update.position_y,
              updated_at: new Date().toISOString()
            })
            .eq('id', update.id)
        )
        
        await Promise.all(promises)
      } catch (err) {
        console.error('[useCards] Error updating positions:', err)
        setError('Ошибка синхронизации позиций')
      }
    }, 500),
    []
  )

  // Загрузка карточек при монтировании
  const loadCards = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('cards')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (fetchError) {
        throw new Error(`Ошибка загрузки карточек: ${fetchError.message}`)
      }

      setCards(data || [])
      setSyncStatus('connected')
    } catch (err) {
      console.error('[useCards] Error loading cards:', err)
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
      setSyncStatus('disconnected')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  // Обработчик realtime изменений
  const handleRealtimeChange = useCallback((payload: any) => {
    const { eventType, new: newCard, old: oldCard } = payload
    
    setCards(currentCards => {
      switch (eventType) {
        case 'INSERT':
          if (newCard && !currentCards.find(c => c.id === newCard.id)) {
            return [...currentCards, newCard]
          }
          return currentCards
          
        case 'UPDATE':
          if (newCard) {
            return currentCards.map(card => 
              card.id === newCard.id ? newCard : card
            )
          }
          return currentCards
          
        case 'DELETE':
          if (oldCard) {
            return currentCards.filter(card => card.id !== oldCard.id)
          }
          return currentCards
          
        default:
          return currentCards
      }
    })
  }, [])

  // Подписка на realtime изменения
  useEffect(() => {
    let unsubscribe: (() => void) | null = null
    
    if (sessionId) {
      loadCards()
      
      unsubscribe = realtimeManager.subscribeToCards(sessionId, handleRealtimeChange)
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [sessionId, loadCards, handleRealtimeChange])

  // Создание карточки
  const createCard = useCallback(async (data: CreateCardData) => {
    try {
      setError(null)
      
      // Оптимистичное обновление
      const tempId = `temp_${Date.now()}`
      const optimisticCard: Card = {
        id: tempId,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      setCards(prev => [...prev, optimisticCard])
      
      const { data: newCard, error } = await supabase
        .from('cards')
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        // Rollback оптимистичного обновления
        setCards(prev => prev.filter(c => c.id !== tempId))
        throw new Error(`Ошибка создания карточки: ${error.message}`)
      }

      // Заменяем временную карточку на реальную
      setCards(prev => prev.map(c => c.id === tempId ? newCard : c))
      
    } catch (err) {
      console.error('[useCards] Error creating card:', err)
      setError(err instanceof Error ? err.message : 'Ошибка создания карточки')
    }
  }, [])

  // Обновление карточки
  const updateCard = useCallback(async (id: string, updates: UpdateCardData) => {
    try {
      setError(null)
      
      // Оптимистичное обновление
      setCards(prev => prev.map(card => 
        card.id === id ? { ...card, ...updates } : card
      ))
      
      const { data, error } = await supabase
        .from('cards')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        // Rollback - перезагружаем данные
        await loadCards()
        throw new Error(`Ошибка обновления карточки: ${error.message}`)
      }
      
    } catch (err) {
      console.error('[useCards] Error updating card:', err)
      setError(err instanceof Error ? err.message : 'Ошибка обновления карточки')
    }
  }, [loadCards])

  // Удаление карточки
  const deleteCard = useCallback(async (id: string) => {
    try {
      setError(null)
      
      // Оптимистичное обновление
      const originalCards = cards
      setCards(prev => prev.filter(c => c.id !== id))
      
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', id)

      if (error) {
        // Rollback
        setCards(originalCards)
        throw new Error(`Ошибка удаления карточки: ${error.message}`)
      }
      
    } catch (err) {
      console.error('[useCards] Error deleting card:', err)
      setError(err instanceof Error ? err.message : 'Ошибка удаления карточки')
    }
  }, [cards])

  // Обновление позиции (с debouncing)
  const updatePosition = useCallback((id: string, x: number, y: number) => {
    // Мгновенное обновление UI
    setCards(prev => prev.map(card => 
      card.id === id ? { ...card, position_x: x, position_y: y } : card
    ))
    
    // Добавляем в batch для отправки на сервер
    positionUpdates.current.set(id, { x, y })
    debouncedPositionUpdate()
  }, [debouncedPositionUpdate])

  // Мониторинг состояния подключения
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  return {
    cards,
    loading,
    error,
    createCard,
    updateCard,
    deleteCard,
    updatePosition,
    isOnline,
    syncStatus
  }
}