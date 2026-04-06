package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
)

func (r *ExamRepository) IsExamParticipant(examID, userID string) (bool, error) {
	var exists bool
	err := r.s.DB.Pool.QueryRow(
		context.Background(),
		`SELECT EXISTS(
			SELECT 1
			FROM exam_participants
			WHERE exam_id = $1 AND user_id = $2
		)`,
		examID,
		userID,
	).Scan(&exists)
	if err != nil {
		return false, err
	}

	return exists, nil
}

func (r *ExamRepository) GetExamParticipantRole(examID, userID string) (string, error) {
	var role string
	err := r.s.DB.Pool.QueryRow(
		context.Background(),
		`SELECT role
		 FROM exam_participants
		 WHERE exam_id = $1 AND user_id = $2`,
		examID,
		userID,
	).Scan(&role)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", fmt.Errorf("exam participant not found")
		}
		return "", err
	}

	return role, nil
}

func (r *ExamRepository) GetExamParticipantStatus(examID, userID string) (string, error) {
	var status string
	err := r.s.DB.Pool.QueryRow(
		context.Background(),
		`SELECT status 
		 FROM exam_participants
		 WHERE exam_id = $1 AND user_id = $2`,
		examID,
		userID,
	).Scan(&status)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "not_found", fmt.Errorf("exam participant not found")
		}
		return "", err
	}

	return status, nil
}

func (r *ExamRepository) UpsertExamParticipant(examID, userID, status, role string) error {
	_, err := r.s.DB.Pool.Exec(
		context.Background(),
		`INSERT INTO exam_participants (exam_id, user_id, status, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (exam_id, user_id)
         DO UPDATE SET
            status = EXCLUDED.status,
            role = EXCLUDED.role,
            updated_at = NOW()`,
		examID,
		userID,
		status,
		role,
	)

	return err
}
