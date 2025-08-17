import { supabase } from '../supabase';
import type { Card, CreateCardData, UpdateCardData } from '../types/board';

export const cardsApi = {
  /**
   * Получить все карточки для сессии
   */
  async getCardsBySession(sessionId: string): Promise<Card[]> {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Ошибка загрузки карточек: ${error.message}`);
    }

    return data.map(card => ({
      id: card.id,
      content: card.content,
      position: { x: card.position_x, y: card.position_y },
      height: card.height || 120,
      createdAt: new Date(card.created_at),
      updatedAt: new Date(card.updated_at),
      createdBy: card.created_by,
    }));
  },

  /**
   * Создать новую карточку
   */
  async createCard(sessionId: string, cardData: CreateCardData): Promise<Card> {
    const { data, error } = await supabase
      .from('cards')
      .insert({
        session_id: sessionId,
        content: cardData.content,
        position_x: cardData.position.x,
        position_y: cardData.position.y,
        height: cardData.height || 120,
        created_by: cardData.createdBy,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Ошибка создания карточки: ${error.message}`);
    }

    return {
      id: data.id,
      content: data.content,
      position: { x: data.position_x, y: data.position_y },
      height: data.height || 120,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by,
    };
  },

  /**
   * Обновить карточку
   */
  async updateCard(cardId: string, updates: UpdateCardData): Promise<Card> {
    const updateData: Record<string, unknown> = {};
    
    if (updates.content !== undefined) {
      updateData.content = updates.content;
    }
    
    if (updates.position !== undefined) {
      updateData.position_x = updates.position.x;
      updateData.position_y = updates.position.y;
    }
    
    if (updates.height !== undefined) {
      updateData.height = updates.height;
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('cards')
      .update(updateData)
      .eq('id', cardId)
      .select()
      .single();

    if (error) {
      throw new Error(`Ошибка обновления карточки: ${error.message}`);
    }

    return {
      id: data.id,
      content: data.content,
      position: { x: data.position_x, y: data.position_y },
      height: data.height || 120,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by,
    };
  },

  /**
   * Удалить карточку
   */
  async deleteCard(cardId: string): Promise<void> {
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', cardId);

    if (error) {
      throw new Error(`Ошибка удаления карточки: ${error.message}`);
    }
  },

  /**
   * Обновить позиции нескольких карточек (для drag & drop)
   */
  async updateCardPositions(updates: Array<{ id: string; position: { x: number; y: number } }>): Promise<void> {
    const promises = updates.map(update =>
      supabase
        .from('cards')
        .update({
          position_x: update.position.x,
          position_y: update.position.y,
          updated_at: new Date().toISOString(),
        })
        .eq('id', update.id)
    );

    const results = await Promise.all(promises);
    
    for (const result of results) {
      if (result.error) {
        throw new Error(`Ошибка обновления позиций: ${result.error.message}`);
      }
    }
  },
};
