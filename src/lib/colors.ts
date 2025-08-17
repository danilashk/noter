// Палитра ярких цветов для участников (максимум 6 человек)
export const PARTICIPANT_COLORS = [
  '#E53E3E', // Красный
  '#3182CE', // Синий  
  '#38A169', // Зеленый
  '#D69E2E', // Желтый/Золотой
  '#805AD5', // Фиолетовый
  '#DD6B20', // Оранжевый
] as const;

export type ParticipantColor = typeof PARTICIPANT_COLORS[number];

/**
 * Получить следующий доступный цвет из палитры
 */
export function getNextAvailableColor(usedColors: string[]): string | null {
  const availableColor = PARTICIPANT_COLORS.find(color => !usedColors.includes(color));
  return availableColor || null;
}

/**
 * Проверить, достигнут ли лимит участников
 */
export function isParticipantLimitReached(participantCount: number): boolean {
  return participantCount >= PARTICIPANT_COLORS.length;
}

/**
 * Получить приглушенную версию цвета для рисования
 */
export function getMutedColor(color: string): string {
  // Конвертируем hex в RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Делаем цвет более тухлым (уменьшаем насыщенность)
  const factor = 0.7; // Коэффициент затухания
  const mutedR = Math.round(r * factor + 128 * (1 - factor));
  const mutedG = Math.round(g * factor + 128 * (1 - factor));
  const mutedB = Math.round(b * factor + 128 * (1 - factor));
  
  return `rgb(${mutedR}, ${mutedG}, ${mutedB})`;
}

/**
 * Получить светлую версию цвета для фонов
 */
export function getLightColor(color: string, opacity: number = 0.1): string {
  // Конвертируем hex в RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Проверить, является ли цвет темным (для выбора цвета текста)
 */
export function isDarkColor(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Вычисляем яркость по формуле относительной яркости
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
}