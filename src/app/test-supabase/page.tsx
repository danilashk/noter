'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function TestSupabase() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setResult('Тестирование соединения...')
    
    try {
      console.log('Testing Supabase connection...')
      console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .limit(1)
      
      console.log('Supabase response:', { data, error })
      
      if (error) {
        setResult(`Ошибка: ${error.message}\nКод: ${error.code}\nДетали: ${JSON.stringify(error, null, 2)}`)
      } else {
        setResult(`Успех! Получено записей: ${data?.length || 0}\nДанные: ${JSON.stringify(data, null, 2)}`)
      }
    } catch (err) {
      console.error('Test error:', err)
      setResult(`Исключение: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Тест Supabase соединения</h1>
      
      <div className="space-y-4">
        <Button onClick={testConnection} disabled={loading}>
          {loading ? 'Тестирование...' : 'Тестировать соединение'}
        </Button>
        
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Переменные окружения:</h3>
          <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'НЕ НАЙДЕН'}</p>
          <p>API Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'УСТАНОВЛЕН' : 'НЕ НАЙДЕН'}</p>
          <p>Длина ключа: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0}</p>
        </div>
        
        {result && (
          <div className="bg-white border p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Результат:</h3>
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        )}
      </div>
    </div>
  )
}