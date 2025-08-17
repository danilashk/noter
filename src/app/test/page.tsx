'use client'

import { SimpleBoardPage } from '@/app/board/[id]/SimpleBoardPage'

export default function TestPage() {
  const testSession = {
    sessionId: '00000000-0000-0000-0000-000000000001',
    userId: 'test-user-' + Math.random().toString(36).substr(2, 9),
    userName: 'Тестовый пользователь ' + Math.ceil(Math.random() * 100),
    userColor: '#' + Math.floor(Math.random()*16777215).toString(16)
  }

  return (
    <div>
      <SimpleBoardPage
        sessionId={testSession.sessionId}
        userId={testSession.userId}
        userName={testSession.userName}
        userColor={testSession.userColor}
      />
    </div>
  )
}