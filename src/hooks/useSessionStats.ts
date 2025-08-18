import { useState, useEffect } from 'react'

export interface SessionStats {
  participantCount: number
  activeParticipantCount: number
  sessionTitle: string | null
  createdAt: string
}

async function getSessionStats(sessionId: string): Promise<SessionStats | null> {
  try {
    const response = await fetch(`/api/sessions/${sessionId}/stats`)
    
    if (response.status === 404) {
      return null
    }
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch session stats')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Ошибка получения статистики сессии:', error)
    throw error
  }
}

export function useSessionStats(sessionId: string | null) {
  const [stats, setStats] = useState<SessionStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setStats(null)
      setLoading(false)
      setError(null)
      return
    }

    // Проверяем валидность UUID
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)
    if (!isValidUUID) {
      setStats(null)
      setLoading(false)
      setError('Invalid session ID')
      return
    }

    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const sessionStats = await getSessionStats(sessionId)
        setStats(sessionStats)
      } catch (err) {
        console.error('Error fetching session stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to load session stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [sessionId])

  return { stats, loading, error }
}
