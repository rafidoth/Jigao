-- +goose Up
SELECT 'up SQL query';

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

-- +goose Down
SELECT 'down SQL query';

DROP TYPE IF EXISTS visibility;
DROP TYPE IF EXISTS difficulty;
DROP TYPE IF EXISTS question_type;
