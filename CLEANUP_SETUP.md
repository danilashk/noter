# Система автоудаления неактивных сессий

## Обзор

Система автоматически удаляет неактивные brainstorming сессии для оптимизации использования базы данных и хранилища.

## Компоненты системы

### 1. База данных

#### Поле отслеживания активности
- **`sessions.last_activity`** - автоматически обновляется при любых изменениях в сессии

#### Функции
- **`update_session_activity()`** - обновляет `last_activity` при изменениях
- **`cleanup_inactive_sessions(inactive_hours, dry_run)`** - основная функция очистки

#### Триггеры
- Автоматически обновляют `last_activity` при изменениях в:
  - `cards` (создание/изменение карточек)
  - `participants` (присоединение/активность участников)
  - `drawing_lines` (рисование)
  - `card_selections` (выбор карточек)

### 2. Edge Function

Расположение: `supabase/functions/cleanup-sessions/index.ts`

**Эндпоинты:**
- `GET` - тестирование в режиме dry_run
- `POST` - реальное выполнение очистки

**Параметры:**
- `dry_run=true/false` - режим тестирования
- `inactive_hours=24` - количество часов неактивности

## Тестирование системы

### 1. Тестирование функции базы данных

```sql
-- Тест в режиме dry_run (без удаления)
SELECT cleanup_inactive_sessions(24, true) as preview;

-- Тест с коротким периодом для проверки
SELECT cleanup_inactive_sessions(1, true) as preview_1_hour;

-- Реальное выполнение (осторожно!)
SELECT cleanup_inactive_sessions(24, false) as actual_cleanup;
```

### 2. Тестирование Edge Function

#### Локальное тестирование
```bash
# Запуск локального Supabase
supabase start

# Тест в режиме dry_run
curl "http://localhost:54321/functions/v1/cleanup-sessions?dry_run=true&inactive_hours=24"

# Тест с реальным выполнением (локально)
curl -X POST "http://localhost:54321/functions/v1/cleanup-sessions?dry_run=false&inactive_hours=24"
```

#### Продакшн тестирование
```bash
# Замените YOUR_PROJECT_REF и YOUR_ANON_KEY
curl "https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-sessions?dry_run=true&inactive_hours=24" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 3. Создание тестовых данных

```sql
-- Создание старой сессии для тестирования
INSERT INTO sessions (id, title, last_activity, has_started_brainstorm) 
VALUES (
  gen_random_uuid(), 
  'Test Old Session', 
  NOW() - INTERVAL '25 hours',
  false
);

-- Проверка что сессия будет найдена для удаления
SELECT id, title, last_activity, 
       (last_activity < NOW() - INTERVAL '24 hours') as should_be_deleted
FROM sessions 
WHERE title = 'Test Old Session';
```

## Деплой Edge Function

### 1. Первоначальный деплой
```bash
# Логин в Supabase CLI
supabase login

# Связывание с проектом
supabase link --project-ref YOUR_PROJECT_REF

# Деплой функции
supabase functions deploy cleanup-sessions
```

### 2. Обновление функции
```bash
# После изменений в коде
supabase functions deploy cleanup-sessions --no-verify-jwt
```

## Автоматизация

### 1. Cron Job на сервере

```bash
# Добавить в crontab для ежедневного выполнения в 3:00 AM
0 3 * * * curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-sessions?dry_run=false&inactive_hours=24" -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" >> /var/log/supabase-cleanup.log 2>&1
```

### 2. GitHub Actions

```yaml
name: Daily Cleanup
on:
  schedule:
    - cron: '0 3 * * *'  # Каждый день в 3:00 AM UTC
  workflow_dispatch:      # Ручной запуск

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Run cleanup
        run: |
          curl -X POST "${{ secrets.SUPABASE_URL }}/functions/v1/cleanup-sessions?dry_run=false&inactive_hours=24" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}"
```

### 3. Vercel Cron Jobs

```typescript
// api/cleanup.ts
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  // Проверка секретного ключа для безопасности
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/cleanup-sessions?dry_run=false&inactive_hours=24`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  )

  const result = await response.json()
  return Response.json(result)
}

export const runtime = 'edge'
```

## Мониторинг

### 1. Логи выполнения

```sql
-- Создание таблицы для логов (опционально)
CREATE TABLE cleanup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sessions_deleted INTEGER,
  cards_deleted INTEGER,
  participants_deleted INTEGER,
  drawings_deleted INTEGER,
  selections_deleted INTEGER,
  execution_time_ms INTEGER,
  dry_run BOOLEAN
);
```

### 2. Метрики для мониторинга

```sql
-- Проверка количества старых сессий
SELECT COUNT(*) as old_sessions_count
FROM sessions 
WHERE last_activity < NOW() - INTERVAL '24 hours'
  AND (has_started_brainstorm = FALSE OR has_started_brainstorm IS NULL);

-- Статистика по активности сессий
SELECT 
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE last_activity > NOW() - INTERVAL '1 hour') as active_last_hour,
  COUNT(*) FILTER (WHERE last_activity > NOW() - INTERVAL '24 hours') as active_last_day,
  COUNT(*) FILTER (WHERE last_activity < NOW() - INTERVAL '24 hours') as inactive_old
FROM sessions;
```

## Безопасность

1. **Защита от случайного удаления** - функция не удаляет сессии с `has_started_brainstorm = true`
2. **Dry-run режим** - всегда тестируйте перед реальным выполнением
3. **Авторизация** - Edge Function требует proper authentication
4. **Логирование** - все операции логируются для аудита

## Настройка параметров

### Изменение времени неактивности

```sql
-- Для разных типов cleanup
SELECT cleanup_inactive_sessions(12, false); -- 12 часов
SELECT cleanup_inactive_sessions(48, false); -- 48 часов
SELECT cleanup_inactive_sessions(168, false); -- 1 неделя
```

### Кастомизация условий удаления

Отредактируйте функцию `cleanup_inactive_sessions` для добавления дополнительных условий:

```sql
-- Пример: не удалять сессии с большим количеством карточек
WHERE last_activity < NOW() - (inactive_hours || ' hours')::INTERVAL
  AND (has_started_brainstorm = FALSE OR has_started_brainstorm IS NULL)
  AND id NOT IN (
    SELECT session_id FROM cards 
    GROUP BY session_id 
    HAVING COUNT(*) > 10
  )
```

## Восстановление данных

В случае случайного удаления, используйте резервные копии Supabase или Point-in-Time Recovery если доступно в вашем плане.

## Поддержка

При возникновении проблем:
1. Проверьте логи Edge Function в Supabase Dashboard
2. Протестируйте функцию БД напрямую через SQL Editor
3. Убедитесь что все триггеры работают корректно
4. Проверьте права доступа и RLS политики