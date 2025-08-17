import { supabase } from '../supabase';
import type { Session, CreateSessionData } from '../types/board';

export const sessionsApi = {
  /**
   * Получить сессию по ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      if (error.code === 'PGRST116') {
        // Сессия не найдена
        return null;
      }
      throw new Error(`Ошибка загрузки сессии: ${error.message}`);
    }

    return {
      id: data.id,
      title: data.title,
      createdAt: new Date(data.created_at),
      lastActivity: new Date(data.last_activity),
      createdBy: data.created_by,
      hasStartedBrainstorm: data.has_started_brainstorm,
    };
  },

  /**
   * Создать новую сессию
   */
  async createSession(sessionData: CreateSessionData): Promise<Session> {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        title: sessionData.title,
        created_by: sessionData.createdBy,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Ошибка создания сессии: ${error.message}`);
    }

    return {
      id: data.id,
      title: data.title,
      createdAt: new Date(data.created_at),
      lastActivity: new Date(data.last_activity),
      createdBy: data.created_by,
      hasStartedBrainstorm: data.has_started_brainstorm,
    };
  },

  /**
   * Обновить сессию
   */
  async updateSession(sessionId: string, updates: { title?: string; hasStartedBrainstorm?: boolean }): Promise<Session> {
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.hasStartedBrainstorm !== undefined) updateData.has_started_brainstorm = updates.hasStartedBrainstorm;

    const { data, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Ошибка обновления сессии: ${error.message}`);
    }

    return {
      id: data.id,
      title: data.title,
      createdAt: new Date(data.created_at),
      lastActivity: new Date(data.last_activity),
      createdBy: data.created_by,
      hasStartedBrainstorm: data.has_started_brainstorm,
    };
  },

  /**
   * Создать сессию с уникальным ID (для первого захода)
   */
  async createSessionWithId(sessionId: string, sessionData: CreateSessionData): Promise<Session> {
    const { data, error } = await supabase
      .from('sessions')
      .upsert({
        id: sessionId,
        title: sessionData.title,
        created_by: sessionData.createdBy,
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Ошибка создания/обновления сессии с ID: ${error.message}`);
    }

    return {
      id: data.id,
      title: data.title,
      createdAt: new Date(data.created_at),
      lastActivity: new Date(data.last_activity),
      createdBy: data.created_by,
      hasStartedBrainstorm: data.has_started_brainstorm,
    };
  },

  /**
   * Получить или создать сессию
   */
  async getOrCreateSession(sessionId: string, defaultTitle: string = 'Новая сессия'): Promise<Session> {
    // Сначала пытаемся получить существующую сессию
    const existingSession = await this.getSession(sessionId);
    
    if (existingSession) {
      return existingSession;
    }

    // Если сессии нет, создаем новую с указанным ID
    return this.createSessionWithId(sessionId, {
      title: defaultTitle,
      createdBy: null, // Пока без авторизации
    });
  },

  /**
   * Очистка неактивных сессий (старше 24 часов)
   */
  async cleanupInactiveSessions(): Promise<number> {
    const { data, error } = await supabase
      .rpc('cleanup_inactive_sessions');

    if (error) {
      console.error('Ошибка очистки неактивных сессий:', error);
      throw new Error(`Ошибка очистки сессий: ${error.message}`);
    }

    const deletedCount = data?.[0]?.deleted_sessions_count || 0;
    return deletedCount;
  },
};
