'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, RotateCw } from 'lucide-react'

interface ConnectionStatusProps {
  isConnected: boolean
  connectionError: string | null
  reconnectAttempts: number
}

export function ConnectionStatus({ isConnected, connectionError, reconnectAttempts }: ConnectionStatusProps) {
  if (isConnected) {
    return null // Не показываем индикатор при успешном подключении
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 z-50"
      >
        <div className="bg-white rounded-lg shadow-lg border border-red-200 p-3 flex items-center gap-3 max-w-sm">
          {/* Иконка */}
          <div className="flex-shrink-0">
            {reconnectAttempts > 0 ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <RotateCw className="w-5 h-5 text-orange-500" />
              </motion.div>
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
          </div>

          {/* Текст */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900">
              {reconnectAttempts > 0 ? 'Переподключение...' : 'Соединение потеряно'}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {connectionError || 'Проверьте интернет-соединение'}
            </div>
            {reconnectAttempts > 0 && (
              <div className="text-xs text-orange-600 mt-1">
                Попытка {reconnectAttempts}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}