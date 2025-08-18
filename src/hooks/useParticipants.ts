import { useState, useEffect, useCallback, useRef } from 'react';
import { participantsApi } from '../lib/api/participants';
import { getStableUserId, getUserColor, getShortUserId } from '../lib/user-fingerprint';
import { toast } from 'sonner';
import type { Participant } from '../lib/types/board';

interface UseParticipantsState {
  participants: Participant[];
  activeParticipants: Participant[];
  currentParticipant: Participant | null;
  loading: boolean;
  error: string | null;
  isRestoring: boolean;
  userFingerprint: string | null;
}

interface UseParticipantsActions {
  joinSession: (name: string) => Promise<void>;
  updateActivity: () => Promise<void>;
  leaveSession: () => Promise<void>;
  refetch: () => Promise<void>;
}

// Генерация случайного цвета для участника
const generateRandomColor = (): string => {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export function useParticipants(sessionId: string): UseParticipantsState & UseParticipantsActions {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeParticipants, setActiveParticipants] = useState<Participant[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [userFingerprint, setUserFingerprint] = useState<string | null>(null);
  
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchParticipants = useCallback(async () => {
    if (!sessionId || sessionId.trim() === '') {
      setLoading(false);
      return;
    }

    // Валидация UUID формата
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);
    if (!isValidUUID) {
      console.error('Некорректный UUID сессии:', sessionId);
      // Не устанавливаем ошибку в state, просто логируем
      setLoading(false);
      return;
    }

    try {
      const [allParticipants, activeList] = await Promise.all([
        participantsApi.getParticipantsBySession(sessionId),
        participantsApi.getActiveParticipants(sessionId),
      ]);
      
      setParticipants(allParticipants);
      setActiveParticipants(activeList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки участников';
      
      // Показываем toast вместо установки ошибки в state
      if (errorMessage.includes('invalid input syntax for type uuid')) {
        toast.error('Некорректная ссылка на доску', {
          description: 'Вы будете перенаправлены на создание новой доски',
          duration: 3000
        });
      } else {
        // Для других ошибок просто логируем
        console.error('Ошибка загрузки участников:', err);
      }
      
      // Не устанавливаем ошибку в state
      setParticipants([]);
      setActiveParticipants([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Инициализируем fingerprint и пытаемся восстановить участника
  useEffect(() => {
    const initializeUserAndRestore = async () => {
      if (!sessionId) {
        setIsRestoring(false);
        return;
      }
      
      try {
        // Получаем стабильный user fingerprint
        const fingerprint = await getStableUserId();
        setUserFingerprint(fingerprint);
        
        // Ищем существующего участника в этой сессии по fingerprint
        try {
          const existingParticipants = await participantsApi.getParticipantsBySession(sessionId);
          const myParticipant = existingParticipants.find(p => 
            (p as any).user_fingerprint === fingerprint
          );
          
          if (myParticipant) {
            // Восстанавливаем участника и обновляем активность
            await participantsApi.updateActivity(myParticipant.id);
            setCurrentParticipant(myParticipant);
            } else {
            }
        } catch (error) {
          console.error('Ошибка поиска участника по fingerprint:', error);
        }
        
      } catch (error) {
        console.error('Ошибка инициализации fingerprint:', error);
      }
      
      setIsRestoring(false);
    };

    fetchParticipants().then(() => {
      initializeUserAndRestore();
    });
    
    // Обновляем список активных участников каждые 30 секунд
    const interval = setInterval(async () => {
      if (sessionId) {
        try {
          const activeList = await participantsApi.getActiveParticipants(sessionId);
          setActiveParticipants(activeList);
          
          // Если есть текущий участник, обновляем его активность
          if (currentParticipant) {
            participantStorage.updateActivity(sessionId);
          }
        } catch (err) {
          console.error('Ошибка обновления активных участников:', err);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [sessionId]); // Убрал fetchParticipants из зависимостей чтобы избежать циклов

  const joinSession = useCallback(async (name: string) => {
    if (!sessionId || !userFingerprint) return;

    try {
      setError(null);
      
      // Используем новую функцию поиска/создания участника по fingerprint
      const response = await fetch('/api/participants/find-or-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userFingerprint,
          displayName: name
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const participant = await response.json();
      setCurrentParticipant(participant);
      
      // Обновляем списки участников
      await fetchParticipants();
      
      // Начинаем отправлять сигналы активности каждые 2 минуты
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
      }
      
      activityIntervalRef.current = setInterval(async () => {
        try {
          await participantsApi.updateLastSeen(participant.id);
        } catch (err) {
          console.error('Ошибка обновления активности:', err);
        }
      }, 2 * 60 * 1000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка присоединения к сессии';
      setError(errorMessage);
      console.error('Ошибка присоединения к сессии:', err);
      throw err;
    }
  }, [sessionId, userFingerprint, fetchParticipants]);

  const updateActivity = useCallback(async () => {
    if (!currentParticipant) return;

    try {
      await participantsApi.updateLastSeen(currentParticipant.id);
    } catch (err) {
      console.error('Ошибка обновления активности:', err);
    }
  }, [currentParticipant]);

  const leaveSession = useCallback(async () => {
    if (!currentParticipant) return;

    try {
      // Останавливаем интервал активности
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
        activityIntervalRef.current = null;
      }

      // Удаляем участника из сессии
      await participantsApi.removeParticipant(currentParticipant.id);
      setCurrentParticipant(null);
      
      // Обновляем списки
      await fetchParticipants();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка выхода из сессии';
      setError(errorMessage);
      console.error('Ошибка выхода из сессии:', err);
      throw err;
    }
  }, [currentParticipant, fetchParticipants]);

  const refetch = useCallback(async () => {
    await fetchParticipants();
  }, [fetchParticipants]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
      }
    };
  }, []);

  return {
    participants,
    activeParticipants,
    currentParticipant,
    loading,
    error,
    isRestoring,
    userFingerprint,
    joinSession,
    updateActivity,
    leaveSession,
    refetch,
  };
}
