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
  isNewSession?: boolean;
  participantCount?: number;
  activeParticipantCount?: number;
}

export function ParticipantDialog({ 
  isOpen, 
  onJoin, 
  sessionTitle, 
  isNewSession = false, 
  participantCount, 
  activeParticipantCount 
}: ParticipantDialogProps) {
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
              {isNewSession ? (
                <SparklesIcon className="w-8 h-8 text-primary" />
              ) : (
                <UsersIcon className="w-8 h-8 text-primary" />
              )}
            </div>
            
            <h2 className="text-2xl font-semibold mb-2">
              {isNewSession ? 'Создание новой доски' : 'Присоединиться к доске'}
            </h2>
            
            {!isNewSession && (participantCount !== undefined) && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 text-center">
                  Количество участников: {participantCount}
                </p>
              </div>
            )}
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
              className="w-full btn-primary text-lg px-6 py-3 text-center"
            >
              {isJoining ? (
                isNewSession ? 'Создаем доску...' : 'Присоединяемся...'
              ) : (
                isNewSession ? 'Создать доску' : 'Присоединиться к команде'
              )}
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-5">
              {isNewSession 
                ? 'Штурмуйте идеи в реальном времени с коллегами'
                : 'Начните создавать идеи вместе в реальном времени'
              }
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
