import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface TypingUser {
  userId: string
  userName: string
  userColor: string
  cardId: string
  timestamp: number
}

interface UseTypingStatusProps {
  boardId: string
  currentUser: {
    id: string
    name: string
    color: string
  }
}

const TYPING_TIMEOUT = 3000 // 3 секунды таймаут
const TYPING_DEBOUNCE = 500 // 500мс debounce

export function useTypingStatus({ boardId, currentUser }: UseTypingStatusProps) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [typingTimeouts, setTypingTimeouts] = useState<Record<string, NodeJS.Timeout>>({})

  // Очистка устаревших статусов печати
  const cleanupTypingStatuses = useCallback(() => {
    const now = Date.now()
    setTypingUsers(prev => 
      prev.filter(user => now - user.timestamp < TYPING_TIMEOUT)
    )
  }, [])

  useEffect(() => {
    const interval = setInterval(cleanupTypingStatuses, 1000)
    return () => clearInterval(interval)
  }, [cleanupTypingStatuses])

  // Подписка на события печати
  useEffect(() => {
    const channel = supabase.channel(`typing:${boardId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, userName, userColor, cardId, isTyping } = payload.payload

        if (userId === currentUser.id) return // Игнорируем свои события

        if (isTyping) {
          setTypingUsers(prev => {
            const filtered = prev.filter(user => 
              !(user.userId === userId && user.cardId === cardId)
            )
            return [...filtered, {
              userId,
              userName,
              userColor,
              cardId,
              timestamp: Date.now()
            }]
          })
        } else {
          setTypingUsers(prev => 
            prev.filter(user => 
              !(user.userId === userId && user.cardId === cardId)
            )
          )
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [boardId, currentUser.id])

  // Отправка статуса печати
  const setTypingStatus = useCallback((cardId: string, isTyping: boolean) => {
    const channel = supabase.channel(`typing:${boardId}`)
    
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: currentUser.id,
        userName: currentUser.name,
        userColor: currentUser.color,
        cardId,
        isTyping
      }
    })
  }, [boardId, currentUser])

  // Debounced typing handler
  const handleTyping = useCallback((cardId: string) => {
    // Очищаем предыдущий таймаут для этой карточки
    const timeoutKey = `${currentUser.id}:${cardId}`
    if (typingTimeouts[timeoutKey]) {
      clearTimeout(typingTimeouts[timeoutKey])
    }

    // Отправляем статус "печатает"
    setTypingStatus(cardId, true)

    // Устанавливаем новый таймаут для остановки
    const newTimeout = setTimeout(() => {
      setTypingStatus(cardId, false)
      setTypingTimeouts(prev => {
        const { [timeoutKey]: _, ...rest } = prev
        return rest
      })
    }, TYPING_DEBOUNCE)

    setTypingTimeouts(prev => ({
      ...prev,
      [timeoutKey]: newTimeout
    }))
  }, [currentUser.id, setTypingStatus, typingTimeouts])

  // Остановка печати
  const stopTyping = useCallback((cardId: string) => {
    const timeoutKey = `${currentUser.id}:${cardId}`
    if (typingTimeouts[timeoutKey]) {
      clearTimeout(typingTimeouts[timeoutKey])
      setTypingTimeouts(prev => {
        const { [timeoutKey]: _, ...rest } = prev
        return rest
      })
    }
    setTypingStatus(cardId, false)
  }, [currentUser.id, setTypingStatus, typingTimeouts])

  // Получение пользователей, печатающих на конкретной карточке
  const getTypingUsersForCard = useCallback((cardId: string) => {
    return typingUsers.filter(user => user.cardId === cardId)
  }, [typingUsers])

  return {
    typingUsers,
    handleTyping,
    stopTyping,
    getTypingUsersForCard
  }
}