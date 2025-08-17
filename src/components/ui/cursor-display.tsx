'use client'

import React from 'react'
import { Participant } from '@/hooks/useParticipants'

interface CursorPosition {
  x: number
  y: number
  timestamp: number
}

interface ParticipantCursor extends Participant {
  cursor: CursorPosition
}

interface CursorDisplayProps {
  cursors: ParticipantCursor[]
}

interface SingleCursorProps {
  participant: ParticipantCursor
}

function SingleCursor({ participant }: SingleCursorProps) {
  const { cursor, name, color } = participant

  return (
    <div
      className="fixed pointer-events-none z-50 transition-all duration-75 ease-out"
      style={{
        left: `${cursor.x}px`,
        top: `${cursor.y}px`,
        transform: 'translate(-2px, -2px)'
      }}
    >
      {/* Курсор */}
      <div className="relative">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          {/* Тень курсора */}
          <path
            d="M3 3L17 8L10 10L8 17L3 3Z"
            fill="rgba(0, 0, 0, 0.2)"
            transform="translate(1, 1)"
          />
          {/* Основной курсор */}
          <path
            d="M3 3L17 8L10 10L8 17L3 3Z"
            fill={color}
            stroke="white"
            strokeWidth="1"
          />
        </svg>
        
        {/* Имя участника */}
        <div
          className="absolute top-5 left-3 px-2 py-1 text-xs font-medium text-white rounded shadow-lg whitespace-nowrap"
          style={{ backgroundColor: color }}
        >
          {name}
        </div>
      </div>
    </div>
  )
}

export function CursorDisplay({ cursors }: CursorDisplayProps) {
  return (
    <>
      {cursors.map((cursor) => (
        <SingleCursor
          key={cursor.id}
          participant={cursor}
        />
      ))}
    </>
  )
}

export default CursorDisplay