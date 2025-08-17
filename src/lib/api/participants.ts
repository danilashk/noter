import { supabase } from '../supabase';
import type { Participant, CreateParticipantData } from '../types/board';
import { getNextAvailableColor, isParticipantLimitReached } from '../colors';

export const participantsApi = {
  /**
   * Получить всех участников сессии
   */
  async getParticipantsBySession(sessionId: string): Promise<Participant[]> {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('session_id', sessionId)
      .order('joined_at', { ascending: true });

    if (error) {
      throw new Error(`Ошибка загрузки участников: ${error.message}`);
    }

    return data.map(participant => ({
      id: participant.id,
      sessionId: participant.session_id,
      name: participant.name,
      color: participant.color,
      lastSeen: new Date(participant.last_seen),
      joinedAt: new Date(participant.joined_at),
      user_fingerprint: participant.user_fingerprint, // Добавляем fingerprint
      display_name: participant.display_name,
    }));
  },

  /**
   * Добавить участника в сессию
   */
  async addParticipant(sessionId: string, participantData: CreateParticipantData): Promise<Participant> {
    // Получаем всех активных участников для проверки занятых цветов
    const existingParticipants = await this.getParticipantsBySession(sessionId);
    const usedColors = existingParticipants.map(p => p.color);
    
    // Проверяем лимит участников
    if (isParticipantLimitReached(existingParticipants.length)) {
      throw new Error('Достигнут максимальный лимит участников (6 человек)');
    }
    
    // Назначаем следующий доступный цвет
    const assignedColor = getNextAvailableColor(usedColors);
    if (!assignedColor) {
      throw new Error('Нет доступных цветов для нового участника');
    }

    const { data, error } = await supabase
      .from('participants')
      .insert({
        session_id: sessionId,
        name: participantData.name,
        color: assignedColor, // Используем автоматически назначенный цвет
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Ошибка добавления участника: ${error.message}`);
    }

    return {
      id: data.id,
      sessionId: data.session_id,
      name: data.name,
      color: data.color,
      lastSeen: new Date(data.last_seen),
      joinedAt: new Date(data.joined_at),
    };
  },

  /**
   * Обновить время последней активности участника
   */
  async updateLastSeen(participantId: string): Promise<void> {
    const { error } = await supabase
      .from('participants')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', participantId);

    if (error) {
      throw new Error(`Ошибка обновления активности: ${error.message}`);
    }
  },

  /**
   * Удалить участника из сессии
   */
  async removeParticipant(participantId: string): Promise<void> {
    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', participantId);

    if (error) {
      throw new Error(`Ошибка удаления участника: ${error.message}`);
    }
  },

  /**
   * Получить активных участников (онлайн в последние 5 минут)
   */
  async getActiveParticipants(sessionId: string): Promise<Participant[]> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('session_id', sessionId)
      .gte('last_seen', fiveMinutesAgo)
      .order('last_seen', { ascending: false });

    if (error) {
      throw new Error(`Ошибка загрузки активных участников: ${error.message}`);
    }

    return data.map(participant => ({
      id: participant.id,
      sessionId: participant.session_id,
      name: participant.name,
      color: participant.color,
      lastSeen: new Date(participant.last_seen),
      joinedAt: new Date(participant.joined_at),
    }));
  },

  /**
   * Получить участника по ID
   */
  async getParticipant(participantId: string): Promise<Participant | null> {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Участник не найден
        return null;
      }
      throw new Error(`Ошибка загрузки участника: ${error.message}`);
    }

    return {
      id: data.id,
      sessionId: data.session_id,
      name: data.name,
      color: data.color,
      lastSeen: new Date(data.last_seen),
      joinedAt: new Date(data.joined_at),
    };
  },

  /**
   * Обновить активность участника
   */
  async updateActivity(participantId: string): Promise<void> {
    const { error } = await supabase
      .from('participants')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', participantId);

    if (error) {
      throw new Error(`Ошибка обновления активности: ${error.message}`);
    }
  },

  /**
   * Найти или создать участника по имени в сессии
   */
  async getOrCreateParticipant(sessionId: string, name: string): Promise<Participant> {
    // Сначала ищем существующего участника
    const { data: existing } = await supabase
      .from('participants')
      .select('*')
      .eq('session_id', sessionId)
      .eq('name', name)
      .single();

    if (existing) {
      // Обновляем время последней активности
      await this.updateLastSeen(existing.id);
      
      return {
        id: existing.id,
        sessionId: existing.session_id,
        name: existing.name,
        color: existing.color,
        lastSeen: new Date(),
        joinedAt: new Date(existing.joined_at),
      };
    }

    // Создаем нового участника (цвет назначается автоматически)
    return this.addParticipant(sessionId, { name, color: '' }); // цвет будет переопределен в addParticipant
  },
};
