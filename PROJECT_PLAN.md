// Старая лендинговая страница - сохранена для истории
// Теперь главная страница перенаправляет на /board/new

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  ArrowRightIcon,
  BoltIcon,
  UsersIcon,
  CpuChipIcon,
  DevicePhoneMobileIcon,
  RocketLaunchIcon,
  SparklesIcon,
  TrophyIcon
} from "@heroicons/react/24/outline"

export default function OldLandingPage() {
  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-20 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <SparklesIcon className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Новый способ генерировать идеи</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Live Brainstorm
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
            Интерактивная realtime доска для мозгового штурма с AI-ассистентом.
            Создавайте идеи вместе в реальном времени.
          </p>
          
          <Link href="/board/new">
            <button className="btn-primary group inline-flex items-center gap-2 text-lg px-6 py-3">
              Начать сессию
              <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          <div className="glass-effect idea-card p-6 animate-float-up">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <BoltIcon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Instant Start</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Никакой регистрации - просто открыл и создал сессию. Поделился ссылкой - и команда уже работает.
            </p>
          </div>

          <div className="glass-effect idea-card p-6 animate-float-up" style={{ animationDelay: "0.1s" }}>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <UsersIcon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Realtime Коллаборация</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Live курсоры, мгновенная синхронизация, присутствие участников и typing индикаторы.
            </p>
          </div>

          <div className="glass-effect idea-card p-6 animate-float-up" style={{ animationDelay: "0.2s" }}>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <CpuChipIcon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">AI-Ассистент</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Одним кликом улучшай свои идеи через Perplexity. Умные предложения и контекстные улучшения.
            </p>
          </div>

          <div className="glass-effect idea-card p-6 animate-float-up" style={{ animationDelay: "0.3s" }}>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <DevicePhoneMobileIcon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Современный UX</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Адаптивный дизайн, плавные анимации, темная тема и интуитивные взаимодействия.
            </p>
          </div>

          <div className="glass-effect idea-card p-6 animate-float-up" style={{ animationDelay: "0.4s" }}>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <TrophyIcon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Достижения</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Отслеживайте прогресс, зарабатывайте достижения и мотивируйте команду к новым идеям.
            </p>
          </div>

          <div className="glass-effect idea-card p-6 animate-float-up" style={{ animationDelay: "0.5s" }}>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <RocketLaunchIcon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Быстро</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Next.js 15, Supabase Realtime, мгновенная синхронизация между участниками.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-2xl mx-auto glass-effect p-12 text-center">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <SparklesIcon className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Готовы начать мозговой штурм?
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Создайте сессию за секунду и пригласите команду к творчеству
          </p>
          
          <Link href="/board/new">
            <button className="btn-secondary group inline-flex items-center gap-2">
              Создать доску
              <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
