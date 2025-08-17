import { useState, useEffect, useCallback } from 'react';
import { drawingApi } from '@/lib/api/drawing';
import type { DrawingLine, CreateDrawingLineData } from '@/lib/types/board';

export function useDrawingWithRealtime(sessionId: string, currentParticipantId: string | null) {
  const [lines, setLines] = useState<DrawingLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка начальных линий
  useEffect(() => {
    if (!sessionId) {
      console.log('🎨 Нет sessionId для загрузки линий');
      return;
    }

    console.log('🎨 Загружаю начальные линии для сессии:', sessionId);

    const loadLines = async () => {
      try {
        setLoading(true);
        setError(null);
        const initialLines = await drawingApi.getDrawingLines(sessionId);
        console.log('🎨 Загружено линий из БД:', initialLines.length);
        setLines(initialLines);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки линий');
        console.error('🎨 Ошибка загрузки линий рисования:', err);
      } finally {
        setLoading(false);
      }
    };

    loadLines();
  }, [sessionId]);

  // Подписка на realtime изменения
  useEffect(() => {
    if (!sessionId) {
      console.log('🎨 Нет sessionId для подписки на realtime');
      return;
    }

    console.log('🎨 Подписываюсь на realtime для сессии:', sessionId);

    const unsubscribe = drawingApi.subscribeToDrawingLines(sessionId, (updatedLines) => {
      console.log('🎨 Получены обновленные линии через realtime:', updatedLines.length);
      setLines(updatedLines);
    });

    return unsubscribe;
  }, [sessionId]);

  // Создание новой линии
  const createLine = useCallback(async (lineData: CreateDrawingLineData) => {
    if (!sessionId || !currentParticipantId) {
      console.log('🎨 Не могу создать линию: sessionId =', sessionId, 'participantId =', currentParticipantId);
      return;
    }

    console.log('🎨 Создаю линию с данными:', {
      points: lineData.points.length,
      color: lineData.color,
      createdBy: currentParticipantId
    });

    try {
      const result = await drawingApi.createDrawingLine(sessionId, {
        ...lineData,
        createdBy: currentParticipantId,
      });
      console.log('🎨 Линия создана в БД:', result.id);
      // Линия будет добавлена через realtime подписку
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания линии');
      console.error('🎨 Ошибка создания линии рисования:', err);
    }
  }, [sessionId, currentParticipantId]);

  // Удаление линии
  const deleteLine = useCallback(async (lineId: string) => {
    try {
      await drawingApi.deleteDrawingLine(lineId);
      // Линия будет удалена через realtime подписку
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления линии');
      console.error('Ошибка удаления линии рисования:', err);
    }
  }, []);

  return {
    lines,
    loading,
    error,
    createLine,
    deleteLine,
  };
}
