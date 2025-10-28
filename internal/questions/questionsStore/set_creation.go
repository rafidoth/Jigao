package questionsStore

import (
	"context"
	"fmt"

	"github.com/rafidoth/onlyexams/internal/questions/questionsModels"
)

func (s Store) CreateSetWithContext(qSet *questionsModels.Set, qSetContext string) error {
	tx, err := s.db.Begin(context.Background())
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(context.Background())

	insertSetSQL := `
		INSERT INTO sets (visibility, title, user_id)
		VALUES ($1, $2, $3)
		RETURNING id`
	var setID string
	if err := tx.QueryRow(
		context.Background(),
		insertSetSQL,
		qSet.Visibility,
		qSet.Title,
		qSet.UserId,
	).Scan(&setID); err != nil {
		return fmt.Errorf("insert set: %w", err)
	}

	insertCtxSQL := `
		INSERT INTO contexts(context, set_id)
		VALUES ($1, $2)`
	if _, err := tx.Exec(
		context.Background(),
		insertCtxSQL,
		qSetContext,
		setID,
	); err != nil {
		return fmt.Errorf("insert context: %w", err)
	}

	if err := tx.Commit(context.Background()); err != nil {
		return fmt.Errorf("commit tx: %w", err)
	}
	return nil
}
