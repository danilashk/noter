import { supabase } from '../supabase';
import type { DrawingLine, CreateDrawingLineData } from '../types/board';

export const drawingApi = {
  /**
   * Получить все линии рисования для сессии
   */
  async getDrawingLines(sessionId: string): Promise<DrawingLine[]> {
    const { data, error } = await supabase
      .from('drawing_lines')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('🎨 API: Ошибка загрузки линий:', error);
      throw new Error(`Ошибка загрузки линий рисования: ${error.message}`);
    }

    return data.map(line => ({
      id: line.id,
      sessionId: line.session_id,
      points: line.points,
      color: line.color,
      createdBy: line.created_by,
      createdAt: new Date(line.created_at),
    }));
  },

  /**
   * Создать новую линию рисования
   */
  async createDrawingLine(sessionId: string, lineData: CreateDrawingLineData): Promise<DrawingLine> {
    const { data, error } = await supabase
      .from('drawing_lines')
      .insert({
        session_id: sessionId,
        points: lineData.points,
        color: lineData.color,
        created_by: lineData.createdBy,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Ошибка создания линии рисования: ${error.message}`);
    }

    return {
      id: data.id,
      sessionId: data.session_id,
      points: data.points,
      color: data.color,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
    };
  },

  /**
   * Удалить линию рисования
   */
  async deleteDrawingLine(lineId: string): Promise<void> {
    const { error } = await supabase
      .from('drawing_lines')
      .delete()
      .eq('id', lineId);

    if (error) {
      throw new Error(`Ошибка удаления линии рисования: ${error.message}`);
    }
  },

  /**
   * Подписаться на изменения линий рисования в реальном времени
   */
  subscribeToDrawingLines(sessionId: string, callback: (lines: DrawingLine[]) => void) {
    const channel = supabase
      .channel(`drawing-lines-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drawing_lines',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          // Перезагружаем все линии при любом изменении
          try {
            const lines = await drawingApi.getDrawingLines(sessionId);
            callback(lines);
          } catch (error) {
            console.error('Ошибка при обновлении линий рисования:', error);
          }
        }
      )
      .subscribe((status) => {
        });

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
