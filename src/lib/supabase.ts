import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Environment check:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length
});

// Используем реальный Supabase клиент
const MOCK_MODE = false;

// Создаем мок объект с теми же методами что и Supabase
const mockSupabase = {
  from: (table: string) => {
    const mockQuery = {
      select: (columns?: string) => mockQuery,
      eq: (column: string, value: any) => mockQuery,
      neq: (column: string, value: any) => mockQuery,
      gt: (column: string, value: any) => mockQuery,
      gte: (column: string, value: any) => mockQuery,
      lt: (column: string, value: any) => mockQuery,
      lte: (column: string, value: any) => mockQuery,
      like: (column: string, value: any) => mockQuery,
      ilike: (column: string, value: any) => mockQuery,
      in: (column: string, values: any[]) => mockQuery,
      is: (column: string, value: any) => mockQuery,
      not: (column: string, operator: string, value: any) => mockQuery,
      order: (column: string, options?: any) => mockQuery,
      limit: (count: number) => mockQuery,
      range: (from: number, to: number) => mockQuery,
      single: () => Promise.resolve({ 
        data: getMockData(table, 'single'), 
        error: null 
      }),
      then: (resolve: any) => {
        const data = getMockData(table, 'list');
        return Promise.resolve({ data, error: null }).then(resolve);
      },
      // Добавляем методы операций на уровне таблицы
      insert: (data: any) => {
        const insertQuery = {
          select: (columns?: string) => insertQuery,
          single: () => Promise.resolve({ 
            data: { ...data, id: crypto.randomUUID(), created_at: new Date().toISOString() }, 
            error: null 
          }),
          then: (resolve: any) => {
            const newData = { ...data, id: crypto.randomUUID(), created_at: new Date().toISOString() };
            return Promise.resolve({ data: newData, error: null }).then(resolve);
          }
        };
        return insertQuery;
      },
      update: (data: any) => {
        const updateQuery = {
          eq: (column: string, value: any) => updateQuery,
          select: (columns?: string) => updateQuery,
          single: () => Promise.resolve({ 
            data: { ...data, id: crypto.randomUUID(), updated_at: new Date().toISOString() }, 
            error: null 
          }),
          then: (resolve: any) => {
            const updatedData = { ...data, id: crypto.randomUUID(), updated_at: new Date().toISOString() };
            return Promise.resolve({ data: updatedData, error: null }).then(resolve);
          }
        };
        return updateQuery;
      },
      delete: () => {
        const deleteQuery = {
          eq: (column: string, value: any) => deleteQuery,
          then: (resolve: any) => {
            return Promise.resolve({ data: null, error: null }).then(resolve);
          }
        };
        return deleteQuery;
      }
    };
    return mockQuery;
  },
  channel: () => ({
    on: () => ({
      subscribe: () => ({ unsubscribe: () => {} }),
    }),
  }),
};

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
  realtime: {
    params: {
      // Увеличиваем лимит событий для высокочастотных cursor updates
      eventsPerSecond: 100,
    },
    // Оптимизированные настройки для production
    heartbeatIntervalMs: 15000, // Уменьшаем heartbeat для стабильности
    reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 10000), // Быстрое переподключение
    timeout: 20000,
  },
  // Оптимизация соединений
  global: {
    headers: {
      'apikey': supabaseAnonKey,
    },
  },
});

// Вспомогательная функция для генерации моковых данных
function getMockData(table: string, type: 'single' | 'list') {
  const now = new Date().toISOString();
  
  switch (table) {
    case 'sessions':
      return type === 'single' ? {
        id: crypto.randomUUID(),
        title: 'Тестовая сессия',
        created_at: now,
        created_by: null,
      } : [{
        id: crypto.randomUUID(),
        title: 'Тестовая сессия',
        created_at: now,
        created_by: null,
      }];
      
    case 'participants':
      return type === 'single' ? {
        id: crypto.randomUUID(),
        session_id: crypto.randomUUID(),
        name: 'Тестовый участник',
        color: '#3b82f6',
        is_active: true,
        last_seen: now,
      } : [{
        id: crypto.randomUUID(),
        session_id: crypto.randomUUID(),
        name: 'Тестовый участник',
        color: '#3b82f6',
        is_active: true,
        last_seen: now,
      }];
      
    case 'cards':
      return type === 'single' ? {
        id: crypto.randomUUID(),
        session_id: crypto.randomUUID(),
        content: 'Тестовая карточка',
        position_x: 100,
        position_y: 100,
        created_by: null,
        created_at: now,
        updated_at: now,
      } : [];
      
    default:
      return type === 'single' ? {} : [];
  }
}