package examsStore

import (
	"context"
	"fmt"
)

// RemoveExam deletes a single exam by its id.
// Returns an error if no rows were affected (not found) or on DB issues.
func (s Store) RemoveExam(examID string) error {
	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	ct, err := tx.Exec(
		context.Background(),
		"DELETE FROM exams WHERE id = $1",
		examID,
	)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("exam not found")
	}
	if err := tx.Commit(context.Background()); err != nil {
		return err
	}
	return nil
}
