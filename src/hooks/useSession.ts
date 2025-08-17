import { useState, useEffect, useCallback } from 'react';
import { sessionsApi } from '../lib/api/sessions';
import type { Session } from '../lib/types/board';

interface UseSessionState {
  session: Session | null;
  loading: boolean;
  error: string | null;
}

interface UseSessionActions {
  updateSessionTitle: (title: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSession(sessionId: string): UseSessionState & UseSessionActions {
  // Временная простая имплементация для тестирования
  console.log('useSession: простая версия, sessionId:', sessionId);
  
  const [session, setSession] = useState<Session | null>(
    sessionId ? { id: sessionId, title: 'Загруженная сессия', createdAt: new Date(), createdBy: null } : null
  );
  const [loading, setLoading] = useState(false); // Устанавливаем loading в false
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    console.log('useSession fetchSession called with sessionId:', sessionId);
    if (!sessionId || sessionId.trim() === '') {
      console.log('useSession: sessionId is empty, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      console.log('useSession: starting fetch...');
      setLoading(true);
      setError(null);
      
      // Получаем или создаем сессию
      const fetchedSession = await sessionsApi.getOrCreateSession(sessionId);
      console.log('useSession: fetch completed, session:', fetchedSession);
      setSession(fetchedSession);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      console.error('useSession: fetch failed:', err);
      setError(errorMessage);
    } finally {
      console.log('useSession: setting loading to false');
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    console.log('useSession useEffect triggered with sessionId:', sessionId);
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

  const refetch = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

  return {
    session,
    loading,
    error,
    updateSessionTitle,
    refetch,
  };
}