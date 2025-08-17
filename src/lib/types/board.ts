export interface Card {
  id: string
  content: string
  position: { x: number; y: number }
  height: number
  createdAt: Date
  updatedAt: Date
  createdBy: string | null
}

export interface CreateCardData {
  content: string
  position: { x: number; y: number }
  height?: number
  createdBy: string | null
}

export interface UpdateCardData {
  content?: string
  position?: { x: number; y: number }
  height?: number
}

export interface Session {
  id: string
  title?: string
  createdAt: Date
  lastActivity: Date
  createdBy?: string | null
  hasStartedBrainstorm?: boolean
}

export interface CreateSessionData {
  title?: string
  createdBy?: string | null
}

export interface Participant {
  id: string
  sessionId: string
  name: string
  color: string
  lastSeen: Date
  joinedAt: Date
  user_fingerprint?: string
  display_name?: string
}

export interface CreateParticipantData {
  name: string
  color?: string // Цвет теперь опциональный, назначается автоматически
}

export interface BoardState {
  panX: number
  panY: number
  scale: number
  isDragging: boolean
  dragStart: { x: number; y: number } | null
}

export interface Point {
  x: number
  y: number
}

export interface DrawingLine {
  id: string
  sessionId: string
  points: Point[]
  color: string
  createdBy: string
  createdAt: Date
}

export interface CreateDrawingLineData {
  points: Point[]
  color: string
  createdBy: string
}

export interface CardSelection {
  id: string
  sessionId: string
  cardId: string
  selectedBy: string
  selectedAt: Date
}

export interface CreateCardSelectionData {
  cardId: string
  selectedBy: string
}
