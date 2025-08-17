export interface Card {
  id: string
  session_id: string
  content: string
  position_x: number
  position_y: number
  created_at: string
  updated_at: string
  created_by: string
}

export interface Session {
  id: string
  title: string
  created_at: string
  created_by: string
}

export interface Participant {
  id: string
  session_id: string
  name: string
  color: string
  last_seen: string
  joined_at: string
}

export interface CursorPosition {
  x: number
  y: number
  name: string
  color: string
}

export interface TypingStatus {
  cardId: string
  name: string
  color: string
}

export interface PresenceData {
  userId: string
  name: string
  color: string
  joinedAt: string
}