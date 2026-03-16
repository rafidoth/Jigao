-- +goose Up
SELECT 'up SQL query';

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sets (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  visibility visibility NOT NULL,
  title TEXT NOT NULL DEFAULT 'untitled',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contexts (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  context TEXT NOT NULL,
  set_id UUID NOT NULL,
  FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  difficulty difficulty NOT NULL,
  question_type question_type NOT NULL,
  question TEXT NOT NULL,
  set_id UUID NOT NULL,
  FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  answer JSONB NOT NULL,
  explanation TEXT NOT NULL,
  question_id UUID NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE TABLE IF NOT EXISTS choices (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  choice TEXT NOT NULL,
  question_id UUID NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- +goose StatementBegin
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = current_timestamp;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

CREATE TRIGGER sets_updated_at_trigger
BEFORE UPDATE ON sets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS shared_set_users (
    set_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (set_id, user_id),
    FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'untitled exam',
    visibility visibility NOT NULL DEFAULT 'private',
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    duration INTERVAL NOT NULL,
    set_id UUID NOT NULL,
    FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER exams_updated_at_trigger
BEFORE UPDATE ON exams
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS exam_participants (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER exam_participants_updated_at_trigger
BEFORE UPDATE ON exam_participants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS exam_submissions(
    exam_id UUID NOT NULL,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    score NUMERIC,
    answers JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (exam_id, user_id)
);

-- +goose Down
-- Order matters: Drop tables with foreign keys first
DROP TABLE IF EXISTS exam_submissions;
DROP TABLE IF EXISTS exam_participants;
DROP TABLE IF EXISTS exams;
DROP TABLE IF EXISTS shared_set_users;
DROP TABLE IF EXISTS choices;
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS contexts;
DROP TABLE IF EXISTS sets;
DROP TABLE IF EXISTS users;

-- Remove triggers and functions
DROP FUNCTION IF EXISTS update_updated_at CASCADE;
