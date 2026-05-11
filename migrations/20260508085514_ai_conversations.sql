-- +goose Up
SELECT 'up SQL query';

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Chat',
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_last_message_at
ON conversations (user_id, last_message_at DESC);

CREATE TRIGGER conversations_updated_at_trigger
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- +goose Down
SELECT 'down SQL query';

DROP TRIGGER IF EXISTS conversations_updated_at_trigger ON conversations;
DROP INDEX IF EXISTS idx_conversations_user_last_message_at;
DROP TABLE IF EXISTS conversations;
