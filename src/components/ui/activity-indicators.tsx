'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Users, Wifi, WifiOff } from 'lucide-react'

interface User {
  id: string
  name: string
  color: string
  lastSeen?: Date
}

interface TypingUser {
  userId: string
  userName: string
  userColor: string
  cardId: string
  timestamp: number
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[]
  cardId: string
}

export function TypingIndicator({ typingUsers, cardId }: TypingIndicatorProps) {
  const usersTypingOnCard = typingUsers.filter(user => user.cardId === cardId)
  
  if (usersTypingOnCard.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute -bottom-8 left-0 flex items-center gap-1 text-xs text-muted-foreground"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="flex gap-1"
        >
          <div className="w-1 h-1 bg-primary rounded-full" />
          <div className="w-1 h-1 bg-primary rounded-full animation-delay-200" />
          <div className="w-1 h-1 bg-primary rounded-full animation-delay-400" />
        </motion.div>
        <span>
          {usersTypingOnCard.length === 1 
            ? `${usersTypingOnCard[0].userName} печатает...`
            : `${usersTypingOnCard.length} человек печатают...`
          }
        </span>
      </motion.div>
    </AnimatePresence>
  )
}

interface ParticipantsListProps {
  participants: User[]
  currentUserId: string
}

export function ParticipantsList({ participants, currentUserId }: ParticipantsListProps) {
  const activeCount = participants.length

  return (
    <Card className="fixed top-4 right-4 p-3 bg-background/95 backdrop-blur-sm border shadow-lg z-50">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-4 h-4 text-muted-foreground" />
        <Badge variant="secondary" className="text-xs">
          {activeCount} участник{activeCount === 1 ? '' : activeCount < 5 ? 'а' : 'ов'}
        </Badge>
      </div>
      
      <div className="space-y-2 max-w-48">
        <AnimatePresence>
          {participants.map((participant) => (
            <motion.div
              key={participant.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-2"
            >
              <div className="relative">
                <Avatar className="w-6 h-6" style={{ backgroundColor: participant.color }}>
                  <AvatarFallback className="text-xs text-white">
                    {participant.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">
                  {participant.id === currentUserId ? 'Вы' : participant.name}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Wifi className="w-3 h-3" />
                  <span>онлайн</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  )
}

interface ActivityStatusProps {
  isOnline: boolean
  isTyping?: boolean
  lastSeen?: Date
}

export function ActivityStatus({ isOnline, isTyping, lastSeen }: ActivityStatusProps) {
  if (isTyping) {
    return (
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1 }}
        className="flex items-center gap-1 text-xs text-orange-500"
      >
        <div className="w-2 h-2 bg-orange-500 rounded-full" />
        <span>печатает</span>
      </motion.div>
    )
  }

  if (isOnline) {
    return (
      <div className="flex items-center gap-1 text-xs text-green-500">
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        <span>онлайн</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <WifiOff className="w-3 h-3" />
      <span>
        {lastSeen 
          ? `был ${formatLastSeen(lastSeen)}`
          : 'офлайн'
        }
      </span>
    </div>
  )
}

interface ConnectionStatusProps {
  isConnected: boolean
  participantCount: number
}

export function ConnectionStatus({ isConnected, participantCount }: ConnectionStatusProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <Card className="p-2 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs">
          {isConnected ? (
            <>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-2 h-2 bg-green-500 rounded-full"
              />
              <span className="text-green-600">Подключено</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-red-600">Переподключение...</span>
            </>
          )}
          {participantCount > 0 && (
            <Badge variant="outline" className="ml-2 text-xs">
              {participantCount}
            </Badge>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

interface JoinLeaveToastProps {
  user: User
  action: 'joined' | 'left'
  onClose: () => void
}

export function JoinLeaveToast({ user, action, onClose }: JoinLeaveToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className="fixed bottom-16 right-4 z-50"
    >
      <Card className="p-3 bg-background/95 backdrop-blur-sm border shadow-lg">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8" style={{ backgroundColor: user.color }}>
            <AvatarFallback className="text-white">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="text-sm font-medium">
              {user.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {action === 'joined' ? 'присоединился к доске' : 'покинул доску'}
            </div>
          </div>
          
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5 }}
            className={`w-2 h-2 rounded-full ${
              action === 'joined' ? 'bg-green-500' : 'bg-orange-500'
            }`}
          />
        </div>
      </Card>
    </motion.div>
  )
}

// Утилиты
function formatLastSeen(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  
  if (diffMins < 1) return 'только что'
  if (diffMins < 60) return `${diffMins} мин назад`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} ч назад`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} д назад`
}

// CSS для анимации точек
const styles = `
  @keyframes typing-dots {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-10px); }
  }
  
  .animation-delay-200 {
    animation-delay: 200ms;
  }
  
  .animation-delay-400 {
    animation-delay: 400ms;
  }
`

// Добавляем стили в head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}