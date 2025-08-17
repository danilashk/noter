/**
 * Система логирования для продакшена
 * В продакшене логи отключены, в разработке - включены
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Ошибки показываем всегда
    console.error(...args);
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};