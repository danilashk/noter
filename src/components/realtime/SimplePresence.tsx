'use client'

import { Users } from 'lucide-react'

interface User {
  userId: string
  name: string
  color: string
  joinedAt: string
}

interface SimplePresenceProps {
  users: Record<string, User[]>
  currentUserId: string
}

export function SimplePresence({ users, currentUserId }: SimplePresenceProps) {
  const activeUsers = Object.values(users).flat().filter(user => user.userId !== currentUserId)
  const totalUsers = activeUsers.length + 1 // +1 для текущего пользователя

  return (
    <div className="fixed top-4 right-4 z-40">
      <div className="bg-white rounded-lg shadow-lg border p-3 min-w-[200px]">
        {/* Заголовок */}
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            Участники ({totalUsers})
          </span>
        </div>

        {/* Список пользователей */}
        <div className="space-y-2">
          {/* Текущий пользователь */}
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full border-2 border-gray-300"
              style={{ backgroundColor: '#22c55e' }}
            />
            <span className="text-sm text-gray-600">Вы</span>
          </div>

          {/* Другие пользователи */}
          {activeUsers.map((user) => (
            <div
              key={user.userId}
              className="flex items-center gap-2"
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: user.color }}
              />
              <span className="text-sm text-gray-600">{user.name}</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-auto" />
            </div>
          ))}
        </div>

        {/* Статус подключения */}
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">В сети</span>
          </div>
        </div>
      </div>
    </div>
  )
}