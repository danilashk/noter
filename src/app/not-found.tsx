'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'

export default function NotFound() {
  const router = useRouter()

  useEffect(() => {
    // Редиректим на главную страницу с параметром для показа уведомления
    const timer = setTimeout(() => {
      router.push('/?redirected=true')
    }, 100)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <Card className="p-8 glass-effect w-80 h-48">
        <div className="text-center h-full flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/20 border-t-primary mx-auto"></div>
          <p className="mt-6 text-muted-foreground">
            Перенаправление...
          </p>
        </div>
      </Card>
    </div>
  )
}
