import { useState, useEffect, useCallback } from 'react';
import { cardSelectionsApi } from '@/lib/api/cardSelections';
import type { CardSelection, CreateCardSelectionData } from '@/lib/types/board';

export function useCardSelectionsWithRealtime(sessionId: string, currentParticipantId: string | null) {
  const [selections, setSelections] = useState<CardSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка начальных выделений
  useEffect(() => {
    if (!sessionId) return;

    const loadSelections = async () => {
      try {
        setLoading(true);
        setError(null);
        const initialSelections = await cardSelectionsApi.getCardSelections(sessionId);
        setSelections(initialSelections);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки выделений');
        console.error('Ошибка загрузки выделений карточек:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSelections();
  }, [sessionId]);

  // Подписка на realtime изменения
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = cardSelectionsApi.subscribeToCardSelections(sessionId, (updatedSelections) => {
      setSelections(updatedSelections);
    });

    return unsubscribe;
  }, [sessionId]);

  // Выделить карточку
  const selectCard = useCallback(async (cardId: string) => {
    if (!sessionId || !currentParticipantId) return;

    try {
      await cardSelectionsApi.selectCard(sessionId, {
        cardId,
        selectedBy: currentParticipantId,
      });
      // Выделение будет обновлено через realtime подписку
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка выделения карточки');
      console.error('Ошибка выделения карточки:', err);
    }
  }, [sessionId, currentParticipantId]);

  // Снять выделение
  const deselectCard = useCallback(async () => {
    if (!currentParticipantId) return;

    try {
      await cardSelectionsApi.deselectCard(currentParticipantId);
      // Выделение будет снято через realtime подписку
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка снятия выделения');
      console.error('Ошибка снятия выделения карточки:', err);
    }
  }, [currentParticipantId]);

  // Получить карточку, выделенную конкретным участником
  const getSelectedCardByParticipant = useCallback((participantId: string): string | null => {
    const selection = selections.find(s => s.selectedBy === participantId);
    return selection ? selection.cardId : null;
  }, [selections]);

  // Получить участника, который выделил конкретную карточку
  const getParticipantBySelectedCard = useCallback((cardId: string): string | null => {
    const selection = selections.find(s => s.cardId === cardId);
    return selection ? selection.selectedBy : null;
  }, [selections]);

  return {
    selections,
    loading,
    error,
    selectCard,
    deselectCard,
    getSelectedCardByParticipant,
    getParticipantBySelectedCard,
  };
}