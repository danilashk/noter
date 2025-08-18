import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Participant } from '../lib/types/board';

interface ParticipantBroadcastData {
  type: 'joined' | 'left';
  participant: Participant;
}

export function useParticipantsBroadcast(
  sessionId: string,
  currentUserId: string | null,
  onParticipantChange: (data: ParticipantBroadcastData) => void
) {
  const channelRef = useRef<any>(null);
  const isConnectedRef = useRef(false);

  const broadcastParticipantChange = useCallback((data: ParticipantBroadcastData) => {
    if (!channelRef.current || !currentUserId) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'participant_change',
      payload: {
        userId: currentUserId,
        sessionId,
        ...data
      }
    });
  }, [sessionId, currentUserId]);

  useEffect(() => {
    if (!sessionId || !currentUserId) {
      return;
    }

    // Создаем канал для broadcast участников
    const channel = supabase.channel(`participants_${sessionId}`, {
      config: {
        broadcast: { self: false }, // Не получаем свои собственные сообщения
      },
    });

    channelRef.current = channel;

    // Подписываемся на изменения участников
    channel.on('broadcast', { event: 'participant_change' }, (payload) => {
      const data = payload.payload as ParticipantBroadcastData & { userId: string; sessionId: string };
      
      // Игнорируем сообщения от самого себя и из других сессий
      if (data.userId === currentUserId || data.sessionId !== sessionId) {
        return;
      }

      onParticipantChange(data);
    });

    // Подписываемся на канал
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        isConnectedRef.current = true;
      } else {
        isConnectedRef.current = false;
      }
    });

    return () => {
      isConnectedRef.current = false;
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [sessionId, currentUserId, onParticipantChange]);

  return {
    broadcastParticipantChange,
    isConnected: isConnectedRef.current,
  };
}