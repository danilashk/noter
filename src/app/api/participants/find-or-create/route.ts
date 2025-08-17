import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getNextAvailableColor, isParticipantLimitReached } from '@/lib/colors';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userFingerprint, displayName } = await request.json();

    if (!sessionId || !userFingerprint || !displayName) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля' },
        { status: 400 }
      );
    }

    // Сначала ищем существующего участника по fingerprint
    const { data: existingParticipant } = await supabase
      .from('participants')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_fingerprint', userFingerprint)
      .single();

    if (existingParticipant) {
      // Обновляем время последней активности
      await supabase
        .from('participants')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', existingParticipant.id);

      return NextResponse.json({
        id: existingParticipant.id,
        name: existingParticipant.display_name,
        color: existingParticipant.color,
        isNew: false
      });
    }

    // Получаем всех участников сессии для проверки лимита и назначения цвета
    const { data: allParticipants } = await supabase
      .from('participants')
      .select('color')
      .eq('session_id', sessionId);

    // Проверяем лимит участников
    if (isParticipantLimitReached(allParticipants?.length || 0)) {
      return NextResponse.json(
        { error: 'Достигнут максимальный лимит участников (6 человек)' },
        { status: 400 }
      );
    }

    // Назначаем следующий доступный цвет
    const usedColors = allParticipants?.map(p => p.color) || [];
    const assignedColor = getNextAvailableColor(usedColors);

    if (!assignedColor) {
      return NextResponse.json(
        { error: 'Нет доступных цветов для нового участника' },
        { status: 400 }
      );
    }

    // Создаем нового участника
    const { data: newParticipant, error } = await supabase
      .from('participants')
      .insert({
        session_id: sessionId,
        user_fingerprint: userFingerprint,
        display_name: displayName,
        name: displayName, // Пока используем displayName и для name
        color: assignedColor
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Ошибка создания участника:', error);
      return NextResponse.json(
        { error: 'Ошибка создания участника' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: newParticipant.id,
      name: newParticipant.display_name,
      color: newParticipant.color,
      isNew: true
    });

  } catch (error) {
    console.error('💥 Критическая ошибка в find-or-create:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
