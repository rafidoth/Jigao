
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'untitled',
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    duration INTERVAL NOT NULL,
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


