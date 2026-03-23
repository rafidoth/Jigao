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

// GetSelfTestByID fetches a self-test record by its ID.
// Returns nil if not found or if the user doesn't own the self-test.
func (r *SelfTestRepository) GetSelfTestByID(ctx context.Context, selfTestID, userID string) (*model.SelfTest, error) {
	const query = `
		SELECT
			id,
			user_id,
			set_id,
			duration_in_minutes,
			time_taken_seconds,
			answers,
			correct_count,
			question_count,
			created_at
		FROM self_tests
		WHERE id = $1 AND user_id = $2
	`

	var selfTest model.SelfTest
	var answersJSON []byte

	err := r.s.DB.Pool.QueryRow(ctx, query, selfTestID, userID).Scan(
		&selfTest.ID,
		&selfTest.UserID,
		&selfTest.SetID,
		&selfTest.DurationInMinutes,
		&selfTest.TimeTakenSeconds,
		&answersJSON,
		&selfTest.CorrectCount,
		&selfTest.QuestionCount,
		&selfTest.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get self test by id: %w", err)
	}

	if err := json.Unmarshal(answersJSON, &selfTest.Answers); err != nil {
		return nil, fmt.Errorf("unmarshal self test answers: %w", err)
	}

	return &selfTest, nil
}

// GetSetTitle fetches the title of a set by its ID.
func (r *SelfTestRepository) GetSetTitle(ctx context.Context, setID string) (string, error) {
	const query = `SELECT title FROM sets WHERE id = $1`

	var title string
	err := r.s.DB.Pool.QueryRow(ctx, query, setID).Scan(&title)
	if err != nil {
		return "", fmt.Errorf("get set title: %w", err)
	}

	return title, nil
}

// GetRecentSelfTests fetches the most recent self-tests for a user.
func (r *SelfTestRepository) GetRecentSelfTests(ctx context.Context, userID string, limit int) ([]model.SelfTestListItem, error) {
	const query = `
		SELECT id, set_id, created_at
		FROM self_tests
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`

	rows, err := r.s.DB.Pool.Query(ctx, query, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("get recent self tests: %w", err)
	}
	defer rows.Close()

	var items []model.SelfTestListItem
	for rows.Next() {
		var item model.SelfTestListItem
		if err := rows.Scan(&item.SelfTestID, &item.SetID, &item.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan self test list item: %w", err)
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate self tests: %w", err)
	}

	return items, nil
}

// GetSelfTestsBySetID fetches the most recent self-tests for a user filtered by set ID.
func (r *SelfTestRepository) GetSelfTestsBySetID(ctx context.Context, userID, setID string, limit int) ([]model.SelfTestListItem, error) {
	const query = `
		SELECT id, set_id, created_at
		FROM self_tests
		WHERE user_id = $1 AND set_id = $2
		ORDER BY created_at DESC
		LIMIT $3
	`

	rows, err := r.s.DB.Pool.Query(ctx, query, userID, setID, limit)
	if err != nil {
		return nil, fmt.Errorf("get self tests by set id: %w", err)
	}
	defer rows.Close()

	var items []model.SelfTestListItem
	for rows.Next() {
		var item model.SelfTestListItem
		if err := rows.Scan(&item.SelfTestID, &item.SetID, &item.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan self test list item: %w", err)
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate self tests: %w", err)
	}

	return items, nil
}
