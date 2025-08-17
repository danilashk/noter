-- Схема базы данных для Live Brainstorm MVP
-- Stage 2: Создание таблиц и настройка RLS

-- Включаем Row Level Security
DROP TABLE IF EXISTS participants;
DROP TABLE IF EXISTS cards;
DROP TABLE IF EXISTS sessions;

-- Таблица сессий (досок для мозгового штурма)
CREATE TABLE sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    title TEXT,
    description TEXT
);

-- Таблица карточек идей
CREATE TABLE cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    position_x INTEGER NOT NULL DEFAULT 0,
    position_y INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_ai_generated BOOLEAN DEFAULT false,
    parent_card_id UUID REFERENCES cards(id) ON DELETE SET NULL
);

-- Таблица участников
CREATE TABLE participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    cursor_color TEXT NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- Включение Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Политики доступа (для простоты - все могут читать и создавать)
-- В продакшене здесь будет авторизация через Auth

-- Политики для sessions
CREATE POLICY "Allow all to read sessions" ON sessions FOR SELECT USING (true);
CREATE POLICY "Allow all to insert sessions" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all to update sessions" ON sessions FOR UPDATE USING (true);

-- Политики для cards
CREATE POLICY "Allow all to read cards" ON cards FOR SELECT USING (true);
CREATE POLICY "Allow all to insert cards" ON cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all to update cards" ON cards FOR UPDATE USING (true);
CREATE POLICY "Allow all to delete cards" ON cards FOR DELETE USING (true);

-- Политики для participants
CREATE POLICY "Allow all to read participants" ON participants FOR SELECT USING (true);
CREATE POLICY "Allow all to insert participants" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all to update participants" ON participants FOR UPDATE USING (true);
CREATE POLICY "Allow all to delete participants" ON participants FOR DELETE USING (true);

-- Создание индексов для производительности
CREATE INDEX idx_cards_session_id ON cards(session_id);
CREATE INDEX idx_participants_session_id ON participants(session_id);
CREATE INDEX idx_cards_updated_at ON cards(updated_at);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функция для очистки неактивных участников
CREATE OR REPLACE FUNCTION cleanup_inactive_participants()
RETURNS void AS $$
BEGIN
    DELETE FROM participants 
    WHERE last_seen < now() - interval '1 hour';
END;
$$ language 'plpgsql';

-- Включение realtime подписок
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE cards;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;

-- Тестовые данные для разработки
INSERT INTO sessions (id, title, description) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Тестовая сессия', 'Демо сессия для тестирования функций');

INSERT INTO cards (session_id, content, position_x, position_y) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Первая идея', 100, 100),
    ('550e8400-e29b-41d4-a716-446655440000', 'Вторая идея', 300, 150),
    ('550e8400-e29b-41d4-a716-446655440000', 'AI улучшенная идея', 500, 200);

INSERT INTO participants (session_id, user_name, cursor_color) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Тестер 1', '#FF6B6B'),
    ('550e8400-e29b-41d4-a716-446655440000', 'Тестер 2', '#4ECDC4');