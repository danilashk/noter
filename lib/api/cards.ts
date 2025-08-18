/**
 * API функции для работы с карточками с поддержкой rate limiting
 */

import { supabase } from '@/lib/supabase'
import { handleRateLimitError, getUserFingerprint } from '@/lib/rate-limit'

export interface CreateCardData {
  sessionId: string
  content: string
  createdBy: string
  userFingerprint?: string
  positionX?: number
  positionY?: number
  height?: number
}

export interface CardResponse {
  id: string
  session_id: string
  content: string
  position_x: number
  position_y: number
  height: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: string
}

/**
 * Создает новую карточку с проверкой rate limiting
 */
export async function createCard(cardData: CreateCardData): Promise<CardResponse> {
  const fingerprint = cardData.userFingerprint || getUserFingerprint()
  
  try {
    const { data, error } = await supabase.rpc('api_create_card', {
      p_session_id: cardData.sessionId,
      p_content: cardData.content,
      p_created_by: cardData.createdBy,
      p_user_fingerprint: fingerprint,
      p_position_x: cardData.positionX || 0,
      p_position_y: cardData.positionY || 0,
      p_height: cardData.height || 120
    })

    if (error) {
      console.error('Ошибка создания карточки:', error)
      throw new Error(`Ошибка базы данных: ${error.message}`)
    }

    const response = data as ApiResponse<CardResponse>

    if (!response.success) {
      // Обрабатываем rate limit ошибки
      if (response.code === 'CARDS_RATE_LIMIT') {
        const rateLimitError = {
          message: response.message || 'Превышен лимит создания карточек'
        }
        handleRateLimitError(rateLimitError)
        throw new Error(response.message || 'Превышен лимит создания карточек')
      }
      
      throw new Error(response.message || 'Ошибка создания карточки')
    }

    if (!response.data) {
      throw new Error('Некорректный ответ сервера')
    }

    return response.data
  } catch (error) {
    // Проверяем, не является ли это rate limit ошибкой от триггера
    const isHandled = handleRateLimitError(error)
    if (!isHandled) {
      console.error('Ошибка создания карточки:', error)
    }
    throw error
  }
}

/**
 * Получает карточки для сессии
 */
export async function getSessionCards(sessionId: string): Promise<CardResponse[]> {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Ошибка получения карточек:', error)
      throw new Error(`Ошибка получения карточек: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Ошибка получения карточек:', error)
    throw error
  }
}

/**
 * Обновляет карточку
 */
export async function updateCard(
  cardId: string, 
  updates: Partial<Pick<CardResponse, 'content' | 'position_x' | 'position_y' | 'height'>>
): Promise<CardResponse> {
  try {
    const { data, error } = await supabase
      .from('cards')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', cardId)
      .select()
      .single()

    if (error) {
      console.error('Ошибка обновления карточки:', error)
      throw new Error(`Ошибка обновления карточки: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Ошибка обновления карточки:', error)
    throw error
  }
}

/**
 * Удаляет карточку
 */
export async function deleteCard(cardId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', cardId)

    if (error) {
      console.error('Ошибка удаления карточки:', error)
      throw new Error(`Ошибка удаления карточки: ${error.message}`)
    }
  } catch (error) {
    console.error('Ошибка удаления карточки:', error)
    throw error
  }
}

/**
 * Подписывается на изменения карточек в сессии
 */
export function subscribeToSessionCards(
  sessionId: string,
  callback: (cards: CardResponse[]) => void
) {
  return supabase
    .channel(`cards-${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cards',
        filter: `session_id=eq.${sessionId}`
      },
      async () => {
        // Перезагружаем все карточки при любом изменении
        try {
          const cards = await getSessionCards(sessionId)
          callback(cards)
        } catch (error) {
          console.error('Ошибка при обновлении карточек:', error)
        }
      }
    )
    .subscribe()
}