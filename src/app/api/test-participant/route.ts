import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, userName } = await request.json()

    const { data, error } = await supabase
      .from('participants')
      .insert([{
        session_id: sessionId,
        user_id: userId,
        user_name: userName,
        last_seen: new Date().toISOString(),
        is_active: true
      }])
      .select()
      .single()

    if (error) {
      console.error('Ошибка создания участника:', error)
      return NextResponse.json({ success: false, error: error.message })
    }

    console.log('Участник создан через API:', data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API ошибка:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
    })
  }
}