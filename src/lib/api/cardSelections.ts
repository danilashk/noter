import { supabase } from '../supabase';
import type { CardSelection, CreateCardSelectionData } from '../types/board';

export const cardSelectionsApi = {
  /**
   * Получить все выделения карточек для сессии
   */
  async getCardSelections(sessionId: string): Promise<CardSelection[]> {
    const { data, error } = await supabase
      .from('card_selections')
      .select('*')
      .eq('session_id', sessionId)
      .order('selected_at', { ascending: false });

    if (error) {
      throw new Error(`Ошибка загрузки выделений карточек: ${error.message}`);
    }

    return data.map(selection => ({
      id: selection.id,
      sessionId: selection.session_id,
      cardId: selection.card_id,
      selectedBy: selection.selected_by,
      selectedAt: new Date(selection.selected_at),
    }));
  },

  /**
   * Выделить карточку (создать или обновить выделение)
   */
  async selectCard(sessionId: string, selectionData: CreateCardSelectionData): Promise<CardSelection> {
    // Сначала удаляем предыдущее выделение этого участника
    await supabase
      .from('card_selections')
      .delete()
      .eq('selected_by', selectionData.selectedBy);

    // Создаем новое выделение
    const { data, error } = await supabase
      .from('card_selections')
      .insert({
        session_id: sessionId,
        card_id: selectionData.cardId,
        selected_by: selectionData.selectedBy,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Ошибка выделения карточки: ${error.message}`);
    }

    return {
      id: data.id,
      sessionId: data.session_id,
      cardId: data.card_id,
      selectedBy: data.selected_by,
      selectedAt: new Date(data.selected_at),
    };
  },

  /**
   * Снять выделение карточки
   */
  async deselectCard(participantId: string): Promise<void> {
    const { error } = await supabase
      .from('card_selections')
      .delete()
      .eq('selected_by', participantId);

    if (error) {
      throw new Error(`Ошибка снятия выделения карточки: ${error.message}`);
    }
  },

  /**
   * Подписаться на изменения выделений карточек в реальном времени
   */
  subscribeToCardSelections(sessionId: string, callback: (selections: CardSelection[]) => void) {
    const channel = supabase
      .channel(`card-selections-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'card_selections',
          filter: `session_id=eq.${sessionId}`,
        },
        async () => {
          // Перезагружаем все выделения при любом изменении
          try {
            const selections = await this.getCardSelections(sessionId);
            callback(selections);
          } catch (error) {
            console.error('Ошибка при обновлении выделений карточек:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};