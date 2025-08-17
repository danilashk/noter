import { Participant } from '../types/board';

interface StoredParticipant {
  id: string;
  name: string;
  color: string;
  sessionId: string;
  timestamp: number;
}

const PARTICIPANT_KEY = 'live-brainstorm-participant';
const STORAGE_EXPIRY = 24 * 60 * 60 * 1000; // 24 часа

export const participantStorage = {
  /**
   * Сохранить участника в localStorage
   */
  saveParticipant(sessionId: string, participant: Participant): void {
    try {
      const storedData: StoredParticipant = {
        id: participant.id,
        name: participant.name,
        color: participant.color,
        sessionId,
        timestamp: Date.now()
      };
      
      localStorage.setItem(PARTICIPANT_KEY, JSON.stringify(storedData));
      console.log('[participantStorage] Participant saved:', participant.name);
    } catch (error) {
      console.error('[participantStorage] Failed to save participant:', error);
    }
  },

  /**
   * Загрузить участника из localStorage для конкретной сессии
   */
  loadParticipant(sessionId: string): Participant | null {
    try {
      const stored = localStorage.getItem(PARTICIPANT_KEY);
      if (!stored) {
        console.log('[participantStorage] No stored participant found');
        return null;
      }

      const data: StoredParticipant = JSON.parse(stored);
      
      // Проверяем срок действия
      if (Date.now() - data.timestamp > STORAGE_EXPIRY) {
        console.log('[participantStorage] Stored participant expired');
        localStorage.removeItem(PARTICIPANT_KEY);
        return null;
      }

      // Проверяем соответствие сессии
      if (data.sessionId !== sessionId) {
        console.log('[participantStorage] Participant from different session');
        return null;
      }

      const participant: Participant = {
        id: data.id,
        name: data.name,
        color: data.color,
        sessionId: data.sessionId,
        isActive: true,
        lastSeen: new Date()
      };

      console.log('[participantStorage] Participant loaded:', participant.name);
      return participant;
    } catch (error) {
      console.error('[participantStorage] Failed to load participant:', error);
      localStorage.removeItem(PARTICIPANT_KEY);
      return null;
    }
  },

  /**
   * Удалить сохраненного участника
   */
  clearParticipant(): void {
    try {
      localStorage.removeItem(PARTICIPANT_KEY);
      console.log('[participantStorage] Participant cleared');
    } catch (error) {
      console.error('[participantStorage] Failed to clear participant:', error);
    }
  },

  /**
   * Проверить есть ли сохраненный участник для сессии
   */
  hasParticipant(sessionId: string): boolean {
    const participant = this.loadParticipant(sessionId);
    return participant !== null;
  },

  /**
   * Обновить активность участника (timestamp)
   */
  updateActivity(sessionId: string): void {
    try {
      const stored = localStorage.getItem(PARTICIPANT_KEY);
      if (!stored) return;

      const data: StoredParticipant = JSON.parse(stored);
      if (data.sessionId !== sessionId) return;

      data.timestamp = Date.now();
      localStorage.setItem(PARTICIPANT_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[participantStorage] Failed to update activity:', error);
    }
  }
};