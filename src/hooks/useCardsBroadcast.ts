import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Card } from '../lib/types/board'

interface CardBroadcastData {
  type: 'created' | 'updated' | 'deleted' | 'moved'
  card?: Card
  cardId?: string
  position?: { x: number; y: number }
  content?: string
  userId?: string
}

export function useCardsBroadcast(
  sessionId: string,
  currentUserId: string | null,
  onCardChange: (data: CardBroadcastData) => void
) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Функция для отправки изменений карточек другим пользователям
  const broadcastCardChange = useCallback((data: CardBroadcastData) => {
    if (!channel || !currentUserId) return

    // Добавляем информацию о пользователе
    const enrichedData = {
      ...data,
      userId: currentUserId,
      timestamp: Date.now()
    }

    channel.send({
      type: 'broadcast',
      event: 'card_change',
      payload: enrichedData
    })
  }, [channel, currentUserId])

  useEffect(() => {
    if (!sessionId) return

    console.log(`[useCardsBroadcast] Connecting to cards:${sessionId}`)

    // Создаем канал для синхронизации карточек
    const cardsChannel = supabase.channel(`cards:${sessionId}`, {
      config: {
        broadcast: {
          self: false, // Не получаем собственные сообщения
          ack: false   // Не ждем подтверждения для скорости
        }
      }
    })
      .on('broadcast', { event: 'card_change' }, ({ payload }) => {
        const cardData = payload as CardBroadcastData & { userId: string; timestamp: number }
        
        console.log(`[useCardsBroadcast] Received card change:`, cardData)
        
        // Не обрабатываем собственные изменения
        if (cardData.userId !== currentUserId) {
          onCardChange(cardData)
        }
      })
      .subscribe((status) => {
        console.log(`[useCardsBroadcast] Subscription status:`, status)
        setIsConnected(status === 'SUBSCRIBED')
      })

    setChannel(cardsChannel)

    return () => {
      console.log(`[useCardsBroadcast] Disconnecting from cards:${sessionId}`)
      cardsChannel.unsubscribe()
      setChannel(null)
      setIsConnected(false)
    }
  }, [sessionId, currentUserId, onCardChange])

  return {
    broadcastCardChange,
    isConnected
  }
}