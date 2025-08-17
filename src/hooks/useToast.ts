'use client'

import { useState, useCallback } from 'react'

interface ToastItem {
  id: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastItem = {
      id,
      duration: 5000,
      type: 'info',
      ...toast,
    }

    setToasts(prev => [...prev, newToast])

    // Автоматически удаляем toast через duration + время анимации
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, (newToast.duration || 5000) + 500)

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastItem['type'] = 'info', duration?: number) => {
    return addToast({ message, type, duration })
  }, [addToast])

  const showSuccess = useCallback((message: string, duration?: number) => {
    return addToast({ message, type: 'success', duration })
  }, [addToast])

  const showError = useCallback((message: string, duration?: number) => {
    return addToast({ message, type: 'error', duration })
  }, [addToast])

  const showWarning = useCallback((message: string, duration?: number) => {
    return addToast({ message, type: 'warning', duration })
  }, [addToast])

  const showInfo = useCallback((message: string, duration?: number) => {
    return addToast({ message, type: 'info', duration })
  }, [addToast])

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
  }
}