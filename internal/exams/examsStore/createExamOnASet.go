package examsStore

import (
	"context"
	"time"
)

func (s Store) CreateExamOnASet(
	user_id, set_id, title, description string, start_time time.Time, duration_in_minutes int,
) error {

	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return err
	}

	defer tx.Rollback(context.Background())

	_, err = tx.Exec(
		context.Background(),
		`INSERT INTO exams (user_id, set_id, title, description, start_time, duration)
	 VALUES ($1, $2, $3, $4, $5, make_interval(mins := $6))`,
		user_id, set_id, title, description, start_time, duration_in_minutes,
	)
	if err != nil {
		return err
	}

	err = tx.Commit(context.Background())
	if err != nil {
		return err
	}

	return nil
}
