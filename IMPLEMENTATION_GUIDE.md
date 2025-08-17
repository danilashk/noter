# Руководство по внедрению дизайна

## 1. Обновление globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Основные фоны */
  --bg-primary: #0a0a0a;
  --bg-secondary: #111111;
  --bg-tertiary: #1a1a1a;
  
  /* Границы */
  --border-primary: #262626;
  --border-secondary: #404040;
  --border-accent: #8B5CF6;
  
  /* Текст */
  --text-primary: #ffffff;
  --text-secondary: #a3a3a3;
  --text-tertiary: #737373;
  --text-accent: #8B5CF6;
  
  /* Акцентные цвета */
  --accent-primary: #8B5CF6;
  --accent-hover: #7C3AED;
  --accent-active: #6D28D9;
  --accent-bg: rgb(139 92 246 / 0.1);
  --accent-bg-hover: rgb(139 92 246 / 0.2);
  
  /* Семантические цвета */
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --info: #3B82F6;
  
  /* Анимации */
  --transition-fast: 150ms ease-out;
  --transition-medium: 250ms ease-out;
  --transition-slow: 350ms ease-out;
}

/* Базовые стили */
html {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

body {
  font-family: Inter, system-ui, sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.5;
}

/* Скроллбары */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--border-secondary);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}

/* Базовые компоненты */
.btn-primary {
  @apply bg-accent-primary hover:bg-accent-hover active:bg-accent-active;
  @apply text-white font-medium px-4 py-2 rounded-lg;
  @apply transition-colors duration-150;
  @apply focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-bg-primary;
}

.btn-secondary {
  @apply border border-border-secondary hover:border-accent-primary;
  @apply text-text-secondary hover:text-accent-primary;
  @apply bg-transparent font-medium px-4 py-2 rounded-lg;
  @apply transition-all duration-150;
  @apply focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-bg-primary;
}

.btn-ghost {
  @apply text-text-secondary hover:text-accent-primary hover:bg-accent-bg;
  @apply font-medium px-3 py-2 rounded-lg;
  @apply transition-all duration-150;
}

.card {
  @apply bg-bg-secondary border border-border-primary rounded-xl;
  @apply transition-all duration-200;
}

.card-hover {
  @apply hover:border-border-secondary hover:shadow-lg;
}

.input-field {
  @apply bg-bg-tertiary border border-border-primary;
  @apply text-text-primary placeholder:text-text-tertiary;
  @apply px-4 py-2 rounded-lg;
  @apply focus:border-accent-primary focus:ring-1 focus:ring-accent-primary;
  @apply transition-all duration-150;
}

/* Утилиты для иконок */
.icon-sm {
  @apply w-4 h-4;
}

.icon-md {
  @apply w-5 h-5;
}

.icon-lg {
  @apply w-6 h-6;
}

.icon-primary {
  @apply text-accent-primary;
}

.icon-secondary {
  @apply text-text-secondary hover:text-accent-primary transition-colors duration-150;
}

