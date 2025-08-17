import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function POST(request: NextRequest) {
  try {
    const { sessionId, content, x, y, color } = await request.json()

    const { data, error } = await supabase
      .from('cards')
      .insert([{
        session_id: sessionId,
        content,
        position_x: x,
        position_y: y,
        color,
        created_by: `api_test_${Date.now()}`
      }])
      .select()
      .single()

    if (error) {
      console.error('Ошибка создания карточки:', error)
      return NextResponse.json({ success: false, error: error.message })
    }

    console.log('Карточка создана через API:', data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API ошибка:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
    })
  }
}