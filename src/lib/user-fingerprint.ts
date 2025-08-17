/**
 * Система надежной идентификации пользователя без регистрации
 * Использует fingerprinting + cookies для максимальной стабильности
 */

// Генерируем уникальный отпечаток браузера
export async function generateBrowserFingerprint(): Promise<string> {
  try {
    // Собираем данные о браузере и устройстве
    const fingerprintData = [
      navigator.userAgent,
      navigator.language,
      navigator.languages?.join(',') || '',
      screen.width + 'x' + screen.height,
      screen.colorDepth.toString(),
      new Date().getTimezoneOffset().toString(),
      Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      navigator.hardwareConcurrency?.toString() || '0',
      navigator.platform,
      navigator.cookieEnabled.toString(),
      // Добавляем некоторую случайность для уникальности
      Date.now().toString()
    ].join('|');

    // Хешируем данные
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprintData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Конвертируем в hex строку
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex.substring(0, 32); // Берем первые 32 символа
  } catch (error) {
    // Fallback к простому случайному ID
    return 'fallback_' + Math.random().toString(36).substring(2, 15);
  }
}

// Работа с cookies
export function setCookie(name: string, value: string, days: number = 365) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
}

export function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// Основная функция получения стабильного User ID
export async function getStableUserId(): Promise<string> {
  // 1. Сначала проверяем cookie
  let userId = getCookie('brainstorm_user_id');
  
  if (userId && userId.length > 10) {
    return userId;
  }

  // 2. Если нет cookie, генерируем новый на основе fingerprint
  const fingerprint = await generateBrowserFingerprint();
  
  // 3. Создаем уникальный User ID (fingerprint + timestamp для уникальности)
  userId = `fp_${fingerprint}_${Date.now().toString(36)}`;
  
  // 4. Сохраняем в cookie на год
  setCookie('brainstorm_user_id', userId, 365);
  
  return userId;
}

// Функция для получения короткого читаемого ID для UI
export function getShortUserId(fullUserId: string): string {
  return fullUserId.substring(3, 11); // Убираем префикс fp_ и берем 8 символов
}

// Функция для получения "аватара" пользователя на основе ID
export function getUserColor(userId: string): string {
  const colors = [
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#14b8a6', '#f59e0b', '#84cc16', '#6366f1'
  ];
  
  // Простое хеширование для стабильного цвета
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff;
  }
  
  return colors[Math.abs(hash) % colors.length];
}
