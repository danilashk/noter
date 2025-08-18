'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader } from '@/components/ui/loader'

export default function NotFound() {
  const router = useRouter()

  useEffect(() => {
    // Редиректим на главную страницу с параметром для показа уведомления
    const timer = setTimeout(() => {
      router.push('/?redirected=true')
    }, 100)

    return () => clearTimeout(timer)
  }, [router])

  return <Loader message="Загрузка..." />
}
