'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader } from '@/components/ui/loader'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Простое перенаправление на создание новой сессии
    const timer = setTimeout(() => {
      router.replace('/board/new')
    }, 100)

    return () => clearTimeout(timer)
  }, [router])

  return <Loader message="Загрузка..." />
}
