'use client'

import { useState } from 'react'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'

export function RealtimeTest() {
  const [sessionId] = useState('test-session-123')
  const [userId] = useState('test-user-456') 
  const [userName] = useState('Тестовый пользователь')
  const [userColor] = useState('#3b82f6')

  const {
    isConnected,
    connectionError,
    cards,
    presenceUsers,
    createCard
  } = useRealtimeSync({
    sessionId,
    userId,
    userName,
    userColor
  })

  const handleCreateTestCard = async () => {
    try {
      await createCard('Тестовая карточка', 100, 100)
    } catch (error) {
      console.error('Ошибка создания карточки:', error)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Тест Realtime</h2>
      
      <div className="space-y-3">
        <div className={`p-3 rounded ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          Статус: {isConnected ? 'Подключен' : 'Не подключен'}
          {connectionError && <div className="text-sm mt-1">{connectionError}</div>}
        </div>

        <div className="p-3 bg-gray-100 rounded">
          <div className="text-sm font-medium">Карточки: {cards.length}</div>
          <div className="text-sm font-medium">Пользователи: {Object.keys(presenceUsers).length}</div>
        </div>

        <button
          onClick={handleCreateTestCard}
          disabled={!isConnected}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
        >
          Создать тестовую карточку
        </button>

        <div className="text-xs text-gray-500 space-y-1">
          <div>Session ID: {sessionId}</div>
          <div>User ID: {userId}</div>
        </div>
      </div>
    </div>
  )
}