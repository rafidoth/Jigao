package examsStore

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/rafidoth/onlyexams/internal/exams/models"
)

func (s Store) GetExamByExamId(exam_id string) (models.Exam, error) {
	fmt.Println("Getting exam by exam id:", exam_id)
	var exam models.Exam

	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return exam, err
	}
	defer tx.Rollback(context.Background())

	rows, err := tx.Query(
		context.Background(),
		`SELECT
			id,
			set_id,
			user_id,
			visibility,
			description,
			title,
			start_time,
			(EXTRACT(EPOCH FROM duration)/60)::int AS duration,
			(start_time + duration) AS end_time,
			created_at,
			updated_at
		 FROM exams
		 WHERE id = $1`,
		exam_id,
	)
	if err != nil {
		return exam, err
	}

	examsSlice, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.Exam])
	if err != nil {
		return exam, err
	}
	if len(examsSlice) == 0 {
		return exam, fmt.Errorf("exam not found")
	}
	exam = examsSlice[0]

	if err := tx.Commit(context.Background()); err != nil {
		return exam, err
	}

	return exam, nil
}
