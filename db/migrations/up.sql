
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
  answer TEXT NOT NULL,
  choice_id UUID,
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



CREATE TABLE IF NOT EXISTS shared_set_users (
    set_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (set_id, user_id),
    FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- exams sqls
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


--
-- CREATE TABLE IF NOT EXISTS exam_answers (
--     exam_id UUID NOT NULL,
--     FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
--     user_id TEXT NOT NULL,
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
--     question_id UUID NOT NULL,
--     FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
--     answer TEXT NOT NULL,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
-- );




CREATE TABLE IF NOT EXISTS exam_submissions(
    exam_id UUID NOT NULL,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    score NUMERIC,  -- score is nullable -> grading not completed yet
    answers JSONB NOT NULL, -- store answers as JSONB
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- submission time
    PRIMARY KEY (exam_id, user_id)
);


