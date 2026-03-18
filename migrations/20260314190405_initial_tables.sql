-- +goose Up
SELECT 'up SQL query';

CREATE TYPE exam_start_mode AS ENUM (
  'lobby',
  'timed'
);

CREATE TYPE exam_session_status AS ENUM (
  'waiting',
  'live',
  'finished'
);

CREATE TYPE participant_status AS ENUM (
  'joined',
  'ready',
  'taking_exam',
  'submitted',
  'disconnected',
  'terminated'
);

CREATE TYPE violation_type AS ENUM (
  'tab_switch',
  'focus_loss',
  'copy_paste',
  'right_click',
  'devtools',
  'resize',
  'camera_off'
);

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
  position  INTEGER NOT NULL,
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
    set_id UUID NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_mode exam_start_mode NOT NULL DEFAULT 'lobby',
    session_status exam_session_status NOT NULL DEFAULT 'waiting',
    invite_code TEXT UNIQUE,
    proctoring_enabled BOOLEAN NOT NULL DEFAULT true,
    camera_required BOOLEAN NOT NULL DEFAULT false,
    max_violations INTEGER,
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
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status participant_status NOT NULL DEFAULT 'joined',
    camera_active BOOLEAN NOT NULL DEFAULT false,
    violation_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (exam_id, user_id)
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

CREATE TABLE IF NOT EXISTS exam_violations (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    violation_type violation_type NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_answer_drafts (
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answers JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (exam_id, user_id)
);

CREATE TRIGGER exam_answer_drafts_updated_at_trigger
BEFORE UPDATE ON exam_answer_drafts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- +goose Down
-- Order matters: Drop tables with foreign keys first
DROP TABLE IF EXISTS exam_answer_drafts;
DROP TABLE IF EXISTS exam_violations;
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

DROP TYPE IF EXISTS violation_type;
DROP TYPE IF EXISTS participant_status;
DROP TYPE IF EXISTS exam_session_status;
DROP TYPE IF EXISTS exam_start_mode;
