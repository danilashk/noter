'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, ArrowRight } from 'lucide-react'

interface JoinSessionDialogProps {
  sessionTitle: string
  onJoin: (name: string) => Promise<void>
}

export function JoinSessionDialog({ sessionTitle, onJoin }: JoinSessionDialogProps) {
  const [name, setName] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Пожалуйста, введите ваше имя')
      return
    }

    if (name.trim().length > 50) {
      setError('Имя не должно превышать 50 символов')
      return
    }

    setIsJoining(true)
    setError(null)

    try {
      await onJoin(name.trim())
    } catch (error) {
      console.error('Ошибка присоединения:', error)
      setError('Не удалось присоединиться к сессии. Попробуйте еще раз.')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 w-full max-w-md"
      >
        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Присоединиться к сессии
          </h1>
          <p className="text-gray-600">
            {sessionTitle}
          </p>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Ваше имя
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите ваше имя"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              maxLength={50}
              disabled={isJoining}
              autoFocus
            />
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 mt-2"
              >
                {error}
              </motion.p>
            )}
          </div>

          <button
            type="submit"
            disabled={isJoining || !name.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isJoining ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Присоединение...
              </>
            ) : (
              <>
                Войти в сессию
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Подсказка */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 После входа вы сможете создавать карточки, видеть курсоры других участников и работать в режиме реального времени.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
