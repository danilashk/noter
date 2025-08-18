'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ToastProps {
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
  onClose?: () => void
}

export function Toast({ message, type = 'info', duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Показываем toast с небольшой задержкой для анимации
    const showTimer = setTimeout(() => setIsVisible(true), 100)
    
    // Автоматически скрываем через duration
    const hideTimer = setTimeout(() => {
      setIsLeaving(true)
      setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, 300) // время для анимации исчезновения
    }, duration)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [duration, onClose])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 300)
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-card/95 border-2 border-green-500/70 text-foreground'
      case 'warning':
        return 'bg-card/95 border-2 border-yellow-500/70 text-foreground'
      case 'error':
        return 'bg-card/95 border-2 border-red-500/70 text-foreground'
      default:
        return 'bg-card/95 border-border text-foreground'
    }
  }

  if (!isVisible && !isLeaving) return null

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-sm min-w-[300px] p-4 rounded-lg shadow-lg border backdrop-blur-sm transition-all duration-300 ease-out ${
        getTypeStyles()
      } ${
        isVisible && !isLeaving
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-2 opacity-0 scale-95'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 text-sm leading-relaxed">
          {message}
        </div>
        <button
          onClick={handleClose}
          className="opacity-70 hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

interface ToastManagerProps {
  toasts: Array<{
    id: string
    message: string
    type?: 'info' | 'success' | 'warning' | 'error'
    duration?: number
  }>
  onRemoveToast: (id: string) => void
}

export function ToastManager({ toasts, onRemoveToast }: ToastManagerProps) {
  return (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            bottom: `${16 + index * 80}px`, // Стекаем уведомления друг на друга
          }}
          className="fixed right-4 z-50"
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => onRemoveToast(toast.id)}
          />
        </div>
      ))}
    </>
  )
}
