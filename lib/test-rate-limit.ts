/**
 * Тестовые функции для проверки rate limiting
 * Используется для отладки и тестирования системы лимитов
 */

import { createCard } from '@/lib/api/cards'
import { createBoard } from '@/lib/api/boards'
import { getUserRateLimits, formatTimeUntilReset } from '@/lib/rate-limit'

/**
 * Тестирует создание карточек до достижения лимита
 */
export async function testCardRateLimit(sessionId: string, createdBy: string, fingerprint: string) {
  console.log('🧪 Начало тестирования лимитов карточек...')
  
  const cardCreationPromises = []
  
  // Пытаемся создать 12 карточек (больше лимита в 10)
  for (let i = 1; i <= 12; i++) {
    cardCreationPromises.push(
      createCard({
        sessionId,
        content: `Тестовая карточка #${i}`,
        createdBy,
        userFingerprint: fingerprint,
        positionX: i * 50,
        positionY: i * 30
      }).then(() => {
        console.log(`✅ Карточка #${i} создана успешно`)
        return { success: true, index: i }
      }).catch((error) => {
        console.log(`❌ Карточка #${i} не создана: ${error.message}`)
        return { success: false, index: i, error: error.message }
      })
    )
  }
  
  const results = await Promise.all(cardCreationPromises)
  
  // Анализируем результаты
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  console.log(`📊 Результаты теста карточек:`)
  console.log(`   Успешно создано: ${successful}`)
  console.log(`   Заблокировано лимитом: ${failed}`)
  
  // Проверяем текущие лимиты
  const limits = await getUserRateLimits(fingerprint)
  const cardLimit = limits.find(l => l.action_type === 'create_card')
  
  if (cardLimit) {
    console.log(`📈 Текущий лимит карточек: ${cardLimit.current_count}/${cardLimit.limit_value}`)
    console.log(`⏰ Сброс через: ${formatTimeUntilReset(cardLimit.time_until_reset)}`)
  }
  
  return results
}

/**
 * Тестирует создание досок до достижения лимита
 */
export async function testBoardRateLimit(createdBy: string, count: number = 5) {
  console.log(`🧪 Начало тестирования лимитов досок (создаем ${count} досок)...`)
  
  const boardCreationPromises = []
  
  for (let i = 1; i <= count; i++) {
    boardCreationPromises.push(
      createBoard({
        title: `Тестовая доска #${i}`,
        description: `Описание для тестовой доски номер ${i}`,
        createdBy
      }).then(() => {
        console.log(`✅ Доска #${i} создана успешно`)
        return { success: true, index: i }
      }).catch((error) => {
        console.log(`❌ Доска #${i} не создана: ${error.message}`)
        return { success: false, index: i, error: error.message }
      })
    )
  }
  
  const results = await Promise.all(boardCreationPromises)
  
  // Анализируем результаты
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  console.log(`📊 Результаты теста досок:`)
  console.log(`   Успешно создано: ${successful}`)
  console.log(`   Заблокировано лимитом: ${failed}`)
  
  // Проверяем текущие лимиты
  const limits = await getUserRateLimits(createdBy)
  const boardLimit = limits.find(l => l.action_type === 'create_board')
  
  if (boardLimit) {
    console.log(`📈 Текущий лимит досок: ${boardLimit.current_count}/${boardLimit.limit_value}`)
    console.log(`⏰ Сброс через: ${formatTimeUntilReset(boardLimit.time_until_reset)}`)
  }
  
  return results
}

/**
 * Отображает текущие лимиты пользователя
 */
export async function displayCurrentLimits(fingerprint: string) {
  console.log(`📊 Текущие лимиты для fingerprint: ${fingerprint}`)
  
  try {
    const limits = await getUserRateLimits(fingerprint)
    
    if (limits.length === 0) {
      console.log('   Нет активных лимитов')
      return
    }
    
    limits.forEach(limit => {
      const usagePercent = Math.round((limit.current_count / limit.limit_value) * 100)
      const resetTime = formatTimeUntilReset(limit.time_until_reset)
      
      console.log(`   ${limit.action_type}:`)
      console.log(`     Использовано: ${limit.current_count}/${limit.limit_value} (${usagePercent}%)`)
      console.log(`     Сброс через: ${resetTime}`)
      
      if (usagePercent >= 80) {
        console.log(`     ⚠️  Приближение к лимиту!`)
      }
      if (usagePercent >= 100) {
        console.log(`     🚫 Лимит достигнут!`)
      }
    })
  } catch (error) {
    console.error('Ошибка получения лимитов:', error)
  }
}

/**
 * Полный тест системы rate limiting
 */
export async function runFullRateLimitTest() {
  const testFingerprint = `test_${Date.now()}`
  const testSessionId = '550e8400-e29b-41d4-a716-446655440000'
  const testUserId = '550e8400-e29b-41d4-a716-446655440001'
  
  console.log('🚀 Запуск полного теста системы rate limiting...')
  console.log(`   Fingerprint: ${testFingerprint}`)
  
  // Показываем начальное состояние
  await displayCurrentLimits(testFingerprint)
  
  // Тестируем карточки
  console.log('\n--- Тест карточек ---')
  await testCardRateLimit(testSessionId, testUserId, testFingerprint)
  
  // Ждем 6 секунд для сброса лимита карточек
  console.log('\n⏳ Ожидание 6 секунд для сброса лимита карточек...')
  await new Promise(resolve => setTimeout(resolve, 6000))
  
  // Показываем состояние после сброса
  console.log('\n--- Состояние после сброса лимита карточек ---')
  await displayCurrentLimits(testFingerprint)
  
  // Тестируем доски
  console.log('\n--- Тест досок ---')
  await testBoardRateLimit(testFingerprint, 3)
  
  // Финальное состояние
  console.log('\n--- Финальное состояние ---')
  await displayCurrentLimits(testFingerprint)
  
  console.log('\n✅ Тест завершен!')
}