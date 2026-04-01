-- ══════════════════════════════════════════
-- جدول المحادثات — خدماتي
-- شغّل هذا في Supabase SQL Editor
-- ══════════════════════════════════════════

-- جدول المحادثات (conversation بين عميل ومقاول على طلب معين)
CREATE TABLE IF NOT EXISTS conversations (
  id           UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  request_id   UUID REFERENCES service_requests(id) ON DELETE CASCADE,
  client_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(request_id, client_id, contractor_id)
);

-- جدول الرسائل
CREATE TABLE IF NOT EXISTS messages (
  id              UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_request ON conversations(request_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contractor ON conversations(contractor_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = false;

-- RLS (Row Level Security) — كل مستخدم يرى محادثاته فقط
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY conv_select ON conversations
  FOR SELECT USING (auth.uid() = client_id OR auth.uid() = contractor_id);

CREATE POLICY conv_insert ON conversations
  FOR INSERT WITH CHECK (auth.uid() = client_id OR auth.uid() = contractor_id);

CREATE POLICY msg_select ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE client_id = auth.uid() OR contractor_id = auth.uid()
    )
  );

CREATE POLICY msg_insert ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations
      WHERE client_id = auth.uid() OR contractor_id = auth.uid()
    )
  );

CREATE POLICY msg_update ON messages
  FOR UPDATE USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE client_id = auth.uid() OR contractor_id = auth.uid()
    )
  );
