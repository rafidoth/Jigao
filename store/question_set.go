package store

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5"
	"github.com/rafidoth/onlyexams/models"
)

func (s Store) CreateNewSet(qSet *models.Set) (*models.Set, error) {
	var set models.Set
	err := s.txDB(func(tx pgx.Tx) error {
		createNewSet := `
			INSERT INTO sets (visibility, title, user_id)
			VALUES ($1, $2, $3)
			RETURNING *`

		row, err := tx.Query(
			context.Background(),
			createNewSet,
			qSet.Visibility,
			qSet.Title,
			qSet.UserId,
		)

		set, err = pgx.CollectOneRow(row, pgx.RowToStructByName[models.Set])
		slog.Info("Created New Row in sets Table in DB ", "Created", set)

		if err != nil {
			return fmt.Errorf("failed to map row to struct: %w", err)
		}
		return err
	})
	if err != nil {
		return nil, err
	}
	return &set, err
}
