/**
 * Утилиты для работы с rate limiting
 * Обрабатывает проверку лимитов и отображение ошибок пользователю
 */

import { supabase } from '../src/lib/supabase'
import { toast } from 'sonner'

export interface RateLimitInfo {
  action_type: 'create_card' | 'create_board'
  current_count: number
  limit_value: number
  window_end: string
  time_until_reset: number
}

export interface RateLimitError {
  error: 'RATE_LIMIT_EXCEEDED'
  type: 'cards' | 'boards'
  message: string
  details: string
  code: 'CARDS_RATE_LIMIT' | 'BOARDS_RATE_LIMIT'
}

/**
 * Получает информацию о текущих лимитах пользователя
 */
export async function getUserRateLimits(fingerprint: string): Promise<RateLimitInfo[]> {
  try {
    const { data, error } = await supabase.rpc('get_user_rate_limits', {
      user_fingerprint: fingerprint
    })

    if (error) {
      console.error('Ошибка получения информации о лимитах:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Ошибка при запросе лимитов:', error)
    return []
  }
}

/**
 * Проверяет, можно ли создать карточку
 */
export async function canCreateCard(fingerprint: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_card_rate_limit', {
      user_fingerprint: fingerprint
    })

    if (error) {
      console.error('Ошибка проверки лимита карточек:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('Ошибка при проверке лимита карточек:', error)
    return false
  }
}

/**
 * Проверяет, можно ли создать доску
 */
export async function canCreateBoard(fingerprint: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_board_rate_limit', {
      user_fingerprint: fingerprint
    })

    if (error) {
      console.error('Ошибка проверки лимита досок:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('Ошибка при проверке лимита досок:', error)
    return false
  }
}

/**
 * Обрабатывает ошибки rate limiting и показывает соответствующие уведомления
 */
export function handleRateLimitError(error: any): boolean {
  // Проверяем, является ли ошибка rate limit ошибкой
  const message = error?.message || error?.details || String(error)
  
  if (message.includes('RATE_LIMIT_EXCEEDED') || message.includes('Превышен лимит')) {
    if (message.includes('карточек')) {
      toast.error('Превышен лимит создания карточек', {
        description: 'Максимум 5 карточек за 5 секунд. Подождите немного.',
        duration: 5000,
        important: true,
        style: {
          background: '#0f1011', // Черный фон как у карточек
          color: '#ffffff', // Белый текст
          border: '1px solid #dc2626', // Приглушенный красный
          boxShadow: '0 0 12px rgba(220, 38, 38, 0.15)' // Мягкое красное свечение
        }
      })
      return true
    } else if (message.includes('досок')) {
      toast.error('Превышен лимит создания досок', {
        description: 'Максимум 50 досок за час. Попробуйте позже.',
        duration: 5000,
        important: true,
        style: {
          background: '#0f1011', // Черный фон как у карточек
          color: '#ffffff', // Белый текст
          border: '1px solid #dc2626', // Приглушенный красный
          boxShadow: '0 0 12px rgba(220, 38, 38, 0.15)' // Мягкое красное свечение
        }
      })
      return true
    }
  }
  
  return false
}

/**
 * Форматирует время до сброса лимита в человекочитаемый вид
 */
export function formatTimeUntilReset(seconds: number): string {
  if (seconds <= 0) return 'сейчас'
  
  if (seconds < 60) {
    return `${seconds} сек`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes} мин ${remainingSeconds > 0 ? remainingSeconds + ' сек' : ''}`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours} ч ${minutes > 0 ? minutes + ' мин' : ''}`
  }
}

/**
 * Получает fingerprint пользователя (должен быть реализован в зависимости от вашей системы)
 */
export function getUserFingerprint(): string {
  // Это должно быть заменено на вашу реализацию получения fingerprint
  // Например, из localStorage или из контекста пользователя
  return typeof window !== 'undefined' 
    ? localStorage.getItem('userFingerprint') || 'anonymous'
    : 'anonymous'
}

/**
 * Проверяет лимиты перед выполнением действия и показывает предупреждение если нужно
 */
export async function checkAndWarnRateLimit(
  action: 'create_card' | 'create_board',
  fingerprint?: string
): Promise<boolean> {
  const userFingerprint = fingerprint || getUserFingerprint()
  
  try {
    const limits = await getUserRateLimits(userFingerprint)
    const relevantLimit = limits.find(limit => limit.action_type === action)
    
    if (relevantLimit) {
      const usagePercent = (relevantLimit.current_count / relevantLimit.limit_value) * 100
      
      // Предупреждаем при 80% использования лимита
      if (usagePercent >= 80) {
        const remaining = relevantLimit.limit_value - relevantLimit.current_count
        const resetTime = formatTimeUntilReset(relevantLimit.time_until_reset)
        
        if (action === 'create_card') {
          toast.warning('Приближение к лимиту карточек', {
            description: `Осталось ${remaining} карточек до лимита. Сброс через ${resetTime}.`,
            duration: 3000
          })
        } else {
          toast.warning('Приближение к лимиту досок', {
            description: `Осталось ${remaining} досок до лимита. Сброс через ${resetTime}.`,
            duration: 3000
          })
        }
      }
    }
    
    return true
  } catch (error) {
    console.error('Ошибка проверки лимитов:', error)
    return true // Разрешаем действие в случае ошибки проверки
  }
}
