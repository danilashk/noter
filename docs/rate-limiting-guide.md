# Руководство по системе Rate Limiting

Система rate limiting защищает приложение от спама и обеспечивает стабильную работу для всех пользователей.

## Лимиты

### Карточки
- **Лимит**: 10 карточек за 5 секунд
- **Окно**: Скользящее 5-секундное окно
- **Идентификация**: По fingerprint пользователя

### Доски
- **Лимит**: 50 досок за час
- **Окно**: Фиксированное часовое окно
- **Идентификация**: По fingerprint пользователя

## Архитектура

### База данных

1. **Таблица `rate_limits`** - хранит информацию о лимитах
2. **Функции проверки** - `check_card_rate_limit()`, `check_board_rate_limit()`
3. **Триггеры** - автоматическая проверка при INSERT операциях
4. **API функции** - `api_create_card()`, `api_create_board()`

### Клиентская часть

1. **Библиотека `rate-limit.ts`** - основные утилиты
2. **Хук `use-rate-limit.ts`** - React хук для компонентов
3. **API клиенты** - `cards.ts`, `boards.ts`
4. **Компонент индикатора** - визуальное отображение лимитов

## Использование

### В React компонентах

```tsx
import { useRateLimit } from '@/hooks/use-rate-limit'
import { createCard } from '@/lib/api/cards'

function CardCreationComponent() {
  const { safeCreateCard, getLimitUsage, isLimitNearExhaustion } = useRateLimit()
  
  const handleCreateCard = async () => {
    const success = await safeCreateCard(async () => {
      await createCard({
        sessionId: 'session-id',
        content: 'Новая карточка',
        createdBy: 'user-id'
      })
    })
    
    if (success) {
      console.log('Карточка создана!')
    }
  }
  
  return (
    <div>
      <button 
        onClick={handleCreateCard}
        disabled={isLimitNearExhaustion('create_card', 90)}
      >
        Создать карточку
      </button>
      <p>Использование лимита: {getLimitUsage('create_card')}%</p>
    </div>
  )
}
```

### Прямое использование API

```tsx
import { createCard } from '@/lib/api/cards'
import { handleRateLimitError } from '@/lib/rate-limit'

try {
  const card = await createCard({
    sessionId: 'session-id',
    content: 'Новая карточка',
    createdBy: 'user-id'
  })
  console.log('Карточка создана:', card)
} catch (error) {
  // Автоматически обрабатывает rate limit ошибки
  console.error('Ошибка создания карточки:', error)
}
```

### Отображение индикатора лимитов

```tsx
import { RateLimitIndicator } from '@/components/rate-limit-indicator'

function Layout() {
  return (
    <div>
      {/* Компактный индикатор в header */}
      <RateLimitIndicator compact className="ml-auto" />
      
      {/* Детальный индикатор в sidebar */}
      <RateLimitIndicator showDetails className="w-full max-w-sm" />
    </div>
  )
}
```

## Обработка ошибок

### Toast уведомления

Система автоматически показывает красные toast уведомления при превышении лимитов:

- **Карточки**: "Превышен лимит создания карточек. Максимум 10 карточек за 5 секунд."
- **Доски**: "Превышен лимит создания досок. Максимум 50 досок за час."

### Предупреждения

При достижении 80% лимита показываются предупреждающие уведомления.

## Администрирование

### Очистка старых записей

```sql
SELECT cleanup_old_rate_limits();
```

Рекомендуется запускать каждые 30 минут через cron.

### Мониторинг лимитов

```sql
-- Топ пользователей по использованию лимитов карточек
SELECT fingerprint, SUM(action_count) as total_cards
FROM rate_limits 
WHERE action_type = 'create_card' 
AND window_start >= NOW() - INTERVAL '1 hour'
GROUP BY fingerprint
ORDER BY total_cards DESC
LIMIT 10;

-- Топ пользователей по использованию лимитов досок
SELECT fingerprint, SUM(action_count) as total_boards
FROM rate_limits 
WHERE action_type = 'create_board' 
AND window_start >= NOW() - INTERVAL '24 hours'
GROUP BY fingerprint
ORDER BY total_boards DESC
LIMIT 10;
```

### Изменение лимитов

Для изменения лимитов необходимо обновить:

1. Функции в базе данных (`check_card_rate_limit`, `check_board_rate_limit`)
2. Константы в клиентском коде
3. Тексты уведомлений

## Тестирование

```tsx
import { runFullRateLimitTest } from '@/lib/test-rate-limit'

// Запуск полного теста системы
await runFullRateLimitTest()
```

## Безопасность

- Все функции используют `SECURITY DEFINER` с фиксированным `search_path`
- RLS политики защищают доступ к таблице rate_limits
- Fingerprint позволяет избежать обхода лимитов через смену user_id

## Производительность

- Автоматическая очистка старых записей
- Оптимизированные индексы для быстрого поиска
- Скользящие окна для карточек минимизируют количество записей

## Мониторинг

Система предоставляет метрики через:
- Функцию `get_user_rate_limits()` для текущего состояния
- Таблицу `rate_limits` для исторических данных
- Security advisors для проверки безопасности