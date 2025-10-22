package examsStore

import (
	"context"
	"fmt"
)

func (s Store) IsExamExists(set_id string) error {
	// Check existence of an exam by id using SQL EXISTS
	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	var exists bool
	err = tx.QueryRow(
		context.Background(),
		"SELECT EXISTS(SELECT 1 FROM exams WHERE id = $1)",
		set_id,
	).Scan(&exists)

	if err != nil {
		return err
	}

	if !exists {
		return fmt.Errorf("exam not found")
	}

	if err := tx.Commit(context.Background()); err != nil {
		return err
	}

	return nil
}
