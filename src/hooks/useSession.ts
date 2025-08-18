import { useState, useEffect, useCallback } from 'react';
import { sessionsApi } from '../lib/api/sessions';
import { toast } from 'sonner';
import type { Session } from '../lib/types/board';

interface UseSessionState {
  session: Session | null;
  loading: boolean;
  error: string | null;
}

interface UseSessionActions {
  updateSessionTitle: (title: string) => Promise<void>;
  updateHasStartedBrainstorm: (hasStarted: boolean) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSession(sessionId: string): UseSessionState & UseSessionActions {
  // Временная простая имплементация для тестирования
  const [session, setSession] = useState<Session | null>(
    sessionId ? { id: sessionId, title: 'Загруженная сессия', createdAt: new Date(), createdBy: null } : null
  );
  const [loading, setLoading] = useState(false); // Устанавливаем loading в false
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    if (!sessionId || sessionId.trim() === '') {
      setLoading(false);
      return;
    }

    // Валидация UUID формата
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);
    if (!isValidUUID) {
      console.error('Некорректный UUID сессии:', sessionId);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Получаем или создаем сессию
      const fetchedSession = await sessionsApi.getOrCreateSession(sessionId);
      setSession(fetchedSession);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      console.error('useSession: fetch failed:', err);
      
      // Показываем toast для ошибок UUID
      if (errorMessage.includes('invalid input syntax for type uuid')) {
        toast.error('Некорректная ссылка на доску', {
          description: 'Проверьте правильность ссылки',
          duration: 3000
        });
      }
      
      // Не устанавливаем ошибку в state
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const updateSessionTitle = useCallback(async (title: string) => {
    if (!sessionId) return;

    try {
      setError(null);
      const updatedSession = await sessionsApi.updateSession(sessionId, { title });
      setSession(updatedSession);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления сессии';
      setError(errorMessage);
      console.error('Ошибка обновления сессии:', err);
      throw err;
    }
  }, [sessionId]);

  const updateHasStartedBrainstorm = useCallback(async (hasStarted: boolean) => {
    if (!sessionId) return;

    try {
      setError(null);
      const updatedSession = await sessionsApi.updateSession(sessionId, { hasStartedBrainstorm: hasStarted });
      setSession(updatedSession);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления флага brainstorm';
      setError(errorMessage);
      console.error('Ошибка обновления флага brainstorm:', err);
      throw err;
    }
  }, [sessionId]);

  const refetch = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

  return {
    session,
    loading,
    error,
    updateSessionTitle,
    updateHasStartedBrainstorm,
    refetch,
  };
}
