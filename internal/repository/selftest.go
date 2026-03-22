package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/rafidoth/onlyexams/internal/model"
	"github.com/rafidoth/onlyexams/internal/server"
)

type SelfTestRepository struct {
	s *server.Server
}

func NewSelfTestRepository(s *server.Server) *SelfTestRepository {
	return &SelfTestRepository{s: s}
}

func (r *SelfTestRepository) CheckSetAccessOrExistence(ctx context.Context, setID, userID string) (bool, bool, error) {
	const query = `
		SELECT
			EXISTS(SELECT 1 FROM sets WHERE id = $1) AS set_exists,
			EXISTS(
				SELECT 1 FROM sets WHERE id = $1 AND user_id = $2
				UNION
				SELECT 1 FROM shared_set_users WHERE set_id = $1 AND user_id = $2
			) AS has_access
	`

	var setExists bool
	var hasAccess bool
	err := r.s.DB.Pool.QueryRow(ctx, query, setID, userID).Scan(&setExists, &hasAccess)
	if err != nil {
		return false, false, fmt.Errorf("check set access: %w", err)
	}

	return setExists, hasAccess, nil
}

func (r *SelfTestRepository) CreateSelfTestSubmission(ctx context.Context, record *model.SelfTestRecord) (string, time.Time, error) {
	answersJSON, err := json.Marshal(record.Answers)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("marshal self test answers: %w", err)
	}

	const query = `
		INSERT INTO self_tests (
			user_id,
			set_id,
			duration_in_minutes,
			time_taken_seconds,
			answers,
			correct_count,
			question_count
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at
	`

	var id string
	var createdAt time.Time
	err = r.s.DB.Pool.QueryRow(
		ctx,
		query,
		record.UserID,
		record.SetID,
		record.DurationInMinutes,
		record.TimeTakenSeconds,
		answersJSON,
		record.CorrectCount,
		record.QuestionCount,
	).Scan(&id, &createdAt)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("insert self test submission: %w", err)
	}

	return id, createdAt, nil
}
