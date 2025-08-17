'use client';

import { useEffect } from 'react';
import { getLightColor } from '@/lib/colors';

interface UserThemeProps {
  userColor?: string;
  children: React.ReactNode;
}

export function UserTheme({ userColor, children }: UserThemeProps) {
  useEffect(() => {
    if (!userColor) return;

    // Создаем CSS переменные для пользовательской темы
    const root = document.documentElement;
    
    // Основной цвет пользователя
    root.style.setProperty('--user-primary', userColor);
    
    // Светлые варианты для фонов
    root.style.setProperty('--user-primary-light', getLightColor(userColor, 0.1));
    root.style.setProperty('--user-primary-lighter', getLightColor(userColor, 0.05));
    
    // Средней интенсивности для hover
    root.style.setProperty('--user-primary-hover', getLightColor(userColor, 0.2));
    
    // Для активных состояний
    root.style.setProperty('--user-primary-active', getLightColor(userColor, 0.3));

    return () => {
      // Очищаем переменные при размонтировании
      root.style.removeProperty('--user-primary');
      root.style.removeProperty('--user-primary-light');
      root.style.removeProperty('--user-primary-lighter');
      root.style.removeProperty('--user-primary-hover');
      root.style.removeProperty('--user-primary-active');
    };
  }, [userColor]);

  return <>{children}</>;
}