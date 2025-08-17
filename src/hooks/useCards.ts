import { useState, useEffect, useCallback } from 'react';
import { cardsApi } from '../lib/api/cards';
import type { Card, CreateCardData, UpdateCardData } from '../lib/types/board';

interface UseCardsState {
  cards: Card[];
  loading: boolean;
  error: string | null;
}

interface UseCardsActions {
  createCard: (cardData: CreateCardData) => Promise<void>;
  updateCard: (cardId: string, updates: UpdateCardData) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  updateCardPosition: (cardId: string, position: { x: number; y: number }) => Promise<void>;
  updateMultiplePositions: (updates: Array<{ id: string; position: { x: number; y: number } }>) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useCards(sessionId: string): UseCardsState & UseCardsActions {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    if (!sessionId || sessionId.trim() === '') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fetchedCards = await cardsApi.getCardsBySession(sessionId);
      setCards(fetchedCards);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      console.error('useCards: fetch failed:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const createCard = useCallback(async (cardData: CreateCardData) => {
    try {
      setError(null);
      const newCard = await cardsApi.createCard(sessionId, cardData);
      setCards(prev => [...prev, newCard]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка создания карточки';
      setError(errorMessage);
      console.error('Ошибка создания карточки:', err);
      throw err;
    }
  }, [sessionId]);

  const updateCard = useCallback(async (cardId: string, updates: UpdateCardData) => {
    try {
      setError(null);
      const updatedCard = await cardsApi.updateCard(cardId, updates);
      setCards(prev =>
        prev.map(card => (card.id === cardId ? updatedCard : card))
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления карточки';
      setError(errorMessage);
      console.error('Ошибка обновления карточки:', err);
      throw err;
    }
  }, []);

  const deleteCard = useCallback(async (cardId: string) => {
    try {
      setError(null);
      await cardsApi.deleteCard(cardId);
      setCards(prev => prev.filter(card => card.id !== cardId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка удаления карточки';
      setError(errorMessage);
      console.error('Ошибка удаления карточки:', err);
      throw err;
    }
  }, []);

  const updateCardPosition = useCallback(async (cardId: string, position: { x: number; y: number }) => {
    try {
      // Оптимистично обновляем UI
      setCards(prev =>
        prev.map(card =>
          card.id === cardId ? { ...card, position } : card
        )
      );

      // Отправляем обновление на сервер
      await cardsApi.updateCard(cardId, { position });
    } catch (err) {
      // В случае ошибки, откатываем изменения
      await fetchCards();
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления позиции';
      setError(errorMessage);
      console.error('Ошибка обновления позиции:', err);
      throw err;
    }
  }, [fetchCards]);

  const updateMultiplePositions = useCallback(async (updates: Array<{ id: string; position: { x: number; y: number } }>) => {
    try {
      // Оптимистично обновляем UI
      setCards(prev =>
        prev.map(card => {
          const update = updates.find(u => u.id === card.id);
          return update ? { ...card, position: update.position } : card;
        })
      );

      // Отправляем обновления на сервер
      await cardsApi.updateCardPositions(updates);
    } catch (err) {
      // В случае ошибки, откатываем изменения
      await fetchCards();
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления позиций';
      setError(errorMessage);
      console.error('Ошибка обновления позиций:', err);
      throw err;
    }
  }, [fetchCards]);

  const refetch = useCallback(async () => {
    await fetchCards();
  }, [fetchCards]);

  return {
    cards,
    loading,
    error,
    createCard,
    updateCard,
    deleteCard,
    updateCardPosition,
    updateMultiplePositions,
    refetch,
  };
}