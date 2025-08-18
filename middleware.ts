import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  
  // Обрабатываем запрос на /board/new - создаем новую сессию
  if (pathname === '/board/new') {
    const sessionId = crypto.randomUUID()
    return NextResponse.redirect(new URL(`/board/${sessionId}`, request.url))
  }
  
  // Обрабатываем /board и /board/ - перенаправляем на страницу с логикой
  if (pathname === '/board' || pathname === '/board/') {
    // Передаем query параметры (например, ?invite=uuid) через redirect на /board/ 
    return NextResponse.redirect(new URL(`/board/${search}`, request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/board', '/board/', '/board/new']
}