/* Анимации */
@keyframes pulse-accent {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.pulse-accent {
  animation: pulse-accent 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fade-in 250ms ease-out;
}
```

## 2. Обновление tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Основные фоны
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)', 
        'bg-tertiary': 'var(--bg-tertiary)',
        
        // Границы
        'border-primary': 'var(--border-primary)',
        'border-secondary': 'var(--border-secondary)',
        'border-accent': 'var(--border-accent)',
        
        // Текст
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-accent': 'var(--text-accent)',
        
        // Акцентные цвета
        'accent-primary': 'var(--accent-primary)',
        'accent-hover': 'var(--accent-hover)',
        'accent-active': 'var(--accent-active)',
        'accent-bg': 'var(--accent-bg)',
        
        // Семантические цвета
        'success': 'var(--success)',
        'warning': 'var(--warning)',
        'error': 'var(--error)',
        'info': 'var(--info)',
      },
      transitionDuration: {
        'fast': '150ms',
        'medium': '250ms',
        'slow': '350ms',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-accent': 'pulse-accent 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 250ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
```

## 3. Компоненты UI

### Button.tsx
```tsx
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-fast focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-accent-primary hover:bg-accent-hover active:bg-accent-active text-white focus:ring-accent-primary",
      secondary: "border border-border-secondary hover:border-accent-primary text-text-secondary hover:text-accent-primary bg-transparent focus:ring-accent-primary",
      ghost: "text-text-secondary hover:text-accent-primary hover:bg-accent-bg focus:ring-accent-primary"
    };
    
    const sizes = {
      sm: "px-3 py-1.5 text-sm gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-6 py-3 text-base gap-2"
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
```

### Card.tsx
```tsx
import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-bg-secondary border border-border-primary rounded-xl p-6 transition-all duration-medium",
          hover && "hover:border-border-secondary hover:shadow-lg hover:shadow-black/5",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
export { Card };
```

### Input.tsx
```tsx
import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <input
          ref={ref}
          className={cn(
            "w-full bg-bg-tertiary border border-border-primary text-text-primary placeholder:text-text-tertiary px-4 py-2 rounded-lg focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all duration-fast",
            error && "border-error focus:border-error focus:ring-error",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-error text-sm">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
```

## 4. Иконки

### Установка Heroicons
```bash
npm install @heroicons/react
```

### Icon.tsx компонент
```tsx
import { cn } from "@/lib/utils";
import * as HeroIcons from "@heroicons/react/24/outline";
import * as HeroIconsSolid from "@heroicons/react/24/solid";
import { ComponentType, SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  name: keyof typeof HeroIcons;
  variant?: 'outline' | 'solid';
  size?: 'sm' | 'md' | 'lg';
}

const Icon = ({ name, variant = 'outline', size = 'md', className, ...props }: IconProps) => {
  const IconComponent = (variant === 'solid' ? HeroIconsSolid[name] : HeroIcons[name]) as ComponentType<SVGProps<SVGSVGElement>>;
  
  const sizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6"
  };

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <IconComponent
      className={cn(sizes[size], className)}
      {...props}
    />
  );
};

export { Icon };
```

## 5. Основные иконки для brainstorming

```tsx
// Список рекомендуемых иконок
export const ICONS = {
  // Основные действия
  ADD: 'PlusIcon',
  IDEA: 'LightBulbIcon',
  CHAT: 'ChatBubbleLeftRightIcon',
  TEAM: 'UserGroupIcon',
  CREATE: 'SquaresPlusIcon',
  
  // Навигация  
  HOME: 'HomeIcon',
  FOLDER: 'FolderIcon',
  HISTORY: 'ClockIcon',
  SETTINGS: 'Cog6ToothIcon',
  PROFILE: 'UserCircleIcon',
  
  // Управление
  EDIT: 'PencilIcon',
  DELETE: 'TrashIcon',
  COPY: 'DocumentDuplicateIcon',
  SHARE: 'ShareIcon',
  BOOKMARK: 'BookmarkIcon',
  
  // Состояния
  LOADING: 'ArrowPathIcon',
  SUCCESS: 'CheckIcon',
  ERROR: 'XMarkIcon',
  WARNING: 'ExclamationTriangleIcon',
  INFO: 'InformationCircleIcon',
} as const;
```

## 6. Пример использования

```tsx
// Компонент карточки идеи
function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <Card hover className="group cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Icon 
            name="LightBulbIcon" 
            className="text-accent-primary" 
            size="md" 
          />
          <h3 className="font-medium text-text-primary">
            {idea.title}
          </h3>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm">
            <Icon name="PencilIcon" size="sm" />
          </Button>
          <Button variant="ghost" size="sm">
            <Icon name="TrashIcon" size="sm" className="text-error" />
          </Button>
        </div>
      </div>
      
      <p className="text-text-secondary mt-2 text-sm">
        {idea.description}
      </p>
      
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2 text-text-tertiary text-xs">
          <Icon name="UserIcon" size="sm" />
          {idea.author}
        </div>
        
        <Button variant="primary" size="sm">
          <Icon name="ChatBubbleLeftRightIcon" size="sm" />
          Обсудить
        </Button>
      </div>
    </Card>
  );
}
```

Этот подход создаст единообразный, современный дизайн с акцентом на фиолетовом цвете и качественными иконками Heroicons.