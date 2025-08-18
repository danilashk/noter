/**
 * Индикатор статуса синхронизации
 */

import { Wifi, WifiOff, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SyncIndicatorProps {
  syncStatus: 'connected' | 'connecting' | 'disconnected'
  isOnline: boolean
  className?: string
}

export function SyncIndicator({ syncStatus, isOnline, className }: SyncIndicatorProps) {
  const getIcon = () => {
    if (!isOnline) {
      return <WifiOff className="w-4 h-4" />
    }
    
    switch (syncStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />
      case 'connecting':
        return <RotateCcw className="w-4 h-4 text-primary animate-spin" />
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-500" />
    }
  }

  const getText = () => {
    if (!isOnline) {
      return 'Нет сети'
    }
    
    switch (syncStatus) {
      case 'connected':
        return 'Синхронизировано'
      case 'connecting':
        return 'Подключение...'
      case 'disconnected':
        return 'Не подключено'
    }
  }

  const getStatusColor = () => {
    if (!isOnline || syncStatus === 'disconnected') {
      return 'text-red-600'
    }
    
    switch (syncStatus) {
      case 'connected':
        return 'text-green-600'
      case 'connecting':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm border text-sm',
      getStatusColor(),
      className
    )}>
      {getIcon()}
      <span>{getText()}</span>
    </div>
  )
}
