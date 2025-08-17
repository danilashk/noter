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
      return;
    }

    const loadLines = async () => {
      try {
        setLoading(true);
        setError(null);
        const initialLines = await drawingApi.getDrawingLines(sessionId);
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
      return;
    }

    const unsubscribe = drawingApi.subscribeToDrawingLines(sessionId, (updatedLines) => {
      setLines(updatedLines);
    });

    return unsubscribe;
  }, [sessionId]);

  // Создание новой линии
  const createLine = useCallback(async (lineData: CreateDrawingLineData) => {
    if (!sessionId || !currentParticipantId) {
      return;
    }

    try {
      const result = await drawingApi.createDrawingLine(sessionId, {
        ...lineData,
        createdBy: currentParticipantId,
      });
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

  // Удаление последней своей линии
  const undoLastLine = useCallback(async () => {
    if (!currentParticipantId) {
      return;
    }

    // Находим последнюю линию текущего пользователя
    const myLines = lines
      .filter(line => line.createdBy === currentParticipantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (myLines.length === 0) {
      return;
    }

    const lastLine = myLines[0];
    try {
      // Оптимистично удаляем из UI сразу
      setLines(prev => prev.filter(line => line.id !== lastLine.id));
      
      // Отправляем запрос на сервер
      await drawingApi.deleteDrawingLine(lastLine.id);
      } catch (err) {
      // В случае ошибки, возвращаем линию обратно
      setLines(prev => [...prev, lastLine].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      setError(err instanceof Error ? err.message : 'Ошибка удаления последней линии');
      console.error('🎨 Ошибка удаления последней линии:', err);
    }
  }, [lines, currentParticipantId]);

  // Проверка, есть ли линии для удаления
  const canUndoLine = useCallback(() => {
    if (!currentParticipantId) return false;
    return lines.some(line => line.createdBy === currentParticipantId);
  }, [lines, currentParticipantId]);

  return {
    lines,
    loading,
    error,
    createLine,
    deleteLine,
    undoLastLine,
    canUndoLine: canUndoLine(),
  };
}
