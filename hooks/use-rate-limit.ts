/**
 * React хук для работы с rate limiting
 * Предоставляет удобный интерфейс для проверки лимитов и обработки ошибок
 */

import { useState, useEffect, useCallback } from 'react'
import { 
  getUserRateLimits, 
  canCreateCard, 
  canCreateBoard, 
  handleRateLimitError,
  checkAndWarnRateLimit,
  getUserFingerprint,
  type RateLimitInfo 
} from '@/lib/rate-limit'

interface UseRateLimitOptions {
  fingerprint?: string
  enableAutoRefresh?: boolean
  refreshInterval?: number
}

export function useRateLimit(options: UseRateLimitOptions = {}) {
  const {
    fingerprint = getUserFingerprint(),
    enableAutoRefresh = false,
    refreshInterval = 5000
  } = options

  const [limits, setLimits] = useState<RateLimitInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Загружает актуальную информацию о лимитах
  const refreshLimits = useCallback(async () => {
    if (!fingerprint) return

    setIsLoading(true)
    setError(null)

    try {
      const limitsData = await getUserRateLimits(fingerprint)
      setLimits(limitsData)
    } catch (err) {
      setError('Ошибка загрузки информации о лимитах')
      console.error('Ошибка загрузки лимитов:', err)
    } finally {
      setIsLoading(false)
    }
  }, [fingerprint])

  // Проверяет, можно ли создать карточку
  const checkCardLimit = useCallback(async (): Promise<boolean> => {
    if (!fingerprint) return false

    try {
      const canCreate = await canCreateCard(fingerprint)
      
      if (!canCreate) {
        handleRateLimitError({
          message: 'RATE_LIMIT_EXCEEDED: Превышен лимит создания карточек'
        })
      } else {
        await checkAndWarnRateLimit('create_card', fingerprint)
      }
      
      return canCreate
    } catch (err) {
      handleRateLimitError(err)
      return false
    }
  }, [fingerprint])

  // Проверяет, можно ли создать доску
  const checkBoardLimit = useCallback(async (): Promise<boolean> => {
    if (!fingerprint) return false

    try {
      const canCreate = await canCreateBoard(fingerprint)
      
      if (!canCreate) {
        handleRateLimitError({
          message: 'RATE_LIMIT_EXCEEDED: Превышен лимит создания досок'
        })
      } else {
        await checkAndWarnRateLimit('create_board', fingerprint)
      }
      
      return canCreate
    } catch (err) {
      handleRateLimitError(err)
      return false
    }
  }, [fingerprint])

  // Безопасное создание карточки с проверкой лимитов
  const safeCreateCard = useCallback(async (createFn: () => Promise<void>): Promise<boolean> => {
    const canCreate = await checkCardLimit()
    
    if (!canCreate) {
      return false
    }

    try {
      await createFn()
      // Обновляем лимиты после успешного создания
      await refreshLimits()
      return true
    } catch (err) {
      const isRateLimitError = handleRateLimitError(err)
      if (!isRateLimitError) {
        throw err // Пробрасываем ошибку, если это не rate limit
      }
      return false
    }
  }, [checkCardLimit, refreshLimits])

  // Безопасное создание доски с проверкой лимитов
  const safeCreateBoard = useCallback(async (createFn: () => Promise<void>): Promise<boolean> => {
    const canCreate = await checkBoardLimit()
    
    if (!canCreate) {
      return false
    }

    try {
      await createFn()
      // Обновляем лимиты после успешного создания
      await refreshLimits()
      return true
    } catch (err) {
      const isRateLimitError = handleRateLimitError(err)
      if (!isRateLimitError) {
        throw err // Пробрасываем ошибку, если это не rate limit
      }
      return false
    }
  }, [checkBoardLimit, refreshLimits])

  // Получает информацию о конкретном лимите
  const getLimitInfo = useCallback((actionType: 'create_card' | 'create_board') => {
    return limits.find(limit => limit.action_type === actionType)
  }, [limits])

  // Вычисляет процент использования лимита
  const getLimitUsage = useCallback((actionType: 'create_card' | 'create_board') => {
    const limit = getLimitInfo(actionType)
    if (!limit) return 0
    return Math.round((limit.current_count / limit.limit_value) * 100)
  }, [getLimitInfo])

  // Проверяет, приближается ли лимит к исчерпанию
  const isLimitNearExhaustion = useCallback((actionType: 'create_card' | 'create_board', threshold = 80) => {
    return getLimitUsage(actionType) >= threshold
  }, [getLimitUsage])

  // Автоматическое обновление лимитов
  useEffect(() => {
    if (fingerprint) {
      refreshLimits()
    }
  }, [fingerprint, refreshLimits])

  useEffect(() => {
    if (!enableAutoRefresh || !fingerprint) return

    const interval = setInterval(refreshLimits, refreshInterval)
    return () => clearInterval(interval)
  }, [enableAutoRefresh, refreshInterval, refreshLimits, fingerprint])

  return {
    // Данные
    limits,
    isLoading,
    error,
    fingerprint,

    // Методы проверки
    checkCardLimit,
    checkBoardLimit,
    
    // Безопасные методы создания
    safeCreateCard,
    safeCreateBoard,
    
    // Утилиты
    refreshLimits,
    getLimitInfo,
    getLimitUsage,
    isLimitNearExhaustion,
    
    // Обработчик ошибок
    handleError: handleRateLimitError
  }
}