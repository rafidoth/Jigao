package repository

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
)

func (r *ExamRepository) UpsertExamAnswerDrafts(examID, userID string, answers map[string]string) error {
	payload, err := json.Marshal(answers)
	if err != nil {
		return err
	}

	_, err = r.s.DB.Pool.Exec(
		context.Background(),
		`INSERT INTO exam_answer_drafts (exam_id, user_id, answers, updated_at)
		 VALUES ($1, $2, $3::jsonb, NOW())
		 ON CONFLICT (exam_id, user_id)
		 DO UPDATE SET
			answers = EXCLUDED.answers,
			updated_at = NOW()`,
		examID,
		userID,
		payload,
	)

	return err
}

func (r *ExamRepository) GetExamAnswerDraft(examID, userID string) (map[string]string, error) {
	var answersJSON []byte
	err := r.s.DB.Pool.QueryRow(
		context.Background(),
		`SELECT answers
		 FROM exam_answer_drafts
		 WHERE exam_id = $1 AND user_id = $2`,
		examID,
		userID,
	).Scan(&answersJSON)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// draft not found (not created yet)
			return map[string]string{}, nil
		}
		return nil, err
	}

	answers := make(map[string]string)
	if err := json.Unmarshal(answersJSON, &answers); err != nil {
		return nil, err
	}

	return answers, nil
}
