import { Card } from '@/components/ui/card'

interface LoaderProps {
  message?: string
  className?: string
}

export function Loader({ message = 'Загрузка...', className }: LoaderProps) {
  return (
    <div className={`min-h-screen gradient-bg flex items-center justify-center ${className || ''}`}>
      <div className="overflow-hidden p-px relative rounded-lg w-80 aspect-square" style={{ background: 'hsl(var(--border))' }}>
        {/* Светящийся зеленый элемент */}
        <div className="absolute w-24 h-12 glow-element" style={{ zIndex: 1 }}>
        </div>
        
        {/* Карточка с содержимым */}
        <Card className="relative z-10 h-full glass-effect rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground font-medium text-lg text-center">
            {message}
          </p>
        </Card>
      </div>
    </div>
  )
}
