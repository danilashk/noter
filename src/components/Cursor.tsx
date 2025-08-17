import React from 'react'
import { Badge } from '@/components/ui/badge'

interface CursorProps {
  x: number
  y: number
  name: string
  color: string
}

export function Cursor({ x, y, name, color }: CursorProps) {
  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-75 ease-out"
      style={{
        left: x,
        top: y,
        transform: 'translate(-2px, -2px)',
        willChange: 'transform'
      }}
    >
      {/* Курсор */}
      <div className="relative">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="drop-shadow-sm">
          <path
            d="M0 0L20 7L8 9L7 20L0 0Z"
            fill={color}
            stroke="white"
            strokeWidth="1.5"
          />
        </svg>
        
        {/* Имя участника */}
        <Badge
          className="absolute top-5 left-3 text-xs font-medium whitespace-nowrap shadow-lg"
          style={{ 
            backgroundColor: color,
            borderColor: color,
            color: 'white'
          }}
        >
          {name}
        </Badge>
      </div>
    </div>
  )
}
