'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Users, Lightbulb, Zap } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [customSessionId, setCustomSessionId] = useState('');

  const createNewSession = () => {
    const sessionId = Math.random().toString(36).substr(2, 9);
    router.push(`/board/${sessionId}`);
  };

  const joinSession = () => {
    if (customSessionId.trim()) {
      router.push(`/board/${customSessionId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
              <Lightbulb className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Notes Taker
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Коллаборативная доска для мозгового штурма с real-time синхронизацией и AI-помощником
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <CardTitle>Команда</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Работайте вместе в режиме реального времени. Видите курсоры коллег и изменения мгновенно.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Lightbulb className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
              <CardTitle>Идеи</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Создавайте стикеры с идеями, перемещайте их по доске и группируйте для лучшей организации.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Zap className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <CardTitle>AI помощник</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Получайте улучшения и развитие ваших идей с помощью интегрированного AI помощника.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="max-w-md mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Начать новую сессию</CardTitle>
              <CardDescription className="text-center">
                Создайте новую доску и пригласите коллег
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={createNewSession} className="w-full" size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Создать сессию
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Присоединиться к сессии</CardTitle>
              <CardDescription className="text-center">
                Введите ID сессии, чтобы присоединиться к команде
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sessionId">ID сессии</Label>
                <Input
                  id="sessionId"
                  value={customSessionId}
                  onChange={(e) => setCustomSessionId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && joinSession()}
                  placeholder="Например: abc123def"
                />
              </div>
              <Button 
                onClick={joinSession} 
                disabled={!customSessionId.trim()}
                className="w-full" 
                variant="outline"
              >
                Присоединиться
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Demo hint */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            Просто начните создавать идеи — все изменения сохраняются автоматически
          </p>
        </div>
      </div>
    </div>
  );
}