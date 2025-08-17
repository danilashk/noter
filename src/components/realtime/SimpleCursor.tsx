'use client'

interface SimpleCursorProps {
  x: number
  y: number
  name: string
  color: string
}

export function SimpleCursor({ x, y, name, color }: SimpleCursorProps) {
  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-75 ease-out"
      style={{ 
        left: x, 
        top: y,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Курсор */}
      <div className="relative">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className="drop-shadow-md"
        >
          <path
            d="M2 2L18 9L10 11L8 18L2 2Z"
            fill={color}
            stroke="white"
            strokeWidth="1"
          />
        </svg>
        
        {/* Имя пользователя */}
        <div
          className="absolute top-5 left-2 px-2 py-1 text-xs text-white rounded-md whitespace-nowrap font-medium drop-shadow-sm"
          style={{ backgroundColor: color }}
        >
          {name}
        </div>
      </div>
    </div>
  )
}