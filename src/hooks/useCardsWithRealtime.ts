import { useState, useEffect, useCallback } from 'react';
import { cardsApi } from '../lib/api/cards';
import { useCardsBroadcast } from './useCardsBroadcast';
import { handleRateLimitError } from '../../lib/rate-limit';
import { toast } from 'sonner';
import type { Card, CreateCardData, UpdateCardData } from '../lib/types/board';

interface UseCardsRealtimeState {
  cards: Card[];
  loading: boolean;
  isRealtimeConnected: boolean;
}

interface UseCardsRealtimeActions {
  createCard: (cardData: CreateCardData) => Promise<void>;
  updateCard: (cardId: string, updates: UpdateCardData) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  updateCardPosition: (cardId: string, position: { x: number; y: number }) => Promise<void>;
  updateCardHeight: (cardId: string, height: number) => Promise<void>;
  updateMultiplePositions: (updates: Array<{ id: string; position: { x: number; y: number } }>) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useCardsWithRealtime(
  sessionId: string,
  currentUserId: string | null
): UseCardsRealtimeState & UseCardsRealtimeActions {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  // Обработчик realtime изменений карточек от других пользователей
  const handleCardChange = useCallback((data: any) => {
    switch (data.type) {
      case 'created':
        if (data.card) {
          setCards(prev => {
            // Проверяем, не существует ли уже такая карточка
            if (prev.some(card => card.id === data.card.id)) {
              return prev;
            }
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
          }
        break;

      case 'deleted':
        if (data.cardId) {
          setCards(prev => prev.filter(card => card.id !== data.cardId));
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
          }
        break;

      case 'resized':
        if (data.cardId && data.height) {
          setCards(prev =>
            prev.map(card =>
              card.id === data.cardId
                ? { ...card, height: data.height }
                : card
            )
          );
          }
        break;

      default:
        }
  }, []);

  // Подключаем realtime broadcast
  const { broadcastCardChange, isConnected: isRealtimeConnected } = useCardsBroadcast(
    sessionId,
    currentUserId,
    handleCardChange
  );

  const fetchCards = useCallback(async () => {
    if (!sessionId || sessionId.trim() === '') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const fetchedCards = await cardsApi.getCardsBySession(sessionId);
      setCards(fetchedCards);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      console.error('useCardsWithRealtime: fetch failed:', err);
      // Не устанавливаем ошибку в state, просто логируем
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const createCard = useCallback(async (cardData: CreateCardData) => {
    try {
      const newCard = await cardsApi.createCard(sessionId, cardData);
      
      // Обновляем локальное состояние
      setCards(prev => [...prev, newCard]);
      
      // Отправляем изменение другим пользователям
      broadcastCardChange({
        type: 'created',
        card: newCard
      });
      
    } catch (err) {
      // Проверяем, является ли это rate limit ошибкой
      const isRateLimitError = handleRateLimitError(err);
      
      if (!isRateLimitError) {
        // Если это не rate limit, показываем обычную ошибку через toast
        const errorMessage = err instanceof Error ? err.message : 'Ошибка создания карточки';
        toast.error('Ошибка создания карточки', {
          description: errorMessage,
          duration: 3000
        });
      }
      
      console.error('Ошибка создания карточки:', err);
      throw err;
    }
  }, [sessionId, broadcastCardChange]);

  const updateCard = useCallback(async (cardId: string, updates: UpdateCardData) => {
    try {
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
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления карточки';
      toast.error('Ошибка обновления', {
        description: errorMessage,
        duration: 3000
      });
      console.error('Ошибка обновления карточки:', err);
      throw err;
    }
  }, [broadcastCardChange]);

  const deleteCard = useCallback(async (cardId: string) => {
    try {
      await cardsApi.deleteCard(cardId);
      
      // Обновляем локальное состояние
      setCards(prev => prev.filter(card => card.id !== cardId));
      
      // Отправляем изменение другим пользователям
      broadcastCardChange({
        type: 'deleted',
        cardId
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка удаления карточки';
      toast.error('Ошибка удаления', {
        description: errorMessage,
        duration: 3000
      });
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
      
    } catch (err) {
      // В случае ошибки, откатываем изменения
      await fetchCards();
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления позиции';
      console.error('Ошибка обновления позиции:', err);
      // Не показываем toast для ошибок позиционирования, т.к. они обычно временные
    }
  }, [fetchCards, broadcastCardChange]);

  const updateCardHeight = useCallback(async (cardId: string, height: number) => {
    try {
      // Оптимистично обновляем UI
      setCards(prev =>
        prev.map(card =>
          card.id === cardId ? { ...card, height } : card
        )
      );

      // Отправляем изменение другим пользователям сразу (для плавности)
      broadcastCardChange({
        type: 'resized',
        cardId,
        height
      });

      // Отправляем обновление на сервер
      await cardsApi.updateCard(cardId, { height });
      
    } catch (err) {
      // В случае ошибки, откатываем изменения
      await fetchCards();
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления размера';
      console.error('Ошибка обновления размера:', err);
      // Не показываем toast для ошибок изменения размера, т.к. они обычно временные
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
      
    } catch (err) {
      // В случае ошибки, откатываем изменения
      await fetchCards();
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления позиций';
      console.error('Ошибка обновления позиций:', err);
      // Не показываем toast для ошибок позиционирования, т.к. они обычно временные
    }
  }, [fetchCards, broadcastCardChange]);

  const refetch = useCallback(async () => {
    await fetchCards();
  }, [fetchCards]);

  return {
    cards,
    loading,
    isRealtimeConnected,
    createCard,
    updateCard,
    deleteCard,
    updateCardPosition,
    updateCardHeight,
    updateMultiplePositions,
    refetch,
  };
}
