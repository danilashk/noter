/**
 * Компонент индикатора rate limiting
 * Показывает текущий статус лимитов пользователя
 */

import { useState } from 'react'
import { AlertTriangle, Clock, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { useRateLimit } from '@/hooks/use-rate-limit'
import { formatTimeUntilReset } from '@/lib/rate-limit'
import { cn } from '@/lib/utils'

interface RateLimitIndicatorProps {
  className?: string
  showDetails?: boolean
  compact?: boolean
}

export function RateLimitIndicator({ 
  className, 
  showDetails = false,
  compact = false 
}: RateLimitIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(showDetails)
  const { limits, isLoading, getLimitUsage, isLimitNearExhaustion } = useRateLimit({
    enableAutoRefresh: true,
    refreshInterval: 5000
  })

  if (isLoading || limits.length === 0) {
    return null
  }

  const cardLimit = limits.find(l => l.action_type === 'create_card')
  const boardLimit = limits.find(l => l.action_type === 'create_board')

  const cardUsage = getLimitUsage('create_card')
  const boardUsage = getLimitUsage('create_board')

  const isCardLimitHigh = isLimitNearExhaustion('create_card', 80)
  const isBoardLimitHigh = isLimitNearExhaustion('create_board', 80)

  const hasWarnings = isCardLimitHigh || isBoardLimitHigh

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-2",
                hasWarnings && "text-orange-600 hover:text-orange-700",
                className
              )}
            >
              <Clock className="h-4 w-4" />
              {hasWarnings && <AlertTriangle className="h-3 w-3 ml-1" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2 text-sm">
              {cardLimit && (
                <div className="flex justify-between items-center">
                  <span>Карточки:</span>
                  <Badge variant={isCardLimitHigh ? "destructive" : "secondary"}>
                    {cardLimit.current_count}/{cardLimit.limit_value}
                  </Badge>
                </div>
              )}
              {boardLimit && (
                <div className="flex justify-between items-center">
                  <span>Доски:</span>
                  <Badge variant={isBoardLimitHigh ? "destructive" : "secondary"}>
                    {boardLimit.current_count}/{boardLimit.limit_value}
                  </Badge>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Лимиты использования
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-auto"
          >
            <Info className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Лимит карточек */}
        {cardLimit && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Создание карточек</span>
              <Badge variant={isCardLimitHigh ? "destructive" : "secondary"}>
                {cardLimit.current_count}/{cardLimit.limit_value}
              </Badge>
            </div>
            
            <Progress 
              value={cardUsage} 
              className={cn(
                "h-2",
                cardUsage >= 90 && "bg-red-100",
                cardUsage >= 80 && cardUsage < 90 && "bg-orange-100"
              )}
            />
            
            {isExpanded && (
              <div className="text-xs text-muted-foreground">
                Лимит: 10 карточек за 5 секунд
                {cardLimit.time_until_reset > 0 && (
                  <span className="block">
                    Сброс через: {formatTimeUntilReset(cardLimit.time_until_reset)}
                  </span>
                )}
              </div>
            )}
            
            {isCardLimitHigh && (
              <div className="flex items-start gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>
                  Приближение к лимиту. Осталось {cardLimit.limit_value - cardLimit.current_count} карточек.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Лимит досок */}
        {boardLimit && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Создание досок</span>
              <Badge variant={isBoardLimitHigh ? "destructive" : "secondary"}>
                {boardLimit.current_count}/{boardLimit.limit_value}
              </Badge>
            </div>
            
            <Progress 
              value={boardUsage} 
              className={cn(
                "h-2",
                boardUsage >= 90 && "bg-red-100",
                boardUsage >= 80 && boardUsage < 90 && "bg-orange-100"
              )}
            />
            
            {isExpanded && (
              <div className="text-xs text-muted-foreground">
                Лимит: 50 досок за час
                {boardLimit.time_until_reset > 0 && (
                  <span className="block">
                    Сброс через: {formatTimeUntilReset(boardLimit.time_until_reset)}
                  </span>
                )}
              </div>
            )}
            
            {isBoardLimitHigh && (
              <div className="flex items-start gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>
                  Приближение к лимиту. Осталось {boardLimit.limit_value - boardLimit.current_count} досок.
                </span>
              </div>
            )}
          </div>
        )}

        {isExpanded && (
          <div className="text-xs text-muted-foreground border-t pt-3">
            <p>Лимиты предотвращают спам и обеспечивают стабильную работу сервиса.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}