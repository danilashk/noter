/**
 * API функции для работы с досками с поддержкой rate limiting
 */

import { supabase } from '@/lib/supabase'
import { handleRateLimitError, getUserFingerprint } from '@/lib/rate-limit'

export interface CreateBoardData {
  title: string
  description?: string
  createdBy: string
}

export interface BoardResponse {
  id: string
  title: string
  description: string | null
  created_by: string
  created_at: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: string
}

/**
 * Создает новую доску с проверкой rate limiting
 */
export async function createBoard(boardData: CreateBoardData): Promise<BoardResponse> {
  try {
    const { data, error } = await supabase.rpc('api_create_board', {
      p_title: boardData.title,
      p_created_by: boardData.createdBy,
      p_description: boardData.description || null
    })

    if (error) {
      console.error('Ошибка создания доски:', error)
      throw new Error(`Ошибка базы данных: ${error.message}`)
    }

    const response = data as ApiResponse<BoardResponse>

    if (!response.success) {
      // Обрабатываем rate limit ошибки
      if (response.code === 'BOARDS_RATE_LIMIT') {
        const rateLimitError = {
          message: response.message || 'Превышен лимит создания досок'
        }
        handleRateLimitError(rateLimitError)
        throw new Error(response.message || 'Превышен лимит создания досок')
      }
      
      throw new Error(response.message || 'Ошибка создания доски')
    }

    if (!response.data) {
      throw new Error('Некорректный ответ сервера')
    }

    return response.data
  } catch (error) {
    // Проверяем, не является ли это rate limit ошибкой от триггера
    const isHandled = handleRateLimitError(error)
    if (!isHandled) {
      console.error('Ошибка создания доски:', error)
    }
    throw error
  }
}

/**
 * Получает список досок пользователя
 */
export async function getUserBoards(createdBy: string): Promise<BoardResponse[]> {
  try {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('created_by', createdBy)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Ошибка получения досок:', error)
      throw new Error(`Ошибка получения досок: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Ошибка получения досок:', error)
    throw error
  }
}

/**
 * Получает конкретную доску
 */
export async function getBoard(boardId: string): Promise<BoardResponse | null> {
  try {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('id', boardId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Доска не найдена
        return null
      }
      console.error('Ошибка получения доски:', error)
      throw new Error(`Ошибка получения доски: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Ошибка получения доски:', error)
    throw error
  }
}

/**
 * Обновляет доску
 */
export async function updateBoard(
  boardId: string, 
  updates: Partial<Pick<BoardResponse, 'title' | 'description'>>
): Promise<BoardResponse> {
  try {
    const { data, error } = await supabase
      .from('boards')
      .update(updates)
      .eq('id', boardId)
      .select()
      .single()

    if (error) {
      console.error('Ошибка обновления доски:', error)
      throw new Error(`Ошибка обновления доски: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Ошибка обновления доски:', error)
    throw error
  }
}

/**
 * Удаляет доску
 */
export async function deleteBoard(boardId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', boardId)

    if (error) {
      console.error('Ошибка удаления доски:', error)
      throw new Error(`Ошибка удаления доски: ${error.message}`)
    }
  } catch (error) {
    console.error('Ошибка удаления доски:', error)
    throw error
  }
}

/**
 * Подписывается на изменения досок пользователя
 */
export function subscribeToUserBoards(
  createdBy: string,
  callback: (boards: BoardResponse[]) => void
) {
  return supabase
    .channel(`boards-${createdBy}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'boards',
        filter: `created_by=eq.${createdBy}`
      },
      async () => {
        // Перезагружаем все доски при любом изменении
        try {
          const boards = await getUserBoards(createdBy)
          callback(boards)
        } catch (error) {
          console.error('Ошибка при обновлении досок:', error)
        }
      }
    )
    .subscribe()
}