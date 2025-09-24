CREATE TYPE visibility AS ENUM (
  'public',
  'private',
  'restricted'
);

CREATE TYPE difficulty AS ENUM (
  'easy',
  'medium',
  'hard'
);

CREATE TYPE question_type AS ENUM (
  'multiple_choice_questions',
  'fill_in_the_blanks',
  'short_question',
  'true_false'
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY
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
  position smallint NOT NULL,
  set_id UUID NOT NULL,
  FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE
);

CREATE TABLE answers (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  question_id UUID NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE TABLE choices (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  position smallint NOT NULL,
  choice TEXT NOT NULL,
  question_id UUID NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = current_timestamp;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sets_updated_at_trigger
BEFORE UPDATE ON sets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
