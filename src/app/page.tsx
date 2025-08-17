'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/useToast'
import { ToastManager } from '@/components/ui/toast'

function HomePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toasts, showWarning, removeToast } = useToast()

  useEffect(() => {
    // Проверяем, был ли пользователь перенаправлен из-за некорректного URL
    const isRedirected = searchParams.get('redirected') === 'true'
    
    if (isRedirected) {
      // Показываем уведомление о перенаправлении
      showWarning(
        'Страница не найдена. Вы были перенаправлены на главную страницу для создания новой доски.',
        6000
      )
      
      // Очищаем параметр из URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('redirected')
      window.history.replaceState({}, '', newUrl.pathname)
    }

    // Автоматически перенаправляем на создание новой сессии с небольшой задержкой
    const timer = setTimeout(() => {
      router.replace('/board/new')
    }, isRedirected ? 1000 : 100) // Больше времени если показываем уведомление

    return () => clearTimeout(timer)
  }, [router, searchParams, showWarning])

  return (
    <Suspense fallback={
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Card className="p-8 glass-effect glow-effect">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/30 border-t-primary mx-auto"></div>
            <p className="mt-6 text-muted-foreground">Загрузка...</p>
          </div>
        </Card>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}

export default function HomePage() {

  return (
    <Suspense fallback={
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Card className="p-8 glass-effect glow-effect">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/30 border-t-primary mx-auto"></div>
            <p className="mt-6 text-muted-foreground">Загрузка...</p>
          </div>
        </Card>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}
