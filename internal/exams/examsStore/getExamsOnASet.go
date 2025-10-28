package examsStore

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/rafidoth/onlyexams/internal/exams"
)

func (s Store) GetExamsBySetId(set_id string) ([]exams.Exam, error) {
	var results []exams.Exam

	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(context.Background())
	// TODO:  change the db scema for description to have a default value of ''
	// for now I am using COALESCE to handle null values -_-
	rows, err := tx.Query(
		context.Background(),
		`SELECT
			id,
			set_id,
			title,
			COALESCE(description, '') AS description,
			start_time,
			(EXTRACT(EPOCH FROM duration)/60)::int AS duration,
			(start_time + duration) AS end_time,
			created_at,
			updated_at
		 FROM exams
		 WHERE set_id = $1`,
		set_id,
	)
	if err != nil {
		return nil, err
	}

	examsSlice, err := pgx.CollectRows(rows, pgx.RowToStructByName[exams.Exam])
	if err != nil {
		return nil, err
	}
	results = examsSlice

	if err := tx.Commit(context.Background()); err != nil {
		return nil, err
	}

	return results, nil
}
