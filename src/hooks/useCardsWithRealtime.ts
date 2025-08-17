import { useState, useEffect, useCallback } from 'react';
import { cardsApi } from '../lib/api/cards';
import { useCardsBroadcast } from './useCardsBroadcast';
import type { Card, CreateCardData, UpdateCardData } from '../lib/types/board';

interface UseCardsRealtimeState {
  cards: Card[];
  loading: boolean;
  error: string | null;
  isRealtimeConnected: boolean;
}

interface UseCardsRealtimeActions {
  createCard: (cardData: CreateCardData) => Promise<void>;
  updateCard: (cardId: string, updates: UpdateCardData) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  updateCardPosition: (cardId: string, position: { x: number; y: number }) => Promise<void>;
  updateMultiplePositions: (updates: Array<{ id: string; position: { x: number; y: number } }>) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useCardsWithRealtime(
  sessionId: string,
  currentUserId: string | null
): UseCardsRealtimeState & UseCardsRealtimeActions {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Обработчик realtime изменений карточек от других пользователей
  const handleCardChange = useCallback((data: any) => {
    console.log('[useCardsWithRealtime] Processing card change:', data);
    
    switch (data.type) {
      case 'created':
        if (data.card) {
          setCards(prev => {
            // Проверяем, не существует ли уже такая карточка
            if (prev.some(card => card.id === data.card.id)) {
              return prev;
            }
            console.log('[useCardsWithRealtime] Adding new card:', data.card);
            return [...prev, data.card];
          });
        }
        break;

      case 'updated':
        if (data.card) {
          setCards(prev =>
            prev.map(card =>
              card.id === data.card.id ? data.card : card
            )
          );
          console.log('[useCardsWithRealtime] Updated card:', data.card.id);
        }
        break;

      case 'deleted':
        if (data.cardId) {
          setCards(prev => prev.filter(card => card.id !== data.cardId));
          console.log('[useCardsWithRealtime] Deleted card:', data.cardId);
        }
        break;

      case 'moved':
        if (data.cardId && data.position) {
          setCards(prev =>
            prev.map(card =>
              card.id === data.cardId
                ? { ...card, position: data.position }
                : card
            )
          );
          console.log('[useCardsWithRealtime] Moved card:', data.cardId, data.position);
        }
        break;

      default:
        console.warn('[useCardsWithRealtime] Unknown card change type:', data.type);
    }
  }, []);

  // Подключаем realtime broadcast
  const { broadcastCardChange, isConnected: isRealtimeConnected } = useCardsBroadcast(
    sessionId,
    currentUserId,
    handleCardChange
  );

  const fetchCards = useCallback(async () => {
    console.log('useCardsWithRealtime fetchCards called with sessionId:', sessionId);
    if (!sessionId || sessionId.trim() === '') {
      console.log('useCardsWithRealtime: sessionId is empty, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      console.log('useCardsWithRealtime: starting fetch...');
      setLoading(true);
      setError(null);
      const fetchedCards = await cardsApi.getCardsBySession(sessionId);
      console.log('useCardsWithRealtime: fetch completed, cards:', fetchedCards);
      setCards(fetchedCards);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      console.error('useCardsWithRealtime: fetch failed:', err);
      setError(errorMessage);
    } finally {
      console.log('useCardsWithRealtime: setting loading to false');
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
      
      // Обновляем локальное состояние
      setCards(prev => [...prev, newCard]);
      
      // Отправляем изменение другим пользователям
      broadcastCardChange({
        type: 'created',
        card: newCard
      });
      
      console.log('[useCardsWithRealtime] Card created and broadcasted:', newCard.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка создания карточки';
      setError(errorMessage);
      console.error('Ошибка создания карточки:', err);
      throw err;
    }
  }, [sessionId, broadcastCardChange]);

  const updateCard = useCallback(async (cardId: string, updates: UpdateCardData) => {
    try {
      setError(null);
      const updatedCard = await cardsApi.updateCard(cardId, updates);
      
      // Обновляем локальное состояние
      setCards(prev =>
        prev.map(card => (card.id === cardId ? updatedCard : card))
      );
      
      // Отправляем изменение другим пользователям
      broadcastCardChange({
        type: 'updated',
        card: updatedCard
      });
      
      console.log('[useCardsWithRealtime] Card updated and broadcasted:', cardId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления карточки';
      setError(errorMessage);
      console.error('Ошибка обновления карточки:', err);
      throw err;
    }
  }, [broadcastCardChange]);

  const deleteCard = useCallback(async (cardId: string) => {
    try {
      setError(null);
      await cardsApi.deleteCard(cardId);
      
      // Обновляем локальное состояние
      setCards(prev => prev.filter(card => card.id !== cardId));
      
      // Отправляем изменение другим пользователям
      broadcastCardChange({
        type: 'deleted',
        cardId
      });
      
      console.log('[useCardsWithRealtime] Card deleted and broadcasted:', cardId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка удаления карточки';
      setError(errorMessage);
      console.error('Ошибка удаления карточки:', err);
      throw err;
    }
  }, [broadcastCardChange]);

  const updateCardPosition = useCallback(async (cardId: string, position: { x: number; y: number }) => {
    try {
      // Оптимистично обновляем UI
      setCards(prev =>
        prev.map(card =>
          card.id === cardId ? { ...card, position } : card
        )
      );

      // Отправляем изменение другим пользователям сразу (для плавности)
      broadcastCardChange({
        type: 'moved',
        cardId,
        position
      });

      // Отправляем обновление на сервер
      await cardsApi.updateCard(cardId, { position });
      
      console.log('[useCardsWithRealtime] Card position updated and broadcasted:', cardId, position);
    } catch (err) {
      // В случае ошибки, откатываем изменения
      await fetchCards();
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления позиции';
      setError(errorMessage);
      console.error('Ошибка обновления позиции:', err);
      throw err;
    }
  }, [fetchCards, broadcastCardChange]);

  const updateMultiplePositions = useCallback(async (updates: Array<{ id: string; position: { x: number; y: number } }>) => {
    try {
      // Оптимистично обновляем UI
      setCards(prev =>
        prev.map(card => {
          const update = updates.find(u => u.id === card.id);
          return update ? { ...card, position: update.position } : card;
        })
      );

      // Отправляем изменения другим пользователям
      updates.forEach(update => {
        broadcastCardChange({
          type: 'moved',
          cardId: update.id,
          position: update.position
        });
      });

      // Отправляем обновления на сервер
      await cardsApi.updateCardPositions(updates);
      
      console.log('[useCardsWithRealtime] Multiple positions updated and broadcasted:', updates.length);
    } catch (err) {
      // В случае ошибки, откатываем изменения
      await fetchCards();
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления позиций';
      setError(errorMessage);
      console.error('Ошибка обновления позиций:', err);
      throw err;
    }
  }, [fetchCards, broadcastCardChange]);

  const refetch = useCallback(async () => {
    await fetchCards();
  }, [fetchCards]);

  return {
    cards,
    loading,
    error,
    isRealtimeConnected,
    createCard,
    updateCard,
    deleteCard,
    updateCardPosition,
    updateMultiplePositions,
    refetch,
  };
}