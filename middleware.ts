import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Обрабатываем запрос на /board/new
  if (request.nextUrl.pathname === '/board/new') {
    // Генерируем уникальный ID для новой сессии
    const sessionId = crypto.randomUUID()
    
    // Перенаправляем на новую сессию
    return NextResponse.redirect(new URL(`/board/${sessionId}`, request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/board/new']
}