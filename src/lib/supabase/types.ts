export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string
          created_at: string
          title: string | null
          description: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          title?: string | null
          description?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string | null
          description?: string | null
        }
      }
      cards: {
        Row: {
          id: string
          session_id: string
          content: string
          position_x: number
          position_y: number
          created_at: string
          updated_at: string
          is_ai_generated: boolean
          parent_card_id: string | null
        }
        Insert: {
          id?: string
          session_id: string
          content: string
          position_x: number
          position_y: number
          created_at?: string
          updated_at?: string
          is_ai_generated?: boolean
          parent_card_id?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          content?: string
          position_x?: number
          position_y?: number
          created_at?: string
          updated_at?: string
          is_ai_generated?: boolean
          parent_card_id?: string | null
        }
      }
      participants: {
        Row: {
          id: string
          session_id: string
          user_name: string
          cursor_color: string
          last_seen: string
          is_active: boolean
        }
        Insert: {
          id?: string
          session_id: string
          user_name: string
          cursor_color: string
          last_seen?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          session_id?: string
          user_name?: string
          cursor_color?: string
          last_seen?: string
          is_active?: boolean
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
