'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/useToast'
import { ToastManager } from '@/components/ui/toast'
import { Loader } from '@/components/ui/loader'

function BoardRedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toasts, showError, removeToast } = useToast()
  const [hasShownError, setHasShownError] = useState(false)

  useEffect(() => {
    const invite = searchParams.get('invite')
    const error = searchParams.get('error')
    
    if (error === '404') {
      // Кейс 3: 404 ошибка - показываем toast и создаем новую доску
      if (!hasShownError) {
        showError('Данная страница не была найдена. Создаем новую доску.', 6000)
        setHasShownError(true)
      }
      setTimeout(() => {
        router.replace('/board/new')
      }, 1000)
    } else if (invite) {
      // Кейс 2: Приглашение по ID
      // Валидируем UUID
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invite)
      
      if (isValidUUID) {
        router.replace(`/board/${invite}`)
      } else {
        // Некорректный ID приглашения - показываем ошибку и редиректим на новую доску
        if (!hasShownError) {
          showError('Данная страница не была найдена. Создаем новую доску.', 6000)
          setHasShownError(true)
        }
        setTimeout(() => {
          router.replace('/board/new')
        }, 1000)
      }
    } else {
      // Кейс 1: Новая страница
      router.replace('/board/new')
    }
  }, [router, searchParams, showError, hasShownError])

  return (
    <>
      <Loader message="Перенаправление..." />
      
      {/* Toast уведомления */}
      <ToastManager toasts={toasts} onRemoveToast={removeToast} />
    </>
  )
}

export default function BoardRedirectPage() {
  return (
    <Suspense fallback={<Loader message="Загрузка..." />}>
      <BoardRedirectContent />
    </Suspense>
  )
}
