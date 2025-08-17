import { supabase } from '../supabase';
import type { Session, CreateSessionData } from '../types/board';

export const sessionsApi = {
  /**
   * Получить сессию по ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    console.log('Attempting to fetch session:', sessionId);
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    console.log('Supabase response:', { data, error });

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
      createdBy: data.created_by,
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
      createdBy: data.created_by,
    };
  },

  /**
   * Обновить сессию
   */
  async updateSession(sessionId: string, updates: { title?: string }): Promise<Session> {
    const { data, error } = await supabase
      .from('sessions')
      .update(updates)
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
      createdBy: data.created_by,
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
      createdBy: data.created_by,
    };
  },

  /**
   * Получить или создать сессию
   */
  async getOrCreateSession(sessionId: string, defaultTitle: string = 'Новая сессия'): Promise<Session> {
    console.log('getOrCreateSession called with sessionId:', sessionId);
    
    // Сначала пытаемся получить существующую сессию
    const existingSession = await this.getSession(sessionId);
    
    if (existingSession) {
      console.log('Found existing session:', existingSession);
      return existingSession;
    }

    console.log('Session not found, creating new session...');
    // Если сессии нет, создаем новую с указанным ID
    return this.createSessionWithId(sessionId, {
      title: defaultTitle,
      createdBy: null, // Пока без авторизации
    });
  },
};