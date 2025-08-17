'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRightOnRectangleIcon, 
  SparklesIcon, 
  UsersIcon 
} from '@heroicons/react/24/outline';

interface ParticipantDialogProps {
  isOpen: boolean;
  onJoin: (name: string) => Promise<void>;
  sessionTitle?: string;
}

export function ParticipantDialog({ isOpen, onJoin, sessionTitle }: ParticipantDialogProps) {
  const [name, setName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (!name.trim()) return;

    try {
      setIsJoining(true);
      await onJoin(name.trim());
    } catch (error) {
      console.error('Ошибка присоединения:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      handleJoin();
    }
  };

  return (
    <div className="fixed inset-0 gradient-bg backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-effect">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
              <UsersIcon className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="text-2xl font-semibold mb-2">
              Присоединиться к сессии
            </h2>
            
            {sessionTitle && (
              <Badge variant="secondary" className="mb-2">
                <SparklesIcon className="w-3 h-3 mr-1" />
                {sessionTitle}
              </Badge>
            )}
            
            <p className="text-sm text-muted-foreground">
              Введите ваше имя для участия в brainstorming.<br/>
              Цвет будет назначен автоматически
            </p>
          </div>
          
          {/* Form */}
          <Card className="p-4 space-y-4 bg-muted/30 border-border/40">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Ваше имя
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Например: Анна К."
                className="input-field"
                autoFocus
              />
            </div>
          </Card>

          {/* Footer */}
          <div className="mt-6">
            <button
              onClick={handleJoin}
              disabled={!name.trim() || isJoining}
              className="w-full btn-primary inline-flex items-center justify-center gap-2 text-lg px-6 py-3"
            >
              {isJoining ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Присоединяемся...
                </>
              ) : (
                <>
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  Присоединиться к команде
                </>
              )}
            </button>
            
            <p className="text-xs text-muted-foreground/60 text-center mt-3">
              Начните создавать идеи вместе в реальном времени
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
