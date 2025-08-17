import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            🧠 Live Brainstorm
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Интерактивная realtime доска для мозгового штурма с AI-ассистентом
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
            Создавайте идеи вместе в реальном времени, видьте курсоры коллег и получайте умные предложения от AI
          </p>
          
          <Link href="/board/new">
            <Button size="lg" className="text-lg px-8 py-4">
              🚀 Начать сессию
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚡ Instant Start
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Никакой регистрации - просто открыл и создал сессию. Поделился ссылкой - и команда уже работает вместе.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔄 Realtime Коллаборация
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Live курсоры, мгновенная синхронизация, присутствие участников и typing индикаторы.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🤖 AI-Ассистент
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Одним кликом улучшай свои идеи через Perplexity. Умные предложения и контекстные улучшения.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📱 Современный UX
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Адаптивный дизайн, плавные анимации, touch поддержка, темная/светлая тема.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎯 Простота
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Double-click создает карточку, drag&drop перемещает, escape сохраняет. Интуитивно понятно.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🚀 Быстро
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Next.js 15, Supabase Realtime, мгновенная синхронизация между участниками.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Готов начать мозговой штурм?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Создай сессию за секунду и пригласи команду
          </p>
          <Link href="/board/new">
            <Button size="lg" variant="outline" className="text-lg px-8 py-4">
              Создать доску
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}