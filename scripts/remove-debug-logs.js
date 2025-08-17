#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Функция для рекурсивного поиска файлов
function findFiles(dir, extension) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      files.push(...findFiles(fullPath, extension));
    } else if (entry.isFile() && entry.name.endsWith(extension)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Паттерны для удаления в продакшене
const debugPatterns = [
  /console\.log\([^)]*\);?\s*\n?/g,
  /console\.debug\([^)]*\);?\s*\n?/g,
  /console\.warn\([^)]*\);?\s*\n?/g,
  // Оставляем console.error для критических ошибок
];

// Файлы для обработки
const srcDir = path.join(process.cwd(), 'src');
const files = [
  ...findFiles(srcDir, '.ts'),
  ...findFiles(srcDir, '.tsx')
];

console.log('🧹 Cleaning debug logs from production build...');

let totalRemovals = 0;

files.forEach(filePath => {
  // Пропускаем тестовые файлы
  if (filePath.includes('/test') || filePath.includes('.test.')) {
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Применяем все паттерны
    debugPatterns.forEach(pattern => {
      content = content.replace(pattern, '');
    });
    
    // Удаляем пустые строки подряд
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      const removals = (originalContent.match(/console\.(log|debug|warn)/g) || []).length;
      if (removals > 0) {
        console.log(`✅ ${path.relative(process.cwd(), filePath)}: ${removals} debug logs removed`);
        totalRemovals += removals;
      }
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n🎉 Total debug logs removed: ${totalRemovals}`);

// Создаем .env.production с безопасными переменными
const envProduction = `# Production Environment Variables
# Only include variables that are safe for client-side

NEXT_PUBLIC_SUPABASE_URL=\${NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=\${NEXT_PUBLIC_SUPABASE_ANON_KEY}

# Remove unused variables
# NEXTAUTH_SECRET - not used in current implementation
# NEXTAUTH_URL - not used in current implementation
`;

fs.writeFileSync('.env.production', envProduction);
console.log('📝 Created .env.production template');

console.log('\n🚀 Production cleanup complete!');
console.log('\n⚠️  Manual actions required:');
console.log('1. Remove test pages: /test and /test-supabase');
console.log('2. Set up proper environment variables in production');
console.log('3. Review and remove any remaining sensitive console.error calls');