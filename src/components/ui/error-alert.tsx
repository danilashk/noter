/**
 * Компонент для отображения ошибок
 */

import { AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorAlertProps {
  error: string
  onDismiss?: () => void
  className?: string
}

export function ErrorAlert({ error, onDismiss, className }: ErrorAlertProps) {
  return (
    <div className={cn(
      'bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3',
      className
    )}>
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      
      <div className="flex-1">
        <p className="text-sm text-red-800">{error}</p>
      </div>
      
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}