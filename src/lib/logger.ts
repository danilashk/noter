/**
 * Система логирования для продакшена
 * В продакшене логи отключены, в разработке - включены
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      }
  },
  
  error: (...args: any[]) => {
    // Ошибки показываем всегда
    console.error(...args);
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      }
  }
};