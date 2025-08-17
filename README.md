# 🧠 Live Brainstorm

**Интерактивная realtime доска для мозгового штурма с AI-ассистентом**

> Создавайте идеи вместе в реальном времени, видьте курсоры коллег и получайте умные предложения от AI

![Status](https://img.shields.io/badge/Status-В%20разработке-yellow)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## ✨ Ключевые возможности

### 🚀 Instant Start
- Никакой регистрации - просто открыл и создал сессию
- Поделился ссылкой - и команда уже работает вместе
- Мгновенная синхронизация между всеми участниками

### 🔄 Realtime Коллаборация
- **Live курсоры** - видишь где сейчас находятся коллеги
- **Мгновенная синхронизация** - создал карточку, и она сразу у всех
- **Присутствие участников** - кто сейчас активен и что делает
- **Typing индикаторы** - видишь когда кто-то печатает на карточке

### 🤖 AI-Ассистент
- **Одним кликом** улучшай свои идеи через Perplexity
- **Умные предложения** - AI развивает и структурирует мысли
- **Контекстные улучшения** - учитывает другие идеи в сессии

### 📱 Современный UX
- **Адаптивный дизайн** - работает на всех устройствах
- **Плавные анимации** - каждое действие приятно глазу
- **Touch поддержка** - полноценная работа на планшетах
- **Темная/светлая тема** - на ваш выбор

## 🛠 Технологии

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **UI Framework**: Shadcn/ui + Framer Motion для анимаций
- **Backend**: Supabase (PostgreSQL + Realtime + Edge Functions)
- **AI**: Perplexity API через MCP протокол
- **Hosting**: Vercel (автоматический деплой)

## 📦 Быстрый старт

### Требования
- Node.js 18+
- npm или yarn
- Supabase аккаунт

### Установка

```bash
# Клонируем репозиторий
git clone <repo-url>
cd live-brainstorm

# Устанавливаем зависимости
npm install

# Копируем переменные окружения
cp .env.example .env.local

# Настраиваем Supabase
# 1. Создайте проект на supabase.com
# 2. Добавьте URL и ключи в .env.local
# 3. Запустите миграции
npm run db:migrate

# Запускаем приложение
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) и начинайте создавать!

## 🏃‍♂️ Команды разработки

```bash
# Разработка
npm run dev                 # Запуск dev сервера
npm run build              # Production сборка
npm run start              # Запуск production

# Качество кода
npm run lint               # ESLint проверка
npm run type-check         # TypeScript проверка
npm run format             # Prettier форматирование

# База данных
npm run db:migrate         # Применить миграции
npm run db:reset           # Сбросить БД (dev)
npm run db:generate-types  # Генерация TS типов

# Тестирование
npm run test               # Unit тесты
npm run test:e2e           # E2E тесты (Playwright)
npm run test:watch         # Watch режим
```

## 📁 Структура проекта

```
├── app/                   # Next.js App Router
│   ├── (marketing)/       # Группа: landing, about
│   ├── board/[id]/        # Основная доска
│   ├── api/               # API routes
│   └── globals.css        # Глобальные стили
├── components/            # React компоненты
│   ├── ui/                # Shadcn/ui компоненты
│   └── features/          # Feature-specific компоненты
│       ├── board/         # Доска и карточки
│       ├── presence/      # Курсоры и участники
│       └── ai/            # AI функционал
├── lib/                   # Утилиты и конфигурация
│   ├── supabase/          # Supabase клиенты
│   ├── ai/                # AI интеграция
│   └── utils/             # Общие утилиты
├── agents/                # AI агенты для разработки
├── supabase/              # БД схема и миграции
└── tests/                 # Тесты
```

## 🔧 Конфигурация

### Переменные окружения

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Perplexity AI (опционально)
PERPLEXITY_API_KEY=your-api-key

# Next.js
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
```

### Supabase настройка

1. Создайте проект на [supabase.com](https://supabase.com)
2. Включите Realtime для таблиц `cards`, `sessions`, `participants`
3. Настройте RLS политики (автоматически через миграции)
4. Добавьте домен в Auth settings для production

## 📊 Статус разработки

### ✅ Завершенные этапы
- [x] Планирование и архитектура
- [x] Настройка агентов разработки
- [x] Проектирование UI/UX

### 🔄 В работе
- [ ] **Этап 1**: Инициализация Next.js проекта
- [ ] **Этап 2**: Основной функционал доски
- [ ] **Этап 3**: Realtime синхронизация
- [ ] **Этап 4**: AI интеграция
- [ ] **Этап 5**: Полировка и оптимизация

### 📈 Прогресс: 0/5 этапов (0%)

> **Следующий шаг**: Начинаем Этап 1 - создание Next.js проекта

## 🐛 Известные проблемы

*Пока нет известных проблем - проект только начинается!*

## 🤝 Участие в разработке

Проект использует автономных AI агентов для разработки:

- **Next.js Архитектор** - структура приложения
- **Supabase Инженер** - база данных и realtime
- **UX Дизайнер** - пользовательский опыт  
- **UI Разработчик** - интерфейс и анимации
- **Realtime Специалист** - синхронизация данных
- **AI Integration** - интеграция с Perplexity
- **Testing & QA** - тестирование качества
- **Project Manager** - координация всего процесса

### Процесс разработки

1. Каждая задача назначается соответствующему агенту
2. Агент выполняет задачу согласно своей специализации
3. Project Manager контролирует качество и прогресс
4. Результат проверяется по критериям приемки
5. Документация обновляется автоматически

## 📄 Лицензия

MIT License - используйте как хотите!

---

## 💡 Концепция

Live Brainstorm создан чтобы показать мощь современных веб-технологий:

- **Supabase Realtime** обеспечивает мгновенную синхронизацию
- **Next.js 15** дает производительность и DevX
- **AI через MCP** расширяет возможности мышления
- **Shadcn/ui** предоставляет красивые компоненты

**Цель**: создать простой но впечатляющий инструмент, который заставит сказать "вау!" при первом использовании.

---

📝 *Документация обновляется автоматически по мере разработки*
