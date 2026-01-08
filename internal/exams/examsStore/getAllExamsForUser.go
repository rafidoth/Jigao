package examsStore

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/rafidoth/onlyexams/internal/exams/models"
)

func (s Store) GetExamsListByUserId(user_id string) ([]models.Exam, error) {
	var results []models.Exam

	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(context.Background())
	rows, err := tx.Query(
		context.Background(),
		`SELECT
			id,
			user_id,
			set_id,
			title,
			visibility,
			COALESCE(description, '') AS description,
			start_time,
			(EXTRACT(EPOCH FROM duration)/60)::int AS duration,
			(start_time + duration) AS end_time,
			created_at,
			updated_at
		 FROM exams
		 WHERE user_id= $1`,
		user_id,
	)
	if err != nil {
		return nil, err
	}

	examsSlice, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.Exam])
	if err != nil {
		return nil, err
	}
	results = examsSlice

	if err := tx.Commit(context.Background()); err != nil {
		return nil, err
	}

	return results, nil
}
