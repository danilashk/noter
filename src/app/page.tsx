'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Автоматически перенаправляем на создание новой сессии
    router.replace('/board/new')
  }, [router])

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <Card className="p-8 glass-effect glow-effect">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/30 border-t-primary mx-auto"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-secondary animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-muted-foreground">Создание новой сессии...</p>
          <div className="mt-3 text-xs text-muted-foreground/60">
            Подготавливаем творческое пространство
          </div>
        </div>
      </Card>
    </div>
  )
}
